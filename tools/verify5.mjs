/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });
await p.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2400));

// 1) scene hover
const sc = await p.$('.scene');
await sc.hover();
await new Promise((r) => setTimeout(r, 400));
const sgeo = await p.evaluate(() => {
  const s = document.querySelector('.scene');
  const cs = getComputedStyle(s);
  return { bg: cs.backgroundColor, border: cs.borderColor, style: cs.borderStyle, shadow: cs.boxShadow };
});
console.log('SCENE', JSON.stringify(sgeo));
const rb = await sc.boundingBox();
await p.screenshot({ path: 'v-scene.png', clip: { x: rb.x - 4, y: rb.y - 4, width: rb.width + 8, height: rb.height + 8 } });

// 2) 工作台 chip tooltip
const ws = await p.$$('[data-chips="process"] .chip');
await ws[4].hover();
await new Promise((r) => setTimeout(r, 700));
const tipStyle = await p.evaluate((el) => {
  const a = getComputedStyle(el, '::after');
  const bfore = getComputedStyle(el, '::before');
  return { content: a.content, bg: a.backgroundColor, color: a.color, fs: a.fontSize, lh: a.lineHeight, r: a.borderRadius, pad: a.padding, opacity: a.opacity, bottom: a.bottom, arrow: bfore.borderTopColor + '/' + bfore.borderLeftWidth, rect: el.getBoundingClientRect().toJSON() };
}, ws[4]);
console.log('WS TIP', JSON.stringify(tipStyle));
await p.screenshot({ path: 'v-tip-ws.png', clip: { x: 480, y: 600, width: 420, height: 110 } });

// 3) 快速任务 chip hover（紫色）
const q = await p.$$('[data-chips="quick"] .chip');
await q[1].hover();
await new Promise((r) => setTimeout(r, 700));
const qgeo = await p.evaluate((el) => {
  const cs = getComputedStyle(el);
  return { color: cs.color, bg: cs.backgroundColor, border: cs.borderColor };
}, q[1]);
console.log('QUICK HOVER', JSON.stringify(qgeo));
await p.screenshot({ path: 'v-tip-quick.png', clip: { x: 480, y: 600, width: 460, height: 110 } });

// 4) 新建 hover
const nb = await p.$('.chip-new');
await nb.hover();
await new Promise((r) => setTimeout(r, 700));
await p.screenshot({ path: 'v-tip-new.png', clip: { x: 700, y: 600, width: 320, height: 110 } });

// 5) 发送按钮特写 + 激活态
await p.mouse.move(700, 400);
await new Promise((r) => setTimeout(r, 300));
const send = await p.evaluate(() => {
  const s = document.querySelector('.c-send');
  const r = s.getBoundingClientRect();
  const svg = s.querySelector('svg');
  return { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], vb: svg.getAttribute('viewBox'), box: [Math.round(svg.getBoundingClientRect().width), Math.round(svg.getBoundingClientRect().height)] };
});
console.log('SEND', JSON.stringify(send));
await p.screenshot({ path: 'v-send.png', clip: { x: send.rect[0] - 6, y: send.rect[1] - 6, width: 44, height: 44 } });

// 激活态：聚焦输入框
await p.click('.c-input');
await new Promise((r) => setTimeout(r, 300));
const card = await p.evaluate(() => {
  const c = document.querySelector('.c-card');
  const cs = getComputedStyle(c);
  return { border: cs.borderColor, shadow: cs.boxShadow };
});
console.log('CARD FOCUS', JSON.stringify(card));
await p.screenshot({ path: 'v-card-focus.png', clip: { x: 282, y: 690, width: 300, height: 160 } });

await b.close();
