/* 第 42 轮：浮标视觉截图（折叠态 / 展开态 / 去处理后） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage();
p.on('pageerror', e => console.log('ERR', e.message));
await p.setViewport({ width: 1440, height: 900 });
await p.evaluateOnNewDocument(() => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
await p.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(600);
await p.click('.wd-collapse');
await wait(1500);
const info = await p.evaluate(() => {
  const t = document.getElementById('fpTip');
  const a = t.querySelector('.fp-arrow').getBoundingClientRect();
  const r = t.getBoundingClientRect();
  const btn = document.querySelector('.menu-btn').getBoundingClientRect();
  return { on: t.classList.contains('is-on'), x: r.x, y: r.y, w: r.width, h: r.height,
    arrowCy: +(a.y + a.height / 2).toFixed(1), btnCy: +(btn.y + btn.height / 2).toFixed(1),
    txt: t.querySelector('.fp-text').textContent.trim(), op: getComputedStyle(t).opacity };
});
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: 'ref42-float.png' });
await p.screenshot({ path: 'ref42-float-zoom.png', clip: { x: 0, y: 40, width: 420, height: 150 } });
/* hover 去处理 */
const go = await p.$('#fpGo');
const gb = await go.boundingBox();
await p.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2);
await wait(260);
await p.screenshot({ path: 'ref42-hover.png', clip: { x: 0, y: 40, width: 420, height: 150 } });
/* 去处理 */
await p.mouse.click(gb.x + gb.width / 2, gb.y + gb.height / 2);
await wait(1200);
const after = await p.evaluate(() => ({
  open: document.getElementById('wsDrawer').classList.contains('is-open'),
  tab: (document.querySelector('.wd-tab.is-active') || {}).textContent,
  focus: !!document.querySelector('.wd-card.is-fp-focus')
}));
console.log('after go', JSON.stringify(after));
await p.screenshot({ path: 'ref42-after-go.png' });
await p.close();
await b.close();
