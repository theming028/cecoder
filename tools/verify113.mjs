import puppeteer from 'puppeteer-core';
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1'] });

const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);

/* ---------- A 整组垂直居中 ---------- */
const A = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, w: r.width, h: r.height }; };
  const stage = R('.stage'), hero = R('.hero'), ver = R('.version'), pm = R('#panelMain');
  const comp = R('.composer');
  const sp = document.querySelector('.stage-spacer');
  /* 第 114 轮：版本号脱流贴底后不再参与居中，居中组的下边界是 composer 底；
     stage 的 padding-bottom(24) 是给版本号预留的，判居中时要减掉 */
  const padB = parseFloat(getComputedStyle(document.querySelector('.stage')).paddingBottom) || 0;
  return {
    stageTop: Math.round(stage.t - pm.t),
    topGap: Math.round(hero.t - stage.t),
    botGap: Math.round(stage.b - padB - comp.b),
    spacer: sp ? sp.getBoundingClientRect().height : -1,
    overflow: stage.b > pm.b + 1 || stage.t < pm.t - 1
  };
});
ok('A1 stage 顶到 panel 顶（不再靠 22vh 压低）', Math.abs(A.stageTop) <= 1, String(A.stageTop));
ok('A2 整组在 stage 内垂直居中（上下留白差 ≤ 8，版本号已脱流）', Math.abs(A.topGap - A.botGap) <= 8, JSON.stringify([A.topGap, A.botGap]));
ok('A3 .stage-spacer 已不占位', A.spacer === 0, String(A.spacer));
ok('A4 stage 不越出 panel', !A.overflow, JSON.stringify(A));

/* ---------- B 工具行回到输入卡「之上」（第 114 轮回退） ---------- */
const B = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return {
    card: R('.c-card'), composer: R('.composer'), toolbar: R('.toolbar'), wb: R('.wb-slot'), qf: R('.qf-slot'),
    ver: R('.version'), stage: R('.stage'),
    verPos: getComputedStyle(document.querySelector('.version')).position
  };
});
ok('B1 工具行在输入卡之上', B.toolbar.b <= B.card.t, JSON.stringify([B.toolbar.b, B.card.t]));
ok('B2 工具行与卡顶留 12px', Math.abs(B.card.t - B.toolbar.b - 12) <= 2, JSON.stringify([B.toolbar.b, B.card.t]));
ok('B3 子项栏 / 工序栏排在工具行之下、卡之上', B.wb.t >= B.toolbar.b - 1 && B.qf.t >= B.toolbar.b - 1 && B.composer.t >= B.toolbar.b - 1, JSON.stringify([B.toolbar, B.wb, B.qf, B.composer]));
ok('B4 版本号脱流贴 stage 底（固定，不跟内容排序）', B.verPos === 'absolute' && Math.abs(B.ver.b - B.stage.b) <= 1, JSON.stringify([B.verPos, B.ver.b, B.stage.b]));

/* 子项栏 / 推荐工序栏展开后仍夹在工具行与卡之间，不压卡 */
await h.click('.chip[data-wb="通用"]');
await wait(480);
const B2 = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { card: R('.c-card'), toolbar: R('.toolbar'), wb: R('.wb-slot'), ver: R('.version') };
});
ok('B5 展开「选择子项」后子项栏夹在工具行与卡之间', B2.wb.h >= 60 && B2.wb.t >= B2.toolbar.b - 1 && B2.card.t >= B2.wb.b - 1, JSON.stringify(B2));
ok('B6 展开后版本号位置不动（仍贴 stage 底）', B2.ver.t === B.ver.t, JSON.stringify([B.ver.t, B2.ver.t]));
await h.click('.chip[data-wb="通用"]');
await wait(360);

/* ---------- C 环境行回到卡外 #F2F2F2 背板（第 114 轮回退） ---------- */
const C = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const card = document.querySelector('.c-card');
  const ci = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
  return {
    card: R('.c-card'), foot: R('.c-foot'), plate: R('.c-plate'), ci,
    plateBg: getComputedStyle(document.querySelector('.c-plate')).backgroundColor
  };
});
ok('C1 卡高回到 输入高 + 82', C.card.h === Math.round(C.ci + 82), JSON.stringify([C.card.h, C.ci]));
ok('C2 环境行回到卡外（在卡下沿之下）', C.foot.t >= C.card.b, JSON.stringify([C.card, C.foot]));
ok('C3 环境行坐在 #F2F2F2 灰背板上', C.plateBg === 'rgb(242, 242, 242)' && C.plate.t <= C.foot.t && C.plate.b >= C.foot.b, JSON.stringify([C.plate, C.foot, C.plateBg]));
ok('C4 环境行下沿离背板底 4~10px', C.plate.b - C.foot.b >= 4 && C.plate.b - C.foot.b <= 10, String(C.plate.b - C.foot.b));

/* ---------- D 分组标签与分隔线 ---------- */
const D = await h.evaluate(() => {
  const l1 = getComputedStyle(document.querySelector('.tb-label'));
  const l2 = getComputedStyle(document.querySelector('.tb-label-2'));
  const dv = getComputedStyle(document.querySelector('.tb-div'));
  const lum = c => {
    const m = c.match(/[\d.]+/g).map(Number);
    const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]);
  };
  const bg = getComputedStyle(document.getElementById('panelMain')).backgroundColor;
  const ratio = (lum(l1.color) + .05) / (lum(bg) + .05);
  const ratio2 = (lum(bg) + .05) / (lum(l1.color) + .05);
  return { c1: l1.color, c2: l2.color, op2: l2.opacity, div: dv.backgroundColor, divW: dv.width, ratio: Math.max(ratio, ratio2) };
});
ok('D1 两个分组标签都是深色（不再是白字）', !/rgba?\(255,\s*255,\s*255/.test(D.c1) && !/rgba?\(255,\s*255,\s*255/.test(D.c2), JSON.stringify([D.c1, D.c2]));
ok('D2 标签与面板底对比度 ≥ 4:1（可读）', D.ratio >= 4, D.ratio.toFixed(2) + ' ' + D.c1);
ok('D3 分隔线可见（深色 14%，1px）', /rgba\(31, 31, 31, 0\.14\)/.test(D.div) && D.divW === '1px', JSON.stringify([D.div, D.divW]));

/* ---------- E chip 键盘焦点环 ---------- */
/* file:// 下读不到外部样式表的 cssRules（opaque origin），只能真键盘走一遍 */
await h.evaluate(() => { if (document.activeElement) document.activeElement.blur(); document.body.focus(); });
let hit = null;
for (let i = 0; i < 40; i++) {
  await h.keyboard.press('Tab');
  const st = await h.evaluate(() => {
    const el = document.activeElement;
    if (!el || !el.classList || !el.classList.contains('chip')) return null;
    const cs = getComputedStyle(el);
    return { ow: cs.outlineWidth, os: cs.outlineStyle, oc: cs.outlineColor, off: cs.outlineOffset, vis: el.matches(':focus-visible') };
  });
  if (st) { hit = st; break; }
}
ok('E1 Tab 能走到 chip 并被 :focus-visible 命中', !!hit && hit.vis, JSON.stringify(hit));
ok('E2 焦点环 = 2px 主色实线 + 外扩 2px', !!hit && hit.ow === '2px' && hit.os === 'solid' && /55, 112, 247/.test(hit.oc) && hit.off === '2px', JSON.stringify(hit));

/* ---------- F 悬浮球不再压输入卡 ---------- */
const F = await h.evaluate(() => {
  const f = document.querySelector('.float').getBoundingClientRect();
  const c = document.querySelector('.c-card').getBoundingClientRect();
  const gap = f.left - c.right;
  return { gap: Math.round(gap), f: [Math.round(f.left), Math.round(f.right)], c: [Math.round(c.left), Math.round(c.right)] };
});
ok('F1 悬浮球整体在输入卡右侧之外（留 ≥ 4px）', F.gap >= 4, JSON.stringify(F));

/* ---------- G 左栏「会话来源」小节 ---------- */
const G = await h.evaluate(() => {
  const sec = document.querySelector('.wd-sec');
  if (!sec) return null;
  const t = document.querySelector('.wd-sec-t');
  const cs = getComputedStyle(t);
  return { txt: t.textContent.trim(), size: cs.fontSize, color: cs.color, h: Math.round(sec.getBoundingClientRect().height) };
});
ok('G1 左栏有「会话来源」小节标题', G && G.txt === '会话来源', JSON.stringify(G));
ok('G2 标题弱于分组名（12px + tertiary）', G.size === '12px', JSON.stringify(G));

/* ---------- H 不回归 ---------- */
const H = await h.evaluate(() => ({
  hx: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  stageScroll: (() => { const st = document.querySelector('.stage'); return st.scrollWidth <= st.clientWidth + .5; })()
}));
ok('H1 无横向滚动', H.hx && H.stageScroll, JSON.stringify(H));
ok('H2 无控制台报错', errs.length === 0, errs.join(' | '));

/* 窄窗：内容列收窄时工具行换两行也不压卡 */
await h.setViewport({ width: 1180, height: 760 });
await wait(500);
const I = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { card: R('.c-card'), toolbar: R('.toolbar'), ver: R('.version'), stage: R('.stage'), pm: R('#panelMain') };
});
ok('I1 1180 下工具行换行后仍不压卡', I.card.t >= I.toolbar.b - 1, JSON.stringify([I.toolbar.b, I.card.t]));
ok('I2 1180 下版本号仍贴 stage 底', Math.abs(I.ver.b - I.stage.b) <= 1, JSON.stringify([I.ver.b, I.stage.b]));
ok('I3 1180 下仍不越出面板', I.stage.b <= I.pm.b + 1, JSON.stringify([I.stage.b, I.pm.b]));

await b.close();
console.log('\n' + (fail === 0 ? '全部通过' : '存在失败') + `  ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
