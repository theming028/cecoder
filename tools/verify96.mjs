/* 第 96 轮验收：
   ① 画布网格线再浅一倍（alpha .04）
   ② 左侧浮层「页面层级和状态」（稿 4068:65598）：240 宽、可折叠、图标取稿内矢量
   ③ 画板（稿 4068:64885 / 选中态 4138:57012）：800×400、12/20 标签、自适应缩放、工具栏 ± 自定义、
      点画板选中（1.6px 主色 + 四角 8×8 手柄）、点空白取消 */
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

const A = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const canvas = q('.ud-canvas'), pages = q('.ud-pages'), head = q('.ud-pages-head'), fold = q('#udFold');
  const tree = q('.ud-tree'), row = q('.ud-tree-row'), states = qa('.ud-tree .ud-state'), pagesEls = qa('.ud-page');
  const on = q('.ud-tree .ud-state.is-on'), dot = q('.ud-tree .ud-state .ud-dot');
  const wrap = q('.ud-board-wrap'), board = q('#udBoard'), name = q('.ud-board-name');
  const ccs = cs(canvas);
  return {
    grid: [ccs.backgroundImage, ccs.backgroundSize, ccs.backgroundColor],
    canvasBox: box(canvas),
    pages: [box(pages), cs(pages).position, cs(pages).backgroundColor, cs(pages).boxShadow, cs(pages).zIndex],
    head: [box(head), cs(head).padding],
    title: [q('.ud-pages-t').textContent, cs(q('.ud-pages-t')).fontSize, cs(q('.ud-pages-t')).fontWeight, cs(q('.ud-pages-t')).color, cs(q('.ud-pages-t')).lineHeight],
    fold: [box(fold), fold.getAttribute('data-tip'), fold.getAttribute('aria-expanded')],
    tree: [box(tree), cs(tree).backgroundColor, cs(tree).boxShadow, cs(tree).borderRadius],
    row: [box(row), cs(row).paddingLeft, cs(row).gap, [...row.children].map(c => Math.round(c.getBoundingClientRect().x - row.getBoundingClientRect().x)),
      cs(q('.ud-tree-t')).fontWeight, q('.ud-tree-t').textContent],
    states: states.map(e => [e.textContent.trim(), Math.round(e.getBoundingClientRect().height), cs(e).padding,
      e.classList.contains('is-on') ? cs(e).backgroundColor : '', e.classList.contains('is-on') ? cs(e).boxShadow : '', e.classList.contains('is-on') ? cs(e).color : cs(e).fontWeight]),
    dot: [box(dot)[2], cs(dot).borderRadius, cs(dot).backgroundColor, Math.round(dot.getBoundingClientRect().x - row.getBoundingClientRect().x)],
    /* 第 98 轮：页面项改成「卡 + 行」结构，量卡高与行内三件的相对位 */
    pages2: pagesEls.map(e => { const r = e.querySelector('.ud-tree-row'); const rb = r.getBoundingClientRect();
      return [r.querySelector('.ud-page-t').textContent.trim(), Math.round(e.getBoundingClientRect().height),
        [...r.children].map(c => Math.round(c.getBoundingClientRect().x - rb.x))]; }),
    board: [box(board), cs(board).width, cs(board).height, cs(board).borderRadius, cs(board).boxShadow, cs(board).transformOrigin],
    name: [name.textContent.trim(), box(name)[3], cs(name).fontSize, cs(name).lineHeight, cs(name).color],
    wrapBox: box(wrap),
    zoom: q('#udZoomVal').textContent,
    s: getComputedStyle(wrap).getPropertyValue('--ud-s').trim(),
    scroll: [q('.ud-scroll').clientWidth, q('.ud-scroll').clientHeight],
    stagePad: cs(q('.ud-stage')).paddingLeft,
    handles: qa('.ud-handle').length
  };
});

/* ---------- ① 网格更浅 ---------- */
ok('A1 网格仍是 16px 方格', A.grid[1].split(', ').every(v => v === '16px 16px'), A.grid[1]);
ok('A2 网格线降到 alpha .04（比上一轮 .08 浅一倍）',
  /rgba?\(31, 31, 31, 0\.04\)/.test(A.grid[0]) && !/0\.08/.test(A.grid[0]), A.grid[0].slice(0, 160));
ok('A3 画布底色仍是 #F5F5F5', A.grid[2] === 'rgb(245, 245, 245)', A.grid[2]);

/* ---------- ② 左侧浮层 ---------- */
ok('B1 左列 240 定宽、在流内（第 97 轮改成贴边列）', A.pages[0][2] === 240 && A.pages[1] === 'relative', JSON.stringify([A.pages[0], A.pages[1]]));
ok('B2 左列与画布左上贴齐、上下拉通', A.pages[0][0] === A.canvasBox[0] && A.pages[0][1] === A.canvasBox[1] && A.pages[0][3] === A.canvasBox[3], JSON.stringify([A.pages[0], A.canvasBox]));
ok('B3 浮层底是毛玻璃半透明白 + 右侧 1px #E5E5E5', /rgba\(255, 255, 255, 0\./.test(A.pages[2]) && /rgb\(229, 229, 229\) -1px 0px 0px 0px inset/.test(A.pages[3]), JSON.stringify([A.pages[2], A.pages[3]]));
ok('B4 头 13/5/0/19 内距（第 99 轮底距归 0）', A.head[1] === '13px 5px 0px 19px', A.head[1]);
ok('B5 标题「页面层级和状态」14/22、正文色', A.title[0] === '页面层级和状态' && A.title[1] === '14px' && A.title[2] === '400' && A.title[3] === 'rgb(31, 31, 31)' && A.title[4] === '22px', JSON.stringify(A.title));
ok('B6 展开态折叠键 28×28（图标 14），默认提示「折叠」', A.fold[0][2] === 28 && A.fold[0][3] === 28 && A.fold[1] === '折叠' && A.fold[2] === 'true', JSON.stringify(A.fold));

/* ---------- 分组卡 / 状态行 / 页面项 ---------- */
ok('C1 分组卡 216 宽、白底、1px #EEEEEE、圆角 4', A.tree[0][2] === 216 && A.tree[1] === 'rgb(255, 255, 255)'
  && /rgb\(238, 238, 238\) 0px 0px 0px 1px inset/.test(A.tree[2]) && A.tree[3] === '4px', JSON.stringify([A.tree[0][2], A.tree[1], A.tree[2], A.tree[3]]));
ok('C2 分组行 28 高，内距 8', A.row[0][3] === 28 && A.row[1] === '8px', JSON.stringify([A.row[0][3], A.row[1]]));
ok('C3 行内间距 4（相对行首：箭头 8 / 文档 26 / 文字 44 → 相对卡片 16/34/52）', A.row[2] === '4px' && A.row[3][0] === 8 && A.row[3][1] === 26 && A.row[3][2] === 44, JSON.stringify(A.row[3]));
ok('C4 分组名「账密登录」500 中粗', A.row[4] === '500' && A.row[5] === '账密登录', JSON.stringify([A.row[4], A.row[5]]));
ok('C5 六行状态 28 高、左内距 32（圆点 → 文字 44）', A.states.length === 6 && A.states.every(s => s[1] === 28 && s[2] === '0px 8px 0px 32px'), JSON.stringify(A.states.map(s => [s[0], s[1], s[2]])));
ok('C6 状态文案与稿一致', A.states.map(s => s[0]).join('/') === '默认/账号或密码错误/凭证过期/账号锁定/访问限流/未知错误', A.states.map(s => s[0]).join('/'));
ok('C7 选中行「默认」浅蓝底 + 1px #DAE4FE + 主色 500', A.states[0][3] === 'rgb(245, 248, 255)'
  && /rgb\(218, 228, 254\) 0px 0px 0px 1px inset/.test(A.states[0][4]) && A.states[0][5] === 'rgb(55, 112, 247)', JSON.stringify(A.states[0]));
ok('C8 圆点 6×6、距行左 32、选中为主色', A.dot[0] === 6 && A.dot[1] === '50%' && A.dot[2] === 'rgb(55, 112, 247)' && A.dot[3] === 32, JSON.stringify(A.dot));
ok('C9 下方两个页面卡 44 高，行内箭头 8 / 文档 26 / 文字 44（与分组头同缩进）', A.pages2.length === 2 && A.pages2.every(v => v[1] === 44 && v[2][0] === 8 && v[2][1] === 26 && v[2][2] === 44), JSON.stringify(A.pages2));
ok('C10 页面项文案：Gmail 邮箱登录 / 账号恢复页', A.pages2[0][0] === 'Gmail 邮箱登录' && A.pages2[1][0] === '账号恢复页', JSON.stringify(A.pages2.map(v => v[0])));

/* ---------- ③ 画板 ---------- */
ok('D1 画板原生 1440×900', A.board[1] === '1440px' && A.board[2] === '900px', JSON.stringify([A.board[1], A.board[2]]));
ok('D2 画板白底圆角 4 + 1px #E5E5E5 + 0/8/16 阴影', A.board[3] === '4px'
  && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(A.board[4]) && /rgba\(0, 0, 0, 0\.04\) 0px 8px 16px 0px/.test(A.board[4]), A.board[4]);
ok('D3 画板名 12/20 #868686「账密登录 · 默认」', A.name[2] === '12px' && A.name[3] === '20px' && A.name[4] === 'rgb(134, 134, 134)' && A.name[0] === '账密登录 · 默认', JSON.stringify(A.name));
ok('D4 标签 20 高、与画板间距 8（画板顶 28）', A.name[1] === 20, A.name[1]);
ok('D5 默认按可用区域自适应：25%（1440 下中栏 654 − 左列 240 = 414）', A.zoom === '25%' && A.s === '0.25', A.zoom + ' / ' + A.s);
ok('D6 缩放写在 --ud-s 上（画板用 transform 缩放，不改 800/400）', !!A.s, A.s);
ok('D7 四角手柄 4 个', A.handles === 4, A.handles);
ok('D8 未选中时手柄不显示', await p.evaluate(() => getComputedStyle(document.querySelector('.ud-handle')).display) === 'none');

/* 选中态 */
await p.click('#udBoard'); await wait(250);
const S = await p.evaluate(() => {
  const b = document.querySelector('#udBoard'); const cs = getComputedStyle(b);
  const h = document.querySelector('.ud-h-tl'); const hs = getComputedStyle(h);
  const r = b.getBoundingClientRect(); const hr = h.getBoundingClientRect();
  return { cls: b.classList.contains('is-sel'), sh: cs.boxShadow, pressed: b.getAttribute('aria-pressed'),
    disp: hs.display, size: [Math.round(hr.width), Math.round(hr.height)], ring: hs.boxShadow,
    dx: Math.round(hr.x + hr.width / 2 - r.x), dy: Math.round(hr.y + hr.height / 2 - r.y) };
});
ok('D9 点画板 → is-sel + aria-pressed', S.cls === true && S.pressed === 'true', JSON.stringify([S.cls, S.pressed]));
ok('D10 选中态 1.6px 主色描边', /rgb\(55, 112, 247\) 0px 0px 0px 1\.(?:59|6)\d*px inset/.test(S.sh), S.sh);
ok('D11 四角手柄 8×8、白底 + 1.6px 主色环', S.disp === 'block' && S.size[0] === 8 && S.size[1] === 8 && /rgb\(55, 112, 247\) 0px 0px 0px 1\.(?:59|6)\d*px/.test(S.ring), JSON.stringify(S));
ok('D12 手柄中心正好落在画板左上角', S.dx === 0 && S.dy === 0, JSON.stringify([S.dx, S.dy]));

/* 点空白取消 */
await p.evaluate(() => document.querySelector('.ud-stage').click());
await wait(200);
ok('D13 点空白取消选中', await p.evaluate(() => !document.querySelector('#udBoard').classList.contains('is-sel')));

/* 工具栏 ± */
await p.click('#udZoomIn'); await wait(200);
const z1 = await p.evaluate(() => [document.querySelector('#udZoomVal').textContent, document.querySelector('#udBoardWrap').style.getPropertyValue('--ud-s')]);
ok('D14 「+」按 25 步进（25→50）', z1[0] === '50%' && z1[1] === '0.5', JSON.stringify(z1));
await p.click('#udZoomOut'); await p.click('#udZoomOut'); await wait(200);
const z2 = await p.evaluate(() => document.querySelector('#udZoomVal').textContent);
ok('D15 「−」回落到 21 时被夹到 25%', z2 === '25%', z2);
await p.click('#udFold'); await wait(300);
const F = await p.evaluate(() => {
  const pg = document.querySelector('#udPages'); const cv = document.querySelector('.ud-canvas');
  return { cls: pg.classList.contains('is-fold'), body: getComputedStyle(pg.querySelector('.ud-pages-body')).display,
    h: Math.round(pg.getBoundingClientRect().height), w: Math.round(pg.getBoundingClientRect().width),
    abs: getComputedStyle(pg).position === 'absolute', folded: cv.classList.contains('is-folded'),
    pad: getComputedStyle(document.querySelector('.ud-stage')).paddingLeft, tip: document.querySelector('#udFold').getAttribute('data-tip') };
});
ok('F1 折叠后只剩标题条（body 不显示）', F.cls === true && F.body === 'none', JSON.stringify(F));
ok('F2 折叠后收成 32×32 浮键', F.h === 32 && F.w === 32, JSON.stringify([F.w, F.h]));
ok('F3 折叠后画布吃满整幅（stage 内距恒 24）', F.folded === true && F.pad === '24px' && F.abs === true, JSON.stringify([F.folded, F.pad, F.abs]));
ok('F4 折叠图标提示变「展开」', F.tip === '展开', F.tip);

/* 展开 + 分组收起 */
await p.click('#udFold'); await wait(250);
await p.click('#udTreeHead'); await wait(200);
const T = await p.evaluate(() => {
  const s = document.querySelector('#udStates');
  return [s.hidden, getComputedStyle(s).display, document.querySelector('#udTreeHead').getAttribute('aria-expanded'),
    getComputedStyle(document.querySelector('.ud-chev-d')).transform];
});
ok('G1 点分组行收起状态列表（箭头转 -90°）', T[0] === true && T[1] === 'none' && T[2] === 'false' && T[3] !== 'none', JSON.stringify(T));
await p.click('#udTreeHead'); await wait(200);
ok('G2 再点展开回来', await p.evaluate(() => !document.querySelector('#udStates').hidden));

/* 窗口变宽 → 自适应跟着变 */
const q = await b.newPage();
await q.setViewport({ width: 1920, height: 1000 });
await q.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(400);
const z3 = await q.$eval('#udZoomVal', e => e.textContent);
ok('H1 1920 下自适应按可用宽度算（1440 画板 → 59%）', z3 === '59%', z3);
const q2 = await q.evaluate(() => {
  const st = document.querySelector('.ud-stage'), sc = document.querySelector('.ud-scroll');
  return [Math.round(sc.clientWidth), getComputedStyle(st).paddingLeft,
    Math.round(document.querySelector('.ud-pages').getBoundingClientRect().width),
    Math.round(document.querySelector('.ud-canvas').getBoundingClientRect().width)];
});
ok('H2 1920 下滚动区 = 画布 − 240 左列', q2[1] === '24px' && q2[2] === 240 && q2[0] === q2[3] - 240, JSON.stringify(q2));
await q.close();

ok('I1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n第 96 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
