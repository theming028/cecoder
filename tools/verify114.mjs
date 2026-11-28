/* 第 114/115 轮验收：首页布局「恢复改进前」的守卫
   —— 第 113 轮那批布局实验（整组垂直居中、工具行压到卡下、环境行收进卡内、
      版本号脱流）全部撤回，回到第 112 轮那套：
      hero 锚在 panel 高的 18% → flex:1 的 .stage-spacer 撑开 → 工具行/两条展开栏在卡上 →
      输入卡（ci+82）→ 卡外 #F2F2F2 背板上的环境行 → 版本号在流里贴底。
   顺带守住：非布局修正（标签配色、焦点环、会话来源）仍在、会话页不受影响。 */
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

/* ---------- A 布局骨架：spacer 撑开，工具行在卡上，版本号随流贴底 ---------- */
const A = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height), l: Math.round(r.left), r: Math.round(r.right) }; };
  const stage = document.querySelector('.stage');
  const sp = document.querySelector('.stage-spacer');
  const cs = getComputedStyle(stage);
  return {
    stage: R('.stage'), hero: R('.hero'), toolbar: R('.toolbar'), composer: R('.composer'),
    card: R('.c-card'), plate: R('.c-plate'), foot: R('.c-foot'), ver: R('.version'), pm: R('#panelMain'),
    spacer: sp ? Math.round(sp.getBoundingClientRect().height) : -1,
    stageTop: cs.top, stageJustify: cs.justifyContent, stagePadB: cs.paddingBottom,
    verPos: getComputedStyle(document.querySelector('.version')).position
  };
});
ok('A1 .stage-spacer 恢复占位（撑开中部空白）', A.spacer > 100, String(A.spacer));
/* 第 118 轮：锚点从 22vh（被 clamp 夹死）改成 panel 高的 18% */
ok('A2 stage 顶部按比例锚定（panel 高的 18%）、hero 贴在 stage 顶', A.stage.t > 100 && Math.abs(A.hero.t - A.stage.t) <= 1, JSON.stringify([A.stage.t, A.hero.t]));
ok('A3 stage 不再用 safe center 居中整组', !/center/.test(A.stageJustify), A.stageJustify);
ok('A4 stage 无额外 padding-bottom（版本号不再脱流让位）', A.stagePadB === '0px', A.stagePadB);
ok('A5 工具行仍排在输入卡之上', A.toolbar.b <= A.card.t, JSON.stringify([A.toolbar.b, A.card.t]));
/* 第 121 轮：输入区顶部间距 12 → 8，这条跟着改 */
ok('A6 工具行与卡顶间距 8px', Math.abs(A.card.t - A.toolbar.b - 8) <= 2, JSON.stringify([A.toolbar.b, A.card.t]));
ok('A7 版本号回到 flex 流（position: static）', A.verPos === 'static', A.verPos);
ok('A8 版本号贴 stage 底（距底 ≤ 1px）', Math.abs(A.ver.b - A.stage.b) <= 1, JSON.stringify([A.ver.b, A.stage.b]));

/* ---------- B 两条展开栏：仍在卡之上，展开后把卡整体上推 ---------- */
await h.click('.chip[data-wb="通用"]');
await wait(480);
const B = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { toolbar: R('.toolbar'), wb: R('.wb-slot'), card: R('.c-card'), ver: R('.version') };
});
ok('B1 展开「选择子项」后子项栏在工具行与卡之间', B.wb.h >= 60 && B.wb.t >= B.toolbar.b - 1 && B.card.t >= B.wb.b - 1, JSON.stringify(B));
ok('B2 展开后卡整体上推（spacer 让位 30px+）', B.card.t < A.card.t - 30, JSON.stringify([A.card.t, B.card.t]));
ok('B3 展开后版本号仍贴底（流内跟随，没被挤出视口）', Math.abs(B.ver.b - A.ver.b) <= 1, JSON.stringify([A.ver.b, B.ver.b]));
await h.click('.chip[data-wb="通用"]');
await wait(360);

await h.click('.chip[data-quick="技术任务"]');
await wait(520);
const B2 = await h.evaluate(() => {
  const R = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  return { qf: R('.qf-slot'), card: R('.c-card'), ver: R('.version') };
});
ok('B4 推荐工序栏展开后在卡之上', B2.qf.h >= 80 && B2.card.t >= B2.qf.b - 1, JSON.stringify(B2));
ok('B5 工序栏展开后版本号仍贴底', Math.abs(B2.ver.b - A.ver.b) <= 1, JSON.stringify([A.ver.b, B2.ver.b]));
await h.click('.chip[data-quick="技术任务"]');
await wait(360);

/* ---------- C 环境行：卡外 + #F2F2F2 灰背板那版 ---------- */
const C = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const ci = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
  return {
    card: R('.c-card'), plate: R('.c-plate'), foot: R('.c-foot'), composer: R('.composer'), ci,
    plateBg: getComputedStyle(document.querySelector('.c-plate')).backgroundColor,
    cardBg: getComputedStyle(document.querySelector('.c-card')).backgroundColor
  };
});
ok('C1 卡高 = 输入高 + 82', C.card.h === Math.round(C.ci + 82), JSON.stringify([C.card.h, C.ci]));
ok('C2 环境行在卡下沿之外', C.foot.t >= C.card.b, JSON.stringify([C.card, C.foot]));
ok('C3 环境行整条坐在 #F2F2F2 灰背板上', C.plateBg === 'rgb(242, 242, 242)' && C.plate.t <= C.foot.t && C.plate.b >= C.foot.b, JSON.stringify([C.plate, C.foot, C.plateBg]));
ok('C4 卡片白底，灰底只露卡下那一条', C.cardBg === 'rgb(255, 255, 255)', C.cardBg);
ok('C5 环境行下沿离背板底 4~10px', C.plate.b - C.foot.b >= 4 && C.plate.b - C.foot.b <= 10, String(C.plate.b - C.foot.b));

/* 命中检测：环境行左端那一带没被白卡盖住 */
const C6 = await h.evaluate(() => {
  const f = document.querySelector('.c-foot').getBoundingClientRect();
  const el = document.elementFromPoint(f.left + 6, f.top + f.height / 2);
  return el ? el.tagName + '.' + el.className : null;
});
ok('C6 环境行左端命中的是 .c-foot 里的元素（未被卡盖住）', !!C6 && !/c-card/.test(C6), String(C6));

/* ---------- D 底部收尾：卡底与版本号的关系与改版前一致 ---------- */
const D = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
  return { composer: R('.composer'), ver: R('.version'), stage: R('.stage') };
});
ok('D1 版本号紧跟输入区（间距 8px，改版前同值）', Math.abs(D.ver.t - D.composer.b - 8) <= 2, JSON.stringify([D.composer.b, D.ver.t]));
ok('D2 输入区贴 stage 底收尾（spacer 把它压到底）', Math.abs(D.stage.b - D.composer.b) <= 34, JSON.stringify([D.composer.b, D.stage.b]));

/* ---------- E 不回归 ---------- */
const E = await h.evaluate(() => ({
  hx: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  stageScrollX: (() => { const st = document.querySelector('.stage'); return st.scrollWidth <= st.clientWidth + .5; })(),
  stageOverflowY: (() => { const st = document.querySelector('.stage'); return st.scrollHeight - st.clientHeight; })()
}));
ok('E1 无横向滚动', E.hx && E.stageScrollX, JSON.stringify(E));
ok('E2 stage 不产生纵向滚动（≤ 4px）', Math.abs(E.stageOverflowY) <= 4, String(E.stageOverflowY));
ok('E3 无控制台报错', errs.length === 0, errs.join(' | '));

/* ---------- F 窄窗 ---------- */
await h.setViewport({ width: 1180, height: 760 });
await wait(500);
const F = await h.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
  return { toolbar: R('.toolbar'), card: R('.c-card'), ver: R('.version'), stage: R('.stage'), pm: R('#panelMain') };
});
ok('F1 1180 下工具行换行后仍不压卡', F.card.t >= F.toolbar.b - 1, JSON.stringify([F.toolbar.b, F.card.t]));
ok('F2 1180 下版本号仍贴 stage 底', Math.abs(F.ver.b - F.stage.b) <= 1, JSON.stringify([F.ver.b, F.stage.b]));
ok('F3 1180 下 stage 不越出面板', F.stage.b <= F.pm.b + 1, JSON.stringify([F.stage.b, F.pm.b]));

/* ---------- G 会话页不受影响 ---------- */
const s2 = await b.newPage();
await s2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s2.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(700);
const G = await s2.evaluate(() => {
  const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
  const ci = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
  return { ci, card: R('.c-card'), verPos: getComputedStyle(document.querySelector('.version')).position };
});
ok('G1 会话页卡高 = 输入高 + 82', G.card.h === Math.round(G.ci + 82), JSON.stringify([G.card.h, G.ci]));
ok('G2 会话页版本号仍是流内元素', G.verPos !== 'absolute', G.verPos);
await s2.close();

await b.close();
console.log('\n' + (fail === 0 ? '全部通过' : '存在失败') + `  ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
