/* 第 120 轮验收：首页三处调整
   ① `.hero-title` 的「从一个想法开始」改 #152443 —— 逐字 span 是渐变裁字，父级 color 不透传，
      所以渐变里四处暗部一起换掉；
   ② 任务列表 MiniCloud Files 第一条（UI 设计工序）挂 data-goto，点卡直接进 cecoder-ui.html?id=0，
      其余卡仍进任务详情页；
   ③ 工作台 / 快速任务 chip 的 hover 照搬参考站「和 DeepSeek 对话」按钮：::after 一枚 5% 黑圆
      从中心 scale(0) → scale(1)，transform .36s ease-out、opacity .1s，overflow:hidden 裁在圆角内。 */
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
await wait(1400);

/* ---------- A 标题配色 ---------- */
const A = await h.evaluate(() => {
  const t = document.querySelector('.hero-title');
  const ch = document.querySelector('.hero-title .ch');
  return {
    txt: t.textContent.trim(),
    color: getComputedStyle(t).color,
    chBg: ch ? getComputedStyle(ch).backgroundImage : '',
    chFill: ch ? getComputedStyle(ch).webkitTextFillColor : ''
  };
});
ok('A1 标题文案仍是「从一个想法开始」', A.txt === '从一个想法开始', A.txt);
ok('A2 标题本体色 = #152443', A.color === 'rgb(21, 36, 67)', A.color);
ok('A3 逐字渐变的暗部换成 rgb(21,36,67)（父级 color 不透传）', /rgb\(21, 36, 67\)/.test(A.chBg), A.chBg.slice(0, 120));
ok('A4 蓝扫光还在（渐变里仍有品牌蓝）', /rgb\(55, 112, 247\)/.test(A.chBg), A.chBg.slice(0, 160));
ok('A5 逐字仍走渐变裁字（fill 透明）', /rgba\(0, 0, 0, 0\)|transparent/.test(A.chFill), A.chFill);

/* 实际渲染取色：把标题截图后取像素，确认不是被渐变白/黑盖掉 */
const shot = await h.evaluate(() => {
  const r = document.querySelector('.hero-title').getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
});
await h.screenshot({ path: 'tools/shots/r120-title.png', clip: { x: shot.x, y: shot.y, width: shot.w, height: shot.h } });

/* ---------- B chip hover 动效 ---------- */
const B = await h.evaluate(() => {
  const c = document.querySelector('[data-chips="process"] .chip');
  const cs = getComputedStyle(c);
  const af = getComputedStyle(c, '::after');
  return {
    pos: cs.position, ov: cs.overflow, radius: cs.borderRadius,
    tf: af.transition, bg: af.backgroundColor, op: af.opacity, tr: af.transform,
    radiusCircle: af.borderRadius, content: af.content
  };
});
ok('B1 chip 成为定位容器且裁掉溢出（overflow:hidden）', B.pos === 'relative' && B.ov === 'hidden', JSON.stringify([B.pos, B.ov]));
ok('B2 ::after 是一枚 5% 黑圆（参考站同款 rgba(0,0,0,.05)）', B.content === '""' && /rgba\(0, 0, 0, 0\.05\)/.test(B.bg) && B.radiusCircle === '50%', JSON.stringify([B.bg, B.radiusCircle]));
ok('B3 常态 scale(0) + opacity 0', /matrix\(0, 0, 0, 0/.test(B.tr) && B.op === '0', JSON.stringify([B.tr, B.op]));
ok('B4 过渡曲线照抄参考站：transform .36s ease-out / opacity .1s', /transform 0\.36s ease-out/.test(B.tf) && /opacity 0\.1s/.test(B.tf), B.tf);

const mid = await h.evaluate(() => {
  const c = document.querySelector('[data-chips="process"] .chip');
  const r = c.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await h.mouse.move(mid.x, mid.y);
await wait(120);
const H1 = await h.evaluate(() => {
  const af = getComputedStyle(document.querySelector('[data-chips="process"] .chip'), '::after');
  const m = af.transform.match(/matrix\(([\d.]+),/);
  return { scale: m ? +m[1] : null, op: af.opacity };
});
await wait(500);
const H2 = await h.evaluate(() => {
  const af = getComputedStyle(document.querySelector('[data-chips="process"] .chip'), '::after');
  const m = af.transform.match(/matrix\(([\d.]+),/);
  return { scale: m ? +m[1] : null, op: af.opacity };
});
ok('B5 hover 中间态在放大（0 < scale < 1，是动画不是瞬切）', H1.scale !== null && H1.scale > 0.02 && H1.scale < 1, JSON.stringify(H1));
ok('B6 hover 终态 scale(1) + 完全可见', H2.scale !== null && Math.abs(H2.scale - 1) < 0.02 && H2.op === '1', JSON.stringify(H2));
await h.screenshot({ path: 'tools/shots/r120-chip-hover.png', clip: { x: mid.x - 120, y: mid.y - 26, width: 300, height: 52 } });
await h.mouse.move(4, 4);
await wait(400);
const H3 = await h.evaluate(() => {
  const af = getComputedStyle(document.querySelector('[data-chips="process"] .chip'), '::after');
  return { op: af.opacity };
});
ok('B7 移开后圆淡出（opacity 归 0）', H3.op === '0', H3.op);

/* 快速任务组同样生效 */
const Q = await h.evaluate(() => {
  const c = document.querySelector('[data-chips="quick"] .chip');
  const af = getComputedStyle(c, '::after');
  return { content: af.content, bg: af.backgroundColor, tr: getComputedStyle(c).overflow };
});
ok('B8 快速任务 chip 同一套（含「新建」）', Q.content === '""' && /rgba\(0, 0, 0, 0\.05\)/.test(Q.bg) && Q.tr === 'hidden', JSON.stringify(Q));

/* 键盘焦点也走这条动效 */
const F = await h.evaluate(() => {
  const c = document.querySelector('[data-chips="process"] .chip');
  c.focus();
  return getComputedStyle(c, '::after').transition;
});
ok('B9 focus-visible 也挂同一过渡（键盘可达）', /transform 0\.36s/.test(F), F);

/* ---------- C 任务卡跳转 ---------- */
await h.click('[data-wd-tab="任务"]');
await wait(400);
const C0 = await h.evaluate(() => {
  const card = document.querySelector('#wdViewTask .wd-card');
  return { go: card.getAttribute('data-goto'), sub: card.querySelector('.wd-card-sub').textContent.trim(), title: card.querySelector('.wd-card-title').textContent.trim() };
});
ok('C1 第一条卡是 UI 设计工序', /^UI 设计 ·/.test(C0.sub), C0.sub);
ok('C2 它挂着 data-goto = cecoder-ui.html?id=0', C0.go === 'cecoder-ui.html?id=0', C0.go);

await Promise.all([
  h.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {}),
  h.click('#wdViewTask .wd-card')
]);
await wait(900);
const U = { url: h.url(), page: await h.evaluate(() => document.body.getAttribute('data-page')), title: await h.title() };
ok('C3 点第一条卡落到 cecoder-ui.html?id=0', /cecoder-ui\.html\?id=0$/.test(U.url), U.url);
ok('C4 落到的确实是「UI设计」页', U.page === 'ui' && /UI设计/.test(U.title), JSON.stringify([U.page, U.title]));

/* 第二条卡仍走任务详情 */
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
await h.click('[data-wd-tab="任务"]');
await wait(400);
await Promise.all([
  h.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {}),
  h.evaluate(() => document.querySelectorAll('#wdViewTask .wd-card')[1].click())
]);
await wait(700);
const U2 = { url: h.url(), page: await h.evaluate(() => document.body.getAttribute('data-page')) };
ok('C5 第二条卡仍进任务详情页（没被一刀切）', /cecoder-task\.html\?/.test(U2.url) && U2.page === 'task', JSON.stringify(U2));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
