/* 第 104 轮验收：
   ① 「编辑 UI 元素」→ 画布右侧弹 256 面板（稿 4068:60295），画板不被盖、左列自动折叠
   ② 画布内 hover = 蓝色虚线 1.6px + 蓝标签（稿 4068:59031）；点选 = 实线（稿 4068:59030）
   ③ 面板灌真实样式，改文案/颜色/字号/圆角实时作用到 DOM（容器文案不给改，保护结构）
   ④ 框选松手即弹「区域批注」320×362 浮窗（稿 4068:60916），发送直接落到右栏对话
   ⑤ 「批注」模式点画布任意点 → 位置批注浮窗 + 编号序号点（稿 4068:60781）
   ⑥ 三模式互斥；Esc 先关浮窗再退模式 */
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
  return { canvas: f(r('udCanvas')), scroll: f(r('udScroll')), board: f(r('udBoard')), ep: f(r('udEp')), pop: f(r('udPop')) };
});
/* 在画板内按比例取一个真实命中点（避开浮层） */
const boardPoint = async (fx, fy) => {
  const G = await geo();
  return { x: G.board[0] + G.board[2] * fx, y: G.board[1] + G.board[3] * fy };
};

/* ---------- A 初始 ---------- */
const A0 = await p.evaluate(() => ({
  epHidden: document.getElementById('udEp').hidden,
  markPressed: document.getElementById('udMark').getAttribute('aria-pressed'),
  editPressed: document.getElementById('udEdit').getAttribute('aria-pressed'),
  popHidden: document.getElementById('udPop').hidden,
  popParent: document.getElementById('udPop').parentNode.tagName
}));
ok('A1 初始：面板隐藏、两个键未按下、浮窗隐藏', A0.epHidden && A0.markPressed === 'false' && A0.editPressed === 'false' && A0.popHidden, JSON.stringify(A0));
ok('A2 浮窗挂在 body 上（不被祖先 transform/backdrop 影响 fixed）', A0.popParent === 'BODY', A0.popParent);

/* ---------- B 编辑 UI 元素面板 ---------- */
await p.click('#udEdit'); await wait(400);
const B1 = await geo();
const B1s = await p.evaluate(() => {
  const ep = document.getElementById('udEp');
  const cs = getComputedStyle(ep);
  const cv = document.getElementById('udCanvas');
  const t = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().height : -1; };
  return {
    w: cs.width, bg: cs.backgroundColor, blur: cs.backdropFilter || cs.webkitBackdropFilter,
    shadow: cs.boxShadow, pad: cs.padding, z: cs.zIndex,
    editOn: ep.hidden === false && document.getElementById('udEdit').classList.contains('is-on')
      && document.getElementById('udEdit').getAttribute('aria-pressed') === 'true',
    folded: cv.className,
    /* 注意：cs 是面板的 computedStyle，画布的 padding 要单独取 */
    cvPad: getComputedStyle(document.getElementById('udCanvas')).paddingRight,
    hHead: t('.ud-ep-head'), hObj: t('.ud-ep-obj'), hTa: t('.ud-ep-ta'),
    hColor: t('.ud-ep-color'), hNum: t('.ud-ep-num'),
    labels: [...document.querySelectorAll('.ud-ep-lb')].map(e => e.textContent)
  };
});
ok('B1 面板 256 宽、白 80% + blur15、左线+左投影', B1s.w === '256px' && /rgba\(255, 255, 255, 0\.8\)/.test(B1s.bg) && /blur\(15px\)/.test(B1s.blur) && /rgb\(235, 236, 237\) 1px 0px 0px 0px inset/.test(B1s.shadow), JSON.stringify([B1s.w, B1s.bg, B1s.blur, B1s.shadow]));
ok('B2 键 is-on + aria-pressed', B1s.editOn, B1s.editOn);
ok('B3 编辑模式不再折叠左列（第 106 轮：面板是纯浮层，不腾宽度）', /is-edit/.test(B1s.folded) && !/is-folded/.test(B1s.folded), B1s.folded);
ok('B4 面板是浮层：画布不再右缩（padding 0），面板贴画布右缘', B1s.cvPad === '0px'
  && Math.abs((B1.ep[0] + B1.ep[2]) - (B1.canvas[0] + B1.canvas[2])) <= 1
  && Math.abs(B1.ep[2] - 256) <= 1, JSON.stringify([B1s.cvPad, B1.canvas, B1.ep]));
/* 第 106 轮：面板改成「悬浮于 html 画布之上」，允许压住画板右缘（不再要求排在画板外侧） */
ok('B5 面板悬浮在画布之上（z-index 6，可与画板重叠）', parseInt(B1s.z, 10) === 6 && B1.ep[0] < B1.canvas[0] + B1.canvas[2], JSON.stringify([B1s.z, B1.ep, B1.board]));
ok('B6 结构尺寸：头 22 / 编辑对象 44 / 文案 64 / 色块行 28 / 数字行 28', B1s.hHead === 22 && B1s.hObj === 44 && B1s.hTa === 64 && B1s.hColor === 28 && B1s.hNum === 28, JSON.stringify([B1s.hHead, B1s.hObj, B1s.hTa, B1s.hColor, B1s.hNum]));
ok('B7 五组标签齐（文案/文字颜色/背景颜色/字号/圆角度）', B1s.labels.join(',') === '文案,文字颜色,背景颜色,字号,圆角度', B1s.labels.join(','));

/* hover → 虚线 + 标签 */
let pt = await boardPoint(0.30, 0.36);
await p.mouse.move(pt.x, pt.y); await wait(300);
const C1 = await p.evaluate(() => {
  const d = document.getElementById('udDomBox');
  const cs = getComputedStyle(d);
  return { hidden: d.hidden, style: cs.borderTopStyle, width: cs.borderTopWidth, color: cs.borderTopColor, sel: d.classList.contains('is-sel'),
    tag: document.getElementById('udDomTag').textContent, tagBg: getComputedStyle(document.getElementById('udDomTag')).backgroundColor };
});
ok('C1 hover 显示虚线 1.6px 主色框', !C1.hidden && C1.style === 'dashed' && /rgb\(55, 112, 247\)/.test(C1.color) && parseFloat(C1.width) > 0, JSON.stringify(C1));
ok('C2 标签写出 DOM 名称（tag.class）', /^[a-z]+(\.[a-z0-9_-]+)?$/i.test(C1.tag) && C1.tag.length > 2, C1.tag);
ok('C3 标签主色底（稿 4068:59031）', /rgb\(55, 112, 247\)/.test(C1.tagBg), C1.tagBg);

/* 点选 → 实线 + 灌面板 */
await p.mouse.click(pt.x, pt.y); await wait(350);
const C2 = await p.evaluate(() => {
  /* 第 105 轮：选中态从 hover 框拆出来，落在 #udDomSel 上（实线、常驻） */
  const d = document.getElementById('udDomSel');
  const cs = getComputedStyle(d);
  return { style: cs.borderTopStyle, sel: d.classList.contains('is-sel'),
    tag: document.getElementById('udEpTag').textContent,
    fg: document.getElementById('udEpFg').value,
    bg: document.getElementById('udEpBg').value,
    size: document.getElementById('udEpSize').value,
    radius: document.getElementById('udEpRadius').value,
    taDisabled: document.getElementById('udEpText').disabled,
    visible: !d.hidden,
    hoverStyle: cs.borderTopStyle === 'solid' };
});
ok('C4 点选改实线（稿 4068:59030）', C2.style === 'solid' && C2.sel, JSON.stringify([C2.style, C2.sel]));
ok('C4b 选中框可见（不是 hidden）', C2.visible, C2.visible);
ok('C5 面板灌入选中元素名', C2.tag === C1.tag, C2.tag + ' vs ' + C1.tag);
ok('C6 灌入真实文字色 / 背景色 / 字号 / 圆角', /^#[0-9A-F]{6}$/.test(C2.fg) && (/^#[0-9A-F]{6}$/.test(C2.bg) || C2.bg === 'transparent') && /^\d+$/.test(C2.size) && /^\d+$/.test(C2.radius), JSON.stringify([C2.fg, C2.bg, C2.size, C2.radius]));
ok('C7 容器上没有直接文本时文案框禁用（防止 textContent 冲掉子结构）', C2.taDisabled === true, C2.taDisabled);

/* 改字号 / 圆角 / 文字颜色 → 真作用到 DOM */
const C3 = await p.evaluate(() => {
  const el = document.querySelector('.ud-dom.is-sel') ? document.querySelector('.ud-dom.is-sel') : null;
  return el ? el.getBoundingClientRect().width : 0;
});
const before = await p.evaluate(() => {
  const t = document.getElementById('udEpTag').textContent;
  const sel = [...document.querySelectorAll('#udBoard *')].find(e => {
    const cls = (e.getAttribute('class') || '').split(/\s+/)[0];
    return cls && (e.tagName.toLowerCase() + '.' + cls) === t;
  });
  return sel ? { fs: sel.style.fontSize, color: sel.style.color, r: sel.style.borderRadius } : null;
});
await p.evaluate(() => {
  const s = document.getElementById('udEpSize');
  s.value = '20'; s.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.evaluate(() => {
  const s = document.getElementById('udEpRadius');
  s.value = '12'; s.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.evaluate(() => {
  const s = document.getElementById('udEpFg');
  s.value = '#F44A3F'; s.dispatchEvent(new Event('input', { bubbles: true }));
});
await wait(200);
const after = await p.evaluate(() => {
  const t = document.getElementById('udEpTag').textContent;
  const sel = [...document.querySelectorAll('#udBoard *')].find(e => {
    const cls = (e.getAttribute('class') || '').split(/\s+/)[0];
    return cls && (e.tagName.toLowerCase() + '.' + cls) === t;
  });
  return sel ? { fs: sel.style.fontSize, color: sel.style.color, r: sel.style.borderRadius } : null;
});
ok('C8 改字号 → 元素 fontSize 20px', after && after.fs === '20px', JSON.stringify(after));
ok('C9 改圆角度 → 元素 borderRadius 12px', after && after.r === '12px', JSON.stringify(after));
ok('C10 改文字颜色 → 元素 color #F44A3F', after && /244, 74, 63|#F44A3F/i.test(after.color.replace('rgb(244, 74, 63)', '#F44A3F')), JSON.stringify(after));
ok('C11 改样式后选中框还在', (await p.evaluate(() => !document.getElementById('udDomSel').hidden)) === true, '');

/* 退出编辑 */
await p.click('#udEdit'); await wait(350);
const C4 = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas');
  return { epHidden: document.getElementById('udEp').hidden, boxHidden: document.getElementById('udDomSel').hidden,
    cls: cv.className, pad: getComputedStyle(cv).paddingRight,
    pages: document.getElementById('udPages').className };
});
ok('D1 再点键退出：面板/框隐藏、is-edit 撤掉、padding 归零', C4.epHidden && C4.boxHidden && !/is-edit/.test(C4.cls) && C4.pad === '0px', JSON.stringify(C4));
ok('D2 退出后左列恢复展开（不残留 is-fold）', !/is-fold/.test(C4.pages), C4.pages);

/* ---------- E 框选 → 区域批注浮窗 ---------- */
await p.click('#udFrame'); await wait(250);
const E0 = await geo();
const a = { x: E0.board[0] + E0.board[2] * 0.42, y: E0.board[1] + E0.board[3] * 0.12 };
const c = { x: E0.board[0] + E0.board[2] * 0.72, y: E0.board[1] + E0.board[3] * 0.30 };
await p.mouse.move(a.x, a.y); await p.mouse.down();
await p.mouse.move(c.x, c.y, { steps: 10 }); await p.mouse.up();
await wait(420);
const E1 = await p.evaluate(() => {
  const pop = document.getElementById('udPop');
  const cs = getComputedStyle(pop);
  const r = pop.getBoundingClientRect();
  const box = document.querySelector('.ud-mq');
  const br = box.getBoundingClientRect();
  return {
    hidden: pop.hidden, w: Math.round(r.width), h: Math.round(r.height),
    title: document.getElementById('udPopTitle').textContent,
    pos: document.getElementById('udPopPos').textContent,
    size: document.getElementById('udPopSize').textContent,
    sizeHidden: document.getElementById('udPopSize').hidden,
    btnCancel: document.getElementById('udPopCancel').textContent.trim(),
    btnSend: document.getElementById('udPopSend').textContent.trim(),
    bg: cs.backgroundColor, blur: cs.backdropFilter || cs.webkitBackdropFilter,
    radius: cs.borderRadius, shadow: cs.boxShadow,
    boxNo: (box.querySelector('.ud-mq-no') || {}).textContent,
    noOverlap: r.left >= br.left + br.width - 1 || r.right <= br.left + 1,
    metaH: document.getElementById('udPopSize').closest('.ud-pop-meta').getBoundingClientRect().height,
    taH: document.getElementById('udPopTa').getBoundingClientRect().height,
    headH: document.querySelector('.ud-pop-head').getBoundingClientRect().height
  };
});
ok('E1 松手即弹浮窗', E1.hidden === false, E1.hidden);
ok('E2 浮窗 320×362（稿 4068:60916）', E1.w === 320 && Math.abs(E1.h - 362) <= 3, JSON.stringify([E1.w, E1.h]));
ok('E3 标题「区域批注」+ 坐标 + 尺寸', E1.title === '区域批注' && /^区域：X \d+，Y \d+$/.test(E1.pos) && /\d+ × \d+ px$/.test(E1.size) && !E1.sizeHidden, JSON.stringify([E1.title, E1.pos, E1.size]));
ok('E4 按钮「取消 / 发送给 AI」', E1.btnCancel === '取消' && E1.btnSend === '发送给 AI', E1.btnCancel + ' / ' + E1.btnSend);
/* 第 106 轮：浮窗白底 90% → 96%（用户嫌太透） */
ok('E5 白 96% + blur15 + r8 + 0/8/32 投影', /rgba\(255, 255, 255, 0\.96\)/.test(E1.bg) && /blur\(15px\)/.test(E1.blur) && E1.radius === '8px' && /rgba\(0, 0, 0, 0\.12\) 0px 8px 32px/.test(E1.shadow), JSON.stringify([E1.bg, E1.blur, E1.radius]));
ok('E6 浮窗不压住红框（贴框右侧或翻到左侧）', E1.noOverlap, E1.noOverlap);
ok('E7 内部尺寸：头 22 / 信息条 40 / 文本域 128', E1.headH === 22 && E1.metaH === 40 && E1.taH === 128, JSON.stringify([E1.headH, E1.metaH, E1.taH]));
ok('E8 红框带序号', E1.boxNo === '1', E1.boxNo);

/* 发送 → 右栏消息 */
const M0 = await p.evaluate(() => document.querySelectorAll('#aiScroll .ai-msg.is-user').length);
await p.type('#udPopTa', '把这个区域的头像换成公司 logo');
await wait(120);
await p.click('#udPopSend'); await wait(400);
const E2 = await p.evaluate(() => {
  const list = document.querySelectorAll('#aiScroll .ai-msg.is-user');
  const last = list[list.length - 1];
  const note = last.querySelector('.ud-msg-note');
  return { n: list.length, txt: last.querySelector('.ai-bubble').textContent,
    note: note ? note.textContent : '', popHidden: document.getElementById('udPop').hidden,
    boxes: document.querySelectorAll('.ud-mq').length,
    scrolled: document.getElementById('aiScroll').scrollHeight - document.getElementById('aiScroll').scrollTop - document.getElementById('aiScroll').clientHeight < 40 };
});
ok('E9 点「发送给 AI」直接多发一条用户消息', E2.n === M0 + 1, E2.n + ' vs ' + M0);
ok('E10 消息内容 = 输入内容', E2.txt === '把这个区域的头像换成公司 logo', E2.txt);
ok('E11 消息附带区域与页面信息', /^区域 \d+,\d+ · \d+ × \d+ · 智能客服管理系统$/.test(E2.note), E2.note);
ok('E12 发完浮窗收起、红框保留', E2.popHidden && E2.boxes === 1, JSON.stringify([E2.popHidden, E2.boxes]));
ok('E13 右栏滚到底', E2.scrolled, E2.scrolled);

/* 取消 → 框一并删掉 */
const F0 = await p.evaluate(() => document.querySelectorAll('.ud-mq').length);
await p.mouse.move(E0.board[0] + E0.board[2] * 0.50, E0.board[1] + E0.board[3] * 0.60);
await p.mouse.down();
await p.mouse.move(E0.board[0] + E0.board[2] * 0.70, E0.board[1] + E0.board[3] * 0.78, { steps: 8 });
await p.mouse.up();
await wait(380);
await p.click('#udPopCancel'); await wait(300);
const F1 = await p.evaluate(() => ({ boxes: document.querySelectorAll('.ud-mq').length, popHidden: document.getElementById('udPop').hidden }));
ok('F1 取消：浮窗关 + 刚画的框被丢弃', F1.popHidden && F1.boxes === F0, JSON.stringify([F0, F1]));

/* ---------- G 批注模式（位置批注 + 序号） ---------- */
await p.click('#udFrame'); await wait(200);       /* 退出框选 */
await p.click('#udMark'); await wait(250);
const G0 = await p.evaluate(() => {
  const cv = document.getElementById('udCanvas');
  return { cv: cv.className, on: document.getElementById('udMark').classList.contains('is-on'),
    pressed: document.getElementById('udMark').getAttribute('aria-pressed'),
    frameOn: document.getElementById('udFrame').classList.contains('is-on'),
    cursor: getComputedStyle(document.getElementById('udBoard')).cursor };
});
ok('G1 批注模式：键 is-on、画布 is-mark、光标十字', G0.on && /is-mark/.test(G0.cv) && /is-edit/.test(G0.cv) === false && G0.cursor === 'crosshair', JSON.stringify(G0));
ok('G2 与框选互斥（框选键不再选中）', G0.frameOn === false, G0.frameOn);

const G1 = await geo();
const gx = G1.board[0] + G1.board[2] * 0.20, gy = G1.board[1] + G1.board[3] * 0.75;
await p.mouse.click(gx, gy); await wait(400);
const G2 = await p.evaluate(() => {
  const pin = document.querySelector('.ud-pin');
  const r = pin ? pin.getBoundingClientRect() : null;
  return { pins: document.querySelectorAll('.ud-pin').length, no: pin ? pin.textContent : '',
    w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
    hidden: document.getElementById('udPop').hidden,
    title: document.getElementById('udPopTitle').textContent,
    pos: document.getElementById('udPopPos').textContent,
    sizeHidden: document.getElementById('udPopSize').hidden,
    gripGone: !document.getElementById('udPopGrip') };
});
ok('G3 点击处落一个编号序号点（1）', G2.pins === 1 && G2.no === '1', JSON.stringify([G2.pins, G2.no]));
ok('G3b 标题栏中间的 grip 图标已去掉（第 107 轮）', G2.gripGone, G2.gripGone);
ok('G4 序号点视觉 18×18（随缩放反缩）', G2.w === 18 && G2.h === 18, JSON.stringify([G2.w, G2.h]));
ok('G5 弹「位置批注」浮窗（无尺寸、无 grip 图标）', G2.hidden === false && G2.title === '位置批注' && /^位置：X \d+，Y \d+$/.test(G2.pos) && G2.sizeHidden === true && G2.gripGone === true, JSON.stringify([G2.title, G2.pos, G2.sizeHidden, G2.gripGone]));

await p.type('#udPopTa', '这里加一个导出按钮');
await p.click('#udPopSend'); await wait(350);
const G3 = await p.evaluate(() => {
  const list = document.querySelectorAll('#aiScroll .ai-msg.is-user');
  const last = list[list.length - 1];
  return { txt: last.querySelector('.ai-bubble').textContent, note: (last.querySelector('.ud-msg-note') || {}).textContent || '' };
});
ok('G6 位置批注也能直接发到右栏', G3.txt === '这里加一个导出按钮' && /^位置 \d+,\d+ · 智能客服管理系统$/.test(G3.note), JSON.stringify(G3));

/* 第二个批注点 → 序号 2 */
const G4 = await geo();
await p.mouse.click(G4.board[0] + G4.board[2] * 0.55, G4.board[1] + G4.board[3] * 0.18); await wait(380);
const G5 = await p.evaluate(() => ({
  pins: document.querySelectorAll('.ud-pin').length,
  nos: [...document.querySelectorAll('.ud-pin')].map(e => e.textContent).join(','),
  title: document.getElementById('udPopTitle').textContent
}));
ok('G7 再点一次 → 第二个点，序号 2（每次点击都留序号）', G5.pins === 2 && G5.nos === '1,2', JSON.stringify(G5));

/* Esc：先关浮窗，再退模式 */
await p.keyboard.press('Escape'); await wait(250);
const G6 = await p.evaluate(() => ({
  popHidden: document.getElementById('udPop').hidden,
  pins: document.querySelectorAll('.ud-pin').length,
  markOn: document.getElementById('udMark').classList.contains('is-on')
}));
/* Esc 只收起浮窗，序号点保留（撤销只走「取消 / ×」） */
ok('G8 Esc 第一次只收起浮窗（序号点保留、模式还在）', G6.popHidden && G6.pins === 2 && G6.markOn, JSON.stringify(G6));
await p.keyboard.press('Escape'); await wait(250);
const G7 = await p.evaluate(() => ({
  on: document.getElementById('udMark').classList.contains('is-on'),
  pressed: document.getElementById('udMark').getAttribute('aria-pressed'),
  cls: document.getElementById('udCanvas').className,
  pins: document.querySelectorAll('.ud-pin').length
}));
ok('G9 Esc 第二次退出批注模式（已落的点保留）', !G7.on && G7.pressed === 'false' && !/is-mark/.test(G7.cls) && G7.pins === 2, JSON.stringify(G7));

/* ---------- H 收尾 ---------- */
const H1 = await p.evaluate(() => document.querySelectorAll('.ud-tool.is-on').length);
ok('H1 任意时刻最多一个工具键处于选中态', H1 <= 1, H1);
ok('H2 无 JS 报错', p.__e.length === 0, p.__e.slice(0, 3).join(' | '));

await b.close();
console.log('\n第 104 轮：' + pass + ' 通过 / ' + fail.length + ' 失败');
fail.forEach(f => console.log('  ✗ ' + f));
process.exit(fail.length ? 1 : 0);
