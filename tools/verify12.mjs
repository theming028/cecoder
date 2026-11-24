/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(w = 1440, h = 900, openDrawer = true) {
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), openDrawer ? { open: true, w: 320 } : { open: false, w: 320 });
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await wait(800);
  /* 第 41 轮：首页不再认 open:false，要折叠得点一次收起 */
  if (!openDrawer && await p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'))) { await p.click('.wd-collapse'); await wait(480); }
  p.__errs = errs;
  return p;
}

/* ========== 1 任务卡「更多操作」下拉 ========== */
{
  const p = await page(1440, 900, true);
  const btn = await p.$('.wd-card .wd-more');
  const cardBox = await (await p.$('.wd-card')).boundingBox();
  /* 第 13 轮：more 默认 width 0，必须先 hover 卡片让它展开，再取盒子 */
  await p.mouse.move(cardBox.x + 60, cardBox.y + 20);
  await wait(320);
  const bb = await btn.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await wait(250);
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await wait(260);
  const st = await p.evaluate(() => {
    const m = document.getElementById('wdCardMenu');
    const r = m.getBoundingClientRect();
    return {
      hidden: m.hidden,
      items: [...m.querySelectorAll('.wd-menu-item')].map(x => x.textContent.trim()),
      pos: getComputedStyle(m).position,
      z: getComputedStyle(m).zIndex,
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      btnOpen: document.querySelector('.wd-card .wd-more.is-open') !== null,
      expanded: document.querySelector('.wd-card .wd-more').getAttribute('aria-expanded'),
      cardSel: document.querySelector('.wd-card').classList.contains('is-sel')
    };
  });
  ok('1 菜单展开', st.hidden === false, JSON.stringify(st));
  ok('1 三项文案', JSON.stringify(st.items) === JSON.stringify(['查看任务详情', '编辑', '删除']), JSON.stringify(st.items));
  ok('1 fixed 定位', st.pos === 'fixed', st.pos);
  ok('1 菜单在视口内', st.rect[0] >= 0 && st.rect[1] >= 0 && st.rect[0] + st.rect[2] <= 1440, JSON.stringify(st.rect));
  ok('1 按钮保持高亮', st.btnOpen && st.expanded === 'true');
  ok('1 点更多不选中卡片', st.cardSel === false);
  ok('1 菜单不被抽屉裁切', st.rect[2] > 100 && st.rect[3] >= 100, JSON.stringify(st.rect));

  const item = await p.$('#wdCardMenu .wd-menu-item');
  const ib = await item.boundingBox();
  await p.mouse.click(ib.x + 20, ib.y + ib.height / 2);
  await wait(220);
  const after = await p.evaluate(() => ({
    hidden: document.getElementById('wdCardMenu').hidden,
    toast: (document.querySelector('.semi-toast') || {}).textContent || '',
    expanded: document.querySelector('.wd-card .wd-more').getAttribute('aria-expanded')
  }));
  ok('1 点项后关闭', after.hidden === true);
  ok('1 点项有反馈', /查看任务详情/.test(after.toast), after.toast);
  ok('1 aria-expanded 复位', after.expanded === 'false');

  /* 点空白关闭 */
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await wait(200);
  await p.mouse.click(700, 120);
  await wait(200);
  ok('1 点外部关闭', await p.evaluate(() => document.getElementById('wdCardMenu').hidden));
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await wait(150);
  await p.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await wait(220);
  await p.screenshot({ path: 'R12-card-menu.png', captureBeyondViewport: false });
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2 待确认卡默认橙底 ========== */
{
  const p = await page(1440, 900, true);
  const c = await p.evaluate(() => {
    const card = document.querySelector('.wd-card.is-todo');
    const norm = [...document.querySelectorAll('.wd-card')].find(x => !x.classList.contains('is-todo'));
    return {
      todo: card ? getComputedStyle(card).backgroundColor : null,
      norm: getComputedStyle(norm).backgroundColor,
      chip: card ? card.querySelector('.wd-chip-todo').textContent : null
    };
  });
  ok('2 待确认卡存在', c.chip === '待确认', c.chip);
  ok('2 橙底（非白）', c.todo !== 'rgb(255, 255, 255)' && c.todo !== c.norm, c.todo + ' vs ' + c.norm);
  ok('2 橙底取值 #FFF3E8', c.todo === 'rgb(255, 243, 232)', c.todo);
  await p.screenshot({ path: 'R12-card-todo.png', clip: { x: 0, y: 180, width: 340, height: 260 } });
  await p.close();
}

/* ========== 3 全局下拉 hover 灰 + 边框灰 ========== */
{
  const p = await page(1440, 900, false);
  /* 第 43 轮：折叠态「待确认」浮标（0.45~1.4s 随机浮出、z-index 40）会压住顶栏下拉的
     第二项，导致 hover 采不到色 —— 这段只验下拉本身，先把浮标摘掉 */
  await p.evaluate(() => { const t = document.getElementById('fpTip'); if (t) t.style.display = 'none'; });
  await p.click('.tb-ws-btn');
  await wait(200);
  const d = await p.evaluate(() => {
    const list = document.querySelector('.tb-ws .semi-select-option-list-wrapper');
    const cs = getComputedStyle(list);
    return { border: cs.borderTopColor, bg: getComputedStyle(list).backgroundColor, display: cs.display };
  });
  ok('3 下拉展开', d.display !== 'none', d.display);
  ok('3 下拉边框灰度', d.border === 'rgb(229, 229, 229)', d.border);
  const li = await p.$('.tb-ws .semi-select-option:nth-child(2)');
  const lb = await li.boundingBox();
  await p.mouse.move(lb.x + 20, lb.y + lb.height / 2);
  await wait(220);
  ok('3 item hover 浅灰', (await p.evaluate(() => getComputedStyle(document.querySelector('.tb-ws .semi-select-option:nth-child(2)')).backgroundColor)) === 'rgb(244, 244, 244)',
    await p.evaluate(() => getComputedStyle(document.querySelector('.tb-ws .semi-select-option:nth-child(2)')).backgroundColor));
  await p.screenshot({ path: 'R12-dd-hover.png', clip: { x: lb.x - 10, y: lb.y - 70, width: 230, height: 190 } });
  await p.close();
}

/* ========== 4 wd-grp-name 13px ========== */
{
  const p = await page(1440, 900, true);
  const fs = await p.evaluate(() => getComputedStyle(document.querySelector('.wd-grp-name')).fontSize);
  ok('4 目录名字号 12（第 44 轮稿面 12/22）', fs === '12px', fs);
  await p.close();
}

/* ========== 5 模态在 panel 内 + 毛玻璃 ========== */
{
  const p = await page(1440, 900, true);
  await p.click('#wdSync');
  await wait(420);
  const m = await p.evaluate(() => {
    const modal = document.getElementById('syncModal');
    const mask = modal.querySelector('.cm-mask');
    const pan = modal.querySelector('.cm-panel');
    const host = document.querySelector('.panel');
    const r = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const cs = getComputedStyle(mask);
    return {
      parent: modal.parentElement.className,
      pos: getComputedStyle(modal).position,
      filter: cs.backdropFilter || cs.webkitBackdropFilter,
      maskBg: cs.backgroundColor,
      modal: r(modal), panel: r(host), dlg: r(pan),
      open: modal.classList.contains('is-open')
    };
  });
  ok('5 模态父级是 panel', /panel/.test(m.parent), m.parent);
  ok('5 绝对定位', m.pos === 'absolute', m.pos);
  ok('5 蒙层有模糊', /blur/.test(m.filter || ''), m.filter);
  ok('5 蒙层半透明', /rgba/.test(m.maskBg), m.maskBg);
  ok('5 蒙层不溢出 panel', m.modal[0] >= m.panel[0] && m.modal[1] >= m.panel[1] && m.modal[2] <= m.panel[2] && m.modal[3] <= m.panel[3],
    JSON.stringify({ modal: m.modal, panel: m.panel }));
  ok('5 弹窗在 panel 内', m.dlg[0] >= m.panel[0] && m.dlg[1] >= m.panel[1] && m.dlg[2] <= m.panel[2] && m.dlg[3] <= m.panel[3],
    JSON.stringify({ dlg: m.dlg, panel: m.panel }));
  /* 第 18 轮：改为纵向自适应 —— 高度 = 面板高 - 上下各 40 */
  ok('5 弹窗高度 = 面板 - 80', (m.dlg[3] - m.dlg[1]) === (m.panel[3] - m.panel[1]) - 80,
    (m.dlg[3] - m.dlg[1]) + ' / panel ' + (m.panel[3] - m.panel[1]));
  await p.screenshot({ path: 'R12-modal.png' });
  await p.mouse.click(m.panel[0] + 10, m.panel[1] + 10); /* 蒙层左上角（panel 内、弹窗外） */
  await wait(250);
  ok('5 点蒙层关闭', await p.evaluate(() => !document.getElementById('syncModal').classList.contains('is-open')));
  ok('5 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 6 内容列 960（第 39 轮） ========== */
for (const [w, h, open] of [[1440, 900, false], [1440, 900, true], [1366, 768, true], [1280, 800, false], [1920, 1080, false]]) {
  const p = await page(w, h, open);
  const r = await p.evaluate(() => {
    const s = document.querySelector('.stage');
    const b = s.getBoundingClientRect();
    /* 第 16 轮：stage 盒比内容宽 12px（左右 6px 内边距留给 focus 外环），内容列 = 盒宽 - 12 */
    return {
      w: Math.round(b.width - 12),
      hx: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      hOver: s.scrollWidth - s.clientWidth,
      vOver: s.scrollHeight - s.clientHeight
    };
  });
  ok(`6 ${w}${open ? '+左栏' : ''} 内容列 960`, r.w === 960, String(r.w));
  ok(`6 ${w}${open ? '+左栏' : ''} 无横向溢出`, !r.hx && r.hOver <= 1, JSON.stringify(r));
  await p.close();
}

/* ========== 7 收起图标 ========== */
{
  const p = await page(1440, 900, true);
  const ic = await p.evaluate(() => {
    const el = document.querySelector('.wd-collapse .ico svg');
    return {
      vb: el.getAttribute('viewBox'),
      paths: el.querySelectorAll('path').length,
      rects: el.querySelectorAll('rect').length,
      box: el.getBoundingClientRect().width
    };
  });
  /* 第 34 轮：回到 14 画布（与「排序」图标同尺寸），但改成满版绘制 */
  ok('7 收起图标 14 画布', ic.vb === '0 0 14 14', ic.vb);
  /* 「指向左的箭头 + 左侧竖条」结构不变 */
  ok('7 箭头 + 竖条结构', ic.paths === 1 && ic.rects === 1, JSON.stringify(ic));
  const geo = await p.evaluate(() => {
    const svg = document.querySelector('.wd-collapse .ico svg');
    const r = svg.querySelector('rect'), pa = svg.querySelector('path');
    return { rx: +r.getAttribute('x'), rw: +r.getAttribute('width'), rh: +r.getAttribute('height'),
             ry: +r.getAttribute('y'), d: pa.getAttribute('d'), sw: pa.getAttribute('stroke-width') };
  });
  /* 14 网格满版：竖条 1.4x9.4 @2.3（原 1.21x8.12 撑满画布） */
  ok('7 竖条 1.4x9.4 @2.3', Math.abs(geo.rx - 2.3) < 0.2 && Math.abs(geo.rw - 1.4) < 0.2 && Math.abs(geo.rh - 9.4) < 0.2, JSON.stringify(geo));
  ok('7 箭头在右且指向左', /^M11\.9 2\.9L7\.7 7L11\.9 11\.1$/.test(geo.d), geo.d);
  await p.screenshot({ path: 'R12-collapse.png', clip: { x: 155, y: 48, width: 320, height: 56 } });
  await p.close();
}

/* ========== 8 编辑工序：第 13 轮起点击暂不弹窗 ========== */
{
  const p = await page(1440, 900, false);
  await p.click('[data-quick="技术任务"]');
  await wait(420);
  const before = await p.evaluate(() => ({
    steps: [...document.querySelectorAll('.qf-name')].map(x => x.textContent),
    sep: document.querySelectorAll('.qf-sep').length
  }));
  await p.click('#qfEdit');
  await wait(300);
  await p.mouse.move(600, 300);
  await wait(300);
  const s = await p.evaluate(() => {
    const m = document.getElementById('qfModal');
    const qfClose = document.querySelector('.qf-icon[data-bar-close="qf"]');
    const step = document.querySelector('.qf-step');
    const no = step.querySelector('.qf-no'), nm = step.querySelector('.qf-name');
    return {
      open: m.classList.contains('is-open'),
      steps: [...document.querySelectorAll('.qf-name')].map(x => x.textContent),
      editColor: getComputedStyle(document.getElementById('qfEdit')).color,
      closeColor: getComputedStyle(qfClose).color,
      sep: document.querySelectorAll('.qf-sep').length,
      gap: +(nm.getBoundingClientRect().left - no.getBoundingClientRect().right).toFixed(1),
      barEdit: document.querySelector('.qf-bar').classList.contains('is-edit'),
      editable: !!document.querySelector('.qf-name[contenteditable]')
    };
  });
  ok('8 点编辑图标不弹窗', s.open === false);
  ok('8 工序列表保持不变', JSON.stringify(s.steps) === JSON.stringify(before.steps), JSON.stringify(s.steps));
  ok('8 编辑与关闭图标同色', s.editColor === s.closeColor, s.editColor + ' / ' + s.closeColor);
  ok('8 图标同为三级灰', s.editColor === 'rgb(169, 169, 169)', s.editColor);
  ok('8 不再进入行内编辑态', s.barEdit === false && s.editable === false);
  ok('8 序号与工序名之间已无分隔线', s.sep === 0 && before.sep === 0, String(s.sep));
  ok('8 序号与名字间距约 5px', Math.abs(s.gap - 5) < 1.5, String(s.gap));
  await p.screenshot({ path: 'R13-qf-bar.png', captureBeyondViewport: false });
  ok('8 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
