/* 第 93 轮验收：UI 生成完成页（独立页 cecoder-uidone.html）
   页签稿 4068:64861（画板 / 页面关系 / 页面预览 / 竖线 / ＋）
   工具条稿 4068:72262（1133×44：版本 / 分辨率 / 缩放组 + 居中画板名 + 5 工具键 + 批注） */
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
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(300);
const menu = await p.$('.menu-btn');
if (menu) { await menu.click(); await wait(450); }

/* ---------- A 页面骨架与页签 ---------- */
const g = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const cs = e => getComputedStyle(e);
  const rel = e => { const r = e.getBoundingClientRect(), pr = q('.panel-main').getBoundingClientRect(); return [Math.round(r.x - pr.x), Math.round(r.y - pr.y)]; };
  const bar = q('.ud-bar'), tabs = q('.ud-tabs');
  const sel = qa('.ud-sel'), zoom = q('.ud-zoom'), title = q('.ud-title');
  const tools = qa('.ud-tool'), link = q('.ud-link');
  const tab = qa('.ud-tabs .tk-tab');
  return {
    page: document.body.getAttribute('data-page'),
    title: document.title,
    tabsBar: [box(tabs), rel(q('.tk-tabs-l'))],
    bar: box(bar), barRel: rel(bar), barBg: cs(bar).backgroundColor, barSh: cs(bar).boxShadow,
    leftRel: rel(q('.ud-left')), leftW: Math.round(q('.ud-left').getBoundingClientRect().width),
    sels: sel.map(e => [box(e), rel(e), cs(e).backgroundColor, cs(e).boxShadow, cs(e).paddingLeft, cs(e).fontSize + '/' + cs(e).lineHeight]),
    selsk: cs(q('.ud-sel-k')).color, selv: cs(q('.ud-sel-v')).color,
    caret: [...document.querySelectorAll('.ud-caret')].map(e => e.querySelector('path').getAttribute('fill')),
    desktop: q('.ud-desktop').querySelector('path').getAttribute('fill'),
    zoom: [box(zoom), rel(zoom)],
    zval: [box(q('.ud-zval')), q('.ud-zval').textContent.trim(), cs(q('.ud-zval')).fontSize],
    minus: q('#udZoomOut').querySelector('path').getAttribute('fill'),
    plus: q('#udZoomIn').querySelector('path').getAttribute('fill'),
    titleBox: box(title), titleRel: rel(title), titleF: cs(title).fontSize + '/' + cs(title).fontWeight + '/' + cs(title).lineHeight, titleC: cs(title).color,
    rightRel: rel(q('.ud-right')), rightW: Math.round(q('.ud-right').getBoundingClientRect().width),
    tools: tools.map(box), toolsGap: Math.round(tools[1].getBoundingClientRect().x - tools[0].getBoundingClientRect().right),
    vsep: [box(q('.ud-vsep')), cs(q('.ud-vsep')).backgroundColor],
    link: [box(link), link.textContent.trim(), cs(link).paddingLeft, cs(link).fontSize + '/' + cs(link).lineHeight],
    canvas: box(q('.ud-canvas')),
    tabsInfo: tab.map(t => [t.textContent.trim(), box(t), cs(t).color, cs(t).fontWeight, cs(t).paddingLeft, cs(t).boxShadow, cs(t).backgroundColor]),
    tabIco: (() => { const e = q('.ud-tabs .tk-tab.is-on svg path'); return e ? (e.getAttribute('fill') === 'currentColor' ? cs(q('.ud-tabs .tk-tab.is-on')).color : e.getAttribute('fill')) : null; })(),
    over: document.documentElement.scrollWidth - innerWidth,
  };
});
ok('A1 独立页：data-page=ui、标题「Cecoder · UI生成完成」', g.page === 'ui' && /UI生成完成/.test(g.title), g.page + ' ' + g.title);
ok('A2 保留工序资产页签条（40 高，紧贴其下的工具条）', g.tabsBar[0][3] === 40 && g.bar[1] === g.tabsBar[0][1] + 40, JSON.stringify(g.tabsBar) + ' bar=' + JSON.stringify(g.bar));
ok('A3 三颗页签：画板 / 页面关系 / 页面预览', g.tabsInfo.map(t => t[0]).join('|') === '画板|页面关系|页面预览', JSON.stringify(g.tabsInfo.map(t => t[0])));
const t0 = g.tabsInfo[0], t1 = g.tabsInfo[1], t2 = g.tabsInfo[2];
ok('A4 选中「画板」70×28：白底 + 1px #B4C9FC + 主色文字、内距 12', t0[1][2] === 70 && t0[1][3] === 28 && t0[6] === 'rgb(255, 255, 255)' && /rgb\(180, 201, 252\) 0px 0px 0px 1px inset/.test(t0[5]) && t0[2] === 'rgb(55, 112, 247)' && t0[4] === '12px', JSON.stringify(t0));
ok('A5 选中页签带 14×14 主色图标（fill=currentColor，继承主色 #3770F7）', g.tabIco === 'rgb(55, 112, 247)', String(g.tabIco));
ok('A6 「页面关系」「页面预览」各 72×28：透明底、正文色中粗、内距 8', t1[1][2] === 72 && t2[1][2] === 72 && t1[4] === '8px' && t2[4] === '8px' && t1[2] === 'rgb(31, 31, 31)' && t1[3] === '500' && t2[2] === 'rgb(31, 31, 31)', JSON.stringify(t1) + ' ' + JSON.stringify(t2));

/* ---------- B 工具条 ---------- */
ok('B1 工具条 44 高、白底、底边 1px #E5E5E5，紧贴页签条下沿', g.bar[3] === 44 && g.barBg === 'rgb(255, 255, 255)' && /rgb\(229, 229, 229\) 0px -1px 0px 0px inset/.test(g.barSh) && g.bar[1] === g.tabsBar[0][1] + 40, JSON.stringify(g.bar) + ' tabs=' + g.tabsBar[0][1]);
ok('B2 左侧内距 19、三组总宽 386（129 + 134 + 107 + 2×8）', g.leftRel[0] === 19 && g.leftW === 386, g.leftRel[0] + ' ' + g.leftW);
ok('B3 版本下拉 129×28：白底 + 1px #E5E5E5、内距 8、13/22', g.sels[0][0][2] === 129 && g.sels[0][0][3] === 28 && g.sels[0][2] === 'rgb(255, 255, 255)' && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(g.sels[0][3]) && g.sels[0][4] === '8px' && g.sels[0][5] === '13px/22px', JSON.stringify(g.sels[0]));
ok('B4「版本：」#6B6B6B +「当前设计」#1F1F1F', g.selsk === 'rgb(107, 107, 107)' && g.selv === 'rgb(31, 31, 31)', g.selsk + ' / ' + g.selv);
ok('B5 分辨率下拉 134×28（14 图标 + 4 + 文字 + 8 + 14 箭头）', g.sels[1][0][2] === 134 && g.sels[1][0][3] === 28, JSON.stringify(g.sels[1][0]));
ok('B6 缩放组 107×28：20 减 / 43 数值 / 20 加，图标 14', g.zoom[0][2] === 107 && g.zoom[0][3] === 28 && g.zval[0][2] === 43, JSON.stringify(g.zoom[0]) + ' ' + JSON.stringify(g.zval));
ok('B7 画板名「账密登录」52×20、13/500/20、水平居中于工具条', g.titleBox[2] === 52 && g.titleBox[3] === 20 && g.titleF === '13px/500/20px' && Math.abs((g.titleBox[0] + 26) - (g.bar[0] + g.bar[2] / 2)) <= 1, JSON.stringify(g.titleBox) + ' ' + g.titleF);
ok('B8 右侧 5 个 28×28 工具键、间距 4', g.tools.length === 5 && g.tools.every(t => t[2] === 28 && t[3] === 28) && g.toolsGap === 4, JSON.stringify(g.tools) + ' gap=' + g.toolsGap);
ok('B9 竖线 1×16 #E5E5E5 +「批注 (2)」63×28、内距 8、13/22', g.vsep[0][2] === 1 && g.vsep[0][3] === 16 && g.vsep[1] === 'rgb(229, 229, 229)' && g.link[0][2] === 63 && g.link[0][3] === 28 && g.link[1] === '批注 (2)' && g.link[2] === '8px' && g.link[3] === '13px/22px', JSON.stringify(g.vsep) + ' ' + JSON.stringify(g.link));
ok('B10 右侧组靠右（右内距 20）', Math.abs((g.bar[2] - 20) - (g.rightRel[0] + g.rightW)) <= 1, g.rightRel[0] + '+' + g.rightW + ' vs ' + (g.bar[2] - 20));
ok('B11 图标色：工具键 #1F1F1F / 桌面 #6B6B6B / 减加 #6B6B6B / 箭头 #868686', g.desktop === '#6B6B6B' && g.minus === '#6B6B6B' && g.plus === '#6B6B6B' && g.caret.every(c => c === '#868686'), [g.desktop, g.minus, g.plus, g.caret].join(' '));
ok('B12 画布区从工具条下沿开始、占满剩余高度', g.canvas[1] === g.bar[1] + 44 && g.canvas[3] > 500, JSON.stringify(g.canvas));

/* ---------- C 交互：缩放 ---------- */
const z0 = await p.evaluate(() => document.querySelector('.ud-zval').textContent.trim());
await p.click('#udZoomIn'); await wait(120);
const z1 = await p.evaluate(() => ({ t: document.querySelector('.ud-zval').textContent.trim(), v: getComputedStyle(document.querySelector('.ud-canvas')).getPropertyValue('--ud-zoom') }));
await p.click('#udZoomOut'); await p.click('#udZoomOut'); await wait(120);
const z2 = await p.evaluate(() => document.querySelector('.ud-zval').textContent.trim());
ok('C1 默认 50%、点「＋」到 75%（--ud-zoom 1.5）', z0 === '50%' && z1.t === '75%' && z1.v.trim() === '1.5', z0 + ' → ' + JSON.stringify(z1));
ok('C2 点两次「−」回到 25%', z2 === '25%', z2);
for (let i = 0; i < 8; i++) await p.click('#udZoomIn');
await wait(120);
const z3 = await p.evaluate(() => document.querySelector('.ud-zval').textContent.trim());
ok('C3 上限 200% 封顶', z3 === '200%', z3);
for (let i = 0; i < 10; i++) await p.click('#udZoomOut');
await wait(120);
const z4 = await p.evaluate(() => document.querySelector('.ud-zval').textContent.trim());
ok('C4 下限 25% 封底', z4 === '25%', z4);

/* ---------- D 响应式 ---------- */
const sizes = [1152, 1280, 1440, 1920];
const resp = [];
for (const w of sizes) {
  const q = await b.newPage();
  await q.setViewport({ width: w, height: 900 });
  await q.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
  await wait(260);
  const m = await q.$('.menu-btn'); if (m) { await m.click(); await wait(420); }
  resp.push(await q.evaluate(() => {
    const pr = document.querySelector('.panel-main').getBoundingClientRect();
    const bar = document.querySelector('.ud-bar');
    const right = document.querySelector('.ud-right').getBoundingClientRect();
    const left = document.querySelector('.ud-left').getBoundingClientRect();
    const titleVis = getComputedStyle(document.querySelector('.ud-title')).display !== 'none';
    return {
      over: document.documentElement.scrollWidth - innerWidth,
      pm: Math.round(pr.width),
      barOver: Math.round(bar.scrollWidth - bar.clientWidth),
      noOverlap: Math.round(right.x - left.right) >= 0,
      titleVis,
      linkVis: getComputedStyle(document.querySelector('.ud-link')).display !== 'none',
      toolsVis: [...document.querySelectorAll('.ud-tool')].filter(e => getComputedStyle(e).display !== 'none').length,
    };
  }));
  await q.close();
}
ok('D1 1152~1920 四档：无横向溢出、左右两组不重叠、工具条自身不溢出', resp.every(r => r.over <= 0 && r.barOver <= 0 && r.noOverlap), JSON.stringify(resp));
ok('D2 窄档分级让位：1133 显标题与批注 / 654 收标题留批注 / 更窄收批注与次要键', resp[3].titleVis && resp[3].linkVis && !resp[2].titleVis && resp[2].linkVis && resp[2].toolsVis === 5 && resp[0].linkVis === false && resp[0].toolsVis === 3, JSON.stringify(resp.map(r => [r.pm, r.titleVis, r.linkVis, r.toolsVis])));

ok('E1 无 console / pageerror', p.__e.length === 0, JSON.stringify(p.__e));

console.log('');
console.log(fail.length ? 'FAIL:\n' + fail.map(s => ' · ' + s).join('\n') : '');
console.log(`第 93 轮：${pass}/${pass + fail.length}`);
await b.close();
process.exit(fail.length ? 1 : 0);
