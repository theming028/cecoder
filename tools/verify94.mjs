/* 第 94 轮验收：
   ① UI设计页「预览」→ 右侧 800 抽屉（设计系统详情）
   ② ud-bar 左侧竖线
   ③ ud-tools 5 键 tooltip（批注 / 截图 / 编辑 UI 元素 / 框选 / 更多）+ 缩放 ±
   ④ 画板页签图标换成稿内画框图标
   ⑤ 「版本」下拉：当前设计 / 历史基线 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================= A. 生成完成页（ud-bar） ================= */
const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1920, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(300);

const A = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const bar = q('.ud-bar');
  const tab = q('.ud-tabs .tk-tab.is-on');
  const dd = q('#udVer').closest('.cds-dd');
  return {
    barSh: cs(bar).boxShadow,
    barBox: box(bar),
    barBottom: Math.round(bar.getBoundingClientRect().bottom),
    tools: qa('.ud-tool').map(e => [e.getAttribute('aria-label'), e.getAttribute('data-tip')]),
    zooms: qa('.ud-zbtn').map(e => [e.getAttribute('aria-label'), e.getAttribute('data-tip')]),
    tabIcoD: (tab.querySelector('svg path') || {}).getAttribute ? tab.querySelector('svg path').getAttribute('d').slice(0, 12) : '',
    tabIcoColor: cs(tab.querySelector('.ico')).color,
    tabIcoBox: box(tab.querySelector('.ico')),
    ver: {
      inDd: !!dd,
      ddOpen: dd ? dd.classList.contains('is-open') : null,
      opts: qa('.ud-dd .semi-select-option').map(e => e.textContent.trim()),
      sel: qa('.ud-dd .semi-select-option').map(e => e.classList.contains('semi-select-option-selected')),
      font: cs(q('.ud-dd .semi-select-option')).fontSize,
      trigger: q('#udVer .ud-sel-v').textContent.trim(),
      trigFont: cs(q('#udVer .ud-sel-v')).fontSize
    },
    barOverflow: bar.scrollWidth <= bar.clientWidth + 1
  };
});

ok('A1 ud-bar 左侧 1px 竖线', /inset/.test(A.barSh) && /rgb\(235, 236, 237\) 1px 0px/.test(A.barSh), A.barSh);
ok('A2 ud-bar 底边 1px', /rgb\(229, 229, 229\) 0px -1px/.test(A.barSh), A.barSh);
ok('A3 ud-bar 高 44', A.barBox[3] === 44, A.barBox.join(','));
ok('A4 五个工具键 tooltip 文案', JSON.stringify(A.tools.map(t => t[1])) === JSON.stringify(['批注', '截图', '编辑 UI 元素', '框选', '更多']), JSON.stringify(A.tools));
ok('A5 工具键 aria-label 与 tooltip 同步', A.tools.every(t => t[0] === t[1]), JSON.stringify(A.tools));
ok('A6 缩放 ± tooltip', JSON.stringify(A.zooms.map(z => z[1])) === JSON.stringify(['缩小', '放大']), JSON.stringify(A.zooms));
ok('A7 画板页签图标 = 稿内画框', A.tabIcoD === 'M12.869511,5', A.tabIcoD);
ok('A8 画板页签图标主色', A.tabIcoColor === 'rgb(55, 112, 247)', A.tabIcoColor);
ok('A9 画板页签图标 14×14', A.tabIcoBox[2] === 14 && A.tabIcoBox[3] === 14, A.tabIcoBox.join(','));
ok('A10 版本按钮包进 .cds-dd', A.ver.inDd === true);
ok('A11 版本下拉两项', JSON.stringify(A.ver.opts) === JSON.stringify(['当前设计', '历史基线']), JSON.stringify(A.ver.opts));
ok('A12 当前设计默认选中', JSON.stringify(A.ver.sel) === JSON.stringify([true, false]), JSON.stringify(A.ver.sel));
ok('A13 下拉项 13px', A.ver.font === '13px', A.ver.font);
ok('A14 触发器 13px 不被 c-pill-txt 顶成 14', A.ver.trigFont === '13px', A.ver.trigFont);
ok('A15 工具条不横向溢出', A.barOverflow);

/* 悬停出 tooltip */
await p.hover('.ud-tool:nth-child(1)');
await wait(420);
const tipA = await p.evaluate(() => {
  const t = document.querySelector('.cds-tip');
  return t ? [t.textContent, t.classList.contains('is-on'), Math.round(t.getBoundingClientRect().width), Math.round(t.getBoundingClientRect().height), Math.round(t.getBoundingClientRect().y)] : null;
});
ok('A16 悬停第一个工具键出 tooltip「批注」', tipA && tipA[1] && tipA[0] === '批注', JSON.stringify(tipA));
ok('A17 tooltip 高 28（12/20 + 4 内距）', tipA && tipA[3] === 28, tipA && tipA[3]);
ok('A19 tooltip 显示在按钮上方', tipA && tipA[4] + 28 <= A.barBox[1], tipA && tipA[4] + ' / barTop ' + A.barBox[1]);

/* 下拉开合 + 选择 */
await p.click('#udVer');
await wait(220);
const ddOpen = await p.evaluate(() => {
  const dd = document.querySelector('#udVer').closest('.cds-dd');
  const list = dd.querySelector('.semi-select-option-list-wrapper');
  const r = list.getBoundingClientRect(), br = document.querySelector('.ud-bar').getBoundingClientRect();
  return [dd.classList.contains('is-open'), getComputedStyle(list).display, Math.round(r.height), Math.round(r.top - br.bottom)];
});
ok('B1 点「版本」展开下拉', ddOpen[0] === true && ddOpen[1] === 'flex', JSON.stringify(ddOpen));
ok('B2 菜单高 68（2×28 + 4 内距 + 2 间隔）', ddOpen[2] === 68, ddOpen[2]);
ok('B3 菜单在工具条下方 4px', ddOpen[3] === 4, ddOpen[3]);
await p.click('.ud-dd .semi-select-option:nth-child(2)');
await wait(220);
const afterPick = await p.evaluate(() => {
  const dd = document.querySelector('#udVer').closest('.cds-dd');
  return [dd.classList.contains('is-open'), document.querySelector('#udVer .ud-sel-v').textContent.trim(),
    [...dd.querySelectorAll('.semi-select-option')].map(e => e.classList.contains('semi-select-option-selected'))];
});
ok('B4 选「历史基线」后回填触发器', afterPick[1] === '历史基线', afterPick[1]);
ok('B5 选完自动收起', afterPick[0] === false);
ok('B6 选中态跟着走', JSON.stringify(afterPick[2]) === JSON.stringify([false, true]), JSON.stringify(afterPick[2]));

ok('A18 无 JS 报错（uidone）', p.__e.length === 0, p.__e.join(' | '));

/* ================= C. UI设计页：预览抽屉 ================= */
const q = await b.newPage(); q.__e = [];
q.on('pageerror', e => q.__e.push('pageerror: ' + e.message));
q.on('console', m => { if (m.type() === 'error') q.__e.push('console: ' + m.text()); });
await q.setViewport({ width: 1920, height: 1000 });
await q.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(300);

const closed = await q.evaluate(() => {
  const d = document.getElementById('dsDrawer');
  return [!!d, d ? getComputedStyle(d).display : '', d ? d.getAttribute('aria-hidden') : ''];
});
ok('C1 抽屉默认关闭', closed[0] && closed[1] === 'none' && closed[2] === 'true', JSON.stringify(closed));

await q.click('.ug-scard[data-sys="cecoder"] [data-preview]');
await wait(420);
const C = await q.evaluate(() => {
  const d = document.getElementById('dsDrawer');
  const pn = d.querySelector('.dsd-panel');
  const pr = pn.getBoundingClientRect();
  const panel = document.querySelector('.panel').getBoundingClientRect();
  const cs = e => getComputedStyle(e);
  return {
    open: d.classList.contains('is-open'),
    aria: d.getAttribute('aria-hidden'),
    w: Math.round(pr.width), h: Math.round(pr.height),
    rightGap: Math.round(panel.right - pr.right), topGap: Math.round(pr.top - panel.top),
    name: document.getElementById('dsdName').textContent,
    desc: document.getElementById('dsdDesc').textContent.length,
    badge: d.querySelector('.dsd-badge').textContent,
    headH: Math.round(d.querySelector('.dsd-head').getBoundingClientRect().height),
    icoSvg: !!d.querySelector('#dsdIco svg'),
    facts: [...d.querySelectorAll('.dsd-fact')].map(e => e.textContent.trim()),
    colors: d.querySelectorAll('.dsd-sw').length,
    color1: cs(d.querySelector('.dsd-sw-c')).backgroundColor,
    types: [...d.querySelectorAll('.dsd-tr')].map(e => cs(e.querySelector('.dsd-tr-s')).fontSize + '/' + cs(e.querySelector('.dsd-tr-s')).lineHeight + '·' + cs(e.querySelector('.dsd-tr-s')).fontWeight),
    radii: d.querySelectorAll('.dsd-r').length,
    gaps: d.querySelectorAll('.dsd-g').length,
    comps: d.querySelectorAll('.dsd-cbox').length,
    priBg: cs(d.querySelector('.dsd-btn.is-pri')).backgroundColor,
    cVar: cs(d).getPropertyValue('--dsd-c').trim(),
    mask: cs(d.querySelector('.dsd-mask')).backgroundColor,
    panelBg: cs(pn).backgroundColor,
    maskCursor: cs(d.querySelector('.dsd-mask')).position
  };
});
ok('C2 点预览打开抽屉', C.open && C.aria === 'false', JSON.stringify([C.open, C.aria]));
ok('C3 抽屉宽 800', C.w === 800, C.w);
ok('C4 抽屉贴窗口右侧', C.rightGap === 0 && C.topGap === 0, C.rightGap + '/' + C.topGap);
ok('C5 抽屉满高（1000 - 48 顶栏）', C.h === 952, C.h);
ok('C6 头部 56', C.headH === 56, C.headH);
ok('C7 标题 = Cecoder 设计系统', C.name === 'Cecoder 设计系统', C.name);
ok('C8 头部图标取卡片矢量', C.icoSvg === true);
ok('C9 「设计系统」标签', C.badge === '设计系统', C.badge);
ok('C10 简介有内容', C.desc > 20, C.desc);
ok('C11 概览 4 项', C.facts.length === 4, JSON.stringify(C.facts));
ok('C12 概览含主色', /#3770F7/.test(C.facts.join('|')), JSON.stringify(C.facts));
ok('C13 色板 6 色', C.colors === 6, C.colors);
ok('C14 首色块 = 主色', C.color1 === 'rgb(55, 112, 247)', C.color1);
ok('C15 字体 5 级', C.types.length === 5, JSON.stringify(C.types));
ok('C16 字体规格 20/28·500 起', C.types[0] === '20px/28px·500', C.types[0]);
ok('C17 圆角 5 档 / 间距 5 档', C.radii === 5 && C.gaps === 5, C.radii + '/' + C.gaps);
ok('C18 组件示例 4 卡', C.comps === 4, C.comps);
ok('C19 主按钮吃到 --dsd-c', C.priBg === 'rgb(55, 112, 247)' && C.cVar === '#3770F7', C.priBg + ' ' + C.cVar);
ok('C20 蒙层 rgba(0,0,0,.32)', C.mask === 'rgba(0, 0, 0, 0.32)', C.mask);
ok('C21 抽屉白底', C.panelBg === 'rgb(255, 255, 255)', C.panelBg);

/* 换一套：Arco */
await q.evaluate(() => { document.querySelector('[data-dsd-close]').click(); });
await wait(320);
const closedW = await q.evaluate(() => document.getElementById('dsDrawer').classList.contains('is-open'));
ok('C22 点关闭收起', closedW === false);
await q.click('.ug-scard[data-sys="arco"] [data-preview]');
await wait(380);
const C2 = await q.evaluate(() => {
  const d = document.getElementById('dsDrawer');
  const cs = e => getComputedStyle(e);
  return {
    name: document.getElementById('dsdName').textContent,
    cVar: cs(d).getPropertyValue('--dsd-c').trim(),
    color1: cs(d.querySelector('.dsd-sw-c')).backgroundColor,
    pri: cs(d.querySelector('.dsd-btn.is-pri')).backgroundColor,
    cur: document.getElementById('dsdDesc').textContent.slice(0, 8)
  };
});
ok('C23 换 Arco 后标题跟着变', C2.name === 'Arco Design', C2.name);
ok('C24 换 Arco 后主色 #165DFF', C2.cVar === '#165DFF' && C2.color1 === 'rgb(22, 93, 255)' && C2.pri === 'rgb(22, 93, 255)', JSON.stringify(C2));
ok('C25 简介也换', C2.cur === '字节跳动推出的企', C2.cur);

/* Esc 关闭 */
await q.keyboard.press('Escape');
await wait(260);
ok('C26 Esc 关闭抽屉', (await q.evaluate(() => document.getElementById('dsDrawer').classList.contains('is-open'))) === false);

/* 窄档：1440 下抽屉仍是 800，色板不溢出 */
await q.setViewport({ width: 1440, height: 900 });
await wait(300);
await q.click('.ug-scard[data-sys="cecoder"] [data-preview]');
await wait(360);
const C3 = await q.evaluate(() => {
  const d = document.getElementById('dsDrawer');
  const pn = d.querySelector('.dsd-panel');
  const body = d.querySelector('.dsd-body');
  return {
    w: Math.round(pn.getBoundingClientRect().width),
    vOver: body.scrollWidth > body.clientWidth + 1,
    sw: Math.round(d.querySelector('.dsd-sw').getBoundingClientRect().width),
    comps: getComputedStyle(d.querySelector('.dsd-comps')).gridTemplateColumns
  };
});
ok('C27 1440 档抽屉仍 800', C3.w === 800, C3.w);
ok('C28 抽屉体不横向溢出', C3.vOver === false);
ok('C29 组件示例两列', C3.comps.split(' ').length === 2, C3.comps);
ok('C30 无 JS 报错（ui）', q.__e.length === 0, q.__e.join(' | '));

console.log('\n' + pass + ' passed, ' + fail.length + ' failed');
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
