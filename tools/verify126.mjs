/* 第 126 轮验收：「页面层级和状态」整栏的收齐 / 展开
   参照左侧任务栏（.ws-drawer：width 0 ↔ 320、.26s cubic-bezier(.2,.8,.2,1)）——
   原来这里是「一步跳到 absolute 的 32×32 浮键」，中间没有任何过渡。
   现在：宽度 240 ↔ 32 走 .26s 同一条曲线，标题/内容 .16s 淡出，底色与阴影 .22s 同步；
         展开方向额外补一段 width/flex-basis 关键帧（absolute→relative 时 transition 抓不到）。
   折叠终态仍是稿面的 32×32 白底浮键，位置、尺寸、aria 都不变。 */
import puppeteer from 'puppeteer-core';

const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1', '--enable-unsafe-swiftshader'] });
const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(1200);

const read = () => h.evaluate(() => {
  const el = document.getElementById('udPages');
  const cv = document.getElementById('udCanvas');
  const body = el.querySelector('.ud-pages-body');
  const t = el.querySelector('.ud-pages-t');
  const r = el.getBoundingClientRect();
  const bcs = getComputedStyle(body), s = getComputedStyle(el);
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    x: Math.round(r.x), pos: s.position,
    gap: Math.round(r.x - document.getElementById('udCanvas').getBoundingClientRect().x),
    top: Math.round(r.y - document.getElementById('udCanvas').getBoundingClientRect().y),
    tr: s.transition,
    canvasW: Math.round(cv.getBoundingClientRect().width),
    bodyOp: bcs.opacity, bodyVis: bcs.visibility,
    titleOp: getComputedStyle(t).opacity,
    exp: document.getElementById('udFold').getAttribute('aria-expanded'),
    tip: document.getElementById('udFold').getAttribute('data-tip'),
    inlineW: el.style.width, inlineBasis: el.style.flexBasis
  };
});

/* ---------- A 展开态 ---------- */
const A = await read();
ok('A1 展开态 240 宽、在流内（relative）', A.w === 240 && A.pos === 'relative', JSON.stringify([A.w, A.pos]));
/* 第 128 轮：为消除「塌下去」的闪动，曲线换成两头慢的 .4/0/.2、时长 .28s */
ok('A2 宽度过渡 = .28s cubic-bezier(.4,0,.2,1)',
  /width 0\.28s cubic-bezier\(0\.4, 0, 0\.2, 1\)/.test(A.tr), A.tr.slice(0, 90));
ok('A3 flex-basis / height 也参与过渡', /flex-basis 0\.28s/.test(A.tr) && /height 0\.32s/.test(A.tr), A.tr.slice(0, 160));
ok('A4 展开态内容不透明、可见', A.bodyOp === '1' && A.bodyVis === 'visible', JSON.stringify([A.bodyOp, A.bodyVis]));

/* ---------- B 收起：中间帧必须在动 ---------- */
await h.click('#udFold');
await wait(80);
const B1 = await read();
ok('B1 收起过程中宽度在收缩（32 < w < 240）', B1.w > 32 && B1.w < 240, String(B1.w));
ok('B2 收起过程中标题在淡出（0 < op < 1）', B1.titleOp > 0 && B1.titleOp < 1, String(B1.titleOp));
await wait(450);
const B2 = await read();
ok('B3 收起终态：32×32 浮键（第 128 轮改为流内 relative）', B2.w === 32 && B2.h === 32 && B2.pos === 'relative', JSON.stringify([B2.w, B2.h, B2.pos]));
ok('B4 收起终态：内容 opacity 0 + visibility hidden（不再靠 display:none 硬切）', B2.bodyOp === '0' && B2.bodyVis === 'hidden', JSON.stringify([B2.bodyOp, B2.bodyVis]));
/* 第 128 轮：折叠态改为流内 32 宽，位置靠 margin 12 贴画布左上 */
ok('B5 收起后贴画布左上 12px', B2.gap === 12 && B2.top === 12, JSON.stringify([B2.gap, B2.top]));
ok('B6 aria / 提示同步成「展开」', B2.exp === 'false' && B2.tip === '展开', JSON.stringify([B2.exp, B2.tip]));

/* ---------- C 展开：方向也要有过渡 ---------- */
await h.click('#udFold');
await wait(80);
const C1 = await read();
ok('C1 展开过程中宽度在长（32 < w < 240）', C1.w > 32 && C1.w < 240, String(C1.w));
ok('C2 展开过渡由内联 32px 松手驱动（松手后不能留内联宽度）', C1.inlineW === '' && C1.inlineBasis === '', JSON.stringify([C1.inlineW, C1.inlineBasis]));
await wait(500);
const C2 = await read();
ok('C3 展开终态回到 240 / relative，内联样式已清空', C2.w === 240 && C2.pos === 'relative' && C2.inlineW === '' && C2.inlineBasis === '', JSON.stringify([C2.w, C2.pos, C2.inlineW, C2.inlineBasis]));
ok('C4 展开终态内容恢复不透明', C2.bodyOp === '1' && C2.bodyVis === 'visible', JSON.stringify([C2.bodyOp, C2.bodyVis]));
ok('C5 画布回到展开时的宽度（让位关系可逆）', C2.canvasW === A.canvasW, JSON.stringify([A.canvasW, C2.canvasW]));

/* ---------- D 连续点击不卡死 ---------- */
await h.click('#udFold');
await wait(60);
await h.click('#udFold');
await wait(60);
await h.click('#udFold');
await wait(600);
const D = await read();
ok('D1 快速连点三次后状态自洽（要么全展开要么全收起，不留半截）',
  (D.w === 32 && D.bodyOp === '0' && D.top === 12) || (D.w === 240 && D.bodyOp === '1' && D.gap === 0),
  JSON.stringify([D.w, D.pos, D.bodyOp, D.gap, D.top]));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
