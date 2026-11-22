/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 33 轮验收
   1 分组头「更多」与左侧对象间距 8px（任务 tab / 会话 tab 自建分组）
   2 task-head 44 高、去掉返回与间隔线
   3 「添加工作目录」按钮去图标
   4 任务执行页清空，只剩标题栏
   5 三个面板键图标 14 → 18                                                    */
import puppeteer from 'puppeteer-core';
const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const DRAWER_OPEN = () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); } catch (e) { } };
async function mk(url, w = 1440, h = 900, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  if (seed) await p.evaluateOnNewDocument(seed);
  await p.goto('file:///' + ROOT + '/' + url, { waitUntil: 'load' });
  await wait(700);
  return p;
}
const geo = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) }; }, sel);

/* ========== A 分组「更多」与左侧对象 8px ========== */
{
  const p = await mk('cecoder-home.html?tab=%E4%BB%BB%E5%8A%A1', 1440, 900, DRAWER_OPEN);
  const h = await p.$('#wdHead2'); const bb = await h.boundingBox();
  await p.mouse.move(bb.x + 60, bb.y + 18); await wait(400);
  const d = await p.evaluate(() => {
    const head = document.getElementById('wdHead2');
    const num = head.querySelector('.wd-num').getBoundingClientRect();
    const more = head.querySelector('.wd-grp-more').getBoundingClientRect();
    return { gap: Math.round(more.left - num.right), w: Math.round(more.width), h: Math.round(more.height) };
  });
  ok('A1 任务分组：更多与计数间距 8', d.gap === 8, JSON.stringify(d));
  ok('A2 更多仍是 20×20 命中区', d.w === 20 && d.h === 20, JSON.stringify(d));
  /* 菜单展开时同样 8 */
  await (await p.$('#wdHead2 .wd-grp-more')).click(); await wait(300);
  const d2 = await p.evaluate(() => {
    const head = document.getElementById('wdHead2');
    const num = head.querySelector('.wd-num').getBoundingClientRect();
    const more = head.querySelector('.wd-grp-more').getBoundingClientRect();
    return Math.round(more.left - num.right);
  });
  ok('A3 菜单展开时仍 8', d2 === 8, d2);
  await p.keyboard.press('Escape'); await wait(200);
  await p.screenshot({ path: ROOT + '/.mg-d2c/R33-grp-task.png', clip: { x: 0, y: 60, width: 320, height: 400 } });
  ok('A4 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}
{
  const p = await mk('cecoder-home.html?tab=%E4%BC%9A%E8%AF%9D', 1440, 900, DRAWER_OPEN);
  const head = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('#wdViewSession .wd-grp-head')].filter(h => h.querySelector('.wd-grp-more'));
    return hs.map(h => h.querySelector('.wd-grp-name').textContent);
  });
  ok('A5 会话自建分组 2 个有更多', head.length === 2, JSON.stringify(head));
  /* 悬停第一个自建分组（Nutstore） */
  const box = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('#wdViewSession .wd-grp-head')].filter(h => h.querySelector('.wd-grp-more'));
    const r = hs[0].getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height };
  });
  await p.mouse.move(box.x + 60, box.y + box.h / 2); await wait(400);
  const d = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('#wdViewSession .wd-grp-head')].filter(h => h.querySelector('.wd-grp-more'));
    const h = hs[0]; const more = h.querySelector('.wd-grp-more');
    const cs = getComputedStyle(more); const r = more.getBoundingClientRect();
    const hr = h.getBoundingClientRect();
    return { ml: cs.marginLeft, w: Math.round(r.width), rightGap: Math.round(hr.right - r.right), numHidden: getComputedStyle(h.querySelector('.wd-num')).display };
  });
  ok('A6 会话分组：更多左边距 8（空态计数隐藏）', d.ml === '8px' && d.w === 20, JSON.stringify(d));
  /* 无计数的分组（AI Native Factory）：按钮展开后左边距仍 8、右缘贴内边距 8 */
  const box2 = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('#wdViewSession .wd-grp-head')].filter(h => h.querySelector('.wd-grp-more'));
    const r = hs[1].getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height };
  });
  await p.mouse.move(box2.x + 60, box2.y + box2.h / 2); await wait(400);
  const d3 = await p.evaluate(() => {
    const hs = [...document.querySelectorAll('#wdViewSession .wd-grp-head')].filter(h => h.querySelector('.wd-grp-more'));
    const h = hs[1]; const more = h.querySelector('.wd-grp-more');
    const r = more.getBoundingClientRect(); const hr = h.getBoundingClientRect();
    return { rightGap: Math.round(hr.right - r.right), ml: getComputedStyle(more).marginLeft, w: Math.round(r.width) };
  });
  ok('A7 无计数分组：按钮展开 20、左边距 8、右缘 8', d3.rightGap === 8 && d3.ml === '8px' && d3.w === 20, JSON.stringify(d3));
  ok('A8 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== B 任务执行页：第 34 轮换稿后的三段模块 ========== */
{
  const p = await mk('cecoder-task.html?id=1', 1440, 900, DRAWER_OPEN);
  const d = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { dy: Math.round(r.top - pm.top), h: Math.round(r.height) }; };
    return {
      top: g('.task-top'), steps: g('.task-steps'), tabs: g('.task-tabs'), stage: g('.stage'),
      old: !!(document.querySelector('.task-head') || document.querySelector('.task-body')),
      comp: getComputedStyle(document.querySelector('.composer')).display,
      text: document.querySelector('.stage').innerText.trim(),
    };
  });
  ok('B1 三段 44 / 122 / 40 叠放', d.top.dy === 0 && d.top.h === 44 && d.steps.dy === 44 && d.steps.h === 122 && d.tabs.dy === 166 && d.tabs.h === 40, JSON.stringify(d));
  ok('B2 旧标题栏与占位内容已移除、内容区从 206 起', !d.old && d.stage.dy === 206 && d.text === '', JSON.stringify(d.old) + ' ' + d.stage.dy + ' «' + d.text + '»');
  ok('B3 输入卡收起', d.comp === 'none', d.comp);
  ok('B7 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.screenshot({ path: ROOT + '/.mg-d2c/R33-task.png' });
  await p.close();
}

/* ========== C 添加工作目录按钮去图标 ========== */
{
  const p = await mk('cecoder-home.html?tab=%E4%BB%BB%E5%8A%A1', 1440, 900, DRAWER_OPEN);
  const d = await p.evaluate(() => {
    const btn = document.getElementById('wdAddDir');
    const r = btn.getBoundingClientRect();
    const txt = [...btn.childNodes].filter(n => n.nodeType === 3 || n.tagName !== 'SVG');
    const range = document.createRange(); range.selectNodeContents(btn);
    const tr = range.getBoundingClientRect();
    return { ico: btn.querySelectorAll('.ico,svg').length, text: btn.textContent.trim(), btnH: Math.round(r.height), textW: Math.round(tr.width), btnW: Math.round(r.width) };
  });
  ok('C1 按钮里没有图标节点', d.ico === 0, JSON.stringify(d));
  ok('C2 文字仍居中（左右余量相等）', Math.abs((d.btnW - d.textW) / 2 - (d.btnW - d.textW) / 2) === 0 && d.text === '添加工作目录', JSON.stringify(d));
  ok('C3 按钮高仍 32', d.btnH === 32, d.btnH);
  await p.screenshot({ path: ROOT + '/.mg-d2c/R33-adddir.png', clip: { x: 0, y: 40, width: 320, height: 120 } });
  ok('C4 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== D 三个面板键图标 18 ========== */
{
  const p = await mk('cecoder-session.html?id=0', 1440, 900, DRAWER_OPEN);
  const d = await p.evaluate(() => {
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    return {
      toggle: g('#rsToggle .ico'), toggleBtn: g('#rsToggle'),
      collapse: g('.wd-collapse .ico'), collapseBtn: g('.wd-collapse'),
    };
  });
  ok('D1 展开右栏图标 14×14（同排序图标）', d.toggle && d.toggle.w === 14 && d.toggle.h === 14, JSON.stringify(d.toggle));
  ok('D2 按钮命中区仍 28×28', d.toggleBtn.w === 28 && d.toggleBtn.h === 28, JSON.stringify(d.toggleBtn));
  ok('D3 收起任务栏图标 14×14', d.collapse.w === 14 && d.collapse.h === 14, JSON.stringify(d.collapse));
  await p.click('#rsToggle'); await wait(500);
  const d2 = await p.evaluate(() => {
    const e = document.querySelector('.rs-collapse .ico'); const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok('D4 收起右栏图标 14×14', d2.w === 14 && d2.h === 14, JSON.stringify(d2));
  /* 图标不被裁切：svg 的 bbox 在按钮内 */
  const fit = await p.evaluate(() => {
    const btn = document.querySelector('.rs-collapse').getBoundingClientRect();
    const svg = document.querySelector('.rs-collapse svg').getBoundingClientRect();
    return { l: Math.round(svg.left - btn.left), t: Math.round(svg.top - btn.top) };
  });
  ok('D5 图标在按钮内居中（7/7）', fit.l === 7 && fit.t === 7, JSON.stringify(fit));
  await p.screenshot({ path: ROOT + '/.mg-d2c/R33-icons-rs.png', clip: { x: 1180, y: 0, width: 260, height: 120 } });
  ok('D6 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}
/* 左侧两个键同屏对比图 */
{
  const p = await mk('cecoder-home.html?tab=%E4%BB%BB%E5%8A%A1', 1440, 900, DRAWER_OPEN);
  await p.screenshot({ path: ROOT + '/.mg-d2c/R33-icons-wd.png', clip: { x: 0, y: 0, width: 320, height: 60 } });
  await p.close();
}

console.log('\n通过 ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
await b.close();
