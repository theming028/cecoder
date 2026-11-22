/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const F = 'file:///' + BASE + '/cecoder-home.html';
/* 第 30 轮：会话已拆成独立页面 */
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
  p.on('pageerror', e => p.__errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push('console ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.reload({ waitUntil: 'load' });
  await wait(750);
  return p;
}

/* ========== 1 进入会话页签 → 默认选中第一张 ========== */
{
  const p = await page();
  await p.click('[data-wd-tab="会话"]');
  await wait(350);
  const first = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => c.classList.contains('is-sel')));
  ok('1 首次进入会话页签：第 1 张选中', first.join(',') === 'true,false,false,false', first.join(','));
  /* 第 30 轮：页签只落选中，不跳页；进会话要点卡片 */
  const opened = await p.evaluate(() => ({
    chat: !!document.getElementById('chatView'),
    page: document.body.dataset.page
  }));
  ok('1 进入页签不跳页（首页仍无对话流）', !opened.chat && opened.page === 'home', JSON.stringify(opened));

  /* 进第 3 条会话 → Esc 回列表 → 选中的仍是第 3 条（?sel 带回） */
  await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')][2].click());
  await p.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {});
  await wait(700);
  await p.keyboard.press('Escape');
  await p.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {});
  await wait(700);
  const again = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => c.classList.contains('is-sel')));
  ok('1 回列表保留刚才那条的选中', again.join(',') === 'false,false,true,false', again.join(','));
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2 对话页去掉 c-foot ========== */
{
  const p = await page();
  const home = await p.evaluate(() => ({
    foot: getComputedStyle(document.querySelector('.c-foot')).display,
    cardH: Math.round(document.querySelector('.c-card').getBoundingClientRect().height)
  }));
  ok('2 首页输入卡仍有次级行', home.foot !== 'none', home.foot);
  await p.close();

  /* 第 30 轮：对话页是独立页面，直接开 cecoder-session.html 量 */
  const q = await page(1440, 900, 320, true, SESS);
  const d = await q.evaluate(() => {
    const ciH = parseFloat(getComputedStyle(document.querySelector('.composer')).getPropertyValue('--ci-h')) || 46;
    const card = document.querySelector('.c-card').getBoundingClientRect();
    const comp = document.querySelector('.composer').getBoundingClientRect();
    return {
      page: document.body.dataset.page,
      foot: getComputedStyle(document.querySelector('.c-foot')).display,
      cardH: Math.round(card.height), compH: Math.round(comp.height),
      expect: Math.round(ciH + 82),
      plate: getComputedStyle(document.querySelector('.c-plate')).display
    };
  });
  ok('2 对话页隐藏 c-foot', d.page === 'session' && d.foot === 'none', JSON.stringify(d).slice(0, 50));
  ok('2 输入卡高度 = 输入高 + 82', d.cardH === d.expect && d.compH === d.expect, d.cardH + ' / ' + d.compH + ' expect ' + d.expect);
  ok('2 依然没有灰背板', d.plate === 'none', d.plate);
  ok('2 无 JS 报错', q.__errs.length === 0, q.__errs.join(' | '));
  await q.close();
}

/* ========== 3 task-detail 已彻底移除 ========== */
{
  const p = await page();
  const d = await p.evaluate(() => ({
    el: !!document.getElementById('taskDetail'),
    iframe: !!document.getElementById('tdFrame'),
    cssRule: [...document.styleSheets].some(sh => { try { return [...sh.cssRules].some(r => (r.selectorText || '').indexOf('.task-detail') >= 0 || (r.selectorText || '').indexOf('.td-head') >= 0); } catch (e) { return false; } }),
    prdRef: document.documentElement.innerHTML.indexOf('prd/pane.html')
  }));
  ok('3 DOM 里没有 task-detail', !d.el && !d.iframe, JSON.stringify(d));
  ok('3 样式表里没有 .task-detail / .td-head', !d.cssRule, String(d.cssRule));
  ok('3 页面不再引用 prd/pane.html', d.prdRef < 0, String(d.prdRef));

  /* 点任务卡：只落选中，不再弹任何浮层 */
  await p.evaluate(() => document.querySelectorAll('#wdViewTask .wd-card')[1].click());
  await wait(400);
  const after = await p.evaluate(() => ({
    sel: [...document.querySelectorAll('#wdViewTask .wd-card')].map(c => c.classList.contains('is-sel')),
    overlay: !!document.querySelector('.task-detail.is-open')
  }));
  ok('3 点任务卡只有选中态', after.sel.filter(Boolean).length === 1 && after.sel[1] && !after.overlay, JSON.stringify(after));
  ok('3 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 4 设置弹窗 ========== */
{
  const p = await page();
  await p.click('#tbSettings');
  await wait(450);
  const d = await p.evaluate(() => {
    const m = document.getElementById('stgModal');
    const pn = document.querySelector('.stg-panel').getBoundingClientRect();
    const pm = document.querySelector('.panel').getBoundingClientRect();   /* 与同步弹窗同一参考系 */
    const nav = document.querySelector('.stg-nav').getBoundingClientRect();
    return {
      open: m.classList.contains('is-open'),
      hasMask: !!m.querySelector('.cm-mask'),
      w: Math.round(pn.width), navW: Math.round(nav.width),
      top: Math.round(pn.top - pm.top), bottom: Math.round(pm.bottom - pn.bottom),
      footer: !!m.querySelector('.cm-foot'),
      items: [...m.querySelectorAll('.stg-item')].map(x => x.textContent),
      activeItem: m.querySelector('.stg-item.is-active').textContent,
      pane: m.querySelector('.stg-pane.is-active').dataset.stgPane,
      title: m.querySelector('#stgTitle').textContent
    };
  });
  ok('4 点设置打开弹窗', d.open && d.hasMask, '');
  ok('4 标题为「设置」', d.title === '设置', d.title);
  ok('4 左栏 256 宽', d.navW === 256, String(d.navW));
  ok('4 左栏 6 个设置项', d.items.join('|') === '通用设置|模型|连接器|Hooks|云环境|归档任务', d.items.join('|'));
  ok('4 默认停在通用设置', d.activeItem === '通用设置' && d.pane === 'general', d.activeItem + ' / ' + d.pane);
  ok('4 没有底栏（无保存/取消）', !d.footer, '');
  ok('4 上下各留 40（同同步弹窗）', d.top === 40 && d.bottom === 40, d.top + '/' + d.bottom);

  /* 切到「连接器」 */
  await p.evaluate(() => document.querySelector('[data-stg="connector"]').click());
  await wait(300);
  const c = await p.evaluate(() => ({
    pane: document.querySelector('.stg-pane.is-active').dataset.stgPane,
    item: document.querySelector('.stg-item.is-active').textContent,
    rows: document.querySelectorAll('.stg-pane.is-active .stg-conn').length,
    badges: [...document.querySelectorAll('.stg-pane.is-active .stg-badge')].map(b => b.textContent)
  }));
  ok('4 切到连接器：内容跟着换', c.pane === 'connector' && c.item === '连接器', c.pane + ' / ' + c.item);
  ok('4 连接器有 3 行 + 状态徽标', c.rows === 3 && c.badges.join('|') === '已连接|未连接|未连接', c.rows + ' ' + c.badges.join('|'));

  /* 开关 */
  await p.evaluate(() => document.querySelector('[data-stg="general"]').click());
  await wait(250);
  const sw = await p.evaluate(() => {
    const s = document.querySelector('.stg-sw');
    const before = s.getAttribute('aria-checked');
    s.click();
    return { before, after: s.getAttribute('aria-checked'), cls: s.classList.contains('is-on') };
  });
  ok('4 开关可切换（aria-checked 同步）', sw.before === 'true' && sw.after === 'false' && !sw.cls, JSON.stringify(sw));

  /* 分段 */
  const seg = await p.evaluate(() => {
    const g = document.querySelector('.stg-seg');
    const btns = [...g.querySelectorAll('button')];
    btns[1].click();
    return { on: btns.map(b => b.classList.contains('is-on')), n: btns.length };
  });
  ok('4 分段控件单选', seg.n === 3 && seg.on.join(',') === 'false,true,false', seg.on.join(','));

  /* 关闭：Esc / 蒙层 */
  await p.keyboard.press('Escape');
  await wait(300);
  ok('4 Esc 关闭设置', await p.evaluate(() => !document.getElementById('stgModal').classList.contains('is-open')), '');
  await p.click('#tbSettings');
  await wait(350);
  await p.evaluate(() => document.querySelector('#stgModal .cm-mask').click());
  await wait(300);
  ok('4 点蒙层关闭', await p.evaluate(() => !document.getElementById('stgModal').classList.contains('is-open')), '');
  ok('4 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
