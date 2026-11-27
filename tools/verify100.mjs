/* 第 100 轮验收：
   ① 画板从 <button> 改成容器 <div>（role=group / data-sel），不再是按钮
   ② 画板里装了「智能客服管理系统」：四栏 56 / 296 / flex / 316，整板 1440×900 不溢出
   ③ 描边改到外面（内容不透明也不会吞掉），选中态 1.6px 主色
   ④ 拖动 / 点击选中仍可用（容器化后不能坏）
   ⑤ 画板内部元素能被 elementFromPoint 命中（后续批注 / 框选的前提）
   ⑥ 工具条与画板上方的画板名都换成新页面名 */
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

/* ---------- ① 标签 / 语义 ---------- */
const A = await p.evaluate(() => {
  const bd = document.querySelector('#udBoard');
  return {
    tag: bd.tagName, role: bd.getAttribute('role'), sel: bd.getAttribute('data-sel'),
    hasPressed: bd.hasAttribute('aria-pressed'),
    btns: bd.querySelectorAll('button').length,
    doc: !!bd.querySelector('.ud-board-doc'), label: bd.getAttribute('aria-label')
  };
});
ok('A1 画板是 DIV 容器（不再是 button）', A.tag === 'DIV', A.tag);
ok('A2 role=group + data-sel 表达选中（不再用 aria-pressed）', A.role === 'group' && A.sel === 'false' && !A.hasPressed, JSON.stringify([A.role, A.sel, A.hasPressed]));
ok('A3 画板里没有 <button>（页面用 div 搭，避免默认行为干扰框选）', A.btns === 0, A.btns);
ok('A4 装了 .ud-board-doc 内容层', A.doc === true);

/* ---------- ② 四栏布局 ---------- */
const B = await p.evaluate(() => {
  const box = e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; };
  const doc = document.querySelector('.ud-board-doc');
  const rail = document.querySelector('.kb-rail'), list = document.querySelector('.kb-list'),
        chat = document.querySelector('.kb-chat'), side = document.querySelector('.kb-side');
  const s = parseFloat(getComputedStyle(document.querySelector('#udBoardWrap')).getPropertyValue('--ud-s')) || 1;
  const nat = r => Math.round(r[0] / s);
  return {
    rail: nat(box(rail)), list: nat(box(list)), chat: nat(box(chat)), side: nat(box(side)),
    doc: [Math.round(doc.offsetWidth), Math.round(doc.offsetHeight)],
    overX: doc.scrollWidth - doc.clientWidth,
    lanes: [rail, list, chat, side].map(e => e.scrollHeight - e.clientHeight),
    items: document.querySelectorAll('.kb-item').length,
    msgs: document.querySelectorAll('.kb-msg').length,
    ai: document.querySelectorAll('.kb-ai').length
  };
});
ok('B1 导航栏 56 宽', B.rail === 56, B.rail);
ok('B2 会话列 296 宽', B.list === 296, B.list);
ok('B3 客户栏 316 宽', B.side === 316, B.side);
ok('B4 对话区吃掉剩余 = 1440 − 56 − 296 − 316 = 772', B.chat === 772, B.chat);
ok('B5 内容层 1440×900 且不横向溢出', B.doc[0] === 1440 && B.doc[1] === 900 && B.overX <= 0, JSON.stringify([B.doc, B.overX]));
ok('B6 四栏都不纵向溢出（画板内不出现滚动条）', B.lanes.every(v => v <= 0), JSON.stringify(B.lanes));
ok('B7 有会话列表 / 消息 / AI 建议等真实内容', B.items >= 10 && B.msgs >= 5 && B.ai === 1, JSON.stringify([B.items, B.msgs, B.ai]));

/* ---------- ③ 描边 ---------- */
const C = await p.evaluate(() => getComputedStyle(document.querySelector('#udBoard')).boxShadow);
ok('C1 常态外描边 1px #E5E5E5（不再 inset，避免被内容吞）', /rgb\(229, 229, 229\) 0px 0px 0px 1px/.test(C) && !/inset/.test(C), C);

await p.click('#udBoard'); await wait(250);
const D = await p.evaluate(() => {
  const bd = document.querySelector('#udBoard'), hs = getComputedStyle(document.querySelector('.ud-h-tl'));
  return { sel: bd.classList.contains('is-sel'), ds: bd.getAttribute('data-sel'), sh: getComputedStyle(bd).boxShadow, disp: hs.display };
});
ok('D1 点画板 → is-sel + data-sel=true', D.sel === true && D.ds === 'true', JSON.stringify([D.sel, D.ds]));
ok('D2 选中态 1.6px 主色外描边', /rgb\(55, 112, 247\) 0px 0px 0px 1\.6px/.test(D.sh), D.sh);
ok('D3 四角手柄仍显示、不被圆角裁掉', D.disp !== 'none', D.disp);

/* ---------- ④ 拖动 ---------- */
const E0 = await p.evaluate(() => document.querySelector('#udBoardWrap').style.transform || '');
const t = await p.evaluate(() => {
  const r = document.querySelector('#udBoard').getBoundingClientRect();
  /* 抓一个一定落在画板上的点（避开右下悬浮球） */
  for (let dx = 0.4; dx <= 0.6; dx += 0.05) {
    const x = Math.round(r.x + r.width * dx), y = Math.round(r.y + r.height * 0.3);
    if (document.elementFromPoint(x, y).closest('#udBoard')) return [x, y];
  }
  return null;
});
await p.mouse.move(t[0], t[1]); await p.mouse.down();
await p.mouse.move(t[0] + 40, t[1] + 24, { steps: 6 }); await p.mouse.up();
await wait(200);
const E1 = await p.evaluate(() => document.querySelector('#udBoardWrap').style.transform || '');
ok('E1 容器化后仍能拖动整块画板', E1 !== E0 && /translate\(\d+px, \d+px\)/.test(E1), E1 || '(none)');
await p.evaluate(() => { const w = document.querySelector('#udBoardWrap'); w.style.transform = ''; });
await wait(120);

/* ---------- ⑤ 内部元素可命中（批注 / 框选前提） ---------- */
const F = await p.evaluate(() => {
  const targets = ['.kb-item.is-on', '.kb-chat-head', '.kb-ai', '.kb-side .kb-doc'];
  const out = {};
  targets.forEach(s => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
    out[s] = hit ? (hit.className || hit.tagName) + (hit.closest('#udBoard') ? ' [in-board]' : ' [OUT]') : null;
  });
  return out;
});
ok('F1 会话项 / 对话头 / AI 卡 / 客户卡都能被命中',
  Object.values(F).every(v => v && v.indexOf('[in-board]') > -1), JSON.stringify(F));

/* ---------- ⑥ 名字 ---------- */
const G = await p.evaluate(() => ({
  bar: document.querySelector('.ud-title').textContent.trim(),
  board: document.querySelector('.ud-board-name').textContent.trim(),
  bs: getComputedStyle(document.querySelector('.ud-board-name')).fontSize
}));
ok('G1 工具条画板名 = 智能客服管理系统 · 默认', G.bar === '智能客服管理系统 · 默认', G.bar);
ok('G2 画板上方名字同步、仍 12px', G.board === '智能客服管理系统 · 默认' && G.bs === '12px', JSON.stringify([G.board, G.bs]));

ok('H1 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));

await b.close();
console.log('\n第 100 轮：' + pass + ' 通过' + (fail.length ? '，' + fail.length + ' 失败' : ''));
if (fail.length) { fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
