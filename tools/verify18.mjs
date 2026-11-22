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
  await wait(650);
  return p;
}

/* ========== 1 图表竖线落在绘图区内 ========== */
{
  const p = await page();
  await p.click('#scIdle').catch(() => {});
  await wait(700);
  const d = await p.evaluate(() => {
    const svg = document.querySelector('.sc-chart > svg');
    const cr = document.querySelector('.sc-chart').getBoundingClientRect();
    const g = svg.querySelector('g[transform="translate(20,40)"]');
    const verticals = g ? [...g.querySelectorAll('path')] : [];
    const boxes = verticals.map(el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left - cr.left), y: Math.round(r.top - cr.top), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; });
    return { hasGroup: !!g, n: verticals.length, boxes };
  });
  ok('1 竖线被放进 translate(20,40) 的组里', d.hasGroup && d.n === 7, JSON.stringify(d.n));
  ok('1 七条竖线都在绘图区（y 40~76）', d.boxes.every(b => b.y === 40 && Math.abs(b.h - 36) < 0.6), JSON.stringify(d.boxes));
  ok('1 竖线横向落在 x 20~180', d.boxes.every(b => b.x >= 20 && b.x <= 181), JSON.stringify(d.boxes.map(b => b.x)));
  ok('1 竖线是 1px 细线', d.boxes.every(b => b.w <= 1.1), JSON.stringify(d.boxes.map(b => b.w)));
  const r = await (await p.$('.sc-chart')).boundingBox();
  await p.screenshot({ path: 'R18-chart2.png', clip: { x: Math.round(r.x) - 2, y: Math.round(r.y) - 2, width: Math.round(r.width) + 4, height: Math.round(r.height) + 4 } });
  await p.close();
}

/* ========== 2 空态动作链接不折行 ========== */
{
  const p = await page();
  /* 第 20 轮：AI Native Factory 默认收起，先展开再量 */
  await p.evaluate(() => { const h = document.getElementById('wdHead5'); if (h && h.getAttribute('aria-expanded') === 'false') h.click(); });
  await wait(300);
  const d = await p.evaluate(() => {
    const em = [...document.querySelectorAll('#wdViewTask .wd-empty')].find(x => x.getBoundingClientRect().width > 0);
    const acts = em.querySelector('.wd-empty-acts');
    const btns = [...acts.querySelectorAll('button')];
    const tops = btns.map(b => Math.round(b.getBoundingClientRect().top));
    return { emW: Math.round(em.getBoundingClientRect().width), actsH: Math.round(acts.getBoundingClientRect().height),
      oneRow: new Set(tops).size === 1, n: btns.length, ws: getComputedStyle(acts).whiteSpace };
  });
  ok('2 两个动作在同一行（不折行）', d.oneRow && d.actsH === 20, JSON.stringify(d));
  ok('2 容器按内容撑宽（>132）', d.emW > 132, String(d.emW));
  await p.close();
}

/* ========== 3 空分组的计数不显示 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const d = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-grp')].map(g => ({
    name: g.querySelector('.wd-grp-name').textContent,
    cards: g.querySelectorAll('.wd-sess-card').length,
    num: (g.querySelector('.wd-num') || {}).textContent || null,
    numDisp: g.querySelector('.wd-num') ? getComputedStyle(g.querySelector('.wd-num')).display : 'none'
  })));
  ok('3 空分组（无卡）计数隐藏', d.filter(g => g.cards === 0).every(g => g.numDisp === 'none'), JSON.stringify(d));
  ok('3 有卡分组计数仍显示', d.filter(g => g.cards > 0).every(g => g.numDisp !== 'none'), '');
  await p.close();
}

/* ========== 4 环境下拉只有两项 ========== */
{
  const p = await page();
  const d = await p.evaluate(() => {
    const dd = document.querySelector('.cds-dd[data-dd="env"]');
    dd.querySelector('.c-env').click();
    return { items: [...dd.querySelectorAll('.semi-select-option')].map(x => x.textContent),
      display: getComputedStyle(dd.querySelector('.semi-select-option-list-wrapper')).display };
  });
  ok('4 环境菜单 = 本地 / 云环境', d.items.join('|') === '本地|云环境', d.items.join('|'));
  ok('4 菜单可展开', d.display === 'flex', d.display);
  await p.close();
}

/* ========== 5 会话卡「更多」与左侧标签间距 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const card = (await p.$$('#wdViewSession .wd-sess-card'))[1];
  const cb = await card.boundingBox();
  await p.mouse.move(cb.x + 40, cb.y + cb.height / 2);
  await wait(320);
  const d = await p.evaluate(() => {
    const card = [...document.querySelectorAll('#wdViewSession .wd-sess-card')][1];
    const chip = card.querySelector('.wd-chip');
    const more = card.querySelector('.wd-more');
    return { gap: Math.round(more.getBoundingClientRect().left - chip.getBoundingClientRect().right),
      chip: chip.textContent, w: getComputedStyle(more).width };
  });
  ok('5 标签到「更多」4px（同任务卡）', d.gap === 4, String(d.gap));
  ok('5 「更多」已展开 20', d.w === '20px', d.w);

  /* 对照：任务卡也是 4 */
  await p.click('[data-wd-tab="任务"]');
  await wait(320);
  const t = (await p.$$('#wdViewTask .wd-card'))[1];
  const tb = await t.boundingBox();
  await p.mouse.move(tb.x + 60, tb.y + 20);
  await wait(320);
  const dt = await p.evaluate(() => {
    const card = [...document.querySelectorAll('#wdViewTask .wd-card')][1];
    const chip = card.querySelector('.wd-chip');
    const more = card.querySelector('.wd-more');
    return Math.round(more.getBoundingClientRect().left - chip.getBoundingClientRect().right);
  });
  ok('5 任务卡同为 4px', dt === 4, String(dt));
  await p.close();
}

/* ========== 7 同步弹窗纵向自适应 + 上下固定 40 ========== */
{
  for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080], [1024, 720]]) {
    const p = await page(w, h);
    await p.evaluate(() => {
      const m = document.getElementById('syncModal');
      m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    });
    await wait(300);
    const d = await p.evaluate(() => {
      const pn = document.querySelector('.panel').getBoundingClientRect();
      const cm = document.querySelector('#syncModal .cm-panel').getBoundingClientRect();
      return { top: Math.round(cm.top - pn.top), bottom: Math.round(pn.bottom - cm.bottom),
        h: Math.round(cm.height), pnH: Math.round(pn.height), w: Math.round(cm.width) };
    });
    ok(`7 ${w}x${h} 顶部间距 40`, d.top === 40, JSON.stringify(d));
    ok(`7 ${w}x${h} 底部间距 40`, d.bottom === 40, JSON.stringify(d));
    ok(`7 ${w}x${h} 高度 = 面板 - 80`, d.h === d.pnH - 80, JSON.stringify(d));
    await p.close();
  }
}

/* ========== 8 时间轴连续 + 资产/工序留空 ========== */
{
  const p = await page();
  await p.evaluate(() => {
    const m = document.getElementById('syncModal');
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
  });
  await wait(300);
  await p.evaluate(() => document.querySelector('[data-cm-tab="log"]').click());
  await wait(200);
  const d = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.cm-log-row')];
    const info = rows.map((r, i) => {
      const rr = r.getBoundingClientRect();
      const dot = r.querySelector('.cm-log-dot').getBoundingClientRect();
      const cs = getComputedStyle(r, '::before');
      const lineTop = rr.top + parseFloat(cs.top || 0);
      const lineH = cs.height === '100%' ? rr.height : parseFloat(cs.height);
      return { dotMid: +(dot.top + dot.height / 2 - rr.top).toFixed(1), lineTop: +(lineTop - rr.top).toFixed(1),
        lineH: +lineH.toFixed(1), rowH: +rr.height.toFixed(1), hasLine: cs.content !== 'none' && cs.width !== 'auto' };
    });
    /* 圆点是否压住线（同一 x）；相邻行线的终点是否等于下一行圆点中心 */
    const segs = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const a = rows[i].getBoundingClientRect(), b2 = rows[i + 1].querySelector('.cm-log-dot').getBoundingClientRect();
      const cs = getComputedStyle(rows[i], '::before');
      const end = a.top + parseFloat(cs.top) + (cs.height === '100%' ? a.height : parseFloat(cs.height));
      segs.push(+(end - (b2.top + b2.height / 2)).toFixed(1));
    }
    const asset = document.querySelector('[data-cm-pane="asset"]');
    const flow = document.querySelector('[data-cm-pane="flow"]');
    return { info, segs, assetKids: asset.children.length, flowKids: flow.children.length,
      assetText: asset.textContent.trim(), flowText: flow.textContent.trim() };
  });
  ok('8 每一行都有从圆点中心向下的轴线', d.info.slice(0, -1).every(x => Math.abs(x.lineTop - x.dotMid) < 0.6 && x.hasLine), JSON.stringify(d.info));
  ok('8 轴线终点正好接下一行圆点中心（无缝）', d.segs.every(v => Math.abs(v) < 0.8), JSON.stringify(d.segs));
  ok('8 最后一行不画线', d.info[d.info.length - 1].lineH === 0 || d.info[d.info.length - 1].hasLine === false, JSON.stringify(d.info.slice(-1)));
  ok('8 资产页签留空', d.assetKids === 0 && d.assetText === '', d.assetText);
  ok('8 工序页签留空', d.flowKids === 0 && d.flowText === '', d.flowText.slice(0, 20));
  const cmr = await (await p.$('#syncModal .cm-panel')).boundingBox();
  await p.screenshot({ path: 'R18-modal.png', clip: { x: Math.round(cmr.x), y: Math.round(cmr.y), width: Math.round(cmr.width), height: Math.round(cmr.height) } });
  await p.close();
}

/* ========== 9 会话「更多」菜单项 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const card = (await p.$$('#wdViewSession .wd-sess-card'))[1];
  const cb = await card.boundingBox();
  await p.mouse.move(cb.x + 40, cb.y + cb.height / 2);
  await wait(250);
  await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')][1].querySelector('.wd-more').click());
  await wait(250);
  const d = await p.evaluate(() => {
    const m = document.getElementById('wdSessMenu');
    const items = [...m.querySelectorAll('.wd-menu-item')].map(x => x.textContent);
    const div = m.querySelector('.wd-menu-div');
    const divR = div ? div.getBoundingClientRect() : null;
    const logBtn = [...m.querySelectorAll('.wd-menu-item')].find(x => x.textContent === '会话日志');
    const delBtn = [...m.querySelectorAll('.wd-menu-item')].find(x => x.textContent === '删除');
    return { hidden: m.hidden, items, divH: divR ? Math.round(divR.height) : 0,
      divBetween: !!(divR && logBtn && delBtn && divR.top >= logBtn.getBoundingClientRect().bottom - 0.5 && divR.bottom <= delBtn.getBoundingClientRect().top + 0.5),
      dangerColor: getComputedStyle(delBtn).color,
      cardMenuHidden: document.getElementById('wdCardMenu').hidden,
      title: m.dataset.title };
  });
  ok('9 会话菜单项 = 置顶/重命名/归档/会话日志/删除', d.items.join('|') === '置顶|重命名|归档|会话日志|删除', d.items.join('|'));
  ok('9 分隔线在会话日志与删除之间', d.divH === 1 && d.divBetween, d.divH + ' ' + d.divBetween);
  ok('9 删除为危险色', /245, 63, 63/.test(d.dangerColor), d.dangerColor);
  ok('9 打开时任务菜单不显示', d.cardMenuHidden, '');
  ok('9 菜单记住了会话标题', d.title === '业务需求，生成交付状态', d.title);
  /* 点一项 → toast + 关闭 */
  await p.evaluate(() => [...document.querySelectorAll('#wdSessMenu .wd-menu-item')][0].click());
  await wait(300);
  const t = await p.evaluate(() => ({ toast: (document.querySelector('.semi-toast') || {}).textContent, hidden: document.getElementById('wdSessMenu').hidden }));
  ok('9 点「置顶」→ toast 且菜单关闭', /置顶/.test(t.toast || '') && t.hidden, JSON.stringify(t));

  /* 任务卡仍是三项 */
  await p.click('[data-wd-tab="任务"]');
  await wait(300);
  const tc = (await p.$$('#wdViewTask .wd-card'))[1];
  const tcb = await tc.boundingBox();
  await p.mouse.move(tcb.x + 60, tcb.y + 20);
  await wait(250);
  await p.evaluate(() => [...document.querySelectorAll('#wdViewTask .wd-card')][1].querySelector('.wd-more').click());
  await wait(250);
  const tm = await p.evaluate(() => ({
    items: [...document.querySelectorAll('#wdCardMenu .wd-menu-item')].map(x => x.textContent),
    sessHidden: document.getElementById('wdSessMenu').hidden
  }));
  ok('9 任务卡菜单仍为三项', tm.items.join('|') === '查看任务详情|编辑|删除', tm.items.join('|'));
  ok('9 任务卡不弹会话菜单', tm.sessHidden, '');
  ok('9 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
