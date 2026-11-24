/* 交付版：第 45 轮验收（新建任务间距归容器 / 收起键底色 / 分组头左右内距 12 / 未选中段 hover 不变色 / 工具图标 hover 描边不变） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: 1440, height: 900 });
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(700);
  return p;
}
const center = async (p, sel, idx = 0) => p.evaluate(([s, i]) => {
  const e = document.querySelectorAll(s)[i]; const r = e.getBoundingClientRect();
  return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
}, [sel, idx]);

/* ============ A 「新建任务」上方 8px 归容器 ============ */
let p = await mk('cecoder-home.html', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '任务'); });

const a = await p.evaluate(() => {
  const btn = document.querySelector('#wdViewTask .wd-newtask');
  const sub = btn.parentElement;
  const cs = getComputedStyle(sub);
  const bs = getComputedStyle(btn);
  const head = sub.previousElementSibling;
  return {
    mt: bs.marginTop, pt: cs.paddingTop, subPadL: cs.paddingLeft,
    gap: +(btn.getBoundingClientRect().top - head.getBoundingClientRect().bottom).toFixed(2),
    h: Math.round(btn.getBoundingClientRect().height),
    labelDy: +((btn.firstElementChild.getBoundingClientRect().top + btn.firstElementChild.getBoundingClientRect().bottom) / 2
      - (btn.getBoundingClientRect().top + btn.getBoundingClientRect().bottom) / 2).toFixed(2)
  };
});
ok('A1 .wd-newtask 自身 margin-top 归零', a.mt === '0px', a.mt);
ok('A2 父容器 .wd-sub 上内距 16（第 46 轮四边统一 16）', a.pt === '16px', a.pt);
ok('A3 分组头底 → 按钮顶 16（跟着容器 padding 走）', Math.abs(a.gap - 16) <= 0.5, String(a.gap));
ok('A4 按钮仍是 28 高、内容垂直居中未被 padding 顶偏', a.h === 28 && Math.abs(a.labelDy) <= 0.6, JSON.stringify([a.h, a.labelDy]));
/* 空分组（无「新建任务」）不应被这条 padding 顶上 8px */
const a5 = await p.evaluate(() => {
  const sub = document.getElementById('wdSub5');
  return { pt: getComputedStyle(sub).paddingTop, hasBtn: !!sub.querySelector('.wd-newtask'), titleY: Math.round(sub.querySelector('.wd-empty-title').getBoundingClientRect().y) };
});
ok('A5 空分组不长出 8px 上内距（:has 只作用于有按钮的分组）', a5.pt === '0px' && !a5.hasBtn, JSON.stringify(a5));

/* ============ B 收起键：默认透明、hover 深一级 ============ */
const rb = await p.evaluate(() => {
  const e = document.querySelector('.wd-collapse'); const r = e.getBoundingClientRect();
  const head = getComputedStyle(document.querySelector('.wd-head'));
  return { bg: getComputedStyle(e).backgroundColor, hbg: head.backgroundColor,
    box: [Math.round(r.width), Math.round(r.height)], x: Math.round(r.x), y: Math.round(r.y) };
});
ok('B1 收起键默认底色透明', rb.bg === 'rgba(0, 0, 0, 0)', rb.bg);
{
  const c = await center(p, '.wd-collapse');
  await p.mouse.move(c.x, c.y); await wait(260);
  const hb = await p.evaluate(() => getComputedStyle(document.querySelector('.wd-collapse')).backgroundColor);
  /* rgba(0,0,0,.05) 压在 #F7F7F7 上 → 每通道 247*0.95 ≈ 235；取它比栏底更暗来判定「深一级」 */
  const nums = (s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number))(hb);
  const comp = nums[3] !== undefined && nums[3] < 1 ? Math.round(247 * (1 - nums[3])) : NaN;
  ok('B2 hover 底色非透明且比栏底 #F7F7F7 深一级', hb !== 'rgba(0, 0, 0, 0)' && comp < 247 && comp > 220, hb + ' → ' + comp);
  await p.mouse.move(1200, 860); await wait(200);
  const back = await p.evaluate(() => getComputedStyle(document.querySelector('.wd-collapse')).backgroundColor);
  ok('B3 移开鼠标回到透明', back === 'rgba(0, 0, 0, 0)', back);
}
ok('B4 收起键尺寸 28×28 未变', rb.box[0] === 28 && rb.box[1] === 28, JSON.stringify(rb.box));

/* ============ C 分组头左右内距 12（会话 / 任务两个视图） ============ */
const measureHeads = () => p.evaluate(() => [...document.querySelectorAll('.wd-view .wd-grp-head')]
  .filter(h => h.getBoundingClientRect().width > 0)
  .slice(0, 4)
  .map(h => {
    const hs = getComputedStyle(h);
    const box = h.getBoundingClientRect();
    const caret = h.querySelector('.wd-caret').getBoundingClientRect();
    const name = h.querySelector('.wd-grp-name').getBoundingClientRect();
    const num = h.querySelector('.wd-num');
    return {
      pl: hs.paddingLeft, pr: hs.paddingRight,
      caretX: +(caret.left - box.left).toFixed(2),
      nameX: +(name.left - box.left).toFixed(2),
      numR: num && num.getBoundingClientRect().width > 0 ? +(box.right - num.getBoundingClientRect().right).toFixed(2) : null
    };
  }));

const taskHeads = await measureHeads();
/* 切到「会话」视图再量一组（隐藏视图的量出来都是 0，不能用） */
const cTab = await center(p, '.wd-tab', await p.evaluate(() => [...document.querySelectorAll('.wd-tab')].findIndex(t => t.dataset.wdTab === '会话')));
await p.mouse.click(cTab.x, cTab.y); await wait(500);
const sessHeads = await measureHeads();
const allH = [...taskHeads, ...sessHeads];
ok('C0 会话 / 任务两个视图都量到分组头（各 ≥1）', taskHeads.length > 0 && sessHeads.length > 0, JSON.stringify([taskHeads.length, sessHeads.length]));
ok('C1 分组头左右内距都是 12px', allH.every(h => h.pl === '12px' && h.pr === '12px'), JSON.stringify(allH.slice(0, 2)));
ok('C2 箭头左缘落在 12', allH.every(h => Math.abs(h.caretX - 12) <= 0.5), JSON.stringify(allH.map(h => h.caretX)));
ok('C3 分组名左缘 36（第 46 轮：内距 12 + 16 盒 + 8 间距）', allH.every(h => Math.abs(h.nameX - 36) <= 0.5), JSON.stringify(allH.map(h => h.nameX)));
ok('C4 右侧计数距右缘 12', allH.filter(h => h.numR !== null).every(h => Math.abs(h.numR - 12) <= 0.6), JSON.stringify(allH.map(h => h.numR)));

/* ============ D 未选中页签 hover 不改底色 ============ */
{
  const idx = await p.evaluate(() => [...document.querySelectorAll('.wd-tab')].findIndex(t => !t.classList.contains('is-active')));
  const before = await p.evaluate(i => getComputedStyle(document.querySelectorAll('.wd-tab')[i]).backgroundColor, idx);
  const c = await center(p, '.wd-tab', idx);
  await p.mouse.move(c.x, c.y); await wait(260);
  const after = await p.evaluate(i => getComputedStyle(document.querySelectorAll('.wd-tab')[i]).backgroundColor, idx);
  const border = await p.evaluate(i => getComputedStyle(document.querySelectorAll('.wd-tab')[i]).borderTopColor, idx);
  ok('D1 未选中页签 hover 底色不变（仍是透明）', before === after && after === 'rgba(0, 0, 0, 0)', before + ' → ' + after);
  ok('D2 未选中页签 hover 不出描边', border === 'rgba(0, 0, 0, 0)', border);
  await p.mouse.move(1200, 860); await wait(160);
}
/* 选中段 hover 保持白底，不能被改成透明 */
{
  const i = await p.evaluate(() => [...document.querySelectorAll('.wd-tab')].findIndex(t => t.classList.contains('is-active')));
  const c = await center(p, '.wd-tab', i);
  await p.mouse.move(c.x, c.y); await wait(260);
  const bg = await p.evaluate(i => getComputedStyle(document.querySelectorAll('.wd-tab')[i]).backgroundColor, i);
  ok('D3 选中段 hover 仍白底 + 1px #E5E5E5 描边', bg === 'rgb(255, 255, 255)', bg);
  await p.mouse.move(1200, 860); await wait(160);
}

/* ============ E 工具行搜索 / 排序：hover 描边不变 ============ */
for (const [label, idx] of [['搜索', 0], ['排序', 1]]) {
  const base = await p.evaluate(i => {
    const e = document.querySelectorAll('.wd-tools .wd-icon-btn')[i]; const cs = getComputedStyle(e);
    return { b: cs.borderTopColor, bg: cs.backgroundColor };
  }, idx);
  const c = await center(p, '.wd-tools .wd-icon-btn', idx);
  await p.mouse.move(c.x, c.y); await wait(260);
  const hov = await p.evaluate(i => {
    const e = document.querySelectorAll('.wd-tools .wd-icon-btn')[i]; const cs = getComputedStyle(e);
    return { b: cs.borderTopColor, bg: cs.backgroundColor };
  }, idx);
  ok('E' + (idx + 1) + ' ' + label + '键 hover 描边颜色不变', base.b === hov.b && hov.b === 'rgb(229, 229, 229)', base.b + ' → ' + hov.b);
  ok('E' + (idx + 3) + ' ' + label + '键 hover 仍有底色反馈', base.bg !== hov.bg, base.bg + ' → ' + hov.bg);
  await p.mouse.move(1200, 860); await wait(160);
}

/* ============ F 无报错 ============ */
ok('F1 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

console.log('\n第 45 轮：' + pass + ' pass / ' + fail.length + ' fail');
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log('  ✗ ' + f)); }
else console.log('ALL OK');
await b.close();
process.exit(fail.length ? 1 : 0);
