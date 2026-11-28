/* 第 98 轮验收：
   ① 点缩放值「25%」直接回到 100%
   ② 工具条：自定义分辨率 + 缩放组挪到「批注」左侧，左右各一根竖线
   ③ 左列补左侧 1px 竖线 + 右侧投影
   ④ 折叠键：展开态用稿 4068:65598 的 direction/to-left（竖杠+左箭头），折叠态才是 32 白框面板键
   ⑤ 页面卡之间 4px；⑥ 树细节按稿 4068:65584（圆角 4 / 行内 8-26-44 / 圆点 32 + 白圈 / 两个页面组可展开折叠） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(400);

/* ---------- ② 工具条顺序 ---------- */
const A = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const qa = s => [...document.querySelectorAll(s)];
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const bar = q('.ud-bar'), right = q('.ud-right'), left = q('.ud-left');
  const kidName = e => e.classList.contains('ud-tools') ? 'tools' : e.classList.contains('ud-vsep') ? 'vsep'
    : e.classList.contains('ud-mid') ? 'mid' : e.classList.contains('ud-link') ? 'link' : e.className;
  return {
    rightKids: [...right.children].map(kidName),
    midKids: [...q('.ud-mid').children].map(e => e.id || e.className),
    midGap: cs(q('.ud-mid')).gap,
    vseps: qa('.ud-right > .ud-vsep').map(e => [box(e), cs(e).backgroundColor]),
    leftKids: [...left.children].map(e => e.id || e.className),
    bar: [bar.clientWidth, bar.scrollWidth],
    res: box(q('#udRes')), zoom: box(q('.ud-zoom')), note: box(q('#udNote')),
    zval: [q('#udZoomVal').tagName, box(q('#udZoomVal')), cs(q('#udZoomVal')).cursor, q('#udZoomVal').getAttribute('data-tip')]
  };
});
ok('B1 .ud-right 顺序 = 工具组 / 竖线 / 中间组 / 竖线 / 批注',
  A.rightKids.join('>') === 'tools>vsep>mid>vsep>link', A.rightKids.join('>'));
ok('B2 中间组里是「自定义分辨率 + 缩放组」，间距 8（第 105 轮：分辨率键外面包了 .ud-res-wrap 放下拉）',
  A.midKids.join('>') === 'udResWrap>ud-zoom' && A.midGap === '8px', JSON.stringify([A.midKids, A.midGap]));
ok('B3 两根竖线都在（1×16、#E5E5E5）', A.vseps.length === 2 && A.vseps.every(v => v[0][2] === 1 && v[0][3] === 16 && v[1] === 'rgb(229, 229, 229)'), JSON.stringify(A.vseps));
ok('B4 顺序落地：工具组 < 竖线 < 分辨率 < 缩放 < 竖线 < 批注',
  A.res[0] < A.zoom[0] && A.zoom[0] + A.zoom[2] < A.note[0], JSON.stringify([A.res, A.zoom, A.note]));
ok('B5 工具条不溢出（654 宽下 scrollWidth = clientWidth）', A.bar[0] === A.bar[1], JSON.stringify(A.bar));
ok('B6 左组只剩「版本」下拉', A.leftKids.join('>') === 'cds-dd ud-dd', A.leftKids.join('>'));

/* ---------- ① 缩放值点击回 100% ---------- */
ok('A1 缩放值是按钮、抓手光标、提示「恢复到 100%」', A.zval[0] === 'BUTTON' && A.zval[2] === 'pointer' && A.zval[3] === '恢复到 100%', JSON.stringify(A.zval));
const zoomNow = () => p.evaluate(() => ({ t: document.querySelector('#udZoomVal').textContent.trim(), s: getComputedStyle(document.querySelector('#udBoardWrap')).getPropertyValue('--ud-s').trim() }));
await p.click('#udZoomIn'); await p.click('#udZoomIn'); await wait(150);
const z2 = await zoomNow();
ok('A2 连点两次「+」到 75%', z2.t === '75%', z2.t);
await p.click('#udZoomVal'); await wait(150);
const z3 = await zoomNow();
ok('A3 点缩放值 → 100%（--ud-s = 1）', z3.t === '100%' && Math.abs(parseFloat(z3.s) - 1) < 1e-6, JSON.stringify(z3));
await p.click('#udZoomOut'); await wait(120);
ok('A4 之后再点「−」从 100% 继续减（75%）', (await zoomNow()).t === '75%', (await zoomNow()).t);
await p.click('#udZoomVal'); await wait(120);

/* ---------- ③ 左列左线 + 右投影 ---------- */
const C = await p.evaluate(() => {
  const e = document.querySelector('.ud-pages');
  return [getComputedStyle(e).boxShadow, getComputedStyle(e).backgroundColor];
});
ok('C1 左列自己画了左侧 1px 竖线（inset #EBECED）', /rgb\(235, 236, 237\) 1px 0px 0px 0px inset/.test(C[0]), C[0]);
ok('C2 仍有右侧 1px 分隔线（inset #E5E5E5）', /rgb\(229, 229, 229\) -1px 0px 0px 0px inset/.test(C[0]), C[0]);
ok('C3 右侧加投影（2px 0 10px rgba(0,0,0,.08)）', /rgba\(0, 0, 0, 0\.08\) 2px 0px 10px 0px/.test(C[0]), C[0]);

/* ---------- ④ 折叠键：展开态是 to-left ---------- */
const D = await p.evaluate(() => {
  const f = document.querySelector('#udFold');
  const cs = e => getComputedStyle(e);
  const ico = f.querySelector('.ico-fold'), exp = f.querySelector('.ico-expand');
  const r = ico.getBoundingClientRect();
  return {
    fold: [Math.round(r.width), Math.round(r.height), ico.getAttribute('viewBox'), cs(ico).display],
    exp: [cs(exp).display, exp.getAttribute('viewBox')],
    d: ico.querySelector('path').getAttribute('d')
  };
});
ok('D1 展开态显示 14×14 的 to-left 图标（竖杠 + 左箭头）', D.fold[0] === 14 && D.fold[1] === 14 && D.fold[2] === '0 0 14 14' && D.fold[3] === 'block', JSON.stringify(D.fold));
ok('D2 该图标是描边矢量（M3.1 2.9 竖杠 + 箭头两部分）', D.d.indexOf('M3.1 2.9V11.1') === 0 && D.d.indexOf('M11.5 7H6.2') > 0, D.d);
ok('D3 面板图标（折叠后的样子）此时隐藏', D.exp[0] === 'none', D.exp[0]);

/* ---------- ⑤⑥ 树细节 ---------- */
const E = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const txtX = el => { const r = document.createRange(); r.selectNodeContents(el); return Math.round(r.getBoundingClientRect().x); };
  const tree = q('.ud-tree'), row = q('.ud-tree-row'), body = q('.ud-pages-body');
  const rb = row.getBoundingClientRect();
  const st = q('.ud-tree .ud-state'), stb = st.getBoundingClientRect();
  const dot = st.querySelector('.ud-dot');
  const pg = [...document.querySelectorAll('.ud-page')];
  return {
    tree: [box(tree), cs(tree).borderRadius, cs(tree).boxShadow, cs(tree).padding],
    row: [box(row), [...row.children].map(c => Math.round(c.getBoundingClientRect().x - rb.x)),
      txtX(row.querySelector('.ud-tree-t')) - Math.round(rb.x), cs(q('.ud-tree-t')).fontWeight],
    body: [cs(body).gap, cs(body).padding],
    state: [cs(st).padding, cs(st).gap, Math.round(dot.getBoundingClientRect().x - stb.x), box(dot)[2], cs(dot).boxShadow],
    statesGap: cs(q('.ud-states')).gap,
    pgap: pg.map(e => box(e)),
    pgs: pg.map(e => { const r = e.querySelector('.ud-tree-row'); const b2 = r.getBoundingClientRect();
      return [Math.round(e.getBoundingClientRect().height), [...r.children].map(c => Math.round(c.getBoundingClientRect().x - b2.x)),
        txtX(r.querySelector('.ud-page-t')) - Math.round(b2.x), cs(r.querySelector('.ud-page-t')).fontWeight,
        r.getAttribute('aria-expanded'), cs(r.querySelector('.ud-chev-r')).transform]; })
  };
});
ok('E1 分组卡圆角 4、1px #EEEEEE、内距 8', E.tree[1] === '4px' && /rgb\(238, 238, 238\) 0px 0px 0px 1px inset/.test(E.tree[2]) && E.tree[3] === '8px', JSON.stringify(E.tree.slice(1)));
ok('E2 分组行 200×28，图标 8 / 26、文字 44、500 中粗', E.row[0][2] === 200 && E.row[0][3] === 28 && E.row[1].join(',') === '8,26,44' && E.row[2] === 44 && E.row[3] === '500', JSON.stringify(E.row));
ok('E3 状态行：左内距 32 + 圆点 6 + 间距 6 → 文字 44', E.state[0] === '0px 8px 0px 32px' && E.state[1] === '6px' && E.state[2] === 32 && E.state[3] === 6, JSON.stringify(E.state));
ok('E4 圆点带 1px 白圈（inset 0 0 0 1px #FFF）', /rgb\(255, 255, 255\) 0px 0px 0px 1px inset/.test(E.state[4]), E.state[4]);
ok('E5 卡片之间 4px、状态列表行距 4px', E.body[0] === '4px' && E.statesGap === '4px', JSON.stringify([E.body[0], E.statesGap]));
ok('E6 左列内容顶到稿位（体 padding 9/12/12）', E.body[1] === '9px 12px 12px', E.body[1]);
ok('E7 两个页面卡 216×44，行内 8/26/44、文字 400', E.pgs.length === 2 && E.pgs.every(v => v[0] === 44 && v[1].join(',') === '8,26,44' && v[2] === 44 && v[3] === '400'), JSON.stringify(E.pgs));
ok('E8 页面卡默认收起（aria-expanded=false、箭头不转）', E.pgs.every(v => v[4] === 'false' && v[5] === 'none'), JSON.stringify(E.pgs.map(v => [v[4], v[5]])));

/* 展开 / 收起 */
await p.click('#udPgGmail'); await wait(220);
const G = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const card = q('#udPgGmail').closest('.ud-page'), list = q('#udPgGmailStates');
  const cs = e => getComputedStyle(e);
  return { h: Math.round(card.getBoundingClientRect().height), hidden: list.hidden, disp: cs(list).display,
    n: list.children.length, exp: q('#udPgGmail').getAttribute('aria-expanded'),
    tr: cs(q('#udPgGmail .ud-chev-r')).transform, txt: [...list.children].map(e => e.textContent.trim()) };
});
ok('F1 展开 Gmail 组：状态列表显示 2 行、aria-expanded=true', G.hidden === false && G.disp !== 'none' && G.n === 2 && G.exp === 'true', JSON.stringify([G.hidden, G.disp, G.n, G.exp]));
ok('F2 展开后卡高 = 8+28+4+2×28+4+8 = 108', G.h === 108, G.h);
ok('F3 展开后箭头转 90°（朝下）', G.tr !== 'none', G.tr);
ok('F4 子状态文案（占位，等稿）', G.txt.join('/') === '默认/加载失败', G.txt.join('/'));

await p.click('#udPgRecover'); await wait(200);
const H = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  return { h: Math.round(q('#udPgRecover').closest('.ud-page').getBoundingClientRect().height),
    gmailH: Math.round(q('#udPgGmail').closest('.ud-page').getBoundingClientRect().height),
    recExp: q('#udPgRecover').getAttribute('aria-expanded') };
});
ok('F5 第二个组也能展开，且不影响第一个组', H.h === 108 && H.gmailH === 108 && H.recExp === 'true', JSON.stringify(H));

await p.click('#udPgGmail'); await wait(420);
const I = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  return { h: Math.round(q('#udPgGmail').closest('.ud-page').getBoundingClientRect().height),
    fold: q('#udPgGmailStates').classList.contains('is-fold'), exp: q('#udPgGmail').getAttribute('aria-expanded'),
    tr: getComputedStyle(q('#udPgGmail .ud-chev-r')).transform };
});
/* 第 125/126 轮：折叠态从 hidden 换成 .is-fold，箭头折叠时缩一档（scale .86）、不旋转 */
ok('F6 再点收起：回到 44 高、箭头缩回不旋转',
  I.h === 44 && I.fold === true && I.exp === 'false' && /matrix\(0\.86, 0, 0, 0\.86/.test(I.tr), JSON.stringify(I));

/* 折叠往返后仍正常 */
await p.click('#udFold'); await wait(300);
const J = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  return [cs(q('#udFold .ico-fold')).display, cs(q('#udFold .ico-expand')).display,
    Math.round(q('.ud-pages').getBoundingClientRect().width), q('#udZoomVal').textContent.trim()];
});
await p.click('#udFold'); await wait(300);
const K = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const cs = e => getComputedStyle(e);
  return [cs(q('#udFold .ico-fold')).display, cs(q('#udFold .ico-expand')).display,
    Math.round(q('.ud-pages').getBoundingClientRect().width), document.getElementById('udFold').getAttribute('data-tip')];
});
ok('G1 折叠后换面板图标、收成 32', J[0] === 'none' && J[1] === 'block' && J[2] === 32, JSON.stringify(J));
ok('G2 再展开还原 to-left 图标与 240 宽', K[0] === 'block' && K[1] === 'none' && K[2] === 240 && K[3] === '折叠', JSON.stringify(K));

ok('Z1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));

console.log('\n第 98 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(f => console.log(' - ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
