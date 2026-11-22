/* 第 42 轮验收：涟漪圆点整块移除 → 折叠态待确认浮标（箭头 / 文案 / 去处理 / 稍后） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: 1440, height: 900 });
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(650);
  return p;
}
const drawerOpen = p => p.evaluate(() => document.getElementById('wsDrawer').classList.contains('is-open'));
const tipOn = p => p.evaluate(() => document.getElementById('fpTip').classList.contains('is-on'));
const geo = p => p.evaluate(() => {
  const t = document.getElementById('fpTip');
  const ar = t.querySelector('.fp-arrow').getBoundingClientRect();
  const r = t.getBoundingClientRect();
  const btn = document.querySelector('.menu-btn').getBoundingClientRect();
  const cs = getComputedStyle(t);
  return {
    x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
    arrowCy: +(ar.y + ar.height / 2).toFixed(2), arrowTipX: +ar.x.toFixed(1),
    btnCy: +(btn.y + btn.height / 2).toFixed(2), btnRight: +btn.right.toFixed(1), btnX: +btn.x.toFixed(1),
    op: cs.opacity, radius: cs.borderRadius, shadow: cs.boxShadow,
    pe: cs.pointerEvents, vis: cs.visibility, hidden: t.getAttribute('aria-hidden'),
    txt: t.querySelector('.fp-text').textContent.replace(/\s+/g, ' ').trim(),
    num: t.querySelector('.fp-num').textContent
  };
});

/* ============ A 涟漪圆点已整块移除 ============ */
let p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '任务'); });
const gone = await p.evaluate(() => {
  let css = '';
  for (const sh of document.styleSheets) { let r; try { r = sh.cssRules; } catch (e) { continue; } for (const x of r) css += x.cssText; }
  return {
    node: document.querySelectorAll('#mbDot, .mb-dot').length,
    hasDot: document.querySelector('.menu-btn').classList.contains('has-dot'),
    ripple: /mbRipple/.test(css), dotCls: /\.mb-dot/.test(css)
  };
});
ok('A1 #mbDot / .mb-dot 节点已删除', gone.node === 0, String(gone.node));
ok('A2 折叠按钮不再挂 has-dot', gone.hasDot === false);
ok('A3 样式表里已无 mbRipple 关键帧', gone.ripple === false);
ok('A4 样式表里已无 .mb-dot 规则', gone.dotCls === false);

/* ============ B 展开态：浮标不出现 ============ */
ok('B1 展开态浮标不显示', (await tipOn(p)) === false);
ok('B2 展开态 aria-hidden=true + 不可点', await p.evaluate(() => {
  const t = document.getElementById('fpTip');
  return t.getAttribute('aria-hidden') === 'true' && getComputedStyle(t).pointerEvents === 'none' && getComputedStyle(t).opacity === '0' && getComputedStyle(t).visibility === 'hidden';
}));
ok('B3 浮标 DOM 结构（region / 箭头 / 两个按钮）', await p.evaluate(() => {
  const t = document.getElementById('fpTip');
  return t.getAttribute('role') === 'region' && t.getAttribute('aria-label') === '待确认提醒'
    && !!t.querySelector('.fp-arrow') && !!t.querySelector('#fpGo') && !!t.querySelector('#fpLater')
    && t.querySelector('#fpGo').textContent.trim() === '去处理'
    && t.querySelector('#fpLater').textContent.trim() === '稍后';
}));

/* ============ C 折叠后随机延迟浮出 ============ */
await p.click('.wd-collapse');
await wait(320);
ok('C1 收起后 320ms 内不弹（随机延迟 ≥450ms）', (await tipOn(p)) === false);
await wait(1250);
ok('C2 1.6s 内浮出', (await tipOn(p)) === true);
const g = await geo(p);
ok('C3 文案「有 X 个待确认的事项需处理」', /^有 \d+ 个待确认的事项需处理$/.test(g.txt), g.txt);
ok('C4 X = 待确认卡片数（3）', g.num === '3' && await p.evaluate(() => document.querySelectorAll('.wd-chip-todo').length === 3), g.num);
ok('C5 尖角中线与折叠按钮中线重合（≤0.5px）', Math.abs(g.arrowCy - g.btnCy) <= 0.5, g.arrowCy + ' vs ' + g.btnCy);
ok('C6 尖角尖端不压按钮（间隙 2~5px）', g.arrowTipX - g.btnRight >= 2 && g.arrowTipX - g.btnRight <= 5, String(+(g.arrowTipX - g.btnRight).toFixed(1)));
ok('C7 卡片整体在按钮右侧', g.x > g.btnRight, g.x + ' vs ' + g.btnRight);
ok('C8 卡片贴左上角（left 46 / top 4）', Math.abs(g.x - (g.btnX + 39)) <= 1.5 && g.y > 46, `${g.x},${g.y}`);
ok('C9 完全显示 + 可点击', g.op === '1' && g.pe === 'auto' && g.hidden === 'false' && g.vis === 'visible');
ok('C10 圆角 8 + 橙色描边投影', g.radius === '8px' && /247, 114, 52/.test(g.shadow), g.radius + ' | ' + g.shadow.slice(0, 60));
ok('C11 没有循环缩放动画（去掉涟漪）', await p.evaluate(() => {
  const t = document.getElementById('fpTip'), a = t.querySelector('.fp-arrow');
  return getComputedStyle(t).animationName === 'none' && getComputedStyle(a).animationName === 'none';
}));
ok('C12 去处理按钮橙底白字', await p.evaluate(() => {
  const s = getComputedStyle(document.getElementById('fpGo'));
  return s.backgroundColor === 'rgb(247, 114, 52)' && s.color === 'rgb(255, 255, 255)' && s.height === '26px';
}));
ok('C13 文案 13/20，数字橙色 600', await p.evaluate(() => {
  const t = document.querySelector('.fp-text'), n = document.querySelector('.fp-num');
  return getComputedStyle(t).fontSize === '13px' && getComputedStyle(t).lineHeight === '20px'
    && getComputedStyle(n).color === 'rgb(247, 114, 52)' && getComputedStyle(n).fontWeight === '600';
}));
await p.screenshot({ path: 'R42-float.png' });

/* ============ D 去处理 ============ */
await p.click('#fpGo');
await wait(900);
const go = await p.evaluate(() => {
  const card = document.querySelector('.wd-card.is-fp-focus');
  const sc = document.getElementById('wdScroll').getBoundingClientRect();
  const r = card ? card.getBoundingClientRect() : null;
  return {
    open: document.getElementById('wsDrawer').classList.contains('is-open'),
    tab: (document.querySelector('.wd-tab.is-active') || {}).textContent.replace(/\d+/g, '').trim(),
    focus: !!card,
    inView: !!r && r.top >= sc.top - 2 && r.bottom <= sc.bottom + 2,
    tipOn: document.getElementById('fpTip').classList.contains('is-on'),
    todoInFocus: card ? !!card.querySelector('.wd-chip-todo') : false
  };
});
ok('D1 去处理 → 展开左栏', go.open === true);
ok('D2 切到「任务」页签', go.tab === '任务', go.tab);
ok('D3 定位到待确认卡并高亮', go.focus === true && go.todoInFocus === true);
ok('D4 高亮卡在列表可视区内', go.inView === true);
ok('D5 浮标收起', go.tipOn === false);
await p.screenshot({ path: 'R42-after-go.png' });
await wait(900);
ok('D6 高亮 1.5s 后自动摘掉', await p.evaluate(() => !document.querySelector('.wd-card.is-fp-focus')));

/* ============ E 稍后 ============ */
await p.click('.wd-collapse');
await wait(1600);
ok('E1 再次收起 → 又会浮出', (await tipOn(p)) === true);
await p.click('#fpLater');
await wait(120);
ok('E2 点「稍后」立即收起', (await tipOn(p)) === false);
await wait(2400);
ok('E3 稍后 2.4s 内不打扰（20s 后再来）', (await tipOn(p)) === false);
ok('E4 稍后按钮 hover 有底色', await p.evaluate(() => {
  const el = document.getElementById('fpLater');
  el.classList.add('__h');
  const s = getComputedStyle(el);
  return s.color === 'rgb(69, 89, 115)' || s.color === 'rgb(107, 107, 107)' || s.color === 'rgb(31, 31, 31)';
}));
/* 收起状里再开再收 → 重新随机出现 */
await p.click('.menu-btn'); await wait(520);
await p.click('.wd-collapse'); await wait(1600);
ok('E5 开合一轮后恢复提示', (await tipOn(p)) === true);

/* ============ F 无待确认 → 不出现 ============ */
await p.evaluate(() => {
  document.querySelectorAll('.wd-chip-todo').forEach(x => x.remove());
  document.querySelectorAll('.wd-card.is-todo, .wd-sess-card.is-todo').forEach(x => { x.classList.remove('is-todo'); });
});
await p.click('.menu-btn'); await wait(520);
await p.click('.wd-collapse'); await wait(1700);
ok('F1 没有待确认卡时不浮出', (await tipOn(p)) === false);
ok('F2 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
await p.close();

/* ============ G 会话 / 任务页（is-chat 形态不占页签） ============ */
for (const [name, url] of [['会话页', 'cecoder-session.html?id=0'], ['任务页', 'cecoder-task.html?id=0']]) {
  const q = await mk(url, () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
  await q.click('.wd-collapse');
  await wait(1700);
  const st = await q.evaluate(() => ({
    on: document.getElementById('fpTip').classList.contains('is-on'),
    chat: document.getElementById('panelMain').classList.contains('is-chat')
  }));
  ok('G ' + name + '（is-chat）不浮出，不挡页签', st.on === false && st.chat === true, JSON.stringify(st));
  ok('G ' + name + ' 无 JS 报错', q.__e.length === 0, q.__e.join(' | '));
  await q.close();
}

/* ============ H 1280 窄窗：浮标不越界 ============ */
p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); });
await p.setViewport({ width: 1280, height: 720 });
await wait(300);
await p.click('.wd-collapse');
await wait(1600);
ok('H1 1280 下浮标仍在面板内', await p.evaluate(() => {
  const r = document.getElementById('fpTip').getBoundingClientRect();
  const pm = document.getElementById('panelMain').getBoundingClientRect();
  return r.left >= pm.left && r.right <= pm.right && r.top >= pm.top;
}));
await p.screenshot({ path: 'R42-1280.png' });
await p.close();

await b.close();
console.log(`\n通过 ${pass} 项${fail.length ? '，失败 ' + fail.length + ' 项：' : '，全部通过'}`);
fail.forEach(f => console.log('  ✗ ' + f));
process.exit(fail.length ? 1 : 0);
