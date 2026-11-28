/* 第 118 轮验收：首页四处调整
   ① `.stage` 顶部锚点从 clamp(150px, 22vh, 240px)-48px 改成 panel-main 高度的 18%（按比例缩放）；
   ② 背景（WebGL2 pattern）纯成本优化：绘制缓冲 0.7 倍、常量 uniform 只设一次、
      powerPreference 不再强制集显 —— 观感不变，验收看「构图仍然铺满 + 片元数下降 + 帧率不降」；
   ③ `.scene` 场景卡：黑 10% + 白色半透明描边，去掉 15px backdrop blur（压在每帧重画的 canvas 上太贵）；
   ④ `.sc-htxt` 标题组文字 #152443（title / desc 都点名，父级 color 不透传）。
   【第 119 轮已回滚 ③④：场景卡回白 85% + 15px blur，标题组回 #1F1F1F / #868686 ——
     下面 C / D 两组断言同步改成回滚后的口径，验收点仍是「本轮的取舍没有偷偷改回去」。 */
import puppeteer from 'puppeteer-core';
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

/* ---------- A stage 顶部按比例 ---------- */
const geo = async (height) => {
  await h.setViewport({ width: 1440, height, deviceScaleFactor: 1 });
  await h.reload({ waitUntil: 'load' });
  await wait(900);
  return h.evaluate(() => {
    const R = s => { const r = document.querySelector(s).getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) }; };
    return { pm: R('#panelMain'), stage: R('.stage'), hero: R('.hero') };
  });
};

await installGlSampler(h);
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(900);
const A900 = await geo(900);
const A700 = await geo(700);
const A_t = A900.stage.t - A900.pm.t;              /* 相对 panel-main 顶的偏移 */
const B_t = A700.stage.t - A700.pm.t;
ok('A1 900 高：stage 顶 = panel-main 高的 18%（153±3）', Math.abs(A_t - A900.pm.h * 0.18) <= 3, JSON.stringify([A_t, A900.pm.h, A900.pm.h * 0.18]));
ok('A2 700 高：同样是 18%（不是被 clamp 钉死的 150）', Math.abs(B_t - A700.pm.h * 0.18) <= 3 && Math.abs(B_t - A_t) >= 20, JSON.stringify([B_t, A700.pm.h, A_t]));
ok('A3 顶部偏移与容器高度成正比（比值差 < 1%）', Math.abs(A_t / A900.pm.h - B_t / A700.pm.h) < 0.01, JSON.stringify([A_t / A900.pm.h, B_t / A700.pm.h]));
ok('A4 hero 仍贴在 stage 顶（结构没变）', Math.abs(A900.hero.t - A900.stage.t) <= 1 && Math.abs(A700.hero.t - A700.stage.t) <= 1, JSON.stringify([A900.hero.t, A900.stage.t]));

/* ---------- C 场景卡：第 119 轮已回滚到白色磨砂（黑 10% 只是第 118 轮的一次尝试） ---------- */
await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.reload({ waitUntil: 'load' });
await wait(1200);
const S = await h.evaluate(() => {
  const sc = document.querySelector('.scene');
  const c = getComputedStyle(sc);
  return { bg: c.backgroundColor, border: c.borderColor, bw: c.borderWidth, bf: c.backdropFilter || c.webkitBackdropFilter || 'none' };
});
ok('C1 场景卡底色 = 白 85%（第 119 轮回滚）', /rgba\(255, 255, 255, 0\.85\)/.test(S.bg), S.bg);
ok('C2 描边 = 白色半透明（非全不透明）', /rgba\(255, 255, 255, 0\.\d+\)/.test(S.border) && S.bw === '1px', JSON.stringify([S.border, S.bw]));
ok('C3 白玻璃配套 15px backdrop blur', /blur\(15px\)/.test(S.bf), S.bf);

/* hover：白底时期的口径是提到白 96% */
const boxy = await h.evaluate(() => { const r = document.querySelector('.scene').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await h.mouse.move(boxy.x, boxy.y);
await wait(420);
const SH = await h.evaluate(() => {
  const c = getComputedStyle(document.querySelector('.scene'));
  return { bg: c.backgroundColor, border: c.borderColor };
});
ok('C4 悬浮提到白 96%', /rgba\(255, 255, 255, 0\.96\)/.test(SH.bg), JSON.stringify(SH));
await h.mouse.move(4, 4);
await wait(320);

/* ---------- D sc-htxt 文字色（第 119 轮撤掉 #152443，回到各自的 token） ---------- */
await h.click('#scIdle');
await wait(520);
const D = await h.evaluate(() => {
  const q = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).color : null; };
  return {
    state: document.querySelector('.scene').getAttribute('data-state'),
    ht: q('.sc-htxt'),
    title: q('.sc-htxt .scene-title'),
    desc: q('.sc-htxt .scene-desc')
  };
});
ok('D1 看板态已展开', D.state === 'open' || D.state === 'collapsed', D.state);
ok('D2 sc-htxt 本体回到 #1F1F1F', D.ht === 'rgb(31, 31, 31)', D.ht);
ok('D3 标题 #1F1F1F', D.title === 'rgb(31, 31, 31)', D.title);
ok('D4 副标题回到 #868686', D.desc === 'rgb(134, 134, 134)', D.desc);

/* ---------- B 背景：缓冲缩小、仍在动、帧率不降 ---------- */
const B = await h.evaluate(() => {
  const cv = document.getElementById('pmMist');
  const r = cv.getBoundingClientRect();
  const pm = document.getElementById('panelMain').getBoundingClientRect();
  return {
    buf: [cv.width, cv.height],
    css: [Math.round(r.width), Math.round(r.height)],
    panel: [Math.round(pm.width), Math.round(pm.height)],
    ratio: +(cv.width * cv.height) / Math.max(1, Math.round(r.width) * Math.round(r.height))
  };
});
ok('B1 CSS 尺寸仍铺满面板', B.css[0] === B.panel[0] && B.css[1] === B.panel[1], JSON.stringify([B.css, B.panel]));
ok('B2 绘制缓冲压到 CSS 像素的 ~49%（0.7²）', B.ratio > 0.45 && B.ratio < 0.55, String(B.ratio));
ok('B3 缓冲仍是等比缩放（宽高比与面板一致）', Math.abs(B.buf[0] / B.buf[1] - B.css[0] / B.css[1]) < 0.01, String(B.buf[0] / B.buf[1]));

const sig = () => h.evaluate(() => (window.__gl && window.__gl.sig ? window.__gl.sig.join(',') : ''));
const s1 = await sig();
await wait(4000);
const s2 = await sig();
ok('B4 画面仍在流动（同帧采样指纹变了）', !!s1 && s1 !== s2, JSON.stringify([s1, s2]));
ok('B5 画面不是纯色/黑屏（三条采样行亮度不全相同）', !!s1 && new Set(s1.split(',')).size >= 2, s1);

/* 帧率：关掉 readPixels 取样再测 */
await h.evaluate(() => { if (window.__gl) window.__gl.on = false; });
const fps = await h.evaluate(() => new Promise(res => {
  const gaps = []; let last = performance.now(); const t0 = last;
  const step = () => {
    const n = performance.now(); gaps.push(n - last); last = n;
    if (n - t0 < 2500) requestAnimationFrame(step); else {
      gaps.sort((a, b) => a - b);
      const q = v => +gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * v))].toFixed(1);
      res({ n: gaps.length, p50: q(.5), p95: q(.95), max: +gaps[gaps.length - 1].toFixed(1) });
    }
  };
  requestAnimationFrame(step);
}));
ok('B6 主线程满帧（p95 < 22ms）', fps.p95 < 22, JSON.stringify(fps));
ok('B7 没有长帧卡顿（max < 40ms）', fps.max < 40, JSON.stringify(fps));

/* ---------- E 其它页不受影响 ---------- */
const s = await b.newPage();
await s.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await s.goto('file:///' + BASE + '/cecoder-session.html', { waitUntil: 'load' });
await wait(900);
const E = await s.evaluate(() => {
  const st = document.querySelector('.stage');
  const c = getComputedStyle(st);
  return { top: c.top, isChat: st.classList.contains('is-chat'), pos: c.position };
});
ok('E1 会话页 stage 仍是 is-chat 的 44px（没被 18% 带跑）', E.isChat && E.top === '44px', JSON.stringify(E));

ok('F1 首页 / 会话页都无脚本报错', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log('\n' + (fail ? '存在失败  ' : '全部通过  ') + pass + '/' + (pass + fail));
await b.close();
process.exit(fail ? 1 : 0);
