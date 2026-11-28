/* 第 105 轮验收：
   ① 「编辑 UI 元素」面板是浮层（和「页面层级和状态」同层语义）：不挤压内容区，
      点中栏空白处向右收回（带动画）
   ② 批注浮窗信息条（.ud-pop-meta）文字改正文色 #1F1F1F
   ③ 位置批注 / 框选 / 编辑 UI 元素三处多行文本框焦点态 = 蓝色粗描边（1.6px 主色）
   ④ 编辑模式下被点的 DOM 元素常驻实线选中框（hover 到别处也不丢）
   ⑤ 「自定义分辨率」下拉（稿 4168:56988，256×614） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1600, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(450);

const geo = () => p.evaluate(() => {
  const r = id => document.getElementById(id).getBoundingClientRect();
  const f = o => [Math.round(o.left), Math.round(o.top), Math.round(o.width), Math.round(o.height)];
  return { canvas: f(r('udCanvas')), scroll: f(r('udScroll')), board: f(r('udBoard')), ep: f(r('udEp')) };
});

/* ============================================================
   ⑤ 自定义分辨率下拉
   ============================================================ */
const R0 = await p.evaluate(() => ({
  hidden: document.getElementById('udResPop').hidden,
  expanded: document.getElementById('udRes').getAttribute('aria-expanded')
}));
ok('E0 初始：下拉收起、aria-expanded=false', R0.hidden === true && R0.expanded === 'false', JSON.stringify(R0));

await p.click('#udRes'); await wait(260);
const R1 = await p.evaluate(() => {
  const pop = document.getElementById('udResPop'), btn = document.getElementById('udRes');
  const cs = getComputedStyle(pop), r = pop.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const rows = [...pop.querySelectorAll('.ud-res-row')];
  const on = pop.querySelector('.ud-res-row.is-on');
  const onCS = getComputedStyle(on);
  return {
    hidden: pop.hidden, w: Math.round(r.width), h: Math.round(r.height),
    rightGap: Math.round(Math.abs(r.right - br.right)),
    topGap: Math.round(r.top - br.bottom),
    bg: cs.backgroundColor, blur: cs.backdropFilter || cs.webkitBackdropFilter,
    radius: cs.borderRadius, shadow: cs.boxShadow, pad: cs.padding,
    n: rows.length, rowH: Math.round(rows[0].getBoundingClientRect().height),
    groups: [...pop.querySelectorAll('.ud-res-g')].map(e => e.textContent),
    title: pop.querySelector('.ud-res-h').textContent,
    onText: on.querySelector('.ud-res-k').textContent, onVal: on.querySelector('.ud-res-v').textContent,
    onBg: onCS.backgroundColor, onShadow: onCS.boxShadow,
    onColor: getComputedStyle(on.querySelector('.ud-res-k')).color,
    onRadius: onCS.borderRadius
  };
});
ok('E1 点开：菜单 256×614（稿 4168:56988）', R1.hidden === false && R1.w === 256 && R1.h === 614, JSON.stringify([R1.w, R1.h]));
ok('E2 右对齐触发器、距触发器 6px', R1.rightGap <= 1 && R1.topGap === 6, JSON.stringify([R1.rightGap, R1.topGap]));
ok('E3 白 90% + blur15 + r8 + 0/8/32 投影', /rgba\(255, 255, 255, 0\.9\)/.test(R1.bg) && /blur\(15px\)/.test(R1.blur) && R1.radius === '8px' && /rgba\(0, 0, 0, 0\.12\) 0px 8px 32px/.test(R1.shadow), JSON.stringify([R1.bg, R1.blur, R1.radius]));
ok('E4 内距 12/8/8', R1.pad === '12px 8px 8px', R1.pad);
ok('E5 13 条预设（1 自定义 + 桌面 2 + 笔记本 5 + 手机 5）、行高 32、三个分组、标题「自定义」', R1.n === 13 && R1.rowH === 32 && R1.groups.join(',') === '桌面,笔记本,手机' && R1.title === '自定义', JSON.stringify([R1.n, R1.rowH, R1.groups, R1.title]));
ok('E6 默认选中「自定义分辨率 1440x900」：#F5F8FF + inset 1px #DAE4FE + 主色字 + r4', R1.onText === '自定义分辨率' && R1.onVal === '1440x900'
  && /rgb\(245, 248, 255\)/.test(R1.onBg) && /rgb\(218, 228, 254\) 0px 0px 0px 1px inset/.test(R1.onShadow)
  && /rgb\(55, 112, 247\)/.test(R1.onColor) && R1.onRadius === '4px', JSON.stringify([R1.onText, R1.onVal, R1.onBg, R1.onColor]));

/* 换选一条 */
const rowIdx = await p.evaluate(() => [...document.querySelectorAll('#udResPop .ud-res-row')].findIndex(e => e.querySelector('.ud-res-k').textContent === 'MacBook Air'));
const rb = await p.evaluate(i => { const r = document.querySelectorAll('#udResPop .ud-res-row')[i].getBoundingClientRect(); return { x: r.x + 60, y: r.y + r.height / 2 }; }, rowIdx);
await p.mouse.click(rb.x, rb.y); await wait(220);
const R2 = await p.evaluate(() => {
  const pop = document.getElementById('udResPop');
  const on = [...pop.querySelectorAll('.ud-res-row')].filter(e => e.classList.contains('is-on'));
  return { hidden: pop.hidden, n: on.length, name: on[0] ? on[0].querySelector('.ud-res-k').textContent : '',
    color: on[0] ? getComputedStyle(on[0].querySelector('.ud-res-k')).color : '',
    expanded: document.getElementById('udRes').getAttribute('aria-expanded') };
});
ok('E7 点某行 → 选中转移、菜单收起', R2.hidden === true && R2.n === 1 && R2.name === 'MacBook Air' && /rgb\(55, 112, 247\)/.test(R2.color) && R2.expanded === 'false', JSON.stringify(R2));

/* Esc 关闭 / 点外部关闭 */
await p.click('#udRes'); await wait(200);
await p.keyboard.press('Escape'); await wait(180);
const R3 = await p.evaluate(() => document.getElementById('udResPop').hidden);
await p.click('#udRes'); await wait(200);
await p.mouse.click(760, 950); await wait(180);
const R4 = await p.evaluate(() => document.getElementById('udResPop').hidden);
ok('E8 Esc 与点外部都能收起', R3 === true && R4 === true, JSON.stringify([R3, R4]));

/* ============================================================
   ① 编辑面板：浮层 + 点空白收回
   ============================================================ */
await p.click('#udEdit'); await wait(420);
const B = await geo();
const B1 = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas'), sc = document.getElementById('udScroll');
  return {
    pad: getComputedStyle(cv).paddingRight, cls: cv.className,
    scrollW: Math.round(sc.getBoundingClientRect().width),
    epVisible: document.getElementById('udEp').hidden === false,
    epAnim: getComputedStyle(document.getElementById('udEp')).animationName,
    otherMode: document.getElementById('udMark').getAttribute('aria-pressed')
  };
});
ok('A1 进编辑模式：面板可见、键 is-on、画布不再右缩（浮层）', B1.epVisible && B1.pad === '0px' && /is-edit/.test(B1.cls) && B1.otherMode === 'false', JSON.stringify(B1));
ok('A2 面板贴画布右缘、画板完整露在外面（panel.left ≥ board.right）', Math.abs((B.ep[0] + B.ep[2]) - (B.canvas[0] + B.canvas[2])) <= 1 && B.ep[0] >= B.board[0] + B.board[2] - 1, JSON.stringify([B.ep, B.board]));

/* 点中栏空白 → 收回 */
const blank = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas').getBoundingClientRect();
  const bad = ['udBoard', 'udEp', 'udPages'].map(id => document.getElementById(id));
  for (let y = cv.top + 8; y < cv.bottom - 8; y += 12) {
    for (let x = cv.left + 8; x < cv.right - 8; x += 12) {
      const t = document.elementFromPoint(x, y);
      if (!t) continue;
      if (bad.some(e => e && e.contains(t))) continue;
      if (t.closest('.float')) continue;
      return { x, y, tag: t.className || t.tagName };
    }
  }
  return null;
});
ok('A3 中栏能取到一处空白', !!blank, JSON.stringify(blank));
if (blank) {
  await p.mouse.click(blank.x, blank.y); await wait(320);
  const A4 = await p.evaluate(() => ({
    epHidden: document.getElementById('udEp').hidden,
    cls: document.getElementById('udCanvas').className,
    pressed: document.getElementById('udEdit').getAttribute('aria-pressed'),
    on: document.getElementById('udEdit').classList.contains('is-on'),
    pages: document.getElementById('udPages').className
  }));
  ok('A4 点中栏空白 → 面板向右收回、编辑键回弹、左列还原', A4.epHidden && !/is-edit/.test(A4.cls) && A4.pressed === 'false' && !A4.on && !/is-fold/.test(A4.pages), JSON.stringify(A4));
}

/* ============================================================
   ③ 文本域焦点：三处（编辑面板 / 区域批注 / 位置批注 —— 后两者共用 .ud-pop-ta）
   ============================================================ */
await p.click('#udEdit'); await wait(420);
await p.click('#udEpText'); await wait(200);
const F1 = await p.evaluate(() => {
  const ta = document.getElementById('udEpText');
  const cs = getComputedStyle(ta);
  return { shadow: cs.boxShadow, outline: cs.outlineStyle, radius: cs.borderRadius };
});
ok('D1 编辑面板文案框焦点 = 1.6px 主色粗描边', /rgb\(55, 112, 247\) 0px 0px 0px 1\.6px inset/.test(F1.shadow) && F1.outline === 'none', JSON.stringify(F1));

/* 框选 → 浮窗 */
await p.keyboard.press('Escape'); await wait(250);
await p.click('#udFrame'); await wait(250);
const E = await geo();
await p.mouse.move(E.board[0] + E.board[2] * 0.12, E.board[1] + E.board[3] * 0.12); await p.mouse.down();
await p.mouse.move(E.board[0] + E.board[2] * 0.42, E.board[1] + E.board[3] * 0.36, { steps: 6 }); await p.mouse.up(); await wait(320);
await p.click('#udPopTa'); await wait(200);
const F2 = await p.evaluate(() => {
  const ta = document.getElementById('udPopTa');
  const meta = document.querySelector('.ud-pop-meta');
  return { shadow: getComputedStyle(ta).boxShadow, metaColor: getComputedStyle(meta).color,
    metaText: meta.textContent.replace(/\s+/g, ' ').trim().slice(0, 24), popHidden: document.getElementById('udPop').hidden };
});
ok('D2 区域批注文本框焦点 = 1.6px 主色粗描边', /rgb\(55, 112, 247\) 0px 0px 0px 1\.6px inset/.test(F2.shadow), F2.shadow);
ok('D3 信息条文字是正文色 #1F1F1F（不再用次要灰）', F2.metaColor === 'rgb(31, 31, 31)', F2.metaColor);

/* ============================================================
   ④ DOM 选中态常驻
   ============================================================ */
await p.keyboard.press('Escape'); await wait(220);   /* 收浮窗 */
await p.click('#udFrame'); await wait(200);          /* 退框选 */
await p.click('#udEdit'); await wait(420);
const pts = await p.evaluate(() => {
  const its = document.querySelectorAll('.kb-item-t');
  const f = el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width * 0.35, y: r.y + r.height / 2 }; };
  return { a: f(its[0]), b: f(its[1]) };
});
await p.mouse.click(pts.a.x, pts.a.y); await wait(260);
await p.mouse.move(pts.b.x, pts.b.y); await wait(260);
const S = await p.evaluate(() => {
  const sel = document.getElementById('udDomSel'), hov = document.getElementById('udDomBox');
  const cs1 = getComputedStyle(sel), cs2 = getComputedStyle(hov);
  return {
    selHidden: sel.hidden, selStyle: cs1.borderTopStyle, selTag: sel.querySelector('.ud-dom-tag').textContent,
    hovHidden: hov.hidden, hovStyle: cs2.borderTopStyle, hovTag: hov.querySelector('.ud-dom-tag').textContent,
    selTop: Math.round(sel.getBoundingClientRect().top), hovTop: Math.round(hov.getBoundingClientRect().top)
  };
});
ok('C1 点过的元素常驻实线选中框', S.selHidden === false && S.selStyle === 'solid' && S.selTag === 'span.kb-item-t', JSON.stringify(S));
ok('C2 hover 到别的元素时，选中框没丢、另起一层虚线框（两块框位置不同）', S.hovHidden === false && S.hovStyle === 'dashed'
  && S.selHidden === false && S.hovTop !== S.selTop, JSON.stringify([S.hovTop, S.selTop, S.selStyle, S.hovStyle]));
/* 鼠标移出画板（到右侧面板）→ 悬停框收起，选中框仍在 */
const epC = await p.evaluate(() => { const r = document.getElementById('udEp').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 40 }; });
await p.mouse.move(epC.x, epC.y, { steps: 4 }); await wait(260);
const S2 = await p.evaluate(() => ({ hov: document.getElementById('udDomBox').hidden, sel: document.getElementById('udDomSel').hidden,
  dir: getComputedStyle(document.getElementById('udDomSel')).borderTopStyle }));
ok('C3 鼠标移出画板：悬停框收起，选中框仍常驻且是实线', S2.hov === true && S2.sel === false && S2.dir === 'solid', JSON.stringify(S2));

/* ---------- 收尾 ---------- */
ok('Z1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
await b.close();
console.log('\n第 105 轮：' + pass + ' 通过 / ' + fail.length + ' 失败');
if (fail.length) { console.log(fail.map(f => '  ✗ ' + f).join('\n')); process.exit(1); }
