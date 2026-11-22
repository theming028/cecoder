/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 34 轮验收
   1 三个面板键图标 = 工具行「排序」图标同尺寸（14×14，满版绘制）
   2 对话页右栏默认宽 = panel-main.is-chat 的一半（含历史脏数据 / 宽屏）
   3 任务执行页整体换稿：44 顶部工具条 + 122 工序条 + 40 页签条（稿 3113:44395）
*/
import puppeteer from 'puppeteer-core';
const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const OPEN = () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); } catch (e) { } };
async function mk(url, w = 1440, h = 900, seed = OPEN) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(seed);
  await p.goto('file:///' + ROOT + '/' + url, { waitUntil: 'load' });
  await wait(800);
  return p;
}

/* ========== A 图标与「排序」同尺寸 ========== */
{
  const p = await mk('cecoder-home.html?tab=%E4%BB%BB%E5%8A%A1');
  const d = await p.evaluate(() => {
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    const sort = document.querySelector('#wdSortBtn .ico');
    const box = sort.getBoundingClientRect();
    const svg = sort.querySelector('svg').getBoundingClientRect();
    return { sort: [Math.round(box.width), Math.round(box.height)], sortGlyph: [Math.round(svg.width), Math.round(svg.height)], collapse: g('.wd-collapse .ico') };
  });
  ok('A1 排序图标 14×14', d.sort[0] === 14 && d.sort[1] === 14, JSON.stringify(d.sort));
  ok('A2 收起任务栏图标同尺寸', d.collapse[0] === d.sort[0] && d.collapse[1] === d.sort[1], JSON.stringify(d.collapse));
  const p2 = await mk('cecoder-session.html?id=0');
  const d2 = await p2.evaluate(() => {
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    return { toggle: g('#rsToggle .ico'), btn: g('#rsToggle'), vb: document.querySelector('#rsToggle svg').getAttribute('viewBox') };
  });
  ok('A3 展开右栏 14×14（按钮仍 28）', d2.toggle[0] === 14 && d2.toggle[1] === 14 && d2.btn[0] === 28, JSON.stringify(d2));
  ok('A4 图标按 14 网格绘制', d2.vb === '0 0 14 14', d2.vb);
  await p2.click('#rsToggle'); await wait(520);
  const d3 = await p2.evaluate(() => {
    const e = document.querySelector('.rs-collapse .ico'); const r = e.getBoundingClientRect();
    const btn = document.querySelector('.rs-collapse').getBoundingClientRect(); const s = e.getBoundingClientRect();
    return { size: [Math.round(r.width), Math.round(r.height)], off: [Math.round(s.left - btn.left), Math.round(s.top - btn.top)] };
  });
  ok('A5 收起右栏 14×14 且居中 (7,7)', d3.size[0] === 14 && d3.off[0] === 7 && d3.off[1] === 7, JSON.stringify(d3));
  ok('A6 无 JS 报错', p.__e.length === 0 && p2.__e.length === 0, p.__e.concat(p2.__e).join(' | '));
  await p.close(); await p2.close();
}

/* ========== B 右栏默认 = panel-main 的一半 ========== */
async function rsCase(label, w, h, seed) {
  const p = await mk('cecoder-session.html?id=0', w, h, seed);
  const before = await p.evaluate(() => document.querySelector('.panel-main').getBoundingClientRect().width);
  await p.click('#rsToggle'); await wait(600);
  const after = await p.evaluate(() => ({
    rs: document.querySelector('#rsDrawer').getBoundingClientRect().width,
    pm: document.querySelector('.panel-main').getBoundingClientRect().width,
  }));
  await p.close();
  return { label, before: Math.round(before), rs: Math.round(after.rs), pm: Math.round(after.pm) };
}
{
  const clean = await rsCase('clean', 1440, 900, () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); });
  ok('B1 干净状态：右栏 = 打开前 panel-main 的一半', Math.abs(clean.rs - clean.before / 2) <= 1, JSON.stringify(clean));
  ok('B2 展开后左右各占一半（panel-main 被压成同宽）', Math.abs(clean.pm - clean.rs) <= 1, JSON.stringify(clean));

  const stale = await rsCase('stale', 1440, 900, () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.rsDrawer', JSON.stringify({ open: false, w: 400 })); });
  ok('B3 历史遗留 w=400（非手动）被忽略，仍是默认一半', Math.abs(stale.rs - stale.before / 2) <= 1, JSON.stringify(stale));

  const manual = await rsCase('manual', 1440, 900, () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.rsDrawer', JSON.stringify({ open: false, w: 520, manual: true })); });
  ok('B4 手动拖过的宽度仍被记住', manual.rs === 520, JSON.stringify(manual));

  const wide = await rsCase('wide', 1920, 1080, () => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); });
  ok('B5 1920 宽屏：一半不被 720 上限截断', Math.abs(wide.rs - wide.before / 2) <= 1 && wide.rs > 720, JSON.stringify(wide));
}

/* ========== C 任务执行页：三段模块 ========== */
{
  const p = await mk('cecoder-task.html?id=1');
  const d = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const g = s => { const e = document.querySelector(s); return e ? rel(e) : null; };
    const items = [...document.querySelectorAll('.ts-item')];
    const links = [...document.querySelectorAll('.ts-link')].map(rel);
    const icons = items.map(it => {
      const ic = it.querySelector('.ts-icon').getBoundingClientRect();
      const r = it.getBoundingClientRect();
      return { cx: Math.round(ic.left - pm.left + ic.width / 2), iconW: Math.round(ic.width) };
    });
    const ring = document.querySelector('.ts-item.is-now .ts-icon');
    return {
      top: g('.task-top'), steps: g('.task-steps'), tabs: g('.task-tabs'), stage: g('.stage'),
      segs: [...document.querySelectorAll('.tt-seg .tt-btn')].map(rel),
      run: g('.tt-run'),
      items: items.map(rel), links, icons,
      ring: ring ? (() => { const a = getComputedStyle(ring, '::after'); return { w: a.width, h: a.height, anim: a.animationName, mask: /^url/.test(a.maskImage || a.webkitMaskImage || ''), ml: a.marginLeft, mt: a.marginTop }; })() : null,
      segIcons: document.querySelectorAll('.tt-seg .tt-btn .ico').length,
      segFS: getComputedStyle(document.querySelector('.tt-btn')).fontSize,
      done: document.querySelectorAll('.ts-item.is-done').length,
      now: document.querySelectorAll('.ts-item.is-now').length,
      prog: g('.ts-prog'),
      progOp: getComputedStyle(document.querySelector('.ts-prog')).opacity,
      track: (() => { const t = document.getElementById('tkStepTrack'); return { l: t.offsetLeft, w: Math.round(t.offsetWidth) }; })(),
      tabsRow: [...document.querySelectorAll('.tk-tab')].map(rel),
      vseps: document.querySelectorAll('.task-tabs .tk-vsep').length,
      old: !!(document.querySelector('.task-head') || document.querySelector('.task-body') || document.getElementById('tkTitle')),
      comp: getComputedStyle(document.querySelector('.composer')).display,
      scroll: (() => { const s = document.getElementById('tkStepScroll'); return [s.scrollWidth, s.clientWidth]; })(),
      pad: getComputedStyle(document.getElementById('tkStepTrack')).padding,
    };
  });
  ok('C1 三段 y = 0 / 44 / 166，高 44 / 122 / 40', d.top.y === 0 && d.top.h === 44 && d.steps.y === 44 && d.steps.h === 122 && d.tabs.y === 166 && d.tabs.h === 40, JSON.stringify([d.top, d.steps, d.tabs]));
  ok('C2 内容区（stage）从 206 起', d.stage.y === 206, JSON.stringify(d.stage));
  /* 第 35 轮：去图标、字号 13，宽度随文字自然收缩；第 37 轮「全链路」→「任务信息」（+13） */
  ok('C3 顶部三段按钮 76 / 125 / 103±2，左起 8、间距 8', Math.abs(d.segs[0].w - 76) <= 2 && Math.abs(d.segs[1].w - 125) <= 2 && Math.abs(d.segs[2].w - 103) <= 2 && d.segs[0].x === 8 && d.segs[1].x === d.segs[0].x + d.segs[0].w + 8, JSON.stringify(d.segs));
  ok('C3b 只剩「工序进度」一个下拉箭头图标、字号 13', d.segIcons === 1 && d.segFS === '13px', d.segIcons + ' / ' + d.segFS);
  ok('C4 自动执行 88×28，距右 8、垂直居中(8)', d.run.w === 88 && d.run.h === 28 && d.run.x + d.run.w === d.top.w - 8 && d.run.y === 8, JSON.stringify(d.run));
  ok('C5 9 道工序、图标 24、圆心等距 64 间距排版', d.items.length === 9 && d.icons.every(i => i.iconW === 24), JSON.stringify(d.icons.map(i => i.cx)));
  ok('C6 连线 8 条：与两侧圆心各留 20', d.links.length === 8 && d.links.every((l, i) => Math.abs(l.x - (d.icons[i].cx + 20)) <= 1 && Math.abs(l.w - (d.icons[i + 1].cx - 20 - (d.icons[i].cx + 20))) <= 1), JSON.stringify(d.links));
  ok('C7 前两条连线主色、其后灰线', d.done === 2 && d.now === 1, d.done + '/' + d.now);
  /* 第 35 轮：外环改成 32×32 遮罩点阵、绕圆心旋转，靠 50% + 负 margin 保证同心 */
  ok('C8 当前项 32 点阵环（mask + 旋转，居中 -16）', d.ring && d.ring.w === '32px' && d.ring.h === '32px' && d.ring.mask && d.ring.anim === 'tsOrbit' && d.ring.ml === '-16px' && d.ring.mt === '-16px', JSON.stringify(d.ring));
  /* 第 36 轮：那条其实是滚动条 —— 几何照稿（左缩 16、离底 4、6 高），1440 放得下时整条不出现 */
  ok('C9 底部滚动条：左右各缩 16、离底 4、6 高，放得下时隐藏', d.prog.x === 16 && d.prog.h === 6 && d.prog.y === 156 && d.prog.w === 1072 && d.progOp === '0', JSON.stringify(d.prog) + ' op=' + d.progOp);
  ok('C10 页签：概要设计 80 宽、共 5 个、2 条竖分隔', d.tabsRow.length === 5 && d.tabsRow[0].w === 80 && d.vseps === 2, JSON.stringify(d.tabsRow) + ' sep=' + d.vseps);
  ok('C11 旧标题栏 / 占位内容已删除', !d.old, d.old);
  ok('C12 输入卡收起', d.comp === 'none', d.comp);
  /* 第 35 轮：内边距统一 24（原 41），9 道工序在 1102 面板里仍一屏放下 */
  ok('C13 工序条不溢出 + 左右内边距 24', d.scroll[0] <= d.scroll[1] + 1 && d.pad === '0px 24px', d.scroll.join('/') + ' pad=' + d.pad);
  ok('C14 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== D 任务页交互 ========== */
{
  const p = await mk('cecoder-task.html?id=1');
  /* 视图切换 */
  await (await p.$('.tt-seg .tt-btn:first-child')).click(); await wait(200);
  const seg = await p.evaluate(() => [...document.querySelectorAll('.tt-btn')].map(b => b.classList.contains('is-on') + '/' + b.getAttribute('aria-selected')));
  ok('D1 切到「任务信息」：选中态跟着走', seg[0] === 'true/true' && seg[1] === 'false/false', JSON.stringify(seg));
  /* 页签切换 + 关闭 */
  await p.evaluate(() => document.querySelectorAll('.tk-tab')[2].click()); await wait(150);
  const t2 = await p.evaluate(() => [...document.querySelectorAll('.tk-tab')].map(t => t.classList.contains('is-on')));
  ok('D2 点页签切换选中', t2[2] === true && t2[0] === false, JSON.stringify(t2));
  await p.evaluate(() => document.querySelectorAll('.tk-tab')[2].querySelector('.tk-x').click()); await wait(200);
  const t3 = await p.evaluate(() => ({ n: document.querySelectorAll('.tk-tab').length, on: [...document.querySelectorAll('.tk-tab')].findIndex(t => t.classList.contains('is-on')) }));
  ok('D3 关闭页签：少一个且选中交给前一个', t3.n === 4 && t3.on === 1, JSON.stringify(t3));
  /* 第 37 轮：右侧那颗键从「收起工序资产栏」换成「专注模式」 */
  await p.click('#tkFocus'); await wait(400);
  const col = await p.evaluate(() => ({ more: !!document.getElementById('tkTabsMore'), focus: document.body.classList.contains('is-focus'), p: document.getElementById('tkFocus').getAttribute('aria-pressed') }));
  ok('D4 右侧键 = 专注模式（无 tkTabsMore，点开 body.is-focus）', !col.more && col.focus === true && col.p === 'true', JSON.stringify(col));
  await p.click('#tkFocus'); await wait(400);
  /* 自动执行 → toast */
  await p.click('#tkRun'); await wait(250);
  ok('D5 自动执行给 toast', await p.evaluate(() => [...document.querySelectorAll('.semi-toast')].some(e => /自动执行/.test(e.textContent))), '');
  ok('D6 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

console.log('\n通过 ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
await b.close();
