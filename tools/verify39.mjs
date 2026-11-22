/* 交付版：第 39 轮验收（默认展开只作用首页 / 工具行统一 / 内容列 960 / 稿面视觉） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1440, h = 900, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(700);
  return p;
}
const drawerOpen = p => p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'));
const cs = (p, s, prop) => p.evaluate((s, pr) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, s, prop);
const rect = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; }, s);

/* ============ A 默认展开只作用于首页 ============ */
let p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); });
ok('A1 首页空 localStorage → 左栏展开', await drawerOpen(p));
await p.close();

p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); });
ok('A2 首页手动收过 → 保持收起', !(await drawerOpen(p)));
await p.close();

p = await mk('cecoder-session.html?id=0', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); });
ok('A3 会话页仍自动展开（老逻辑不受影响）', await drawerOpen(p));
ok('A4 会话页无报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

p = await mk('cecoder-task.html?id=0', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); });
ok('A5 任务页仍自动展开', await drawerOpen(p));
await p.close();

/* ============ B 两个页签的工具行完全一致 ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wdTab', '会话'); });
const geoSession = await p.evaluate(() => {
  const d = document.getElementById('wsDrawer').getBoundingClientRect();
  const pick = s => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x - d.x), Math.round(r.width), Math.round(r.height)]; });
  return { adddir: pick('.wd-adddir'), btns: pick('.wd-tools-r .wd-icon-btn'), hasSess: !!document.querySelector('.wd-sess-search, #wdSessSearch'), adddirVisible: getComputedStyle(document.querySelector('.wd-adddir')).display !== 'none' };
});
ok('B1 会话页签也有「添加工作目录」且可见', geoSession.adddirVisible && geoSession.adddir[0][1] > 0, JSON.stringify(geoSession.adddir));
ok('B2 会话页签保留搜索 + 排序两枚按钮', geoSession.btns.length === 2, JSON.stringify(geoSession.btns));
ok('B3 旧的内联搜索框已移除（DOM 无残留）', geoSession.hasSess === false);
ok('B4 会话页签 添加工作目录 16..224 / 208 宽', geoSession.adddir[0][0] === 16 && geoSession.adddir[0][1] === 208, JSON.stringify(geoSession.adddir[0]));
ok('B5 会话页签 搜索 232 / 排序 272', geoSession.btns[0][0] === 232 && geoSession.btns[1][0] === 272, JSON.stringify(geoSession.btns));
ok('B6 会话页签 搜索框占位＝搜索会话关键词', (await p.evaluate(() => document.getElementById('wdSearchInput').placeholder)) === '搜索会话关键词');
ok('B7 会话页签 搜索键 aria-label＝搜索会话', (await p.evaluate(() => document.getElementById('wdSearchBtn').getAttribute('aria-label'))) === '搜索会话');

/* 切到任务页签：同一套几何，只换文案 */
await p.evaluate(() => document.querySelector('[data-wd-tab="任务"]').click());
await wait(350);
const geoTask = await p.evaluate(() => {
  const d = document.getElementById('wsDrawer').getBoundingClientRect();
  const pick = s => [...document.querySelectorAll(s)].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.x - d.x), Math.round(r.width), Math.round(r.height)]; });
  return { adddir: pick('.wd-adddir'), btns: pick('.wd-tools-r .wd-icon-btn') };
});
ok('B8 切到任务页签几何不变', JSON.stringify(geoTask) === JSON.stringify({ adddir: geoSession.adddir, btns: geoSession.btns }), JSON.stringify(geoTask));
ok('B9 任务页签 搜索框占位＝搜索关键词', (await p.evaluate(() => document.getElementById('wdSearchInput').placeholder)) === '搜索关键词');
ok('B10 任务页签 搜索键 aria-label＝搜索任务', (await p.evaluate(() => document.getElementById('wdSearchBtn').getAttribute('aria-label'))) === '搜索任务');

/* 会话页签的搜索是真的能过滤会话卡 */
await p.evaluate(() => document.querySelector('[data-wd-tab="会话"]').click());
await wait(300);
await p.evaluate(() => document.getElementById('wdSearchBtn').click());
await wait(400);
ok('B11 点搜索 → 浮层展开（is-searching）', await p.evaluate(() => document.getElementById('wdTools').classList.contains('is-searching')));
await p.type('#wdSearchInput', '审计');
await wait(300);
const filt = await p.evaluate(() => {
  const vis = [...document.querySelectorAll('#wdViewSession .wd-sess-card')].filter(c => c.style.display !== 'none').length;
  return vis;
});
ok('B12 输入关键词只留命中的会话卡', filt >= 1 && filt <= 2, 'visible=' + filt);
await p.evaluate(() => { const i = document.getElementById('wdSearchInput'); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
await wait(350);
ok('B13 Esc 收起搜索并清空', await p.evaluate(() => !document.getElementById('wdTools').classList.contains('is-searching') && document.getElementById('wdSearchInput').value === ''));
ok('B14 清空后会话卡全部回来', await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].every(c => c.style.display !== 'none')));
ok('B15 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ C 内容列 960 + 自适应收窄 ============ */
const stageBox = p => p.evaluate(() => {
  const s = document.querySelector('.stage'), m = document.querySelector('.panel-main');
  const sr = s.getBoundingClientRect(), mr = m.getBoundingClientRect();
  return { stage: Math.round(sr.width), main: Math.round(mr.width), scrollW: s.scrollWidth, clientW: s.clientWidth };
});

p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); localStorage.setItem('cecoder.wdTab', '任务'); });
let sb = await stageBox(p);
ok('C1 1440 抽屉收起 → 内容列 960', sb.stage - 12 === 960, JSON.stringify(sb));
ok('C2 无横向溢出', sb.scrollW <= sb.clientW + 1, JSON.stringify(sb));
await p.evaluate(() => document.querySelector('.menu-btn').click());
await wait(500);
sb = await stageBox(p);
ok('C3 1440 抽屉展开 → 仍 960', sb.stage - 12 === 960, JSON.stringify(sb));
await p.setViewport({ width: 1280, height: 800 });
await wait(400);
sb = await stageBox(p);
ok('C4 1280 抽屉展开 → 收窄到 可用宽-12', sb.stage === sb.main - 12 && sb.stage - 12 < 960, JSON.stringify(sb));
ok('C5 1280 无横向溢出', sb.scrollW <= sb.clientW + 1, JSON.stringify(sb));
await p.setViewport({ width: 960, height: 700 });
await wait(400);
sb = await stageBox(p);
ok('C6 960 窄窗 → 继续收窄', sb.stage === sb.main - 12 && sb.stage - 12 < 960, JSON.stringify(sb));
await p.close();

/* 右栏展开时也要缩 */
p = await mk('cecoder-session.html?id=0', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); });
await wait(400);
const before = await stageBox(p);
await p.evaluate(() => { const t = document.getElementById('rsToggle'); if (t) t.click(); });
await wait(600);
const after = await stageBox(p);
ok('C7 右栏展开 → 内容列显著收窄', after.stage < before.stage - 100, JSON.stringify({ before, after }));
ok('C8 右栏展开 → 仍等于 可用宽-12', after.stage === after.main - 12, JSON.stringify(after));
ok('C9 右栏展开 → 无横向溢出', after.scrollW <= after.clientW + 1, JSON.stringify(after));
await p.close();

/* ============ D 稿面视觉（渐变 / panel 无边框 / 顶栏磨砂） ============ */
p = await mk('cecoder-home.html', 1440, 900, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); localStorage.setItem('cecoder.wdTab', '任务'); });
const vis = await p.evaluate(() => {
  const g = (s, props) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); const o = {}; props.forEach(k => o[k] = c[k]); return o; };
  const f = document.querySelector('.cds-frame');
  return {
    bgAttr: f.dataset.bg,
    bgImg: getComputedStyle(f).backgroundImage,
    panel: (() => { const e = document.querySelector('.panel'); const c = getComputedStyle(e); const r = e.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), border: c.borderTopWidth, radius: c.borderRadius, bg: c.backgroundColor, shadow: c.boxShadow }; })(),
    ws: g('.tb-ws-btn', ['backgroundColor', 'backdropFilter', 'borderTopWidth', 'color', 'borderRadius']),
    avatar: g('.tb-ws-avatar', ['backgroundColor']),
    help: g('.tb-btn', ['backgroundColor', 'backdropFilter', 'borderTopWidth', 'color']),
    seg: g('.tb-seg', ['backgroundColor', 'borderTopWidth']),
    segItem: g('.seg-item', ['color']),
    pill: g('.seg-pill', ['backgroundColor', 'borderRadius']),
    stageTop: Math.round(document.querySelector('.stage').getBoundingClientRect().y),
  };
});
ok('D1 背景切到 design', vis.bgAttr === 'design', vis.bgAttr);
ok('D2 背景是稿件渐变', /linear-gradient/.test(vis.bgImg) && vis.bgImg.includes('178, 208, 249'), vis.bgImg);
ok('D3 panel 8,48 1424x852', vis.panel.x === 8 && vis.panel.y === 48 && vis.panel.w === 1424 && vis.panel.h === 852, JSON.stringify(vis.panel));
ok('D4 panel 无边框', vis.panel.border === '0px', vis.panel.border);
ok('D5 panel 圆角 8 8 0 0', vis.panel.radius.replace(/\s/g, '') === '8px8px0px0px', vis.panel.radius);
ok('D6 工作空间胶囊 磨砂白 + blur15 + 无边框', vis.ws.backgroundColor === 'rgba(255, 255, 255, 0.6)' && vis.ws.backdropFilter === 'blur(15px)' && vis.ws.borderTopWidth === '0px', JSON.stringify(vis.ws));
ok('D7 胶囊文字 #455973', vis.ws.color === 'rgb(69, 89, 115)', vis.ws.color);
ok('D8 头像 #3491FA', vis.avatar.backgroundColor === 'rgb(52, 145, 250)', vis.avatar.backgroundColor);
ok('D9 顶栏右按钮磨砂白无描边', vis.help.backgroundColor === 'rgba(255, 255, 255, 0.6)' && vis.help.backdropFilter === 'blur(15px)' && vis.help.borderTopWidth === '0px', JSON.stringify(vis.help));
ok('D10 顶栏右按钮文字 #455973', vis.help.color === 'rgb(69, 89, 115)', vis.help.color);
ok('D11 分段控件轨道 rgba(31,68,118,.12)', vis.seg.backgroundColor === 'rgba(31, 68, 118, 0.12)', vis.seg.backgroundColor);
ok('D12 分段选中底板白 + r6', vis.pill.backgroundColor === 'rgb(255, 255, 255)' && vis.pill.borderRadius === '6px', JSON.stringify(vis.pill));
ok('D13 分段文字 #1F1F1F', vis.segItem.color === 'rgb(31, 31, 31)', vis.segItem.color);
ok('D14 去边框后内容列顶部仍 198', vis.stageTop === 198, String(vis.stageTop));
ok('D15 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.screenshot({ path: 'ref39-visual.png' });
await p.close();

console.log('pass', pass, 'fail', fail.length);
if (fail.length) { console.log('FAIL:\n - ' + fail.join('\n - ')); process.exitCode = 1; } else console.log('ALL OK');
await b.close();
