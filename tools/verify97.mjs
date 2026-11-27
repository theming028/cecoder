/* 第 97 轮验收：
   ① 左列「页面层级和状态」240 定宽、上下拉通、与画布贴边（不再浮起 12px）
   ② 折叠键用稿 4068:57550 的面板图标；折叠后整列收成左上角 32×32 浮键，点它再展开
   ③ 画板原生 1440×900，可在画布内自由拖动（至少留 80px 在可视区），点击仍是选中/取消 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(400);

const box = s => p.evaluate(sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect();
  return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
}, s);

/* ---------- ① 左列贴边拉通 ---------- */
const A = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const canvas = q('.ud-canvas'), pages = q('.ud-pages'), head = q('.ud-pages-head');
  const fold = q('#udFold'), ico = fold.querySelector('.ico-fold'), path = ico.querySelector('path');
  const icoExpand = cs(fold.querySelector('.ico-expand')).display;
  return {
    canvas: box(canvas),
    pages: [box(pages), cs(pages).position, cs(pages).width, cs(pages).height, cs(pages).backgroundColor, cs(pages).boxShadow, cs(pages).order],
    head: cs(head).padding,
    fold: [box(fold), cs(fold).backgroundColor, cs(fold).borderRadius, cs(fold).boxShadow],
    ico: [box(ico), ico.getAttribute('viewBox')],
    icoExpand: icoExpand,
    d: (path.getAttribute('d') || '').slice(0, 16),
    canvasDisplay: cs(canvas).display,
    scrollW: q('.ud-scroll').clientWidth,
    zoom: q('#udZoomVal').textContent
  };
});

ok('A1 左列 240 宽、在流内（相对定位）', A.pages[0][2] === 240 && A.pages[1] === 'relative' && A.pages[2] === '240px', JSON.stringify([A.pages[0], A.pages[1], A.pages[2]]));
ok('A2 左列与画布左上贴齐、上下拉通（高度 = 画布高）', A.pages[0][0] === A.canvas[0] && A.pages[0][1] === A.canvas[1] && A.pages[0][3] === A.canvas[3], JSON.stringify([A.pages[0], A.canvas]));
ok('A3 画布是 flex 行容器，左列 order -1 排在最前', A.canvasDisplay === 'flex' && A.pages[6] === '-1', JSON.stringify([A.canvasDisplay, A.pages[6]]));
ok('A4 左列底是毛玻璃半透明白 + 右侧 1px #E5E5E5 贴边线', /rgba\(255, 255, 255, 0\./.test(A.pages[4]) && /rgb\(229, 229, 229\) -1px 0px 0px 0px inset/.test(A.pages[5]), JSON.stringify([A.pages[4], A.pages[5]]));
ok('A5 头部内距 13/5/0/19（第 99 轮底距归 0）', A.head === '13px 5px 0px 19px', A.head);
ok('A6 滚动区 = 画布宽 − 240', A.scrollW === A.canvas[2] - 240, A.scrollW + ' / ' + A.canvas[2]);

/* ---------- ② 折叠键用稿内图标 ---------- */
/* 第 98 轮：展开态是 14 的 direction/to-left（无底色），折叠态才是 32×32 白框面板键 */
ok('B1 展开态折叠键 28×28 热区、透明底', A.fold[0][2] === 28 && A.fold[0][3] === 28 && A.fold[1] === 'rgba(0, 0, 0, 0)', JSON.stringify(A.fold.slice(0, 3)));
ok('B2 展开态不带白框投影', A.fold[3] === 'none', A.fold[3]);
ok('B3 展开态图标 14×14、viewBox 0 0 14 14', A.ico[0][2] === 14 && A.ico[0][3] === 14 && A.ico[1] === '0 0 14 14', JSON.stringify(A.ico));
ok('B4 展开态图标是「竖杠 + 左箭头」（stroke 路径起 M3.1 2.9）', A.d.indexOf('M3.1 2.9') === 0, A.d);
ok('B5 面板图标那只 svg 在展开态隐藏', A.icoExpand === 'none', A.icoExpand);

/* 折叠 */
await p.click('#udFold'); await wait(320);
const F = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const cv = q('.ud-canvas'), pg = q('.ud-pages'), sc = q('.ud-scroll');
  return {
    canvas: box(cv), pages: [box(pg), cs(pg).position], body: cs(q('.ud-pages-body')).display,
    scrollW: sc.clientWidth, zoom: q('#udZoomVal').textContent, tip: q('#udFold').getAttribute('data-tip'),
    tf: q('#udFold').getAttribute('aria-expanded'),
    btn: [box(q('#udFold')), cs(q('#udFold')).backgroundColor, cs(q('#udFold')).boxShadow,
      cs(q('#udFold').querySelector('.ico-fold')).display, cs(q('#udFold').querySelector('.ico-expand')).display]
  };
});
ok('C1 折叠后整列脱离文档流、收成 32×32', F.pages[1] === 'absolute' && F.pages[0][2] === 32 && F.pages[0][3] === 32, JSON.stringify(F.pages));
ok('C2 收起后落在画布左上角 12/12', F.pages[0][0] - F.canvas[0] === 12 && F.pages[0][1] - F.canvas[1] === 12, JSON.stringify([F.pages[0], F.canvas]));
ok('C3 收起后内容体不显示', F.body === 'none', F.body);
ok('C4 收起后画布吃满整幅宽度', F.scrollW === F.canvas[2], F.scrollW + ' / ' + F.canvas[2]);
ok('C5 收起后自适应重算（654−48 → 42%）', F.zoom === '42%', F.zoom);
ok('C6 收起后提示改「展开」、aria-expanded=false', F.tip === '展开' && F.tf === 'false', F.tip + ' / ' + F.tf);
ok('C9 收起后折叠键变 32×32 白底 + 1px #E5E5E5 + 0 1px 8px', F.btn[0][2] === 32 && F.btn[0][3] === 32
  && F.btn[1] === 'rgb(255, 255, 255)' && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(F.btn[2])
  && /rgba\(0, 0, 0, 0\.06\) 0px 1px 8px/.test(F.btn[2]), JSON.stringify(F.btn));
ok('C10 收起后换面板图标（ico-fold 隐藏 / ico-expand 显示）', F.btn[3] === 'none' && F.btn[4] === 'block', F.btn[3] + ' / ' + F.btn[4]);

await p.click('#udFold'); await wait(320);
const U = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  const r = q('.ud-pages').getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), pos: cs(q('.ud-pages')).position,
    scrollW: q('.ud-scroll').clientWidth, zoom: q('#udZoomVal').textContent, tip: q('#udFold').getAttribute('data-tip') };
});
ok('C7 再点展开：回到 240 宽、流内、画布让回 240', U.w === 240 && U.pos === 'relative' && U.scrollW === A.canvas[2] - 240, JSON.stringify(U));
ok('C8 展开后自适应回到 25%、提示回「折叠」', U.zoom === '25%' && U.tip === '折叠', U.zoom + ' / ' + U.tip);

/* ---------- ③ 画板 1440×900 + 拖动 ---------- */
const D = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const bd = q('#udBoard'), wr = q('.ud-board-wrap');
  return {
    w: cs(bd).width, h: cs(bd).height, board: box(bd), wrap: box(wr),
    s: parseFloat(cs(wr).getPropertyValue('--ud-s')),
    name: [q('.ud-board-name').textContent.trim(), cs(q('.ud-board-name')).fontSize, cs(q('.ud-board-name')).lineHeight, cs(q('.ud-board-name')).color],
    cursor: cs(bd).cursor
  };
});
ok('D1 画板原生 1440×900', D.w === '1440px' && D.h === '900px', JSON.stringify([D.w, D.h]));
ok('D2 默认 25%：wrap 宽 = 1440×0.25 = 360', Math.abs(D.wrap[2] - 1440 * D.s) <= 1 && Math.abs(D.s - 0.25) < 1e-6, JSON.stringify([D.wrap[2], D.s]));
ok('D3 画板显示尺寸保持 16:10', Math.abs(D.board[2] / D.board[3] - 1.6) < 0.02, D.board[2] + '×' + D.board[3]);
ok('D4 画板名「智能客服管理系统 · 默认」12/20 #868686', D.name[0] === '智能客服管理系统 · 默认' && D.name[1] === '12px' && D.name[2] === '20px' && D.name[3] === 'rgb(134, 134, 134)', JSON.stringify(D.name));
ok('D5 画板光标是抓手（可拖）', D.cursor === 'grab', D.cursor);

const c = await p.evaluate(() => { const r = document.querySelector('#udBoard').getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; });
await p.mouse.move(c[0], c[1]);
await p.mouse.down();
await p.mouse.move(c[0] - 120, c[1] - 80, { steps: 12 });
await p.mouse.up();
await wait(200);
const E = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  return { tf: q('#udBoardWrap').style.transform, wrap: box(q('#udBoardWrap')), board: box(q('#udBoard')),
    sel: q('#udBoard').classList.contains('is-sel'), pressed: q('#udBoard').getAttribute('data-sel') };
});
ok('E1 拖动后 wrap 位移 -120/-80', E.tf === 'translate(-120px, -80px)', E.tf);
ok('E2 拖动只改位置，不改尺寸（360×225）', E.board[2] === 360 && E.board[3] === 225, E.board[2] + '×' + E.board[3]);
ok('E3 拖动后位置 = 原位 + 位移', E.wrap[0] === D.wrap[0] - 120 && E.wrap[1] === D.wrap[1] - 80, JSON.stringify([D.wrap, E.wrap]));
ok('E4 拖动会顺带选中画板', E.sel === true && E.pressed === 'true', E.sel + ' / ' + E.pressed);

/* 点一下（不移动）= 切换选中 */
await p.mouse.click(c[0] - 120, c[1] - 80);
await wait(150);
const isSel = () => p.evaluate(() => document.querySelector('#udBoard').classList.contains('is-sel'));
ok('E5 单击画板取消选中', (await isSel()) === false);
await p.mouse.click(c[0] - 120, c[1] - 80);
await wait(150);
ok('E6 再单击又选中', (await isSel()) === true);

/* 点画布空白取消 */
const blank = await p.evaluate(() => {
  const r = document.querySelector('.ud-scroll').getBoundingClientRect();
  return [Math.round(r.right - 30), Math.round(r.bottom - 30)];
});
await p.mouse.click(blank[0], blank[1]);
await wait(150);
ok('E7 点画布空白取消选中', (await isSel()) === false);

/* 拖到很远：夹紧到至少 80px 可见 */
await p.mouse.move(c[0] - 120, c[1] - 80);
await p.mouse.down();
await p.mouse.move(c[0] + 4000, c[1] + 4000, { steps: 10 });
await p.mouse.up();
await wait(200);
const G = await p.evaluate(() => {
  const r = document.querySelector('#udBoard').getBoundingClientRect();
  const s = document.querySelector('.ud-scroll').getBoundingClientRect();
  return [Math.round(r.left), Math.round(r.right), Math.round(r.top), Math.round(r.bottom), Math.round(s.left), Math.round(s.right), Math.round(s.top), Math.round(s.bottom)];
});
ok('E8 拖到极远时被夹住（左上角仍留 ≥80px 可见）', G[0] <= G[5] - 80 && G[0] >= G[4], JSON.stringify(G));
/* 抓手要落在「画板 ∩ 滚动区」里，否则 mouse.down 打不到画板 */
/* 画板被夹到右下角时，可点区域会被右下角悬浮球压住一半 —— 扫一遍取真能点到画板的点 */
const grab = await p.evaluate(() => {
  const bd = document.querySelector('#udBoard');
  const b = bd.getBoundingClientRect();
  const s = document.querySelector('.ud-scroll').getBoundingClientRect();
  const x1 = Math.max(b.left, s.left), x2 = Math.min(b.right, s.right);
  const y1 = Math.max(b.top, s.top), y2 = Math.min(b.bottom, s.bottom);
  for (let y = y1 + 12; y < y2 - 8; y += 12) {
    for (let x = x1 + 12; x < x2 - 8; x += 12) {
      const el = document.elementFromPoint(x, y);
      if (el && (el === bd || bd.contains(el))) return [Math.round(x), Math.round(y)];
    }
  }
  return null;
});
await p.mouse.move(grab[0], grab[1]);
await p.mouse.down();
await p.mouse.move(grab[0] - 1200, grab[1] - 1200, { steps: 10 });
await p.mouse.up();
await wait(200);
const G2 = await p.evaluate(() => {
  const r = document.querySelector('#udBoard').getBoundingClientRect();
  const s = document.querySelector('.ud-scroll').getBoundingClientRect();
  return [Math.round(r.left), Math.round(r.right), Math.round(s.left), Math.round(s.right)];
});
ok('E9 反向拖同样夹住（右下角仍留 ≥80px）', !!grab && G2[1] >= G2[2] + 80 && G2[1] <= G2[3] + 40, JSON.stringify(G2) + ' grab ' + JSON.stringify(grab));

ok('F1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n第 97 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
