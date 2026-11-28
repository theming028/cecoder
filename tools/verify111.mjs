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
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);

/* ---------- A 背景：去网格 + 参考站原版色 ---------- */
const A = await p.evaluate(() => {
  const pm = document.getElementById('panelMain');
  const cs = getComputedStyle(pm);
  const rgb = (cs.backgroundColor.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
  return {
    page: document.body.dataset.page,
    bg: cs.backgroundColor, rgb,
    linear: (cs.backgroundImage.match(/linear-gradient/g) || []).length,
    size: cs.backgroundSize,
    radial: (cs.backgroundImage.match(/radial-gradient/g) || []).length
  };
});
ok('A1 只在首页生效', A.page === 'home', A.page);
ok('A2 网格已去掉（0 条 linear-gradient，无 44px 重复底）', A.linear === 0 && !/44px/.test(A.size), JSON.stringify([A.linear, A.size]));
ok('A3 底色换成参考站原版近白冷蓝 #FBFCFE（蓝>绿>红）', A.rgb[2] > A.rgb[1] && A.rgb[1] > A.rgb[0] && Math.abs(A.rgb[0] - 251) <= 2, JSON.stringify(A.rgb));
ok('A4 两团静态柔光仍画在背景上', A.radial === 2, String(A.radial));

/* canvas 里的雾色必须是参考站那套冷蓝灰（色相 ~219°，不是产品主色 226° 的亮蓝，也不是紫） */
const M = await p.evaluate(() => {
  const cv = document.getElementById('pmMist');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let r = 0, g = 0, b2 = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 10) { r += d[i]; g += d[i + 1]; b2 += d[i + 2]; n++; } }
  r /= n; g /= n; b2 /= n;
  const mx = Math.max(r, g, b2), mn = Math.min(r, g, b2), dd = mx - mn;
  const hue = mx === b2 ? 240 + 60 * (r - g) / (dd || 1) : -1;
  return { rgb: [Math.round(r), Math.round(g), Math.round(b2)], hue: +hue.toFixed(1), cov: +(n / (d.length / 4)).toFixed(2) };
});
ok('A5 雾色是参考站冷蓝灰（220±10°，G>R 不发紫）', M.hue > 210 && M.hue < 232 && M.rgb[1] > M.rgb[0], JSON.stringify(M));
ok('A6 雾铺满面板（覆盖率 > 90%）', M.cov > 0.9, String(M.cov));

/* ---------- B 工具栏：chip 磨砂白 + label 白 85% ---------- */
/* 第 107 轮起默认不预选任何 chip，先点一个才有选中态可测 */
await p.click('.chip[data-wb="通用"]');
await wait(200);
const B = await p.evaluate(() => {
  const chips = [...document.querySelectorAll('[data-chips="process"] .chip')];
  const quick = [...document.querySelectorAll('[data-chips="quick"] .chip')];
  const g = el => { const c = getComputedStyle(el); return { bg: c.backgroundColor, bf: c.backdropFilter || c.webkitBackdropFilter, op: c.opacity }; };
  const label = getComputedStyle(document.querySelector('.tb-label'));
  const label2 = getComputedStyle(document.querySelector('.tb-label-2'));
  const act = document.querySelector('.chip.is-active');
  return {
    n: chips.length + quick.length,
    first: g(chips[1] || chips[0]), quick1: g(quick[0]),
    borders: (chips.length + quick.length) > 0 ? [...chips, ...quick].every(c => getComputedStyle(c).borderTopColor === 'rgba(0, 0, 0, 0)') : false,
    active: act ? getComputedStyle(act).backgroundColor : null,
    label: { color: label.color, op: label.opacity },
    label2: { color: label2.color, op: label2.opacity }
  };
});
ok('B1 两组 chip 都拿到了磨砂白 80%（第 112 轮由 85% 降下来）', /rgba\(255, 255, 255, 0\.8\)/.test(B.first.bg) && /rgba\(255, 255, 255, 0\.8\)/.test(B.quick1.bg), JSON.stringify([B.first.bg, B.quick1.bg]));
ok('B2 chip 带毛玻璃（blur 15px）', /blur\(15px\)/.test(B.first.bf) && /blur\(15px\)/.test(B.quick1.bf), JSON.stringify([B.first.bf, B.quick1.bf]));
ok('B2b 所有 chip 的边框都去掉了（transparent）', B.borders, String(B.borders));
ok('B3 快速任务组不再整组压到 80% 透明（否则变 68% 白）', B.quick1.op === '1', B.quick1.op);
/* 第 113 轮：白 85% 在浅雾底上对比度仅 1.15:1，按用户意见改回次级正文色 */
ok('B4 tb-label 改次级正文色（第 113 轮撤掉白字），「快速任务」不再压 opacity', !/rgba\(255, 255, 255/.test(B.label.color) && B.label.color === B.label2.color && B.label2.op === '1', JSON.stringify([B.label, B.label2]));
ok('B5 选中态仍是浅蓝但做成透的（不打断玻璃感）', /rgba\(243, 247, 255, 0\.9\)/.test(B.active), B.active);

/* ---------- C 三个容器：工作台子项 / 推荐工序 / 场景卡 ---------- */
const C = await p.evaluate(() => {
  const g = sel => { const el = document.querySelector(sel); if (!el) return null; const c = getComputedStyle(el); return { bg: c.backgroundColor, bf: c.backdropFilter || c.webkitBackdropFilter }; };
  return { wb: g('.wb-bar'), qf: g('.qf-bar'), sc: g('.scene') };
});
for (const [k, name] of [['wb', '工作台子项栏 wb-bar'], ['qf', '推荐工序栏 qf-bar'], ['sc', '场景卡 scene']]) {
  const v = C[k];
  ok('C-' + k + ' ' + name + ' = 白 85% + 毛玻璃', !!v && /rgba\(255, 255, 255, 0\.85\)/.test(v.bg) && /blur\(15px\)/.test(v.bf), JSON.stringify(v));
}

/* ---------- D 不回归：栏展开后仍在、内容可读、无报错 ---------- */
/* 子项栏已在 B 段点开，这里不再重复点（再点会收起） */
const D1 = await p.evaluate(() => {
  const slot = document.getElementById('wbSlot');
  const bar = document.querySelector('.wb-bar');
  return { h: Math.round(slot.getBoundingClientRect().height), bg: getComputedStyle(bar).backgroundColor, label: bar.querySelector('.wb-label').textContent.trim() };
});
ok('D1 点「通用」子项栏照常挤出，底色仍是磨砂白', D1.h > 60 && /rgba\(255, 255, 255, 0\.85\)/.test(D1.bg), JSON.stringify(D1));
await p.click('.chip[data-quick="技术任务"]');
await wait(450);
const D2 = await p.evaluate(() => {
  const slot = document.getElementById('qfSlot');
  return { h: Math.round(slot.getBoundingClientRect().height), steps: document.querySelectorAll('#qfFlow .qf-step').length, bg: getComputedStyle(document.getElementById('qfBar')).backgroundColor };
});
ok('D2 点「技术任务」推荐工序照常挤出（8 道），底色磨砂白', D2.h > 80 && D2.steps === 8 && /rgba\(255, 255, 255, 0\.85\)/.test(D2.bg), JSON.stringify(D2));

/* 毛玻璃别把帧率拖下去（上一轮刚为性能返工过） */
const fps = await p.evaluate(() => new Promise(res => {
  const t = []; let last = performance.now(); const t0 = last;
  const tick = () => { const n = performance.now(); t.push(n - last); last = n; if (n - t0 < 2200) requestAnimationFrame(tick); else res(t); };
  requestAnimationFrame(tick);
}));
const s = fps.slice(3).sort((a, b2) => a - b2);
const p95 = s[Math.floor(s.length * .95)];
ok('D3 15 层 backdrop-filter 下仍是 60fps（p95 < 22ms）', p95 < 22, 'p95=' + p95.toFixed(1) + 'ms');

ok('D4 无脚本报错', errs.length === 0, errs.join(' | '));
console.log('\n通过 ' + pass + ' / 失败 ' + fail);
await b.close();
process.exit(fail ? 1 : 0);
