/* 第 101 轮验收：
   ① 工序步骤展开/收起记进 localStorage，所有页面共用（刷新/换页都保持）
   ② 下拉菜单（.wd-menu）前面不再冒小圆点
   ③ 「框选」进入模式 → 画板内拖出红框 + 序号（可多个，再点/Esc 退出，框留下）
   ④ 框存画板原始坐标，缩放后位置/尺寸不变形，序号视觉尺寸恒定 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const U = f => 'file:///' + BASE + '/' + f;

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });

/* ---------- ① 工序步骤记忆 ---------- */
await p.goto(U('cecoder-task.html'), { waitUntil: 'load' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'load' }); await wait(300);

const stepState = () => p.evaluate(() => ({
  off: !!document.querySelector('.panel-main').classList.contains('is-steps-off'),
  label: (document.getElementById('tkStepsToggle') || {}).textContent.trim().slice(0, 2),
  saved: localStorage.getItem('cecoder.stepsOff')
}));

const S0 = await stepState();
ok('A1 首次进任务页默认展开', S0.off === false, JSON.stringify(S0));

await p.click('#tkStepsToggle'); await wait(250);
const S1 = await stepState();
ok('A2 点「收起」→ 收起 + 标签变「展开」', S1.off === true && S1.label === '展开', JSON.stringify(S1));
ok('A3 状态写进 localStorage = 1', S1.saved === '1', S1.saved);

await p.reload({ waitUntil: 'load' }); await wait(300);
const S2 = await stepState();
ok('A4 刷新任务页仍保持收起', S2.off === true && S2.saved === '1', JSON.stringify(S2));

await p.goto(U('cecoder-summary.html'), { waitUntil: 'load' }); await wait(300);
const S3 = await p.evaluate(() => !!document.querySelector('.panel-main').classList.contains('is-steps-off'));
ok('A5 换到任务总结页也保持收起（所有页面共用）', S3 === true, S3);

await p.click('#tkStepsToggle'); await wait(250);
await p.goto(U('cecoder-ui.html'), { waitUntil: 'load' }); await wait(300);
const S4 = await p.evaluate(() => ({
  off: !!document.querySelector('.panel-main').classList.contains('is-steps-off'),
  saved: localStorage.getItem('cecoder.stepsOff')
}));
ok('A6 在总结页展开后，UI 设计页也是展开', S4.off === false && S4.saved === '0', JSON.stringify(S4));

/* ---------- ② 菜单小圆点 ---------- */
await p.goto(U('cecoder-uidone.html'), { waitUntil: 'load' }); await wait(350);
const M = await p.evaluate(() => {
  const ul = document.getElementById('udMoreMenu');
  const li = ul.querySelector('li');
  return { ul: getComputedStyle(ul).listStyleType, li: getComputedStyle(li).listStyleType, disp: getComputedStyle(li).display };
});
ok('B1 菜单 ul 无 list marker', M.ul === 'none', JSON.stringify(M));
ok('B2 菜单 li 无 list marker', M.li === 'none', JSON.stringify(M));

/* ---------- ③ 框选 ---------- */
const C0 = await p.evaluate(() => {
  const f = document.getElementById('udFrame');
  return { has: !!f, pressed: f.getAttribute('aria-pressed'), mq: !!document.getElementById('udMqLayer') };
});
ok('C1 「框选」键带 id + aria-pressed=false，画板内有框选图层', C0.has && C0.pressed === 'false' && C0.mq, JSON.stringify(C0));

await p.click('#udFrame'); await wait(200);
const C1 = await p.evaluate(() => {
  const br = document.getElementById('udBoard').getBoundingClientRect();
  return {
    on: document.getElementById('udCanvas').classList.contains('is-mq'),
    pressed: document.getElementById('udFrame').getAttribute('aria-pressed'),
    btnOn: document.getElementById('udFrame').classList.contains('is-on'),
    cursor: getComputedStyle(document.getElementById('udBoard')).cursor,
    s: br.width / 1440, box: { x: br.left, y: br.top, w: br.width, h: br.height }
  };
});
ok('C2 点键 → 画布 is-mq + 键按下态 + 光标 crosshair', C1.on && C1.pressed === 'true' && C1.btnOn && C1.cursor === 'crosshair', JSON.stringify({ on: C1.on, pressed: C1.pressed, cursor: C1.cursor }));

const drag = async (fx0, fy0, fx1, fy1) => {
  const r = await p.evaluate(() => { const b = document.getElementById('udBoard').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  const x0 = r.x + r.w * fx0, y0 = r.y + r.h * fy0, x1 = r.x + r.w * fx1, y1 = r.y + r.h * fy1;
  await p.mouse.move(x0, y0); await p.mouse.down();
  await p.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 6 });
  await p.mouse.move(x1, y1, { steps: 6 }); await p.mouse.up(); await wait(160);
  return { s: r.w / 1440, w: Math.abs(x1 - x0) / (r.w / 1440), h: Math.abs(y1 - y0) / (r.w / 1440) };
};

const D1 = await drag(0.18, 0.18, 0.52, 0.42);
const R1 = await p.evaluate(() => {
  const list = [...document.querySelectorAll('.ud-mq')];
  const el = list[0];
  return {
    n: list.length,
    no: el ? el.getAttribute('data-no') : '',
    badge: el ? el.querySelector('.ud-mq-no i').textContent : '',
    w: el ? parseFloat(el.style.width) : 0,
    h: el ? parseFloat(el.style.height) : 0,
    border: el ? getComputedStyle(el).borderTopColor : '',
    inv: el ? getComputedStyle(el.querySelector('.ud-mq-no')).transform : ''
  };
});
ok('C3 拖出第 1 个框', R1.n === 1, R1.n);
ok('C4 框的宽高按画板坐标记（≈ 期望值 ±6）', Math.abs(R1.w - D1.w) <= 6 && Math.abs(R1.h - D1.h) <= 6, JSON.stringify([R1.w, Math.round(D1.w), R1.h, Math.round(D1.h)]));
ok('C5 红框（#F53F3F）+ 序号「1」', /rgb\(245, 63, 63\)/.test(R1.border) && R1.badge === '1' && R1.no === '1', JSON.stringify([R1.border, R1.badge]));
const sc = t => { const m = /matrix\(([-\d.]+)/.exec(t || ''); return m ? parseFloat(m[1]) : 1; };
ok('C6 序号按 1/缩放 反向缩（scale = 1/s）', Math.abs(sc(R1.inv) - 1 / C1.s) < 0.1, JSON.stringify([sc(R1.inv), C1.s]));

const D2 = await drag(0.6, 0.55, 0.82, 0.8);
const R2 = await p.evaluate(() => {
  const list = [...document.querySelectorAll('.ud-mq')];
  return { n: list.length, no: list[1] ? list[1].getAttribute('data-no') : '', b1: list[0].querySelector('.ud-mq-no i').textContent };
});
ok('C7 第 2 个框序号自动递增 2，第 1 个保持 1', R2.n === 2 && R2.no === '2' && R2.b1 === '1', JSON.stringify(R2));

/* 缩放后：位置尺寸不变形（原始坐标不变），画板内屏幕尺寸按比例变 */
const before = await p.evaluate(() => {
  const el = document.querySelector('.ud-mq');
  const r = el.getBoundingClientRect();
  return { clipW: r.width, styleW: parseFloat(el.style.width) };
});
await p.click('#udZoomVal'); await wait(250);   /* 回 100% */
const after = await p.evaluate(() => {
  const el = document.querySelector('.ud-mq');
  const r = el.getBoundingClientRect();
  const br = document.getElementById('udBoard').getBoundingClientRect();
  return { clipW: r.width, styleW: parseFloat(el.style.width), s: br.width / 1440, inv: getComputedStyle(document.querySelector('.ud-mq-no')).transform };
});
ok('C8 缩放后框的原始宽不变、屏幕宽 = 原宽×缩放', after.styleW === before.styleW && Math.abs(after.clipW - after.styleW * after.s) <= 2, JSON.stringify([before.clipW, after.clipW, after.s]));
ok('C9 100% 时序号缩放比 = 1（视觉恒 18px）', Math.abs(sc(after.inv) - 1 / after.s) < 0.1, JSON.stringify([sc(after.inv), after.s]));

/* 误点（<8 板内像素）不记框 */
await drag(0.5, 0.2, 0.501, 0.201);
const R3 = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
ok('C10 小拖动（<8px）不算框', R3 === 2, R3);

/* Esc 退出，框保留 */
await p.keyboard.press('Escape'); await wait(200);
const C3 = await p.evaluate(() => ({
  on: document.getElementById('udCanvas').classList.contains('is-mq'),
  pressed: document.getElementById('udFrame').getAttribute('aria-pressed'),
  n: document.querySelectorAll('.ud-mq').length,
  cursor: getComputedStyle(document.getElementById('udBoard')).cursor
}));
ok('C11 Esc 退出模式、框保留、光标恢复 grab', !C3.on && C3.pressed === 'false' && C3.n === 2 && C3.cursor === 'grab', JSON.stringify(C3));

/* 非框选模式下画板仍能拖动（不回归） */
const mv0 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
await p.mouse.move(700, 500); await p.mouse.down();
await p.mouse.move(760, 545, { steps: 8 }); await p.mouse.up(); await wait(160);
const mv1 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
ok('C12 退出后画板仍可拖动', mv0 !== mv1, JSON.stringify([mv0, mv1]));

await p.evaluate(() => localStorage.clear());
ok('D1 无 JS 报错', p.__e.length === 0, p.__e.slice(0, 3).join(' | '));

await b.close();
console.log('\n第 101 轮：' + pass + ' 通过 / ' + fail.length + ' 失败');
fail.forEach(f => console.log('  ✗ ' + f));
process.exit(fail.length ? 1 : 0);
