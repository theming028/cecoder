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
await p.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 350));

let pass = 0; const fail = [];
const ok = (name, cond, extra) => { if (cond) pass++; else fail.push(name + (extra ? ' → ' + extra : '')); };
const box = s => p.evaluate(sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect();
  return [+r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)];
}, s);
const near = (a, b2, t = 1) => a != null && Math.abs(a - b2) <= t;

/* 1 · 分段控件滑动 */
const segs = await p.evaluate(() => [...document.querySelectorAll('.seg-item')].map(e => {
  const r = e.getBoundingClientRect(); return [+r.x.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)];
}));
ok('seg 三段 120/88/88 · x 572/692/780',
  near(segs[0][0], 572) && near(segs[0][1], 120) && near(segs[1][0], 692) && near(segs[1][1], 88) && near(segs[2][0], 780) && near(segs[2][1], 88),
  JSON.stringify(segs));
let pill = await box('#segPill');
ok('seg 底板初始覆盖第 1 段', near(pill[0], 572) && near(pill[2], 120) && near(pill[3], 28), JSON.stringify(pill));
ok('seg 选中项自身不再铺白底', await p.evaluate(() => getComputedStyle(document.querySelector('.seg-item.is-active')).backgroundColor) === 'rgba(0, 0, 0, 0)');
await p.click('.seg-item[data-seg="研发管理"]');
await new Promise(r => setTimeout(r, 110));
const mid = await box('#segPill');
ok('seg 切换有中间帧（底板在移动中）', mid[0] > 600 && mid[0] < 780, JSON.stringify(mid));
await new Promise(r => setTimeout(r, 420));
pill = await box('#segPill');
ok('seg 底板滑到第 3 段', near(pill[0], 780) && near(pill[2], 88), JSON.stringify(pill));
await p.click('.seg-item[data-seg="研发工作台"]');
await new Promise(r => setTimeout(r, 420));
pill = await box('#segPill');
ok('seg 底板滑回第 1 段', near(pill[0], 572) && near(pill[2], 120), JSON.stringify(pill));

/* 2 · 指标卡 / 图表卡投影 */
await p.click('#scIdle'); await new Promise(r => setTimeout(r, 430));
const sh = await p.evaluate(() => [getComputedStyle(document.querySelector('.sc-metric')).boxShadow, getComputedStyle(document.querySelector('.sc-chart')).boxShadow]);
ok('sc-metric 有 0 1px 2px 投影', /0px 1px 2px/.test(sh[0]) && /0\.08/.test(sh[0]), sh[0]);
ok('sc-chart 有同款投影', /0px 1px 2px/.test(sh[1]), sh[1]);

/* 3 · 两组 tab 互斥 */
await p.click('[data-chips="quick"] .chip[data-quick="需求编写"]');
await new Promise(r => setTimeout(r, 200));
let st = await p.evaluate(() => [document.querySelectorAll('[data-chips="process"] .chip.is-active').length, document.querySelectorAll('[data-chips="quick"] .chip.is-active').length]);
ok('选快速任务后工作台清空', st[0] === 0 && st[1] === 1, JSON.stringify(st));
await p.click('[data-chips="process"] .chip[data-wb="测试"]');
await new Promise(r => setTimeout(r, 200));
st = await p.evaluate(() => [document.querySelectorAll('[data-chips="process"] .chip.is-active').length, document.querySelectorAll('[data-chips="quick"] .chip.is-active').length]);
ok('选工作台后快速任务清空', st[0] === 1 && st[1] === 0, JSON.stringify(st));

/* 4-8 · 侧栏 */
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 700));
const drawerRight = async () => p.evaluate(() => {
  const d = document.querySelector('.ws-drawer').getBoundingClientRect();
  return Math.round(d.x + d.width);
});
ok('「有 1 项待确认」是 #F77234', await p.evaluate(() => getComputedStyle(document.querySelector('.wd-num.is-todo')).color) === 'rgb(247, 114, 52)');

const nt = await p.evaluate(() => {
  const b2 = document.querySelector('.wd-newtask'); const r = b2.getBoundingClientRect();
  const ic = b2.querySelector('.ico'); const ir = ic.getBoundingClientRect();
  const cs = getComputedStyle(b2);
  const range = document.createRange(); range.selectNodeContents(b2);
  return {
    w: +r.width.toFixed(1), h: +r.height.toFixed(1),
    border: cs.borderTopStyle + ' ' + cs.borderTopWidth + ' ' + cs.borderTopColor,
    iconCol: getComputedStyle(ic).color, iconX: +(ir.x - r.x).toFixed(1), iconW: +ir.width.toFixed(1),
    textCol: cs.color, gap: getComputedStyle(b2).columnGap
  };
});
ok('wd-newtask 288x28', nt.w === 288 && nt.h === 28, JSON.stringify(nt));
ok('wd-newtask 1px dashed #C9C9C9', nt.border === 'dashed 1px rgb(201, 201, 201)', nt.border);
ok('wd-newtask 加号 #6B6B6B · 12px · x=112', nt.iconCol === 'rgb(107, 107, 107)' && nt.iconW === 12 && nt.iconX === 112, JSON.stringify(nt));
ok('wd-newtask 文字 #6B6B6B（第 8 轮：稿 tc=paint_1204:26804，hover 才转蓝）', nt.textCol === 'rgb(107, 107, 107)', nt.textCol);

/* 第 25 轮：箭头挪到文字前面，间距量的是「箭头右缘 → 文字左缘」 */
const gaps = await p.evaluate(() => [...document.querySelectorAll('#wdViewTask .wd-grp-head')].map(h => {
  const n = h.querySelector('.wd-grp-name').getBoundingClientRect();
  const c = h.querySelector('.wd-caret').getBoundingClientRect();
  return +(n.left - c.right).toFixed(1);
}));
ok('分组头箭头↔文字间距 4px（全部 5 个）', gaps.every(g => Math.abs(g - 4) <= 0.6), JSON.stringify(gaps));

const tints = await p.evaluate(() => {
  const q = s => getComputedStyle(document.querySelector(s)).backgroundColor;
  return { open: q('.wd-grp.is-open .wd-grp-head'), closed: q('.wd-grp:not(.is-open) .wd-grp-head') };
});
ok('展开分组灰底 #F7F7F7', tints.open === 'rgb(247, 247, 247)', tints.open);
ok('折叠分组默认白底', tints.closed === 'rgb(255, 255, 255)', tints.closed);

/* 8 · 卡片选中 */
await p.evaluate(() => document.querySelectorAll('.wd-card')[2].click());
/* 第 30 轮：点击会跳任务详情页，等跳转 + 选中底色过渡结束再量 */
await new Promise(r => setTimeout(r, 700));
const sel = await p.evaluate(() => {
  const cs = [...document.querySelectorAll('.wd-card')];
  return { n: cs.filter(c => c.classList.contains('is-sel')).length, bg: getComputedStyle(cs[2]).backgroundColor, radius: getComputedStyle(cs[2]).borderRadius };
});
ok('点击卡片 → 蓝色系选中（#3770F7 11%）', sel.n === 1 && sel.bg === 'rgba(55, 112, 247, 0.11)' && sel.radius === '4px', JSON.stringify(sel));
await p.evaluate(() => document.querySelectorAll('.wd-card')[1].click());
await new Promise(r => setTimeout(r, 700));
const sel2 = await p.evaluate(() => [...document.querySelectorAll('.wd-card')].map(c => c.classList.contains('is-sel')));
ok('卡片单选（换卡只留一个）', sel2.filter(Boolean).length === 1 && sel2[1] === true, JSON.stringify(sel2));

/* 第 30 轮：点卡片会进入任务详情页，回首页再继续后面的断言 */
if (!p.url().endsWith('cecoder-home.html')) {
  await p.goBack({ waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 550));
  if (!(await p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open')))) {
    await p.click('.menu-btn');
    await new Promise(r => setTimeout(r, 450));
  }
}

/* 9 · 进度条增长动效 */
const barAnim = await p.evaluate(() => {
  const bars = [...document.querySelectorAll('.wd-bar')].filter(b => b.children.length);
  const names = bars.map(b => getComputedStyle(b.children[0]).animationName);
  const b0 = bars[0];
  const ons = [...b0.children].filter(x => x.classList.contains('on'));
  const greys = [...b0.children].filter(x => !x.classList.contains('on'));
  return {
    names, n: bars.length, onCount: ons.length,
    lastOnDelay: getComputedStyle(ons[ons.length - 1]).animationDelay,
    greyAnim: greys.slice(0, 3).map(x => getComputedStyle(x).animationName)
  };
});
ok('展开后进度条带 wdBarGrow 动画', barAnim.n >= 3 && barAnim.names.every(n => n === 'wdBarGrow'), JSON.stringify(barAnim));
/* 第 13 轮：只有蓝色已完成段做生长，灰色底段是静态的 */
ok('蓝色段逐段延迟（最后一段 135ms）', barAnim.lastOnDelay === '0.135s', barAnim.lastOnDelay);
ok('灰色底段不做动效', barAnim.greyAnim.every(n => n === 'none'), JSON.stringify(barAnim.greyAnim));
/* 收起重开：动画重新播放 */
await p.click('.wd-collapse'); await new Promise(r => setTimeout(r, 400));
ok('收起后动画类被复位', await p.evaluate(() => [...document.querySelectorAll('.wd-bar.is-anim')].length === 0));
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 120));
const midBar = await p.evaluate(() => {
  const i = document.querySelector('.wd-bar i');
  return getComputedStyle(i).transform;
});
ok('重新展开时进度条从中途长出来', midBar !== 'none', midBar);
await new Promise(r => setTimeout(r, 900));

/* 10 · c-env */
const envIdle = await p.evaluate(() => getComputedStyle(document.querySelector('.c-env')).backgroundColor);
await p.hover('.c-env');
await new Promise(r => setTimeout(r, 220));
const envHover = await p.evaluate(() => getComputedStyle(document.querySelector('.c-env')).backgroundColor);
ok('c-env 默认透明', envIdle === 'rgba(0, 0, 0, 0)', envIdle);
ok('c-env hover 用中性灰 #E6E6E6（第 9 轮改）', envHover === 'rgb(230, 230, 230)', envHover);
await p.evaluate(() => document.querySelector('.cds-dd[data-dd="env"]').classList.add('is-open'));
await new Promise(r => setTimeout(r, 120));
const envOpen = await p.evaluate(() => getComputedStyle(document.querySelector('.c-env')).backgroundColor);
ok('c-env 展开态用中性灰 #DADADA（第 9 轮改）', envOpen === 'rgb(218, 218, 218)', envOpen);

console.log('PASS', pass, 'FAIL', fail.length);
if (fail.length) console.log(fail.join('\n'));
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
