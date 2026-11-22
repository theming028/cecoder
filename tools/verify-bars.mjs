/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await page.addStyleTag({ content: '.stage{width:872px !important}' }); /* 第 11 轮：基线按稿件 860 校��� */
await new Promise(r => setTimeout(r, 350));

const rel = (sel, base) => page.evaluate(([sel, base]) => {
  const b = document.querySelector(base).getBoundingClientRect();
  const e = document.querySelector(sel);
  if (!e) return null;
  const r = e.getBoundingClientRect();
  return [+(r.x - b.x).toFixed(1), +(r.y - b.y).toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)];
}, [sel, base]);

await page.click('[data-chips="process"] .chip');
await new Promise(r => setTimeout(r, 450));

const wbExp = [
  ['.wb-bar', [0, 0, 860, 56]],
  ['.wb-label', [12, 17, 56, 22]],
  ['.wb-opts', [80, 12, null, 32]],
  ['.wb-opt:nth-of-type(1)', [80, 12, 83, 32]],
  ['.wb-opt:nth-of-type(2)', [171, 12, null, 32]],
  ['.wb-opt:nth-of-type(3)', [259, 12, null, 32]],
  ['.wb-opt:nth-of-type(4)', [347, 12, null, 32]],
  ['.wb-close', [828, 8, 24, 24]],
];
let bad = 0;
console.log('--- 工作台子项容器（dy2983:48726 · 860×56）---');
for (const [sel, exp] of wbExp) {
  const got = await rel(sel, '.wb-bar');
  const tol = [6, 1, 4, 1];
  const d = got.map((v, i) => (exp[i] != null && Math.abs(v - exp[i]) > tol[i]) ? `${['x','y','w','h'][i]} ${v}≠${exp[i]}` : null).filter(Boolean);
  if (d.length) { bad++; console.log('✗', sel, JSON.stringify(got), d.join(' ')); } else console.log('✓', sel, JSON.stringify(got));
}

await page.click('[data-chips="process"] .chip');   // 取消
await new Promise(r => setTimeout(r, 350));
console.log('wb 关闭后 slot 高度:', await page.evaluate(() => document.getElementById('wbSlot').getBoundingClientRect().height));

await page.click('[data-chips="quick"] .chip');
await new Promise(r => setTimeout(r, 450));
const qfExp = [
  ['.qf-bar', [0, 0, 860, 82]],
  ['.qf-head', [12, 12, null, 22]],
  ['.qf-title', [12, 12, null, 22]],
  /* 第 17 轮：track 盒高 30（上 2 下 4 留投影绘制区），chip 仍从稿件 y=46 起 */
  ['.qf-track', [12, 44, 836, 30]],
  ['.qf-step:nth-of-type(1)', [0, 2, 84, 24]],
  ['.qf-acts', [800, 8, 52, 24]],
  ['.qf-icon:nth-of-type(1)', [800, 8, 24, 24]],
  ['.qf-icon:nth-of-type(2)', [828, 8, 24, 24]],
];
console.log('--- 工序容器（2960:44863 · 860×82）---');
for (const [sel, exp] of qfExp) {
  const base = sel.startsWith('.qf-step') ? '.qf-track' : '.qf-bar';
  const got = await rel(sel, base);
  const d = got.map((v, i) => (exp[i] != null && Math.abs(v - exp[i]) > (i < 2 ? 1 : 4)) ? `${['x','y','w','h'][i]} ${v}≠${exp[i]}` : null).filter(Boolean);
  if (d.length) { bad++; console.log('✗', sel, JSON.stringify(got), d.join(' ')); } else console.log('✓', sel, JSON.stringify(got));
}
const steps = await page.evaluate(() => [...document.querySelectorAll('.qf-step')].map(e => +e.getBoundingClientRect().width.toFixed(1)));
console.log('工序 chip 宽度:', steps.join(','), '（稿件 84,86,86,86,86,86,99,87）');
console.log(bad ? bad + ' issues' : 'ALL OK');
await browser.close();
