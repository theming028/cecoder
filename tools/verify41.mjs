/* 交付版：第 41 轮验收（首页默认展开 / 图标与文字对齐 8px / 箭头绕圆心 / 随机配色持久化 / 设置左栏底色 / chat 面板可拖窄） */
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
const drawerOpen = p => p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'));

/* 量一个分组头的「图标墨迹 / 文字墨迹」几何 */
const geo = (p, idx) => p.evaluate(idx => {
  const h = document.querySelectorAll('#wdViewTask .wd-grp-head')[idx];
  const box = h.querySelector('.wd-caret').getBoundingClientRect();
  const fp = h.querySelector('.wd-caret-folder path').getBoundingClientRect();
  const cp = h.querySelector('.wd-caret-chev path').getBoundingClientRect();
  const nm = h.querySelector('.wd-grp-name');
  const cs = getComputedStyle(nm);
  const cv = document.createElement('canvas').getContext('2d');
  cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
  const tm = cv.measureText(nm.textContent);
  const rng = document.createRange(); rng.selectNodeContents(nm);
  const t = rng.getBoundingClientRect();
  const lh = parseFloat(cs.lineHeight);
  const baseline = t.y + (lh - (tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent)) / 2 + tm.actualBoundingBoxAscent;
  const c = r => ({ cx: +(r.x + r.width / 2).toFixed(2), cy: +(r.y + r.height / 2).toFixed(2) });
  return {
    box: c(box), boxW: Math.round(box.width), boxH: Math.round(box.height),
    folderInk: c(fp), chevInk: c(cp),
    textInkCy: +(baseline - (tm.actualBoundingBoxAscent - tm.actualBoundingBoxDescent) / 2).toFixed(2),
    gap: +(nm.getBoundingClientRect().left - box.right).toFixed(2),
    headH: Math.round(h.getBoundingClientRect().height)
  };
}, idx);

/* ============ A 首页默认展开（第 41 轮：不再被 localStorage 的 open:false 挡住） ============ */
let p = await mk('cecoder-home.html', () => { localStorage.clear(); });
ok('A1 首页空存储 → 展开', await drawerOpen(p));
await p.close();

p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false, w: 320 })); });
ok('A2 首页存着 open:false → 仍然展开', await drawerOpen(p));
ok('A3 首页展开且无「先收后开」动画（解析期还原）', await p.evaluate(() => document.getElementById('wsDrawer').dataset.restored === '1'));
await p.close();

p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false, w: 400 })); });
ok('A4 宽度记忆仍生效（400）', Math.round(await p.evaluate(() => document.getElementById('wsDrawer').getBoundingClientRect().width)) === 400,
  String(await p.evaluate(() => document.getElementById('wsDrawer').getBoundingClientRect().width)));
await p.close();

p = await mk('cecoder-session.html?id=0', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); });
ok('A5 会话页仍自动展开（老逻辑未受影响）', await drawerOpen(p));
await p.close();

/* ============ B 图标与文字：8px 间距 + 墨迹同心 ============ */
p = await mk('cecoder-home.html', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '任务'); });
const g = await geo(p, 1);
ok('B1 图标↔文字间距 8px', Math.abs(g.gap - 8) <= 0.6, String(g.gap));
ok('B2 文件夹墨迹中心与文字墨迹中心对齐（≤0.6px）', Math.abs(g.folderInk.cy - g.textInkCy) <= 0.6, JSON.stringify([g.folderInk.cy, g.textInkCy]));
ok('B3 图标盒 14×14、行高 36', g.boxW === 14 && g.boxH === 14 && g.headH === 36, JSON.stringify([g.boxW, g.boxH, g.headH]));

/* ============ C 箭头绕自身圆心旋转 ============ */
ok('C1 折叠态箭头墨迹中心＝盒中心（≤0.5px）', Math.abs(g.chevInk.cx - g.box.cx) <= 0.5 && Math.abs(g.chevInk.cy - g.box.cy) <= 0.5, JSON.stringify([g.chevInk, g.box]));
let pos = await p.evaluate(() => { const r = document.querySelectorAll('#wdViewTask .wd-grp-head')[1].getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
await p.mouse.move(pos.x, pos.y); await wait(300);
await p.mouse.click(pos.x, pos.y); await wait(600);
await p.mouse.move(1200, 860); await wait(300);
const g2 = await geo(p, 1);
ok('C2 展开后箭头墨迹中心不位移（旋转基准＝圆心，≤0.5px）',
  Math.abs(g2.chevInk.cx - g.chevInk.cx) <= 0.5 && Math.abs(g2.chevInk.cy - g.chevInk.cy) <= 0.5,
  JSON.stringify([g.chevInk, g2.chevInk]));
ok('C3 展开后箭头仍与文字墨迹同心', Math.abs(g2.chevInk.cy - g2.textInkCy) <= 0.6, JSON.stringify([g2.chevInk.cy, g2.textInkCy]));

/* ============ D 随机配色：色板内、刷新不变、同名同色 ============ */
const readColors = pg => pg.evaluate(() => [...document.querySelectorAll('.wd-grp')].map(g => ({
  n: g.querySelector('.wd-grp-name').textContent.trim(),
  v: (g.style.getPropertyValue('--wd-folder-color') || '').trim(),
  c: getComputedStyle(g.querySelector('.wd-caret-folder')).color
})));
const c1 = await readColors(p);
await p.reload({ waitUntil: 'load' }); await wait(700);
const c2 = await readColors(p);
ok('D1 刷新后颜色完全一致（取过就不再变）', JSON.stringify(c1.map(x => x.c)) === JSON.stringify(c2.map(x => x.c)), JSON.stringify([c1.map(x => x.c), c2.map(x => x.c)]));
ok('D2 颜色写进了 localStorage 的颜色表', await p.evaluate(() => {
  const m = JSON.parse(localStorage.getItem('cecoder.grpColor') || '{}');
  return Object.keys(m).length >= 8;   /* 8 个不同目录名 */
}));
const byName = {};
let sameNameSame = true;
c2.forEach(x => { if (byName[x.n] && byName[x.n] !== x.c) sameNameSame = false; byName[x.n] = x.c; });
ok('D3 同名目录（Nutstore / AI Native Factory）两个视图同色', sameNameSame, JSON.stringify(byName));
const task5 = c2.slice(0, 5).map(x => x.c), sess5 = c2.slice(5).map(x => x.c);
ok('D4 同一视图内五色互不撞色', new Set(task5).size === 5 && new Set(sess5).size === 5, JSON.stringify([task5, sess5]));
ok('D5 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ E 设置弹窗左栏浅灰底 ============ */
p = await mk('cecoder-home.html', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
await p.click('#tbSettings'); await wait(500);
const bg = await p.evaluate(() => {
  document.getElementById('syncModal').classList.add('is-open');
  const a = getComputedStyle(document.querySelector('.stg-nav')).backgroundColor;
  const b2 = getComputedStyle(document.querySelector('.cm-left')).backgroundColor;
  document.getElementById('syncModal').classList.remove('is-open');
  return { stg: a, sync: b2 };
});
ok('E1 设置左栏有浅灰底（#F7F7F7）', bg.stg === 'rgb(247, 247, 247)', bg.stg);
ok('E2 与「云端任务同步」弹窗左栏同色', bg.stg === bg.sync, JSON.stringify(bg));
ok('E3 弹窗无报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ F 左栏能拖到让 chat 面板 < 400 ============ */
p = await mk('cecoder-session.html?id=0', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); });
await p.click('#rsToggle'); await wait(500);
const rz = await p.evaluate(() => { const r = document.querySelector('.ws-resizer').getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
await p.mouse.move(rz.x, rz.y); await p.mouse.down();
for (const dx of [120, 240, 360, 480]) { await p.mouse.move(rz.x + dx, rz.y); await wait(60); }
await p.mouse.up(); await wait(400);
const wd = await p.evaluate(() => ({
  ws: Math.round(document.getElementById('wsDrawer').getBoundingClientRect().width),
  pm: Math.round(document.querySelector('.panel-main').getBoundingClientRect().width),
  overflow: document.querySelector('.panel-main').scrollWidth > document.querySelector('.panel-main').clientWidth + 1
}));
ok('F1 左栏可拖到 > 480（原上限）', wd.ws > 480, JSON.stringify(wd));
ok('F2 chat 面板可被拖到 320 以下 400（不再卡在 400）', wd.pm <= 340 && wd.pm >= 300, JSON.stringify(wd));
ok('F3 拖到最窄时中间面板无横向溢出', !wd.overflow, JSON.stringify(wd));
ok('F4 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

await b.close();
console.log('\n第 41 轮：' + pass + ' pass / ' + fail.length + ' fail');
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
