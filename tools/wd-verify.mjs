/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const FILE = 'file:///' + BASE + '/cecoder-home.html';
const browser = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(FILE, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 400));
/* 第 38 轮：左栏改为默认展开，展开态就不必再点菜单键（点了会收起） */
if (!(await page.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open')))) {
  await page.click('.menu-btn');
  await new Promise(r => setTimeout(r, 500));
}
/* 第 20 轮：AI Native Factory 默认收起，展开它才能量空态基线 */
await page.evaluate(() => {
  /* 第 21 轮：只展开 AI Native Factory（Nutstore 现在也是空态分组，展开会推低后续基线） */
  const h = document.getElementById('wdHead5');
  if (h && h.getAttribute('aria-expanded') === 'false') h.click();
});
await new Promise(r => setTimeout(r, 320));
/* 第 38 轮：默认落在「会话」页签，任务视图基线要先切回来 */
if (await page.evaluate(() => { const t = document.querySelector('.wd-tab.is-active'); return !t || t.dataset.wdTab !== '任务'; })) {
  await page.evaluate(() => document.querySelector('[data-wd-tab="任务"]').click());
  await new Promise(r => setTimeout(r, 350));
}

/* 第 11 轮：卡片新增常驻「更多操作」按钮（hover/选中才显示，但占 20px），
   第 2 张卡标题由 1 行变 2 行，纵向基线整体下移 20。 */
const EXP = [
  ['aside',        '.ws-drawer',     0, 0, 320, 850],
  ['head',         '.wd-head',       0, 0, 320, 44],
  ['title',        '.wd-title',     16, 11, null, 22],
  ['link新建',      '.wd-link',      120, 11, 72, 22],
  ['link云端',      '.wd-sync',      204, 11, 56, 22],
  ['collapse',     '.wd-collapse',  276, 8, 28, 28],
  /* 第 38 轮：页签顺序互换 —— 会话在左（仍是任务选中态） */
  ['tab会话',       '.wd-tab',        16, 52, 142, 32],
  ['tab任务',       '.wd-tab:nth-of-type(2)', 162, 52, 142, 32],
  ['adddir',       '.wd-adddir',     16, 100, 208, 32],
  ['search',       '.wd-icon-btn',   232, 100, 32, 32],
  ['sort',         '.wd-icon-btn:nth-of-type(2)', 272, 100, 32, 32],
  ['grpMini',      '.wd-grp-head',   16, 148, 288, 36],
  ['newtask',      '.wd-newtask',    16, 192, 288, 28],
  ['card1',        '.wd-card:nth-of-type(1)', 16, 228, 288, 80],
  ['card2',        '.wd-card:nth-of-type(2)', 16, 312, 288, 80],
  ['card3',        '.wd-card:nth-of-type(3)', 16, 396, 288, 100],
  ['card4',        '.wd-card:nth-of-type(4)', 16, 500, 288, 80],
  ['grp2',         '#wdHead2', 16, 592, 288, 36],
  ['grp3',         '#wdHead3', 16, 627, 288, 36],
  ['grp4',         '#wdHead4', 16, 662, 288, 36],
  ['grp5',         '#wdHead5', 16, 697, 288, 36],
  /* 第 18 轮：空态容器按内容撑宽（两个 13px 链接并排），142 居中 → x 89 */
  ['emptyT',       '#wdSub5 .wd-empty-title', 89, 757, 142, 20],
  ['thumb',        '.wd-thumb',     310, 148, 6, null],
  ['chip1',        '.wd-chip-run',   234, 240, 58, 20],
  ['chip2',        '.wd-chip-todo',  248, 324, 44, 20],
  ['chip3',        '.wd-chip-warn',  248, 408, 44, 20],
  ['chip4',        '.wd-chip-idle',  248, 512, 44, 20],
  ['more1',        '.wd-card:nth-of-type(1) .wd-more', 292, 240, 0, 20],
  ['more4',        '.wd-card:nth-of-type(4) .wd-more', 292, 512, 0, 20],
  ['title1',       '.wd-card:nth-of-type(1) .wd-card-title', 28, 240, null, 20],
  ['sub1',         '.wd-card:nth-of-type(1) .wd-card-sub', 28, 268, null, 18],
  ['cnt1',         '.wd-card:nth-of-type(1) .wd-card-cnt', 272, 268, null, 18],
  ['bar1',         '.wd-card:nth-of-type(1) .wd-bar', 28, 294, 264, 2],
  ['bar3',         '.wd-card:nth-of-type(3) .wd-bar', 28, 482, 264, 2],
];

const res = await page.evaluate((EXP) => {
  const out = [];
  for (const [name, sel, x, y, w, h] of EXP) {
    const el = document.querySelector(sel);
    if (!el) { out.push({ name, err: 'missing' }); continue; }
    const d = document.getElementById('wsDrawer').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    out.push({ name, x: +(r.x - d.x).toFixed(1), y: +(r.y - d.y).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), ex: [x, y, w, h] });
  }
  // 文本与分段几何
  const bar = [...document.querySelectorAll('.wd-card:nth-of-type(1) .wd-bar i')].map(i => +i.getBoundingClientRect().width.toFixed(2));
  const thumbs = [document.querySelector('.wd-thumb').getBoundingClientRect(), document.getElementById('wdScroll').clientHeight, document.getElementById('wdScroll').scrollHeight];
  return { out, bar, thumb: { x: +thumbs[0].x.toFixed(1), w: +thumbs[0].width.toFixed(1), h: +thumbs[0].height.toFixed(1), ch: thumbs[1], sh: thumbs[2], on: document.querySelector('.wd-thumb').classList.contains('is-on') } };
}, EXP);

let bad = 0;
for (const r of res.out) {
  if (r.err) { console.log('✗ missing', r.name); bad++; continue; }
  const [x, y, w, h] = r.ex;
  const d = [];
  if (Math.abs(r.x - x) > (r.name === 'cnt1' ? 2.5 : 0.6)) d.push(`x ${r.x}≠${x}`);
  if (Math.abs(r.y - y) > 0.6) d.push(`y ${r.y}≠${y}`);
  if (w != null && Math.abs(r.w - w) > 0.6) d.push(`w ${r.w}≠${w}`);
  if (h != null && Math.abs(r.h - h) > 0.6) d.push(`h ${r.h}≠${h}`);
  if (d.length) { bad++; console.log('✗', r.name, '[' + [r.x, r.y, r.w, r.h].join(',') + ']', d.join(' ')); }
  else console.log('✓', r.name, '[' + [r.x, r.y, r.w, r.h].join(',') + ']');
}
console.log('---');
console.log('bar1 segs:', res.bar.join(','));
console.log('thumb:', JSON.stringify(res.thumb));
console.log(bad === 0 ? 'ALL OK' : bad + ' issues');
await page.screenshot({ path: 'wd-open.png' });
await browser.close();
