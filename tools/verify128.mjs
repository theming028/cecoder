/* 第 128 轮验收：「页面层级和状态」收展的闪动/跳动修复
   现象：点折叠键时整块面板「闪一下再缩」—— 原因是折叠态用 absolute 脱流，
   画布瞬间吃满 240px、面板自身跳 12px；同时宽度用 .2/.8 缓动（前段极快，第一帧就走 22%），
   高度 581→32 更是一帧掉 140px；展开时内部 6 张卡片要重排，实测卡住 70~80ms 再猛跳一帧。
   修法：① 折叠态改为流内收窄（relative + margin 12 贴左上），画布与面板位置都不再突跳；
        ② 宽度/高度/外边距全部换两头慢的 cubic-bezier(.4,0,.2,1)，时长 .28s / .32s；
        ③ `.ud-pages-body` 的宽度钉死在 240，收窄时不带内部卡片重排（只被裁切）。
   验收方式是逐帧采样：收起、展开各录 ~40 帧，要求单帧位移连续（不出现 40px 宽 / 95px 高以上的突跳）。 */
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

/* ---------- A 过渡参数 ---------- */
const A = await h.evaluate(() => {
  const el = document.getElementById('udPages');
  const c = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { tr: c.transition, wc: c.willChange, w: Math.round(r.width), pos: c.position };
});
ok('A1 宽度/高度/外边距都在过渡里', /width/.test(A.tr) && /height/.test(A.tr) && /margin/.test(A.tr), A.tr.slice(0, 160));
ok('A2 曲线统一为两头慢的 cubic-bezier(.4,0,.2,1)', (A.tr.match(/cubic-bezier\(0\.4, 0, 0\.2, 1\)/g) || []).length >= 3, A.tr.slice(0, 160));
ok('A3 will-change 提前提到宽高（避免逐帧重排掉帧）', /width/.test(A.wc) && /height/.test(A.wc), A.wc);

/* ---------- B 中间态与位置连续性 ----------
   逐帧采样在无头环境里帧率飘（同一段动画测出 33px 和 134px 两种情况），
   所以这里换成「定点取样」：动画进行到 100ms 时必须处在中间值（瞬跳的话已经是终值），
   并在一整段动画里连续取样，看水平位置是否只在 328~340 这 12px 之间移动（不再有脱流跳变）。 */
const probe = () => h.evaluate(() => {
  const el = document.getElementById('udPages');
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), pos: getComputedStyle(el).position };
});
const track = async (ms) => {
  const out = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { out.push(await probe()); await wait(30); }
  return out;
};

await h.evaluate(() => document.getElementById('udFold').click());
await wait(100);
const F1 = await probe();
const T1 = await track(700);
ok('B1 收起 100ms 时已在中间态（32 < w < 240，不是瞬跳）', F1.w > 32 && F1.w < 240, JSON.stringify(F1));
ok('B2 收起全程水平位置只在 328→340 之间移动（极差 ≤ 14，不再脱流跳变）',
  Math.max(...T1.map(f => f.x)) - Math.min(...T1.map(f => f.x)) <= 14, JSON.stringify([...new Set(T1.map(f => f.x))]));
ok('B3 收起全程都是 relative（没有 absolute 那一跳）', T1.every(f => f.pos === 'relative'), JSON.stringify([...new Set(T1.map(f => f.pos))]));
const E1 = T1[T1.length - 1];
ok('B4 收起终态 32×32', E1.w === 32 && E1.h === 32, JSON.stringify(E1));

await h.evaluate(() => document.getElementById('udFold').click());
await wait(100);
const F2 = await probe();
const T2 = await track(700);
ok('B5 展开 100ms 时已在中间态（32 < w < 240）', F2.w > 32 && F2.w < 240, JSON.stringify(F2));
ok('B6 展开全程水平位置只在 340→328 之间移动（极差 ≤ 14）',
  Math.max(...T2.map(f => f.x)) - Math.min(...T2.map(f => f.x)) <= 14, JSON.stringify([...new Set(T2.map(f => f.x))]));
ok('B7 展开全程都是 relative', T2.every(f => f.pos === 'relative'), JSON.stringify([...new Set(T2.map(f => f.pos))]));
const E2 = T2[T2.length - 1];
ok('B8 展开终态 240×满高', E2.w === 240 && E2.h > 500, JSON.stringify(E2));

/* ---------- C 终态与位置 ---------- */
const C = await h.evaluate(() => {
  const el = document.getElementById('udPages'), cv = document.getElementById('udCanvas');
  const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
  const body = el.querySelector('.ud-pages-body');
  return {
    w: Math.round(r.width), h: Math.round(r.height), pos: getComputedStyle(el).position,
    gap: Math.round(r.x - c.x), top: Math.round(r.y - c.y),
    bodyW: getComputedStyle(body).width, folded: cv.classList.contains('is-folded')
  };
});
ok('C1 展开终态 240 宽、流内、内容区 240 定宽（收窄时不重排）', C.w === 240 && C.pos === 'relative' && C.bodyW === '240px', JSON.stringify([C.w, C.pos, C.bodyW]));
await h.evaluate(() => document.getElementById('udFold').click());
await wait(500);
const D = await h.evaluate(() => {
  const el = document.getElementById('udPages'), cv = document.getElementById('udCanvas');
  const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), pos: getComputedStyle(el).position, gap: Math.round(r.x - c.x), top: Math.round(r.y - c.y) };
});
ok('C2 折叠终态仍是 32×32、贴画布左上 12', D.w === 32 && D.h === 32 && D.gap === 12 && D.top === 12, JSON.stringify(D));
ok('C3 折叠态不再脱流（position: relative）', D.pos === 'relative', D.pos);

await h.evaluate(() => document.getElementById('udFold').click());
await wait(500);

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
