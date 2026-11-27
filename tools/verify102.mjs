/* 第 102 轮验收：
   ① 点「截图」→ 画板页面被克隆成缩略图，从画板位置沿抛物线飞进右栏 #aiAtts
   ② 落地后 ai-atts 多一个 .ai-att.is-shot（内含等比缩小的 .ud-board-doc 克隆，id 全部剥掉）
   ③ 飞行轨迹确实是抛物线（中途高于两端），x 单调走向落点，飞行中逐步缩小
   ④ 画板原节点不被污染（计数不变、id 还在）
   ⑤ 截图附件照旧可单独删除；点截图键不再弹「（稿待补）」 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);

/* ---------- ① 初始 & 起跳 ---------- */
const A0 = await p.evaluate(() => ({
  atts: document.querySelectorAll('#aiAtts .ai-att').length,
  shotBtn: !!document.getElementById('udShot'),
  boardItems: document.querySelectorAll('#udBoard .kb-item').length
}));
ok('A1 初始 2 个附件、截图键带 id', A0.atts === 2 && A0.shotBtn, JSON.stringify(A0));

/* 采样飞行轨迹（每 40ms 一次，连采 1s） */
const track = await p.evaluate(async () => {
  const out = [];
  document.getElementById('udShot').click();
  const t0 = performance.now();
  const br = document.getElementById('udBoard').getBoundingClientRect();
  out.push({ t: 0, x: br.left, y: br.top, w: br.width, h: br.height, fly: !!document.querySelector('.ud-fly') });
  while (performance.now() - t0 < 1000) {
    await new Promise(r => setTimeout(r, 40));
    const f = document.querySelector('.ud-fly');
    if (f) {
      const r = f.getBoundingClientRect();
      out.push({ t: Math.round(performance.now() - t0), x: r.left, y: r.top, w: r.width, h: r.height, fly: true });
    }
  }
  return out;
});
const flyFrames = track.filter(f => f.fly);
ok('B1 截图后出现飞行中的缩略图', flyFrames.length >= 8, flyFrames.length);
ok('B2 飞行途中尺寸逐步缩小', flyFrames.length > 3 && flyFrames[flyFrames.length - 1].w < flyFrames[0].w * 0.5, JSON.stringify([Math.round(flyFrames[0] && flyFrames[0].w), Math.round(flyFrames[flyFrames.length - 1].w)]));

const endInfo = await p.evaluate(() => {
  const att = document.querySelector('#aiAtts .ai-att.is-shot');
  const r = att ? att.getBoundingClientRect() : null;
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
});
const startY = track[0].y, startX = track[0].x;
const endY = endInfo.y, endX = endInfo.x;
const minY = Math.min.apply(null, flyFrames.map(f => f.y));
const straightMin = Math.min(startY, endY);
ok('B3 轨迹是抛物线：中途明显高于两端连线', minY < straightMin - 30, JSON.stringify({ minY: Math.round(minY), startY: Math.round(startY), endY: Math.round(endY) }));
ok('B4 水平方向单调走向落点', (endX > startX ? flyFrames[flyFrames.length - 1].x > flyFrames[0].x : flyFrames[flyFrames.length - 1].x < flyFrames[0].x), JSON.stringify([Math.round(flyFrames[0].x), Math.round(flyFrames[flyFrames.length - 1].x), Math.round(endX)]));

/* ---------- ② 落地结果 ---------- */
await wait(500);
const C = await p.evaluate(() => {
  const atts = document.getElementById('aiAtts');
  const list = [...atts.querySelectorAll('.ai-att')];
  const shot = atts.querySelector('.ai-att.is-shot');
  const clone = shot ? shot.querySelector('.ud-board-doc') : null;
  const thumb = atts.querySelector('.ai-att.is-shot .ud-thumb-in');
  const fly = document.querySelector('.ud-fly');
  return {
    n: list.length,
    isLast: list[list.length - 1] === shot,
    hidden: atts.hidden,
    ghost: shot ? shot.classList.contains('is-ghost') : null,
    opacity: shot ? getComputedStyle(shot).opacity : '',
    hasClone: !!clone,
    cloneItems: clone ? clone.querySelectorAll('.kb-item').length : 0,
    cloneIds: clone ? clone.querySelectorAll('[id]').length : -1,
    cloneScale: thumb ? getComputedStyle(thumb).transform : '',
    thumbW: thumb ? Math.round(thumb.getBoundingClientRect().width) : 0,
    thumbH: thumb ? Math.round(thumb.getBoundingClientRect().height) : 0,
    chipW: shot ? Math.round(shot.getBoundingClientRect().width) : 0,
    flyLeft: !!fly,
    xBtn: !!(shot && shot.querySelector('.ai-att-x'))
  };
});
ok('C1 ai-atts 变成 3 个附件且不是隐藏态', C.n === 3 && C.hidden === false, JSON.stringify([C.n, C.hidden]));
ok('C2 新附件是截图件、已淡入（无 ghost）', C.isLast && C.ghost === false && C.opacity === '1', JSON.stringify([C.isLast, C.ghost, C.opacity]));
ok('C3 截图里是画板页面的克隆（会话列表 11 条一起带过来）', C.hasClone && C.cloneItems === 11, C.cloneItems);
ok('C4 克隆里没有重复 id（不与画板原节点冲突）', C.cloneIds === 0, C.cloneIds);
ok('C5 缩略图按 44/1440 等比缩（屏幕上 44×28）', /matrix\(0?\.0\d+/.test(C.cloneScale) && C.thumbW === 44 && C.thumbH === 28, JSON.stringify([C.cloneScale, C.thumbW, C.thumbH]));
ok('C6 飞行元素已移除、附件是 56×56 槽位', !C.flyLeft && C.chipW === 56, JSON.stringify([C.flyLeft, C.chipW]));
ok('C7 截图件带自己的 × 删除键', C.xBtn, C.xBtn);

/* ---------- ④ 画板原节点未被污染 ---------- */
const D = await p.evaluate(() => ({
  items: document.querySelectorAll('#udBoard .kb-item').length,
  boardId: !!document.getElementById('udBoard'),
  boardDoc: document.querySelectorAll('#udBoard > .ud-board-doc').length,
  toasts: [...document.querySelectorAll('.semi-toast')].map(e => e.textContent)
}));
ok('D1 画板原节点计数不变、id 仍在', D.items === 11 && D.boardId && D.boardDoc === 1, JSON.stringify(D));
ok('D2 点截图不弹「截图（稿待补）」占位提示', !D.toasts.some(t => /稿待补/.test(t)), JSON.stringify(D.toasts));

/* ---------- ⑤ 再来一张 + 删除 ---------- */
await p.click('#udShot'); await wait(1100);
const E = await p.evaluate(() => ({
  n: document.querySelectorAll('#aiAtts .ai-att').length,
  shots: document.querySelectorAll('#aiAtts .ai-att.is-shot').length
}));
ok('E1 连续截图各自独立（2 个截图件）', E.n === 4 && E.shots === 2, JSON.stringify(E));

/* hover 后才出现 ×，直接调 click 也可以（委托在容器上） */
const E2 = await p.evaluate(() => {
  const shot = document.querySelector('#aiAtts .ai-att.is-shot');
  shot.querySelector('.ai-att-x').click();
  const atts = document.getElementById('aiAtts');
  return {
    n: atts.querySelectorAll('.ai-att').length,
    shots: atts.querySelectorAll('.ai-att.is-shot').length,
    toast: [...document.querySelectorAll('.semi-toast')].map(e => e.textContent).join(' | ')
  };
});
await wait(120);
const E3 = await p.evaluate(() => [...document.querySelectorAll('.semi-toast')].map(e => e.textContent).join(' | '));
ok('E2 删掉一个截图件后剩 3 个附件 / 1 个截图件', E2.n === 3 && E2.shots === 1, JSON.stringify(E2));
ok('E3 删除提示区分截图（「已移除截图」）', /已移除截图/.test(E2.toast + E3), E2.toast + ' / ' + E3);

ok('F1 无 JS 报错', p.__e.length === 0, p.__e.slice(0, 3).join(' | '));

await b.close();
console.log('\n第 102 轮：' + pass + ' 通过 / ' + fail.length + ' 失败');
fail.forEach(f => console.log('  ✗ ' + f));
process.exit(fail.length ? 1 : 0);
