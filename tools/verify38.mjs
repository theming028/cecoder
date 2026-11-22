/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1440, h = 900, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  /* 种子只在首次文档生效：evaluateOnNewDocument 每次导航都会跑，
     不加这道闸，reload 会把刚存下的「收起记忆」又清掉，测出假红 */
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + ROOT + '/' + url, { waitUntil: 'load' });
  await wait(650);
  return p;
}
const drawerOpen = p => p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'));
const tabOrder = p => p.evaluate(() => {
  const d = document.getElementById('wsDrawer').getBoundingClientRect();
  return [...document.querySelectorAll('.wd-tab')].map(t => t.dataset.wdTab + '@' + Math.round(t.getBoundingClientRect().x - d.x));
});
const activeTab = p => p.evaluate(() => { const t = document.querySelector('.wd-tab.is-active'); return t ? t.dataset.wdTab : null; });

/* ============ A 左栏默认展开 ============ */
let p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); });
ok('A1 首次进入（空 localStorage）左栏展开', await drawerOpen(p));
ok('A2 aria-hidden=false', await p.evaluate(() => document.getElementById('wsDrawer').getAttribute('aria-hidden')) === 'false');
ok('A3 菜单键 aria-expanded=true', await p.evaluate(() => document.querySelector('.menu-btn').getAttribute('aria-expanded')) === 'true');
ok('A4 宽度回到 320', await p.evaluate(() => Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width)) === 320);
ok('A5 首屏无闪动残留（no-anim 已撤）', !(await p.evaluate(() => document.getElementById('wsDrawer').classList.contains('no-anim'))));
ok('A6 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

/* 会话页 / 任务页同样默认展开 */
await p.close();
p = await mk('cecoder-session.html?id=0', 1440, 900, () => { localStorage.clear(); });
ok('A7 会话页默认展开', await drawerOpen(p));
ok('A8 会话页无重复展开动画（宽度已就位）', (await p.evaluate(() => Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width))) === 320);
await p.close();
p = await mk('cecoder-task.html?id=0', 1440, 900, () => { localStorage.clear(); });
ok('A9 任务页默认展开', await drawerOpen(p));
await p.close();

/* ============ B 手动收起后记忆不被覆盖 ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); });
await p.evaluate(() => document.querySelector('.wd-collapse').click());
await wait(400);
ok('B1 点收起键 → 收起', !(await drawerOpen(p)));
ok('B2 写入 open:false', await p.evaluate(() => JSON.parse(localStorage.getItem('cecoder.wsDrawer') || '{}').open) === false);
await p.reload({ waitUntil: 'load' }); await wait(500);
ok('B3 重载后重新展开（第 41 轮：首页不再记忆收起）', await drawerOpen(p));
/* 再展开一次 → 记忆为 true */
await p.evaluate(() => document.querySelector('.menu-btn').click());
await wait(400);
await p.reload({ waitUntil: 'load' }); await wait(500);
ok('B4 展开后重载仍展开', await drawerOpen(p));
await p.close();

/* ============ C 新建任务回首页仍是首屏 hero（显式 open:false 仍生效） ============ */
p = await mk('cecoder-session.html?tab=%E4%BC%9A%E8%AF%9D&id=1', 1440, 900, () => { localStorage.clear(); });
await p.evaluate(() => document.querySelector('.wd-link[data-action="新建任务"]').click());
await wait(750);
ok('C1 回首页', p.url().endsWith('cecoder-home.html'), p.url());
ok('C2 落地首页左栏展开（第 41 轮：首页永远展开）', await drawerOpen(p), p.url());
await p.close();

/* ============ D 页签顺序互换 ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); });
const order = await tabOrder(p);
ok('D1 会话在前、任务在后', order[0].startsWith('会话') && order[1].startsWith('任务'), order.join(' / '));
ok('D2 会话 x=16 / 任务 x=162', /@16$/.test(order[0]) && /@162$/.test(order[1]), order.join(' / '));
ok('D3 默认选中改成「会话」', (await activeTab(p)) === '会话');
ok('D4 「12」角标跟着会话', await p.evaluate(() => document.querySelector('.wd-tab .wd-tab-num').parentElement.dataset.wdTab) === '会话');
ok('D5 默认落在会话视图（任务视图隐藏）', await p.evaluate(() => document.getElementById('wdViewSession').hidden === false && document.getElementById('wdViewTask').hidden === true));
ok('D6 会话页签工具行＝添加工作目录 + 搜索 + 排序（第 39 轮统一）', await p.evaluate(() => { const a = document.querySelector('.wd-adddir'); return getComputedStyle(a).display !== 'none' && a.getBoundingClientRect().width > 200 && !document.querySelector('.wd-sess-search, #wdSessSearch'); }));
/* 点右侧「任务」应切到任务视图 */
await p.evaluate(() => document.querySelector('[data-wd-tab="任务"]').click());
await wait(350);
ok('D7 点任务 → 选中任务', (await activeTab(p)) === '任务');
ok('D8 任务视图显示、会话视图隐藏', await p.evaluate(() => document.getElementById('wdViewTask').hidden === false && document.getElementById('wdViewSession').hidden === true));
ok('D9 任务页签工具行同样三件套', await p.evaluate(() => { const a = document.querySelector('.wd-adddir'); return getComputedStyle(a).display !== 'none' && a.getBoundingClientRect().width > 200; }));
ok('D10 侧栏宽度不变', (await p.evaluate(() => Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width))) === 320);
/* 未选中页签的底色/底线仍成立（交换后两个 tab 的样式不串） */
ok('D11 选中 tab 无底线 / 未选中带底线', await p.evaluate(() => {
  const on = document.querySelector('.wd-tab.is-active'), off = document.querySelector('.wd-tab:not(.is-active)');
  return getComputedStyle(on).boxShadow === 'none' && getComputedStyle(off).boxShadow.includes('inset');
}));
ok('D12 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ E 页签记忆 + 子页面强制 ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wdTab', '会话'); });
ok('E1 记忆为会话 → 首页停在会话', (await activeTab(p)) === '会话');
await p.close();
p = await mk('cecoder-session.html?id=0', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wdTab', '任务'); });
ok('E2 会话页强制会话页签', (await activeTab(p)) === '会话');
await p.close();
p = await mk('cecoder-task.html?id=0', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wdTab', '会话'); });
ok('E3 任务页强制任务页签', (await activeTab(p)) === '任务');
ok('E4 任务页左栏展开', await drawerOpen(p));
await p.close();

/* ============ F 截图 ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); });
await wait(500);
await p.screenshot({ path: 'ref38-home-open.png' });
await p.evaluate(() => document.querySelector('[data-wd-tab="任务"]').click());
await wait(450);
await p.screenshot({ path: 'ref38-home-session.png' });
await p.close();

console.log('pass', pass, 'fail', fail.length);
if (fail.length) { console.log('FAIL:\n - ' + fail.join('\n - ')); process.exitCode = 1; }
else console.log('ALL OK');
await b.close();
