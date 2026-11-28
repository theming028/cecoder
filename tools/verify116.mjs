/* 第 117 轮验收：首页背景换成参考站（www.deepseek.com）原版实现
   用户原话：「算了，你就把参考网站的原封不动的复制过来吧」——
   于是把线上 bundle 里的 WebGL2 片元着色器「pattern」（checks + 域扭曲 + 8 段漩涡，
   三段颜色 mix）逐行搬进 assets/flowfield.js，参数取他们首页 hero 传的那一组；
   第二层是他们那张静态网格（90px / 线 10% / 点 4%）；两层共用同一条 mask。
   本脚本只量可量化的部分：结构、着色器与参数是否原样、是否在动、帧率、省电模式、其它页不受影响。 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'node:fs';
import { installGlSampler } from './_glsample.mjs';

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
await installGlSampler(h);
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(1500);

/* ---------- A 结构：两层 canvas ---------- */
const A = await h.evaluate(() => {
  const pm = document.getElementById('panelMain').getBoundingClientRect();
  const one = (id) => {
    const cv = document.getElementById(id);
    if (!cv) return null;
    const v = getComputedStyle(cv), r = cv.getBoundingClientRect();
    return {
      attr: [cv.width, cv.height],
      css: [Math.round(r.width), Math.round(r.height)],
      disp: v.display, pos: v.position, z: v.zIndex, pe: v.pointerEvents,
      mask: /rgba\(0, 0, 0, 0\) 100%/.test(v.webkitMaskImage || v.maskImage || ''),
      gl2: !!cv.getContext('webgl2')
    };
  };
  return { panel: [Math.round(pm.width), Math.round(pm.height)], flow: one('pmMist'), grid: one('pmGrid') };
});
ok('A1 第一层是 WebGL2 背景、与面板等大', !!A.flow && A.flow.gl2 && A.flow.disp === 'block' && A.flow.pos === 'absolute' &&
  A.flow.css[0] === A.panel[0] && A.flow.css[1] === A.panel[1] &&
  A.flow.attr[0] === A.flow.css[0] && A.flow.attr[1] === A.flow.css[1], JSON.stringify([A.panel, A.flow]));
ok('A2 第二层是原站那张静态网格 canvas', !!A.grid && A.grid.disp === 'block' && A.grid.pos === 'absolute' &&
  A.grid.css[0] === A.panel[0] && !A.grid.gl2, JSON.stringify(A.grid));
ok('A3 两层都压在内容之下、不吃事件', A.flow.z === '-1' && A.grid.z === '-1' &&
  A.flow.pe === 'none' && A.grid.pe === 'none', JSON.stringify([A.flow.z, A.grid.z, A.flow.pe, A.grid.pe]));
ok('A4 两层共用原站那条 mask（顶部不透明 → 到底部淡出）', A.flow.mask && A.grid.mask, JSON.stringify([A.flow.mask, A.grid.mask]));

/* ---------- B 源码：着色器与参数是否原样搬过来 ---------- */
const js = readFileSync(BASE + '/assets/flowfield.js', 'utf8');
const homeHtml = readFileSync(BASE + '/cecoder-home.html', 'utf8');
const sessionHtml = readFileSync(BASE + '/cecoder-session.html', 'utf8');
ok('B1 只在首页引入 flowfield.js', /<script src="assets\/flowfield\.js">/.test(homeHtml) && !/<script src="assets\/flowfield\.js">/.test(sessionHtml), '');
ok('B2 着色器是原版那段（GLSL ES 3.0 + blend_multi + 漩涡循环）',
  /#version 300 es/.test(js) && /vec3 blend_multi\(float mixer, float softness\)/.test(js) &&
  /u_swirlIterations/.test(js) && /checks_shape_uv/.test(js), '');
ok('B3 参数取他们首页传的那一组',
  /'#8AA3D6'/.test(js) && /speed: 14/.test(js) && /distortion: 20/.test(js) && /swirl: 12/.test(js) &&
  /swirlIterations: 8/.test(js) && /scale: 0\.5/.test(js) && /rotation: -5/.test(js) &&
  /proportion: 50/.test(js) && /softness: 100/.test(js) && /shapeScale: 10/.test(js) && /offsetY: 65/.test(js), '');
ok('B4 时间驱动用原版三条周期（420 / 460 / 90）', /\[420, 460, 90\]/.test(js), '');
ok('B5 旧的 2D 云雾实现已下线（app.js 里不再有 pmMist 的绘制）',
  !/function pmMist/.test(readFileSync(BASE + '/assets/app.js', 'utf8')), '');

/* ---------- C 在动 + 帧率 ---------- */
const sig = () => h.evaluate(() => (window.__gl && window.__gl.sig ? window.__gl.sig.join(',') : ''));
const C0 = await h.evaluate(() => ({ frames: window.__gl ? window.__gl.frames : 0, sig: window.__gl ? window.__gl.sig : null, err: window.__gl ? window.__gl.err : null }));
ok('C1 已在绘制且采样非空白', C0.frames > 10 && Array.isArray(C0.sig) && C0.sig.every(v => v > 100), JSON.stringify(C0));
const s1 = await sig();
await wait(4000);
const s2 = await sig();
ok('C2 4 秒内画面在变（同帧采样的三条横线指纹不同）', !!s1 && s1 !== s2, JSON.stringify([s1, s2]));

await h.evaluate(() => { if (window.__gl) window.__gl.on = false; });
const C3 = await h.evaluate(async () => {
  const before = window.__gl.frames;
  await new Promise(r => setTimeout(r, 2000));
  return { before, after: window.__gl.frames };
});
const fps = (C3.after - C3.before) / 2;
ok('C3 帧率贴着原版的 30fps 节流（22~34）', fps >= 22 && fps <= 34, fps.toFixed(1) + 'fps');

/* ---------- D 内容仍可命中 ---------- */
const D = await h.evaluate(() => {
  const hero = document.querySelector('.hero').getBoundingClientRect();
  const el = document.elementFromPoint(hero.left + 20, hero.top + 10);
  const card = document.querySelector('.c-card').getBoundingClientRect();
  const el2 = document.elementFromPoint(card.left + card.width / 2, card.top + 10);
  return { hero: el ? el.tagName + '.' + el.className : null, card: el2 ? el2.tagName + '.' + el2.className : null };
});
ok('D1 标题区命中的是内容元素（背景层没盖上来）', !!D.hero && !/pm-mist|pm-grid/.test(D.hero), String(D.hero));
ok('D2 输入卡可命中', !!D.card && !/pm-mist|pm-grid/.test(D.card), String(D.card));

/* ---------- E prefers-reduced-motion：只画一帧 ---------- */
const rp = await b.newPage();
await rp.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await rp.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await installGlSampler(rp);
await rp.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const E1 = await rp.evaluate(() => ({ frames: window.__gl.frames, sig: window.__gl.sig }));
await wait(1600);
const E2 = await rp.evaluate(() => ({ frames: window.__gl.frames, sig: window.__gl.sig }));
ok('E1 省电模式下不再逐帧绘制（帧数不涨）', E1.frames >= 1 && E2.frames === E1.frames, JSON.stringify([E1.frames, E2.frames]));
ok('E2 省电模式下仍画了第一帧（不是空白）', Array.isArray(E1.sig) && E1.sig.every(v => v > 100), JSON.stringify(E1.sig));
await rp.close();

/* ---------- F 其它页面不受影响 ---------- */
const s2p = await b.newPage();
await s2p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s2p.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(600);
const F = await s2p.evaluate(() => {
  const cv = document.getElementById('pmMist');
  const grid = document.getElementById('pmGrid');
  return {
    disp: cv ? getComputedStyle(cv).display : null,
    /* 不能拿 getContext('webgl2') 判「脚本没跑」—— 这一调用本身就会建上下文；
       改看内部像素尺寸：脚本没启动时 canvas 停在默认的 300×150 */
    size: cv ? [cv.width, cv.height] : null,
    gridDisp: grid ? getComputedStyle(grid).display : null
  };
});
ok('F1 会话页背景层隐藏、脚本没启动（canvas 仍是默认 300×150）', F.disp === 'none' && F.size && F.size[0] === 300 && F.size[1] === 150 && F.gridDisp === 'none', JSON.stringify(F));
await s2p.close();

ok('G1 首页无脚本报错', errs.length === 0, errs.join(' | '));

await b.close();
console.log('\n' + (fail === 0 ? '全部通过' : '存在失败') + `  ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
