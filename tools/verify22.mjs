/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const F = 'file:///' + BASE + '/cecoder-home.html';
/* 第 30 轮：会话/任务已拆成独立页面 */
const SESS = 'file:///' + BASE + '/cecoder-session.html?tab=%E4%BC%9A%E8%AF%9D&id=0';
const b = await puppeteer.launch({
  executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  headless: 'new', args: ['--force-device-scale-factor=1']
});
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(w = 1440, h = 900, dw = 320, open = true, url = F) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  return p;
}

/* ========== 1 会话页签：AI Native Factory 空态 + 默认收起 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(350);
  const d = await p.evaluate(() => {
    const g = document.getElementById('wdSessSub5').closest('.wd-grp');
    const sub = document.getElementById('wdSessSub5');
    const num = g.querySelector('.wd-num');
    return {
      open: g.classList.contains('is-open'), aria: g.querySelector('.wd-grp-head').getAttribute('aria-expanded'),
      subH: Math.round(sub.getBoundingClientRect().height),
      cards: sub.querySelectorAll('.wd-sess-card').length,
      empty: !!sub.querySelector('.wd-empty'), isEmpty: sub.classList.contains('is-empty'),
      title: sub.querySelector('.wd-empty-title') ? sub.querySelector('.wd-empty-title').textContent : '',
      num: num ? num.textContent : null, numDisp: num ? getComputedStyle(num).display : 'none'
    };
  });
  ok('1 会话页签 AI Native Factory 默认收起', !d.open && d.aria === 'false' && d.subH === 0, JSON.stringify(d));
  ok('1 该分组是空态（无卡片 + wd-empty）', d.cards === 0 && d.empty && d.isEmpty, '');
  ok('1 空态文案「该目录下还没有会话」', /还没有会话/.test(d.title), d.title);
  ok('1 空分组不显示计数', d.numDisp === 'none', String(d.num));

  /* 展开后能看到空态块 */
  await p.evaluate(() => document.getElementById('wdSessSub5').closest('.wd-grp').querySelector('.wd-grp-head').click());
  await wait(320);
  const e = await p.evaluate(() => {
    const em = document.querySelector('#wdSessSub5 .wd-empty');
    const r = em.getBoundingClientRect();
    return { h: Math.round(r.height), vis: getComputedStyle(em).display !== 'none' };
  });
  ok('1 展开后显示空态块', e.vis && e.h > 60, JSON.stringify(e));
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2 会话卡片点击选中态 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(350);
  const marks = () => p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => c.classList.contains('is-sel')));
  const init = await marks();
  ok('2 初始只有第 1 张选中', init.join(',') === 'true,false,false,false', init.join(','));

  await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')][2].click());
  await wait(450);
  const a = await marks();
  ok('2 点第 3 张 → 选中转移到它（单选）', a.join(',') === 'false,false,true,false', a.join(','));
  const sel = await p.evaluate(() => {
    const c = [...document.querySelectorAll('#wdViewSession .wd-sess-card')][2];
    return { bg: getComputedStyle(c).backgroundColor, chat: document.querySelector('.stage').classList.contains('is-chat') };
  });
  ok('2 选中态是蓝色底（与任务卡同一套）', /55, 112, 247/.test(sel.bg), sel.bg);
  ok('2 同时进入会话详情', sel.chat, '');

  /* 退出会话后选中态保留 */
  await p.keyboard.press('Escape');
  await wait(400);
  const back = await marks();
  ok('2 退出会话后选中态保留', back.join(',') === 'false,false,true,false', back.join(','));

  /* 点「更多」不改变选中态 */
  const card = (await p.$$('#wdViewSession .wd-sess-card'))[1];
  const cb = await card.boundingBox();
  await p.mouse.move(cb.x + 40, cb.y + cb.height / 2);
  await wait(250);
  await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')][1].querySelector('.wd-more').click());
  await wait(300);
  const after = await marks();
  ok('2 点「更多」不改变选中', after.join(',') === 'false,false,true,false', after.join(','));
  ok('2 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.screenshot({ path: 'R22-sess.png', clip: { x: 0, y: 100, width: 340, height: 620 } });
  await p.close();
}

/* ========== 3/4 标题栏通栏 + 展开按钮贴角 ========== */
{
  const p = await page(1440, 900, 320, false, SESS);
  const m = await p.evaluate(() => {
    /* 抽屉展开时按钮带 translateX(8) 做视觉跟随，量布局值（offsetLeft/Top）才稳定 */
    const mb = document.querySelector('.menu-btn');
    return { menuLeft: mb.offsetLeft, menuTop: mb.offsetTop };
  });
  /* 第 29 轮：恢复左上 7px 内缩（0,0 太贴边） */
  ok('4 展开按钮左上 7px 内缩', m.menuLeft === 7 && m.menuTop === 7, JSON.stringify(m));

  await wait(300);
  const d = await p.evaluate(() => {
    const pm = document.getElementById('panelMain').getBoundingClientRect();
    const h = document.querySelector('.chat-head').getBoundingClientRect();
    const tab = document.querySelector('.chat-tab').getBoundingClientRect();
    const st = document.querySelector('.stage').getBoundingClientRect();
    return { left: Math.round(h.left - pm.left), right: Math.round(h.right - pm.left), pw: Math.round(pm.width),
      h: Math.round(h.height), tabLeft: Math.round(tab.left - pm.left), stageTop: Math.round(st.top - pm.top),
      bg: getComputedStyle(document.querySelector('.chat-head')).backgroundColor };
  });
  ok('3 标题栏通栏（左右贴 panel-main 两边）', d.left === 0 && d.right === d.pw, JSON.stringify(d));
  ok('3 标题栏 44 高', d.h === 44, String(d.h));
  /* 第 31 轮：抽屉展开（菜单键淡出）时页签按稿件真值 24；收起时 44 让开 28px 按钮 */
  ok('3 页签左间距 24（抽屉展开）', d.tabLeft === 24, String(d.tabLeft));
  ok('3 内容从标题栏下沿开始', d.stageTop === 44, String(d.stageTop));
  ok('3 标题栏不透底（白底压住滚动内容）', d.bg === 'rgb(255, 255, 255)', d.bg);
  await p.screenshot({ path: 'R22-chat.png' });
  ok('3 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 5 会话页底部输入卡：单卡形态 ========== */
{
  const p = await page(1440, 900, 320, false, SESS);
  await wait(300);
  const d = await p.evaluate(() => {
    const card = document.querySelector('.c-card').getBoundingClientRect();
    const row = document.querySelector('.c-row').getBoundingClientRect();
    const foot = document.querySelector('.c-foot').getBoundingClientRect();
    const composer = document.querySelector('.composer').getBoundingClientRect();
    const plate = getComputedStyle(document.querySelector('.c-plate')).display;
    const ciH = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
    return {
      plate, cardH: Math.round(card.height), composerH: Math.round(composer.height),
      footDisplay: getComputedStyle(document.querySelector('.c-foot')).display,
      cardEqComposer: Math.abs(card.height - composer.height) < 1,
      expectH: Math.round(ciH + 82),
      env: !!document.querySelector('.c-foot .c-env'), hint: !!document.querySelector('.c-hint')
    };
  });
  ok('5 去掉灰色背板', d.plate === 'none', d.plate);
  ok('5 输入卡高 = 内容高 + 82（对话页无次级行）', d.cardH === d.expectH, d.cardH + ' vs ' + d.expectH);
  ok('5 卡片即底栏（与 composer 等高）', d.cardEqComposer, d.cardH + ' / ' + d.composerH);
  /* 第 24 轮：对话页不需要「本地/工作目录/Enter 提示」这一行，整条隐藏 */
  ok('5 次级行在对话页隐藏', d.footDisplay === 'none', d.footDisplay);
  await p.screenshot({ path: 'R22-composer.png', clip: { x: 320, y: 470, width: 740, height: 180 } });
  ok('5 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
