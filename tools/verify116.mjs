/* 第 116 轮验收：首页「云雾」背景的观感修正
   用户反馈两条：①细看有马赛克；②"混沌云"看不出在运动。
   ①的成因：canvas 内部按 1/6 分辨率绘制、CSS 拉满 → 每个源像素变成 6×6 屏像素，
     缓变渐变放大后是一片软方块。改 1/2 后只剩 2px。
   ②的成因：每点只在自身 3~4% 屏宽的范围内小幅往复（周期 8~20s），位移总量 <60px；
     改成幅度 7~17%、周期 30~58s，另加第二种角速度叠加出"变形"而非"整块平移"。
   本脚本只量可量化的部分：采样比、运动幅度、帧成本、静止偏好、其它页面不画雾。 */
import puppeteer from 'puppeteer-core';
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1'] });

const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(1200);

/* ---------- A 采样比：块尺寸 ---------- */
const A = await h.evaluate(() => {
  const cv = document.getElementById('pmMist');
  const r = cv.getBoundingClientRect();
  const pm = document.getElementById('panelMain').getBoundingClientRect();
  return {
    inner: [cv.width, cv.height],
    css: [Math.round(r.width), Math.round(r.height)],
    panel: [Math.round(pm.width), Math.round(pm.height)],
    ratio: +(r.width / cv.width).toFixed(3),
    ir: getComputedStyle(cv).imageRendering,
    disp: getComputedStyle(cv).display,
    pe: getComputedStyle(cv).pointerEvents
  };
});
ok('A1 一个源像素只放大到 2~2.5 个屏像素（块感不可辨）', A.ratio >= 1.9 && A.ratio <= 2.5, JSON.stringify([A.ratio, A.inner]));
ok('A2 canvas 铺满整个 panel-main', A.css[0] === A.panel[0] && A.css[1] === A.panel[1], JSON.stringify([A.css, A.panel]));
ok('A3 没开 pixelated（否则 2px 块反而更硬）', A.ir === 'auto', A.ir);
ok('A4 仍是装饰层：显示中、不吃事件', A.disp === 'block' && A.pe === 'none', JSON.stringify([A.disp, A.pe]));

/* ---------- B 运动幅度：1.5 秒内雾应该明显变过 ---------- */
const B = await h.evaluate(async () => {
  const cv = document.getElementById('pmMist');
  const ctx = cv.getContext('2d');
  const snap = () => ctx.getImageData(0, 0, cv.width, cv.height).data;
  const a = snap();
  await new Promise(r => setTimeout(r, 1500));
  const c = snap();
  let sum = 0, max = 0, moved = 0, n = a.length / 4;
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.abs(a[i + 3] - c[i + 3]);
    sum += d; if (d > max) max = d; if (d > 4) moved++;
  }
  return { n, avg: +(sum / n).toFixed(2), max, movedPct: +(moved / n * 100).toFixed(1) };
});
ok('B1 1.5 秒内平均 alpha 变化 ≥ 3（肉眼能看出在走）', B.avg >= 3, String(B.avg));
ok('B2 超过 30% 的像素发生了变化', B.movedPct >= 30, B.movedPct + '%');
ok('B3 存在明显位移（单点 alpha 变化峰值 ≥ 25）', B.max >= 25, String(B.max));

/* 两次相隔 0.4 秒的快照也要有差异（15fps 下每帧都在更新，不是偶发跳变） */
const B2 = await h.evaluate(async () => {
  const cv = document.getElementById('pmMist');
  const ctx = cv.getContext('2d');
  const a = ctx.getImageData(0, 0, cv.width, cv.height).data;
  await new Promise(r => setTimeout(r, 400));
  const c = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let d = 0;
  for (let i = 3; i < a.length; i += 4) d += Math.abs(a[i] - c[i]);
  return +(d / (a.length / 4)).toFixed(2);
});
ok('B4 0.4 秒内仍在变（不是 1~2 秒才跳一下）', B2 >= 0.6, String(B2));

/* ---------- C 帧成本：加分辨率后主线程不能掉帧 ---------- */
const C = await h.evaluate(async () => {
  const gaps = [];
  let last = performance.now();
  await new Promise(res => {
    const t0 = performance.now();
    const step = () => {
      const now = performance.now();
      gaps.push(now - last); last = now;
      if (now - t0 < 2500) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  gaps.sort((a, b) => a - b);
  const q = p => gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * p))];
  return { n: gaps.length, p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), max: +gaps[gaps.length - 1].toFixed(1) };
});
ok('C1 帧间隔 p95 ≤ 20ms（60fps 不抖）', C.p95 <= 20, JSON.stringify(C));
ok('C2 无长帧（最大间隔 ≤ 34ms）', C.max <= 34, JSON.stringify(C));

/* ---------- D 雾层仍只盖背景：标题/输入卡可命中 ---------- */
const D = await h.evaluate(() => {
  const hero = document.querySelector('.hero').getBoundingClientRect();
  const el = document.elementFromPoint(hero.left + 20, hero.top + 10);
  const card = document.querySelector('.c-card').getBoundingClientRect();
  const el2 = document.elementFromPoint(card.left + card.width / 2, card.top + 10);
  return { hero: el ? el.tagName + '.' + el.className : null, card: el2 ? el2.tagName + '.' + el2.className : null };
});
ok('D1 标题区命中的是内容元素（雾没盖上去）', !!D.hero && !/pm-mist/.test(D.hero), String(D.hero));
ok('D2 输入卡可命中', !!D.card && !/pm-mist/.test(D.card), String(D.card));

/* ---------- E prefers-reduced-motion：只画一帧、不动 ---------- */
const rp = await b.newPage();
await rp.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await rp.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await rp.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const E = await rp.evaluate(async () => {
  const cv = document.getElementById('pmMist');
  const ctx = cv.getContext('2d');
  const a = ctx.getImageData(0, 0, cv.width, cv.height).data;
  await new Promise(r => setTimeout(r, 800));
  const c = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let d = 0, cov = 0;
  for (let i = 0; i < a.length; i += 4) { d += Math.abs(a[i + 3] - c[i + 3]); if (a[i + 3] > 0) cov++; }
  return { same: d === 0, covPct: +(cov / (a.length / 4) * 100).toFixed(1) };
});
ok('E1 省电模式下雾静止（两帧完全一致）', E.same, JSON.stringify(E));
ok('E2 省电模式下仍画了一帧（不是空白）', E.covPct > 60, String(E.covPct));
await rp.close();

/* ---------- F 其它页面不画雾 ---------- */
const s2 = await b.newPage();
await s2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s2.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(600);
const F = await s2.evaluate(() => {
  const cv = document.getElementById('pmMist');
  return cv ? { disp: getComputedStyle(cv).display, w: cv.width } : null;
});
ok('F1 会话页雾层隐藏、canvas 未启动', !!F && F.disp === 'none' && F.w === 220, JSON.stringify(F));
await s2.close();

ok('G1 首页无脚本报错', errs.length === 0, errs.join(' | '));

await b.close();
console.log('\n' + (fail === 0 ? '全部通过' : '存在失败') + `  ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
