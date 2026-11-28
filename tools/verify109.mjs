/* 第 109 轮验收：
   ① 「页面关系」的卡片可以随手拖动（连线实时跟着重算），连线末端是三角箭头
   ② 点 .ug-scard 卡片本体也能选中（单选），点「预览」不改变选中
   ③ 「UI 界面生成中」卡片的彩色底由静态图改成会流动的色团
   ④ 首页环境光重做后只是一层小图层的纯位移动画（不再全尺寸 + scale/rotate/opacity） */
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
  /* 卡片与 SVG 都在 .ud-rel-map 的 592×271 坐标系里，用 offset* 比，别用屏幕 rect（地图会被缩放） */
  const box = id => { const e = document.querySelector('.ud-rel-card[data-id="' + id + '"]'); return [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]; };
  /* 每个箭头：3 个顶点、底边长度 8~10、尖端落在目标卡的边上（±2px） */
  const near = (v, a, b) => v >= a - 2 && v <= b + 2;
  return {
    n: arrows.length,
    dots: document.querySelectorAll('.ud-rel-dot').length,
    shapes: arrows.map(a => {
      const pts = a.getAttribute('points').split(' ').map(s => s.split(',').map(Number));
      const tip = pts[0], p1 = pts[1], p2 = pts[2];
      const base = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
      const id = a.getAttribute('data-b');
      const [x, y, w, h] = box(id);
      /* 尖端要在目标卡的外框上（左/右/上/下任一边） */
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

/* 边界：往左上甩很远，不能跑出地图 */
await dragTo('info', -900, -900);
const C1 = await p.evaluate(() => { const c = document.querySelector('.ud-rel-card[data-id="info"]'); return [parseFloat(c.style.left), parseFloat(c.style.top)]; });
ok('B5 拖到左上出界：坐标夹到 0', C1[0] >= 0 && C1[1] >= 0 && C1[0] < 1 && C1[1] < 1, JSON.stringify(C1));
await dragTo('info', 1400, 1400);
const C2 = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  return { l: parseFloat(c.style.left), t: parseFloat(c.style.top), w: c.offsetWidth, h: c.offsetHeight };
});
ok('B6 拖到右下出界：右边/下边不出 592×271', Math.abs(C2.l - (592 - C2.w)) <= 1 && Math.abs(C2.t - (271 - C2.h)) <= 1, JSON.stringify(C2));

ok('C1 uidone 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

/* ============================================================
   ③ 生成中卡片：动态色团
   ============================================================ */
const g = await b.newPage(); g.__e = [];
g.on('pageerror', e => g.__e.push('pageerror: ' + e.message));
await g.setViewport({ width: 1600, height: 1000 });
await g.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
await wait(700);
const G0 = await g.evaluate(() => {
  const card = document.querySelector('.ug-gen-card');
  const cs = getComputedStyle(card), bs = getComputedStyle(card, '::before'), as = getComputedStyle(card, '::after');
  return {
    bg: cs.backgroundImage + '|' + cs.backgroundColor,
    b: [bs.animationName, bs.animationDuration, bs.willChange],
    a: [as.animationName, as.animationDuration],
    overflow: cs.overflow, z: getComputedStyle(document.querySelector('.ug-gen-in')).zIndex,
    size: [Math.round(card.getBoundingClientRect().width), Math.round(card.getBoundingClientRect().height)]
  };
});
ok('D1 卡底不再是静态图（无 url()）', !/url\(/.test(G0.bg), G0.bg.slice(0, 60));
ok('D2 两层色团动画在跑（18s / 23s）', G0.b[0] === 'ugGenBlobA' && G0.b[1] === '18s' && G0.a[0] === 'ugGenBlobB' && G0.a[1] === '23s', JSON.stringify([G0.b, G0.a]));
ok('D3 色团被卡片裁掉、内容压在色团之上', G0.overflow === 'hidden' && G0.z === '1', JSON.stringify([G0.overflow, G0.z]));
ok('D4 卡仍是 400×435', G0.size[0] === 400 && G0.size[1] === 435, JSON.stringify(G0.size));

const g1 = await g.evaluate(() => getComputedStyle(document.querySelector('.ug-gen-card'), '::before').transform);
await wait(2600);
const g2 = await g.evaluate(() => getComputedStyle(document.querySelector('.ug-gen-card'), '::before').transform);
ok('D5 色团真的在流动（transform 变了）', g1 !== g2, JSON.stringify([g1, g2]));

await g.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
const G3 = await g.evaluate(() => [
  getComputedStyle(document.querySelector('.ug-gen-card'), '::before').animationName,
  getComputedStyle(document.querySelector('.ug-gen-card'), '::after').animationName
]);
ok('D6 prefers-reduced-motion：色团停住', G3[0] === 'none' && G3[1] === 'none', JSON.stringify(G3));
await g.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
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

/* 点第 3 张卡的标题区（卡片本体，不是按钮） */
const t3 = await u.evaluate(() => { const r = document.querySelectorAll('.ug-scard')[2].querySelector('.ug-sname').getBoundingClientRect(); return [r.left + 16, r.top + 8]; });
await u.mouse.click(t3[0], t3[1]); await wait(350);
const U1 = await snap();
ok('F3 点卡本体即选中（单选，其他回灰）', U1.ons.filter(s => /:on$/.test(s)).join() === 'antd:on', JSON.stringify(U1.ons));
ok('F4 按钮文案跟着切「已选 / 选用」', U1.btns[2] === '已选' && U1.btns[0] === '选用' && U1.btns.filter(t => t === '已选').length === 1, JSON.stringify(U1.btns));

/* 点同卡再点一次：不取消（保持单选） */
await u.mouse.click(t3[0], t3[1]); await wait(250);
ok('F5 已选卡再点不取消', (await snap()).ons.filter(s => /:on$/.test(s)).join() === 'antd:on');

/* 点「预览」：开抽屉但不改选中 */
const pv = await u.evaluate(() => { const b = document.querySelectorAll('.ug-scard')[3].querySelector('[data-preview]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
await u.mouse.click(pv[0], pv[1]); await wait(400);
const U2 = await u.evaluate(() => ({ on: [...document.querySelectorAll('.ug-scard.is-on')].map(c => c.dataset.sys), ds: document.getElementById('dsDrawer') ? document.getElementById('dsDrawer').classList.contains('is-open') : null }));
ok('F6 点「预览」只开抽屉、不动选中', U2.on.join() === 'antd' && U2.ds !== false, JSON.stringify(U2));
ok('G1 ui 页无报错', u.__e.length === 0, u.__e.join(' | '));

/* ============================================================
   ⑤ 首页环境光 = 一层小图层纯位移
   ============================================================ */
const h = await b.newPage(); h.__e = [];
h.on('pageerror', e => h.__e.push('pageerror: ' + e.message));
await h.setViewport({ width: 1440, height: 900 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(700);
const H0 = await h.evaluate(() => {
  const pm = document.getElementById('panelMain');
  const cs = getComputedStyle(pm), as = getComputedStyle(pm, '::after'), bs = getComputedStyle(pm, '::before');
  const anims = document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName);
  const pr = pm.getBoundingClientRect();
  const ar = pm.getBoundingClientRect();   /* 动层是它的 ::after，尺寸由 width/height 百分比给 */
  return {
    anims: anims,
    beforeAnim: bs.animationName,
    after: { name: as.animationName, w: parseFloat(as.width), h: parseFloat(as.height), wc: as.willChange, t: as.transform },
    pm: [Math.round(pr.width), Math.round(pr.height)],
    glows: cs.backgroundImage.split('radial-gradient').length - 1,
    grid: /44px 44px/.test(cs.backgroundSize)
  };
});
ok('H1 环境光只跑一个动画（pmGlowDrift），::before 不再动', H0.after.name === 'pmGlowDrift' && H0.beforeAnim === 'none' && H0.anims.filter(n => /pmAmbient|pmGlowDrift/.test(n)).length === 1, JSON.stringify([H0.anims, H0.beforeAnim]));
const areaRatio = (H0.after.w * H0.after.h) / (H0.pm[0] * H0.pm[1]);
ok('H2 动层只有面板的 ~39%（原全尺寸双层 132%）', areaRatio <= 0.45, areaRatio.toFixed(2));
ok('H3 动层带 will-change: transform', /transform/.test(H0.after.wc), H0.after.wc);
ok('H4 两团静态光 + 44px 网格仍在 panel-main 背景上', H0.glows === 2 && H0.grid, JSON.stringify([H0.glows, H0.grid]));

/* 位移矩阵：a=1 b=0 c=0 d=1，即纯 translate（没有 scale / rotate） */
const m1 = H0.after.t.match(/matrix\(([^)]+)\)/);
const parts = m1 ? m1[1].split(',').map(Number) : [];
ok('H5 动层是纯位移（matrix 无缩放/旋转）', parts.length >= 6 && Math.abs(parts[0] - 1) < .002 && Math.abs(parts[1]) < .002 && Math.abs(parts[2]) < .002 && Math.abs(parts[3] - 1) < .002, H0.after.t);
await wait(2400);
const m2 = await h.evaluate(() => getComputedStyle(document.getElementById('panelMain'), '::after').transform);
ok('H6 位移随时间变化（在动）', m2 !== H0.after.t, JSON.stringify([H0.after.t, m2]));

/* 帧率：连着 120 帧的平均间隔应接近 16.7ms（不出现连续掉帧） */
const frames = await h.evaluate(() => new Promise(res => {
  const d = []; let last = performance.now(); let n = 0;
  const f = t => { d.push(t - last); last = t; if (++n < 120) requestAnimationFrame(f); else res(d); };
  requestAnimationFrame(f);
}));
const avg = frames.slice(5).reduce((a, b) => a + b, 0) / frames.slice(5).length;
ok('H7 首页帧间隔平均 ≤ 20ms（不卡）', avg <= 20, avg.toFixed(2));
ok('E2 首页无报错', h.__e.length === 0, h.__e.join(' | '));

console.log('\n第 109 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
