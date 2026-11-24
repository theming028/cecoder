/* 交付版：第 40 轮验收（分组标记 = 折叠静止彩色文件夹 / hover·聚焦·展开 = 原箭头） */
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
  await wait(750);
  return p;
}
/* 读一个分组头当前的图标状态 */
const read = (p, sel) => p.evaluate(sel => [...document.querySelectorAll(sel)].map(h => {
  const g = h.closest('.wd-grp');
  const f = h.querySelector('.wd-caret-folder'), c = h.querySelector('.wd-caret-chev');
  const cr = h.querySelector('.wd-caret').getBoundingClientRect();
  const nm = h.querySelector('.wd-grp-name');
  const fs = getComputedStyle(f), cs = getComputedStyle(c);
  const m = cs.transform.match(/matrix\(([^)]+)\)/);
  const v = m ? m[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0];
  return {
    hue: (g.style.getPropertyValue('--wd-folder-color') || '').trim(), open: g.classList.contains('is-open'),
    color: fs.color, fOp: +fs.opacity, cOp: +cs.opacity,
    /* 旋转角 = atan2(b, a)，0° 指右、90° 指下 */
    rot: +(Math.atan2(v[1], v[0]) * 180 / Math.PI).toFixed(1),
    box: [Math.round(cr.width), Math.round(cr.height)],
    nameX: Math.round(nm.getBoundingClientRect().left),
    headH: Math.round(h.getBoundingClientRect().height),
    dual: !!f && !!c
  };
}), sel);

/* ============ A 任务页签静止态：折叠=文件夹，展开=向下箭头 ============ */
let p = await mk('cecoder-home.html', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '任务'); });
let rows = await read(p, '#wdViewTask .wd-grp-head');
ok('A1 每个分组头都同时有文件夹与箭头两层', rows.every(r => r.dual));
ok('A2 折叠行：文件夹可见、箭头透明', rows.filter(r => !r.open).every(r => r.fOp === 1 && r.cOp === 0), JSON.stringify(rows.map(r => [r.open, r.fOp, r.cOp])));
ok('A3 展开行：文件夹透明、箭头可见', rows.filter(r => r.open).every(r => r.fOp === 0 && r.cOp === 1), JSON.stringify(rows.filter(r => r.open)));
ok('A4 展开行箭头转 90°（指向下）', rows.filter(r => r.open).every(r => r.rot === 90), JSON.stringify(rows.map(r => r.rot)));
ok('A5 折叠行箭头 0°（指向右）', rows.filter(r => !r.open).every(r => r.rot === 0), JSON.stringify(rows.map(r => r.rot)));
ok('A6 图标盒 16×16（第 46 轮加大两号），行高 36 不变', rows.every(r => r.box[0] === 16 && r.box[1] === 16 && r.headH === 36), JSON.stringify(rows[0]));
ok('A7 文字左缘 44（第 46 轮：8+12+16+8）', rows.every(r => r.nameX === 44), JSON.stringify(rows.map(r => r.nameX)));

/* ============ B 彩色文件夹：随机取色、彼此不同、柔和（HSL 落在温和区间） ============ */
const hues = rows.map(r => r.hue);
ok('B1 五个分组都取到了颜色（内联 --wd-folder-color）', hues.every(h => /^#[0-9A-Fa-f]{6}$/.test(h)) && new Set(hues).size === 5, JSON.stringify(hues));
const PALETTE = ['#87A9E3', '#7FC0DC', '#86C6B6', '#7FC59C', '#C6D08E', '#E5C68F', '#EAB79B', '#E39991', '#DFA2C0', '#B3A1DE'];
ok('B1b 颜色都来自 10 色预置色板', hues.every(h => PALETTE.includes(h.toUpperCase())), JSON.stringify(hues));
const toHsl = rgb => {
  const [r, g, bl] = rgb.match(/\d+/g).map(Number).map(v => v / 255);
  const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn;
  const l = (mx + mn) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s: Math.round(s * 100), l: Math.round(l * 100) };
};
const cols = rows.map(r => r.color);
ok('B2 五种颜色互不相同', new Set(cols).size === 5, JSON.stringify(cols));
const hsl = cols.map(toHsl);
ok('B3 饱和度柔和（S 30~65%，不艳丽）', hsl.every(h => h.s >= 30 && h.s <= 65), JSON.stringify(hsl));
ok('B4 明度偏亮（L 60~80%）', hsl.every(h => h.l >= 60 && h.l <= 80), JSON.stringify(hsl));

/* ============ C hover：文件夹淡出、箭头淡入且转正 ============ */
let pos = await p.evaluate(() => { const r = document.querySelectorAll('#wdViewTask .wd-grp-head')[2].getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
await p.mouse.move(pos.x, pos.y); await wait(420);
rows = await read(p, '#wdViewTask .wd-grp-head');
ok('C1 hover 行：文件夹透明、箭头可见', rows[2].fOp === 0 && rows[2].cOp === 1, JSON.stringify(rows[2]));
ok('C2 hover 行箭头仍指右（折叠语义）', rows[2].rot === 0, String(rows[2].rot));
ok('C3 未 hover 的折叠行仍是文件夹', rows.filter((r, i) => i !== 2 && !r.open).every(r => r.fOp === 1 && r.cOp === 0), JSON.stringify(rows.map(r => r.fOp)));
ok('C4 hover 时箭头颜色提到次要文字色', await p.evaluate(() => {
  const c = document.querySelectorAll('#wdViewTask .wd-grp-head')[2].querySelector('.wd-caret');
  return getComputedStyle(c).color === 'rgb(107, 107, 107)';
}));
await p.mouse.move(1200, 860); await wait(420);
rows = await read(p, '#wdViewTask .wd-grp-head');
ok('C5 移开恢复文件夹', rows[2].fOp === 1 && rows[2].cOp === 0, JSON.stringify(rows[2]));

/* ============ D 点开：文件夹 → 向下箭头；收起回文件夹 ============ */
await p.mouse.click(pos.x, pos.y); await wait(500);
rows = await read(p, '#wdViewTask .wd-grp-head');
ok('D1 展开后箭头转向下', rows[2].open && rows[2].cOp === 1 && rows[2].rot === 90, JSON.stringify(rows[2]));
ok('D2 展开后文件夹仍在 DOM 但透明（可回退）', rows[2].fOp === 0 && rows[2].dual);
await p.mouse.click(pos.x, pos.y); await wait(450);
await p.mouse.move(1200, 860); await wait(350);   /* 移开指针，否则 hover 态会盖住「已收起」 */
rows = await read(p, '#wdViewTask .wd-grp-head');
ok('D3 再收起又变回文件夹', !rows[2].open && rows[2].fOp === 1 && rows[2].cOp === 0, JSON.stringify(rows[2]));

/* ============ E 会话页签同规则，且同名目录与任务页签同色 ============ */
await p.evaluate(() => document.querySelector('[data-wd-tab="会话"]').click());
await p.mouse.move(1200, 860); await wait(450);
const sess = await read(p, '#wdViewSession .wd-grp-head');
ok('E1 会话折叠行是文件夹、展开行是箭头', sess.filter(r => !r.open).every(r => r.fOp === 1 && r.cOp === 0) && sess.filter(r => r.open).every(r => r.fOp === 0 && r.cOp === 1), JSON.stringify(sess.map(r => [r.open, r.fOp, r.cOp])));
const nameOf = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-grp-head')].map(h => h.querySelector('.wd-grp-name').textContent.trim()));
const sHue = Object.fromEntries(nameOf.map((n, i) => [n, sess[i].hue]));
const tHue = Object.fromEntries((await p.evaluate(() => [...document.querySelectorAll('#wdViewTask .wd-grp-head .wd-grp-name')].map(e => e.textContent.trim()))).map((n, i) => [n, hues[i]]));
ok('E2 同名目录两个页签同色（Nutstore / AI Native Factory）',
  sHue['Nutstore'] === tHue['Nutstore'] && sHue['AI Native Factory'] === tHue['AI Native Factory'],
  JSON.stringify({ sHue, tHue }));
ok('E3 会话页签也各自取到颜色（≥4 种不同）', new Set(sess.map(r => r.hue)).size >= 4 && sess.every(r => /^#[0-9A-Fa-f]{6}$/.test(r.hue)), JSON.stringify(sess.map(r => r.hue)));

/* ============ F 新增工作目录：新分组带色、结构与静态分组一致 ============ */
await p.evaluate(() => { window.showDirectoryPicker = async () => ({ name: '验收目录' }); document.getElementById('wdAddDir').click(); });
await wait(600);
const added = await p.evaluate(() => {
  const g = [...document.querySelectorAll('#wdViewSession .wd-grp')].pop();
  const c = g.querySelector('.wd-caret');
  return {
    name: g.querySelector('.wd-grp-name').textContent.trim(),
    hue: (g.style.getPropertyValue('--wd-folder-color') || '').trim(),
    dual: !!g.querySelector('.wd-caret-folder') && !!g.querySelector('.wd-caret-chev'),
    box: [Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)],
    folderColor: g.querySelector('.wd-caret-folder') ? getComputedStyle(g.querySelector('.wd-caret-folder')).color : ''
  };
});
ok('F1 新分组自动落到新目录名下', added.name === '验收目录', added.name);
ok('F2 新分组取到色板里的颜色', /^#[0-9A-Fa-f]{6}$/.test(added.hue) && added.folderColor !== 'rgb(31, 31, 31)', JSON.stringify(added));
ok('F3 新分组同样是「文件夹 + 箭头」双层、16×16', added.dual && added.box[0] === 16 && added.box[1] === 16, JSON.stringify(added));
ok('F4 无脚本报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ G 会话页 / 任务页（独立文件）也不报错、图标规则一致 ============ */
p = await mk('cecoder-task.html?id=0', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
let tr = await read(p, '#wdViewTask .wd-grp-head');
ok('G1 任务执行页同样折叠=文件夹', tr.filter(r => !r.open).every(r => r.fOp === 1), JSON.stringify(tr.map(r => r.fOp)));
ok('G2 任务执行页无报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

p = await mk('cecoder-session.html?id=0', () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
tr = await read(p, '#wdViewTask .wd-grp-head');
ok('G3 会话页左栏同样生效', tr.length > 0 && tr.filter(r => !r.open).every(r => r.fOp === 1), JSON.stringify(tr.map(r => r.fOp)));
ok('G4 会话页无报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

await b.close();
console.log('\n第 40 轮：' + pass + ' pass / ' + fail.length + ' fail');
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
