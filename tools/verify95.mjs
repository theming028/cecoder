/* 第 95 轮验收：
   ① 生成完成页底栏「重新生成」（次）/「完成工序」（主）
   ② 所有 tooltip 回到按钮上方
   ③ 生成中页「停止生成（10s）」倒计时
   ④ 抽屉出现不再把 .panel 滚出去（剧烈闪动）
   ⑤ 生成完成页画布 = 灰底 + 16px 田字网格 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================= A. 生成完成页：底栏 + 画布 + tooltip 方向 ================= */
const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(350);

const A = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const foot = q('.tp-foot'), sec = q('#udRegen'), pri = q('#udDone'), canvas = q('.ud-canvas'), bar = q('.ud-bar');
  const btn = e => [e.textContent.trim(), box(e), cs(e).backgroundColor, cs(e).boxShadow, cs(e).color, cs(e).fontSize + '/' + cs(e).fontWeight];
  return {
    foot: box(foot), footBg: cs(foot).backgroundColor, footSh: cs(foot).boxShadow,
    footBefore: (() => { const s = getComputedStyle(foot, '::before'); return [s.left, s.right, s.height, s.backgroundColor].join('/'); })(),
    sec: btn(sec), pri: btn(pri),
    order: [sec.compareDocumentPosition(pri) & Node.DOCUMENT_POSITION_FOLLOWING ? 'sec-first' : 'pri-first'],
    canvas: {
      box: box(canvas), bg: cs(canvas).backgroundColor, img: cs(canvas).backgroundImage,
      size: cs(canvas).backgroundSize, pos: cs(canvas).backgroundPosition,
      scrollH: canvas.scrollHeight
    },
    barBottom: box(bar)[1] + box(bar)[3],
    tips: qa('[data-tip]').map(e => [e.getAttribute('data-tip'), e.hasAttribute('data-tip-below')]),
    barLeftLine: cs(bar).boxShadow
  };
});

ok('A1 底栏 56 高、白底、左侧 1px 线', A.foot[3] === 56 && A.footBg === 'rgb(255, 255, 255)' && /rgb\(235, 236, 237\) 1px 0px 0px 0px inset/.test(A.footSh), JSON.stringify([A.foot[3], A.footBg, A.footSh]));
ok('A2 顶线两端各留 20（与生成中页同款）', A.footBefore === '20px/20px/1px/rgb(235, 236, 237)', A.footBefore);
ok('A3 次要按钮 = 重新生成', A.sec[0] === '重新生成', A.sec[0]);
ok('A4 主要按钮 = 完成工序', A.pri[0] === '完成工序', A.pri[0]);
ok('A5 顺序：次要在前、主要在后', A.order[0] === 'sec-first', A.order[0]);
ok('A6 次要按钮白底 + 1px #E5E5E5 描边、正文色', A.sec[2] === 'rgb(255, 255, 255)' && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(A.sec[3]) && A.sec[4] === 'rgb(31, 31, 31)', JSON.stringify(A.sec.slice(2, 5)));
ok('A7 主要按钮主色 #3770F7 + 白字', A.pri[2] === 'rgb(55, 112, 247)' && A.pri[4] === 'rgb(255, 255, 255)', JSON.stringify(A.pri.slice(2, 5)));
ok('A8 两键同宽 184×36', A.sec[1][2] === 184 && A.pri[1][2] === 184 && A.sec[1][3] === 36 && A.pri[1][3] === 36, A.sec[1].join(',') + ' / ' + A.pri[1].join(','));
ok('A9 两键间距 12', A.pri[1][0] - (A.sec[1][0] + A.sec[1][2]) === 12, A.pri[1][0] - (A.sec[1][0] + A.sec[1][2]));
ok('A10 组居中于底栏', Math.abs((A.sec[1][0] + A.pri[1][0] + A.pri[1][2]) / 2 - (A.foot[0] + A.foot[2] / 2)) <= 1,
  Math.round((A.sec[1][0] + A.pri[1][0] + A.pri[1][2]) / 2) + ' vs ' + Math.round(A.foot[0] + A.foot[2] / 2));
ok('A11 底栏贴页面底部', A.foot[1] + A.foot[3] === 900, A.foot[1] + A.foot[3]);

ok('A12 画布底色 #F5F5F5（灰）', A.canvas.bg === 'rgb(245, 245, 245)', A.canvas.bg);
ok('A13 画布双轴网格线（两条 linear-gradient）', /linear-gradient/.test(A.canvas.img) && (A.canvas.img.match(/linear-gradient/g) || []).length === 2, A.canvas.img.slice(0, 80));
ok('A14 网格 16px 方格（横竖两层）', A.canvas.size.split(', ').every(v => v === '16px 16px'), A.canvas.size);
ok('A15 网格从画布左上起', A.canvas.pos.split(', ').every(v => v === '0px 0px'), A.canvas.pos);
ok('A16 画布紧接工具条、撑到底栏上方', A.canvas.box[1] === A.barBottom && A.canvas.box[1] + A.canvas.box[3] === A.foot[1],
  A.canvas.box.join(',') + ' barBottom ' + A.barBottom + ' footTop ' + A.foot[1]);

const wanted = ['批注', '截图', '编辑 UI 元素', '框选', '更多', '缩小', '放大'];
ok('A17 tooltip 全部不再下弹，7 个工具/缩放提示齐备', A.tips.every(t => t[1] === false) && wanted.every(w => A.tips.some(t => t[0] === w)), JSON.stringify(A.tips.map(t => t[0])));
await p.hover('.ud-tool:nth-child(1)');
await wait(420);
const tip1 = await p.evaluate(() => { const t = document.querySelector('.cds-tip'); const r = t.getBoundingClientRect(); return [t.textContent, t.classList.contains('is-on'), Math.round(r.y), Math.round(r.height), t.className]; });
ok('A18 工具键 tooltip 在按钮上方', tip1[1] && tip1[2] + tip1[3] <= A.barBottom && /is-above/.test(tip1[4]), JSON.stringify(tip1) + ' barBottom ' + A.barBottom);
await p.hover('#udZoomIn');
await wait(420);
const tip2 = await p.evaluate(() => { const t = document.querySelector('.cds-tip'); const r = t.getBoundingClientRect(); return [t.textContent, t.classList.contains('is-on'), Math.round(r.y), t.className]; });
ok('A19 缩放「放大」tooltip 也在上方', tip2[1] && tip2[0] === '放大' && /is-above/.test(tip2[3]), JSON.stringify(tip2));
ok('A20 无 JS 报错（uidone）', p.__e.length === 0, p.__e.join(' | '));

/* 底栏点击跳转 */
await p.click('#udRegen');
await wait(600);
ok('B1 「重新生成」回生成中页', /cecoder-uigen\.html/.test(p.url()), p.url().split('/').pop());
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(300);
await p.click('#udDone');
await wait(600);
ok('B2 「完成工序」进任务页（工序 4）', /cecoder-task\.html\?/.test(p.url()) && /id=0/.test(p.url()), p.url().split('/').pop());

/* ================= C. 生成中页：倒计时 ================= */
const q = await b.newPage(); q.__e = [];
q.on('pageerror', e => q.__e.push('pageerror: ' + e.message));
q.on('console', m => { if (m.type() === 'error') q.__e.push('console: ' + m.text()); });
await q.setViewport({ width: 1440, height: 900 });
await q.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
await wait(200);
const c0 = await q.evaluate(() => { const e = document.getElementById('ugStop'); return [e.textContent.trim(), Math.round(e.getBoundingClientRect().width)]; });
ok('C1 初始文案「停止生成（10s）」', c0[0] === '停止生成（10s）', c0[0]);
await wait(2100);
const c1 = await q.evaluate(() => { const e = document.getElementById('ugStop'); return [e.textContent.trim(), Math.round(e.getBoundingClientRect().width)]; });
ok('C2 2 秒后变 08s', c1[0] === '停止生成（08s）', c1[0]);
ok('C3 倒计时不改变按钮宽度（两位补零）', c0[1] === c1[1], c0[1] + ' → ' + c1[1]);
await wait(4000);
const c2 = await q.evaluate(() => document.getElementById('ugStop').textContent.trim());
ok('C4 继续递减（04s 左右）', /^停止生成（0[345]s）$/.test(c2), c2);
ok('C5 10s 到点自动进生成完成页', await q.waitForNavigation({ timeout: 6000 }).then(() => /cecoder-uidone\.html/.test(q.url())).catch(() => false), q.url().split('/').pop());
ok('C6 无 JS 报错（uigen）', q.__e.length === 0, q.__e.join(' | '));

/* ================= D. 抽屉：不再闪动 ================= */
const r = await b.newPage(); r.__e = [];
r.on('pageerror', e => r.__e.push('pageerror: ' + e.message));
await r.setViewport({ width: 1440, height: 900 });
await r.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(400);
const jitter = await r.evaluate(() => new Promise(res => {
  const panel = document.querySelector('.panel');
  const card = document.querySelector('.ug-card');
  const log = [];
  const t0 = performance.now();
  const tick = () => {
    const b = card.getBoundingClientRect();
    log.push([Math.round(b.x), Math.round(b.y), panel.scrollLeft, panel.scrollTop]);
    if (performance.now() - t0 < 500) requestAnimationFrame(tick); else res(log);
  };
  requestAnimationFrame(tick);
  document.querySelector('.ug-scard [data-preview]').click();
}));
const xs = new Set(jitter.map(l => l[0])), ys = new Set(jitter.map(l => l[1]));
const scrolled = jitter.some(l => l[2] !== 0 || l[3] !== 0);
ok('D1 抽屉出现时页面内容不位移', xs.size === 1 && ys.size === 1, 'x=' + [...xs].join(',') + ' y=' + [...ys].join(','));
ok('D2 .panel 不再被 focus 滚出去', scrolled === false);
const opened = await r.evaluate(() => {
  const d = document.getElementById('dsDrawer');
  const pn = d.querySelector('.dsd-panel');
  return [d.classList.contains('is-open'), Math.round(pn.getBoundingClientRect().width), getComputedStyle(pn).transform];
});
ok('D3 抽屉照常打开、800 宽、动画结束停在原位', opened[0] === true && opened[1] === 800 && (opened[2] === 'none' || opened[2] === 'matrix(1, 0, 0, 1, 0, 0)'), JSON.stringify(opened));
ok('D4 无 JS 报错（ui）', r.__e.length === 0, r.__e.join(' | '));

console.log('\n第 95 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
