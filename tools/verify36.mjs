/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 36 轮验收（3 条）
   1 工序步骤整体居中：放得下时左右空隙相等；放不下时贴左可滚（不裁进滚动区外）
   2 底部那条是「真实滚动条」：几何照稿（左右缩 16 / 离底 4 / 6 高）、
     默认不出现、放不下才淡入、长度 = 视口/内容、跟着 scrollLeft 走、可拖拽
   3 点「工序进度」把整条工序栏折叠：122 → 0，页签条 166 → 44，内容区 206 → 84，
     箭头翻转、aria-expanded 同步；再点复原；切走再切回自动展开
*/
import puppeteer from 'puppeteer-core';
const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const OPEN = () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); } catch (e) { } };
async function mk(w = 1440, h = 900) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(OPEN);
  await p.goto('file:///' + ROOT + '/cecoder-task.html', { waitUntil: 'load' });
  await wait(800);
  return p;
}
const M = p => p.evaluate(() => {
  const q = s => document.querySelector(s);
  const r = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const pm = q('.panel-main').getBoundingClientRect();
  const sc = q('.ts-scroll'), tr = q('.ts-track'), sb = q('.ts-prog'), th = q('.ts-prog-thumb'), bar = q('.task-steps');
  const cs = getComputedStyle(sb);
  const rel = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x - pm.x), y: Math.round(b.y - pm.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  return {
    pmW: Math.round(pm.width),
    bar: rel(bar), tabs: rel(q('.task-tabs')), stage: rel(q('.stage')),
    gapL: Math.round(tr.getBoundingClientRect().left - sc.getBoundingClientRect().left),
    gapR: Math.round(sc.getBoundingClientRect().right - tr.getBoundingClientRect().right),
    sw: sc.scrollWidth, cw: sc.clientWidth, sl: Math.round(sc.scrollLeft),
    sb: { on: sb.classList.contains('is-on'), op: cs.opacity, pe: cs.pointerEvents, pos: cs.position, l: cs.left, rt: cs.right, bt: cs.bottom, h: cs.height, rad: cs.borderRadius, rel: rel(sb) },
    th: { w: Math.round(th.getBoundingClientRect().width), h: Math.round(th.getBoundingClientRect().height), tx: getComputedStyle(th).transform, l: Math.round(th.getBoundingClientRect().left - sb.getBoundingClientRect().left), bg: getComputedStyle(th).backgroundColor, rad: getComputedStyle(th).borderRadius },
    trackW: sb.clientWidth,
    aria: q('.tt-btn[data-task-view="steps"]').getAttribute('aria-expanded'),
    caret: getComputedStyle(q('.tt-caret')).transform,
    off: q('.panel-main').classList.contains('is-steps-off'),
    links: [...document.querySelectorAll('.ts-link')].filter(l => !l.hidden).length,
  };
});

/* ========== A 居中 ========== */
{
  for (const w of [1920, 1440]) {
    const p = await mk(w);
    const d = await M(p);
    ok('A' + (w === 1920 ? '1' : '2') + ' ' + w + '：工序整体居中（左右空隙相等且 >0）',
      d.gapL === d.gapR && d.gapL > 20, d.gapL + '/' + d.gapR);
    ok('A' + (w === 1920 ? '1b' : '2b') + ' ' + w + '：放得下 → 无滚动、滚动条不出现',
      d.sw <= d.cw + 1 && d.sb.on === false && d.sb.op === '0', d.sw + '/' + d.cw + ' op=' + d.sb.op);
    await p.close();
  }
  const p = await mk(960);
  const d = await M(p);
  ok('A3 960：放不下 → 贴左不裁（左空隙 0，可滚）', d.gapL === 0 && d.sw > d.cw + 1, d.gapL + ' ' + d.sw + '/' + d.cw);
  await p.close();
}

/* ========== B 滚动条：几何 / 按需 / 比例 / 位移 / 拖拽 ========== */
{
  const p = await mk(960);
  let d = await M(p);
  ok('B1 几何照稿：左右缩 16、离底 4、6 高、全圆角', d.sb.l === '16px' && d.sb.rt === '16px' && d.sb.bt === '4px' && d.sb.h === '6px' && d.sb.rad === '6px', JSON.stringify(d.sb));
  ok('B2 放不下才出现（opacity 1、可交互）', d.sb.on === true && d.sb.op === '1' && d.sb.pe === 'auto', JSON.stringify([d.sb.on, d.sb.op, d.sb.pe]));
  const expW = Math.max(40, Math.round(d.trackW * d.cw / d.sw));
  ok('B3 滑块长度 = 视口/内容（真比例）', Math.abs(d.th.w - expW) <= 1, d.th.w + ' vs ' + expW);
  ok('B4 滑块 6 高、圆角 6、浅灰 16%', d.th.h === 6 && d.th.rad === '6px' && d.th.bg === 'rgba(0, 0, 0, 0.16)', JSON.stringify(d.th));
  /* 滚到中点：滑块位移 = (可拖距离) × (scrollLeft / 可滚距离) */
  const mid = await p.evaluate(async () => {
    const sc = document.getElementById('tkStepScroll');
    sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
    await new Promise(r => setTimeout(r, 120));
    return Math.round(sc.scrollLeft);
  });
  d = await M(p);
  const max = d.sw - d.cw, room = d.trackW - d.th.w;
  const expL = Math.round(room * mid / max);
  ok('B5 滑块跟 scrollLeft 走（中点处位移 = 可拖距离 × 已滚比例）', Math.abs(d.th.l - expL) <= 1, d.th.l + ' vs ' + expL + ' (sl=' + d.sl + ')');
  /* 拖滑块：向右拖 60px → scrollLeft 按可拖/可滚等比放大 */
  const box = await p.evaluate(() => { const r = document.querySelector('.ts-prog-thumb').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const before = d.sl;
  await p.mouse.move(box.x, box.y);
  await p.mouse.down();
  await p.mouse.move(box.x + 60, box.y, { steps: 8 });
  await p.mouse.up();
  await wait(200);
  d = await M(p);
  const expDelta = Math.round(60 * (d.sw - d.cw) / (d.trackW - d.th.w));
  ok('B6 滑块可拖（拖 60px → scrollLeft 等比推进）', Math.abs((d.sl - before) - expDelta) <= 2, (d.sl - before) + ' vs ' + expDelta);
  ok('B7 1440 起滚条隐藏后无 JS 报错', p.__e.length === 0, JSON.stringify(p.__e));
  await p.close();
}

/* ========== C 折叠 ========== */
{
  const p = await mk(1440);
  let d = await M(p);
  ok('C1 默认展开：122 / 166 / 206、箭头朝下、aria=true', d.bar.h === 122 && d.tabs.y === 166 && d.stage.y === 206 && d.aria === 'true' && d.caret === 'none', JSON.stringify([d.bar.h, d.tabs.y, d.stage.y, d.aria, d.caret]));
  await p.click('.tt-btn[data-task-view="steps"]');
  await wait(450);
  d = await M(p);
  ok('C2 点「工序进度」→ 工序栏折成 0、页签 44、内容区 84', d.off === true && d.bar.h === 0 && d.tabs.y === 44 && d.stage.y === 84, JSON.stringify([d.off, d.bar.h, d.tabs.y, d.stage.y]));
  ok('C3 折叠态：aria=false、箭头翻上来 180°、连线不再残留', d.aria === 'false' && /matrix\(-1, 0, 0, -1/.test(d.caret) && d.links === 0, d.aria + ' / ' + d.caret + ' / links=' + d.links);
  ok('C4 折叠态：滚动条一并收起', d.sb.on === false && d.sb.op === '0', JSON.stringify([d.sb.on, d.sb.op]));
  /* 切到「任务信息」再切回来 → 自动展开，不留空白 */
  await p.click('.tt-btn[data-task-view="info"]');
  await wait(120);
  await p.click('.tt-btn[data-task-view="steps"]');
  await wait(450);
  d = await M(p);
  ok('C5 切走再切回「工序进度」→ 自动展开（122 / 166 / 206）', d.off === false && d.bar.h === 122 && d.tabs.y === 166 && d.stage.y === 206 && d.aria === 'true', JSON.stringify([d.off, d.bar.h, d.tabs.y, d.stage.y]));
  ok('C6 复原后连线 8 条、无 JS 报错', d.links === 8 && p.__e.length === 0, d.links + ' / ' + JSON.stringify(p.__e));
  await p.close();
}

console.log('\n通过 ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
await b.close();
