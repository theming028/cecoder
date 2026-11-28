/* 第 90 轮验收：UI 生成中（独立页 cecoder-uigen.html，稿 3395:76081）
   入口：UI设计页底栏「下一步，输入设计资产」跳转
   中栏：居中 400×435 插图卡（图标 72 + 标题 20/500 + 副文 14/400 两行）
   底栏：次要按钮「停止生成」→ 回上一页；约 5s 后自动进入生成完成（中栏留空） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1920, height: 1000 });

/* ---------- A 从 UI设计页点「下一步」跳转到独立页 ---------- */
await p.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(300);
const menu = await p.$('.menu-btn');
if (menu) { await menu.click(); await wait(450); }
const urlBefore = p.url();
await p.click('#ugNext');
await wait(700);
const nav = { from: urlBefore.split('/').pop(), to: p.url().split('/').pop() };
ok('A1 点「下一步，输入设计资产」跳转到独立页 cecoder-uigen.html', /cecoder-uigen\.html/.test(nav.to), JSON.stringify(nav));

/* ---------- B 生成中页面骨架 ---------- */
const g = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const cs = e => getComputedStyle(e);
  const gen = q('.ug-gen'), card = q('.ug-gen-card'), inn = q('.ug-gen-in'), ico = q('.ug-gen-ico');
  const t = q('.ug-gen-t'), d = q('.ug-gen-d'), stop = q('#ugStop'), foot = q('.tp-foot'), tabs = q('.task-tabs');
  const cr = card.getBoundingClientRect(), ir = inn.getBoundingClientRect();
  return {
    page: document.body.getAttribute('data-page'),
    title: document.title,
    hasStep1: !!q('.ug-wrap'),
    tabs: !!tabs, tabsBox: tabs ? box(tabs) : null,
    gen: box(gen), card: box(card),
    cardBg: cs(card).backgroundImage.slice(0, 160),
    ratio: +(cr.width / cr.height).toFixed(4),
    inBox: box(inn), inTop: Math.round(ir.y - cr.y), inW: Math.round(ir.width),
    ico: box(ico),
    t: [box(t), cs(t).fontSize + '/' + cs(t).fontWeight + '/' + cs(t).lineHeight, cs(t).color],
    d: [box(d), cs(d).fontSize + '/' + cs(d).lineHeight, cs(d).color],
    dLines: Math.round(d.getBoundingClientRect().height / 22),
    stop: [stop.textContent.trim(), box(stop), cs(stop).backgroundColor, cs(stop).boxShadow, cs(stop).color],
    foot: box(foot),
    footBefore: (() => { const b = getComputedStyle(foot, '::before'); return b.left + '/' + b.right + '/' + b.height + '/' + b.backgroundColor; })(),
    icoMask: (() => { const c = ico.querySelector('circle'); const m = c && c.getAttribute('mask'); const mp = m && document.querySelector(m.slice(4, -1) + ' path'); return { mask: m, holeFill: mp ? mp.getAttribute('fill') : null, ringFill: ico.querySelector(':scope > path').getAttribute('fill') }; })(),
    arcAnim: (() => { const a = ico.querySelector('.ug-gen-arc'); const c2 = cs(a); return c2.animationName + '/' + c2.animationDuration + '/' + c2.animationIterationCount + '/' + c2.transformOrigin; })(),
    blankDot: (() => {
      const bl = q('.ui-blank'), c2 = cs(bl);
      return { cls: bl.className, bg: c2.backgroundImage, size: c2.backgroundSize, color: c2.backgroundColor, h: Math.round(bl.getBoundingClientRect().height) };
    })(),
    over: document.documentElement.scrollWidth - innerWidth,
  };
});
ok('B1 独立页：data-page=ui、标题「Cecoder · UI生成中」、无第 1 步内容', g.page === 'ui' && /UI生成中/.test(g.title) && !g.hasStep1, g.page + ' ' + g.title);
ok('B2 保留工序资产页签条（与 UI设计页同壳）', g.tabs && g.tabsBox[2] === 1134 && g.tabsBox[3] === 40, JSON.stringify(g.tabsBox));
/* 第 109 轮：静态背景图 ui-gen.png 换成会流动的色团（::before / ::after），卡片尺寸与居中不变 */
ok('B3 插图卡 400×435（比例 400/435）、动态色团底、水平居中', g.card[2] === 400 && g.card[3] === 435 && g.ratio === 0.9195 && !/url\(/.test(g.cardBg) && Math.abs((g.card[0] + 200) - (g.gen[0] + g.gen[2] / 2)) <= 1, JSON.stringify(g.card) + ' ' + g.cardBg.slice(0, 40));
ok('B4 内容块 308 宽、距卡顶 80（稿 @46,80）', g.inW === 308 && g.inTop === 80, g.inW + ' @' + g.inTop);
ok('B5 图标 72×72、水平居中', g.ico[2] === 72 && g.ico[3] === 72 && Math.abs((g.ico[0] + 36) - (g.inBox[0] + 154)) <= 1, JSON.stringify(g.ico));
ok('B6 标题「UI 界面生成中」20/500/28 #1F1F1F，距图标 32', g.t[1] === '20px/500/28px' && g.t[2] === 'rgb(31, 31, 31)' && g.t[0][1] - (g.ico[1] + 72) === 32, JSON.stringify(g.t));
ok('B7 副文 14/22 #6B6B6B、固定两行、距标题 12', g.d[1] === '14px/22px' && g.d[2] === 'rgb(107, 107, 107)' && g.dLines === 2 && g.d[0][1] - (g.t[0][1] + 28) === 12, JSON.stringify(g.d) + ' lines=' + g.dLines);
ok('B8 底栏次要按钮「停止生成（10s）」36 高、白底 + 1px #E5E5E5、正文色', /^停止生成（10s）$/.test(g.stop[0]) && g.stop[1][3] === 36 && g.stop[2] === 'rgb(255, 255, 255)' && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(g.stop[3]) && g.stop[4] === 'rgb(31, 31, 31)', JSON.stringify(g.stop));
ok('B9 底栏 56 高、按钮居中', g.foot[3] === 56 && Math.abs((g.stop[1][0] + g.stop[1][2] / 2) - (g.foot[0] + g.foot[2] / 2)) <= 1, JSON.stringify(g.foot));
ok('B10 1920 收左栏：无横向溢出', g.over <= 0, g.over);
ok('B11 底栏顶线两端断开、左右各留 20（左侧竖线仍在）', g.footBefore === '20px/20px/1px/rgb(235, 236, 237)', g.footBefore);
ok('B12 图标中间镂空：黑圆用 mask 挖掉调色板（透出渐变底）', g.icoMask.mask === 'url(#ugIcoMask)' && g.icoMask.holeFill === '#000' && g.icoMask.ringFill === '#DAE4FE', JSON.stringify(g.icoMask));
ok('B13 蓝环持续旋转（ug-gen-spin / 1.4s / infinite / 绕 36,36）', /ug-gen-spin/.test(g.arcAnim) && /1\.4s/.test(g.arcAnim) && /infinite/.test(g.arcAnim) && g.arcAnim.indexOf('36px 36px') > 0, g.arcAnim);
ok('B14 中栏点阵底：.ui-blank.is-gen + 16px 间距 1px 点、底色仍白（内容区高 681）', g.blankDot.cls === 'ui-blank is-gen' && /radial-gradient/.test(g.blankDot.bg) && g.blankDot.size === '16px 16px' && g.blankDot.color === 'rgb(255, 255, 255)' && g.blankDot.h > 600, JSON.stringify(g.blankDot));

/* ---------- C 停止生成 → 回上一页 ---------- */
await p.click('#ugStop');
await wait(700);
ok('C1 点「停止生成」回到 UI设计页（第 1 步内容在）', /cecoder-ui\.html/.test(p.url()) && !!(await p.$('.ug-wrap')), p.url().split('/').pop());
const plain = await p.evaluate(() => ({ gen: !!document.querySelector('.ui-blank.is-gen'), bg: getComputedStyle(document.querySelector('.ui-blank')).backgroundImage }));
ok('C2 UI设计页中栏不带点阵底（is-gen 只在生成中页）', !plain.gen && plain.bg === 'none', JSON.stringify(plain));

/* ---------- D 停留 10s 自动进入独立的生成完成页 ---------- */
await p.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
await wait(300);
const t0 = Date.now();
const mid = await p.evaluate(() => ({ gen: !!document.querySelector('.ug-gen:not([hidden])'), stop: !!document.querySelector('#ugStop:not([hidden])') }));
ok('D1 进入页面即为生成中（插图卡可见、底栏「停止生成」可见）', mid.gen && mid.stop, JSON.stringify(mid));
await wait(5600);
const at5 = await p.evaluate(() => ({ page: location.href.split('/').pop(), gen: !!document.querySelector('.ug-gen:not([hidden])') }));
ok('D2 停留 5.6s 仍在生成中（时长已由 5s 改为 10s）', /cecoder-uigen\.html/.test(at5.page) && at5.gen, JSON.stringify(at5) + ' ' + (Date.now() - t0) + 'ms');
await wait(5200);
const at10 = await p.evaluate(() => location.href.split('/').pop());
ok('D3 约 10s 后自动进入独立的生成完成页 cecoder-uidone.html', /cecoder-uidone\.html/.test(at10), at10 + ' ' + (Date.now() - t0) + 'ms');
ok('D4 生成完成页有画板工具条与页签（画板 / 页面关系 / 页面预览）', await p.evaluate(() => !!document.querySelector('.ud-bar') && document.querySelectorAll('.ud-tabs .tk-tab').length === 3));

/* ---------- E 响应式 ---------- */
const resp = [];
for (const w of [1152, 1280, 1440, 1920]) {
  await p.setViewport({ width: w, height: 900 });
  await p.goto('file:///' + BASE + '/cecoder-uigen.html', { waitUntil: 'load' });
  await wait(320);
  resp.push(await p.evaluate(() => {
    const card = document.querySelector('.ug-gen-card'), gen = document.querySelector('.ug-gen');
    const cr = card.getBoundingClientRect(), gr = gen.getBoundingClientRect();
    const d = document.querySelector('.ug-gen-d');
    return {
      w: innerWidth, over: document.documentElement.scrollWidth - innerWidth,
      cardW: Math.round(cr.width), cardH: Math.round(cr.height),
      inGen: cr.left >= gr.left - 1 && cr.right <= gr.right + 1 && cr.top >= gr.top - 1 && cr.bottom <= gr.bottom + 1,
      dLines: Math.round(d.getBoundingClientRect().height / 22),
      footH: Math.round(document.querySelector('.tp-foot').getBoundingClientRect().height),
    };
  }));
}
ok('E1 1152~1920 四档：无横向溢出、卡片不出容器、副文仍两行、底栏 56', resp.every(r => r.over <= 0 && r.inGen && r.dLines === 2 && r.footH === 56), JSON.stringify(resp));

ok('F1 无 console / pageerror', p.__e.length === 0, JSON.stringify(p.__e));
await b.close();
console.log('\n第 90 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) console.log('FAIL:\n - ' + fail.join('\n - '));
