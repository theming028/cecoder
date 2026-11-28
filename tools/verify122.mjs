/* 第 122 轮验收：首页两组的选中态配色
   「选择子项」的按钮（.wb-opt）：选中时品牌蓝描边 + 品牌蓝字（底浅蓝 92%），hover 再深一档；
   「推荐工序」的步骤（.qf-step）：选中时语义紫描边（inset 1px）+ 紫字，序号一起变紫。
   背景：首页那条 `body[data-page="home"] .wb-opt { background: rgba(255,255,255,.72) }`
   把原来选中态的浅蓝底盖掉了，只剩 #C7D7FC 一道浅边，所以选中跟没选一样。 */
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

/* ---------- A 选择子项：蓝框蓝字 ---------- */
await h.click('[data-chips="process"] .chip[data-wb="通用"]');
await wait(600);
const A = await h.evaluate(() => [...document.querySelectorAll('.wb-opt')].map(c => {
  const s = getComputedStyle(c);
  return { t: c.textContent.trim(), act: c.classList.contains('is-active'), col: s.color, bd: s.borderColor, bw: s.borderWidth, bg: s.backgroundColor, h: Math.round(c.getBoundingClientRect().height) };
}));
const aAct = A.find(x => x.act), aIdle = A.find(x => !x.act);
ok('A1 子项有选中项且只有一个', A.filter(x => x.act).length === 1, JSON.stringify(A.map(x => [x.t, x.act])));
ok('A2 选中字色 = 品牌蓝 rgb(55,112,247)', aAct.col === 'rgb(55, 112, 247)', aAct.col);
ok('A3 选中描边 = 品牌蓝（不是 #C7D7FC 浅边）', aAct.bd === 'rgb(55, 112, 247)' && aAct.bw === '1px', JSON.stringify([aAct.bd, aAct.bw]));
ok('A4 选中底色浅蓝 92%（把被首页覆盖掉的那层找回来）', /rgba\(245, 248, 255, 0\.92\)/.test(aAct.bg), aAct.bg);
ok('A5 未选中的子项仍是灰边 #E5E5E5 + 深字 #1F1F1F', aIdle.bd === 'rgb(229, 229, 229)' && aIdle.col === 'rgb(31, 31, 31)', JSON.stringify([aIdle.bd, aIdle.col]));
ok('A6 加/改描边没把高度撑开（仍 32）', A.every(x => x.h === 32), JSON.stringify(A.map(x => x.h)));

/* 选中项 hover：蓝更深一档，不会退回灰边 */
const c1 = await h.evaluate(() => { const r = document.querySelector('.wb-opt.is-active').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await h.mouse.move(c1.x, c1.y);
await wait(450);
const A2 = await h.evaluate(() => { const s = getComputedStyle(document.querySelector('.wb-opt.is-active')); return { col: s.color, bd: s.borderColor }; });
ok('A7 选中项 hover = 深蓝 #2E5FD9（不退回灰边）', A2.col === 'rgb(46, 95, 217)' && A2.bd === 'rgb(46, 95, 217)', JSON.stringify(A2));
await h.mouse.move(4, 4);
await wait(300);

/* 换选：蓝框跟着走 */
await h.click('.wb-opt:nth-child(3)').catch(() => {});
await h.mouse.move(4, 4);   /* 移开，否则读到的是 hover 深蓝 */
await wait(400);
const A3 = await h.evaluate(() => [...document.querySelectorAll('.wb-opt')].map(c => ({ t: c.textContent.trim(), act: c.classList.contains('is-active'), bd: getComputedStyle(c).borderColor })));
ok('A8 换选后蓝框移到新选中项（旧的退回灰边）', A3.filter(x => x.act).length === 1 && A3.filter(x => x.act).every(x => x.bd === 'rgb(55, 112, 247)') && A3.filter(x => !x.act).every(x => x.bd === 'rgb(229, 229, 229)'), JSON.stringify(A3));

/* ---------- B 推荐工序：紫框紫字 ---------- */
await h.click('[data-chips="quick"] .chip[data-quick="技术任务"]');
await wait(700);
const B = await h.evaluate(() => [...document.querySelectorAll('.qf-step')].map(c => {
  const s = getComputedStyle(c);
  const no = c.querySelector('.qf-no');
  return { t: c.textContent.trim(), act: c.classList.contains('is-active'), col: s.color, sh: s.boxShadow, no: no ? getComputedStyle(no).color : null, h: Math.round(c.getBoundingClientRect().height), w: Math.round(c.getBoundingClientRect().width) };
}));
const bAct = B.find(x => x.act), bIdle = B.find(x => !x.act);
ok('B1 工序有选中项（第一步）', B.filter(x => x.act).length === 1 && /^01/.test(bAct.t), JSON.stringify(B.map(x => [x.t, x.act])));
ok('B2 选中字色 = 语义紫 rgb(91,88,255)', bAct.col === 'rgb(91, 88, 255)', bAct.col);
ok('B3 选中挂 1px 紫内描边（工序块本身没 border，用 inset 保尺寸）', /rgb\(91, 88, 255\) 0px 0px 0px 1px inset/.test(bAct.sh), bAct.sh);
ok('B4 序号跟着一起变紫', bAct.no === 'rgb(91, 88, 255)', bAct.no);
ok('B5 未选中的步骤仍是三级灰字 #868686 + 没有紫边', bIdle.col === 'rgb(134, 134, 134)' && !/91, 88, 255/.test(bIdle.sh), JSON.stringify([bIdle.col, bIdle.sh]));
ok('B6 内描边没改尺寸（高度仍 24）', B.every(x => x.h === 24), JSON.stringify(B.map(x => x.h)));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
