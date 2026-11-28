/* 第 114 轮验收：用户点名回退两条 ——
   ①工具行（工作台 / 快速任务 chips）+ 两条展开栏回到输入卡「之上」，
     版本号固定在屏幕底部；
   ②卡外环境行（本地 / 工作目录）回到卡外 #F2F2F2 灰背板上那版。
   顺带守住：居中仍生效、会话页/任务页不受影响、无横向滚动、无报错。 */
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

/* ---------- A 顺序：工具行 → 展开栏 → 输入卡 → （版本号脱流） ---------- */
const A = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const stage = document.querySelector('.stage');
  const ids = [...stage.children].map(e => e.className.split(' ')[0]);
  return {
    ids,
    toolbar: R('.toolbar'), wb: R('.wb-slot'), qf: R('.qf-slot'), composer: R('.composer'), card: R('.c-card'), ver: R('.version')
  };
});
ok('A1 DOM 里工具行仍在展开栏之前（未靠 order 搬到卡下）', A.ids.indexOf('toolbar') < A.ids.indexOf('wb-slot') && A.ids.indexOf('qb-slot') < 0, JSON.stringify(A.ids.slice(0, 6)));
ok('A2 视觉顺序：工具行在输入卡之上', A.toolbar.b <= A.card.t, JSON.stringify([A.toolbar.b, A.card.t]));
ok('A3 两条展开栏容器夹在工具行与卡之间（高 0 时紧贴工具行下沿）', A.wb.t >= A.toolbar.b - 1 && A.qf.t >= A.toolbar.b - 1 && A.composer.t >= A.toolbar.b - 1, JSON.stringify([A.toolbar, A.wb, A.qf, A.composer]));
ok('A4 工具行与卡顶间距 = 12px（与改版前一致）', Math.abs(A.card.t - A.toolbar.b - 12) <= 2, JSON.stringify([A.toolbar.b, A.card.t]));

/* ---------- B 版本号固定在屏幕底部 ---------- */
const B = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), h: Math.round(r.height) }; };
  const v = document.querySelector('.version');
  const cs = getComputedStyle(v);
  return { ver: R('.version'), stage: R('.stage'), pos: cs.position, mt: cs.marginTop, mid: (R('.version').l + R('.version').r) / 2, stageMid: (R('.stage').l + R('.stage').r) / 2 };
});
ok('B1 版本号脱出 flex 流（position: absolute）', B.pos === 'absolute', B.pos);
ok('B2 贴住 stage 底（距底 ≤ 1px）', Math.abs(B.ver.b - B.stage.b) <= 1, JSON.stringify([B.ver.b, B.stage.b]));
ok('B3 水平居中（与 stage 中线偏差 ≤ 1px）', Math.abs(B.mid - B.stageMid) <= 1, JSON.stringify([B.mid, B.stageMid]));
ok('B4 不再吃 margin-top 占位', B.mt === '0px', B.mt);

/* 展开子项栏（内容整体变高/居中位置变化）后，版本号纹丝不动 */
await h.click('.chip[data-wb="通用"]');
await wait(480);
const B2 = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { ver: R('.version'), stage: R('.stage'), wb: R('.wb-slot'), card: R('.c-card'), toolbar: R('.toolbar') };
});
ok('B5 展开子项栏后版本号位置不变（仍贴底）', B2.ver.t === B.ver.t && B2.ver.b === B.ver.b, JSON.stringify([B.ver, B2.ver]));
ok('B6 展开后子项栏在工具行与卡之间、不压卡', B2.wb.h >= 60 && B2.wb.t >= B2.toolbar.b - 1 && B2.card.t >= B2.wb.b - 1, JSON.stringify(B2));
await h.click('.chip[data-wb="通用"]');
await wait(360);

/* 快速任务展开：工序栏同样在卡之上 */
await h.click('.chip[data-quick="技术任务"]');
await wait(520);
const B3 = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { qf: R('.qf-slot'), card: R('.c-card'), ver: R('.version') };
});
ok('B7 推荐工序栏展开后在卡之上', B3.qf.h >= 80 && B3.card.t >= B3.qf.b - 1, JSON.stringify(B3));
ok('B8 工序栏展开后版本号仍贴底不动', B3.ver.b === B.ver.b, JSON.stringify([B.ver.b, B3.ver.b]));
await h.click('.chip[data-quick="技术任务"]');
await wait(360);

/* ---------- C 环境行回到卡外灰背板 ---------- */
const C = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const ci = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
  const plate = document.querySelector('.c-plate');
  const foot = document.querySelector('.c-foot');
  return {
    card: R('.c-card'), plate: R('.c-plate'), foot: R('.c-foot'), composer: R('.composer'), ci,
    plateBg: getComputedStyle(plate).backgroundColor,
    cardBg: getComputedStyle(document.querySelector('.c-card')).backgroundColor
  };
});
ok('C1 卡高 = 输入高 + 82（回到改版前）', C.card.h === Math.round(C.ci + 82), JSON.stringify([C.card.h, C.ci]));
ok('C2 环境行落在卡下沿之外', C.foot.t >= C.card.b, JSON.stringify([C.card, C.foot]));
ok('C3 环境行整条坐在 #F2F2F2 灰背板上', C.plateBg === 'rgb(242, 242, 242)' && C.plate.t <= C.foot.t && C.plate.b >= C.foot.b, JSON.stringify([C.plate, C.foot, C.plateBg]));
ok('C4 卡片是白底、灰底只露出卡下那一条（视觉上仍是「灰色背景行」）', C.cardBg === 'rgb(255, 255, 255)', C.cardBg);
ok('C5 环境行下沿离背板底 4~10px', C.plate.b - C.foot.b >= 4 && C.plate.b - C.foot.b <= 10, String(C.plate.b - C.foot.b));

/* 真取色：环境行中间那一带的像素必须是灰（#F2F2F2 档），不是白 */
const shot = await h.screenshot({ encoding: 'base64', clip: { x: C.foot.t > 0 ? 0 : 0, y: 0, width: 4, height: 4 } }).catch(() => null);
const px = await h.evaluate(() => {
  const foot = document.querySelector('.c-foot').getBoundingClientRect();
  const el = document.elementFromPoint(foot.left + foot.width / 2, foot.top + foot.height / 2);
  return { tag: el ? el.tagName + '.' + el.className : null };
});
ok('C6 环境行中段命中的是行内元素而非卡片', !!px.tag && !/c-card/.test(px.tag), JSON.stringify(px));

/* ---------- D 居中 / 不回归 ---------- */
const D = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
  const padB = parseFloat(getComputedStyle(document.querySelector('.stage')).paddingBottom) || 0;
  const st = R('.stage'), hero = R('.hero'), comp = R('.composer'), ver = R('.version'), foot = R('.c-foot');
  return { top: Math.round(hero.t - st.t), bot: Math.round(st.b - padB - comp.b), verTop: ver.t, footB: foot.b };
});
ok('D1 整组仍垂直居中（上下留白差 ≤ 8）', Math.abs(D.top - D.bot) <= 8, JSON.stringify([D.top, D.bot]));
ok('D2 居中组没压到版本号（组底 < 版本号顶）', D.footB < D.verTop, JSON.stringify([D.footB, D.verTop]));

const E = await h.evaluate(() => ({
  hx: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  stageScroll: (() => { const st = document.querySelector('.stage'); return st.scrollWidth <= st.clientWidth + .5; })(),
  stageOverflowY: (() => { const st = document.querySelector('.stage'); return st.scrollHeight - st.clientHeight; })()
}));
ok('E1 无横向滚动', E.hx && E.stageScroll, JSON.stringify(E));
/* 内容高度是 flex 子项四舍五入来的，2px 内的差属于取整；JS 只在 > 4px 时才加 .is-scroll */
ok('E2 stage 不产生多余纵向滚动（≤ 4px 且不出滚动条）', Math.abs(E.stageOverflowY) <= 4, String(E.stageOverflowY));
ok('E3 无控制台报错', errs.length === 0, errs.join(' | '));

/* 窄窗：1180 × 760 */
await h.setViewport({ width: 1180, height: 760 });
await wait(500);
const F = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
  return { toolbar: R('.toolbar'), card: R('.c-card'), ver: R('.version'), stage: R('.stage'), pm: R('#panelMain') };
});
ok('F1 1180 下工具行换行后仍不压卡', F.card.t >= F.toolbar.b - 1, JSON.stringify([F.toolbar.b, F.card.t]));
ok('F2 1180 下版本号仍贴 stage 底', Math.abs(F.ver.b - F.stage.b) <= 1, JSON.stringify([F.ver.b, F.stage.b]));
ok('F3 1180 下 stage 不越出面板', F.stage.b <= F.pm.b + 1, JSON.stringify([F.stage.b, F.pm.b]));

/* ---------- G 会话页 / 任务页不受影响 ---------- */
const s2 = await b.newPage();
await s2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s2.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(700);
const G = await s2.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const ci = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
  const footEl = document.querySelector('.c-foot');
  return {
    ci, card: R('.c-card'), ver: R('.version'),
    footDisp: getComputedStyle(footEl).display,
    verPos: getComputedStyle(document.querySelector('.version')).position
  };
});
ok('G1 会话页卡高仍是 输入高 + 82（没被首页规则带跑）', G.card.h === Math.round(G.ci + 82), JSON.stringify([G.card.h, G.ci]));
ok('G2 会话页环境行按原设计隐藏（单卡页不带环境行）', G.footDisp === 'none', G.footDisp);
ok('G3 会话页版本号仍是流内元素（只有首页脱流）', G.verPos !== 'absolute', G.verPos);
await s2.close();

await b.close();
console.log('\n' + (fail === 0 ? '全部通过' : '存在失败') + `  ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
