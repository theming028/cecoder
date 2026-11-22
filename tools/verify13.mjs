/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 13 轮验证：折叠态橙点 / 蒙层纯黑 / 默认权限正文色+盾牌 / 标签挤压 / 工序无分隔 / 进度条只蓝段 */
import puppeteer from 'puppeteer-core';
const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(w = 1440, h = 900, open = false) {
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open, w: 320 });
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  p.__errs = errs;
  return p;
}

/* ========== 1 折叠态「待确认」橙点 ========== */
{
  const p = await page(1440, 900, false);
  const dot = await p.evaluate(() => {
    const btn = document.querySelector('.menu-btn');
    const d = document.getElementById('mbDot');
    const cs = getComputedStyle(d);
    const csAfter = getComputedStyle(d, '::after');
    const br = btn.getBoundingClientRect(), dr = d.getBoundingClientRect();
    return {
      has: btn.classList.contains('has-dot'),
      op: cs.opacity, w: +dr.width.toFixed(1), h: +dr.height.toFixed(1),
      bg: cs.backgroundColor, radius: cs.borderRadius,
      right: +(br.right - dr.right).toFixed(1), top: +(dr.top - br.top).toFixed(1),
      anim: csAfter.animationName, animDur: csAfter.animationDuration,
      waveBg: csAfter.backgroundColor, waveW: parseFloat(csAfter.width),
      label: btn.getAttribute('aria-label'),
      todo: document.querySelectorAll('.wd-card.is-todo').length
    };
  });
  ok('1 折叠态检测到待确认 → 显示圆点', dot.has && dot.op === '1', JSON.stringify(dot));
  ok('1 圆点 6x6 橙色 #F77234', dot.w === 6 && dot.h === 6 && dot.bg === 'rgb(247, 114, 52)', `${dot.w}x${dot.h} ${dot.bg}`);
  ok('1 圆点贴按钮右缘', dot.right <= 2, `right ${dot.right} top ${dot.top}`);
  /* 第 16 轮：圆点从右上角移到与图标同一水平线（垂直居中），不再贴顶 */
  ok('1 有水波纹扩散动画', dot.anim === 'mbRipple' && dot.animDur === '1.7s', `${dot.anim} ${dot.animDur}`);
  ok('1 涟漪外圈 22px / rgba(247,114,52,.34)', dot.waveW === 22 && dot.waveBg === 'rgba(247, 114, 52, 0.34)', `${dot.waveW} ${dot.waveBg}`);
  ok('1 无障碍标签带提示', /有待确认/.test(dot.label), dot.label);
  const iconStill = await p.evaluate(() => {
    const s = document.querySelector('.menu-btn svg');
    return { t: getComputedStyle(s).transform, wc: getComputedStyle(s.parentElement).willChange, anim: getComputedStyle(s.parentElement).animationName };
  });
  ok('1 图标本体静止（只涟漪动，避免发虚）', iconStill.t === 'none' && iconStill.anim === 'none', JSON.stringify(iconStill));

  /* 展开 → 点消失 */
  await p.click('.menu-btn'); await wait(600);
  const opened = await p.evaluate(() => ({
    has: document.querySelector('.menu-btn').classList.contains('has-dot'),
    op: getComputedStyle(document.getElementById('mbDot')).opacity
  }));
  ok('1 展开后橙点消失', !opened.has && opened.op === '0', JSON.stringify(opened));

  /* 收起 → 回来 */
  await p.click('.wd-collapse'); await wait(600);
  ok('1 再收起橙点恢复', await p.evaluate(() => document.querySelector('.menu-btn').classList.contains('has-dot')));

  /* 没有待确认卡片时不亮 */
  const none = await p.evaluate(() => {
    document.querySelectorAll('.wd-card.is-todo').forEach(c => c.classList.remove('is-todo'));
    return true;
  });
  await p.evaluate(() => {
    /* 直接触发一次开合，让 syncMenuDot 重新计算 */
    const btn = document.querySelector('.menu-btn');
    btn.click();
  });
  await wait(500);
  /* 第 14 轮：会话视图也有待确认，验证「无待确认」时要一起清掉 */
  await p.evaluate(() => document.querySelectorAll('.wd-sess-card.is-todo').forEach(x => x.classList.remove('is-todo')));
  await p.evaluate(() => document.querySelector('.wd-collapse').click());
  await wait(600);
  ok('1 无待确认时橙点不亮', none && await p.evaluate(() => !document.querySelector('.menu-btn').classList.contains('has-dot')));
  ok('1 无报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.screenshot({ path: 'R13-dot.png', captureBeyondViewport: false });
  await p.close();
}

/* ========== 2 蒙层纯黑 ========== */
{
  const p = await page(1440, 900, true);
  await p.click('#wdSync'); await wait(450);
  const m = await p.evaluate(() => {
    const el = document.querySelector('#syncModal .cm-mask');
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, bd: cs.backdropFilter || cs.webkitBackdropFilter,
      inside: !!el.closest('.panel') };
  });
  ok('2 蒙层底色为纯黑（rgba 0,0,0）', m.bg === 'rgba(0, 0, 0, 0.4)', m.bg);
  ok('2 毛玻璃保留', /blur\(10px\)/.test(m.bd), m.bd);
  ok('2 蒙层在 panel 内', m.inside === true);
  await p.keyboard.press('Escape'); await wait(300);
  ok('2 无报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 3 默认权限：正文色 + 盾牌图标 ========== */
{
  const p = await page(1440, 900, true);
  const perm = await p.evaluate(() => {
    const btn = document.querySelector('.c-perm');
    const txt = btn.querySelector('.c-pill-txt');
    const svg = btn.querySelector('svg');
    const model = document.querySelector('.c-model .c-pill-txt');
    return {
      color: getComputedStyle(txt).color,
      iconColor: getComputedStyle(svg).color,
      vb: svg.getAttribute('viewBox'),
      paths: svg.querySelectorAll('path').length,
      rule: svg.getAttribute('fill-rule'),
      modelColor: getComputedStyle(model).color,
      w: +btn.getBoundingClientRect().width.toFixed(1)
    };
  });
  ok('3 默认权限文字为正文色', perm.color === 'rgb(31, 31, 31)', perm.color);
  ok('3 图标与文字同色', perm.iconColor === perm.color, perm.iconColor);
  ok('3 图标为 14 画布单路径盾牌', perm.vb === '0 0 14 14' && perm.paths === 1, `${perm.vb} paths=${perm.paths}`);
  ok('3 盾牌用 evenodd 抠出钥匙孔', perm.rule === 'evenodd', perm.rule);
  ok('3 不再与模型选择同灰', perm.modelColor !== perm.color, `perm ${perm.color} / model ${perm.modelColor}`);
  ok('3 药丸宽度不因换图标跑偏', Math.abs(perm.w - 114) < 2, String(perm.w));
  ok('3 无报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 4 标签默认贴右 + hover 挤压（多分辨率） ========== */
for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const p = await page(w, h, true);
  const box = await p.evaluate(() => {
    const card = document.querySelector('.wd-card');
    const r = card.getBoundingClientRect();
    return [r.x, r.y, r.width, r.height];
  });
  const idle = await p.evaluate(() => {
    const card = document.querySelector('.wd-card');
    const cr = card.getBoundingClientRect();
    const chip = card.querySelector('.wd-chip').getBoundingClientRect();
    const more = card.querySelector('.wd-more').getBoundingClientRect();
    return { gap: +(cr.right - chip.right).toFixed(1), moreW: +more.width.toFixed(1), titleLines: Math.round(card.querySelector('.wd-card-title').getBoundingClientRect().height / 20) };
  });
  ok(`${w} 标签默认贴右（12px 内边距）`, Math.abs(idle.gap - 12) < 1.5, String(idle.gap));
  ok(`${w} 更多按钮默认零宽`, idle.moreW === 0, String(idle.moreW));
  ok(`${w} 标题默认 1 行`, idle.titleLines === 1, String(idle.titleLines));

  await p.mouse.move(box[0] + 60, box[1] + 20); await wait(320);
  const hov = await p.evaluate(() => {
    const card = document.querySelector('.wd-card');
    const cr = card.getBoundingClientRect();
    const chip = card.querySelector('.wd-chip').getBoundingClientRect();
    const more = card.querySelector('.wd-more').getBoundingClientRect();
    return { gap: +(cr.right - chip.right).toFixed(1), moreW: +more.width.toFixed(1), moreRight: +(cr.right - more.right).toFixed(1),
      iconVisible: getComputedStyle(card.querySelector('.wd-more svg')).visibility };
  });
  ok(`${w} hover 展开 20px 且右缘距卡 12px（第 17 轮）`, hov.moreW === 20 && Math.abs(hov.moreRight - 12) < 1, JSON.stringify(hov));
  ok(`${w} hover 标签左移（净 24px，标签距右 36）`, Math.abs(hov.gap - 36) < 1.5, String(hov.gap));
  ok(`${w} 无报错`, p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 5 工序条：无分隔线 / 图标同色 / 进度条灰段静止 ========== */
{
  const p = await page(1440, 900, true);
  await p.click('[data-quick="技术任务"]'); await wait(450);
  const qf = await p.evaluate(() => {
    const edit = document.getElementById('qfEdit'), close = document.querySelector('.qf-icon[data-bar-close="qf"]');
    const step = document.querySelector('.qf-step');
    const no = step.querySelector('.qf-no'), nm = step.querySelector('.qf-name');
    const bars = [...document.querySelectorAll('.wd-card .wd-bar')].filter(x => x.children.length);
    const lastCard = bars[bars.length - 1];
    const greys = [...lastCard.children].filter(x => !x.classList.contains('on'));
    return {
      sep: document.querySelectorAll('.qf-sep').length,
      gap: +(nm.getBoundingClientRect().left - no.getBoundingClientRect().right).toFixed(1),
      editColor: getComputedStyle(edit).color, closeColor: getComputedStyle(close).color,
      greyAnim: greys.slice(0, 4).map(x => getComputedStyle(x).animationName),
      onAnim: [...lastCard.children].filter(x => x.classList.contains('on')).map(x => getComputedStyle(x).animationName)
    };
  });
  await p.mouse.move(600, 300); await wait(250);
  const after = await p.evaluate(() => ({
    editColor: getComputedStyle(document.getElementById('qfEdit')).color,
    closeColor: getComputedStyle(document.querySelector('.qf-icon[data-bar-close="qf"]')).color
  }));
  ok('5 工序 chip 内已无分隔竖线', qf.sep === 0, String(qf.sep));
  ok('5 序号与名字间距 5px', Math.abs(qf.gap - 5) < 1.5, String(qf.gap));
  ok('5 编辑与关闭图标同色', after.editColor === after.closeColor, `${after.editColor} / ${after.closeColor}`);
  ok('5 图标同为 #A9A9A9', after.editColor === 'rgb(169, 169, 169)', after.editColor);
  ok('5 灰色进度段无动画', qf.greyAnim.every(n => n === 'none'), JSON.stringify(qf.greyAnim));
  ok('5 蓝色进度段有生长动画', qf.onAnim.length > 0 && qf.onAnim.every(n => n === 'wdBarGrow'), JSON.stringify(qf.onAnim));
  ok('5 无报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
