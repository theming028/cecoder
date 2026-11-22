/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({
  executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  headless: 'new', args: ['--force-device-scale-factor=1']
});
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(w = 1440, h = 900, dw = 320, open = true) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  return p;
}

/* 第 30 轮：会话流已拆到独立页面 cecoder-session.html，本段由 verify25 覆盖 */

/* ========== 3 录音条可拖动 ========== */
{
  const p = await page(1440, 900, 320, false);
  const f = await (await p.$('.float')).boundingBox();
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(240);
  await p.evaluate(() => [...document.querySelectorAll('#fabMenu .wd-menu-item')][1].click());
  await wait(600);
  const before = await (await p.$('.float')).boundingBox();
  await p.mouse.move(before.x + 100, before.y + 28);
  await p.mouse.down();
  await p.mouse.move(560, 300, { steps: 12 });
  await p.mouse.up();
  await wait(400);
  const after = await p.evaluate(() => {
    const el = document.querySelector('.float');
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: el.offsetWidth, h: el.offsetHeight,
      recording: el.classList.contains('is-recording'), cls: el.className };
  });
  ok('3 录音条可被拖走', after.x < before.x - 300 && after.y < before.y - 300, `${Math.round(before.x)},${Math.round(before.y)} → ${after.x},${after.y}`);
  ok('3 拖动后仍是 212x56 且录音中', after.w === 212 && after.h === 56 && after.recording, `${after.w}x${after.h} ${after.recording}`);
  ok('3 拖动不会误判为停止', after.recording && !/is-drag/.test(after.cls), after.cls);
  await p.mouse.click(after.x + after.w / 2, after.y + 28);
  await wait(500);
  ok('3 拖动后单击仍能停止', await p.evaluate(() => document.querySelector('.float').offsetWidth === 56), '');
  ok('3 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 4 收起图标 ========== */
{
  const p = await page();
  const d = await p.evaluate(() => {
    const svg = document.querySelector('.wd-collapse svg');
    const rect = svg.querySelector('rect').getBoundingClientRect();
    const path = svg.querySelector('path').getBoundingClientRect();
    const btn = svg.closest('.ico').getBoundingClientRect();   /* 以 14x14 图标盒为基准 */
    /* 第 29 轮：SVG 的 getBoundingClientRect 不含 stroke，联集要按半线宽外扩到可见边缘 */
    const sw = parseFloat(getComputedStyle(svg.querySelector('path')).strokeWidth) || 1.1;
    const pad = sw / 2;
    const union = { l: Math.min(rect.left, path.left - pad), r: Math.max(rect.right, path.right + pad),
                    t: Math.min(rect.top, path.top - pad), b: Math.max(rect.bottom, path.bottom + pad) };
    return { barLeft: Math.round(rect.left - btn.left), chevLeft: Math.round(path.left - btn.left),
      unionW: +(union.r - union.l).toFixed(2), unionH: +(union.b - union.t).toFixed(2),
      offX: +(union.l - btn.left).toFixed(1), offY: +(union.t - btn.top).toFixed(1),
      stroke: getComputedStyle(svg.querySelector('path')).strokeWidth,
      barH: +rect.height.toFixed(2), barW: +rect.width.toFixed(2) };
  });
  /* 第 34 轮：回到 14 画布（与「排序」同尺寸），绘制满版 */
  ok('4 图形整体 10.5x9.4（14 网格满版）', Math.abs(d.unionW - 10.53) < 0.6 && Math.abs(d.unionH - 9.4) < 0.6, d.unionW + 'x' + d.unionH);
  ok('4 在 14 图标里居中偏 (2.3,2.3)', Math.abs(d.offX - 2.3) < 0.6 && Math.abs(d.offY - 2.3) < 0.6, d.offX + ',' + d.offY);
  ok('4 竖条在左、箭头在右（箭头指向左）', d.barLeft < d.chevLeft, d.barLeft + ' / ' + d.chevLeft);
  ok('4 竖条 1.4x9.4', Math.abs(d.barW - 1.4) < 0.1 && Math.abs(d.barH - 9.4) < 0.15, d.barW + 'x' + d.barH);
  ok('4 描边 1.25', parseFloat(d.stroke) === 1.25, d.stroke);
  await p.close();
}

/* ========== 5 任务卡标题 + Nutstore 空态 ========== */
{
  const p = await page();
  /* 默认折叠的分组全展开，标题不能再是 0 高 */
  await p.evaluate(() => document.querySelectorAll('#wdViewTask .wd-grp-head').forEach(h => {
    if (h.getAttribute('aria-expanded') === 'false') h.click();
  }));
  await wait(600);
  const d = await p.evaluate(() => {
    const titles = [...document.querySelectorAll('#wdViewTask .wd-card-title')].map(t => ({
      h: Math.round(t.getBoundingClientRect().height), txt: t.textContent.slice(0, 6)
    }));
    const sub = document.getElementById('wdSub4');
    const num = document.getElementById('wdHead4').querySelector('.wd-num');
    const empty = sub.querySelector('.wd-empty');
    return {
      titles, zero: titles.filter(t => t.h === 0).length,
      nut: { cards: sub.querySelectorAll('.wd-card').length, empty: !!empty, isEmpty: sub.classList.contains('is-empty'),
        numDisp: num ? getComputedStyle(num).display : 'none',
        title: empty ? empty.querySelector('.wd-empty-title').textContent : '' }
    };
  });
  ok('5 展开后所有卡片标题都有高度', d.zero === 0, JSON.stringify(d.titles.filter(t => t.h === 0)));
  ok('5 单行标题 20 / 两行 40', d.titles.every(t => t.h === 20 || t.h === 40), JSON.stringify(d.titles.map(t => t.h)));
  ok('5 Nutstore 变成空态（无卡片）', d.nut.cards === 0 && d.nut.empty && d.nut.isEmpty, JSON.stringify(d.nut));
  ok('5 Nutstore 空态文案与计数', /还没有任务/.test(d.nut.title) && d.nut.numDisp === 'none', d.nut.title + ' / ' + d.nut.numDisp);
  await p.screenshot({ path: 'R21-sidebar.png', clip: { x: 0, y: 40, width: 340, height: 640 } });
  ok('5 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 6 添加工作目录（第 33 轮起按钮内不再有图标） ========== */
{
  const p = await page();
  const d = await p.evaluate(() => {
    const b = document.querySelector('.wd-adddir');
    const range = document.createRange(); range.selectNodeContents(b);
    const t = range.getBoundingClientRect(), r = b.getBoundingClientRect();
    return {
      txt: getComputedStyle(b).color,
      ico: b.querySelectorAll('.ico,svg').length,
      text: b.textContent.trim(),
      leftGap: Math.round(t.left - r.left), rightGap: Math.round(r.right - t.right)
    };
  });
  ok('6 文字为次级色 #6B6B6B', d.txt === 'rgb(107, 107, 107)', d.txt);
  ok('6 按钮内无图标', d.ico === 0 && d.text === '添加工作目录', JSON.stringify(d));
  ok('6 文字水平居中（左右余量相等）', Math.abs(d.leftGap - d.rightGap) <= 1, d.leftGap + '/' + d.rightGap);
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
