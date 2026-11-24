/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const ROOT = BASE;
const HOME = 'file:///' + ROOT + '/cecoder-home.html';
const SESS = 'file:///' + ROOT + '/cecoder-session.html';
const TASK = 'file:///' + ROOT + '/cecoder-task.html';

const b = await puppeteer.launch({
  executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  headless: 'new', args: ['--force-device-scale-factor=1']
});
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(url, w = 1440, h = 900, open = true) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: 320 });
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  return p;
}

/* ========== 1 三个独立文件 + 共享资源 ========== */
{
  const files = ['cecoder-home.html', 'cecoder-session.html', 'cecoder-task.html',
    'assets/tokens.css', 'assets/app.css', 'assets/app.js'];
  const sizes = files.map(f => {
    try { return Math.round(fs.statSync(ROOT + '/' + f).size / 1024); } catch (e) { return -1; }
  });
  ok('1 三个页面 + 共享 css/js 都存在', sizes.every(s => s > 0), JSON.stringify(sizes));
  const html = fs.readFileSync(ROOT + '/cecoder-home.html', 'utf8');
  ok('1 页面改为引用外部样式与脚本', /href="assets\/tokens\.css"/.test(html) && /src="assets\/app\.js"/.test(html), '');
  ok('1 单页体积明显下降（< 200KB）', sizes[0] < 200, sizes[0] + 'KB');
}

/* ========== 2 首页：不再包含会话流 / 点卡片跳转 ========== */
{
  const p = await page(HOME);
  const d = await p.evaluate(() => ({
    chat: !!document.getElementById('chatView'),
    head: !!document.querySelector('.chat-head'),
    hero: !!document.querySelector('.hero'),
    page: document.body.dataset.page,
    drawer: document.getElementById('wsDrawer').classList.contains('is-open')
  }));
  ok('2 首页已移除会话流与对话标题栏', !d.chat && !d.head && d.hero, JSON.stringify(d));
  ok('2 首页 data-page=home 且抽屉可展开', d.page === 'home' && d.drawer, d.page);

  /* 点第 3 张会话卡 → 跳转会话页，id 带上 */
  await p.click('[data-wd-tab="会话"]');
  await wait(350);
  await p.evaluate(() => document.querySelectorAll('#wdViewSession .wd-sess-card')[2].click());
  await p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {});
  await wait(700);
  const u = new URL(p.url());
  const sel = await p.evaluate(() => [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => c.classList.contains('is-sel')));
  ok('2 点会话卡 → 会话独立页（带 id）', u.pathname.endsWith('cecoder-session.html') && u.searchParams.get('id') === '2', p.url().split('/').pop());
  ok('2 会话页里对应该卡片选中', sel[2] === true && sel.filter(Boolean).length === 1, JSON.stringify(sel));
  ok('2 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 3 会话页：标题栏 / 32 间距 / 宽度 / 单卡输入区 ========== */
{
  const p = await page(SESS + '?tab=%E4%BC%9A%E8%AF%9D&id=1');
  const d = await p.evaluate(() => {
    const head = document.querySelector('.chat-head');
    const hr = head.getBoundingClientRect();
    const msg = document.querySelector('.chat-msg').getBoundingClientRect();
    const inner = document.querySelector('.chat-inner').getBoundingClientRect();
    const card = document.querySelector('.c-card').getBoundingClientRect();
    const foot = document.querySelector('.c-foot');
    return {
      page: document.body.dataset.page,
      headDisp: getComputedStyle(head).display,
      headH: Math.round(hr.height),
      gap: Math.round(msg.top - hr.bottom),
      tabs: [...document.querySelectorAll('.chat-tab')].map(t => t.textContent.trim()),
      innerW: Math.round(inner.width), cardW: Math.round(card.width),
      padL: Math.round(inner.left - document.getElementById('chatView').getBoundingClientRect().left),
      padR: Math.round(document.getElementById('chatView').getBoundingClientRect().right - inner.right),
      foot: getComputedStyle(foot).display,
      plate: getComputedStyle(document.querySelector('.c-plate')).display,
      ph: document.querySelector('.c-input').placeholder,
      chatDisp: getComputedStyle(document.getElementById('chatView')).display
    };
  });
  ok('3 会话页 data-page=session，对话流常显', d.page === 'session' && d.chatDisp === 'block', JSON.stringify(d).slice(0, 60));
  ok('3 标题栏显示、44 高、两个页签', d.headDisp === 'flex' && d.headH === 44 && d.tabs.join(',') === '对话,轨迹', JSON.stringify(d.tabs));
  ok('3 标题栏到内容 32px', d.gap === 32, String(d.gap));
  /* 第 37 轮：32 改成外间距（margin 在 .chat 上），内容列与输入卡等宽 */
  ok('3 对话内容与输入卡同宽（32 走外间距）', d.padL === 0 && d.padR === 0 && Math.abs(d.cardW - d.innerW) <= 1, d.padL + '/' + d.padR + ' ' + d.innerW + ' vs ' + d.cardW);
  ok('3 输入区为单卡（无次级行、无灰背板）', d.foot === 'none' && d.plate === 'none', d.foot + '/' + d.plate);
  ok('3 输入占位是追问文案', d.ph.indexOf('继续追问') > -1, d.ph);

  /* 发送 → 追加一条自己的 + 一条 AI */
  const before = await p.evaluate(() => document.querySelectorAll('.chat-msg').length);
  await p.type('.c-input', '再补一条验收路径');
  await p.click('.c-send');
  await wait(500);
  const after = await p.evaluate(() => ({
    n: document.querySelectorAll('.chat-msg').length,
    txt: ([...document.querySelectorAll('.chat-bubble.is-text')].pop() || {}).textContent || '',
    val: document.querySelector('.c-input').value
  }));
  ok('4 发送后追加用户 + AI 两条', after.n === before + 2, before + ' → ' + after.n);
  ok('4 发送内容落到气泡且输入框清空', after.txt === '再补一条验收路径' && after.val === '', JSON.stringify(after.txt));
  ok('4 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 5 会话页内切换会话：原地更新 + url 同步 ========== */
{
  const p = await page(SESS + '?tab=%E4%BC%9A%E8%AF%9D&id=0');
  await p.evaluate(() => document.querySelectorAll('#wdViewSession .wd-sess-card')[1].click());
  await wait(400);
  const d = await p.evaluate(() => ({
    sel: [...document.querySelectorAll('#wdViewSession .wd-sess-card')].map(c => c.classList.contains('is-sel')),
    page: document.body.dataset.page
  }));
  const u = new URL(p.url());
  ok('5 点另一条会话：原地切换（不重载）', d.page === 'session' && u.searchParams.get('id') === '1', p.url().split('/').pop());
  ok('5 选中跟随到第 2 条', d.sel[1] === true && d.sel[0] === false, JSON.stringify(d.sel));
  await p.close();
}

/* ========== 6 任务页：工序进度模块（第 34 轮换稿 3113:44395） ========== */
{
  const p = await page(TASK + '?tab=%E4%BB%BB%E5%8A%A1&id=1');
  const d = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { y: Math.round(r.top - pm.top), h: Math.round(r.height) }; };
    return {
      page: document.body.dataset.page,
      top: g('.task-top'), steps: g('.task-steps'), tabs: g('.task-tabs'),
      stage: g('.stage'),
      old: !!(document.querySelector('.task-head') || document.getElementById('tkTitle') || document.querySelector('.task-body')),
      comp: getComputedStyle(document.querySelector('.composer')).display,
      segs: [...document.querySelectorAll('.tt-links .tt-link')].map(b => Math.round(b.getBoundingClientRect().width)),
      items: document.querySelectorAll('.ts-item').length,
      tabsN: document.querySelectorAll('.tk-tab').length,
    };
  });
  ok('6 三页仍为 data-page=task', d.page === 'task', d.page);
  ok('6 顶部工具条 44 @0', d.top.y === 0 && d.top.h === 44, JSON.stringify(d.top));
  ok('6 工序条 87 @44', d.steps.y === 44 && d.steps.h === 87, JSON.stringify(d.steps));
  ok('6 页签条 40 @131', d.tabs.y === 131 && d.tabs.h === 40, JSON.stringify(d.tabs));
  ok('6 内容区从 171 起、旧标题栏已移除', d.stage.y === 171 && !d.old, JSON.stringify(d.stage) + ' old=' + d.old);
  /* 第 35 轮：去图标、字号 13 → 宽度自然收缩；第 37 轮首段改名「任务信息」76 宽 */
  ok('6 分段两段各 80', d.segs.length === 2 && d.segs.every(w => Math.abs(w - 80) <= 2), JSON.stringify(d.segs));
  ok('6 9 道工序 + 5 个页签', d.items === 9 && d.tabsN === 5, d.items + '/' + d.tabsN);
  ok('6 输入卡仍收起', d.comp === 'none', d.comp);
  ok('6 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 7 首页点任务卡 → 任务页 ========== */
{
  const p = await page(HOME);
  await p.evaluate(() => document.querySelectorAll('#wdViewTask .wd-card')[0].click());
  await p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {});
  await wait(700);
  const u = new URL(p.url());
  ok('7 点任务卡 → 任务独立页（带 id）', u.pathname.endsWith('cecoder-task.html') && u.searchParams.get('id') === '0', p.url().split('/').pop());
  /* 第 34 轮：标题栏换成工序进度模块，任务名只留在 <title> 里 */
  ok('7 任务页 <title> 跟卡片一致', (await p.title()).indexOf('登录失败时未提示信息') > -1, await p.title());
  /* 返回（第 33 轮去掉返回键，改走浏览器后退） */
  await p.goBack({ waitUntil: 'load' }).catch(() => {});
  await wait(600);
  const back = await p.evaluate(() => ({
    page: document.body.dataset.page,
    tab: document.querySelector('.wd-tab.is-active').textContent.trim()
  }));
  ok('7 后退回到首页任务页签', back.page === 'home' && back.tab.indexOf('任务') > -1, JSON.stringify(back));
  await p.close();
}

/* ========== 8 会话页 Esc → 回首页会话页签 ========== */
{
  const p = await page(SESS + '?tab=%E4%BC%9A%E8%AF%9D&id=2');
  await p.keyboard.press('Escape');
  await p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {});
  await wait(600);
  const d = await p.evaluate(() => ({
    page: document.body.dataset.page,
    tab: document.querySelector('.wd-tab.is-active').textContent.trim(),
    hero: getComputedStyle(document.querySelector('.hero')).display
  }));
  ok('8 会话页 Esc 回首页会话页签', d.page === 'home' && d.tab.indexOf('会话') > -1 && d.hero !== 'none', JSON.stringify(d));
  await p.close();
}

/* ========== 9 首页发送 → 带到会话页第一条消息 ========== */
{
  const p = await page(HOME);
  await p.type('.c-input', '把登录失败的提示补全，并补两条验收路径');
  await p.click('.c-send');
  await p.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {});
  await wait(900);
  const d = await p.evaluate(() => ({
    page: document.body.dataset.page,
    txt: (document.querySelector('.chat-msg.is-me .chat-bubble.is-text') || {}).textContent || '',
    chat: getComputedStyle(document.getElementById('chatView')).display
  }));
  ok('9 首页发送 → 会话页', d.page === 'session' && d.chat === 'block', d.page);
  ok('9 输入内容成为会话首条消息', d.txt === '把登录失败的提示补全，并补两条验收路径', d.txt);
  ok('9 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 10 三页在窄窗口都不横向溢出 ========== */
{
  for (const [url, name] of [[HOME, 'home'], [SESS, 'session'], [TASK, 'task']]) {
    const p = await page(url, 1024, 768);
    const d = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(`10 ${name} 1024 宽无横向溢出`, d.sw <= d.iw, JSON.stringify(d));
    await p.close();
  }
}

console.log('PASS ' + pass + (fail.length ? ' / ' + (pass + fail.length) : ' / ' + pass));
if (fail.length) { console.log('FAIL'); fail.forEach(f => console.log('  ' + f)); }
await b.close();
process.exit(fail.length ? 1 : 0);
