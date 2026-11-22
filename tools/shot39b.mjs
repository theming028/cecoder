const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function shot(url, file, seed) {
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  if (seed) await p.evaluate(seed);
  await p.reload({ waitUntil: 'load' }); await wait(700);
  await p.screenshot({ path: file });
  console.log(file, 'errors:', errs.length ? errs.join('|') : 'none');
  await p.close();
}
await shot('cecoder-home.html?tab=%E4%BC%9A%E8%AF%9D', 'ref39-session-tab.png', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '会话'); });
await shot('cecoder-session.html?id=0', 'ref39-chat.png', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); });
await shot('cecoder-task.html?id=0', 'ref39-task.png', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
await b.close();
