/* 第 108 轮验收：
   ① 「页面关系」选中卡后，点任意空白处（含 592×271 地图之外的留白）即取消选中
   ② 「页面预览」页签下保留左列「页面层级和状态」，可继续切换页面 / 状态
   ③ 首页 .panel-main 移植 index(37) 的浅蓝环境光：极淡主色底 + 44px 网格 + 两层漂移光，
      两层分别跑 32s / 24s 的 alternate 动画（reduced-motion 下停） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import { installGlSampler } from './_glsample.mjs';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ============================================================
   ① ② uidone：关系图空白取消 + 预览保留左列
   ============================================================ */
const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1600, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);
const tab = async (i) => { const t = await p.$$('#uiTabs .tk-tab'); await t[i].click(); await wait(480); };

const state = () => p.evaluate(() => ({
  on: [...document.querySelectorAll('.ud-rel-card.is-on')].map(c => c.dataset.id),
  dim: document.querySelectorAll('.ud-rel-card.is-dim').length,
  hot: document.querySelectorAll('.ud-rel-line.is-hot').length,
  dimLines: document.querySelectorAll('.ud-rel-line.is-dim').length
}));

await tab(1);   /* 页面关系 */
ok('A1 关系图显示、左列收起', await p.evaluate(() => document.getElementById('udRel').hidden === false && getComputedStyle(document.getElementById('udPages')).display === 'none'));

await p.click('.ud-rel-card[data-id="info"]'); await wait(350);
const A2 = await state();
ok('A2 点卡选中：info 亮、其余按关系暗 / 亮', A2.on.join() === 'info', JSON.stringify(A2));

/* 点 592×271 地图「外面」的留白（.ud-rel 的 padding 左上角） */
const relBox = await p.evaluate(() => { const r = document.getElementById('udRel').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
await p.mouse.click(relBox[0] + 14, relBox[1] + 14); await wait(350);
const A3 = await state();
ok('A3 点地图外的空白：选中与变暗全部取消', A3.on.length === 0 && A3.dim === 0 && A3.hot === 0 && A3.dimLines === 0, JSON.stringify(A3));

/* 再选一次，点地图内空白 */
await p.click('.ud-rel-card[data-id="login"]'); await wait(320);
const A4 = await state();
await p.click('#udRelMap', { offset: { x: 6, y: 6 } }); await wait(320);
const A5 = await state();
ok('A4 点地图内空白同样取消选中', A4.on.length === 1 && A5.on.length === 0 && A5.dim === 0 && A5.hot === 0, JSON.stringify([A4, A5]));

/* 页面预览：左列留着 */
await tab(2);
const B0 = await p.evaluate(() => {
  const pg = document.getElementById('udPages'), ps = getComputedStyle(pg), r = pg.getBoundingClientRect();
  return { cls: document.getElementById('udCanvas').className, display: ps.display, w: Math.round(r.width), h: Math.round(r.height),
    head: !!document.querySelector('#udPages .ud-pages-head'), states: document.querySelectorAll('#udStates .ud-state').length,
    scroll: getComputedStyle(document.getElementById('udScroll')).display,
    board: Math.round(document.getElementById('udBoard').getBoundingClientRect().width),
    tools: getComputedStyle(document.querySelector('.ud-tools')).display };
});
ok('B1 预览下左列仍在（240 宽、标题与状态都在）', B0.display !== 'none' && Math.abs(B0.w - 240) <= 1 && B0.head && B0.states > 0, JSON.stringify(B0));
ok('B2 预览下画板仍在（左列不挡画板）', B0.scroll !== 'none' && B0.board > 200, JSON.stringify([B0.scroll, B0.board]));
ok('B3 预览仍是纯预览：标注类工具键收着', B0.tools === 'none', B0.tools);

/* 预览里点状态行能切换（且全局只有一个选中） */
const B4 = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('#udStates .ud-state')];
  rows[rows.length - 1].click();
  const on = [...document.querySelectorAll('#udStates .ud-state.is-on')];
  return { n: on.length, text: on[0] ? on[0].textContent.trim() : '', last: rows[rows.length - 1].textContent.trim() };
});
ok('B4 预览里点状态行可切换（全局仍单选中）', B4.n === 1 && B4.text === B4.last, JSON.stringify(B4));

/* 切回画板：左列与缩放正常恢复 */
await tab(0);
const B5 = await p.evaluate(() => ({ cls: document.getElementById('udCanvas').className, board: Math.round(document.getElementById('udBoard').getBoundingClientRect().width), zoom: document.getElementById('udZoomVal').textContent.trim() }));
ok('B5 切回画板：状态复位、画板回到大尺寸', !/is-prev|is-rel/.test(B5.cls) && B5.board > 400, JSON.stringify(B5));

ok('C1 uidone 无脚本报错', p.__e.length === 0, p.__e.join(' | '));

/* ============================================================
   ③ 首页 panel-main 的浅蓝环境光
   ============================================================ */
const h = await b.newPage(); h.__e = [];
h.on('pageerror', e => h.__e.push('pageerror: ' + e.message));
await h.setViewport({ width: 1440, height: 900 });
await installGlSampler(h);   /* 第 117 轮：背景是 WebGL2，readPixels 要同帧取（见 _glsample.mjs） */
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const H0 = await h.evaluate(() => {
  const pm = document.getElementById('panelMain');
  const cs = getComputedStyle(pm), bs = getComputedStyle(pm, '::before'), as = getComputedStyle(pm, '::after');
  const m = cs.backgroundColor.match(/[\d.]+/g) || [];
  return {
    page: document.body.dataset.page,
    /* Chrome 对 color-mix 结果返回 color(srgb 0..1) —— 统一折到 0..255 */
    bg: cs.backgroundColor, bgImage: cs.backgroundImage, rgb: (() => { const v = m.slice(0, 3).map(Number); return v.every(n => n <= 1) ? v.map(n => Math.round(n * 255)) : v; })(),
    grid: cs.backgroundImage.split('linear-gradient').length - 1,
    gridSize: cs.backgroundSize,
    isolation: cs.isolation,
    /* 第 109 轮：静态两团蓝光改画在 .panel-main 自己身上，动的那层只剩 ::after */
    glows: cs.backgroundImage.split('radial-gradient').length - 1,
    before: { name: bs.animationName },
    after: { name: as.animationName, z: as.zIndex, pos: as.position, bg: as.backgroundImage },
    /* 第 117 轮：背景换成参考站原版 WebGL2（#pmMist）+ 静态网格（#pmGrid） */
    mist: (() => {
      const cv = document.getElementById('pmMist');
      if (!cv) return null;
      const v = getComputedStyle(cv);
      const gl = cv.getContext('webgl2');
      const r = cv.getBoundingClientRect();
      return {
        disp: v.display, z: v.zIndex, pos: v.position,
        attr: [cv.width, cv.height], css: [Math.round(r.width), Math.round(r.height)],
        gl: !!gl, lost: gl ? gl.isContextLost() : null,
        mask: /transparent 100%/.test(v.webkitMaskImage || v.maskImage || '')
      };
    })(),
    grid: (() => {
      const cv = document.getElementById('pmGrid');
      if (!cv) return null;
      const v = getComputedStyle(cv);
      return { disp: v.display, z: v.zIndex, attr: [cv.width, cv.height] };
    })()
  };
});
ok('D1 只在首页生效（body[data-page=home]）', H0.page === 'home', H0.page);
ok('D2 底色是极淡主色（蓝通道 > 红通道，且几乎白）', H0.rgb[2] > H0.rgb[0] && H0.rgb[2] - H0.rgb[0] >= 3 && H0.rgb[0] > 235, JSON.stringify(H0.rgb));
/* 第 117 轮：背景照搬参考站 —— panel-main 自身只留一条 #9cc1e7 → 透明的纵向渐变当降级底色 */
ok('D3 背景是一条纵向渐变（原站 #9cc1e7 → 透明），没有网格', /linear-gradient/.test(H0.bgImage || '') && !/44px/.test(H0.gridSize || ''), JSON.stringify([String(H0.bg).slice(0, 60), H0.gridSize]));
ok('D4 没有全尺寸伪元素动画（::before / ::after 都停用）', H0.before.name === 'none' && H0.after.name === 'none', JSON.stringify([H0.before.name, H0.after.name]));
/* 第 118 轮：绘制缓冲按 CSS × 0.7 给（片元数砍到 49%），CSS 尺寸仍与面板等大 */
ok('D5 背景第一层是 WebGL2 canvas（absolute / z-index:-1 / 铺满面板、缓冲 0.7 倍）',
  !!H0.mist && H0.mist.disp === 'block' && H0.mist.pos === 'absolute' && H0.mist.z === '-1' &&
  H0.mist.gl && H0.mist.lost === false &&
  Math.abs(H0.mist.attr[0] - H0.mist.css[0] * 0.7) <= 3 && Math.abs(H0.mist.attr[1] - H0.mist.css[1] * 0.7) <= 3,
  JSON.stringify(H0.mist));
ok('D6 第二层是原站那张静态网格 canvas（同样是背景层、不吃事件）',
  !!H0.grid && H0.grid.disp === 'block' && H0.grid.z === '-1' && H0.grid.attr[0] > 300, JSON.stringify(H0.grid));

/* 动的是 canvas 的像素（不是 CSS 动画）
   第 117 轮：背景是 WebGL2，取不到 2D 像素 —— 用 _glsample 在 drawArrays 之后同帧
   readPixels 拿到的那一行指纹（[RGB 均值, 最大亮度]）。 */
const sig = () => h.evaluate(() => (window.__gl && window.__gl.sig ? window.__gl.sig.join(',') : ''));
const s1 = await sig();
await wait(4000);
const s2 = await sig();
ok('D7 云雾在流动（同帧采样到的像素在变）', !!s1 && s1 !== s2, JSON.stringify([s1, s2]));

/* reduced-motion 下只画一帧就停 */
await h.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await h.reload({ waitUntil: 'load' });
await wait(600);
const r1 = await sig();
await wait(1200);
const r2 = await sig();
ok('D8 prefers-reduced-motion：云雾停住', !!r1 && r1 === r2, JSON.stringify([r1, r2]));
await h.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

/* 内容仍然压在光层之上（标题可读、不被盖住） */
const H4 = await h.evaluate(() => {
  const t = document.querySelector('.hero-title'); const r = t.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + 8, r.top + r.height / 2);
  return { hit: top ? top.className.toString() : '', z: getComputedStyle(t).zIndex };
});
ok('D9 标题仍可命中（光层不盖内容）', /ch|hero/.test(H4.hit), JSON.stringify(H4));

/* 其它页面不受影响（会话页 panel-main 不带这套光层） */
const s = await b.newPage(); s.__e = [];
s.on('pageerror', e => s.__e.push('pageerror: ' + e.message));
await s.setViewport({ width: 1440, height: 900 });
await s.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(500);
const H5 = await s.evaluate(() => {
  const pm = document.getElementById('panelMain');
  const bs = getComputedStyle(pm, '::before'), cv = document.getElementById('pmMist');
  return { page: document.body.dataset.page, anim: bs.animationName, content: bs.content, mist: cv ? getComputedStyle(cv).display : null };
});
ok('D10 会话页不受影响（无云雾层 / 无漂移动画）', H5.page !== 'home' && H5.mist === 'none' && H5.anim !== 'pmAmbientDrift', JSON.stringify(H5));
ok('E1 首页无脚本报错', h.__e.length === 0, h.__e.join(' | '));

console.log('\n第 108 轮：' + pass + ' / ' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：\n - ' + fail.join('\n - ')); }
await b.close();
process.exit(fail.length ? 1 : 0);
