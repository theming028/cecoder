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

async function page(w, h, dw, open) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await wait(650);
  return p;
}

/* ========== 1 tab 与添加工作目录随抽屉拖宽自适应 ========== */
{
  for (const [dw, tabW, addW] of [[320, 142, 208], [480, 222, null], [300, 132, 188]]) {
    const p = await page(1440, 900, dw, true);
    const d = await p.evaluate(() => {
      const tabs = [...document.querySelectorAll('.wd-tab')].map(x => Math.round(x.getBoundingClientRect().width));
      const add = document.querySelector('.wd-adddir').getBoundingClientRect();
      const toolsR = document.querySelector('.wd-tools-r').getBoundingClientRect();
      return { tabs, addW: Math.round(add.width), toolsR: Math.round(toolsR.width) };
    });
    ok(`${dw}: 两个 tab 等宽自适应`, d.tabs.length === 2 && Math.abs(d.tabs[0] - tabW) < 2 && Math.abs(d.tabs[1] - d.tabs[0]) < 1, JSON.stringify(d));
    if (addW !== null) {
      ok(`${dw}: 添加工作目录 208`, Math.abs(d.addW - addW) < 2, String(d.addW));
      ok(`${dw}: 工具行右组 72`, Math.abs(d.toolsR - 72) < 2, String(d.toolsR));
    } else {
      ok(`${dw}: 添加工作目录随之拉宽`, d.addW > 250, String(d.addW));
    }
    await p.close();
  }
}

/* ========== 2 会话页签：工具行换装 + 内容精确还原 ========== */
{
  const p = await page(1440, 900, 320, true);
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const s = await p.evaluate(() => {
    const tools = document.getElementById('wdTools');
    const ss = document.getElementById('wdSessSearch');
    const cards = [...document.querySelectorAll('#wdViewSession .wd-sess-card')];
    return {
      isSession: tools.classList.contains('is-session'),
      ssHidden: ss.hidden,
      ssVisible: getComputedStyle(ss).display !== 'none' && ss.getBoundingClientRect().width > 100,
      addHidden: getComputedStyle(document.querySelector('.wd-adddir')).display === 'none',
      searchBtnHidden: getComputedStyle(document.getElementById('wdSearchBtn')).display === 'none',
      sortVisible: getComputedStyle(document.getElementById('wdSortBtn')).display !== 'none',
      ssW: Math.round(ss.getBoundingClientRect().width),
      ph: ss.querySelector('input').placeholder,
      phColor: getComputedStyle(ss.querySelector('input')).getPropertyValue('color') || getComputedStyle(ss.querySelector('input'), '::placeholder').color,
      titles: cards.map(c => c.querySelector('.wd-sess-title').textContent),
      subs: cards.map(c => c.querySelector('.wd-sess-sub').textContent),
      sel: cards.map(c => c.classList.contains('is-sel')),
      todo: cards.map(c => c.classList.contains('is-todo')),
      spinBorder: getComputedStyle(document.querySelector('.wd-sess-spin')).borderColor,
      nums: [...document.querySelectorAll('#wdViewSession .wd-num')].map(x => x.textContent),
      emptyLink: !!document.querySelector('#wdViewSession .wd-empty-link'),
      emptyActs: !!document.querySelector('#wdViewSession .wd-empty-acts'),
      linkColor: document.querySelector('#wdViewSession .wd-empty-link') ? getComputedStyle(document.querySelector('#wdViewSession .wd-empty-link')).color : '',
      linkDeco: document.querySelector('#wdViewSession .wd-empty-link') ? getComputedStyle(document.querySelector('#wdViewSession .wd-empty-link')).textDecorationLine : ''
    };
  });
  ok('2 工具行挂 is-session', s.isSession);
  ok('2 内联搜索框显示且占满左区', !s.ssHidden && s.ssVisible, String(s.ssW));
  ok('2 添加工作目录隐藏', s.addHidden);
  ok('2 搜索图标按钮隐藏', s.searchBtnHidden);
  ok('2 排序按钮保留', s.sortVisible);
  ok('2 搜索框宽 248', Math.abs(s.ssW - 248) < 2, String(s.ssW));
  ok('2 占位文案「搜索会话」', s.ph === '搜索会话', s.ph);
  ok('2 卡序 1 会话绑定云端工程路径', s.titles[0] === '会话绑定云端工程路径', s.titles.join('|'));
  ok('2 卡序 2 业务需求，生成交付状态', s.titles[1] === '业务需求，生成交付状态', '');
  ok('2 卡序 3 生成交付状态跟踪表…（昨天 09:21）', s.titles[2] === '生成交付状态跟踪表，并启动新一轮的...' && s.subs[2] === '普通会话 · 昨天 09:21', s.subs.join('|'));
  ok('2 卡序 4 登录审计日志补全（11/12 21:03）', s.titles[3] === '登录审计日志补全' && s.subs[3] === '普通会话 · 11/12 21:03', '');
  ok('2 首卡选中态', s.sel[0] === true && s.sel.slice(1).every(x => !x), JSON.stringify(s.sel));
  ok('2 第 2 张待确认橙卡', s.todo[1] === true && s.todo[0] === false, JSON.stringify(s.todo));
  ok('2 同步徽标描边 #DAE4FE', s.spinBorder.includes('218, 228, 254'), s.spinBorder);
  ok('2 分组数 12/8/1/7', s.nums.join(',') === '12,8,1,7', s.nums.join(','));
  ok('2 会话空态为下划线链接', s.emptyLink && !s.emptyActs, '');
  ok('2 链接色 #6B6B6B + 下划线', s.linkColor.includes('107, 107, 107') && s.linkDeco === 'underline', s.linkColor + ' ' + s.linkDeco);

  /* 内联搜索过滤 */
  await p.type('#wdSessSearchInput', '登录');
  await wait(260);
  const f = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('#wdViewSession .wd-sess-card')].filter(c => c.style.display !== 'none');
    return { n: vis.length, t: vis.map(c => c.querySelector('.wd-sess-title').textContent) };
  });
  ok('2 会话搜索「登录」命中 1 张', f.n === 1 && f.t[0] === '登录审计日志补全', JSON.stringify(f));
  await p.keyboard.press('Escape');
  await wait(200);
  const clr = await p.evaluate(() => ({
    v: document.getElementById('wdSessSearchInput').value,
    n: [...document.querySelectorAll('#wdViewSession .wd-sess-card')].filter(c => c.style.display !== 'none').length
  }));
  ok('2 Esc 清空并还原 4 张', clr.v === '' && clr.n === 4, JSON.stringify(clr));

  /* 切回任务：工具行还原、任务卡不受会话搜索影响 */
  await p.click('[data-wd-tab="任务"]');
  await wait(300);
  const back = await p.evaluate(() => ({
    addVisible: getComputedStyle(document.querySelector('.wd-adddir')).display !== 'none',
    ssHidden: document.getElementById('wdSessSearch').hidden,
    taskCards: [...document.querySelectorAll('#wdViewTask .wd-card')].filter(c => c.style.display !== 'none').length,
    sessViewHidden: document.getElementById('wdViewSession').hidden
  }));
  ok('2 切回任务：添加工作目录还原、内联搜索框隐藏', back.addVisible && back.ssHidden, JSON.stringify(back));
  /* 第 21 轮：Nutstore 改为空态，任务卡 7 → 6 */
ok('2 切回任务：6 张任务卡不受影响', back.taskCards === 6, String(back.taskCards));
  ok('2 会话视图隐藏', back.sessViewHidden);
  ok('2 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.screenshot({ path: 'R15-session.png', clip: { x: 0, y: 0, width: 340, height: 720 } });
  await p.close();
}

/* ========== 3 宽抽屉下的会话页签 ========== */
{
  const p = await page(1920, 1080, 480, true);
  await p.click('[data-wd-tab="会话"]');
  await wait(320);
  const s = await p.evaluate(() => ({
    ssW: Math.round(document.getElementById('wdSessSearch').getBoundingClientRect().width),
    tabs: [...document.querySelectorAll('.wd-tab')].map(x => Math.round(x.getBoundingClientRect().width)),
    cardW: Math.round(document.querySelector('#wdViewSession .wd-sess-card').getBoundingClientRect().width)
  }));
  ok('3 480 下搜索框拉宽到 408', Math.abs(s.ssW - 408) < 3, String(s.ssW));
  ok('3 480 下 tab 各 222', Math.abs(s.tabs[0] - 222) < 2, JSON.stringify(s.tabs));
  ok('3 会话卡随宽抽屉拉满', Math.abs(s.cardW - 448) < 3, String(s.cardW));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
