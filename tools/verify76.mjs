/* 第 79 轮验收：任务总结工序页（按稿完全重铺：9 道工序同款容器 / 派发卡 / 工序资产 / 派发弹窗 / 互跳） */
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

/* ============ A 工序条：与「代码开发」任务页同一容器、同一 9 道工序 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const a = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const q = s => box(document.querySelector(s));
    const items = [...document.querySelectorAll('#tkStepTrack .ts-item')];
    return {
      bar: q('.task-steps'),
      names: items.map(s => s.querySelector('.ts-name').textContent),
      states: items.map(s => s.querySelector('.ts-state').textContent),
      now: document.querySelector('.ts-item.is-now .ts-name').textContent,
      nowIconBg: getComputedStyle(document.querySelector('.ts-item.is-now .ts-icon')).backgroundColor,
      doneIconBg: getComputedStyle(document.querySelector('.ts-item.is-done .ts-icon')).backgroundColor,
      links: document.querySelectorAll('#tkStepTrack .ts-link').length,
      col: q('.sum-col'), wrap: q('.sum-wrap'),
      overflow: document.getElementById('tkStepScroll').scrollWidth - document.getElementById('tkStepScroll').clientWidth,
    };
  });
  ok('A1 工序条沿用任务页容器：87 高、贴顶栏 44', a.bar.h === 87 && a.bar.y === 44, JSON.stringify(a.bar));
  ok('A2 9 道工序、名称与「代码开发」一致',
    a.names.join('/') === '概要设计/详细设计/程序设计/代码变更分析/代码开发/代码审查/白盒测试/提交流水线/任务总结', a.names.join('/'));
  ok('A3 末位 = 任务总结（当前，实心主色圆点）；前 8 道已完成',
    a.now === '任务总结' && a.nowIconBg === 'rgb(55, 112, 247)' && a.states.slice(0, 8).every(s => s === '已完成') && a.states[8] === '当前',
    a.nowIconBg + ' ' + a.states.join('/'));
  ok('A4 已完成圆点蓝底 #F5F8FF；8 段连线全亮', a.doneIconBg === 'rgb(245, 248, 255)' && a.links === 8, a.doneIconBg + ' ' + a.links);
  ok('A5 内容列 1024 居中、自 131 起（44 + 87）', a.col.w === 1024 && a.wrap.y === 131, JSON.stringify([a.col.w, a.wrap.y]));
  ok('A6 1920 下工序条不出横向滚动', a.overflow <= 0, a.overflow);
  ok('A7 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ B 内容几何（稿 3495:55203 / 3337:53274 / 3395:59974） ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const c = await p.evaluate(() => {
    const col = document.querySelector('.sum-col').getBoundingClientRect();
    const rel = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left - col.left), y: Math.round(r.top - col.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const cs = (s, k) => getComputedStyle(document.querySelector(s))[k];
    const dp = document.querySelector('.sum-dp');
    const rows = [...document.querySelectorAll('.sa-row')];
    const trs = [...document.querySelectorAll('.sa-row.is-open .sa-tr')];
    return {
      col: { w: Math.round(col.width), h: Math.round(col.height) },
      h: rel(document.querySelector('.sum-h')),
      hTxt: cs('.sum-h-txt', 'fontSize') + '/' + cs('.sum-h-txt', 'fontWeight'),
      lines: [...document.querySelectorAll('.sum-h-line')].map(e => Math.round(e.getBoundingClientRect().width)),
      dp: rel(dp),
      dpBg: getComputedStyle(dp).backgroundColor,
      dpShadow: getComputedStyle(dp).boxShadow,
      dpRadius: getComputedStyle(dp).borderRadius,
      ico: rel(document.querySelector('.sum-dp-ico')),
      icoShadow: cs('.sum-dp-ico', 'boxShadow'),
      t: rel(document.querySelector('.sum-dp-t')),
      tFont: cs('.sum-dp-t', 'fontSize') + '/' + cs('.sum-dp-t', 'lineHeight') + '/' + cs('.sum-dp-t', 'fontWeight'),
      d: rel(document.querySelector('.sum-dp-d')),
      dFont: cs('.sum-dp-d', 'fontSize') + '/' + cs('.sum-dp-d', 'lineHeight'),
      dColor: cs('.sum-dp-d', 'color'),
      btn: rel(document.querySelector('.sum-dp-btn')),
      btnFont: cs('.sum-dp-btn', 'fontSize') + '/' + cs('.sum-dp-btn', 'lineHeight'),
      assets: rel(document.querySelector('.sum-assets')),
      head: rel(document.querySelector('.sa-head')),
      all: rel(document.querySelector('.sa-all')),
      row1: rel(rows[0]), row1H: rel(rows[0].querySelector('.sa-row-h')),
      tags: [...document.querySelectorAll('.sa-row.is-open .sa-tag')].map(e => Math.round(e.getBoundingClientRect().height)),
      tagBg: cs('.sa-tag', 'backgroundColor'),
      table: rel(document.querySelector('.sa-table')),
      th: Math.round(trs[0].getBoundingClientRect().height),
      trH: Math.round(trs[1].getBoundingClientRect().height),
      colX: [...trs[1].querySelectorAll('span')].map(s => Math.round(s.getBoundingClientRect().left - col.left - 16)),
      rowH: rows.map(r => Math.round(r.getBoundingClientRect().height)),
      row2: rel(rows[1]),
      warns: [...document.querySelectorAll('.sa-state.is-warn')].map(e => getComputedStyle(e).color),
      oks: [...document.querySelectorAll('.sa-state.is-ok')].map(e => getComputedStyle(e).color),
      over: document.querySelector('.sum-wrap').scrollWidth - document.querySelector('.sum-wrap').clientWidth,
    };
  });
  ok('B1 内容列 1024×802；标题 28 高、20/500、两侧 456 横线',
    c.col.w === 1024 && c.col.h === 802 && c.h.h === 28 && c.hTxt === '20px/500' && c.lines.join('/') === '456/456',
    JSON.stringify([c.col, c.h, c.lines]));
  ok('B2 派发卡 1024×96 @52、底 #F7F7F7、r4、内描边且卡身无投影',
    c.dp.y === 52 && c.dp.w === 1024 && c.dp.h === 96 && c.dpBg === 'rgb(247, 247, 247)' &&
    c.dpShadow === 'rgb(238, 238, 238) 0px 0px 0px 1px inset' && c.dpRadius === '4px',
    JSON.stringify([c.dp, c.dpBg, c.dpShadow]));
  ok('B3 卡内：图标 40×40 @16,16（白底 + 0 1 2 阴影）/ 标题 14/22/500 / 描述 700×40、12/20、#6B6B6B',
    c.ico.x - c.dp.x === 16 && c.ico.y - c.dp.y === 16 && c.ico.w === 40 && c.t.x === 68 && c.tFont === '14px/22px/500' &&
    c.d.w === 700 && c.d.h === 40 && c.dFont === '12px/20px' && c.dColor === 'rgb(107, 107, 107)' && /rgba\(0, 0, 0, 0\.08\) 0px 1px 2px/.test(c.icoShadow),
    JSON.stringify([c.ico, c.tFont, c.d, c.dFont, c.dColor]));
  ok('B4 按钮 134×32、右边距 20、文字 14/22',
    c.btn.w === 134 && c.btn.h === 32 && c.btn.x + c.btn.w === 1004 && c.btnFont === '14px/22px',
    JSON.stringify(c.btn));
  ok('B5 工序资产自 168 起、头部 42、右上按钮 32×32 贴右',
    c.assets.y === 168 && c.head.h === 42 && c.all.w === 32 && c.all.x + c.all.w === 1024 && c.all.y - c.head.y === 10,
    JSON.stringify([c.assets, c.head, c.all]));
  ok('B6 展开卡 1024×288 自 226 起、行头 40、标签 2 条 24 高、底 #F5F8FF',
    c.row1.y === 226 && c.row1.h === 288 && c.row1H.h === 40 && c.tags.length === 2 && c.tags.every(v => v === 24) && c.tagBg === 'rgb(245, 248, 255)',
    JSON.stringify([c.row1, c.tags]));
  ok('B7 表格 992×176（表头 32 + 4 行 36）',
    c.table.w === 992 && c.table.h === 176 && c.th === 32 && c.trH === 36, JSON.stringify([c.table, c.th, c.trH]));
  ok('B8 表格列 12 / 68 / 692 / 812 / 902',
    c.colX.join('/') === '12/68/692/812/902', c.colX.join('/'));
  ok('B9 7 行：首行展开 288 + 6 行 40、行距 8（末行收在 802）',
    c.rowH.length === 7 && c.rowH[0] === 288 && c.rowH.slice(1).every(v => v === 40) &&
    c.row2.y === c.row1.y + 288 + 8 && c.row2.y + 6 * 40 + 5 * 8 === 802,
    c.rowH.join('/') + ' row2@' + c.row2.y);
  ok('B10 状态：已就绪/无产出记录 #30953B（带勾）、待产出 #FF7D00',
    c.oks.every(v => v === 'rgb(48, 149, 59)') && c.warns.every(v => v === 'rgb(255, 125, 0)'),
    c.oks[0] + ' ' + c.warns[0]);
  ok('B11 1920 下内容区无横向溢出', c.over <= 0, c.over);
  await p.close();
}

/* ============ C 折叠 / 展开 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const h = () => p.evaluate(() => [...document.querySelectorAll('.sa-row')].map(r => Math.round(r.getBoundingClientRect().height)));
  const before = await h();
  await p.tap('.sa-row:nth-child(2) .sa-row-h'); await wait(120);
  const opened = await h();
  ok('C1 点折叠行 → 展开（40 → 约 288）', before[1] === 40 && opened[1] > 200, before[1] + ' → ' + opened[1]);

  await p.tap('.sa-row:nth-child(2) .sa-row-h'); await wait(120);
  const shut = await h();
  ok('C2 再点行头 → 收起', shut[1] === 40, shut[1]);

  await p.tap('#saAll'); await wait(200);
  const allOpen = await h();
  ok('C3 「全部展开」→ 7 行全开、aria=true',
    allOpen.every(v => v > 40) && await p.evaluate(() => document.getElementById('saAll').getAttribute('aria-expanded')) === 'true', allOpen.join('/'));

  await p.tap('#saAll'); await wait(200);
  const allShut = await h();
  ok('C4 再点 → 全收，7 行都 40、aria=false',
    allShut.every(v => v === 40) && await p.evaluate(() => document.getElementById('saAll').getAttribute('aria-expanded')) === 'false', allShut.join('/'));
  await p.close();
}

/* ============ D 派发弹窗（两态 + 出卡 + 派发） ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  await p.tap('#sumOpenDispatch'); await wait(320);
  const d = await p.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    return {
      open: document.getElementById('dpModal').classList.contains('is-open'),
      dlg: box('.dp-dlg'), head: box('.dp-head'), left: box('.dp-left'), foot: box('.dp-foot'), lfoot: box('.dp-left-foot'),
      empty: !!document.querySelector('.dp-empty'), grps: document.querySelectorAll('.dp-grp').length,
      count: document.getElementById('dpCount').textContent, cards: document.querySelectorAll('.dp-card').length,
    };
  });
  ok('D1 派发卡按钮 → 弹窗打开，1200×804', d.open && d.dlg.w === 1200 && d.dlg.h === 804, JSON.stringify(d.dlg));
  ok('D2 头 48 / 左列 400×700 / 左列底 48 / 底部 56',
    d.head.h === 48 && d.left.w === 400 && d.left.h === 700 && d.lfoot.h === 48 && d.foot.h === 56, JSON.stringify([d.head, d.left]));
  ok('D3 拆分前：空态 + 5 个工序组 + 计数 0 项', d.empty && d.grps === 5 && d.cards === 0 && /已选 0 项/.test(d.count), d.count);

  await p.evaluate(() => document.getElementById('dpSelectAll').click()); await wait(220);
  const all = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.dp-card')];
    return {
      n: cards.length, types: cards.map(c => c.querySelector('.dp-type').textContent),
      count: document.getElementById('dpCount').textContent,
      h0: Math.round(cards[0].getBoundingClientRect().height),
      dv: cards[0].querySelectorAll('.dp-dv-list .dp-ck').length,
      btns: [...cards[0].querySelectorAll('.dp-card-btns .dp-btn')].map(b => b.textContent),
    };
  });
  ok('D4 全选 → 三张卡（架构设计 / 代码开发 / 缺陷修复）', all.n === 3 && all.types.join('/') === '架构设计/代码开发/缺陷修复', all.types.join('/'));
  ok('D5 架构设计卡展开详情 340、传递资产 6 项、按钮「收起详情/移除」',
    all.h0 === 340 && all.dv === 6 && all.btns.join('/') === '收起详情/移除', all.h0 + ' ' + all.dv + ' ' + all.btns.join('/'));
  ok('D6 计数 = 共 15 项，已选 15 项', all.count === '共 15 项，已选 15 项', all.count);

  await p.evaluate(() => document.getElementById('dpGo').click()); await wait(240);
  const t = await p.evaluate(() => ({ hidden: document.getElementById('dpToast').hidden, txt: document.getElementById('dpToastTxt').textContent }));
  ok('D7 派发 → 提示「已派发 3 项任务，任务已完成」', t.hidden === false && /已派发 3 项任务/.test(t.txt), JSON.stringify(t));

  await wait(1500);
  ok('D8 提示后自动关窗', await p.evaluate(() => !document.getElementById('dpModal').classList.contains('is-open')));

  await p.tap('#sumOpenDispatch'); await wait(220);
  await p.keyboard.press('Escape'); await wait(200);
  ok('D9 Esc 关闭弹窗', await p.evaluate(() => !document.getElementById('dpModal').classList.contains('is-open')));
  await p.close();
}

/* ============ E 页面互跳 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  await p.tap('.sum-back'); await wait(600);
  ok('E1 「任务执行」→ 任务页', /cecoder-task\.html/.test(p.url()), p.url());

  const p2 = await mk('cecoder-task.html?id=0');
  await p2.tap('a.tk-sum-link'); await wait(600);
  ok('E2 任务页页签「任务总结」→ 总结页', /cecoder-summary\.html/.test(p2.url()), p2.url());

  const p3 = await mk('cecoder-summary.html?id=0');
  await p3.tap('#tkStepTrack .ts-item[data-step="1"]'); await wait(600);
  ok('E3 工序条第 1 道 → 任务页', /cecoder-task\.html/.test(p3.url()), p3.url());

  const p4 = await mk('cecoder-summary.html?id=0');
  await p4.tap('.tt-home'); await wait(600);
  ok('E4 顶栏「首页」→ 首页', /cecoder-home\.html/.test(p4.url()), p4.url());
  await p4.close(); await p3.close(); await p2.close();
}

/* ============ F 窄窗 1280 不溢出 ============ */
{
  const p = await mk('cecoder-summary.html?id=0', 1280, 800);
  const f = await p.evaluate(() => {
    const w = document.querySelector('.sum-wrap');
    const tbl = document.querySelector('.sa-table').getBoundingClientRect();
    const last = [...document.querySelectorAll('.sa-row.is-open .sa-tr:not(.is-th)')[0].querySelectorAll('span')].pop().getBoundingClientRect();
    return { over: w.scrollWidth - w.clientWidth, tableIn: last.right <= tbl.right + 1, colW: Math.round(document.querySelector('.sum-col').getBoundingClientRect().width) };
  });
  ok('F1 1280：内容列收窄到可用宽、无横向滚动、状态列不越界', f.over <= 0 && f.tableIn && f.colW < 1024, JSON.stringify(f));
  await p.close();
}

await b.close();
console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
