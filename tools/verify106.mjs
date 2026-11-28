/* 第 106 轮验收：
   ① 位置批注 / 区域批注浮窗不再那么透（白 90% → 96%），毛玻璃保留
   ② 「编辑 UI 元素」面板是纯浮层：悬浮于 html 画布之上、不占空间
      （stage 不再右内距、左列不再临时折叠、画板尺寸不因面板打开而变化）
   ③ 「自定义分辨率」点了真的切换：触发器文案回填 + 画板宽高与分辨率同步联动，
      窄画板里生成的页面按 is-w-sm / is-w-xs 重排
   ④ 版本 / 自定义分辨率 / 缩放 三个控件的激活态 = 1.6px 主题蓝粗描边（全局统一） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1600, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);

const geo = () => p.evaluate(() => {
  const B = document.getElementById('udBoard'), W = document.getElementById('udBoardWrap');
  const f = o => [Math.round(o.left), Math.round(o.top), Math.round(o.width), Math.round(o.height)];
  const cs = getComputedStyle(B);
  return {
    board: f(B.getBoundingClientRect()), wrap: f(W.getBoundingClientRect()),
    w: cs.width, h: cs.height, cls: B.className,
    stagePR: getComputedStyle(document.getElementById('udStage')).paddingRight,
    s: getComputedStyle(W).getPropertyValue('--ud-s').trim(),
    zoom: document.getElementById('udZoomVal').textContent,
    folded: document.getElementById('udCanvas').className
  };
});

/* ============================================================
   ② 编辑面板：纯浮层
   ============================================================ */
const G0 = await geo();
await p.click('#udEdit'); await wait(400);
const G1 = await geo();
const E1 = await p.evaluate(() => {
  const ep = document.getElementById('udEp'), cv = document.getElementById('udCanvas');
  const ecs = getComputedStyle(ep), ccs = getComputedStyle(cv);
  const r = ep.getBoundingClientRect(), c = cv.getBoundingClientRect();
  return {
    hidden: ep.hidden, z: ecs.zIndex, pos: ecs.position,
    rightGap: Math.round(Math.abs(r.right - c.right)), left: Math.round(r.left), canvasRight: Math.round(c.right),
    cvPos: ccs.position
  };
});
ok('A1 面板打开且是 absolute 浮层（z-index 6）', !E1.hidden && E1.pos === 'absolute' && E1.z === '6', JSON.stringify(E1));
ok('A2 不占空间①：stage 右内距仍是 24px', G1.stagePR === '24px' && G1.stagePR === G0.stagePR, G1.stagePR + ' / ' + G0.stagePR);
ok('A3 不占空间②：左列不再被临时折叠', !/is-folded/.test(G1.folded) && /is-folded/.test(G1.folded) === /is-folded/.test(G0.folded), G1.folded);
ok('A4 不占空间③：画板尺寸与位置不因面板变化（≤1px）',
  Math.abs(G1.board[2] - G0.board[2]) <= 1 && Math.abs(G1.board[3] - G0.board[3]) <= 1 && Math.abs(G1.board[0] - G0.board[0]) <= 1,
  JSON.stringify([G0.board, G1.board]));
ok('A5 面板贴画布右缘、悬浮在画板之上', E1.rightGap <= 1 && E1.left < E1.canvasRight, JSON.stringify([E1.left, E1.canvasRight]));
await p.click('#udEdit'); await wait(300);

/* ============================================================
   ③ 分辨率切换 + 画板尺寸联动
   ============================================================ */
const R0 = await p.evaluate(() => ({ label: document.querySelector('#udRes .ud-sel-v').textContent, w: getComputedStyle(document.getElementById('udBoard')).width }));
ok('B0 初始：触发器「自定义分辨率」、画板 1440×900', R0.label === '自定义分辨率' && R0.w === '1440px', JSON.stringify(R0));

const pick = async (i) => {
  await p.click('#udRes'); await wait(220);
  const rows = await p.$$('#udResPop .ud-res-row');
  await rows[i].click(); await wait(480);
  return geo();
};
const B1 = await pick(3);     /* MacBook Air 1280x832 */
const B1s = await p.evaluate(() => ({
  label: document.querySelector('#udRes .ud-sel-v').textContent,
  onK: document.querySelector('#udResPop .ud-res-row.is-on .ud-res-k').textContent,
  title: document.getElementById('udRes').getAttribute('title'),
  hidden: document.getElementById('udResPop').hidden,
  exp: document.getElementById('udRes').getAttribute('aria-expanded')
}));
ok('B1 点「MacBook Air」：触发器回填 1280x832、下拉自动收起', B1s.label === '1280x832' && B1s.hidden && B1s.exp === 'false', JSON.stringify(B1s));
ok('B2 选中行同步到那条预设（is-on）', B1s.onK === 'MacBook Air', B1s.onK);
ok('B3 画板宽高 = 1280×832（尺寸联动）', B1.w === '1280px' && B1.h === '832px', JSON.stringify([B1.w, B1.h]));
ok('B4 缩放回到自适应：视觉宽 = 1280 × s（±1）',
  Math.abs(B1.board[2] - 1280 * parseFloat(B1.s)) <= 1 && Math.abs(B1.board[3] - 832 * parseFloat(B1.s)) <= 1,
  JSON.stringify([B1.board, B1.s, B1.zoom]));

const B5 = await pick(12);    /* iPhone 8 Plus 414x736（最小） */
const B5s = await p.evaluate(() => ({
  label: document.querySelector('#udRes .ud-sel-v').textContent,
  list: getComputedStyle(document.querySelector('.kb-list')).display,
  side: getComputedStyle(document.querySelector('.kb-side')).display,
  rail: Math.round(document.querySelector('.kb-rail').getBoundingClientRect().width / parseFloat(document.getElementById('udBoardWrap').style.getPropertyValue('--ud-s'))),
  docW: Math.round(document.querySelector('.ud-board-doc').getBoundingClientRect().width / parseFloat(document.getElementById('udBoardWrap').style.getPropertyValue('--ud-s')))
}));
ok('B6 点「iPhone 8 Plus」：画板 414×736', B5.w === '414px' && B5.h === '736px' && B5s.label === '414x736', JSON.stringify([B5.w, B5.h, B5s.label]));
ok('B7 窄画板重排：is-w-xs 生效（客户栏 / 会话列表收起，导航 48）',
  /is-w-xs/.test(B5.cls) && /is-w-sm/.test(B5.cls) && B5s.list === 'none' && B5s.side === 'none' && B5s.rail === 48,
  JSON.stringify([B5.cls, B5s.list, B5s.side, B5s.rail]));
ok('B8 生成的页面跟着画板宽度铺满（414）', B5s.docW === 414, B5s.docW);

const B9 = await pick(0);     /* 自定义 1440x900 */
const B9s = await p.evaluate(() => ({
  label: document.querySelector('#udRes .ud-sel-v').textContent,
  list: getComputedStyle(document.querySelector('.kb-list')).display,
  side: getComputedStyle(document.querySelector('.kb-side')).display
}));
ok('B9 选回「自定义分辨率」：画板回 1440×900、四栏复原',
  B9.w === '1440px' && B9.h === '900px' && B9s.label === '自定义分辨率' && !/is-w-sm|is-w-xs/.test(B9.cls) && B9s.list !== 'none' && B9s.side !== 'none',
  JSON.stringify([B9.w, B9.h, B9s, B9.cls]));

/* ============================================================
   ④ 三个控件的激活态：1.6px 主色粗描边
   ============================================================ */
/* 描边是 1.6px，过渡中会量到 1.59885 这类中间值 → 颜色 + 1.5~1.6 区间都认 */
const BLUE = /rgb\(55, 112, 247\) 0px 0px 0px 1\.(6|59\d*)px inset/;

await p.click('#udVer'); await wait(280);
const C1 = await p.evaluate(() => ({
  shadow: getComputedStyle(document.getElementById('udVer')).boxShadow,
  open: document.querySelector('.ud-dd').classList.contains('is-open')
}));
ok('C1 版本：展开时 1.6px 主色粗描边', C1.open && BLUE.test(C1.shadow), C1.shadow);
await p.click('#udVer'); await wait(260);
const C2 = await p.evaluate(() => getComputedStyle(document.getElementById('udVer')).boxShadow);
ok('C2 版本：收起后回到 1px #E5E5E5', /rgb\(229, 229, 229\) 0px 0px 0px 1(\.0\d*)?px inset/.test(C2), C2);

await p.click('#udRes'); await wait(280);
const C3 = await p.evaluate(() => ({
  shadow: getComputedStyle(document.getElementById('udRes')).boxShadow,
  open: document.getElementById('udRes').classList.contains('is-open')
}));
ok('C3 分辨率：展开时 1.6px 主色粗描边', C3.open && BLUE.test(C3.shadow), C3.shadow);
await p.keyboard.press('Escape'); await wait(200);
if (await p.evaluate(() => !document.getElementById('udResPop').hidden)) { await p.click('#udRes'); await wait(200); }
const C4 = await p.evaluate(() => getComputedStyle(document.getElementById('udRes')).boxShadow);
ok('C4 分辨率：收起后回到 1px #E5E5E5', /rgb\(229, 229, 229\) 0px 0px 0px 1(\.0\d*)?px inset/.test(C4), C4);

await p.click('#udZoomIn'); await wait(260);
const C5 = await p.evaluate(() => ({
  shadow: getComputedStyle(document.querySelector('.ud-zoom')).boxShadow,
  focus: document.activeElement ? document.activeElement.id : ''
}));
ok('C5 缩放：操作时（focus-within）1.6px 主色粗描边', BLUE.test(C5.shadow), JSON.stringify(C5));
const C6 = await p.evaluate(() => getComputedStyle(document.getElementById('udZoomVal')).boxShadow);
ok('C6 组内值按钮不带双层描边（描边在组上）', !BLUE.test(C6), C6);

/* ============================================================
   ① 批注浮窗透明度
   ============================================================ */
await p.evaluate(() => { document.activeElement.blur(); });
const P0 = await p.evaluate(() => {
  const w = document.querySelector('.ud-pop');
  const cs = getComputedStyle(w);
  return { bg: cs.backgroundColor, blur: cs.backdropFilter || cs.webkitBackdropFilter, attr: w.getAttribute('data-alpha') };
});
ok('D1 批注浮窗白底 96%（原来 90%，太透）', /rgba\(255, 255, 255, 0\.96\)/.test(P0.bg), P0.bg);
ok('D2 毛玻璃仍保留（blur 15px）', /blur\(15px\)/.test(P0.blur), P0.blur);

/* 框选一次让浮窗真的出现，确认两处（区域 / 位置）共用同一底色 */
const G2 = await geo();
await p.click('#udFrame'); await wait(220);
await p.mouse.move(G2.board[0] + G2.board[2] * 0.3, G2.board[1] + G2.board[3] * 0.4);
await p.mouse.down(); await p.mouse.move(G2.board[0] + G2.board[2] * 0.55, G2.board[1] + G2.board[3] * 0.62, { steps: 8 }); await p.mouse.up();
await wait(320);
const D3 = await p.evaluate(() => {
  const w = document.getElementById('udPop');
  return { hidden: w.hidden, bg: getComputedStyle(w).backgroundColor, title: w.querySelector('.ud-pop-title').textContent };
});
ok('D3 区域批注浮窗用同一底色（96%）', !D3.hidden && D3.title === '区域批注' && /rgba\(255, 255, 255, 0\.96\)/.test(D3.bg), JSON.stringify(D3));
await p.keyboard.press('Escape'); await wait(200);
await p.keyboard.press('Escape'); await wait(250);
await p.mouse.click(G2.board[0] + G2.board[2] * 0.2, G2.board[1] + G2.board[3] * 0.2); await wait(200);
await p.click('#udMark'); await wait(200);
await p.mouse.click(G2.board[0] + G2.board[2] * 0.5, G2.board[1] + G2.board[3] * 0.35); await wait(320);
const D4 = await p.evaluate(() => {
  const w = document.getElementById('udPop');
  return { hidden: w.hidden, bg: getComputedStyle(w).backgroundColor, title: w.querySelector('.ud-pop-title').textContent };
});
ok('D4 位置批注浮窗用同一底色（96%）', !D4.hidden && D4.title === '位置批注' && /rgba\(255, 255, 255, 0\.96\)/.test(D4.bg), JSON.stringify(D4));

ok('E0 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n第 106 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
