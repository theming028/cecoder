/* 第 107 轮验收：
   ① 「页面关系」页签 = 灰底网格 + 5 张页面卡 + 交互连线；点卡后无关联的卡与线暗下去
   ② 「页面预览」页签 = 灰底网格 + 只有 html 画布，纯预览（无左列、无标注键、不可选中）
   ③ 选中的 DOM 元素是蓝色粗边框（2.5px，比 hover 虚线厚一档）
   ④ 批注浮窗标题栏中间的 grip 图标去掉（整条标题栏仍可拖）
   ⑤ 画板名后面带分辨率，换分辨率跟着变
   ⑥ 按住画板标题栏 .ud-board-name 在任何情形下都能拖画板
   ⑦ 左列 .ud-tree-row / .ud-state 字号 13px，且所有页面组同时只有一个选中项 */
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

const tab = async (i) => { const t = await p.$$('#uiTabs .tk-tab'); await t[i].click(); await wait(450); };

/* ============================================================
   ⑦ 左列：字号 13 + 全局单选（先测，不然后面切视图会盖住）
   ============================================================ */
const T0 = await p.evaluate(() => {
  const row = document.querySelector('.ud-tree-row'), st = document.querySelector('.ud-state');
  const cs = e => getComputedStyle(e);
  return {
    row: [cs(row).fontSize, cs(row).lineHeight], st: [cs(st).fontSize, cs(st).lineHeight],
    ons: [...document.querySelectorAll('.ud-state.is-on')].map(e => (e.closest('.ud-page') ? 'p' : 't') + ':' + e.textContent.trim()),
    rowH: Math.round(row.getBoundingClientRect().height)
  };
});
ok('G1 .ud-tree-row / .ud-state 字号 13px', T0.row[0] === '13px' && T0.st[0] === '13px', JSON.stringify(T0));
ok('G2 行高仍 28（不因字号改高度）', T0.rowH === 28, T0.rowH);
ok('G3 初始只有一个选中状态（账密登录 / 默认）', T0.ons.length === 1 && /默认/.test(T0.ons[0]), JSON.stringify(T0.ons));

/* 点第二个页面组的「默认」 */
await p.evaluate(() => {
  const pg = document.querySelectorAll('.ud-page')[0];
  pg.querySelector('.ud-tree-row').click();     /* 先展开 */
});
await wait(200);
await p.evaluate(() => {
  const pg = document.querySelectorAll('.ud-page')[0];
  pg.querySelectorAll('.ud-state')[0].click();
});
await wait(250);
const T1 = await p.evaluate(() => ({
  ons: [...document.querySelectorAll('.ud-state.is-on')].map(e => e.textContent.trim()),
  idle: [...document.querySelectorAll('.ud-state .ud-dot.is-idle')].length
}));
ok('G4 跨页面组仍只有一个选中项', T1.ons.length === 1 && T1.ons[0] === '默认', JSON.stringify(T1));

/* ============================================================
   ① 页面关系
   ============================================================ */
await tab(1);
const R0 = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas'), rel = document.getElementById('udRel');
  const cs = getComputedStyle(cv);
  const cards = [...document.querySelectorAll('.ud-rel-card')];
  const lines = [...document.querySelectorAll('.ud-rel-line')];
  const r = id => { const e = document.querySelector('.ud-rel-card[data-id="' + id + '"]'); const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const c0 = getComputedStyle(cards[0]);
  return {
    cls: cv.className, relHidden: rel.hidden,
    pages: getComputedStyle(document.getElementById('udPages')).display,
    scroll: getComputedStyle(document.getElementById('udScroll')).display,
    bg: cs.backgroundColor, grid: cs.backgroundImage.indexOf('linear-gradient') > -1,
    n: cards.length, lines: lines.length,
    names: cards.map(c => c.querySelector('.ud-rel-t').textContent),
    routes: cards.map(c => c.querySelector('.ud-rel-p').textContent),
    login: r('login'), gmail: r('gmail'), info: r('info'), appeal: r('appeal'), recovery: r('recovery'),
    cardH: Math.round(cards[0].getBoundingClientRect().height),
    cardBg: c0.backgroundColor, cardShadow: c0.boxShadow,
    anyOn: cards.filter(c => c.classList.contains('is-on')).length,
    anyDim: cards.filter(c => c.classList.contains('is-dim')).length
  };
});
ok('A1 切到页面关系：画布 is-rel、左列与画板收起、关系图显示', /is-rel/.test(R0.cls) && R0.relHidden === false && R0.pages === 'none' && R0.scroll === 'none', JSON.stringify([R0.cls, R0.pages, R0.scroll]));
ok('A2 灰底 + 网格（#F5F5F5 + 田字网格）', /rgb\(245, 245, 245\)/.test(R0.bg) && R0.grid, JSON.stringify([R0.bg, R0.grid]));
ok('A3 5 张页面卡 + 5 条连线', R0.n === 5 && R0.lines === 5, JSON.stringify([R0.n, R0.lines]));
ok('A4 卡片文案 = 产出页面（账密登录 / Gmail / 个人信息 / 申诉 / 恢复）', R0.names.join(',') === '账密登录,Gmail 邮箱登录,填写个人信息,发起申诉页,账号恢复页', R0.names.join(','));
ok('A5 卡片带路由（/login、/account/info…）', R0.routes.join(',') === '/login,/login/gmail,/account/info,/account/appeal,/account/recovery', R0.routes.join(','));
ok('A6 卡 82 高、白底、1px #E5E5E5（稿 4168:57067）', R0.cardH === 82 && /rgb\(255, 255, 255\)/.test(R0.cardBg) && /rgb\(229, 229, 229\) 0px 0px 0px 1px/.test(R0.cardShadow), JSON.stringify([R0.cardH, R0.cardBg, R0.cardShadow]));
ok('A7 卡片位置按稿摆（96/140/124/131/142 宽）', R0.login[2] === 96 && R0.gmail[2] === 140 && R0.info[2] === 124 && R0.appeal[2] === 131 && R0.recovery[2] === 142 && R0.login[0] < R0.gmail[0] && R0.info[1] > R0.login[1], JSON.stringify([R0.login, R0.gmail, R0.info, R0.appeal, R0.recovery]));
ok('A8 初始没有卡片被选中 / 变暗', R0.anyOn === 0 && R0.anyDim === 0, JSON.stringify([R0.anyOn, R0.anyDim]));

/* 点「发起申诉页」：邻居 = 账密登录（login→appeal）、账号恢复（appeal→recovery）、个人信息（info→appeal） */
await p.click('.ud-rel-card[data-id="appeal"]'); await wait(350);
const R1 = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.ud-rel-card')];
  const lines = [...document.querySelectorAll('.ud-rel-line')];
  const on = cards.find(c => c.classList.contains('is-on'));
  const cs = getComputedStyle(on);
  return {
    on: on && on.getAttribute('data-id'),
    dim: cards.filter(c => c.classList.contains('is-dim')).map(c => c.getAttribute('data-id')),
    dimOp: getComputedStyle(cards.find(c => c.classList.contains('is-dim'))).opacity,
    border: cs.boxShadow,
    hot: lines.filter(l => l.classList.contains('is-hot')).map(l => l.getAttribute('data-a') + '>' + l.getAttribute('data-b')),
    dimLines: lines.filter(l => l.classList.contains('is-dim')).length
  };
});
ok('B1 点卡：该卡选中（1.6px 主色描边 + 主色光）', R1.on === 'appeal' && /rgb\(55, 112, 247\) 0px 0px 0px 1\.6px/.test(R1.border), JSON.stringify([R1.on, R1.border]));
ok('B2 有交互关系的卡保持明亮，无关的只暗掉 Gmail', R1.dim.length === 1 && R1.dim[0] === 'gmail', JSON.stringify(R1.dim));
ok('B3 暗卡透明度 .38', R1.dimOp === '0.38', R1.dimOp);
ok('B4 与该卡相连的 3 条线高亮，其余变暗',
  R1.hot.sort().join(',') === 'appeal>recovery,info>appeal,login>appeal' && R1.dimLines === 2, JSON.stringify([R1.hot, R1.dimLines]));

/* 点空白取消 */
await p.click('#udRelMap', { offset: { x: 8, y: 8 } }); await wait(300);
const R2 = await p.evaluate(() => ({
  on: document.querySelectorAll('.ud-rel-card.is-on').length,
  dim: document.querySelectorAll('.ud-rel-card.is-dim').length,
  hot: document.querySelectorAll('.ud-rel-line.is-hot').length,
  dimLines: document.querySelectorAll('.ud-rel-line.is-dim').length
}));
ok('B5 点空白：选中与变暗全部复位', R2.on === 0 && R2.dim === 0 && R2.hot === 0 && R2.dimLines === 0, JSON.stringify(R2));

/* ============================================================
   ② 页面预览
   ============================================================ */
await tab(2);
const V0 = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas'), cs = getComputedStyle(cv);
  const br = document.getElementById('udBoard').getBoundingClientRect();
  return {
    cls: cv.className, pages: getComputedStyle(document.getElementById('udPages')).display,
    rel: document.getElementById('udRel').hidden,
    tools: getComputedStyle(document.querySelector('.ud-tools')).display,
    note: getComputedStyle(document.getElementById('udNote')).display,
    boardW: Math.round(br.width), bg: cs.backgroundColor, grid: cs.backgroundImage.indexOf('linear-gradient') > -1,
    handles: getComputedStyle(document.querySelector('.ud-handle')).display
  };
});
/* 第 108 轮：页面预览要保留左列「页面层级和状态」，pages 不再收 */
ok('C1 切到页面预览：画布 is-prev、左列保留、关系图隐藏', /is-prev/.test(V0.cls) && V0.pages !== 'none' && V0.rel === true, JSON.stringify([V0.cls, V0.pages, V0.rel]));
ok('C2 灰底 + 网格保留', /rgb\(245, 245, 245\)/.test(V0.bg) && V0.grid, V0.bg);
ok('C3 只剩 html 画布（画板可见）', V0.boardW > 200, V0.boardW);
ok('C4 标注类工具键与「批注 (n)」全收起', V0.tools === 'none' && V0.note === 'none', JSON.stringify([V0.tools, V0.note]));
ok('C5 纯预览：画板无四角手柄', V0.handles === 'none', V0.handles);

/* 点画布不应产生选中 / 批注 */
const BB = await p.evaluate(() => { const r = document.getElementById('udBoard').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await p.mouse.click(BB[0] + BB[2] * 0.4, BB[1] + BB[3] * 0.4); await wait(350);
const V1 = await p.evaluate(() => ({
  sel: document.getElementById('udBoard').getAttribute('data-sel'),
  isSel: document.getElementById('udBoard').classList.contains('is-sel'),
  pop: document.getElementById('udPop').hidden,
  pins: document.querySelectorAll('.ud-pin').length,
  dom: document.getElementById('udDomSel').hidden
}));
ok('C6 预览里点画板：不选中、不弹批注、不留序号', V1.sel === 'false' && V1.isSel === false && V1.pop === true && V1.pins === 0 && V1.dom === true, JSON.stringify(V1));

/* ============================================================
   ⑤ 画板名带尺寸 / ⑥ 标题栏拖动
   ============================================================ */
await tab(0);
const N0 = await p.evaluate(() => document.getElementById('udBoardLabel').textContent.trim());
ok('D1 画板名带分辨率 (1440x900)', N0 === '智能客服管理系统 · 默认 (1440x900)', N0);

await p.click('#udRes'); await wait(220);
const rows = await p.$$('#udResPop .ud-res-row');
await rows[3].click(); await wait(500);
const N1 = await p.evaluate(() => document.getElementById('udBoardLabel').textContent.trim());
ok('D2 换 1280x832 → 画板名同步 (1280x832)', N1 === '智能客服管理系统 · 默认 (1280x832)', N1);
await p.click('#udRes'); await wait(220);
const rows2 = await p.$$('#udResPop .ud-res-row');
await rows2[0].click(); await wait(450);

const tx0 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform || 'none');
const NB = await p.$eval('#udBoardLabel', el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await p.mouse.move(NB[0], NB[1]); await p.mouse.down();
await p.mouse.move(NB[0] + 40, NB[1] + 30, { steps: 10 }); await wait(120);
await p.mouse.up(); await wait(250);
const tx1 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
ok('E1 按住画板名能拖动画板（位移写进 wrap transform）', tx1 !== tx0 && /translate\(/.test(tx1), JSON.stringify([tx0, tx1]));

/* 批注模式下（标题栏照样能拖） */
await p.click('#udMark'); await wait(300);
const NB2 = await p.$eval('#udBoardLabel', el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await p.mouse.move(NB2[0], NB2[1]); await p.mouse.down();
await p.mouse.move(NB2[0] - 50, NB2[1] - 20, { steps: 10 }); await wait(120);
await p.mouse.up(); await wait(250);
const tx2 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
ok('E2 批注模式下也能拖（任何情形下都生效）', tx2 !== tx1, JSON.stringify([tx1, tx2]));
ok('E3 拖标题栏不落批注点', await p.evaluate(() => document.querySelectorAll('.ud-pin').length === 0), '');
await p.keyboard.press('Escape'); await wait(250);

/* ============================================================
   ③ 选中 DOM 的蓝色粗边框 / ④ grip 已去掉
   ============================================================ */
await p.click('#udEdit'); await wait(400);
const B2 = await p.evaluate(() => { const r = document.getElementById('udBoard').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await p.mouse.click(B2[0] + B2[2] * 0.34, B2[1] + B2[3] * 0.16); await wait(400);
const F0 = await p.evaluate(() => {
  const el = document.getElementById('udDomSel'), cs = getComputedStyle(el);
  const s = parseFloat(getComputedStyle(document.getElementById('udBoardWrap')).getPropertyValue('--ud-s'));
  return { hidden: el.hidden, style: cs.borderTopStyle, color: cs.borderTopColor, bw: parseFloat(cs.borderTopWidth), s: s, visual: +(parseFloat(cs.borderTopWidth) * s).toFixed(2) };
});
ok('F1 选中的 DOM 元素：实线蓝框', !F0.hidden && F0.style === 'solid' && /rgb\(55, 112, 247\)/.test(F0.color), JSON.stringify(F0));
ok('F2 视觉 2.5px 粗边框（比 hover 1.6 虚线厚）', Math.abs(F0.visual - 2.5) <= 0.15, JSON.stringify([F0.bw, F0.s, F0.visual]));
const F3 = await p.evaluate(() => ({
  grip: !!document.getElementById('udPopGrip'),
  headDraggable: getComputedStyle(document.querySelector('.ud-pop-head')).cursor
}));
ok('F3 浮窗标题栏中间的 grip 图标已去掉', F3.grip === false, F3.grip);
ok('F4 改成整条标题栏可拖（cursor: grab 兜底）', /grab/.test(F3.headDraggable), F3.headDraggable);

ok('H1 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n第 107 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
