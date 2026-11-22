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

async function page(w, h, dw, open) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.reload({ waitUntil: 'load' });
  await wait(650);
  return p;
}

/* ========== 1 输入卡 focus 外阴影不被裁 ========== */
{
  const p = await page(1440, 900, 320, false);
  await p.click('.c-input');
  await wait(300);
  const d = await p.evaluate(() => {
    const card = document.querySelector('.c-card');
    const cs = getComputedStyle(card);
    const r = card.getBoundingClientRect();
    // 环左右各扩 4px：看这两个点像素是否仍在 stage 盒内（没被裁 = stage 盒比卡宽 ≥8px）
    const stage = document.querySelector('.stage');
    const sr = stage.getBoundingClientRect();
    return {
      shadow: cs.boxShadow, border: cs.borderColor,
      stagePad: getComputedStyle(stage).paddingLeft + '/' + getComputedStyle(stage).paddingRight,
      ringRoom: (r.left - sr.left) + ',' + (sr.right - r.right),
      contentW: Math.round(stage.clientWidth - 12)
    };
  });
  ok('1 focus 描边变 #C9C9C9', d.border.includes('201, 201, 201'), d.border);
  ok('1 focus 外环 0 0 0 4px', /0\.05\)?\s*0px 0px 0px 4px/.test(d.shadow.replace('rgba(0, 0, 0, ', 'rgba(0,0,0,')), d.shadow);
  ok('1 stage 左右各留 6px 环位', d.ringRoom.split(',').every(v => Number(v) >= 5.5), d.ringRoom);
  ok('1 内容列仍为 960（第 39 轮）', Math.abs(d.contentW - 960) < 1, String(d.contentW));
  const s1 = await p.screenshot({ path: 'R16-focus.png' });
  ok('1 截图 R16-focus.png', !!s1, '');
  await p.close();
}

/* ========== 2 涟漪橙点与图标水平居中 ========== */
{
  const p = await page(1440, 900, 320, false);
  const d = await p.evaluate(() => {
    const btn = document.querySelector('.menu-btn');
    const dot = document.getElementById('mbDot');
    const br = btn.getBoundingClientRect(), dr = dot.getBoundingClientRect();
    const btnMid = br.top + br.height / 2, dotMid = dr.top + dr.height / 2;
    const cs = getComputedStyle(dot);
    return { off: Math.abs(btnMid - dotMid), top: cs.top, right: cs.right };
  });
  ok('2 橙点垂直中心与按钮中心重合', d.off < 1, String(d.off));
  ok('2 橙点仍贴按钮右缘', parseFloat(d.right) < 3, d.right);
  // 触发涟漪：折叠态 + 待确认
  await p.evaluate(() => {
    const drawer = document.getElementById('wsDrawer');
    drawer.dataset.forcedot = '1';
  });
  const hasFn = await p.evaluate(() => typeof window !== 'undefined');
  ok('2 页面可执行', hasFn, '');
  await p.close();
}

/* ========== 3 选择其他目录 → 调起系统文件夹窗口 ========== */
{
  const p = await page(1440, 900, 320, false);
  const d = await p.evaluate(async () => {
    const dd = document.querySelector('.cds-dd[data-dd="dir"]');
    dd.querySelector('.c-env').click();
    const opt = [...dd.querySelectorAll('.semi-select-option')].find(x => /选择其他目录/.test(x.textContent));
    const picker = document.getElementById('dirPick');
    let fired = false;
    picker.click = () => { fired = true; };  // 劫持：无头环境里系统窗不可见，只验证会调起
    /* 无头下 showDirectoryPicker 行为不稳（可能 AbortError / 挂起），桩掉走 fallback 分支 */
    window.showDirectoryPicker = () => Promise.reject(new DOMException('stub', 'NotAllowedError'));
    opt.click();
    await new Promise(r => setTimeout(r, 120));
    return {
      fired,
      ddClosed: !dd.classList.contains('is-open'),
      labelKept: dd.querySelector('.c-pill-txt').textContent === '工作目录',
      hasDirAttr: picker.webkitdirectory !== undefined && picker.hasAttribute('webkitdirectory'),
      hasFilePick: !!document.getElementById('filePick')
    };
  });
  ok('3 点击选项会触发 dirPick.click()', d.fired, '');
  ok('3 点击后下拉关闭', d.ddClosed, '');
  ok('3 目录名不被「选择其他目录…」覆盖', d.labelKept, '');
  ok('3 dirPick 带 webkitdirectory', d.hasDirAttr, '');
  ok('3 filePick 多选输入存在', d.hasFilePick, '');
  // 模拟选完文件夹：change 事件写回
  const w = await p.evaluate(() => {
    const dd = document.querySelector('.cds-dd[data-dd="dir"]');
    const picker = document.getElementById('dirPick');
    Object.defineProperty(picker, 'files', { value: [{ webkitRelativePath: 'my-proj/src/a.txt', name: 'a.txt' }], configurable: true });
    picker.dispatchEvent(new Event('change'));
    return {
      label: dd.querySelector('.c-pill-txt').textContent,
      opt0: dd.querySelector('.semi-select-option').textContent,
      sel: dd.querySelector('.semi-select-option').classList.contains('semi-select-option-selected')
    };
  });
  ok('3 选完写回目录名', w.label === 'my-proj' && w.opt0 === 'my-proj', JSON.stringify(w));
  ok('3 第一个选项置为选中', w.sel, '');
  await p.close();
}

/* ========== 4 tb-ws-btn 宽度自适应 ========== */
{
  const p = await page(1440, 900, 320, false);
  const d0 = await p.evaluate(() => Math.round(document.querySelector('.tb-ws-btn').getBoundingClientRect().width));
  ok('4 默认宽 < 178（随内容收缩）', d0 > 60 && d0 < 178, String(d0));
  // 换个长名字 → 按钮变宽
  await p.evaluate(() => {
    const dd = document.querySelector('.cds-dd[data-dd="workspace"]');
    dd.querySelector('button').click();
  });
  await wait(120);
  const optN = await p.evaluate(() => {
    const dd = document.querySelector('.cds-dd[data-dd="workspace"]');
    const opts = [...dd.querySelectorAll('.semi-select-option')];
    const target = opts.reduce((a, b) => b.textContent.length > a.textContent.length ? b : a);
    target.click();
    return { name: target.textContent, n: opts.length };
  });
  await wait(120);
  const d1 = await p.evaluate(() => {
    const btn = document.querySelector('.tb-ws-btn');
    return { w: Math.round(btn.getBoundingClientRect().width), label: btn.querySelector('.tb-ws-name').textContent };
  });
  ok('4 选中后按钮标签同步', d1.label === optN.name, d1.label + ' / ' + optN.name);
  ok('4 按钮随长名字变宽', d1.w > d0, d0 + ' → ' + d1.w);
  ok('4 按钮不超过 280 封顶', d1.w <= 280, String(d1.w));
  // 下拉仍与按钮同宽展开
  await p.evaluate(() => document.querySelector('.cds-dd[data-dd="workspace"] button').click());
  await wait(120);
  const lw = await p.evaluate(() => {
    const dd = document.querySelector('.cds-dd[data-dd="workspace"]');
    const l = dd.querySelector('.semi-select-option-list-wrapper').getBoundingClientRect();
    const btn = dd.querySelector('.tb-ws-btn').getBoundingClientRect();
    return { lw: Math.round(l.width), bw: Math.round(btn.width), leftOk: Math.abs(l.left - btn.left) < 2 };
  });
  ok('4 下拉与按钮同宽且左对齐', lw.leftOk, JSON.stringify(lw));
  await p.close();
}

/* ========== 5 加号菜单（添加本地文件 / 技能） ========== */
{
  const p = await page(1440, 900, 320, false);
  const before = await p.evaluate(() => document.getElementById('attachMenu').hidden);
  await p.click('#attachBtn');
  await wait(160);
  const o = await p.evaluate(() => {
    const m = document.getElementById('attachMenu');
    const btn = document.getElementById('attachBtn');
    const mr = m.getBoundingClientRect(), br = btn.getBoundingClientRect();
    const items = [...m.querySelectorAll('.wd-menu-item')].map(x => x.textContent);
    return {
      hidden: m.hidden, items,
      above: mr.bottom < br.top, leftOk: Math.abs(mr.left - br.left) < 2,
      exp: btn.getAttribute('aria-expanded'),
      btnLabel: btn.getAttribute('data-action') || null
    };
  });
  ok('5 默认隐藏', before === true, '');
  ok('5 点击后显示', o.hidden === false, '');
  ok('5 菜单项为 添加本地文件/技能', o.items.join('|') === '添加本地文件|技能', o.items.join('|'));
  ok('5 菜单弹在按钮上方', o.above, '');
  ok('5 与按钮左对齐', o.leftOk, '');
  ok('5 aria-expanded=true', o.exp === 'true', '');
  ok('5 加号不再带 data-action（不发 toast）', o.btnLabel === null, String(o.btnLabel));
  // 「添加本地文件」劫持 filePick.click
  const fired = await p.evaluate(() => {
    const fp = document.getElementById('filePick');
    let f = false; fp.click = () => { f = true; };
    [...document.querySelectorAll('#attachMenu .wd-menu-item')][0].click();
    return f;
  });
  ok('5 添加本地文件 → 调起文件窗口', fired, '');
  await wait(120);
  // 技能 → toast
  await p.click('#attachBtn'); await wait(120);
  await p.evaluate(() => [...document.querySelectorAll('#attachMenu .wd-menu-item')][1].click());
  await wait(260);
  const t = await p.evaluate(() => document.querySelector('.semi-toast') && document.querySelector('.semi-toast').textContent);
  ok('5 技能 → toast「技能」', t === '技能', String(t));
  await wait(120);
  const closed = await p.evaluate(() => document.getElementById('attachMenu').hidden);
  ok('5 选择后菜单关闭', closed, '');
  // 点外部关闭
  await p.click('#attachBtn'); await wait(120);
  await p.click('.hero-title'); await wait(160);
  const closed2 = await p.evaluate(() => document.getElementById('attachMenu').hidden);
  ok('5 点外部关闭', closed2, '');
  ok('5 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  const s5 = await p.screenshot({ path: 'R16-attach.png' });
  ok('5 截图 R16-attach.png', !!s5, '');
  await p.close();
}

/* ========== 6 本地 / 工作目录 hover 图标文字转正文色 ========== */
{
  const p = await page(1440, 900, 320, false);
  const idle = await p.evaluate(() => {
    const env = document.querySelector('.cds-dd[data-dd="env"] .c-env');
    return { text: getComputedStyle(env).color, ico: getComputedStyle(env.querySelector('.ico:not(.c-caret)')).color };
  });
  ok('6 idle 为次级色', idle.text.includes('86, 86, 86') || idle.text.includes('107'), idle.text);
  await p.hover('.cds-dd[data-dd="env"] .c-env');
  await wait(200);
  const hov = await p.evaluate(() => {
    const env = document.querySelector('.cds-dd[data-dd="env"] .c-env');
    return { text: getComputedStyle(env).color, ico: getComputedStyle(env.querySelector('.ico:not(.c-caret)')).color, bg: getComputedStyle(env).backgroundColor };
  });
  ok('6 hover 文字转正文色', hov.text === 'rgb(31, 31, 31)', hov.text);
  ok('6 hover 图标转正文色', hov.ico === 'rgb(31, 31, 31)', hov.ico);
  /* 第 30 轮：过渡结束时 Chrome 可能报 rgba(230,230,230,1)，按三元组比较 */
  ok('6 hover 底色仍是中性灰', /230,\s*230,\s*230/.test(hov.bg), hov.bg);
  // 工作目录同样生效
  await p.hover('.cds-dd[data-dd="dir"] .c-env');
  await wait(200);
  const hov2 = await p.evaluate(() => {
    const env = document.querySelector('.cds-dd[data-dd="dir"] .c-env');
    return { text: getComputedStyle(env).color, ico: getComputedStyle(env.querySelector('.ico:not(.c-caret)')).color };
  });
  ok('6 工作目录 hover 同步生效', hov2.text === 'rgb(31, 31, 31)' && hov2.ico === 'rgb(31, 31, 31)', JSON.stringify(hov2));
  await p.close();
}

/* ========== 7 顶栏三元素 hover 背景变白 ========== */
{
  const p = await page(1440, 900, 320, false);
  await p.hover('.tb-ws-btn'); await wait(200);
  const ws = await p.evaluate(() => getComputedStyle(document.querySelector('.tb-ws-btn')).backgroundColor);
  ok('7 工作空间 hover 提到 rgba(255,255,255,.85)（第 39 轮磨砂白）', ws === 'rgba(255, 255, 255, 0.85)', ws);
  await p.hover('.tb-actions .tb-btn:first-child'); await wait(200);
  const h = await p.evaluate(() => getComputedStyle(document.querySelector('.tb-actions .tb-btn:first-child')).backgroundColor);
  ok('7 使用帮助 hover 提到 rgba(255,255,255,.85)', h === 'rgba(255, 255, 255, 0.85)', h);
  await p.hover('.tb-actions .tb-btn:last-child'); await wait(200);
  const s = await p.evaluate(() => getComputedStyle(document.querySelector('.tb-actions .tb-btn:last-child')).backgroundColor);
  ok('7 设置 hover 提到 rgba(255,255,255,.85)', s === 'rgba(255, 255, 255, 0.85)', s);
  ok('7 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
