/* 第 81 轮验收：公共顶栏 / 总结页细节色与图标 / 末步绿勾 / 岗位下拉 / 空态虚线 / 弹窗层级与滚动 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1440, h = 900) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(500);
  return p;
}

/* ============ A 顶栏：总结页 / UI页 与任务页同款 ============ */
{
  const task = await mk('cecoder-task.html');
  const summary = await mk('cecoder-summary.html');
  const ui = await mk('cecoder-ui.html');
  const grab = p => p.evaluate(() => {
    const t = document.querySelector('.task-top');
    const r = t.getBoundingClientRect();
    const ids = [...t.querySelectorAll('.tt-right > *')].map(e => e.id || e.className.split(' ')[0]);
    return { html: t.innerHTML.replace(/\s+/g, ' ').trim(), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], ids, hasBack: !!t.querySelector('.sum-back'), title: t.querySelector('.tt-title').textContent };
  });
  const a = await grab(task), s = await grab(summary), u = await grab(ui);
  ok('A1 总结页顶栏与任务页逐字节一致', a.html === s.html, 'diff');
  ok('A2 UI设计页顶栏与任务页一致', a.html === u.html, 'diff');
  ok('A3 顶栏同高 44、同起于面板顶；UI页也带 AI 栏，宽度与任务页一致', [a, s, u].every(x => x.rect[1] === 48 && x.rect[3] === 44) && a.rect.join() === u.rect.join(), [a.rect, s.rect, u.rect].join(' / '));
  ok('A4 不再有「任务执行」返链，右侧仍是 自动执行/证据链/工序进度/AI协作',
    !s.hasBack && a.ids.join('|') === s.ids.join('|') && s.ids.join('|') === 'tkRun|tt-vsep|tkEvidence|tt-now|tkAiOpen', s.ids.join('|'));
  ok('A5 三页无脚本报错', [task, summary, ui].every(p => p.__e.length === 0), [task.__e, summary.__e, ui.__e].flat().slice(0, 3).join(' / '));
  await task.close(); await ui.close();

  /* ============ B 总结页：副标题 / 图标 / 表头 / 末步绿勾 ============ */
  const b1 = await summary.evaluate(() => {
    const cs = (s, k) => getComputedStyle(document.querySelector(s))[k];
    const icon9 = document.querySelector('.ts-item[data-step="9"] .ts-icon');
    const all = document.querySelector('.sa-all svg path');
    const th = [...document.querySelectorAll('.sa-tr.is-th')].slice(0, 1).map(tr => [...tr.children].map(e => getComputedStyle(e).color)).flat();
    return {
      headS: cs('.sa-head-s', 'color'),
      saAllW: Math.round(document.querySelector('.sa-all').getBoundingClientRect().width),
      saAllPaths: (all.getAttribute('d').match(/M/g) || []).length,
      th,
      icon9: { bg: getComputedStyle(icon9).backgroundColor, color: getComputedStyle(icon9).color, ring: getComputedStyle(icon9, '::after').display, hasCheck: !!icon9.querySelector('svg path') },
      state9: getComputedStyle(document.querySelector('.ts-item[data-step="9"] .ts-state')).color,
    };
  });
  ok('B1 工序资产副标题 #868686（不再与标题同黑）', b1.headS === 'rgb(134, 134, 134)', b1.headS);
  ok('B2 右上按钮 32×32，图标为稿里的「折叠全部」（5 段路径）', b1.saAllW === 32 && b1.saAllPaths === 5, b1.saAllW + ' ' + b1.saAllPaths);
  ok('B3 表头「序号」与其余表头同色 #6B6B6B', b1.th.length === 5 && b1.th.every(c => c === 'rgb(107, 107, 107)'), b1.th.join('/'));
  ok('B4 末步「任务总结」绿底 #3BB346 + 白勾、无蓝环、状态绿',
    b1.icon9.bg === 'rgb(59, 179, 70)' && b1.icon9.color === 'rgb(255, 255, 255)' && b1.icon9.ring === 'none' && b1.icon9.hasCheck && b1.state9 === 'rgb(59, 179, 70)',
    JSON.stringify(b1.icon9) + ' ' + b1.state9);

  /* ============ C 派发弹窗 ============ */
  await summary.evaluate(() => document.getElementById('sumOpenDispatch').click());
  await wait(320);
  const c1 = await summary.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
    const modal = document.getElementById('dpModal');
    const empty = document.querySelector('.dp-empty');
    return {
      parent: modal.parentElement.className,
      modal: r('#dpModal'), mask: r('#dpModal .cm-mask'), panel: r('.panel'),
      emptyBorder: getComputedStyle(empty).border, emptyBg: getComputedStyle(empty).backgroundColor, emptyRect: r('.dp-empty'),
      listOy: getComputedStyle(document.querySelector('.dp-list')).overflowY,
      rightOy: getComputedStyle(document.querySelector('.dp-right')).overflowY,
      th: document.title,
    };
  });
  ok('C1 弹窗与蒙层都挂在 .panel 内，几何等于 panel（不溢出）',
    /\bpanel\b/.test(c1.parent) && c1.mask.join() === c1.panel.join() && c1.modal.join() === c1.panel.join(),
    c1.parent + ' ' + c1.mask + ' ' + c1.panel);
  ok('C2 空态容器 #FAFAFA + 1px 虚线 #C9C9C9', c1.emptyBg === 'rgb(250, 250, 250)' && /1px dashed rgb\(201, 201, 201\)/.test(c1.emptyBorder), c1.emptyBorder);
  ok('C3 滚动在 .dp-right（.dp-list 不再滚）', c1.rightOy === 'auto' && c1.listOy === 'visible', c1.rightOy + ' / ' + c1.listOy);

  /* 勾选顶栏 → 卡片出现、空态消失；下拉可开可选 */
  await summary.evaluate(() => document.querySelector('.dp-grp[data-grp="code"] input[data-dp-all]').click());
  await wait(260);
  const c2 = await summary.evaluate(() => {
    const cards = [...document.querySelectorAll('.dp-card')].map(c => c.dataset.key);
    const fix = document.querySelector('.dp-card[data-key="fix"]');
    const warn = fix.querySelector('.dp-type.is-warn');
    const sel = fix.querySelector('.dp-sel');
    sel.click();
    const menu = fix.querySelector('.dp-sel-menu');
    const opts = [...fix.querySelectorAll('.dp-sel-opt')];
    const open = !menu.hidden;
    opts[4].click();
    return {
      cards, empty: !!document.querySelector('.dp-empty'),
      opts: opts.map(o => o.textContent),
      warnColor: getComputedStyle(warn).color, warnBg: getComputedStyle(warn).backgroundColor,
      open, val: fix.querySelector('.dp-sel-v').textContent, closed: menu.hidden,
      exp: sel.getAttribute('aria-expanded'),
    };
  });
  ok('C5 勾选左侧顶栏后出任务卡、空态收起', c2.cards.join() === 'dev,fix' && c2.empty === false, c2.cards.join() + ' empty=' + c2.empty);
  ok('C4 岗位下拉 5 项且文案一致', c2.opts.length === 5 && c2.opts[0] === '架构师 · 张三' && c2.opts[1] === '产品经理 · 李四' && c2.opts[2] === 'UI设计师 · 王五' && c2.opts[3] === '前端工程师 · 孙六' && c2.opts[4] === '测试经理 · 赵七', c2.opts.join('/'));
  ok('C6 「缺陷修复」标签文字 #FF7D00（不再蓝色）', c2.warnColor === 'rgb(255, 125, 0)' && c2.warnBg === 'rgb(255, 247, 232)', c2.warnColor);
  ok('C7 点开岗位列表 → 选中即回填并收起', c2.open && c2.val === '测试经理 · 赵七' && c2.closed === true, JSON.stringify(c2));

  /* 关闭弹窗后清空勾选 → 空态回来 */
  await summary.evaluate(() => document.querySelector('.dp-grp[data-grp="code"] input[data-dp-all]').click());
  await wait(200);
  ok('C8 取消勾选到空 → 虚线空态重新出现', await summary.evaluate(() => !!document.querySelector('.dp-empty')));
  ok('C9 弹窗交互无脚本报错', summary.__e.length === 0, summary.__e.slice(0, 3).join(' / '));
  await summary.close();

  /* ============ D 忽略态标题常规字重 ============ */
  const t2 = await mk('cecoder-task.html');
  const d = await t2.evaluate(() => ({
    ig: getComputedStyle(document.querySelector('.cp.is-ignored .cp-title')).fontWeight,
    nm: getComputedStyle(document.querySelector('.cp:not(.is-ignored) .cp-title')).fontWeight,
  }));
  ok('D1 已忽略的变更点标题 400，未忽略仍 500', d.ig === '400' && d.nm === '500', d.ig + '/' + d.nm);
  await t2.close();
}

await b.close();
console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exitCode = 1; }
