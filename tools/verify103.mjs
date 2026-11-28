/* 第 103 轮验收：
   ① 框选模式下红框可点：hover 底色加深 + 右上角出现 × + 光标 pointer
   ② 点红框 = 删掉它，剩下的序号自动重排成 1..n；全删完下一框从 1 开始
   ③ 在框上按下不会拖动画板、也不会起新框
   ④ Esc 退出框选模式（键回弹、画布 is-mq 撤掉、光标复原），已画的框保留
   ⑤ 退出模式后红框不吃指针：点它不会删、也不会挡页面点击 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);

/* 画一个框：按画板比例给起止点 */
const draw = async (fx0, fy0, fx1, fy1) => {
  const r = await p.evaluate(() => { const b = document.getElementById('udBoard').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await p.mouse.move(r.x + r.w * fx0, r.y + r.h * fy0); await p.mouse.down();
  await p.mouse.move(r.x + r.w * fx1, r.y + r.h * fy1, { steps: 8 }); await p.mouse.up(); await wait(140);
};
const boxes = () => p.evaluate(() => [...document.querySelectorAll('.ud-mq')].map(el => {
  const r = el.getBoundingClientRect();
  return { no: el.getAttribute('data-no'), badge: el.querySelector('.ud-mq-no i').textContent, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}));

await p.click('#udFrame'); await wait(200);
/* 第 104 轮：每画完一个框都会弹批注浮窗（会挡住下一个框的位置），画完就 Esc 收起 —— 框保留、模式还在 */
await draw(0.05, 0.06, 0.22, 0.18); await p.keyboard.press('Escape'); await wait(150);
await draw(0.30, 0.30, 0.46, 0.42); await p.keyboard.press('Escape'); await wait(150);
await draw(0.55, 0.60, 0.70, 0.72); await p.keyboard.press('Escape'); await wait(150);
const B0 = await boxes();
ok('A1 画了 3 个框，序号 1/2/3', B0.length === 3 && B0.map(x => x.badge).join('') === '123', JSON.stringify(B0.map(x => x.badge)));

/* ---------- ① hover 可点表现 ---------- */
await p.mouse.move(B0[0].cx, B0[0].cy); await wait(260);
const H = await p.evaluate(() => {
  const el = document.querySelector('.ud-mq');
  return {
    cursor: getComputedStyle(el).cursor,
    pe: getComputedStyle(el).pointerEvents,
    bg: getComputedStyle(el).backgroundColor,
    delOp: getComputedStyle(el.querySelector('.ud-mq-del i')).opacity,
    delBox: (() => { const r = el.querySelector('.ud-mq-del i').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })()
  };
});
ok('B1 框选模式下红框吃指针、光标 pointer', H.pe === 'auto' && H.cursor === 'pointer', JSON.stringify([H.pe, H.cursor]));
ok('B2 hover 底色加深到 18%', /rgba\(245, 63, 63, 0\.1[0-9]?\)/.test(H.bg) && !/0\.08\)/.test(H.bg), H.bg);
ok('B3 hover 时右上角冒出 14×14 删除键', H.delOp === '1' && H.delBox[0] === 14 && H.delBox[1] === 14, JSON.stringify([H.delOp, H.delBox]));

/* ---------- ② 点框删除 + 重排 ---------- */
await p.mouse.click(B0[1].cx, B0[1].cy); await wait(200);
const B1 = await boxes();
ok('C1 点第 2 个框把它删掉，剩 2 个', B1.length === 2, B1.length);
ok('C2 剩下的序号重排成 1/2（data-no 同步）', B1.map(x => x.badge).join('') === '12' && B1.map(x => x.no).join('') === '12', JSON.stringify(B1.map(x => [x.no, x.badge])));

/* 在框上按下：不拖画板、不起新框，松手即删 */
const t0 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
await p.mouse.move(B1[0].cx, B1[0].cy); await p.mouse.down();
await p.mouse.move(B1[0].cx + 90, B1[0].cy + 60, { steps: 8 }); await p.mouse.up(); await wait(200);
const D = await p.evaluate(() => ({
  tf: document.getElementById('udBoardWrap').style.transform,
  n: document.querySelectorAll('.ud-mq').length
}));
ok('D1 从框上拖不会拖动画板', D.tf === t0, JSON.stringify([t0, D.tf]));
ok('D2 从框上拖既不起新框也不误删（数量不变）', D.n === 2, D.n);

/* 一格格点掉，删光后序号重新从 1 开始 */
let B2 = await boxes();
await p.mouse.click(B2[0].cx, B2[0].cy); await wait(160);
B2 = await boxes();
await p.mouse.click(B2[0].cx, B2[0].cy); await wait(160);
const zero = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
await draw(0.1, 0.5, 0.24, 0.62);
await p.keyboard.press('Escape'); await wait(150);   /* 收起这一框弹的浮窗，下面那次 Esc 才是退模式 */
const B3 = await boxes();
ok('C3 删光后再画，序号从 1 开始', zero === 0 && B3.length === 1 && B3[0].badge === '1', JSON.stringify([zero, B3.map(x => x.badge)]));

/* ---------- ③ Esc 退出 ---------- */
await p.keyboard.press('Escape'); await wait(250);
const E = await p.evaluate(() => ({
  on: document.getElementById('udCanvas').classList.contains('is-mq'),
  pressed: document.getElementById('udFrame').getAttribute('aria-pressed'),
  cursor: getComputedStyle(document.getElementById('udBoard')).cursor,
  n: document.querySelectorAll('.ud-mq').length,
  pe: getComputedStyle(document.querySelector('.ud-mq')).pointerEvents
}));
ok('E1 Esc 退出框选模式（画布/键/光标都复原）', !E.on && E.pressed === 'false' && E.cursor === 'grab', JSON.stringify([E.on, E.pressed, E.cursor]));
ok('E2 已经画好的框保留，但退出后不吃指针', E.n === 1 && E.pe === 'none', JSON.stringify([E.n, E.pe]));

/* 退出后点框不会删 */
const F0 = await boxes();
await p.mouse.click(F0[0].cx, F0[0].cy); await wait(200);
const F1 = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
ok('E3 退出模式后点框不会误删', F1 === 1, F1);

/* 退出后拖画板仍正常 */
const g0 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
await p.mouse.move(700, 500); await p.mouse.down();
await p.mouse.move(760, 545, { steps: 8 }); await p.mouse.up(); await wait(180);
const g1 = await p.evaluate(() => document.getElementById('udBoardWrap').style.transform);
ok('E4 退出后画板照常可拖', g0 !== g1, JSON.stringify([g0, g1]));

/* 退出后不能再画 */
const n0 = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
await draw(0.5, 0.2, 0.66, 0.3);
const n1 = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
ok('E5 退出后拖动不会新画框', n0 === n1, JSON.stringify([n0, n1]));

ok('F1 无 JS 报错', p.__e.length === 0, p.__e.slice(0, 3).join(' | '));

await b.close();
console.log('\n第 103 轮：' + pass + ' 通过 / ' + fail.length + ' 失败');
fail.forEach(f => console.log('  ✗ ' + f));
process.exit(fail.length ? 1 : 0);
