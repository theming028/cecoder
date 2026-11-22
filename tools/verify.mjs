/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = 'file:///' + BASE + '/cecoder-home.html';

// [selector, index, expected left, top, width, height] —— 取自 MasterGo DSL 绝对坐标（1440x900）
const cases = [
  ['.panel', 0, 8, 48, 1424, 852],
  ['.tb-traffic', 0, 16, 18, 52, 12],
  ['.tb-ws-btn', 0, 88, 8, 178, 32],
  ['.tb-ws-avatar', 0, 94, 14, 20, 20],
  ['.tb-ws-name', 0, 122, 13, 122, 22],
  ['.tb-seg', 0, 570, 8, 300, 32],
  ['.seg-item.is-active', 0, 572, 10, 120, 28],   // 第 7 轮：radio-button 120/88/88，无间距
  ['.seg-item', 1, 692, 10, 88, 28],
  ['.seg-item', 2, 780, 10, 88, 28],
  ['.seg-div', 0, 779.5, 16, 1, 16],
  ['.tb-btn', 0, 1252, 8, 100, 32],
  ['.tb-btn', 1, 1360, 8, 72, 32],
  ['.menu-btn', 0, 16, 56, 28, 28],
  ['.hero-title', 0, 290, 198, 860, 32],
  ['.hero-sub', 0, 290, 238, 718, 22],
  ['.scene', 0, 290, 284, 860, 80],
  ['.scene-add', 0, 306, 300, 48, 48],
  ['.scene-title', 0, 366, 300, null, 24],
  ['.scene-desc', 0, 366, 328, null, 20],
  ['.toolbar', 0, 290, 660, 860, 32],
  /* 第 6 轮：图标改为仅选中态出现，默认未选中 → 48 宽，后续 chip 整体左移 18 */
  ['.chip', 0, 340, 660, 48, 32],
  ['.chip', 1, 392, 660, 48, 32],
  ['.chip', 5, 600, 660, 48, 32],
  ['.tb-div', 0, 664, 666, 1, 20],
  ['.chip', 6, 744, 660, 76, 32],
  ['.chip-new', 0, 1064, 660, 64, 32],
  ['.c-card', 0, 290, 704, 860, 128],
  ['.c-input', 0, 302, 716, 836, 46],
  ['.c-attach', 0, 302, 788, 32, 32],
  ['.c-pill.c-perm', 0, 342, 788, 114, 32],
  ['.c-model', 0, 939, 788, 159, 32],
  ['.c-send', 0, 1106, 788, 32, 32],
  ['.c-env', 0, 308, 838, 80, 28],
  ['.c-foot-div', 0, 396, 844, 1, 16],
  ['.c-env', 1, 404, 838, 108, 28],
  ['.c-hint', 0, 956, 843, null, 16],   /* 第 11 轮：left:663 硬编码改成贴右内边距 18，整体左移 15 */
  ['.version-mark', 0, 671, 880, 66, 12],
  ['.version-txt', 0, 745, 878, 25, 12]   /* 第 11 轮：内容列变滚动容器后有 2px 的取整差 */,
  ['.float', 0, 1352, 812, 56, 56],
];

const KILL_ANIM = `
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important;
    transition: none !important;
  }
`;

const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });

async function run(width, height) {
  const p = await b.newPage();
  await p.setViewport({ width, height, deviceScaleFactor: 1 });
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await p.addStyleTag({ content: KILL_ANIM });
  /* 第 11 轮：产品默认内容列 = 50%（1440 下 711）。本脚本校验的是「稿件 860 宽」下的
     像素落点，所以固定回 860，否则所有绝对坐标都会按比例失效。 */
  await p.addStyleTag({ content: '.stage{width:860px !important}' });
  await new Promise(r => setTimeout(r, 150));
  const res = await p.evaluate((cases) => {
    const out = [];
    for (const [sel, idx, L, T, W, H] of cases) {
      const el = document.querySelectorAll(sel)[idx];
      if (!el) { out.push({ sel, idx, err: 'not found' }); continue; }
      const r = el.getBoundingClientRect();
      const d = {
        dl: +(r.left - L).toFixed(1), dt: +(r.top - T).toFixed(1),
        dw: W == null ? null : +(r.width - W).toFixed(1),
        dh: H == null ? null : +(r.height - H).toFixed(1),
      };
      const ok = Math.abs(d.dl) <= 1 && Math.abs(d.dt) <= 1 && (d.dw == null || Math.abs(d.dw) <= 1) && (d.dh == null || Math.abs(d.dh) <= 1);
      out.push({ sel: sel + '#' + idx, ok, want: [L, T, W, H], got: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], d });
    }
    return out;
  }, cases);
  await p.close();
  return res;
}

const out = await run(1440, 900);
let bad = 0;
for (const r of out) {
  if (r.err) { console.log('✗ ' + r.sel + ' ' + r.err); bad++; continue; }
  if (!r.ok) bad++;
  console.log((r.ok ? '✓ ' : '✗ ') + r.sel.padEnd(22) + 'want ' + JSON.stringify(r.want) + ' got ' + JSON.stringify(r.got) + (r.ok ? '' : ' Δ ' + JSON.stringify(r.d)));
}
console.log('\n1440x900：' + (out.length - bad) + '/' + out.length + ' 命中（容差 1px）');

// ---- 自适应检查：换几种窗口尺寸，看是否无横向溢出、内容仍居中、底部锚定 ----
console.log('\n自适应检查：');
const p = await b.newPage();
for (const [w, h] of [[1920, 1080], [1600, 900], [1280, 800], [1024, 768], [960, 700]]) {
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await p.addStyleTag({ content: KILL_ANIM });
  /* 第 11 轮：产品默认内容列 = 50%（1440 下 711）。本脚本校验的是「稿件 860 宽」下的
     像素落点，所以固定回 860，否则所有绝对坐标都会按比例失效。 */
  await p.addStyleTag({ content: '.stage{width:860px !important}' });
  await new Promise(r => setTimeout(r, 120));
  const m = await p.evaluate(() => {
    const q = s => document.querySelector(s).getBoundingClientRect();
    const card = q('.c-card'), scene = q('.scene'), panel = q('.panel'), ver = q('.version-mark'), fab = q('.float');
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      panel: [Math.round(panel.left), Math.round(panel.width)],
      gapCard: Math.round(panel.right - card.right),
      sceneW: Math.round(scene.width),
      sceneTop: Math.round(scene.top),
      verBottom: Math.round(window.innerHeight - ver.bottom),
      fabGap: [Math.round(window.innerWidth - fab.right), Math.round(window.innerHeight - fab.bottom)],
    };
  });
  console.log(`  ${w}x${h}  panel=${m.panel}  卡右隙=${m.gapCard}  sceneW=${m.sceneW} sceneTop=${m.sceneTop}  版本底隙=${m.verBottom}  悬浮球隙=${m.fabGap}  横向溢出=${m.hScroll}`);
}
await b.close();
