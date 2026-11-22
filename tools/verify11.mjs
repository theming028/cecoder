/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };

/* ========== 1 更多操作只在 hover / 选中时出现 ========== */
{
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(() => localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true, w: 320 })));
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 900));
  const moreOp = () => p.evaluate(() => getComputedStyle(document.querySelector('.wd-card .wd-more')).opacity);
  const morePE = () => p.evaluate(() => getComputedStyle(document.querySelector('.wd-card .wd-more')).pointerEvents);
  ok('1 默认不显示', (await moreOp()) === '0', await moreOp());
  ok('1 默认不可点', (await morePE()) === 'none', await morePE());
  const cb = await p.evaluate(() => { const r = document.querySelector('.wd-card').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await p.mouse.move(cb[0] + cb[2] / 2, cb[1] + cb[3] / 2);
  await new Promise(r => setTimeout(r, 300));
  ok('1 hover 卡片时出现', (await moreOp()) === '1', await moreOp());
  ok('1 hover 时可点', (await morePE()) === 'auto', await morePE());
  /* 点卡片中部选中（避开 more 按钮） */
  await p.mouse.click(cb[0] + 60, cb[1] + 12);
  await new Promise(r => setTimeout(r, 250));
  ok('1 点击后进入选中态', await p.evaluate(() => document.querySelector('.wd-card').classList.contains('is-sel')));
  await p.mouse.move(900, 700);
  await new Promise(r => setTimeout(r, 320));
  ok('1 选中后即使移开鼠标仍显示', (await moreOp()) === '1', await moreOp());
  /* 取消选中 → 回到隐藏
     第 23 轮：点任务卡会打开任务详情并强制落到选中态（详情与选中联动），
     所以这里直接撤掉选中类来模拟「没有选中的卡片」 */
  await p.evaluate(() => {
    document.querySelectorAll('#wdViewTask .wd-card').forEach(c => { c.classList.remove('is-sel'); c.setAttribute('aria-pressed', 'false'); });
    const td = document.getElementById('taskDetail');
    if (td) td.classList.remove('is-open');
  });
  await p.mouse.move(900, 700);
  await new Promise(r => setTimeout(r, 320));
  ok('1 取消选中后收起', (await moreOp()) === '0', await moreOp());
  /* 第 13 轮：更多按钮不再占位 —— 默认 width 0、标签贴卡片右缘；
     hover 出现时把标签向左挤 24px（20 宽 + 4 间距） */
  const actIdle = await p.evaluate(() => {
    const card = document.querySelector('.wd-card'), chip = card.querySelector('.wd-chip'), more = card.querySelector('.wd-more');
    const cr = card.getBoundingClientRect(), mr = more.getBoundingClientRect();
    return { moreW: +mr.width.toFixed(1), chipGap: +(cr.right - chip.getBoundingClientRect().right).toFixed(1), titleDisplay: getComputedStyle(card.querySelector('.wd-card-title')).display };
  });
  ok('1 更多按钮默认不占位', actIdle.moreW === 0, JSON.stringify(actIdle));
  ok('1 标签默认贴卡片右缘（12 内边距）', Math.abs(actIdle.chipGap - 12) < 1.5, String(actIdle.chipGap));
  const cb0 = await p.evaluate(() => { const r = document.querySelector('.wd-card').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
  await p.mouse.move(cb0[0] + 60, cb0[1] + 20);
  await new Promise(r => setTimeout(r, 320));
  const actHover = await p.evaluate(() => {
    const card = document.querySelector('.wd-card'), chip = card.querySelector('.wd-chip'), more = card.querySelector('.wd-more');
    const cr = card.getBoundingClientRect(), mr = more.getBoundingClientRect();
    return { moreW: +mr.width.toFixed(1), moreRight: +(cr.right - mr.right).toFixed(1), chipGap: +(cr.right - chip.getBoundingClientRect().right).toFixed(1) };
  });
  ok('1 hover 时更多按钮展开 20px', actHover.moreW === 20, JSON.stringify(actHover));
  /* 第 17 轮：不再用 -8 负边距吃内边距，按钮占满 20 + 4 间距，标签距右 36 */
  ok('1 hover 时标签被向左挤开（净 24px，标签距右 36）', Math.abs(actHover.chipGap - 36) < 1.5, String(actHover.chipGap));
  ok('1 无报错', errs.length === 0, errs.join('|'));

  /* ========== 2 搜索框微动效 ========== */
  const sw = () => p.evaluate(() => {
    const s = document.getElementById('wdSearch'), cs = getComputedStyle(s);
    return { w: +s.getBoundingClientRect().width.toFixed(1), o: +cs.opacity, v: cs.visibility,
             dur: cs.transitionDuration, inpO: +getComputedStyle(document.getElementById('wdSearchInput')).opacity };
  });
  const s0 = await sw();
  ok('2 收起态宽 32 / 透明 / 不可见', s0.w === 32 && s0.o === 0 && s0.v === 'hidden', JSON.stringify(s0));
  ok('2 宽度有过渡', s0.dur.includes('0.26s'), s0.dur);
  await p.click('#wdSearchBtn');
  await new Promise(r => setTimeout(r, 90));
  const s1 = await sw();
  ok('2 展开有中间帧（不是硬切）', s1.w > 32 && s1.w < 400, JSON.stringify(s1));
  await new Promise(r => setTimeout(r, 340));
  const s2 = await sw();
  const full = await p.evaluate(() => document.getElementById('wdTools').clientWidth);
  ok('2 展开完成铺满整行', Math.abs(s2.w - full) < 1.5, s2.w + ' vs ' + full);
  ok('2 展开完成不透明且可见', s2.o === 1 && s2.v === 'visible', JSON.stringify(s2));
  ok('2 内容随后淡入', s2.inpO === 1, s2.inpO);
  ok('2 展开后输入框已聚焦', await p.evaluate(() => document.activeElement === document.getElementById('wdSearchInput')));
  /* 收起 */
  await p.click('#wdSearchClear');
  await new Promise(r => setTimeout(r, 70));
  const s3 = await sw();
  ok('2 收起先淡出（70ms 时透明度下降）', s3.o < 1, JSON.stringify(s3));
  await new Promise(r => setTimeout(r, 400));
  const s4 = await sw();
  ok('2 收起完成回到 32 且隐藏', s4.w === 32 && s4.v === 'hidden', JSON.stringify(s4));
  ok('2 收起后工具行恢复', await p.evaluate(() => getComputedStyle(document.querySelector('.wd-adddir')).opacity === '1'));

  /* ========== 3 低分辨率无滚动条 ========== */
  for (const [w, h] of [[1440, 900], [1440, 768], [1366, 768], [1280, 800]]) {
    await p.setViewport({ width: w, height: h });
    await new Promise(r => setTimeout(r, 450));
    const m = await p.evaluate(() => {
      const st = document.querySelector('.stage');
      return { sw: st.scrollWidth, cw: st.clientWidth, sh: st.scrollHeight, ch: st.clientHeight,
               cls: st.classList.contains('is-scroll'),
               docX: document.documentElement.scrollWidth, docW: document.documentElement.clientWidth };
    });
    ok(`3 ${w}x${h} 无横向溢出`, m.sw <= m.cw + 0.5, JSON.stringify(m));
    ok(`3 ${w}x${h} 不触发滚动条`, m.cls === false && m.sh - m.ch <= 4, JSON.stringify(m));
    ok(`3 ${w}x${h} 页面无横向滚动`, m.docX <= m.docW, m.docX + ' vs ' + m.docW);
  }

  /* ========== 4 内容列恢复固定 860（第 12 轮回滚 50% 方案） ========== */
  /* 先确保左栏收起，否则 50% 是相对被挤压后的可用宽 */
  if (await p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'))) {
    await p.click('.wd-collapse'); await new Promise(r => setTimeout(r, 700));
  }
  for (const [w, h, expect] of [[1920, 1080, 860], [1440, 900, 860], [1366, 768, 860], [1280, 800, 860]]) {
    await p.setViewport({ width: w, height: h });
    await new Promise(r => setTimeout(r, 400));
    const m = await p.evaluate(() => {
      const st = document.querySelector('.stage'), pm = document.querySelector('.panel-main');
      const r = st.getBoundingClientRect(), pr = pm.getBoundingClientRect();
      /* 第 16 轮：盒宽含左右 6px 内边距，内容列 = 盒宽 - 12 */
      return { w: +(r.width - 12).toFixed(1), pmW: +pr.width.toFixed(1),
               centered: Math.abs((r.left + r.width / 2) - (pr.left + pr.width / 2)) < 1.5 };
    });
    ok(`4 ${w} 内容列宽 ${expect}`, Math.abs(m.w - expect) < 1.5, JSON.stringify(m));
    ok(`4 ${w} 水平居中`, m.centered, JSON.stringify(m));
  }
  /* 抽屉展开（左栏）：50% 变小，但不少于最小宽度 680；且不超过可用宽 */
  await p.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 400));
  if (!(await p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open')))) {
    await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 700));
  }
  const d = await p.evaluate(() => {
    const st = document.querySelector('.stage'), pm = document.querySelector('.panel-main');
    const r = st.getBoundingClientRect(), pr = pm.getBoundingClientRect();
    return { w: +(r.width - 12).toFixed(1), pmW: +pr.width.toFixed(1), sw: st.scrollWidth, cw: st.clientWidth };
  });
  ok('4 左栏展开后内容列仍 860', Math.abs(d.w - 860) < 1.5, JSON.stringify(d));
  ok('4 左栏展开后仍不横向溢出', d.sw <= d.cw + 0.5, JSON.stringify(d));
  ok('4 左栏展开后内容列不超出可用宽', d.w <= d.pmW - 12, JSON.stringify(d));

  /* 模拟「右栏」出现（panel 是 flex，右栏与 panel-main 平分挤压），验证 50% 会跟着变 */
  const r1 = await p.evaluate(() => {
    const panel = document.querySelector('.panel');
    const rail = document.createElement('aside');
    rail.id = 'probeRail';
    rail.style.cssText = 'flex:0 0 320px;width:320px;background:#fff';
    panel.appendChild(rail);
    const st = document.querySelector('.stage'), pm = document.querySelector('.panel-main');
    const r = st.getBoundingClientRect(), pr = pm.getBoundingClientRect();
    return { w: +(r.width - 12).toFixed(1), pmW: +pr.width.toFixed(1), sw: st.scrollWidth, cw: st.clientWidth,
             inside: r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5 };
  });
  ok('4 左右栏同时出现时内容列按可用宽收缩', Math.abs(r1.w - Math.min(860, r1.pmW - 24)) < 1.5, JSON.stringify(r1));
  ok('4 左右栏同时出现时不横向溢出且不越出面板', r1.sw <= r1.cw + 0.5 && r1.inside, JSON.stringify(r1));
  /* 关掉左栏，只留右栏 */
  await p.click('.wd-collapse'); await new Promise(r => setTimeout(r, 700));
  const r2 = await p.evaluate(() => {
    const st = document.querySelector('.stage'), pm = document.querySelector('.panel-main');
    const r = st.getBoundingClientRect(), pr = pm.getBoundingClientRect();
    return { w: +(r.width - 12).toFixed(1), pmW: +pr.width.toFixed(1), sw: st.scrollWidth, cw: st.clientWidth,
             centered: Math.abs((r.left + r.width / 2) - (pr.left + pr.width / 2)) < 1.5 };
  });
  ok('4 仅右栏时内容列 860', Math.abs(r2.w - 860) < 1.5, JSON.stringify(r2));
  ok('4 仅右栏时仍居中且不横向溢出', r2.centered && r2.sw <= r2.cw + 0.5, JSON.stringify(r2));
  await p.evaluate(() => { const r = document.getElementById('probeRail'); if (r) r.remove(); });

  await p.close();
}

/* 无控制台报错 / 全局无横向滚动 */
{
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(F, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 800));
  ok('全局无控制台报错', errs.length === 0, errs.join(' | '));
  await p.close();
}
console.log('PASS', pass, '/', pass + fail.length);
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
