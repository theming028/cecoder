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

/* ---------- A 输入卡描边 ---------- */
const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push('home: ' + e.message));
await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(700);
const A = await h.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('.c-card'));
  return { color: cs.borderTopColor, w: cs.borderTopWidth, style: cs.borderTopStyle };
});
/* 第 127 轮：描边由纯黑 12% 改成 #DDE2E7 */
ok('A1 .c-card 描边 = #DDE2E7', A.color === 'rgb(221, 226, 231)', JSON.stringify(A.color));
ok('A2 仍是 1px 实线（尺寸不变）', A.w === '1px' && A.style === 'solid', A.w + ' ' + A.style);

/* ---------- B 任务总结页烟花 ---------- */
const s = await b.newPage();
s.on('pageerror', e => errs.push('summary: ' + e.message));
await s.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s.goto('file:///' + BASE + '/cecoder-summary.html', { waitUntil: 'load' });

const sig = () => s.evaluate(() => {
  const cv = document.getElementById('sumFw');
  if (!cv) return -1;
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let sum = 0;
  for (let i = 3, k = 0; i < d.length; i += 4, k++) sum += d[i] * ((k % 11) + 1);
  return sum;
});

await wait(500);
const B0 = await s.evaluate(() => {
  const cv = document.getElementById('sumFw');
  if (!cv) return null;
  const cs = getComputedStyle(cv);
  const pr = document.getElementById('panelMain').getBoundingClientRect();
  const cr = cv.getBoundingClientRect();
  return {
    pe: cs.pointerEvents, z: cs.zIndex, pos: cs.position,
    fit: Math.abs(cr.width - pr.width) < 2 && Math.abs(cr.height - pr.height) < 2,
    cw: cv.width, ch: cv.height
  };
});
ok('B1 烟花画布盖满 panel-main、不接鼠标事件、在内容之上', B0 && B0.fit && B0.pe === 'none' && B0.z === '9' && B0.pos === 'absolute', JSON.stringify(B0));

const s1 = await sig();
await wait(900);
const s2 = await sig();
ok('B2 画布真的在画（有像素、且在动）', s1 > 0 && s2 > 0 && s1 !== s2, JSON.stringify([s1, s2]));

/* 峰值帧率 */
await wait(400);
const fps = await s.evaluate(() => new Promise(res => {
  const t = []; let last = performance.now(); const t0 = last;
  const tick = () => { const n = performance.now(); t.push(n - last); last = n; if (n - t0 < 2000) requestAnimationFrame(tick); else res(t); };
  requestAnimationFrame(tick);
}));
const sorted = fps.slice(3).sort((a, b2) => a - b2);
const p95 = sorted[Math.floor(sorted.length * .95)];
ok('B3 烟花峰值仍 60fps（p95 < 22ms）', p95 < 22, 'p95=' + p95.toFixed(1) + 'ms');

/* 放完要收工：7s 后画布清空且不再重绘 */
await wait(4200);
const e1 = await sig();
await wait(700);
const e2 = await sig();
ok('B4 约 6s 放完就清屏、停止重绘（不留 rAF）', e1 === 0 && e2 === 0, JSON.stringify([e1, e2]));

/* ---------- C reduced-motion：只画一帧 ---------- */
await s.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await s.reload({ waitUntil: 'load' });
await wait(700);
const r1 = await sig();
await wait(900);
const r2 = await sig();
ok('C1 prefers-reduced-motion：画一帧静态爆点后定格', r1 > 0 && r1 === r2, JSON.stringify([r1, r2]));
await s.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

/* ---------- D 其它页面不受影响 ---------- */
const t = await b.newPage();
d_err: {
  await t.setViewport({ width: 1440, height: 900 });
  await t.goto('file:///' + BASE + '/cecoder-task.html', { waitUntil: 'load' });
  await wait(500);
  const D = await t.evaluate(() => !!document.getElementById('sumFw'));
  ok('D1 任务页没有烟花画布（只在总结页）', D === false, String(D));
  break d_err;
}
ok('D2 无脚本报错', errs.length === 0, errs.join(' | '));

console.log('\n通过 ' + pass + ' / 失败 ' + fail);
await b.close();
process.exit(fail ? 1 : 0);
