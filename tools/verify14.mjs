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

async function page(w, h, open) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: 320 });
  await p.evaluate(() => localStorage.setItem('cecoder.wdTab', '任务')); /* 第 38 轮：默认页签＝会话，任务列表基线显式指定 */
  await p.reload({ waitUntil: 'load' });
  await wait(650);
  return p;
}

/* ========== 1 默认权限：完全访问 → 红色 ========== */
{
  const p = await page(1440, 900, false);
  await p.click('.c-perm');
  await wait(200);
  const opts = await p.evaluate(() => [...document.querySelectorAll('[data-dd="perm"] .semi-select-option')].map(x => x.textContent));
  ok('1 下拉有完全访问权限', opts.includes('完全访问权限'), JSON.stringify(opts));
  await p.evaluate(() => {
    const x = [...document.querySelectorAll('[data-dd="perm"] .semi-select-option')].find(y => y.textContent === '完全访问权限');
    x.click();
  });
  await wait(220);
  const s = await p.evaluate(() => {
    const btn = document.querySelector('.c-perm');
    return {
      txt: btn.querySelector('.c-pill-txt').textContent,
      cls: btn.className,
      txtColor: getComputedStyle(btn.querySelector('.c-pill-txt')).color,
      icoColor: getComputedStyle(btn.querySelector('svg')).color,
      riskOpt: !!document.querySelector('[data-dd="perm"] .semi-select-option.is-risk')
    };
  });
  ok('1 触发器文字已切换', s.txt === '完全访问权限', s.txt);
  ok('1 触发器转红', s.cls.includes('is-risk') && s.txtColor !== 'rgb(31, 31, 31)', JSON.stringify(s));
  ok('1 图标同色转红', s.txtColor === s.icoColor, s.icoColor);
  ok('1 选项也标记高风险', s.riskOpt);
  await p.click('.c-perm'); await wait(150);
  await p.evaluate(() => document.querySelector('[data-dd="perm"] .semi-select-option').click());
  await wait(180);
  ok('1 切回默认权限恢复正文色', await p.evaluate(() =>
    !document.querySelector('.c-perm').classList.contains('is-risk') &&
    getComputedStyle(document.querySelector('.c-perm .c-pill-txt')).color === 'rgb(31, 31, 31)'));
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2 cm-left-foot 顶部 / 右侧线 ========== */
{
  const p = await page(1440, 900, true);
  await p.click('#wdSync'); await wait(420);
  const s = await p.evaluate(() => {
    const f = document.querySelector('.cm-left-foot');
    const l = document.querySelector('.cm-left');
    const cs = getComputedStyle(f);
    const r = f.getBoundingClientRect(), lr = l.getBoundingClientRect();
    return { shadow: cs.boxShadow, edgeGap: +(lr.right - r.right).toFixed(1), h: Math.round(r.height) };
  });
  ok('2 上边线存在', /inset/.test(s.shadow) && /1px/.test(s.shadow), s.shadow);
  ok('2 两条内描边', (s.shadow.match(/inset/g) || []).length >= 2, s.shadow);
  ok('2 脚部贴左栏右缘', Math.abs(s.edgeGap) < 1.5, String(s.edgeGap));
  ok('2 高度 48', s.h === 48, String(s.h));
  await p.close();
}

/* ========== 3 收起图标：左竖条 + 右箭头 ========== */
{
  const p = await page(1440, 900, true);
  const g = await p.evaluate(() => {
    const svg = document.querySelector('.wd-collapse svg');
    const r = svg.querySelector('rect'), pa = svg.querySelector('path');
    return {
      rects: svg.querySelectorAll('rect').length, paths: svg.querySelectorAll('path').length,
      rx: +r.getAttribute('x'), rw: +r.getAttribute('width'), rh: +r.getAttribute('height'),
      d: pa.getAttribute('d'), sw: +pa.getAttribute('stroke-width')
    };
  });
  /* 第 21 轮：按稿里「联集 9.33x8.12 @(2,3)」重排 —— 竖条 x=1.98、描边 1.1 */
  ok('3 竖条在左（x≈2.3，14 网格满版）', g.rects === 1 && Math.abs(g.rx - 2.3) < .2, JSON.stringify(g));
  ok('3 竖条 1.4×9.4', Math.abs(g.rw - 1.4) < .2 && Math.abs(g.rh - 9.4) < .2, JSON.stringify(g));
  ok('3 箭头在右且指向左', /^M11\.9 2\.9L7\.7 7L11\.9 11\.1$/.test(g.d), g.d);
  ok('3 箭头描边 1.25', Math.abs(g.sw - 1.25) < .1, String(g.sw));
  await p.close();
}

/* ========== 4 会话 tab 内容 ========== */
{
  const p = await page(1440, 900, true);
  const before = await p.evaluate(() => ({
    task: !document.getElementById('wdViewTask').hidden,
    sess: !document.getElementById('wdViewSession').hidden
  }));
  ok('4 默认任务视图', before.task && !before.sess, JSON.stringify(before));
  await p.click('[data-wd-tab="会话"]'); await wait(280);
  const s = await p.evaluate(() => {
    const v = document.getElementById('wdViewSession');
    const cards = [...v.querySelectorAll('.wd-sess-card')];
    return {
      taskHidden: document.getElementById('wdViewTask').hidden,
      sessShown: !v.hidden,
      active: document.querySelector('.wd-tab.is-active').dataset.wdTab,
      count: cards.length,
      titles: cards.map(c => c.querySelector('.wd-sess-title').textContent),
      subs: cards.map(c => c.querySelector('.wd-sess-sub').textContent),
      groups: [...v.querySelectorAll('.wd-grp-name')].map(x => x.textContent),
      todo: v.querySelectorAll('.wd-sess-card.is-todo').length,
      empty: (v.querySelector('.wd-empty-title') || {}).textContent,
      ph: document.getElementById('wdSearchInput').placeholder,
      scrollTop: document.getElementById('wdScroll').scrollTop
    };
  });
  ok('4 切换后仅会话视图可见', s.taskHidden && s.sessShown && s.active === '会话', JSON.stringify(s));
  ok('4 四张会话卡', s.count === 4, String(s.count));
  /* 第 15 轮：卡序按稿 3083:44433 调整 —— 生成交付(昨天) 在 登录审计(11/12) 之前 */
  ok('4 会话标题与稿一致', s.titles[0] === '会话绑定云端工程路径' && s.titles[2] === '生成交付状态跟踪表，并启动新一轮的...' && s.titles[3] === '登录审计日志补全', JSON.stringify(s.titles));
  ok('4 时间行与稿一致', s.subs[0] === '普通会话 · 刚刚' && s.subs[2] === '普通会话 · 昨天 09:21' && s.subs[3] === '普通会话 · 11/12 21:03', JSON.stringify(s.subs));
  ok('4 分组与稿一致', s.groups.join(',') === '普通会话,数字分身会话,工作台会话,Nutstore,AI Native Factory', JSON.stringify(s.groups));
  ok('4 待确认会话橙底', s.todo === 1, String(s.todo));
  ok('4 空态文案', s.empty === '该目录下还没有会话', s.empty);
  ok('4 搜索占位同步', s.ph === '搜索会话关键词', s.ph);
  /* 会话卡的更多也能弹菜单 */
  const cb = await p.evaluate(() => {
    const r = document.querySelector('.wd-sess-card').getBoundingClientRect();
    return [r.x, r.y, r.width, r.height];
  });
  await p.mouse.move(900, 760); await wait(150);
  await p.mouse.move(cb[0] + 60, cb[1] + 18); await wait(300);
  const mb = await p.evaluate(() => {
    const r = document.querySelector('.wd-sess-card .wd-more').getBoundingClientRect();
    return [r.x, r.y, r.width, r.height];
  });
  await p.mouse.click(mb[0] + mb[2] / 2, mb[1] + mb[3] / 2); await wait(260);
  /* 第 18 轮：会话卡改用自己的操作菜单 */
  ok('4 会话卡更多可弹菜单', await p.evaluate(() => !document.getElementById('wdSessMenu').hidden));
  await p.mouse.click(900, 700); await wait(180);
  await p.click('[data-wd-tab="任务"]'); await wait(240);
  ok('4 切回任务视图', await p.evaluate(() => !document.getElementById('wdViewTask').hidden && document.getElementById('wdViewSession').hidden));
  ok('4 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 5 涟漪加强 ========== */
{
  const p = await page(1440, 900, false);
  const s = await p.evaluate(() => {
    const d = document.getElementById('mbDot');
    const a = getComputedStyle(d, '::after'), bf = getComputedStyle(d, '::before');
    return {
      hasDot: document.querySelector('.menu-btn').classList.contains('has-dot'),
      aName: a.animationName, aDur: a.animationDuration, aW: a.width, aBg: a.backgroundColor,
      bName: bf.animationName, bDur: bf.animationDuration, bDelay: bf.animationDelay,
      dotTransform: getComputedStyle(d).transform
    };
  });
  ok('5 折叠态亮橙点', s.hasDot);
  ok('5 两层波纹', s.aName === 'mbRipple' && s.bName === 'mbRipple', JSON.stringify(s));
  ok('5 1.7s 一轮', s.aDur === '1.7s' && s.bDur === '1.7s', s.aDur);
  ok('5 双层错开 0.85s', s.bDelay === '0.85s', s.bDelay);
  ok('5 波纹直径 22px', s.aW === '22px', s.aW);
  ok('5 波纹更浓', /0\.34/.test(s.aBg), s.aBg);
  ok('5 实心点本体不缩放', s.dotTransform === 'matrix(1, 0, 0, 1, 0, 0)' || s.dotTransform === 'none', s.dotTransform);
  await p.close();
}

/* ========== 6 hover 不跳动（三档抽屉宽） ========== */
for (const w of [300, 320, 480]) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(x => localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true, w: x })), w);
  await p.reload({ waitUntil: 'load' }); await wait(700);
  const n = await p.evaluate(() => document.querySelectorAll('.wd-card').length);
  let jumps = [];
  for (let i = 0; i < n; i++) {
    const box = await p.evaluate(i => {
      const r = document.querySelectorAll('.wd-card')[i].getBoundingClientRect();
      return [r.x, r.y, r.width, r.height];
    }, i);
    await p.mouse.move(900, 760); await wait(120);
    const idle = await p.evaluate(i => +document.querySelectorAll('.wd-card')[i].getBoundingClientRect().height.toFixed(1), i);
    await p.mouse.move(box[0] + 50, box[1] + 18); await wait(300);
    const hov = await p.evaluate(i => +document.querySelectorAll('.wd-card')[i].getBoundingClientRect().height.toFixed(1), i);
    if (Math.abs(idle - hov) > .5) jumps.push(`card${i + 1} ${idle}→${hov}`);
  }
  ok(`6 ${w}px 全部 7 卡 hover 不跳高`, jumps.length === 0, jumps.join(', '));
  const locked = await p.evaluate(() => {
    const c = document.querySelectorAll('.wd-card')[0];
    return { h: c.querySelector('.wd-card-title').style.height };
  });
  ok(`6 ${w}px 锁高生效`, !!locked.h, JSON.stringify(locked));
  ok(`6 ${w}px 无报错`, p.__errs.length === 0, p.__errs.join('|'));
  await p.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
