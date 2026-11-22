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
  await p.reload({ waitUntil: 'load' });
  await wait(650);
  return p;
}

/* ========== 1 会话搜索框激活态 = 任务搜索框 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  await p.click('#wdSessSearchInput');
  await wait(250);
  const d = await p.evaluate(() => {
    const ss = document.getElementById('wdSessSearch');
    const cs = getComputedStyle(ss);
    return {
      shadow: cs.boxShadow, border: cs.borderColor,
      ico: getComputedStyle(ss.querySelector('.ico')).color,
      ph: getComputedStyle(ss.querySelector('input'), '::placeholder').color,
      ringRef: getComputedStyle(document.querySelector('.wd-search')).boxShadow
    };
  });
  const norm = s => s.replace(/rgba?\(([^)]+)\)/g, (m, g) => 'rgb(' + g.split(',').slice(0, 3).join(',') + ')').replace(/\s+/g, ' ');
  ok('1 聚焦后 1.6px 外环', /1\.6px/.test(d.shadow) && /102, 146, 249/.test(d.shadow), d.shadow);
  ok('1 外环色与任务搜索框一致', norm(d.shadow) === norm(d.ringRef), d.shadow + ' vs ' + d.ringRef);
  ok('1 聚焦后描边转透明（不叠双层）', d.border.includes('rgba(0, 0, 0, 0)'), d.border);
  ok('1 图标转正文色', d.ico === 'rgb(31, 31, 31)', d.ico);
  ok('1 占位文字转正文色', d.ph === 'rgb(31, 31, 31)', d.ph);
  await p.evaluate(() => document.getElementById('wdSessSearchInput').blur());
  await wait(200);
  const off = await p.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('wdSessSearch'));
    return { shadow: cs.boxShadow, border: cs.borderColor };
  });
  ok('1 失焦回 1px 描边、无外环', off.shadow === 'none' && /229, 229, 229/.test(off.border), JSON.stringify(off));
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2/3/4 空态字号与留白 + 所有空会话分组 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  /* 第 22 轮：会话页签的 AI 分组也默认收起了，先展开一个空分组再量 */
  await p.evaluate(() => {
    const heads = [...document.querySelectorAll('#wdViewSession .wd-grp-head')];
    const h = heads.find(x => x.getAttribute('aria-expanded') === 'false');
    if (h) h.click();
  });
  await wait(320);
  const d = await p.evaluate(() => {
    const em = [...document.querySelectorAll('#wdViewSession .wd-empty')].find(x => x.getBoundingClientRect().width > 0);
    const t = em.querySelector('.wd-empty-title');
    const l = em.querySelector('.wd-empty-link');
    const er = em.getBoundingClientRect(), tr = t.getBoundingClientRect(), lr = l.getBoundingClientRect();
    return {
      pad: getComputedStyle(em).padding, margin: getComputedStyle(em).margin,
      titleM: getComputedStyle(t).margin, titleFs: getComputedStyle(t).fontSize,
      linkFs: getComputedStyle(l).fontSize, linkPad: getComputedStyle(l).padding,
      gapTop: Math.round(tr.top - er.top), gapMid: Math.round(lr.top - tr.bottom), gapBot: Math.round(er.bottom - lr.bottom),
      groups: [...document.querySelectorAll('#wdViewSession .wd-grp')].map(g => ({
        name: g.querySelector('.wd-grp-name').textContent,
        cards: g.querySelectorAll('.wd-sess-card').length,
        empty: !!g.querySelector('.wd-empty'),
        newtask: !!g.querySelector('.wd-sub .wd-newtask'),
        count: (g.querySelector('.wd-num') || {}).textContent || null
      }))
    };
  });
  ok('2 标题 margin 清零', d.titleM.startsWith('0px'), d.titleM);
  ok('2 标题 13px', d.titleFs === '13px', d.titleFs);
  ok('2 链接 13px、无 padding', d.linkFs === '13px' && d.linkPad === '0px', d.linkFs + ' ' + d.linkPad);
  ok('2 标题到链接 8px（不再多 12px）', d.gapMid === 8, String(d.gapMid));
  ok('3 容器上下各 24 padding', d.pad === '24px 0px', d.pad);
  ok('3 上 24 / 下 24 对称', d.gapTop === 24 && d.gapBot === 24, d.gapTop + '/' + d.gapBot);
  ok('3 容器无残留上外边距', d.margin.startsWith('0px'), d.margin);
  ok('4 空会话分组都显示空态、无虚线按钮', d.groups.filter(g => g.cards === 0).every(g => g.empty && !g.newtask), JSON.stringify(d.groups));
  ok('4 有卡分组不显示空态', d.groups.filter(g => g.cards > 0).every(g => !g.empty), '');
  await p.screenshot({ path: 'R17-empty-after.png', clip: { x: 0, y: 380, width: 340, height: 480 } });

  await p.click('[data-wd-tab="任务"]');
  await wait(300);
  /* 第 20 轮：AI Native Factory 默认收起，先展开再量空态 */
  await p.evaluate(() => { const h = document.getElementById('wdHead5'); if (h && h.getAttribute('aria-expanded') === 'false') h.click(); });
  await wait(300);
  const t = await p.evaluate(() => {
    const em = [...document.querySelectorAll('#wdViewTask .wd-empty')].find(x => x.getBoundingClientRect().width > 0);
    const btn = em.querySelector('.wd-empty-acts button');
    const er = em.getBoundingClientRect(), br = btn.getBoundingClientRect();
    return { fs: getComputedStyle(em.querySelector('.wd-empty-title')).fontSize, bFs: getComputedStyle(btn).fontSize,
      pad: getComputedStyle(em).padding, gapBot: Math.round(er.bottom - br.bottom), gapTop: Math.round(em.querySelector('.wd-empty-title').getBoundingClientRect().top - er.top) };
  });
  ok('2 任务空态标题/动作 13px', t.fs === '13px' && t.bFs === '13px', t.fs + ' ' + t.bFs);
  ok('3 任务空态上下 24 对称', t.pad === '24px 0px' && t.gapBot === 24 && t.gapTop === 24, t.pad + ' ' + t.gapTop + '/' + t.gapBot);
  await p.close();
}

/* ========== 5 数字分身毛玻璃 ========== */
{
  const p = await page();
  const d = await p.evaluate(() => {
    const f = document.querySelector('.float');
    const cs = getComputedStyle(f);
    return { bf: cs.backdropFilter || cs.webkitBackdropFilter, bg: cs.backgroundColor,
      fill: f.querySelector('svg path').getAttribute('fill'), radius: cs.borderRadius, size: cs.width };
  });
  ok('5 有 backdrop blur', /blur\(1[0-9]px\)/.test(d.bf), d.bf);
  ok('5 按钮自身不叠白底（避免双层实心）', d.bg === 'rgba(0, 0, 0, 0)', d.bg);
  ok('5 圆内白底降到 55%', d.fill === 'rgba(255,255,255,0.55)', d.fill);
  ok('5 仍是 56px 圆', d.size === '56px' && d.radius === '50%', d.size + ' ' + d.radius);
  await p.close();
}

/* ========== 6 未选中标题常规字重 ========== */
{
  const p = await page();
  const d = await p.evaluate(() => [...document.querySelectorAll('#wdViewTask .wd-card')].map(c => ({
    w: getComputedStyle(c.querySelector('.wd-card-title')).fontWeight, sel: c.classList.contains('is-sel')
  })));
  ok('6 任务卡：未选中 400 / 选中 500', d.every(x => x.w === (x.sel ? '500' : '400')), JSON.stringify(d));
  ok('6 未选中卡标题为常规字重', d.some(x => !x.sel && x.w === '400'), '');
  await p.click('[data-wd-tab="会话"]');
  await wait(300);
  const s = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => ({
    w: getComputedStyle(c.querySelector('.wd-sess-title')).fontWeight, sel: c.classList.contains('is-sel')
  })));
  ok('6 会话卡：未选中 400 / 选中 500', s.every(x => x.w === (x.sel ? '500' : '400')), JSON.stringify(s));
  await p.close();
}

/* ========== 7 会话「更多」与任务「更多」完全一致 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const closed = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card .wd-more')]
    .filter(m => !m.closest('.wd-sess-card').classList.contains('is-sel'))
    .map(m => { const cs = getComputedStyle(m); return { w: cs.width, op: cs.opacity, pe: cs.pointerEvents }; }));
  ok('7 默认 0 宽 / 透明 / 不可点（未选中卡）', closed.every(x => x.w === '0px' && x.op === '0' && x.pe === 'none'), JSON.stringify(closed[0]));

  const cards = await p.$$('#wdViewSession .wd-sess-card');
  const cb = await cards[1].boundingBox();
  await p.mouse.move(cb.x + 40, cb.y + cb.height / 2);
  await wait(300);
  const hov = await p.evaluate(() => {
    const card = [...document.querySelectorAll('#wdViewSession .wd-sess-card')][1];
    const m = card.querySelector('.wd-more');
    const cs = getComputedStyle(m);
    const cr = card.getBoundingClientRect(), mr = m.getBoundingClientRect();
    return { w: cs.width, op: cs.opacity, border: cs.boxShadow, bg: cs.backgroundColor,
      rightGap: Math.round(cr.right - mr.right), topGap: Math.round(mr.top - cr.top), h: cs.height };
  });
  ok('7 hover 展开到 20x20', hov.w === '20px' && hov.h === '20px', hov.w + 'x' + hov.h);
  ok('7 出现时带 1px inset 描边（同任务卡）', hov.border.includes('inset') && /229, 229, 229/.test(hov.border), hov.border);
  ok('7 右缘距卡片 12px', hov.rightGap === 12, String(hov.rightGap));
  ok('7 与卡片 top 12 对齐', hov.topGap === 12, String(hov.topGap));

  /* 点开菜单，和任务卡一样是同一个浮动菜单 */
  await p.click('#wdViewSession .wd-sess-card:nth-of-type(2) .wd-more').catch(() => {});
  /* 第 18 轮：会话卡弹自己的菜单（置顶/重命名/归档/会话日志/删除） */
  const menu = await p.evaluate(() => {
    const m = document.getElementById('wdSessMenu');
    return { hidden: m.hidden, items: [...m.querySelectorAll('.wd-menu-item')].map(x => x.textContent),
      title: m.dataset.title || '', cardHidden: document.getElementById('wdCardMenu').hidden };
  });
  ok('7 点「更多」弹出会话菜单', !menu.hidden && menu.items.join('|') === '置顶|重命名|归档|会话日志|删除', JSON.stringify(menu));
  ok('7 菜单记住了会话标题', menu.title.indexOf('业务需求') === 0, menu.title);
  await p.evaluate(() => document.body.click());
  await wait(150);
  ok('7 点外部关闭', await p.evaluate(() => document.getElementById('wdSessMenu').hidden), '');
  ok('7 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 8 qf-step 投影可见 ========== */
{
  const p = await page(1440, 900, 320, false);
  await p.click('[data-quick="缺陷修复"]');
  await wait(450);
  const d = await p.evaluate(() => {
    const bar = document.getElementById('qfBar');
    const track = document.getElementById('qfTrack');
    const step = document.querySelector('.qf-step');
    const sr = step.getBoundingClientRect(), tr = track.getBoundingClientRect();
    const cs = getComputedStyle(step);
    return { shadow: cs.boxShadow, bg: cs.backgroundColor,
      stepTop: Math.round(sr.top), stepH: Math.round(sr.height),
      trackTop: Math.round(tr.top), trackH: Math.round(tr.height), trackPadTop: getComputedStyle(track).paddingTop,
      roomBelow: Math.round(tr.bottom - sr.bottom), roomAbove: Math.round(sr.top - tr.top),
      barH: Math.round(bar.getBoundingClientRect().height) };
  });
  ok('8 chip 仍带 0 1px 2px 投影', /0px 1px 2px/.test(d.shadow) && /0\.08/.test(d.shadow), d.shadow);
  ok('8 轨道给投影留出上下绘制区', d.roomAbove >= 1 && d.roomBelow >= 3, d.roomAbove + '/' + d.roomBelow);
  ok('8 chip 顶仍在稿件 y=46（盒顶 44 + 2 padding）', d.trackTop + 2 === d.stepTop, d.trackTop + '+' + d.stepTop);
  ok('8 chip 仍 24 高、轨道 30 不撑破 82 bar', d.stepH === 24 && d.barH === 82, d.stepH + ' / ' + d.barH);
  ok('8 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 9 涟漪原点与图标间距 8px ========== */
{
  const p = await page(1440, 900, 320, false);
  const d = await p.evaluate(() => {
    const btn = document.querySelector('.menu-btn');
    btn.classList.add('has-dot');
    const ico = btn.querySelector('.ico').getBoundingClientRect();
    const dot = document.getElementById('mbDot').getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    return { gap: Math.round(dot.left - ico.right), vOff: Math.abs((dot.top + dot.height / 2) - (ico.top + ico.height / 2)),
      dotRight: Math.round(dot.right - br.right) };
  });
  ok('9 原点左缘距图标右缘 8px', d.gap === 8, String(d.gap));
  ok('9 与图标垂直居中', d.vOff < 1, String(d.vOff));
  await p.screenshot({ path: 'R17-dot.png', clip: { x: 0, y: 40, width: 120, height: 60 } });
  await p.close();
}

/* ========== 10 任务卡「更多」右缘距卡片 12px ========== */
{
  const p = await page(1440, 900, 320, true);
  /* 第 31 轮：页签会记忆上一次停留，这里显式切回「任务」再量 */
  await p.evaluate(() => document.querySelector('[data-wd-tab="任务"]').click());
  await wait(300);
  const cards = await p.$$('#wdViewTask .wd-card');
  const cb = await cards[1].boundingBox();
  await p.mouse.move(cb.x + 60, cb.y + 20);
  await wait(300);
  const d = await p.evaluate(() => {
    const card = [...document.querySelectorAll('#wdViewTask .wd-card')][1];
    const m = card.querySelector('.wd-more');
    const cr = card.getBoundingClientRect(), mr = m.getBoundingClientRect();
    return { gap: Math.round(cr.right - mr.right), w: Math.round(mr.width), mr: getComputedStyle(m).marginRight };
  });
  ok('10 出现时右缘距卡片 12px', d.gap === 12, String(d.gap));
  ok('10 已无 -8 负边距', d.mr === '0px', d.mr);
  ok('10 仍 20 宽', d.w === 20, String(d.w));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
