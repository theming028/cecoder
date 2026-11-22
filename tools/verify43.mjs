/* 第 43 轮验收：
   1) 浮标圆角 10 → 8；尖角补上橙色 1px 描边（外层橙三角 + 内层白三角挖空）
   2) 中间面板（is-chat）最窄停在 400 —— 左栏、右栏两条拖拽路径 + 窄窗都不得破 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, seed, vw = 1440, vh = 900) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: vw, height: vh });
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(650);
  return p;
}
const pmW = p => p.evaluate(() => Math.round(document.querySelector('.panel-main').getBoundingClientRect().width));
const boxOf = (p, sel) => p.evaluate(s => {
  const r = document.querySelector(s).getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
}, sel);
async function drag(p, sel, dx, dy = 0) {
  const c = await boxOf(p, sel);
  await p.mouse.move(c.x, c.y); await p.mouse.down();
  for (let i = 1; i <= 5; i++) { await p.mouse.move(c.x + dx * i / 5, c.y + dy * i / 5); await wait(50); }
  await p.mouse.up(); await wait(420);
}

/* ============ A 浮标：圆角 8 + 尖角有橙色描边 ============ */
let p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
await p.click('.wd-collapse');
await wait(1500);
const fp = await p.evaluate(() => {
  const t = document.getElementById('fpTip');
  const a = t.querySelector('.fp-arrow');
  const cs = getComputedStyle(t), as = getComputedStyle(a, '::before');
  const ar = a.getBoundingClientRect(), tr = t.getBoundingClientRect();
  const btn = document.querySelector('.menu-btn').getBoundingClientRect();
  return {
    radius: cs.borderRadius, on: t.classList.contains('is-on'),
    arrowBg: getComputedStyle(a).backgroundColor,
    clip: getComputedStyle(a).clipPath,
    innerBg: as.backgroundColor, innerClip: as.clipPath, innerTop: as.top,
    arrowCy: +(ar.y + ar.height / 2).toFixed(2), btnCy: +(btn.y + btn.height / 2).toFixed(2),
    arrowTipX: +ar.x.toFixed(1), cardX: +tr.x.toFixed(1),
    shadow: cs.boxShadow
  };
});
ok('A1 浮标圆角 = 8px', fp.radius === '8px', fp.radius);
ok('A2 橙色描边投影仍在', /247, 114, 52/.test(fp.shadow));
ok('A3 尖角外层是橙色实心三角（做描边底）', /rgba?\(247, 114, 52/.test(fp.arrowBg) && /polygon/.test(fp.clip), fp.arrowBg + ' | ' + fp.clip);
ok('A4 尖角内层 ::before 用白底三角挖空', fp.innerBg === 'rgb(255, 255, 255)' && /polygon/.test(fp.innerClip), fp.innerBg + ' | ' + fp.innerClip);
ok('A5 内层上下各缩 1px（斜边留 1px 橙线）', fp.innerTop === '1px', fp.innerTop);
ok('A6 尖角中线仍与折叠按钮齐平（≤0.5px）', Math.abs(fp.arrowCy - fp.btnCy) <= 0.5, fp.arrowCy + ' vs ' + fp.btnCy);
ok('A7 尖角尖端在卡片左侧（有 9px 伸出）', fp.arrowTipX <= fp.cardX - 8, fp.arrowTipX + ' vs ' + fp.cardX);
ok('A8 浮标正常显示', fp.on === true);
ok('A9 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.screenshot({ path: 'R43-float.png', clip: { x: 0, y: 44, width: 460, height: 120 } });
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 3 });
await wait(400);
await p.screenshot({ path: 'R43-arrow.png', clip: { x: 0, y: 44, width: 300, height: 100 } });
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.close();

/* ============ B 会话页（is-chat）：左栏拖到最宽，中间面板停在 400 ============ */
p = await mk('cecoder-session.html?id=0', () => {
  localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true }));
  localStorage.removeItem('cecoder.rsDrawer');
});
await p.click('#rsToggle'); await wait(600);
await drag(p, '.ws-resizer', 700);
const b1 = await p.evaluate(() => ({
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  ws: Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width),
  rs: Math.round(document.getElementById('rsDrawer').getBoundingClientRect().width),
  chat: document.querySelector('.panel-main').classList.contains('is-chat'),
  ovf: document.querySelector('.panel-main').scrollWidth > document.querySelector('.panel-main').clientWidth + 1
}));
ok('B0 该页确实是 is-chat 形态', b1.chat === true);
ok('B1 左栏拖到最宽后中间面板正好 400', b1.pm >= 399 && b1.pm <= 401, JSON.stringify(b1));
ok('B2 没被旧的 480 上限卡住（左右栏同开时按剩余空间算）', b1.ws > 440, String(b1.ws));
ok('B3 中间面板无横向溢出', !b1.ovf);
await p.screenshot({ path: 'R43-400.png' });

/* ============ C 会话页（is-chat）：左栏到顶后再往左拖右栏，右栏不许再涨 ============ */
await drag(p, '.rs-resizer', -700);
const c1 = await p.evaluate(() => ({
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  rs: Math.round(document.getElementById('rsDrawer').getBoundingClientRect().width)
}));
ok('C1 右栏想再涨但中间面板压到 400 就停（右栏维持 552）', c1.rs === 552 && c1.pm === 400, JSON.stringify(c1));
ok('C2 拖拽过程无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ D 窄窗 1100：只开右栏，往左拖也不破 400 ============ */
p = await mk('cecoder-session.html?id=0', () => {
  localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false }));
  localStorage.removeItem('cecoder.rsDrawer');
}, 1100, 800);
await p.click('#rsToggle'); await wait(600);
await drag(p, '.rs-resizer', -400);
const d1 = await p.evaluate(() => ({
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  rs: Math.round(document.getElementById('rsDrawer').getBoundingClientRect().width),
  ws: Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width),
  frame: Math.round(document.querySelector('.cds-frame').getBoundingClientRect().width)
}));
ok('D1 1100 宽窗：中间面板停在 400', d1.pm >= 399 && d1.pm <= 401, JSON.stringify(d1));
ok('D2 右栏宽度 = 面板宽 - 左栏 - 400（正好卡住）', Math.abs(d1.rs - (d1.frame - 16 - d1.ws - 400)) <= 1, JSON.stringify(d1));
await p.close();

/* ============ E 首页（非 chat）：下限仍是 320，不误伤 ============ */
p = await mk('cecoder-home.html', () => {
  localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true }));
}, 1000, 800);
await drag(p, '.ws-resizer', 700);
const e1 = await p.evaluate(() => ({
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  ws: Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width),
  chat: document.querySelector('.panel-main').classList.contains('is-chat')
}));
ok('E1 首页非 chat 形态', e1.chat === false);
ok('E2 首页中间面板下限 320（沿用旧口径）', e1.pm >= 319 && e1.pm <= 321, JSON.stringify(e1));
await p.close();

/* ============ F 窗口缩放：从宽拉到窄，左右栏自动收，不破 400 ============ */
p = await mk('cecoder-session.html?id=0', () => {
  localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true, w: 600 }));
  localStorage.setItem('cecoder.rsDrawer', JSON.stringify({ open: true, manual: true, w: 500 }));
});
await wait(500);
await p.setViewport({ width: 1080, height: 800 });
await wait(600);
const f1 = await p.evaluate(() => ({
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  ws: Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width),
  rs: Math.round(document.getElementById('rsDrawer').getBoundingClientRect().width)
}));
ok('F1 窄窗后中间面板不破 400', f1.pm >= 399, JSON.stringify(f1));
ok('F2 左栏从 600 被收回', f1.ws < 600, JSON.stringify(f1));
ok('F3 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

await b.close();
console.log('\n第 43 轮：' + pass + ' pass / ' + fail.length + ' fail');
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
