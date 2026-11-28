/* 第 127 轮验收：三处灰阶调整
   ① `.c-card` 描边：纯黑 12% → #DDE2E7；
   ② 用户洞察看板的五张小卡（4 张 .sc-metric + 1 张 .sc-chart）：去掉 0 1px 2px 投影，换 1px #E9ECF1 描边；
   ③ 输入区背板 `.c-plate` 底色：#F2F2F2 → #EBEDF1。 */
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

/* ---------- A 输入卡描边 ---------- */
const A = await h.evaluate(() => {
  const c = getComputedStyle(document.querySelector('.c-card'));
  return { color: c.borderColor, w: c.borderWidth, bg: c.backgroundColor, sh: c.boxShadow };
});
ok('A1 .c-card 描边 = #DDE2E7', A.color === 'rgb(221, 226, 231)' && A.w === '1px', JSON.stringify([A.color, A.w]));
ok('A2 描边换色不影响卡片底色与投影（仍是白卡 + shadow-1）', A.bg === 'rgb(255, 255, 255)' && A.sh !== 'none', JSON.stringify([A.bg, A.sh]));

await h.click('.c-input');
await wait(300);
const A2 = await h.evaluate(() => getComputedStyle(document.querySelector('.c-card')).borderColor);
ok('A3 聚焦态仍切到 --cds-line-hover（没被新描边锁死）', A2 !== 'rgb(221, 226, 231)', A2);
await h.evaluate(() => document.querySelector('.c-input').blur());
await wait(200);

/* ---------- B 看板五张小卡 ---------- */
await h.click('#scIdle');
await wait(900);
const B = await h.evaluate(() => {
  const pick = el => {
    const c = getComputedStyle(el), r = el.getBoundingClientRect();
    return { bd: c.borderColor, bw: c.borderWidth, sh: c.boxShadow, w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor };
  };
  return { metrics: [...document.querySelectorAll('.sc-metric')].map(pick), chart: pick(document.querySelector('.sc-chart')) };
});
ok('B1 四张指标卡都去掉了投影', B.metrics.length === 4 && B.metrics.every(m => m.sh === 'none'), JSON.stringify(B.metrics.map(m => m.sh)));
ok('B2 四张指标卡换成 1px #E9ECF1 描边', B.metrics.every(m => m.bd === 'rgb(233, 236, 241)' && m.bw === '1px'), JSON.stringify(B.metrics.map(m => [m.bd, m.bw])));
ok('B3 图表卡同样去投影 + 1px #E9ECF1', B.chart.sh === 'none' && B.chart.bd === 'rgb(233, 236, 241)' && B.chart.bw === '1px', JSON.stringify(B.chart));
ok('B4 五张卡尺寸没被描边撑大（指标 88 高 / 图表 200×88）',
  B.metrics.every(m => m.h === 88) && B.chart.w === 200 && B.chart.h === 88, JSON.stringify([B.metrics.map(m => m.h), B.chart.w, B.chart.h]));
ok('B5 四张指标卡等宽（flex 分配未因描边倾斜）', new Set(B.metrics.map(m => m.w)).size === 1, JSON.stringify(B.metrics.map(m => m.w)));
ok('B6 卡面仍是纯白（描边只在边上）', B.metrics.every(m => m.bg === 'rgb(255, 255, 255)') && B.chart.bg === 'rgb(255, 255, 255)', JSON.stringify([B.metrics[0].bg, B.chart.bg]));

/* ---------- C 背板底色 ---------- */
const C = await h.evaluate(() => {
  const c = getComputedStyle(document.querySelector('.c-plate'));
  return { bg: c.backgroundColor, radius: c.borderRadius, sh: c.boxShadow, bf: c.backdropFilter || c.webkitBackdropFilter || 'none' };
});
ok('C1 .c-plate 底色 = #EBEDF1', C.bg === 'rgb(235, 237, 241)', C.bg);
ok('C2 背板仍是 8px 圆角、无投影无毛玻璃（只换色）', C.radius === '8px' && C.sh === 'none' && C.bf === 'none', JSON.stringify([C.radius, C.sh, C.bf]));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
