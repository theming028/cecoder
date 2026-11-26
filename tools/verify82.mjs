/* 第 82 轮验收：派发弹窗高度方案 / UI设计页 AI 栏 / 代码生成与确认页 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1440, h = 1000) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(500);
  return p;
}
const R = (p, s) => p.evaluate(sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }, s);

/* ============ A 派发弹窗高度方案 = 云端任务同步 ============ */
{
  const p = await mk('cecoder-summary.html');
  const panel = await R(p, '.panel');
  await p.evaluate(() => document.getElementById('sumOpenDispatch').click());
  await wait(400);
  const dlg = await R(p, '.dp-dlg');
  await p.evaluate(() => {
    document.getElementById('dpModal').classList.remove('is-open');
    document.getElementById('syncModal').classList.add('is-open');
  });
  await wait(400);
  const cm = await R(p, '.cm-panel');
  ok('A1 派发弹窗与云端同步弹窗同高（上下各 40 撑满面板）',
    dlg[1] - panel[1] === 40 && panel[1] + panel[3] - (dlg[1] + dlg[3]) === 40 &&
    cm[1] - panel[1] === 40 && panel[1] + panel[3] - (cm[1] + cm[3]) === 40,
    JSON.stringify({ panel, dlg, cm }));
  ok('A2 两窗都水平居中于面板（中心同 x）',
    Math.abs((dlg[0] + dlg[2] / 2) - (panel[0] + panel[2] / 2)) <= 1 &&
    Math.abs((cm[0] + cm[2] / 2) - (panel[0] + panel[2] / 2)) <= 1,
    [dlg[0] + dlg[2] / 2, cm[0] + cm[2] / 2, panel[0] + panel[2] / 2].join('/'));
  ok('A3 派发窗 1200 宽、云端同步 1080 宽（各自上限保留）', dlg[2] === 1200 && cm[2] === 1080, dlg[2] + '/' + cm[2]);
  ok('A4 弹窗无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ B UI设计页：默认带出 AI 对话栏 ============ */
{
  const p = await mk('cecoder-ui.html');
  const v = await p.evaluate(() => {
    const ai = document.getElementById('aiSide');
    const r = ai.getBoundingClientRect();
    const blank = document.querySelector('.ui-blank').getBoundingClientRect();
    return {
      ai: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      hidden: ai.getAttribute('aria-hidden'),
      off: document.querySelector('.panel').classList.contains('is-ai-off'),
      title: document.querySelector('.ai-h-title').textContent.trim(),
      divider: document.querySelector('.ai-divider span').textContent.trim(),
      blankRight: Math.round(blank.x + blank.width),
      err: 0,
    };
  });
  ok('B1 UI设计页默认展开 AI 对话栏（450 宽、面板右侧、未被收起）',
    v.ai[2] === 450 && v.ai[0] === 982 && v.hidden === 'false' && v.off === false, JSON.stringify(v.ai) + ' ' + v.hidden);
  ok('B2 中栏被 AI 栏挤压、不与其重叠', v.blankRight <= v.ai[0], v.blankRight + ' vs ' + v.ai[0]);
  ok('B3 栏内文案换成 UI设计口径', v.title === '生成 UI 设计稿' && v.divider === '已加载 UI设计资产与组件规范', v.title + ' / ' + v.divider);
  ok('B4 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ C 代码生成与确认页 ============ */
{
  /* 第 84 轮：右栏补了 AI 450，按设计稿宽度 1094 验收（1920 视口） */
  const p = await mk('cecoder-codegen.html', 1920, 1080);
  const c = await p.evaluate(() => {
    const col = document.querySelector('.cg-col').getBoundingClientRect();
    const f = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x - col.x), Math.round(r.y - col.y), Math.round(r.width), Math.round(r.height)]; };
    return {
      col: [Math.round(col.width)],
      head: f('.cg-head'),
      s1: f('.cg-step.is-done'), arrow: f('.cg-arrow'), s2: f('.cg-step.is-on'),
      tag: document.querySelector('.cg-confirmed').textContent.trim(),
      set: f('.cg-set'), setHead: f('.cg-set-head'),
      repos: [...document.querySelectorAll('.cg-repo')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.y - col.y), Math.round(r.height), Math.round(r.width)]; }),
      prog: f('.cg-prog'), bar: f('.cg-bar'),
      barIn: Math.round(document.querySelector('.cg-bar-in').getBoundingClientRect().width),
      stats: document.querySelector('.cg-prog-s').textContent.replace(/\s+/g, ' ').trim(),
      cards: [...document.querySelectorAll('.cg-card')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.y - col.y), Math.round(r.height), Math.round(r.width)]; }),
      risks: [...document.querySelectorAll('.cg-risk')].map(e => e.textContent.trim()),
      states: [...document.querySelectorAll('.cg-st')].map(e => e.textContent.trim()),
      chips: [...document.querySelectorAll('.cg-flow .cg-chip')].map(e => e.textContent.trim()),
      foot: f('.cg-foot'),
      btn1: { t: document.getElementById('cgGen').textContent.trim(), dis: document.getElementById('cgGen').disabled },
      btn2: document.getElementById('cgRegen').textContent.trim(),
      step9: (document.querySelector('.ts-item[data-step="9"]') || {}).getAttribute && document.querySelector('.ts-item[data-step="9"]').getAttribute('href'),
      nowStep: document.querySelector('.ts-item.is-now .ts-name').textContent,
    };
  });
  ok('C1 内容列 1094 宽（与稿一致）', c.col[0] === 1094, c.col[0]);
  ok('C2 子工序条：两块各 474×56，起点 0 / 508，箭头 484',
    c.s1.join() === '0,0,474,56' && c.s2.join() === '508,0,474,56' && c.arrow.join() === '484,21,14,14',
    [c.s1, c.s2, c.arrow].join(' / '));
  ok('C3 已完成那块右侧挂「已确认」', c.tag === '已确认', c.tag);
  ok('C4 生成设置卡 1094×262，头 36', c.set[2] === 1094 && c.set[3] === 262 && c.setHead[3] === 36, [c.set, c.setHead].join(' '));
  ok('C5 两行仓库各 1044×44', c.repos.length === 2 && c.repos.every(r => r[1] === 44 && r[2] === 1044), JSON.stringify(c.repos));
  ok('C6 生成进度块 427（稿 426）、进度条 6 高、起手从 0 开始涨',
    Math.abs(c.prog[3] - 426) <= 1 && c.bar[3] === 6 && c.barIn < 80, [c.prog[3], c.bar[3], c.barIn].join('/'));
  ok('C7 统计文案（第 84 轮起从 0 开始，总数 = 卡数 4）', c.stats.replace(/\s+/g, '') === '已生成0/4·待确认0·已确认0/4', c.stats);
  ok('C8 四张卡 106/80/80/80（第一张即生成中），纵向 418 起',
    JSON.stringify(c.cards.map(x => [x[0], x[1]])) === JSON.stringify([[418, 106], [532, 80], [620, 80], [708, 80]]),
    JSON.stringify(c.cards));
  ok('C9 风险徽标与状态文案齐全', c.risks.join('/') === '中风险/低风险/高风险/低风险' && c.states.join('/') === '生成中/待生成/待生成/待生成', c.risks.join('/') + ' | ' + c.states.join('/'));
  ok('C10 生成流程 5 步（读取Spec/对比现有代码/生成代码/规则检查/核对Spec）',
    c.chips.join('/') === '读取Spec/对比现有代码/生成代码/规则检查/核对Spec', c.chips.join('/'));
  ok('C11 底栏 = 代码生成中（禁用，带转圈）+ 全部重新生成',
    c.foot[3] === 56 && c.btn1.t === '代码生成中' && c.btn1.dis === true && c.btn2 === '全部重新生成', JSON.stringify(c.btn1) + ' ' + c.btn2);
  ok('C12 工序条第 5 道「代码开发」为当前，第 9 道仍回任务总结',
    c.nowStep === '代码开发' && c.step9 === 'cecoder-summary.html?id=0', c.nowStep + ' ' + c.step9);

  /* 交互：折叠生成设置 / 全部重新生成 / 忽略 */
  const i1 = await p.evaluate(() => {
    document.getElementById('cgSetToggle').click();
    return { closed: document.getElementById('cgSet').classList.contains('is-closed'), exp: document.getElementById('cgSetToggle').getAttribute('aria-expanded'), body: getComputedStyle(document.querySelector('.cg-set-body')).display };
  });
  ok('C13 生成设置可折叠（caret 转 -90、正文 display:none）', i1.closed === true && i1.exp === 'false' && i1.body === 'none', JSON.stringify(i1));
  const i2 = await p.evaluate(() => {
    document.getElementById('cgSetToggle').click();
    document.getElementById('cgRegen').click();
    return document.querySelector('.cg-bar-in').style.width;
  });
  await wait(700);
  const i3 = await p.evaluate(() => Math.round(document.querySelector('.cg-bar-in').getBoundingClientRect().width));
  ok('C14 全部重新生成 → 进度条清零重跑', parseFloat(i2) === 0 && i3 === 0, i2 + ' → ' + i3);
  const i4 = await p.evaluate(() => {
    const n0 = document.querySelectorAll('.cg-card').length;
    document.querySelector('.cg-card[data-risk="high"] [data-cg-ignore]').click();
    return [n0, document.querySelectorAll('.cg-card').length];
  });
  ok('C15 忽略 → 摘掉该变更卡', i4[0] === 4 && i4[1] === 3, i4.join('→'));
  ok('C16 页内交互无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ D 任务页跳转 ============ */
{
  const p = await mk('cecoder-task.html');
  await p.evaluate(() => document.getElementById('tpStart').click());
  await wait(1100);
  const conf = await p.evaluate(() => !document.getElementById('tpConfirm').hidden);
  await p.evaluate(() => document.getElementById('tpConfirm').click());
  await wait(1100);
  ok('D1 确认变更范围 → 进入代码生成与确认页', /cecoder-codegen\.html/.test(p.url()), p.url().split('/').pop());
  ok('D2 落地页标题与主体正确', await p.evaluate(() => document.title) === 'Cecoder · 代码生成与确认' && await p.evaluate(() => !!document.querySelector('.cg-list')));
  ok('D3 跳转无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

await b.close();
console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
