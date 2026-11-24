/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 37 轮验收（6 条）
   1 「全链路」改名「任务信息」
   2 折叠 / 展开动效与抽屉同曲线（.26s cubic-bezier(.2,.8,.2,1)），三块同步走
   3 左栏收起后：菜单键显出且可点，task-top 左内距 44 给菜单键让位
   4 页签条右侧 = 专注模式：进入后隐藏 左栏 / 右栏 / task-top / task-steps，
     只留页签条；可退出（按钮 / Esc），并还原左右栏原状
   5 会话页 chat 的 32 是外间距（margin），不是内边距（padding）
   6 会话页输入卡 .c-card 左右也是 32 外间距，与对话内容列对齐
*/
import puppeteer from 'puppeteer-core';
const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function mk(url, w = 1440, h = 900) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); } catch (e) { } });
  await p.goto('file:///' + ROOT + '/' + url, { waitUntil: 'load' });
  await wait(800);
  return p;
}
const T = p => p.evaluate(() => {
  const q = s => document.querySelector(s);
  const pm = q('.panel-main').getBoundingClientRect();
  const rel = e => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x - pm.x), y: Math.round(b.y - pm.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const top = q('.task-top'), st = q('.task-steps'), tb = q('.task-tabs'), mb = q('.menu-btn'), fb = q('#tkFocus');
  return {
    pmW: Math.round(pm.width), leftPad: getComputedStyle(top).paddingLeft, titleX: rel(q('.tt-title')).x,
    menu: { ...rel(mb), op: getComputedStyle(mb).opacity, pe: getComputedStyle(mb).pointerEvents, dis: getComputedStyle(mb).display },
    segs: [...document.querySelectorAll('.tt-links .tt-link')].map(x => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), ...rel(x) })),
    top: rel(top), steps: rel(st), tabs: rel(tb), stage: rel(q('.stage')),
    topH: Math.round(top.getBoundingClientRect().height), stepsH: Math.round(st.getBoundingClientRect().height),
    focus: { pressed: fb.getAttribute('aria-pressed'), tip: fb.getAttribute('data-tip'), label: fb.getAttribute('aria-label'), ...rel(fb), inD: getComputedStyle(q('.tk-fm-in')).display, outD: getComputedStyle(q('.tk-fm-out')).display },
    drawerW: Math.round(q('#wsDrawer').getBoundingClientRect().width),
    drawerOpen: q('#wsDrawer').classList.contains('is-open'),
    bodyFocus: document.body.classList.contains('is-focus'),
    tr: {
      steps: getComputedStyle(st).transitionProperty + ' | ' + getComputedStyle(st).transitionDuration + ' | ' + getComputedStyle(st).transitionTimingFunction,
      tabs: getComputedStyle(tb).transitionProperty + ' | ' + getComputedStyle(tb).transitionDuration + ' | ' + getComputedStyle(tb).transitionTimingFunction,
      stage: getComputedStyle(q('.stage')).transitionProperty + ' | ' + getComputedStyle(q('.stage')).transitionDuration + ' | ' + getComputedStyle(q('.stage')).transitionTimingFunction,
      drawer: getComputedStyle(q('#wsDrawer')).transitionDuration + ' | ' + getComputedStyle(q('#wsDrawer')).transitionTimingFunction,
    },
  };
});
const S = p => p.evaluate(() => {
  const q = s => document.querySelector(s);
  const r = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const chat = q('.chat'), card = q('.c-card'), comp = q('.composer'), cs = getComputedStyle(chat), cc = getComputedStyle(q('.composer'));
  const inner = q('.chat-inner');
  return {
    chat: { ...r(chat), pad: cs.padding, mar: cs.margin, innerL: r(inner).x },
    card: r(card), comp: { ...r(comp), mar: cc.marginLeft + ' / ' + cc.marginRight },
    stageW: Math.round(q('.stage').getBoundingClientRect().width),
  };
});

/* ========== A 改名 + 动效曲线 ========== */
{
  const p = await mk('cecoder-task.html');
  const d = await T(p);
  const info = d.segs.find(s => s.t === '任务信息');
  ok('A1 首段按钮文字 = 任务信息（无「全链路」）', !!info && !d.segs.some(s => s.t === '全链路'), JSON.stringify(d.segs.map(s => s.t)));
  ok('A2 工序条 / 页签条 / 内容区 与抽屉同一条曲线',
    /cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(d.tr.steps) && /0\.26s/.test(d.tr.steps) &&
    /0\.26s/.test(d.tr.tabs) && /cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(d.tr.tabs) &&
    /0\.26s/.test(d.tr.stage) && /cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(d.tr.stage),
    JSON.stringify(d.tr));
  ok('A3 抽屉曲线作参照（.26s + 同一贝塞尔）', /0\.26s/.test(d.tr.drawer) && /cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(d.tr.drawer), d.tr.drawer);
  /* 折叠途中取样：工序条、页签条、内容区同步在途，谁也不许先跳 */
  const mid = await p.evaluate(async () => {
    document.querySelector('#tkStepsToggle').click();
    await new Promise(r => setTimeout(r, 45));
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const s = document.querySelector('.task-steps').getBoundingClientRect();
    const t = document.querySelector('.task-tabs').getBoundingClientRect();
    const g = document.querySelector('.stage').getBoundingClientRect();
    return { stepsH: +s.height.toFixed(1), tabs: +(t.top - pm.top).toFixed(1), stage: +(g.top - pm.top).toFixed(1) };
  });
  const travel = 87 - mid.stepsH;
  ok('A4 折叠途中三块同步在途（工序条 / 页签条 / 内容区同行进量）',
    mid.stepsH > 4 && mid.stepsH < 83 && Math.abs(travel - (131 - mid.tabs)) <= 6 && Math.abs(travel - (171 - mid.stage)) <= 6,
    JSON.stringify(mid) + ' travel=' + travel.toFixed(1));
  await p.close();
}

/* ========== B 左栏收起 → 菜单键显出且让位 ========== */
{
  const p = await mk('cecoder-task.html');
  /* 子页面默认会自动展开左栏，先点抽屉头部的收起 */
  await p.evaluate(() => document.querySelector('#wsDrawer [data-drawer-close]').click());
  await wait(500);
  let d = await T(p);
  ok('B1 左栏收起后菜单键可见、可点（在 task-top 之上）', d.drawerOpen === false && d.menu.op === '1' && d.menu.pe !== 'none' && d.menu.x === 7, JSON.stringify(d.menu));
  ok('B2 task-top 左内距让到 44，标题从 44 起（第 46 轮顶栏左侧是任务标题）', d.leftPad === '44px' && d.titleX === 44, d.leftPad + ' / titleX=' + d.titleX);
  ok('B3 菜单键（7~35）与标题（44 起）不重叠', d.menu.x + d.menu.w <= d.titleX, d.menu.x + d.menu.w + ' vs ' + d.titleX);
  /* 点菜单键能真的把左栏拉回来 */
  await p.click('.menu-btn');
  await wait(500);
  d = await T(p);
  ok('B4 点菜单键左栏重新展开、task-top 回到左 19', d.drawerOpen === true && d.drawerW === 320 && d.leftPad === '19px' && d.titleX === 19, d.drawerW + ' / ' + d.leftPad + ' / titleX=' + d.titleX);
  ok('B5 无 JS 报错', p.__e.length === 0, JSON.stringify(p.__e));
  await p.close();
}

/* ========== C 专注模式 ========== */
{
  const p = await mk('cecoder-task.html');
  let d = await T(p);
  ok('C1 页签右侧是「专注模式」图标 + 文字（80×28，进 = 四角外扩）', d.focus.label === '专注模式' && d.focus.w === 80 && d.focus.inD !== 'none' && d.focus.outD === 'none', JSON.stringify(d.focus));
  ok('C2 不再是「收起工序资产栏」', await p.evaluate(() => !document.getElementById('tkTabsMore')), 'tkTabsMore 仍存在');
  await p.click('#tkFocus');
  await wait(600);
  d = await T(p);
  ok('C3 进入专注：左栏收起、body.is-focus、按钮变退出态', d.bodyFocus === true && d.drawerOpen === false && d.focus.pressed === 'true' && d.focus.tip === '退出专注模式' && d.focus.inD === 'none' && d.focus.outD !== 'none', JSON.stringify([d.bodyFocus, d.drawerOpen, d.focus.pressed, d.focus.tip]));
  ok('C4 专注下 task-top / task-steps 收平（0 高）', d.topH === 0 && d.stepsH === 0, d.topH + ' / ' + d.stepsH);
  ok('C5 专注下页签条顶到 0、内容区 40、菜单键藏起来', d.tabs.y === 0 && d.stage.y === 40 && d.menu.dis === 'none', JSON.stringify([d.tabs.y, d.stage.y, d.menu.dis]));
  ok('C6 专注下左栏宽度归 0（真的收走，不是被盖住）', d.drawerW === 0, String(d.drawerW));
  /* 专注态页签仍可点（它是唯一剩下的栏） */
  await p.evaluate(() => document.querySelectorAll('.tk-tab')[1].click());
  await wait(120);
  ok('C6b 专注态页签仍可切换', await p.evaluate(() => document.querySelectorAll('.tk-tab')[1].classList.contains('is-on')));
  await p.click('#tkFocus');
  await wait(600);
  d = await T(p);
  ok('C7 再点退出：44 / 87 / 131 / 171，左栏还原为展开',
    d.bodyFocus === false && d.topH === 44 && d.stepsH === 87 && d.tabs.y === 131 && d.stage.y === 171 && d.drawerOpen === true && d.focus.pressed === 'false', JSON.stringify([d.topH, d.stepsH, d.tabs.y, d.stage.y, d.drawerOpen]));
  /* Esc 也能退 */
  await p.click('#tkFocus');
  await wait(500);
  await p.keyboard.press('Escape');
  await wait(600);
  d = await T(p);
  ok('C8 Esc 退出专注', d.bodyFocus === false && d.topH === 44 && d.tabs.y === 131, JSON.stringify([d.bodyFocus, d.topH, d.tabs.y]));
  ok('C9 无 JS 报错', p.__e.length === 0, JSON.stringify(p.__e));
  await p.close();
}

/* ========== D 会话页：外间距 32 ========== */
{
  const p = await mk('cecoder-session.html?id=0');
  const d = await S(p);
  ok('D1 .chat 的 32 走 margin（padding 左右为 0）', d.chat.mar === '0px 32px' && d.chat.pad === '32px 0px 8px', d.chat.mar + ' | ' + d.chat.pad);
  ok('D2 .c-card 左右外间距 32（composer margin 32）', d.comp.mar === '32px / 32px', d.comp.mar);
  ok('D3 对话内容列与输入卡左边线对齐（差 ≤1）', Math.abs(d.chat.innerL - d.card.x) <= 1, d.chat.innerL + ' vs ' + d.card.x);
  ok('D4 输入卡右边线也收进 32（不顶到 stage 右缘）', d.comp.x + d.comp.w <= 1440 && Math.abs((d.comp.x + d.comp.w) - (d.card.x + d.card.w)) <= 1, JSON.stringify(d.card));
  ok('D5 无 JS 报错', p.__e.length === 0, JSON.stringify(p.__e));
  await p.close();
}

console.log('\n通过 ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
await b.close();
