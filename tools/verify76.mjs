/* 第 76 轮验收：任务总结工序页（工序条 6 步 / 内容 1024 列 / 工序资产折叠 / 派发弹窗两态 / 页面互跳） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1920, h = 1200) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(700);
  p.tap = sel => p.evaluate(s => document.querySelector(s).click(), sel);
  return p;
}

/* ============ A 页面骨架：工序条 / 内容列 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const a = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const q = s => box(document.querySelector(s));
    const steps = [...document.querySelectorAll('.ss-item')];
    return {
      steps: q('.sum-steps'), track: q('.ss-track'),
      names: steps.map(s => s.querySelector('b').textContent),
      states: steps.map(s => s.querySelector('i').textContent),
      now: document.querySelector('.ss-item.is-now b').textContent,
      nowIcon: getComputedStyle(document.querySelector('.ss-item.is-now .ss-icon')).backgroundColor,
      nowState: getComputedStyle(document.querySelector('.ss-item.is-now i')).color,
      doneIcon: getComputedStyle(document.querySelector('.ss-item.is-done .ss-icon')).backgroundColor,
      todoWeight: getComputedStyle(document.querySelector('.ss-item.is-todo b')).fontWeight,
      trackW: Math.round(document.querySelector('.ss-track').getBoundingClientRect().width),
      itemW: steps.map(s => Math.round(s.getBoundingClientRect().width)),
      col: q('.sum-col'), wrapTop: q('.sum-wrap').y,
      errs: 0,
    };
  });
  ok('A1 工序条 43 高、贴 44', a.steps.h === 43 && a.steps.y === 44, JSON.stringify(a.steps));
  ok('A2 六道工序：概要设计 / 详细设计 / 任务总结 / 代码变更分析 / 开发实现 / 代码审查',
    a.names.join('/') === '概要设计/详细设计/任务总结/代码变更分析/开发实现/代码审查', a.names.join('/'));
  ok('A3 当前 = 任务总结（绿底 #3BB346 + 状态主色）',
    a.now === '任务总结' && a.nowIcon === 'rgb(59, 179, 70)' && a.nowState === 'rgb(55, 112, 247)', a.nowIcon + ' ' + a.nowState);
  ok('A4 已完成蓝底 #F5F8FF；待开始名称常规字重',
    a.doneIcon === 'rgb(245, 248, 255)' && a.todoWeight === '400', a.doneIcon + ' ' + a.todoWeight);
  ok('A5 六块宽 88/152/152/180/152/152、含间距总长 916（稿 3495:55201）',
    a.itemW.join(',') === '88,152,152,180,152,152' && a.itemW.reduce((x, y) => x + y, 0) + 5 * 8 === 916, a.itemW.join(','));
  ok('A6 内容列 1024 且与工序轨道同左缘', a.col.w === 1024 && a.col.x === a.track.x, JSON.stringify([a.col, a.track]));
  ok('A7 内容区从 87 起（44 顶栏 + 43 工序条）', a.wrapTop === 87, a.wrapTop);
  ok('A8 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ B 内容区几何（稿 3495:55203） ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const c = await p.evaluate(() => {
    const col = document.querySelector('.sum-col').getBoundingClientRect();
    const box = el => { if (typeof el === 'string') el = document.querySelector(el); const r = el.getBoundingClientRect(); return { x: Math.round(r.left - col.left), y: Math.round(r.top - col.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const cs = s => getComputedStyle(document.querySelector(s));
    const th = [...document.querySelectorAll('.sa-row.is-open .sa-tr.is-th > span')].filter(e => e.offsetWidth).map(e => box(e).x);
    const rows = [...document.querySelectorAll('.sa-row')].map(e => box(e));
    return {
      h: box('.sum-h'), hTxt: cs('.sum-h-txt').fontSize + '/' + cs('.sum-h-txt').fontWeight,
      lines: [...document.querySelectorAll('.sum-h-line')].map(e => box(e)),
      dp: box('.sum-dp'), dpBg: cs('.sum-dp').backgroundColor, dpShadow: cs('.sum-dp').boxShadow,
      ico: box('.sum-dp-ico'), t: box('.sum-dp-t'), d: box('.sum-dp-d'), btn: box('.sum-dp-btn'),
      assets: box('.sum-assets'), head: box('.sa-head'), all: box('.sa-all'), list: box('.sa-list'),
      row1: box('.sa-row.is-open'), rowH: box('.sa-row.is-open .sa-row-h'),
      tags: [...document.querySelectorAll('.sa-row.is-open .sa-tag')].map(e => box(e)),
      table: box('.sa-table'), th: box('.sa-row.is-open .sa-tr.is-th'),
      thX: th, rows, foot: box('.sum-foot'), pri: box('.sum-primary'),
      footBg: cs('.sum-foot').backgroundColor, priW: box('.sum-primary').w,
      wrapScroll: (() => { const w = document.querySelector('.sum-wrap'); return { sh: w.scrollHeight, ch: w.clientHeight }; })(),
      over: document.querySelector('.sum-wrap').scrollWidth - document.querySelector('.sum-wrap').clientWidth,
    };
  });
  ok('B1 标题 28 高、20/500、两侧各 456 横线', c.h.h === 28 && c.hTxt === '20px/500' && Math.abs(c.lines[0].w - 456) <= 1 && Math.abs(c.lines[1].w - 456) <= 1, JSON.stringify([c.h, c.hTxt, c.lines]));
  ok('B2 派发卡 1024×96 @52、底 #F7F7F7、内描边 #EEEEEE', c.dp.h === 96 && c.dp.y === 52 && c.dp.w === 1024 && c.dpBg === 'rgb(247, 247, 247)' && /238, 238, 238/.test(c.dpShadow), JSON.stringify([c.dp, c.dpBg]));
  ok('B3 卡内图标 40×40 @16,68 / 标题 @68,68 / 描述 700 宽两行 / 按钮 134×32',
    c.ico.w === 40 && c.ico.h === 40 && c.ico.x === 16 && c.ico.y === 68 && c.t.x === 68 && c.d.w === 700 && c.d.h === 40 && c.btn.w === 134 && c.btn.h === 32,
    JSON.stringify([c.ico, c.t, c.d, c.btn]));
  ok('B4 工序资产块从 168 起、头部 42、右上键 32 贴右', c.assets.y === 168 && c.head.h === 42 && c.all.w === 32 && c.all.x === 992, JSON.stringify([c.assets, c.head, c.all]));
  ok('B5 展开卡 1024×288 从 226 起、行头 40', c.row1.y === 226 && c.row1.h === 288 && c.rowH.h === 40, JSON.stringify([c.row1, c.rowH]));
  ok('B6 标签行两条 24 高（代码仓库 182 / 影响文件撑满）', c.tags.length === 2 && c.tags[0].h === 24 && Math.abs(c.tags[0].w - 182) <= 6 && c.tags[1].w > 500, JSON.stringify(c.tags));
  ok('B7 表格 992×176（表头 32 + 4 行 36）', c.table.w === 992 && c.table.h === 176 && c.th.h === 32, JSON.stringify([c.table, c.th]));
  ok('B8 表格列 ≈ 12 / 68 / 692 / 812 / 902（±14，网格按可用宽自适应）',
    c.thX.length === 5 && c.thX.every((v, i) => Math.abs((v - c.table.x) - [12, 68, 692, 812, 902][i]) <= 14), c.thX.map(v => v - c.table.x).join(','));
  ok('B9 七个工序行：1 展开 288 + 6 折叠 40、行距 8（末行收在 802）',
    c.rows.length === 7 && c.rows.slice(1).every(r => r.h === 40) && c.rows[1].y - (c.rows[0].y + c.rows[0].h) === 8 && c.rows[6].y + 40 === 802,
    JSON.stringify(c.rows));
  ok('B10 底栏 56、主键 212×36 居中', c.foot.h === 56 && c.pri.w === 212 && c.pri.h === 36 && Math.abs((c.pri.x + c.pri.w / 2) - 512) <= 1, JSON.stringify([c.foot, c.pri]));
  ok('B11 无横向溢出', c.over <= 0, c.over);
  await p.close();
}

/* ============ C 工序资产折叠 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const h = () => p.evaluate(() => [...document.querySelectorAll('.sa-row')].map(r => Math.round(r.getBoundingClientRect().height)));
  const before = await h();
  await p.tap('.sa-row:nth-child(2) .sa-row-h'); await wait(120);
  const opened = await h();
  ok('C1 点折叠行 → 展开（第 2 行 40 → 至少 130）', before[1] === 40 && opened[1] > 130, before[1] + ' → ' + opened[1]);

  await p.tap('#saAll'); await wait(160);
  const allOpen = await h();
  ok('C2 点右上「全部展开」→ 七行全开、按钮 aria=true', allOpen.every(v => v > 40) && await p.evaluate(() => document.getElementById('saAll').getAttribute('aria-expanded')) === 'true', allOpen.join('/'));

  await p.tap('#saAll'); await wait(160);
  const allShut = await h();
  ok('C3 再点 → 全收，七行都 40、按钮 aria=false',
    allShut.every(v => v === 40) && await p.evaluate(() => document.getElementById('saAll').getAttribute('aria-expanded')) === 'false', allShut.join('/'));
  await p.close();
}

/* ============ D 任务智能派发弹窗 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  await p.tap('#sumDispatch'); await wait(320);
  const d = await p.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    return {
      open: document.getElementById('dpModal').classList.contains('is-open'),
      dlg: box('.dp-dlg'), head: box('.dp-head'), left: box('.dp-left'), foot: box('.dp-foot'),
      lfoot: box('.dp-left-foot'), empty: !!document.querySelector('.dp-empty'),
      grps: document.querySelectorAll('.dp-grp').length,
      count: document.getElementById('dpCount').textContent,
      cards: document.querySelectorAll('.dp-card').length,
      title: document.querySelector('.dp-title').textContent,
    };
  });
  ok('D1 底栏主键 → 弹窗打开，1200×804', d.open && d.dlg.w === 1200 && d.dlg.h === 804, JSON.stringify(d.dlg));
  ok('D2 头 48 / 左列 400×700 / 左列底 48 / 底部 56', d.head.h === 48 && d.left.w === 400 && d.left.h === 700 && d.lfoot.h === 48 && d.foot.h === 56,
    JSON.stringify([d.head, d.left, d.lfoot, d.foot]));
  ok('D3 拆分前：空态 + 五个工序组 + 计数 0 项', d.empty && d.grps === 5 && d.cards === 0 && /已选 0 项/.test(d.count), d.count);

  /* 勾一个工序 → 出对应任务卡 */
  await p.evaluate(() => document.querySelector('.dp-grp[data-grp="design"] [data-dp-all]').click());
  await wait(160);
  const one = await p.evaluate(() => ({ cards: document.querySelectorAll('.dp-card').length, type: document.querySelector('.dp-card .dp-type') ? document.querySelector('.dp-card .dp-type').textContent : null, count: document.getElementById('dpCount').textContent }));
  ok('D4 勾「概要设计」→ 出 1 张架构设计卡，计数 4 项', one.cards === 1 && one.type === '架构设计' && /已选 4 项/.test(one.count), JSON.stringify(one));

  /* 一键智能拆分 */
  await p.evaluate(() => document.getElementById('dpSelectAll').click());
  await wait(200);
  const all = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.dp-card')];
    return {
      n: cards.length, types: cards.map(c => c.querySelector('.dp-type').textContent),
      count: document.getElementById('dpCount').textContent,
      h0: Math.round(cards[0].getBoundingClientRect().height),
      state: cards[0].querySelector('.dp-state').textContent,
      sel: cards[0].querySelector('.dp-sel-v').textContent,
      btns: [...cards[0].querySelectorAll('.dp-card-btns .dp-btn')].map(b => b.textContent),
      detail: !!cards[0].querySelector('.dp-detail'),
      dv: cards[0].querySelectorAll('.dp-dv-list .dp-ck').length,
    };
  });
  ok('D5 全选 → 三张卡（架构设计 / 代码开发 / 缺陷修复）', all.n === 3 && all.types.join('/') === '架构设计/代码开发/缺陷修复', all.types.join('/'));
  ok('D6 卡片：待派发标签 / 标题 / 受理人下拉 / 详情·移除按钮',
    all.state === '待派发' && all.sel === '架构师 · 周宁' && all.btns.join('/') === '收起详情/移除', JSON.stringify(all));
  ok('D7 架构设计卡展开详情 342 高、传递资产 6 项', all.h0 === 340 && all.detail && all.dv === 6, all.h0 + ' ' + all.dv);
  ok('D8 计数 = 共 15 项，已选 15 项', all.count === '共 15 项，已选 15 项', all.count);

  /* 收起详情 */
  await p.evaluate(() => document.querySelector('.dp-card [data-dp-detail]').click());
  await wait(160);
  const shut = await p.evaluate(() => ({ hidden: document.querySelector('.dp-card .dp-detail').hidden, label: document.querySelector('.dp-card [data-dp-detail]').textContent, h: Math.round(document.querySelector('.dp-card').getBoundingClientRect().height) }));
  ok('D9 点「收起详情」→ 详情收起、按钮回到「任务详情」、卡高 120', shut.hidden && shut.label === '任务详情' && shut.h === 120, JSON.stringify(shut));

  /* 派发 → toast */
  await p.evaluate(() => document.getElementById('dpGo').click());
  await wait(220);
  const t = await p.evaluate(() => ({ hidden: document.getElementById('dpToast').hidden, txt: document.getElementById('dpToastTxt').textContent }));
  ok('D10 派发 → 顶部提示「已派发 3 项任务，任务已完成」', t.hidden === false && /已派发 3 项任务/.test(t.txt), JSON.stringify(t));

  await wait(1500);
  const closed = await p.evaluate(() => document.getElementById('dpModal').classList.contains('is-open'));
  ok('D11 提示后自动关闭弹窗', closed === false, String(closed));

  /* Esc 关闭 */
  await p.tap('#sumDispatch'); await wait(220);
  await p.keyboard.press('Escape'); await wait(200);
  const esc = await p.evaluate(() => document.getElementById('dpModal').classList.contains('is-open'));
  ok('D12 Esc 关闭弹窗', esc === false, String(esc));
  await p.close();
}

/* ============ E 页面互跳 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  await p.tap('.sum-back'); await wait(600);
  ok('E1 任务总结页「任务执行」→ 任务页', /cecoder-task\.html/.test(p.url()), p.url());

  const p2 = await mk('cecoder-task.html?id=0');
  const link = await p2.evaluate(() => { const a = document.querySelector('a.tk-sum-link'); return a ? { href: a.getAttribute('href'), txt: a.textContent.trim() } : null; });
  ok('E2 任务页页签条右侧有「任务总结」入口', !!link && /cecoder-summary\.html/.test(link.href) && link.txt === '任务总结', JSON.stringify(link));
  await p2.tap('a.tk-sum-link'); await wait(600);
  ok('E3 点它 → 进任务总结页', /cecoder-summary\.html/.test(p2.url()), p2.url());

  const p3 = await mk('cecoder-summary.html?id=0');
  await p3.tap('.tt-home'); await wait(600);
  ok('E4 顶栏「首页」→ 落地首页', /cecoder-home\.html/.test(p3.url()), p3.url());
  await p3.close(); await p2.close();
}

/* ============ F 窄窗：1280 不溢出、工序一屏 ============ */
{
  const p = await mk('cecoder-summary.html?id=0', 1280, 800);
  const f = await p.evaluate(() => {
    const w = document.querySelector('.sum-wrap');
    const tr = document.querySelector('.sa-table').getBoundingClientRect();
    const last = [...document.querySelectorAll('.sa-row.is-open .sa-tr:not(.is-th)')[0].querySelectorAll('span')].pop().getBoundingClientRect();
    return {
      over: w.scrollWidth - w.clientWidth,
      tableIn: last.right <= tr.right + 1,
      steps: document.querySelectorAll('.ss-item').length,
      trackW: Math.round(document.querySelector('.ss-track').getBoundingClientRect().width),
      trackW2: Math.round(document.querySelector('.ss-track').scrollWidth),
    };
  });
  ok('F1 1280：内容区无横向滚动、状态列不越出表格', f.over <= 0 && f.tableIn, JSON.stringify(f));
  ok('F2 1280：六道工序仍是一行（轨道收窄后 916 → 约 776）', f.steps === 6 && f.trackW < 916 && f.trackW > 700, f.trackW + '');
  await p.close();
}

await b.close();
console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
