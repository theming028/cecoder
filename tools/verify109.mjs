/* 第 109 轮验收（第 110 轮已按新实现改写相关项）：
   ① 「页面关系」的卡片可以随手拖动（连线实时跟着重算），连线末端是三角箭头
   ② 点 .ug-scard 卡片本体也能选中（单选），点「预览」不改变选中
   ③ 「UI 界面生成中」卡底是静态图（第 110 轮按用户要求撤回动态色团）
   ④ 首页环境光 = 低分辨率 canvas 云雾流场（第 110 轮重做），只画小图、不跑 CSS 大图层动画 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1600, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);
const tabs = await p.$$('#uiTabs .tk-tab');
await tabs[1].click(); await wait(520);

/* ============================================================
   ① 三角箭头
   ============================================================ */
const A0 = await p.evaluate(() => {
  const arrows = [...document.querySelectorAll('.ud-rel-arrow')];
  /* 卡片与 SVG 都在 .ud-rel-map 的坐标系里，用 offset* 比，别用屏幕 rect */
  const box = id => { const e = document.querySelector('.ud-rel-card[data-id="' + id + '"]'); return [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]; };
  const near = (v, a, b2) => v >= a - 2 && v <= b2 + 2;
  return {
    n: arrows.length,
    dots: document.querySelectorAll('.ud-rel-dot').length,
    shapes: arrows.map(a => {
      const pts = a.getAttribute('points').split(' ').map(s => s.split(',').map(Number));
      const tip = pts[0], p1 = pts[1], p2 = pts[2];
      const base = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
      const id = a.getAttribute('data-b');
      const [x, y, w, h] = box(id);
      const onEdge = near(tip[0], x, x + w) && near(tip[1], y, y + h);
      return { n: pts.length, base: +base.toFixed(1), onEdge: onEdge, target: id };
    })
  };
});
ok('A1 5 条连线、每条末端一个三角箭头（圆点已移除）', A0.n === 5 && A0.dots === 0, JSON.stringify([A0.n, A0.dots]));
ok('A2 箭头是三点多边形、底边 8~10px', A0.shapes.every(s => s.n === 3 && s.base >= 7.5 && s.base <= 10.5), JSON.stringify(A0.shapes.map(s => s.base)));
ok('A3 箭头尖端落在目标卡边缘上', A0.shapes.every(s => s.onEdge), JSON.stringify(A0.shapes));

/* ============================================================
   ② 拖动卡片
   ============================================================ */
const dragTo = async (id, dx, dy, sample) => {
  const c = await p.evaluate((id) => { const e = document.querySelector('.ud-rel-card[data-id="' + id + '"]'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
  await p.mouse.move(c[0], c[1]);
  await p.mouse.down();
  let mid = null;
  for (let i = 1; i <= 8; i++) {
    await p.mouse.move(c[0] + dx * i / 8, c[1] + dy * i / 8);
    await wait(28);
    if (sample && i === 5) mid = await p.evaluate(() => ({ drag: document.querySelector('.ud-rel-card.is-drag') ? document.querySelector('.ud-rel-card.is-drag').dataset.id : null }));
  }
  await p.mouse.up(); await wait(260);
  return mid;
};

const before = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  const l = document.querySelector('.ud-rel-line[data-a="info"]');
  return { left: parseFloat(c.style.left), top: parseFloat(c.style.top), d: l.getAttribute('d') };
});
const mid = await dragTo('info', 80, -40, true);
const after = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  const l = document.querySelector('.ud-rel-line[data-a="info"]');
  return { left: parseFloat(c.style.left), top: parseFloat(c.style.top), d: l.getAttribute('d'), dragLeft: document.querySelectorAll('.ud-rel-card.is-drag').length };
});
ok('B1 拖动中卡片进 is-drag 态（抬起、压住连线）', mid && mid.drag === 'info', JSON.stringify(mid));
ok('B2 卡片位置跟着鼠标走（+80 / -40）', Math.abs(after.left - before.left - 80) <= 2 && Math.abs(after.top - before.top + 40) <= 2, JSON.stringify([before, after]));
ok('B3 松手后连线跟着重算、is-drag 清掉', after.d !== before.d && after.dragLeft === 0, JSON.stringify([before.d.slice(0, 24), after.d.slice(0, 24)]));
ok('B4 拖完仍是选中态', await p.evaluate(() => document.querySelector('.ud-rel-card[data-id="info"]').classList.contains('is-on')));

/* 边界：往左上甩很远，夹到 0；往右下甩，夹到地图右下（第 110 轮：地图铺满画布，不再是 592×271） */
const mapSize = () => p.evaluate(() => { const m = document.getElementById('udRelMap'); return [m.clientWidth, m.clientHeight]; });
await dragTo('info', -900, -900);
const C1 = await p.evaluate(() => { const c = document.querySelector('.ud-rel-card[data-id="info"]'); return [parseFloat(c.style.left), parseFloat(c.style.top)]; });
ok('B5 拖到左上出界：坐标夹到 0', C1[0] >= 0 && C1[1] >= 0 && C1[0] < 1 && C1[1] < 1, JSON.stringify(C1));
await dragTo('info', 1400, 1400);
const MS = await mapSize();
const C2 = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  return { l: parseFloat(c.style.left), t: parseFloat(c.style.top), w: c.offsetWidth, h: c.offsetHeight };
});
ok('B6 拖到右下出界：夹在整块画布内（地图宽高 − 卡宽高）', Math.abs(C2.l - (MS[0] - C2.w)) <= 1 && Math.abs(C2.t - (MS[1] - C2.h)) <= 1, JSON.stringify([C2, MS]));
ok('B7 可拖范围就是整块灰底画布（远大于 592×271）', MS[0] > 700 && MS[1] > 380, JSON.stringify(MS));

ok('C1 uidone 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

/* ============================================================
   ③ 生成中卡片：静态底图
   ============================================================ */
const g = await b.newPage(); g.__e = [];
g.on('pageerror', e => g.__e.push('pageerror: ' + e.message));
await g.setViewport({ width: 1600, height: 1000 });
await g.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
await wait(700);
const G0 = await g.evaluate(() => {
  const card = document.querySelector('.ug-gen-card');
  const cs = getComputedStyle(card), bs = getComputedStyle(card, '::before'), as = getComputedStyle(card, '::after');
  const r = card.getBoundingClientRect();
  return {
    bg: cs.backgroundImage, size: cs.backgroundSize, overflow: cs.overflow,
    b: [bs.content, bs.animationName], a: [as.content, as.animationName],
    rect: [Math.round(r.width), Math.round(r.height)],
    innerZ: getComputedStyle(document.querySelector('.ug-gen-in')).zIndex
  };
});
ok('D1 卡底是静态图 ui-gen.png（铺满 400×435）', /ui-gen\.png/.test(G0.bg) && /100% 100%/.test(G0.size), JSON.stringify([G0.bg.slice(0, 70), G0.size]));
ok('D2 不再有会动的色团伪元素', G0.b[0] === 'none' && G0.a[0] === 'none' && G0.b[1] === 'none' && G0.a[1] === 'none', JSON.stringify([G0.b, G0.a]));
ok('D3 卡仍是 400×435、无裁切、内容不用压层级', G0.rect[0] === 400 && G0.rect[1] === 435 && G0.overflow === 'visible' && G0.innerZ === 'auto', JSON.stringify([G0.rect, G0.overflow, G0.innerZ]));
ok('E1 生成中页无报错', g.__e.length === 0, g.__e.join(' | '));

/* ============================================================
   ④ ug-scard 整卡可点
   ============================================================ */
const u = await b.newPage(); u.__e = [];
u.on('pageerror', e => u.__e.push('pageerror: ' + e.message));
await u.setViewport({ width: 1600, height: 1000 });
await u.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(650);
const snap = () => u.evaluate(() => ({
  ons: [...document.querySelectorAll('.ug-scard')].map(c => c.dataset.sys + ':' + (c.classList.contains('is-on') ? 'on' : '-')),
  btns: [...document.querySelectorAll('.ug-scard')].map(c => c.querySelector('[data-pick]').textContent.trim()),
  cursor: getComputedStyle(document.querySelector('.ug-scard')).cursor
}));
const U0 = await snap();
ok('F1 初始只有 Cecoder 选中', U0.ons.filter(s => /:on$/.test(s)).join() === 'cecoder:on', JSON.stringify(U0.ons));
ok('F2 卡片是手型（可点）', U0.cursor === 'pointer', U0.cursor);

const t3 = await u.evaluate(() => { const r = document.querySelectorAll('.ug-scard')[2].querySelector('.ug-sname').getBoundingClientRect(); return [r.left + 16, r.top + 8]; });
await u.mouse.click(t3[0], t3[1]); await wait(350);
const U1 = await snap();
ok('F3 点卡本体即选中（单选，其他回灰）', U1.ons.filter(s => /:on$/.test(s)).join() === 'antd:on', JSON.stringify(U1.ons));
ok('F4 按钮文案跟着切「已选 / 选用」', U1.btns[2] === '已选' && U1.btns[0] === '选用' && U1.btns.filter(t => t === '已选').length === 1, JSON.stringify(U1.btns));

await u.mouse.click(t3[0], t3[1]); await wait(250);
ok('F5 已选卡再点不取消', (await snap()).ons.filter(s => /:on$/.test(s)).join() === 'antd:on');

const pv = await u.evaluate(() => { const b2 = document.querySelectorAll('.ug-scard')[3].querySelector('[data-preview]').getBoundingClientRect(); return [b2.left + b2.width / 2, b2.top + b2.height / 2]; });
await u.mouse.click(pv[0], pv[1]); await wait(400);
const U2 = await u.evaluate(() => ({ on: [...document.querySelectorAll('.ug-scard.is-on')].map(c => c.dataset.sys), ds: document.getElementById('dsDrawer') ? document.getElementById('dsDrawer').classList.contains('is-open') : null }));
ok('F6 点「预览」只开抽屉、不动选中', U2.on.join() === 'antd' && U2.ds !== false, JSON.stringify(U2));
ok('G1 ui 页无报错', u.__e.length === 0, u.__e.join(' | '));

/* ============================================================
   ⑤ 首页云雾流场（canvas）
   ============================================================ */
const h = await b.newPage(); h.__e = [];
h.on('pageerror', e => h.__e.push('pageerror: ' + e.message));
await h.setViewport({ width: 1440, height: 900 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const H0 = await h.evaluate(() => {
  const pm = document.getElementById('panelMain'), cv = document.getElementById('pmMist');
  const cs = getComputedStyle(pm), as = getComputedStyle(pm, '::after'), vcs = getComputedStyle(cv);
  const pr = pm.getBoundingClientRect();
  const ctx = cv.getContext('2d');
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let cov = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 6) cov++;
  return {
    pm: [Math.round(pr.width), Math.round(pr.height)],
    cv: [cv.width, cv.height], ratio: +(cv.width / pr.width).toFixed(2),
    cov: +(cov / (d.length / 4)).toFixed(2),
    disp: vcs.display, z: vcs.zIndex, pos: vcs.position, w: vcs.width, h: vcs.height,
    glows: cs.backgroundImage.split('radial-gradient').length - 1,
    grid: /44px 44px/.test(cs.backgroundSize),
    afterAnim: as.animationName,
    anims: document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName).filter(n => /pm/i.test(n))
  };
});
ok('H1 首页有一层铺满面板的云雾 canvas（1/6 分辨率）', H0.disp === 'block' && H0.pos === 'absolute' && H0.z === '-1' && H0.ratio > 0.14 && H0.ratio < 0.19, JSON.stringify([H0.disp, H0.pos, H0.z, H0.ratio]));
ok('H2 canvas 铺满面板且真的画上了（>90% 像素有雾）', H0.w === H0.pm[0] + 'px' && H0.cov > 0.9, JSON.stringify([H0.w, H0.cov]));
ok('H3 没有全尺寸 CSS 动画（::after 是静态留白层）', H0.afterAnim === 'none' && H0.anims.length === 0, JSON.stringify([H0.afterAnim, H0.anims]));
ok('H4 两团静态柔光 + 44px 网格仍在 panel-main 背景上', H0.glows === 2 && H0.grid, JSON.stringify([H0.glows, H0.grid]));

/* 画面在动：取同一块区域两次像素指纹比 */
const sig = () => h.evaluate(() => {
  const cv = document.getElementById('pmMist');
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let a = 0, m = 0;
  for (let i = 3; i < d.length; i += 4) { a += d[i]; m = Math.max(m, d[i]); }
  return [Math.round(a / (d.length / 4)), m];
});
const S1 = await sig();
await wait(1600);
const S2 = await sig();
ok('H5 云雾在缓慢流动（像素指纹变了）', S1[0] !== S2[0] || S1[1] !== S2[1], JSON.stringify([S1, S2]));

/* 内容压在雾之上（标题可命中） */
const H4 = await h.evaluate(() => {
  const t = document.querySelector('.hero-title'); const r = t.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + 8, r.top + r.height / 2);
  return { hit: top ? top.className.toString() : '' };
});
ok('H6 标题仍可命中（雾层不盖内容）', /ch|hero/.test(H4.hit), JSON.stringify(H4));

/* 帧率：连着 120 帧的平均间隔应接近 16.7ms */
const frames = await h.evaluate(() => new Promise(res => {
  const d = []; let last = performance.now(); let n = 0;
  const f = t => { d.push(t - last); last = t; if (++n < 120) requestAnimationFrame(f); else res(d); };
  requestAnimationFrame(f);
}));
const avg = frames.slice(5).reduce((a, c) => a + c, 0) / frames.slice(5).length;
ok('H7 首页帧间隔平均 ≤ 20ms（不卡）', avg <= 20, avg.toFixed(2));

/* reduced-motion：只画一帧，不再动 */
await h.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await h.reload({ waitUntil: 'load' });
await wait(700);
const R1 = await sig();
await wait(1400);
const R2 = await sig();
ok('H8 prefers-reduced-motion：云雾停在第一帧', R1[0] === R2[0] && R1[1] === R2[1] && R1[0] > 0, JSON.stringify([R1, R2]));
ok('E2 首页无报错', h.__e.length === 0, h.__e.join(' | '));

console.log('\n第 109 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
