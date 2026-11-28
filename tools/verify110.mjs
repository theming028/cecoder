/* 第 110 轮验收：
   ① 「页面关系」的地图不再是 592×271 的固定小画板 —— 铺满整块灰底画布，卡片随便拖
   ② 「UI 界面生成中」的卡底按用户要求恢复到静态图 ui-gen.png（撤掉动态色团）
   ③ 首页环境光重做成「云雾流场」：1/6 分辨率 canvas 每 50ms 画一次，雾团沿左下→右上慢漂 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import { installGlSampler } from './_glsample.mjs';

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
await tabs[1].click(); await wait(560);

/* ============================================================
   ① 关系图：地图铺满画布
   ============================================================ */
const A0 = await p.evaluate(() => {
  const rel = document.getElementById('udRel'), map = document.getElementById('udRelMap');
  const rr = rel.getBoundingClientRect(), mr = map.getBoundingClientRect();
  const cs = getComputedStyle(map), rs = getComputedStyle(rel);
  const cards = [...document.querySelectorAll('.ud-rel-card')].map(c => c.getBoundingClientRect());
  const x0 = Math.min(...cards.map(r => r.left)), x1 = Math.max(...cards.map(r => r.right));
  const y0 = Math.min(...cards.map(r => r.top)), y1 = Math.max(...cards.map(r => r.bottom));
  const svg = document.getElementById('udRelLines');
  return {
    map: [Math.round(mr.width), Math.round(mr.height)],
    rel: [Math.round(rr.width), Math.round(rr.height)],
    pad: rs.paddingTop,
    transform: cs.transform,
    group: [Math.round(x1 - x0), Math.round(y1 - y0)],
    centerOff: [Math.round((x0 + x1) / 2 - (mr.left + mr.width / 2)), Math.round((y0 + y1) / 2 - (mr.top + mr.height / 2))],
    svg: [Math.round(svg.getBoundingClientRect().width), Math.round(svg.getBoundingClientRect().height)],
    viewBox: svg.getAttribute('viewBox')
  };
});
ok('A1 地图铺满画布（= 画布减去 24 内距）', Math.abs(A0.map[0] - (A0.rel[0] - 48)) <= 1 && Math.abs(A0.map[1] - (A0.rel[1] - 48)) <= 1, JSON.stringify([A0.map, A0.rel]));
ok('A2 地图不再整体缩放（transform 为 none）', A0.transform === 'none', A0.transform);
/* 稿的版式区域是 592×271，卡片实际占 562×271（左右各留 15）；居中后组中心比地图中心左偏 15 */
ok('A3 初始版式仍按稿的 592×271 居中摆', A0.group[0] === 562 && A0.group[1] === 271 && Math.abs(A0.centerOff[0] + 15) <= 2 && Math.abs(A0.centerOff[1]) <= 2, JSON.stringify([A0.group, A0.centerOff]));
ok('A4 SVG 跟着地图铺满（无固定 viewBox）', A0.svg[0] === A0.map[0] && A0.svg[1] === A0.map[1] && !A0.viewBox, JSON.stringify([A0.svg, A0.viewBox]));

/* 拖到地图右下角：位移远超 592−w / 271−h 的老上限 */
const dragTo = async (id, dx, dy) => {
  const c = await p.evaluate((id) => { const e = document.querySelector('.ud-rel-card[data-id="' + id + '"]'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
  await p.mouse.move(c[0], c[1]);
  await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(c[0] + dx * i / 10, c[1] + dy * i / 10); await wait(26); }
  await p.mouse.up(); await wait(300);
};
await dragTo('info', 420, 300);
const A1 = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  const m = document.getElementById('udRelMap');
  const a = [...document.querySelectorAll('.ud-rel-arrow')].find(n => n.getAttribute('data-a') === 'info');
  const r = c.getBoundingClientRect(), mr = m.getBoundingClientRect();
  return {
    left: parseFloat(c.style.left), top: parseFloat(c.style.top),
    beyondOld: parseFloat(c.style.left) > 592 - c.offsetWidth || parseFloat(c.style.top) > 271 - c.offsetHeight,
    rightGap: Math.round(mr.right - r.right), bottomGap: Math.round(mr.bottom - r.bottom),
    arrow: a ? a.getAttribute('points') : null
  };
});
ok('A5 卡片能拖出原来的 592×271 范围（比老地图右下角更远）', A1.beyondOld, JSON.stringify([A1.left, A1.top]));
ok('A6 卡片仍被夹在地图里（右边/下边有余量，没跑出去）', A1.rightGap >= 0 && A1.bottomGap >= 0, JSON.stringify([A1.rightGap, A1.bottomGap]));
ok('A7 拖到新位置后连线/箭头仍跟着（箭头属性还在）', !!A1.arrow && A1.arrow.split(' ').length === 3, String(A1.arrow));

/* 缩窗口：已经在右下角的卡片会被夹回可视范围 */
const posBefore = await p.evaluate(() => { const c = document.querySelector('.ud-rel-card[data-id="info"]'); return [parseFloat(c.style.left), parseFloat(c.style.top)]; });
await p.setViewport({ width: 1180, height: 760 });
await wait(420);
const A2 = await p.evaluate(() => {
  const c = document.querySelector('.ud-rel-card[data-id="info"]');
  const m = document.getElementById('udRelMap');
  return { l: parseFloat(c.style.left), t: parseFloat(c.style.top), mw: m.clientWidth, mh: m.clientHeight, w: c.offsetWidth, h: c.offsetHeight };
});
ok('A8 缩小窗口后卡片被夹回地图内', A2.l <= A2.mw - A2.w + 1 && A2.t <= A2.mh - A2.h + 1, JSON.stringify([posBefore, A2]));
await p.setViewport({ width: 1600, height: 1000 }); await wait(300);
ok('B0 uidone 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

/* ============================================================
   ② 生成中卡底 = 静态图
   ============================================================ */
const g = await b.newPage(); g.__e = [];
g.on('pageerror', e => g.__e.push('pageerror: ' + e.message));
g.on('console', m => { if (m.type() === 'error') g.__e.push('console: ' + m.text()); });
await g.setViewport({ width: 1600, height: 1000 });
await g.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
await wait(700);
const G = await g.evaluate(() => {
  const card = document.querySelector('.ug-gen-card');
  const cs = getComputedStyle(card), bs = getComputedStyle(card, '::before'), as = getComputedStyle(card, '::after');
  const r = card.getBoundingClientRect();
  return {
    bg: cs.backgroundImage, size: cs.backgroundSize, repeat: cs.backgroundRepeat,
    rect: [Math.round(r.width), Math.round(r.height)],
    b: [bs.content, bs.animationName], a: [as.content, as.animationName],
    overflow: cs.overflow
  };
});
ok('C1 卡底回到静态图 ui-gen.png（铺满、不重复）', /ui-gen\.png/.test(G.bg) && /100% 100%/.test(G.size) && G.repeat === 'no-repeat', JSON.stringify([G.bg.slice(0, 60), G.size, G.repeat]));
ok('C2 没有会动的色团伪元素', G.b[0] === 'none' && G.a[0] === 'none', JSON.stringify([G.b, G.a]));
ok('C3 卡仍是 400×435、不裁切', G.rect[0] === 400 && G.rect[1] === 435 && G.overflow === 'visible', JSON.stringify([G.rect, G.overflow]));
ok('C4 生成中页无报错', g.__e.length === 0, g.__e.join(' | '));

/* ============================================================
   ③ 首页云雾流场
   ============================================================ */
const h = await b.newPage(); h.__e = [];
h.on('pageerror', e => h.__e.push('pageerror: ' + e.message));
h.on('console', m => { if (m.type() === 'error') h.__e.push('console: ' + m.text()); });
await h.setViewport({ width: 1440, height: 900 });
await installGlSampler(h);   /* 第 117 轮：背景是 WebGL2，像素只能同帧 readPixels（见 _glsample.mjs） */
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const H = await h.evaluate(() => {
  const pm = document.getElementById('panelMain'), cv = document.getElementById('pmMist');
  const pr = pm.getBoundingClientRect(), cs = getComputedStyle(cv);
  const gl = cv.getContext('webgl2');
  return {
    pm: [Math.round(pr.width), Math.round(pr.height)], cv: [cv.width, cv.height],
    ratio: +(cv.width / pr.width).toFixed(2),
    gl: !!gl, lost: gl ? gl.isContextLost() : null,
    frames: window.__gl ? window.__gl.frames : 0,
    sig: window.__gl ? window.__gl.sig : null,
    disp: cs.display, z: cs.zIndex, pe: cs.pointerEvents,
    w: cs.width, h: cs.height
  };
});
/* 第 117 轮：低分辨率 2D 云雾整体换成参考站原版 WebGL2 pattern */
/* 第 118 轮：绘制缓冲 = CSS × 0.7（片元数砍到 49%，观感不变） */
ok('D1 背景 canvas 铺满面板、绘制缓冲 0.7 倍', H.disp === 'block' && H.z === '-1' && H.ratio >= 0.65 && H.ratio <= 0.75 && H.w === H.pm[0] + 'px' && H.h === H.pm[1] + 'px', JSON.stringify([H.disp, H.z, H.ratio, H.w, H.h]));
ok('D2 拿到的是 WebGL2 context，且没丢', H.gl && H.lost === false, JSON.stringify([H.gl, H.lost]));
ok('D3 已在绘制（有帧 + 采到像素）', H.frames > 0 && Array.isArray(H.sig) && H.sig.length === 3, JSON.stringify([H.frames, H.sig]));
ok('D4 不拦点击（pointer-events: none）', H.pe === 'none', H.pe);

const sig = () => h.evaluate(() => (window.__gl && window.__gl.sig ? window.__gl.sig.join(',') : ''));
const S1 = await sig(); await wait(4000); const S2 = await sig();
ok('D5 雾在缓慢流动（两次像素指纹不同）', !!S1 && S1 !== S2, JSON.stringify([S1, S2]));

/* 帧率与标题可读（先关取样，readPixels 会打断管线） */
await h.evaluate(() => { if (window.__gl) window.__gl.on = false; });
const frames = await h.evaluate(() => new Promise(res => {
  const d = []; let last = performance.now(); let n = 0;
  const f = t => { d.push(t - last); last = t; if (++n < 120) requestAnimationFrame(f); else res(d); };
  requestAnimationFrame(f);
}));
const avg = frames.slice(5).reduce((a, c) => a + c, 0) / frames.slice(5).length;
ok('D6 首页帧间隔平均 ≤ 20ms', avg <= 20, avg.toFixed(2));
const hit = await h.evaluate(() => {
  const t = document.querySelector('.hero-title'); const r = t.getBoundingClientRect();
  const e = document.elementFromPoint(r.left + 8, r.top + r.height / 2);
  return e ? e.className.toString() : '';
});
ok('D7 标题仍可命中（雾层不盖内容）', /ch|hero/.test(hit), hit);

/* 只有首页有雾 */
const s = await b.newPage();
await s.setViewport({ width: 1440, height: 900 });
await s.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(400);
const S = await s.evaluate(() => { const cv = document.getElementById('pmMist'); return cv ? [getComputedStyle(cv).display, cv.width, cv.height] : null; });
ok('D8 其它页面不画雾（display:none、canvas 未被撐开）', S && S[0] === 'none' && S[1] === 300 && S[2] === 150, JSON.stringify(S));
ok('E1 首页无报错', h.__e.length === 0, h.__e.join(' | '));

console.log('\n第 110 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
