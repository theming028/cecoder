/* 第 99 轮验收：
   ① .ud-pages 背景毛玻璃（半透明白 + backdrop-filter blur）
   ② 「更多」下拉：打开文件夹 / 在外部浏览器打开（点键开、点项关、点外部关）
   ③ .ud-state 可点击切换（同组互斥，圆点亮/灰跟着走）
   ④ .ud-pages-head 底部内距 = 0
   ⑤ 版本下拉与触发器的间距 = 6px
   ⑥ .ud-tool / .ud-tree-row 的 hover 底色深一级 = #F2F2F2 */
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

/* ---------- ① 毛玻璃 ---------- */
const A = await p.evaluate(() => {
  const cs = e => getComputedStyle(e);
  const pg = document.querySelector('.ud-pages');
  const c = cs(pg);
  return { bg: c.backgroundColor, bf: c.backdropFilter || c.webkitBackdropFilter };
});
const mRgb = /rgba?\(([^)]+)\)/.exec(A.bg || '');
const alpha = mRgb ? (mRgb[1].split(',')[3] || '1').trim() : '1';
ok('A1 .ud-pages 底色是半透明白（alpha < 1）', !!mRgb && parseFloat(alpha) < 0.9, A.bg);
ok('A2 backdrop-filter 含 blur', /blur\(/.test(A.bf || ''), A.bf);

/* ---------- ② 更多下拉 ---------- */
const B = await p.evaluate(() => {
  const more = document.getElementById('udMore'), menu = document.getElementById('udMoreMenu');
  return { has: !!more && !!menu, hidden: menu.hidden, disp: getComputedStyle(menu).display, label: more.getAttribute('aria-label') };
});
ok('B1 「更多」键与菜单都在，初始收起', B.has && B.hidden === true && B.disp === 'none', JSON.stringify(B));
await p.click('#udMore');
await wait(160);
const B2 = await p.evaluate(() => {
  const more = document.getElementById('udMore'), menu = document.getElementById('udMoreMenu');
  const r = menu.getBoundingClientRect(), t = more.getBoundingClientRect();
  return {
    hidden: menu.hidden, disp: getComputedStyle(menu).display,
    items: [...menu.querySelectorAll('.wd-menu-item')].map(e => e.textContent.trim()),
    expanded: more.getAttribute('aria-expanded'),
    gap: Math.round(r.top - t.bottom), box: [Math.round(r.x), Math.round(r.y), Math.round(r.width)],
    inBar: r.bottom > t.bottom
  };
});
ok('B2 点键展开菜单', B2.hidden === false && B2.disp !== 'none' && B2.expanded === 'true', JSON.stringify(B2));
ok('B3 两项文案 = 打开文件夹 / 在外部浏览器打开',
  B2.items.join('|') === '打开文件夹|在外部浏览器打开', B2.items.join('|'));
ok('B4 菜单距触发器 6px、右对齐在键下方', B2.gap === 6, B2.gap);
const B5 = await p.evaluate(() => {
  const r = document.querySelector('#udMoreMenu').getBoundingClientRect();
  const t = document.getElementById('udMore').getBoundingClientRect();
  return Math.abs(r.right - t.right) <= 1;
});
ok('B5 菜单右边缘与键对齐', B5);
await p.click('#udMoreMenu .wd-menu-item');
await wait(160);
const B6 = await p.evaluate(() => ({
  hidden: document.getElementById('udMoreMenu').hidden,
  toast: (document.querySelector('.cds-toast-wrap') || {}).textContent || (document.body.textContent.indexOf('打开文件夹（稿待补）') > -1 ? '打开文件夹（稿待补）' : '')
}));
ok('B6 点菜单项后收起并给反馈', B6.hidden === true && /打开文件夹/.test(B6.toast), JSON.stringify(B6));
await p.click('#udMore'); await wait(120);
await p.mouse.click(700, 700); await wait(120);
const B7 = await p.evaluate(() => document.getElementById('udMoreMenu').hidden);
ok('B7 点外部关闭菜单', B7 === true, B7);

/* ---------- ③ 状态行可点切换 ---------- */
const C0 = await p.evaluate(() => [...document.querySelectorAll('#udStates .ud-state')].map(e => e.className));
ok('C1 初始只有首行选中', C0[0].indexOf('is-on') > -1 && C0.slice(1).every(c => c.indexOf('is-on') < 0), C0.join(' / '));
await p.click('#udStates .ud-state:nth-child(3)');
await wait(160);
const C1 = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('#udStates .ud-state')];
  return rows.map(e => ({
    on: e.classList.contains('is-on'),
    dot: e.querySelector('.ud-dot').classList.contains('is-idle'),
    sel: e.getAttribute('aria-selected'),
    cur: getComputedStyle(e).cursor
  }));
});
ok('C2 点第 3 行 → 它选中、首行取消（同组互斥）',
  C1[2].on === true && C1[0].on === false && C1.filter(r => r.on).length === 1, JSON.stringify(C1.map(r => r.on)));
ok('C3 圆点跟着亮/灰', C1[2].dot === false && C1[0].dot === true, JSON.stringify(C1.map(r => r.dot)));
ok('C4 aria-selected 同步 + 指针可点', C1[2].sel === 'true' && C1[0].sel === 'false' && C1[2].cur === 'pointer', JSON.stringify([C1[2].sel, C1[0].sel, C1[2].cur]));
/* 另一组互不影响 */
await p.click('#udTreeHead'); await wait(60); await p.click('#udTreeHead'); await wait(60);
const C5 = await p.evaluate(() => document.querySelector('#udStates .ud-state:nth-child(3)').classList.contains('is-on'));
ok('C5 折叠再展开后选中不丢', C5);

/* ---------- ④ 头底距 = 0 ---------- */
const D = await p.evaluate(() => {
  const h = document.querySelector('.ud-pages-head'), t = document.querySelector('.ud-pages-t'), card = document.querySelector('.ud-tree');
  const cs = getComputedStyle(h);
  const hr = h.getBoundingClientRect(), cr = card.getBoundingClientRect();
  return { pad: cs.padding, pb: cs.paddingBottom, headH: Math.round(hr.height), cardTop: Math.round(cr.top - hr.top) };
});
ok('D1 .ud-pages-head padding-bottom = 0px', D.pb === '0px', D.pad);
ok('D2 标题头 41 高（13 + 28），卡片顶距 50 不变', D.headH === 41 && D.cardTop === 50, JSON.stringify([D.headH, D.cardTop]));

/* ---------- ⑤ 版本下拉 6px ---------- */
const E = await p.evaluate(() => {
  const dd = document.querySelector('.ud-dd');
  dd.classList.add('is-open');
  const t = document.getElementById('udVer').getBoundingClientRect();
  const l = dd.querySelector('.semi-select-option-list-wrapper').getBoundingClientRect();
  const r = { gap: Math.round(l.top - t.bottom), items: [...dd.querySelectorAll('.semi-select-option')].map(e => e.textContent.trim()) };
  dd.classList.remove('is-open');
  return r;
});
ok('E1 版本下拉距触发器 6px', E.gap === 6, E.gap);
ok('E2 选项 = 当前设计 / 历史基线', E.items.join('|') === '当前设计|历史基线', E.items.join('|'));

/* ---------- ⑥ hover 深一级 ---------- */
await p.mouse.move(760, 760); await wait(220);   /* 先把鼠标挪开，别让上一轮的 :hover 残留 */
const F0 = await p.evaluate(() => {
  const cs = s => getComputedStyle(document.querySelector(s)).backgroundColor;
  return { tool: cs('.ud-tool'), row: cs('.ud-tree-row') };
});
ok('F1 常态无底色（白 / 透明白）', /rgba?\(255, 255, 255/.test(F0.tool) && F0.row === 'rgba(0, 0, 0, 0)', JSON.stringify(F0));
await p.hover('.ud-tools .ud-tool');
await wait(200);
const F1 = await p.evaluate(() => getComputedStyle(document.querySelector('.ud-tools .ud-tool')).backgroundColor);
ok('F2 .ud-tool hover = #F2F2F2（深一级）', F1 === 'rgb(242, 242, 242)', F1);
await p.hover('.ud-tree-row');
await wait(220);
const F2 = await p.evaluate(() => getComputedStyle(document.querySelector('.ud-tree-row')).backgroundColor);
ok('F3 .ud-tree-row hover = #F2F2F2（深一级）', F2 === 'rgb(242, 242, 242)', F2);

/* ---------- 无脚本报错 ---------- */
ok('G1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));

await b.close();
console.log('\n第 99 轮：' + pass + ' 通过' + (fail.length ? '，' + fail.length + ' 失败' : ''));
if (fail.length) { fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
