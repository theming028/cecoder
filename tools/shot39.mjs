/* 交付版：第 39 轮视觉比对 —— 1440x900，左栏收起（=稿件状态） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await p.evaluate(() => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); localStorage.setItem('cecoder.wdTab', '任务'); localStorage.removeItem('cecoder.rsDrawer'); });
await p.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 700));

const out = await p.evaluate(() => {
  const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), bg: c.backgroundColor, bgImg: (c.backgroundImage || '').slice(0, 90), bd: c.borderTopWidth, bf: c.backdropFilter, color: c.color, r: c.borderRadius }; };
  return {
    frame: (() => { const c = getComputedStyle(document.querySelector('.cds-frame')); return { bg: c.backgroundImage.slice(0, 120), attr: document.querySelector('.cds-frame').dataset.bg }; })(),
    panel: g('.panel'),
    ws: g('.tb-ws-btn'),
    help: (() => { const e = document.querySelectorAll('.tb-btn')[0]; const r = e.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; })(),
    set: (() => { const e = document.getElementById('tbSettings'); const r = e.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; })(),
    seg: g('.tb-seg'),
    segItem: g('.seg-item'),
    stage: g('.stage'),
    errors: [],
  };
});
console.log(JSON.stringify(out, null, 1));
await p.screenshot({ path: 'ref39-home-collapsed.png' });
await p.evaluate(() => document.querySelector('.menu-btn').click());
await new Promise(r => setTimeout(r, 600));
const openW = await p.evaluate(() => Math.round(document.querySelector('.stage').getBoundingClientRect().width));
await p.screenshot({ path: 'ref39-home-open.png' });
console.log('drawer open → stage 盒宽', openW, '内容宽', openW - 12);
/* 窄窗 + 右栏：验证内容自适应 */
await p.setViewport({ width: 1280, height: 800 });
await new Promise(r => setTimeout(r, 400));
const narrow = await p.evaluate(() => { const s = document.querySelector('.stage').getBoundingClientRect(), m = document.querySelector('.panel-main').getBoundingClientRect(); return { stage: Math.round(s.width), main: Math.round(m.width), x: Math.round(s.x) }; });
console.log('1280 抽屉展开 →', JSON.stringify(narrow));
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
