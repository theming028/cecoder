/* 第 123~124 轮验收：首页左上角 menu-btn 的外观
   123 轮先做成磨砂白胶囊（白 50% + 8px 圆角 + 15px 毛玻璃）；124 轮用户要求「去掉透明度、圆角回 4px」，
   最终形态：不透明纯白底 + 1px #C5D7F0 描边 + 4px 圆角、无毛玻璃，hover 走一档浅灰（--cds-fill）。
   尺寸与位置不变（28×28 @ 相对 panel-main 的 (7,7)），图标仍是 14px 居中，点击行为不变。 */
import puppeteer from 'puppeteer-core';

const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1', '--enable-unsafe-swiftshader'] });
const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(1200);

/* 抽屉先收起，menu-btn 才会显示（展开时它 opacity 0 淡出，由抽屉头部接管） */
const before = await h.evaluate(() => {
  const e = document.querySelector('.menu-btn');
  return { op: getComputedStyle(e).opacity, exp: e.getAttribute('aria-expanded') };
});
await h.click('[data-drawer-close]').catch(() => {});
await wait(900);

const A = await h.evaluate(() => {
  const e = document.querySelector('.menu-btn');
  const s = getComputedStyle(e);
  const r = e.getBoundingClientRect();
  const pm = document.getElementById('panelMain').getBoundingClientRect();
  const ico = e.querySelector('.ico');
  const ir = ico.getBoundingClientRect();
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    dx: Math.round(r.left - pm.left), dy: Math.round(r.top - pm.top),
    radius: s.borderRadius, bg: s.backgroundColor, bd: s.borderColor, bw: s.borderWidth,
    bf: s.backdropFilter || s.webkitBackdropFilter || 'none',
    op: s.opacity, exp: e.getAttribute('aria-expanded'),
    icoW: Math.round(ir.width), icoH: Math.round(ir.height),
    /* 图标相对按钮的居中误差 */
    offX: +(ir.left + ir.width / 2 - (r.left + r.width / 2)).toFixed(1),
    offY: +(ir.top + ir.height / 2 - (r.top + r.height / 2)).toFixed(1)
  };
});

ok('A1 尺寸仍是 28×28（点击区域没变）', A.w === 28 && A.h === 28, JSON.stringify([A.w, A.h]));
ok('A2 位置仍是相对 panel-main 的 (7,7)', A.dx === 7 && A.dy === 7, JSON.stringify([A.dx, A.dy]));
ok('A3 圆角回到 4px', A.radius === '4px', A.radius);
ok('A4 底色 = 不透明纯白（透明度去掉）', A.bg === 'rgb(255, 255, 255)', A.bg);
ok('A5 描边 = 1px #C5D7F0', A.bw === '1px' && A.bd === 'rgb(197, 215, 240)', JSON.stringify([A.bw, A.bd]));
ok('A6 不再挂毛玻璃（不透明底不需要背景模糊）', A.bf === 'none', A.bf);
ok('A7 图标仍是 14×14 且水平垂直居中', A.icoW === 14 && A.icoH === 14 && Math.abs(A.offX) <= 0.6 && Math.abs(A.offY) <= 0.6, JSON.stringify([A.icoW, A.icoH, A.offX, A.offY]));
ok('A8 抽屉收起后才显示（展开时淡出逻辑没被改坏）', before.op === '0' && before.exp === 'true' && A.op === '1' && A.exp === 'false', JSON.stringify([before, { op: A.op, exp: A.exp }]));

/* hover 提白 */
const c = await h.evaluate(() => { const r = document.querySelector('.menu-btn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await h.mouse.move(c.x, c.y);
await wait(450);
const AH = await h.evaluate(() => { const s = getComputedStyle(document.querySelector('.menu-btn')); return { bg: s.backgroundColor, bd: s.borderColor, tf: s.transition }; });
ok('A9 hover 底色落到浅灰 --cds-fill #EEEEEE', AH.bg === 'rgb(238, 238, 238)', AH.bg);
ok('A10 hover 时描边仍在（不会一换底色就丢边界）', AH.bd === 'rgb(197, 215, 240)', AH.bd);
ok('A11 过渡里带上 border-color（换色是渐变的）', /border-color/.test(AH.tf), AH.tf.slice(0, 120));
await h.mouse.move(4, 4);
await wait(300);

/* 点击仍能展开抽屉 */
await h.click('.menu-btn');
await wait(700);
const B = await h.evaluate(() => ({
  open: document.getElementById('wsDrawer').classList.contains('is-open') || !document.getElementById('wsDrawer').getAttribute('aria-hidden') || document.getElementById('wsDrawer').getAttribute('aria-hidden') === 'false',
  exp: document.querySelector('.menu-btn').getAttribute('aria-expanded')
}));
ok('B1 点它仍能展开任务列表（行为没回归）', B.exp === 'true' && B.open !== false, JSON.stringify(B));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
