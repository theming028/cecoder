/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({
  executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  headless: 'new', args: ['--force-device-scale-factor=1']
});
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const lastToast = () => document.querySelectorAll('.semi-toast');

async function page(w = 1440, h = 900, dw = 320, open = true) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  return p;
}

/* ========== 2 任务页签：空分组 / 单卡分区间距 / 默认收起 ========== */
{
  const p = await page();
  const d0 = await p.evaluate(() => {
    const g5 = document.getElementById('wdHead5').closest('.wd-grp');
    const num = g5.querySelector('.wd-num');
    return {
      open: g5.classList.contains('is-open'),
      aria: document.getElementById('wdHead5').getAttribute('aria-expanded'),
      subH: Math.round(document.getElementById('wdSub5').getBoundingClientRect().height),
      hasEmpty: !!g5.querySelector('.wd-sub .wd-empty'),
      isEmptyCls: g5.querySelector('.wd-sub').classList.contains('is-empty'),
      numDisp: num ? getComputedStyle(num).display : 'none'
    };
  });
  ok('2 AI Native Factory 默认收起', !d0.open && d0.aria === 'false' && d0.subH === 0, JSON.stringify(d0));
  ok('2 空分组用 wd-sub.is-empty + wd-empty', d0.hasEmpty && d0.isEmptyCls, '');
  ok('2 空分组计数隐藏', d0.numDisp === 'none', d0.numDisp);

  /* 展开单卡分组：卡片底边到下一个分组顶边 12 */
  await p.evaluate(() => document.getElementById('wdHead2').click());
  await wait(320);
  const g = await p.evaluate(() => {
    const card = document.querySelector('#wdSub2 .wd-card').getBoundingClientRect();
    const next = document.getElementById('wdHead3').getBoundingClientRect();
    const sub = document.getElementById('wdSub2').getBoundingClientRect();
    return { gap: Math.round(next.top - card.bottom), subPadBottom: getComputedStyle(document.getElementById('wdSub2')).paddingBottom,
      cards: document.querySelectorAll('#wdSub2 .wd-card').length };
  });
  ok('2 单卡分组与下一分组间距 12', g.gap === 12, JSON.stringify(g));
  ok('2 该分组确实只有一张卡', g.cards === 1, String(g.cards));

  /* 展开空分组：w d-empty 上下 24、13px、两个链接一行 */
  await p.evaluate(() => document.getElementById('wdHead5').click());
  await wait(320);
  const e = await p.evaluate(() => {
    const em = document.querySelector('#wdSub5 .wd-empty');
    const t = em.querySelector('.wd-empty-title');
    const btns = [...em.querySelectorAll('.wd-empty-acts button')];
    const er = em.getBoundingClientRect();
    return { pad: getComputedStyle(em).padding, fs: getComputedStyle(t).fontSize,
      gapTop: Math.round(t.getBoundingClientRect().top - er.top),
      oneRow: new Set(btns.map(x => Math.round(x.getBoundingClientRect().top))).size === 1,
      acts: btns.map(x => x.textContent) };
  });
  ok('2 任务空态规格同会话（13px / 上下 24）', e.fs === '13px' && e.pad === '24px 0px' && e.gapTop === 24, JSON.stringify(e));
  ok('2 空态两个链接一行', e.oneRow && e.acts.join('|') === '新建任务|同步云端任务', e.acts.join('|'));
  await p.screenshot({ path: 'R20-sidebar.png', clip: { x: 0, y: 40, width: 340, height: 620 } });
  ok('2 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* 第 30 轮：会话流已拆到独立页面 cecoder-session.html，本段由 verify25 覆盖 */

/* 第 30 轮：会话流已拆到独立页面 cecoder-session.html，本段由 verify25 覆盖 */

/* ========== 4 录音条不再被压扁 ========== */
{
  const p = await page();
  const f = await (await p.$('.float')).boundingBox();
  await p.mouse.move(f.x + 28, f.y + 28);
  await wait(300);
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(220);
  await p.evaluate(() => [...document.querySelectorAll('#fabMenu .wd-menu-item')][1].click());
  await p.mouse.move(400, 320);
  await wait(2200);
  const d = await p.evaluate(() => {
    const el = document.querySelector('.float');
    const r = el.getBoundingClientRect();
    const after = getComputedStyle(el, '::after');
    const dot = document.querySelector('.rec-dot').getBoundingClientRect();
    const stop = document.querySelector('.rec-stop').getBoundingClientRect();
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1), afterRadius: after.borderRadius,
      dotRatio: +(dot.width / dot.height).toFixed(3), dotW: +dot.width.toFixed(1),
      stopW: +stop.width.toFixed(1), stopH: +stop.height.toFixed(1),
      transform: getComputedStyle(el).transform, cls: el.className };
  });
  ok('4 工具条 212x56（无缩放）', Math.abs(d.w - 212) < 0.5 && Math.abs(d.h - 56) < 0.5, d.w + 'x' + d.h);
  ok('4 描边环跟胶囊圆角（不再椭圆）', d.afterRadius === '28px', d.afterRadius);
  ok('4 红点仍是正圆', Math.abs(d.dotRatio - 1) < 0.03, d.dotRatio + ' (' + d.dotW + ')');
  ok('4 停止键 28x28 未被压', d.stopW === 28 && d.stopH === 28, d.stopW + 'x' + d.stopH);
  ok('4 录音中不播表情动作（transform none）', d.transform === 'none' && !/is-jump|is-nod|is-happy|is-shake/.test(d.cls), d.transform + ' ' + d.cls);
  const rr = await (await p.$('.float')).boundingBox();
  await p.screenshot({ path: 'R20-rec.png', clip: { x: Math.round(rr.x) - 8, y: Math.round(rr.y) - 8, width: Math.round(rr.width) + 16, height: Math.round(rr.height) + 16 } });
  ok('4 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
