/* 第 87 轮验收：UI设计工序页 —— 左栏右侧 1px 分隔线补齐（白底遮住外阴影的问题）
   + 工序条下方复用 task-tabs（UI设计 / 校验差异与记录 / ＋ / 专注模式，稿 4068:69848） */
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
await p.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(300);
const menu = await p.$('.menu-btn');
if (menu) { await menu.click(); await wait(500); }

/* ---------- A 左栏右侧分隔线 ---------- */
const a = await p.evaluate(() => {
  const ws = document.getElementById('wsDrawer');
  const blank = document.querySelector('.ui-blank');
  const tabs = document.querySelector('.task-tabs');
  const wr = ws.getBoundingClientRect(), br = blank.getBoundingClientRect(), tr = tabs.getBoundingClientRect();
  const bs = getComputedStyle(blank).boxShadow;
  return {
    wsOpen: ws.classList.contains('is-open'),
    wsObs: getComputedStyle(ws).boxShadow,
    blankShadow: bs,
    shared: Math.abs(wr.right - br.left) < 1,
    hasInset: /inset/.test(bs) && /rgb\(235, 236, 237\)/.test(bs),
    tabsIn: Math.abs(tr.left - br.left) < 1 && Math.abs(tr.right - br.right) < 1,
  };
});
ok('A1 左栏展开、中栏白底与左栏右边缘同一条线（x 对齐）', a.wsOpen && a.shared, JSON.stringify(a));
ok('A2 .ui-blank 自带 1px 内阴影 #EBECED（不再被 z-index 3 的白底盖掉外阴影）', a.hasInset, a.blankShadow);

/* ---------- B 页签条几何 ---------- */
const bb = await p.evaluate(() => {
  const tabs = document.querySelector('.task-tabs');
  const steps = document.querySelector('.task-steps');
  const blank = document.querySelector('.ui-blank');
  const tr = tabs.getBoundingClientRect(), sr = steps.getBoundingClientRect(), br = blank.getBoundingClientRect();
  const cs = getComputedStyle(tabs);
  const tabsAll = [...tabs.querySelectorAll('.tk-tab')].map(t => {
    const r = t.getBoundingClientRect(), c = getComputedStyle(t);
    return { txt: t.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), on: t.classList.contains('is-on'), bg: c.backgroundColor, sh: c.boxShadow, fw: c.fontWeight, pad: c.paddingLeft };
  });
  const vs = tabs.querySelector('.tk-vsep').getBoundingClientRect();
  const plus = tabs.querySelector('.tk-tabs-l .tk-icon-btn').getBoundingClientRect();
  const focus = document.getElementById('tkFocus');
  const fr = focus.getBoundingClientRect();
  return {
    h: Math.round(tr.height), top: Math.round(tr.y), stepsBottom: Math.round(sr.bottom),
    blankTop: Math.round(br.y - document.querySelector('.panel').getBoundingClientRect().y), blankGap: Math.round(br.y - tr.bottom),
    bg: cs.backgroundColor, bottomLine: /rgb\(229, 229, 229\) 0px -1px/.test(cs.boxShadow),
    padL: cs.paddingLeft, tabsAll, vs: [Math.round(vs.width), Math.round(vs.height), Math.round(vs.x)],
    plus: [Math.round(plus.width), Math.round(plus.height), Math.round(plus.x)],
    focus: [Math.round(fr.width), Math.round(fr.height), Math.round(fr.x), getComputedStyle(focus).color],
    tabsRight: Math.round(tr.right),
  };
});
ok('B1 工序条下方有一条 40 高的页签条，紧贴工序条底', bb.h === 40 && Math.abs(bb.top - bb.stepsBottom) < 1, bb.top + '/' + bb.stepsBottom);
ok('B2 页签条左内距 19、底边 1px #E5E5E5 分隔线', bb.padL === '19px' && bb.bottomLine, bb.padL);
ok('B3 第 1 颗页签「UI设计」66×28 选中：白底 + 1px #EEEEEE 描边 + 500', bb.tabsAll[0] && bb.tabsAll[0].txt === 'UI设计' && bb.tabsAll[0].w === 66 && bb.tabsAll[0].h === 28 && bb.tabsAll[0].on && bb.tabsAll[0].bg === 'rgb(255, 255, 255)' && /rgb\(238, 238, 238\)/.test(bb.tabsAll[0].sh) && bb.tabsAll[0].fw === '500', JSON.stringify(bb.tabsAll[0]));
ok('B4 第 2 颗页签「校验差异与记录」122×28 非选中（透明底、无描边）', bb.tabsAll[1] && bb.tabsAll[1].txt === '校验差异与记录' && bb.tabsAll[1].w === 122 && bb.tabsAll[1].h === 28 && !bb.tabsAll[1].on && bb.tabsAll[1].bg === 'rgba(0, 0, 0, 0)' && bb.tabsAll[1].sh === 'none', JSON.stringify(bb.tabsAll[1]));
ok('B5 两颗页签之后是 1×16 竖线，再是 28×28 的「＋」', bb.vs[0] === 1 && bb.vs[1] === 16 && bb.plus[0] === 28 && bb.plus[1] === 28 && bb.plus[2] - bb.vs[2] > 1 && bb.vs[2] > bb.tabsAll[1].x + bb.tabsAll[1].w - 1, JSON.stringify(bb.vs) + ' plus=' + JSON.stringify(bb.plus));
ok('B6 右端「专注模式」80×28、主色 #3770F7、右内距 20', bb.focus[0] === 80 && bb.focus[1] === 28 && bb.focus[3] === 'rgb(55, 112, 247)' && Math.abs(bb.tabsRight - (bb.focus[2] + 80) - 20) < 1, JSON.stringify(bb.focus));
ok('B7 中栏正文从页签条下沿起（171 = 131 + 40，无缝隙）', bb.blankTop === 171 && bb.blankGap === 0, bb.blankTop + '/' + bb.blankGap);

/* ---------- C 工序条折叠 / 专注模式 ---------- */
await p.evaluate(() => document.querySelector('.panel-main').classList.add('is-steps-off'));
await wait(420);
const c1 = await p.evaluate(() => {
  const t = document.querySelector('.task-tabs').getBoundingClientRect();
  const bl = document.querySelector('.ui-blank').getBoundingClientRect();
  return { tabsTop: Math.round(t.y - document.querySelector('.panel').getBoundingClientRect().y), blankTop: Math.round(bl.y), gap: Math.round(bl.y - t.bottom) };
});
ok('C1 工序条折叠后页签条升到 44、正文 84（仍贴合）', c1.tabsTop === 44 && c1.gap === 0, JSON.stringify(c1));
await p.evaluate(() => document.querySelector('.panel-main').classList.remove('is-steps-off'));
await wait(420);

await p.click('#tkFocus'); await wait(620);
const c2 = await p.evaluate(() => {
  const t = document.querySelector('.task-tabs').getBoundingClientRect();
  const bl = document.querySelector('.ui-blank').getBoundingClientRect();
  return { on: document.body.classList.contains('is-focus'), tabsTop: Math.round(t.y - document.querySelector('.panel').getBoundingClientRect().y), gap: Math.round(bl.y - t.bottom), ws: document.getElementById('wsDrawer').classList.contains('is-open') };
});
ok('C2 专注模式：页签条贴顶、正文紧随其后、左栏收起', c2.on && c2.tabsTop === 0 && c2.gap === 0 && !c2.ws, JSON.stringify(c2));
await p.click('#tkFocus'); await wait(620);
const c3 = await p.evaluate(() => {
  const t = document.querySelector('.task-tabs').getBoundingClientRect();
  const bl = document.querySelector('.ui-blank').getBoundingClientRect();
  return { on: document.body.classList.contains('is-focus'), tabsTop: Math.round(t.y - document.querySelector('.panel').getBoundingClientRect().y), blankTop: Math.round(bl.y - document.querySelector('.panel').getBoundingClientRect().y), ws: document.getElementById('wsDrawer').classList.contains('is-open') };
});
ok('C3 退出专注：页签条回 131、正文 171、左栏恢复', !c3.on && c3.tabsTop === 131 && c3.blankTop === 171 && c3.ws, JSON.stringify(c3));

/* ---------- D 页签交互 ---------- */
await p.evaluate(() => document.querySelectorAll('.task-tabs .tk-tab')[1].click());
await wait(150);
const d1 = await p.evaluate(() => [...document.querySelectorAll('.task-tabs .tk-tab')].map(t => t.textContent.trim() + ':' + t.classList.contains('is-on')));
ok('D1 点「校验差异与记录」→ 选中态迁移过去', d1[1].endsWith(':true') && d1[0].endsWith(':false'), JSON.stringify(d1));
await p.evaluate(() => document.querySelectorAll('.task-tabs .tk-tab')[0].click());
await wait(150);
const d2 = await p.evaluate(() => [...document.querySelectorAll('.task-tabs .tk-tab')].map(t => t.textContent.trim() + ':' + t.classList.contains('is-on')));
ok('D2 点回「UI设计」→ 选中态回到第 1 颗', d2[0].endsWith(':true') && d2[1].endsWith(':false'), JSON.stringify(d2));

/* ---------- E 窄窗不溢出 ---------- */
const narrow = [];
for (const w of [1152, 1280, 1920]) {
  await p.setViewport({ width: w, height: 900 });
  await wait(320);
  narrow.push(await p.evaluate(() => {
    const tabs = document.querySelector('.task-tabs');
    const l = document.querySelector('.tk-tabs-l');
    const r = document.getElementById('tkFocus').getBoundingClientRect();
    const tr = tabs.getBoundingClientRect();
    return {
      w: innerWidth, overflowX: document.documentElement.scrollWidth - innerWidth,
      tabsH: Math.round(tr.height), lScroll: l.scrollWidth > l.clientWidth + 1,
      focusInside: r.right <= tr.right + 1 && r.left >= tr.left - 1,
    };
  }));
}
ok('E1 1152/1280/1920 三档：页面无横向溢出、页签条 40 高、专注模式始终在条内', narrow.every(n => n.overflowX <= 0 && n.tabsH === 40 && n.focusInside), JSON.stringify(narrow));
await p.screenshot({ path: 'tmp-87-final.png' });

ok('F1 无 console / pageerror', p.__e.length === 0, JSON.stringify(p.__e));
await b.close();
console.log('\n第 87 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) console.log('FAIL:\n - ' + fail.join('\n - '));
