/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto(F, { waitUntil: 'load' });
await p.evaluate(() => localStorage.removeItem('cecoder.wsDrawer'));
await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
await p.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 1200));

let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const cs = (s, prop) => p.evaluate((q, pr) => { const e = document.querySelector(q); return e ? getComputedStyle(e)[pr] : null; }, s, prop);

/* ========== 1 分身不再发虚 ========== */
await p.evaluate(() => {
  const f = document.querySelector('.float');
  ['is-blink','is-nod','is-shake','is-happy','is-jump','is-breathe'].forEach(c => f.classList.remove(c));
  document.querySelector('.fab-body').style.translate = '';
});
await new Promise(r => setTimeout(r, 120));
ok('1 稳态外层无动画', await p.evaluate(() => document.querySelector('.fab-outer').getAnimations().length === 0));
ok('1 稳态内层无动画', await p.evaluate(() => document.querySelector('.fab-body').getAnimations().length === 0));
ok('1 外层 transform 为 none', (await cs('.fab-outer', 'transform')) === 'none', await cs('.fab-outer', 'transform'));
ok('1 内层 transform 为 none', (await cs('.fab-body', 'transform')) === 'none', await cs('.fab-body', 'transform'));
ok('1 已移除常驻 will-change', (await cs('.fab-body', 'willChange')) === 'auto', await cs('.fab-body', 'willChange'));
ok('1 呼吸不再 infinite（无 CSS 默认动画）', (await cs('.fab-outer', 'animationName')) === 'none', await cs('.fab-outer', 'animationName'));
ok('1 呼吸可按需播放', await p.evaluate(() => {
  const f = document.querySelector('.float'), o = document.querySelector('.fab-outer');
  f.classList.add('is-breathe'); void o.offsetWidth;
  const a = o.getAnimations()[0];
  const r = !!a && a.animationName === 'fabBreathe';
  f.classList.remove('is-breathe');
  return r;
}));
/* 眼随手动必须落在整像素上（小数 px 会触发重采样 = 糊） */
await p.mouse.move(200, 300); await new Promise(r => setTimeout(r, 120));
const integerPx = v => v === '' || /^-?\d+px( -?\d+px)?$/.test(v);
const look1 = await p.evaluate(() => document.querySelector('.fab-body').style.translate);
ok('1 眼神偏移为整数像素', integerPx(look1), JSON.stringify(look1));
ok('1 左上方向确实产生偏移', look1 !== '', JSON.stringify(look1));
await p.mouse.move(1430, 880); await new Promise(r => setTimeout(r, 150));
const look2 = await p.evaluate(() => document.querySelector('.fab-body').style.translate);
ok('1 反方向同样是整数像素', integerPx(look2), JSON.stringify(look2));
ok('1 左右方向符号相反', look1 !== look2);
/* 拖动后也不能停在半像素坐标上 */
const fb = await p.evaluate(() => { const r = document.querySelector('.float').getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; });
await p.mouse.move(fb[0], fb[1]);
await p.mouse.down();
await p.mouse.move(fb[0] - 37, fb[1] - 43, { steps: 6 });
await p.mouse.up();
await new Promise(r => setTimeout(r, 200));
const pos = await p.evaluate(() => [document.querySelector('.float').style.left, document.querySelector('.float').style.top]);
ok('1 拖动后 left/top 取整', pos.every(v => /^-?\d+px$/.test(v)), JSON.stringify(pos));

/* ========== 2 wd-empty 下方留白 = 上方 ========== */
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 750));
/* 第 20 轮：AI Native Factory 默认收起，先展开最后那个空分组 */
await p.evaluate(() => {
  const groups = [...document.querySelectorAll('#wdViewTask .wd-groups .wd-grp')];
  const h = groups[groups.length - 1].querySelector('.wd-grp-head');
  if (h.getAttribute('aria-expanded') === 'false') h.click();
});
await new Promise(r => setTimeout(r, 320));
const gap = await p.evaluate(() => {
  const groups = [...document.querySelectorAll('#wdViewTask .wd-groups .wd-grp')];
  const g = groups[groups.length - 1];
  const head = g.querySelector('.wd-grp-head').getBoundingClientRect();
  const title = g.querySelector('.wd-empty-title').getBoundingClientRect();
  const acts = g.querySelector('.wd-empty-acts').getBoundingClientRect();
  const empty = g.querySelector('.wd-empty').getBoundingClientRect();
  const sub = g.querySelector('.wd-sub').getBoundingClientRect();
  return {
    top: +(title.top - head.bottom).toFixed(2),
    bottom: +(empty.bottom - acts.bottom).toFixed(2),
    tail: +(sub.bottom - empty.bottom).toFixed(2)
  };
});
ok('2 上方留白 40（第 46 轮：分组体内距 16 + 空态自身 24）', Math.abs(gap.top - 40) < 0.6, gap.top);
ok('2 下方留白 24（空态自身内距，不含容器 16）', Math.abs(gap.bottom - 24) < 0.6, JSON.stringify(gap));
ok('2 空态下方只留分组体的 16 内距', Math.abs(gap.tail - 16) < 0.6, gap.tail);

/* ========== 3 工序名一律正文色 ========== */
await p.click('[data-quick="技术任务"]'); await new Promise(r => setTimeout(r, 350));
ok('3 工序条已挤出', await p.evaluate(() => document.getElementById('qfSlot').classList.contains('is-open')));
const qf = await p.evaluate(() => {
  const names = [...document.querySelectorAll('.qf-name')];
  const nos = [...document.querySelectorAll('.qf-no')];
  return {
    n: names.length,
    colors: [...new Set(names.map(e => getComputedStyle(e).color))],
    noColors: [...new Set(nos.map(e => getComputedStyle(e).color))]
  };
});
ok('3 工序数量正常', qf.n >= 4, qf.n);
ok('3 所有工序名都是正文色 #1F1F1F', qf.colors.length === 1 && qf.colors[0] === 'rgb(31, 31, 31)', JSON.stringify(qf.colors));
ok('3 序号色与名字分开（不被一起改成正文色）', qf.noColors.length > 0, JSON.stringify(qf.noColors));

ok('无控制台报错', errs.length === 0, errs.join(' | '));
console.log('PASS', pass, '/', pass + fail.length);
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
