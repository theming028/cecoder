/* 第 83 轮验收：代码生成与确认页 —— 当前步为第 2 步 / 差异对比 / 已确认蓝 / 仓库彩字 /
   统计小圆点 8px / 生成中卡样式 / 卡片逐张生成 / 底栏代码变更确认 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-codegen.html', { waitUntil: 'load' });

/* ---------- A 子工序条：第 2 步为当前 + 差异对比 ---------- */
const a = await p.evaluate(() => {
  const col = document.querySelector('.cg-col').getBoundingClientRect();
  const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x - col.x), Math.round(r.y - col.y), Math.round(r.width), Math.round(r.height)]; };
  const on = document.querySelector('.cg-step.is-on');
  const done = document.querySelector('.cg-step.is-done');
  const cs = e => getComputedStyle(e);
  return {
    head: g('.cg-head'),
    steps: [...document.querySelectorAll('.cg-head .cg-step')].map(e => g('.cg-head .cg-step:nth-of-type(1)') && Math.round(e.getBoundingClientRect().width)),
    onName: (on.querySelector('b') || {}).textContent,
    onNo: (on.querySelector('.cg-step-no') || {}).textContent,
    onBg: cs(on).backgroundColor,
    onShadow: cs(on).boxShadow,
    onNoBg: cs(on.querySelector('.cg-step-no')).backgroundColor,
    onNoColor: cs(on.querySelector('.cg-step-no')).color,
    doneName: (done.querySelector('b') || {}).textContent,
    doneBg: cs(done).backgroundColor,
    diff: g('.cg-head .tp-diff'),
    diffTxt: [...document.querySelectorAll('.cg-head .tp-diff span')].map(e => e.textContent),
  };
});
ok('A1 第 2 步「代码生成与确认」为当前（浅蓝壳 #F5F8FF + #DAE4FE、实心蓝圈白字）',
  a.onName === '代码生成与确认' && a.onNo === '2' && a.onBg === 'rgb(245, 248, 255)' &&
  /rgb\(218, 228, 254\)/.test(a.onShadow) && a.onNoBg === 'rgb(55, 112, 247)' && a.onNoColor === 'rgb(255, 255, 255)',
  JSON.stringify([a.onName, a.onNo, a.onBg, a.onShadow, a.onNoBg]));
ok('A2 第 1 步「变更分析」不再吃浅蓝（灰壳 #F7F7F7）', a.doneName === '变更分析' && a.doneBg === 'rgb(247, 247, 247)', a.doneBg);
ok('A3 右侧补「差异对比 / Diff」96×56，贴右端',
  a.diff && a.diff[2] === 96 && a.diff[3] === 56 && a.diff[0] + a.diff[2] === a.head[2] &&
  a.diffTxt.join('/') === '差异对比/Diff', JSON.stringify([a.diff, a.head, a.diffTxt]));

/* ---------- B 已确认徽标：蓝图标 + 蓝字 ---------- */
const b1 = await p.evaluate(() => {
  const e = document.querySelector('.cg-confirmed');
  const cs = getComputedStyle(e);
  return { color: cs.color, ico: getComputedStyle(e.querySelector('.ico')).color, txt: e.textContent.trim() };
});
ok('B1 「已确认」徽标 图标与文字同为 #3770F7',
  b1.color === 'rgb(55, 112, 247)' && b1.ico === 'rgb(55, 112, 247)' && b1.txt === '已确认',
  JSON.stringify(b1));

/* ---------- C 仓库行：彩字中粗 + 勾选右侧 12px ---------- */
const c = await p.evaluate(() => {
  const row = document.querySelectorAll('.cg-repo')[1];
  const rb = row.getBoundingClientRect();
  const ck = row.querySelector('.cg-ck').getBoundingClientRect();
  const sels = row.querySelector('.cg-sels').getBoundingClientRect();
  const v1 = document.querySelectorAll('.cg-repo-v')[0];
  const v2 = document.querySelectorAll('.cg-repo-v')[1];
  const t1 = document.querySelectorAll('.cg-repo-tag')[0];
  const t2 = document.querySelectorAll('.cg-repo-tag')[1];
  const cs = e => getComputedStyle(e);
  return {
    gap: Math.round(sels.x - (ck.x + ck.width)),
    v1: [cs(v1).color, cs(v1).fontWeight, v1.textContent],
    v2: [cs(v2).color, cs(v2).fontWeight, v2.textContent],
    t1: [cs(t1).color, cs(t1).fontWeight, t1.textContent, cs(t1).boxShadow],
    t2: [cs(t2).color, cs(t2).fontWeight, t2.textContent, cs(t2).boxShadow],
    selsW: Math.round(sels.width), rowW: Math.round(rb.width),
  };
});
ok('C1 「设为跨任务默认」与右侧下拉的间距 = 12px', c.gap === 12, c.gap);
ok('C2 paa-web 紫字 #B82EB8、前端标签同色（中粗）',
  c.v1[0] === 'rgb(184, 46, 184)' && c.v1[1] === '500' && c.t1[0] === 'rgb(184, 46, 184)' && c.t1[1] === '500' && c.t1[2] === '前端',
  JSON.stringify([c.v1, c.t1]));
ok('C3 paa-auth 蓝字 #035EC5、后端标签 #3770F7（中粗）',
  c.v2[0] === 'rgb(3, 94, 197)' && c.v2[1] === '500' && c.t2[0] === 'rgb(55, 112, 247)' && c.t2[1] === '500' && c.t2[2] === '后端',
  JSON.stringify([c.v2, c.t2]));
ok('C4 下拉组 512 宽、行内不溢出', c.selsW === 512 && c.rowW === 1044, [c.selsW, c.rowW].join('/'));

/* ---------- D 统计小圆点 8px + 进度条入场 ---------- */
const d = await p.evaluate(() => {
  const seps = [...document.querySelectorAll('.cg-prog-s .cg-dotsep')];
  const cs = getComputedStyle(seps[0]);
  const bar = document.querySelector('.cg-bar-in');
  return {
    n: seps.length, ml: cs.marginLeft, mr: cs.marginRight,
    label: getComputedStyle(document.querySelector('.cg-prog-s span')).color,
    num: getComputedStyle(document.querySelector('.cg-prog-s b')).color,
    w: Math.round(bar.getBoundingClientRect().width),
  };
});
ok('D1 统计里的「·」左右各 8px', d.n === 2 && d.ml === '8px' && d.mr === '8px', JSON.stringify([d.n, d.ml, d.mr]));
ok('D2 标签灰 #868686、数字深 #1F1F1F', d.label === 'rgb(134, 134, 134)' && d.num === 'rgb(31, 31, 31)', JSON.stringify([d.label, d.num]));
/* 另开一页：load 瞬间读 0，再等 700ms 读 450 */
const p2 = await b.newPage();
await p2.setViewport({ width: 1440, height: 1000 });
await p2.goto('file:///' + BASE + '/cecoder-codegen.html', { waitUntil: 'domcontentloaded' });
const d0 = await p2.evaluate(() => document.querySelector('.cg-bar-in').style.width || 'auto');
await wait(800);
const d2 = await p2.evaluate(() => Math.round(document.querySelector('.cg-bar-in').getBoundingClientRect().width));
await p2.close();
ok('D3 进度条入场从 0 动到 450px（41.1%）', parseFloat(d0) === 0 && Math.abs(d2 - 450) <= 2, d0 + ' → ' + d2);

/* ---------- E 生成中的卡 = 稿面样式 ---------- */
await wait(1200);
const e1 = await p.evaluate(() => {
  const card = document.querySelector('.cg-card[data-state="running"]');
  if (!card) return null;
  const cs = e => getComputedStyle(e);
  const chips = [...card.querySelectorAll('.cg-chip')];
  return {
    bg: cs(card).backgroundColor, shadow: cs(card).boxShadow,
    h: Math.round(card.getBoundingClientRect().height),
    title: cs(card.querySelector('.cg-t')).color,
    tag: [cs(card.querySelector('.cg-st')).color, cs(card.querySelector('.cg-st')).backgroundColor, cs(card.querySelector('.cg-st')).boxShadow, card.querySelector('.cg-st').textContent],
    labels: chips.map(x => x.textContent.trim()),
    states: chips.map(x => x.classList.contains('is-done') ? 'done' : x.classList.contains('is-run') ? 'run' : 'todo'),
    ignore: !!card.querySelector('[data-cg-ignore]') && getComputedStyle(card.querySelector('[data-cg-ignore]')).display !== 'none',
    flowRunningBg: (chips.find(x => x.classList.contains('is-run')) || {}) && null,
  };
});
ok('E1 生成中的卡 浅蓝底 #F5F8FF + #B4C9FC 描边、高 106',
  e1 && e1.bg === 'rgb(245, 248, 255)' && /rgb\(180, 201, 252\)/.test(e1.shadow) && e1.h === 106,
  JSON.stringify([e1 && e1.bg, e1 && e1.shadow, e1 && e1.h]));
ok('E2 生成中的卡标题转蓝 #3770F7', e1.title === 'rgb(55, 112, 247)', e1.title);
ok('E3 「生成中」标签 白底 + #DAE4FE 边 + 蓝字',
  e1.tag[0] === 'rgb(55, 112, 247)' && e1.tag[1] === 'rgb(255, 255, 255)' && /rgb\(218, 228, 254\)/.test(e1.tag[2]) && e1.tag[3] === '生成中',
  JSON.stringify(e1.tag));
ok('E4 chips 文案与顺序对稿（读取Spec / 对比现有代码 / 生成代码 / 规则检查 / 核对Spec）',
  e1.labels.join('/') === '读取Spec/对比现有代码/生成代码/规则检查/核对Spec', e1.labels.join('/'));
ok('E5 生成中只留「修改」，不给「忽略」', e1.ignore === false, String(e1.ignore));

/* ---------- F 逐张生成：卡内逐颗点亮 → 整卡转待确认 → 下一张 ---------- */
const p3 = await b.newPage(); p3.__e = [];
p3.on('pageerror', e => p3.__e.push(e.message));
await p3.setViewport({ width: 1440, height: 1000 });
await p3.goto('file:///' + BASE + '/cecoder-codegen.html', { waitUntil: 'load' });
const snap = () => p3.evaluate(() => [...document.querySelectorAll('.cg-card')].map(c => {
  const chips = [...c.querySelectorAll('.cg-chip')];
  return { s: c.dataset.state, done: chips.filter(x => x.classList.contains('is-done')).length, run: chips.filter(x => x.classList.contains('is-run')).length };
}));
await wait(600);
const f1 = await snap();
await wait(2000);
const f2 = await snap();
ok('F1 卡内 5 颗 chip 依次点亮（同一张卡的 done 数随时间递增）',
  f1[1].s === 'running' && f1[1].run === 1 && f2[1].s === 'running' && f2[1].done > f1[1].done,
  JSON.stringify([f1[1], f2[1]]));
ok('F2 同时只有一张在生成，且自上而下推进（前面已转待确认、后面还在等）',
  f2.filter(x => x.s === 'running').length === 1 && f2.findIndex(x => x.s === 'running') >= 1 &&
  f2.slice(0, f2.findIndex(x => x.s === 'running')).every(x => x.s === 'confirm') &&
  f2.slice(f2.findIndex(x => x.s === 'running') + 1).every(x => x.s === 'todo'),
  JSON.stringify(f2));
await wait(11000);
const f3 = await p3.evaluate(() => ({
  cards: [...document.querySelectorAll('.cg-card')].map(c => [c.dataset.state, Math.round(c.getBoundingClientRect().height), c.querySelector('.cg-st').textContent, !!c.querySelector('.cg-flow')]),
  stats: document.getElementById('cgStats').textContent.replace(/\s+/g, ''),
  bar: Math.round(document.querySelector('.cg-bar-in').getBoundingClientRect().width),
}));
ok('F3 全部跑完：四张都转「待确认」、flow 收起回 80 高、进度条收尾 900px',
  f3.cards.every(x => x[0] === 'confirm' && x[1] === 80 && x[2] === '待确认' && x[3] === false) && Math.abs(f3.bar - 900) <= 2,
  JSON.stringify(f3.cards));
ok('F4 统计随生成推进（已生成 5/6 · 待确认 3）', f3.stats === '已生成5/6·待确认3·已确认1/6', f3.stats);
ok('F5 A→F 期间无脚本报错（续跑页）', p3.__e.length === 0, p3.__e.join(' | '));
await p3.close();

/* ---------- G 底栏 ---------- */
const g1 = await p.evaluate(() => [...document.querySelectorAll('.cg-foot .cg-btn')].map(e => [e.textContent.trim(), getComputedStyle(e).backgroundColor]));
ok('G1 底栏三颗：代码生成中 / 全部重新生成 / 代码变更确认 (4)',
  g1.length === 3 && g1[0][0] === '代码生成中' && g1[1][0] === '全部重新生成' && g1[2][0] === '代码变更确认 (4)',
  JSON.stringify(g1.map(x => x[0])));
ok('G2 代码生成中为浅蓝禁用底、确认键主色',
  g1[0][1] === 'rgb(180, 201, 252)' && g1[2][1] === 'rgb(55, 112, 247)', JSON.stringify(g1.map(x => x[1])));

ok('Z 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
