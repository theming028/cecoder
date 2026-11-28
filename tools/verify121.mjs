/* 第 121 轮验收：选中态反色 + 输入区间距
   ① 工作台 chip 选中：浅蓝底 + 蓝字 → 蓝底白字（#3770F7 实底，字/图标纯白，描边同色）；
   ② 快速任务 chip 选中：浅紫底 + 紫字 → 紫底白字（#5B58FF 实底）；
   ③ 两者 hover 各加深一档（蓝 #2E5FD9 / 紫 #4B48EE），未选中的 chip 保持白 80% 磨砂不变；
   ④ `.composer` 顶部间距 12px → 8px。 */
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

const read = () => h.evaluate(() => {
  const pick = sel => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const c = getComputedStyle(e);
    const ico = e.querySelector('.chip-ico');
    return { t: e.textContent.trim(), bg: c.backgroundColor, col: c.color, bd: c.borderColor, ico: ico ? getComputedStyle(ico).color : null, w: Math.round(e.getBoundingClientRect().width) };
  };
  return {
    wbAct: pick('[data-chips="process"] .chip.is-active'),
    qkAct: pick('[data-chips="quick"] .chip.is-active'),
    wbIdle: pick('[data-chips="process"] .chip:not(.is-active)'),
    qkIdle: pick('[data-chips="quick"] .chip:not(.is-active)'),
    mt: getComputedStyle(document.querySelector('.composer')).marginTop,
    /* 选中态的字重仍是 500 */
    wbW: document.querySelector('[data-chips="process"] .chip.is-active') ? getComputedStyle(document.querySelector('[data-chips="process"] .chip.is-active')).fontWeight : null
  };
});

/* ---------- A 工作台：蓝底白字 ---------- */
await h.click('[data-chips="process"] .chip[data-wb="通用"]');
await wait(350);
const A = await read();
ok('A1 工作台选中底色 = 品牌蓝 rgb(55,112,247)', /rgb\(55, 112, 247\)/.test(A.wbAct.bg), A.wbAct.bg);
ok('A2 选中文字 = 纯白', A.wbAct.col === 'rgb(255, 255, 255)', A.wbAct.col);
ok('A3 选中图标 = 纯白（currentColor 跟着走）', A.wbAct.ico === 'rgb(255, 255, 255)', A.wbAct.ico);
ok('A4 选中描边 = 同色实线（不再留浅蓝 C7D7FC）', /rgb\(55, 112, 247\)/.test(A.wbAct.bd), A.wbAct.bd);
ok('A5 字重仍 500', A.wbW === '500', A.wbW);

/* hover 加深一档 */
const c1 = await h.evaluate(() => { const r = document.querySelector('[data-chips="process"] .chip.is-active').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await h.mouse.move(c1.x, c1.y);
await wait(450);
const A2 = await read();
ok('A6 工作台选中 hover 加深到 #2E5FD9', /rgb\(46, 95, 217\)/.test(A2.wbAct.bg), A2.wbAct.bg);
await h.mouse.move(4, 4);
await wait(300);

/* 反色只认选中项：未选中的仍是白 80% + 深色字 */
ok('A7 未选中的 chip 仍是白 80% 磨砂底', /rgba\(255, 255, 255, 0\.8\)/.test(A.wbIdle.bg), A.wbIdle.bg);
ok('A8 未选中文字仍是 #1F1F1F（没被反色规则污染）', A.wbIdle.col === 'rgb(31, 31, 31)', A.wbIdle.col);
ok('A9 选中/未选中宽度一致（反色不引起跳变）', A.wbAct.w === A.wbIdle.w, JSON.stringify([A.wbAct.w, A.wbIdle.w]));

/* 换选：蓝底跟着走，且只落在一个 chip 上（先把鼠标移开，否则读到的是 hover 加深色） */
await h.mouse.move(4, 4);
await wait(200);
await h.click('[data-chips="process"] .chip[data-wb="测试"]');
await h.mouse.move(4, 4);
await wait(350);
const A3 = await h.evaluate(() => [...document.querySelectorAll('[data-chips="process"] .chip')].map(c => ({ t: c.textContent.trim(), on: c.classList.contains('is-active'), bg: getComputedStyle(c).backgroundColor })));
ok('A10 蓝底只落在新选中项（且切换后无残留）', A3.filter(x => x.on).length === 1 && A3.find(x => x.t === '测试').on && A3.filter(x => x.on).every(x => /rgb\(55, 112, 247\)/.test(x.bg)), JSON.stringify(A3));

/* ---------- B 快速任务：紫底白字 ---------- */
await h.click('[data-chips="quick"] .chip[data-quick="技术任务"]');
await wait(400);
const B = await read();
ok('B1 快速任务选中底色 = 语义紫 rgb(91,88,255)', /rgb\(91, 88, 255\)/.test(B.qkAct.bg), B.qkAct.bg);
ok('B2 选中文字 = 纯白', B.qkAct.col === 'rgb(255, 255, 255)', B.qkAct.col);
ok('B3 选中描边 = 同紫实线', /rgb\(91, 88, 255\)/.test(B.qkAct.bd), B.qkAct.bd);
ok('B4 未选中的快速任务 chip 仍是白 80% + 深字', /rgba\(255, 255, 255, 0\.8\)/.test(B.qkIdle.bg) && B.qkIdle.col === 'rgb(31, 31, 31)', JSON.stringify([B.qkIdle.bg, B.qkIdle.col]));

const c2 = await h.evaluate(() => { const r = document.querySelector('[data-chips="quick"] .chip.is-active').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await h.mouse.move(c2.x, c2.y);
await wait(450);
const B2 = await read();
ok('B5 快速任务选中 hover 加深到 #4B48EE', /rgb\(75, 72, 238\)/.test(B2.qkAct.bg), B2.qkAct.bg);
await h.mouse.move(4, 4);
await wait(300);

/* 两组互斥：工作台与快速任务同时只有一个选中（业务规则没被反色打乱） */
const M = await h.evaluate(() => ({
  wb: document.querySelectorAll('[data-chips="process"] .chip.is-active').length,
  qk: document.querySelectorAll('[data-chips="quick"] .chip.is-active').length
}));
ok('B6 两组各自最多一个选中', M.wb <= 1 && M.qk <= 1, JSON.stringify(M));

/* ---------- C 输入区顶部间距 ---------- */
ok('C1 .composer 顶部间距 = 8px（原 12px）', B.mt === '8px', B.mt);
const C = await h.evaluate(() => {
  const q = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom) }; };
  const comp = document.querySelector('.composer').getBoundingClientRect();
  /* 上面紧挨着的是「推荐工序」那条展开栏（选中快速任务时打开），量它到输入区的间距 */
  const slot = document.querySelector('.qf-slot').getBoundingClientRect();
  return { gap: Math.round(comp.top - slot.bottom), card: q('.c-card'), plate: q('.c-plate'), tail: Math.round(document.querySelector('.c-foot').getBoundingClientRect().bottom - document.querySelector('.c-card').getBoundingClientRect().bottom) };
});
ok('C2 上方展开栏到输入区实际就是 8px（没有别的 margin 叠加）', C.gap === 8, JSON.stringify(C));
ok('C3 白卡/背板/次级行结构没被挤坏（仍留 28 给次级行）', C.tail >= 28, JSON.stringify([C.card, C.plate, C.tail]));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
