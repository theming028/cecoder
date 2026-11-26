/* 第 77 轮验收：工序链末步统一「任务总结」+ 四个页面互跳闭环 */
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
const file = u => 'file:///' + BASE + '/cecoder-' + u + '.html';

/* ============ A 首页：推荐工序末步 ============ */
{
  const p = await mk('cecoder-home.html');
  /* 推荐工序条要选中「技术任务」才出现 */
  await p.tap('[data-chips="quick"] button[data-quick="技术任务"]');
  await wait(400);
  const a = await p.evaluate(() => {
    const steps = [...document.querySelectorAll('#qfFlow .qf-step')];
    const last = steps[steps.length - 1];
    return {
      n: steps.length,
      names: steps.map(s => s.querySelector('.qf-name').textContent),
      go: last.dataset.go || '',
      cursor: getComputedStyle(last).cursor,
      title: document.getElementById('qfTitle').textContent,
    };
  });
  ok('A1 首页工序条 8 道、末步 = 任务总结', a.n === 8 && a.names[7] === '任务总结', a.names.join('/'));
  ok('A2 末步挂了跳转标记且可点（cursor=pointer）', a.go === 'summary' && a.cursor === 'pointer', a.go + ' ' + a.cursor);
  ok('A3 计数文案 = 技术任务 · 8 道', a.title === '技术任务 · 8 道', a.title);
  await p.evaluate(() => [...document.querySelectorAll('#qfFlow .qf-step')].pop().click());
  await wait(900);
  ok('A4 点末步 → 进任务总结页', p.url() === file('summary') + '?id=0', p.url());
  ok('A5 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ B 任务页：工序进度末步 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const a = await p.evaluate(() => {
    const items = [...document.querySelectorAll('#tkStepTrack .ts-item')];
    const last = items[items.length - 1];
    const r = last.getBoundingClientRect();
    return {
      n: items.length, names: items.map(i => i.querySelector('.ts-name').textContent),
      tag: last.tagName, href: last.getAttribute('href') || '',
      name: last.querySelector('.ts-name').textContent,
      deco: getComputedStyle(last).textDecorationLine,
      h: Math.round(r.height), w: Math.round(r.width),
      hs: items.map(i => Math.round(i.getBoundingClientRect().height)),
    };
  });
  ok('B1 工序进度 9 道、末步 = 任务总结', a.n === 9 && a.name === '任务总结', a.names.join('/'));
  ok('B2 末步是可点链接（a → cecoder-summary.html?id=0）', a.tag === 'A' && a.href === 'cecoder-summary.html?id=0', a.tag + ' ' + a.href);
  ok('B3 链接无下划线、高度与其它 8 道一致', a.deco === 'none' && a.hs.every(v => v === a.h), a.deco + ' ' + a.hs.join('/'));
  await p.tap('#tkStepTrack .ts-item[data-step="9"]');
  await wait(900);
  ok('B4 点末步 → 进任务总结页', p.url() === file('summary') + '?id=0', p.url());
  await p.close();
}

/* ============ C 任务总结页：工序条末步 + 回跳 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  /* 第 79 轮：工序条改成与任务页同款容器（9 道），末步当前态不是链接 */
  const c = await p.evaluate(() => {
    const items = [...document.querySelectorAll('#tkStepTrack .ts-item')];
    const last = items[items.length - 1];
    return {
      names: items.map(i => i.querySelector('.ts-name').textContent),
      lastTag: last.tagName, lastNow: last.classList.contains('is-now'),
      links: items.slice(0, 8).map(i => i.getAttribute('href')),
      home: !!document.querySelector('.task-top .tt-home'),
      back: (document.querySelector('.sum-back') || {}).href ? document.querySelector('.sum-back').getAttribute('href') : '',
    };
  });
  ok('C1 9 道工序、末步 = 任务总结（当前态，非链接）',
    c.names.length === 9 && c.names[8] === '任务总结' && c.lastTag === 'SPAN' && c.lastNow, c.names.join('/'));
  ok('C2 第 3 道 UI设计 → 独立页，其余前 8 道回任务页',
    c.links.length === 8 && c.links[2] === 'cecoder-ui.html?id=0' && c.links.filter((h, i) => i !== 2).every(h => h === 'cecoder-task.html?id=0'), c.links.join(','));
  ok('C3 中栏 task-top 不再放「首页」，右侧仍留「任务执行」', c.home === false && c.back === 'cecoder-task.html?id=0', c.home + ' ' + c.back);
  await p.close();
}

/* ============ D 四页互跳闭环 ============ */
{
  /* 每页顶栏都有「首页」；首页卡片进会话 / 任务；会话页抽屉卡片进任务 */
  const pages = ['home', 'session', 'task', 'ui', 'summary'];
  for (const pg of pages) {
    const p = await mk('cecoder-' + pg + '.html' + (pg === 'home' ? '' : '?id=0'));
    const hasHome = await p.evaluate(() => !!document.querySelector('.tb-home') && document.querySelector('.tb-home').getAttribute('href') === 'cecoder-home.html');
    ok('D1-' + pg + ' 顶栏「首页」入口', hasHome);
    ok('D2-' + pg + ' 无脚本报错', p.__e.length === 0, p.__e.slice(0, 2).join(' / '));
    await p.close();
  }

  const p = await mk('cecoder-session.html?id=0');
  const d = await p.evaluate(() => {
    const open = document.querySelector('.menu-btn');
    if (open) open.click();
    return {
      s: document.querySelectorAll('#wdViewSession .wd-sess-card').length,
      t: document.querySelectorAll('#wdViewTask .wd-card').length,
    };
  });
  await wait(400);
  const goto = await p.evaluate(() => {
    const c = document.querySelector('#wdViewTask .wd-card');
    c.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return true;
  });
  await wait(800);
  ok('D3 会话页抽屉里会话卡 %d 张 / 任务卡 %d 张', d.s > 0 && d.t > 0, d.s + '/' + d.t);
  ok('D4 会话页点任务卡 → 任务执行页', /cecoder-task\.html/.test(p.url()), p.url());
  await p.close();

  const q = await mk('cecoder-task.html?id=0');
  await q.evaluate(() => document.querySelector('#tkStepTrack .ts-item[data-step="9"]').click());
  await wait(900);
  ok('D5 任务页工序条第 9 道「任务总结」→ 总结页', /cecoder-summary\.html/.test(q.url()), q.url());
  await q.close();

  const u = await mk('cecoder-ui.html?id=0');
  ok('D7-1 UI设计页：第 3 道当前、中栏留空', await u.evaluate(() => document.querySelector('.ts-item.is-now .ts-name').textContent === 'UI设计' && !!document.querySelector('.ui-blank')));
  await u.evaluate(() => document.querySelector('.ts-item[data-step="5"]').click()); await wait(900);
  ok('D7-2 UI设计页第 5 道 → 代码开发任务页', /cecoder-task\.html/.test(u.url()), u.url());
  await u.close();

  const h = await mk('cecoder-home.html');
  await h.evaluate(() => { const b = document.querySelector('.menu-btn'); if (b) b.click(); });
  await wait(300);
  await h.evaluate(() => { const c = document.querySelector('#wdViewSession .wd-sess-card'); if (c) c.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await wait(900);
  ok('D6 首页点会话卡 → 会话页', /cecoder-session\.html/.test(h.url()), h.url());
  await h.close();
}

/* ============ E 任务页顶栏 / AI 协作（第 68 轮功能，防再次被重建吃掉） ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const e = await p.evaluate(() => {
    const tr = document.querySelector('.tt-right');
    const kids = [...tr.children].filter(x => x.tagName !== 'SPAN').map(x => ({ c: x.className, d: getComputedStyle(x).display }));
    const ai = document.getElementById('aiSide');
    return {
      kids,
      aiW: ai ? Math.round(ai.getBoundingClientRect().width) : 0,
      ev: !!document.getElementById('evModal'),
      shot: !!document.getElementById('shotViewer'),
    };
  });
  ok('E1 顶栏右侧 = 自动执行 / 任务证据链 / 工序进度 / AI协作（收起后才显示）',
    e.kids.map(k => k.c).join(',') === 'tt-run,tt-ev,tt-now,tt-ai' && e.kids[3].d === 'none', e.kids.map(k => k.c).join(','));
  ok('E2 证据链弹窗 / 截图预览层都在', e.ev && e.shot, e.ev + ' ' + e.shot);
  ok('E3 AI 协作栏默认展开 450 宽', e.aiW === 450, e.aiW);

  await p.evaluate(() => document.getElementById('tkEvidence').click()); await wait(300);
  ok('E4 点「任务证据链」→ 弹窗打开', await p.evaluate(() => document.getElementById('evModal').classList.contains('is-open')));
  await p.evaluate(() => document.querySelector('#evModal [data-modal-close]').click()); await wait(200);

  await p.evaluate(() => document.getElementById('aiFold').click()); await wait(350);
  const off = await p.evaluate(() => ({ off: document.querySelector('.panel').classList.contains('is-ai-off'), d: getComputedStyle(document.getElementById('tkAiOpen')).display }));
  ok('E5 收起 AI 协作 → 栏隐藏、顶栏长出「AI协作」入口', off.off && off.d === 'flex', JSON.stringify(off));
  await p.evaluate(() => document.getElementById('tkAiOpen').click()); await wait(350);
  ok('E6 点入口 → 栏恢复', await p.evaluate(() => !document.querySelector('.panel').classList.contains('is-ai-off')));
  ok('E7 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
await b.close();
