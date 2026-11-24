/* 第 47 轮验收（tt-right 按钮形态 / 链接 hover 主色 / 折叠后常规字重 / 页签浅灰底与专注文案 / 大容器还原 / 图标墨迹对齐） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, seed) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: 1440, height: 900 });
  if (seed) await p.evaluateOnNewDocument(`(()=>{ if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded','1'); (${seed.toString()})(); })()`);
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(800);
  return p;
}

/* ============ A tt-right：自动执行 / 链接 / 收起 都是按钮形态 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const a = await p.evaluate(() => {
    const g = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
    const cs = s => getComputedStyle(document.querySelector(s));
    return {
      run: g('.tt-run'), runFS: cs('.tt-run').fontSize, runBg: cs('.tt-run').backgroundColor, runColor: cs('.tt-run').color,
      links: g('.tt-links'), link: [...document.querySelectorAll('.tt-links .tt-link')].map(e => Math.round(e.getBoundingClientRect().width)),
      trackBg: cs('.tt-links').backgroundColor,
      fold: g('.tt-fold'), nowH: g('.tt-now').h,
      tag: [...document.querySelectorAll('.tt-links .tt-link')].map(e => e.tagName),
    };
  });
  ok('A1 自动执行是 92×28 文字按钮（13px / 主色 / 透明底）', a.run.w === 92 && a.run.h === 28 && a.runFS === '13px' && a.runColor === 'rgb(55, 112, 247)' && a.runBg === 'rgba(0, 0, 0, 0)', JSON.stringify(a.run) + ' ' + a.runFS + ' ' + a.runBg);
  ok('A2 任务信息 / 工序资产是 <a>、各 80 宽，挂在 160×28 #FAFAFA 轨道上（1px 分隔线各半 ⇒ 实测 161）', a.tag.every(t => t === 'A') && a.link.length === 2 && a.link.every(w => w === 80) && Math.abs(a.links.w - 160) <= 1 && a.links.h === 28 && a.trackBg === 'rgb(250, 250, 250)', JSON.stringify(a.link) + ' ' + JSON.stringify(a.links) + ' ' + a.trackBg);
  ok('A3 收起是 20 高的文字按钮、整组 28 高', a.fold.h === 20 && a.nowH === 28, JSON.stringify([a.fold, a.nowH]));

  /* 三处 hover 都要有反馈 */
  await p.hover('.tt-run'); await wait(200);
  const runHov = await p.evaluate(() => getComputedStyle(document.querySelector('.tt-run')).backgroundColor);
  ok('A4 自动执行 hover 底色变化（主色 1 级）', runHov === 'rgb(245, 248, 255)', runHov);
  await p.hover('.tt-links .tt-link:nth-of-type(1)'); await wait(200);
  const linkHov = await p.evaluate(() => {
    const e = document.querySelector('.tt-links .tt-link');
    return [getComputedStyle(e).color, getComputedStyle(e).backgroundColor];
  });
  ok('A5 链接 hover 只把文字染成主色（底仍是透明）', linkHov[0] === 'rgb(55, 112, 247)' && linkHov[1] === 'rgba(0, 0, 0, 0)', JSON.stringify(linkHov));
  await p.hover('#tkStepsToggle'); await wait(200);
  const foldHov = await p.evaluate(() => getComputedStyle(document.getElementById('tkStepsToggle')).color);
  ok('A6 收起 hover 文字转主色', foldHov === 'rgb(55, 112, 247)', foldHov);

  /* B 折叠后「工序进度」回到常规字重 */
  const w0 = await p.evaluate(() => getComputedStyle(document.querySelector('.tt-now-label')).fontWeight);
  await p.click('#tkStepsToggle'); await wait(450);
  const w1 = await p.evaluate(() => getComputedStyle(document.querySelector('.tt-now-label')).fontWeight);
  ok('B1 展开时「工序进度」500、折起后 400', w0 === '500' && w1 === '400', w0 + ' → ' + w1);
  await p.click('#tkStepsToggle'); await wait(450);
  const w2 = await p.evaluate(() => getComputedStyle(document.querySelector('.tt-now-label')).fontWeight);
  ok('B2 再展开恢复 500', w2 === '500', w2);

  ok('A7 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ C 页签条浅灰底 / 专注模式文案与字重 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const c = await p.evaluate(() => {
    const cs = s => getComputedStyle(document.querySelector(s));
    const on = document.querySelector('.tk-tab.is-on');
    return {
      tabsBg: cs('.task-tabs').backgroundColor,
      onBg: getComputedStyle(on).backgroundColor,
      offBg: getComputedStyle(document.querySelectorAll('.tk-tab')[1]).backgroundColor,
      focusColor: cs('#tkFocus').color, focusFW: cs('#tkFocus').fontWeight,
      focusTxt: document.querySelector('.tk-focus-txt').textContent,
      focusW: Math.round(document.getElementById('tkFocus').getBoundingClientRect().width),
    };
  });
  ok('C1 页签条浅灰底 #FAFAFA，选中页签白块、未选中透明', c.tabsBg === 'rgb(250, 250, 250)' && c.onBg === 'rgb(255, 255, 255)' && c.offBg === 'rgba(0, 0, 0, 0)', [c.tabsBg, c.onBg, c.offBg].join(' / '));
  ok('C2 专注模式 14/500 主色、80 宽', c.focusFW === '500' && c.focusColor === 'rgb(55, 112, 247)' && c.focusW === 80 && c.focusTxt === '专注模式', JSON.stringify(c));
  await p.click('#tkFocus'); await wait(600);
  const c2 = await p.evaluate(() => ({
    txt: document.querySelector('.tk-focus-txt').textContent,
    fw: getComputedStyle(document.getElementById('tkFocus')).fontWeight,
    color: getComputedStyle(document.getElementById('tkFocus')).color,
    pressed: document.getElementById('tkFocus').getAttribute('aria-pressed'),
    tabsY: Math.round(document.querySelector('.task-tabs').getBoundingClientRect().y),
    wrapTop: Math.round(document.querySelector('.tp-wrap').getBoundingClientRect().y),
  }));
  ok('C3 进专注后文案 =「退出专注模式」，仍是 500 主色，页签条贴顶', c2.txt === '退出专注模式' && c2.fw === '500' && c2.color === 'rgb(55, 112, 247)' && c2.pressed === 'true' && c2.tabsY === 48 && c2.wrapTop === 88, JSON.stringify(c2));
  ok('C4 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ D 页签下的大容器（稿 3292:53937） ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  /* 第 49 轮：文件输入改为默认折叠 —— 先展开再量 */
  await p.evaluate(() => document.querySelector('.tp-files [data-tp-toggle]').click());
  await wait(320);
  const d = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const g = s => { const e = document.querySelector(s); return e ? rel(e) : null; };
    const cs = s => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
    const steps = [...document.querySelectorAll('.tp-step')];
    return {
      pmW: Math.round(pm.width),
      head: g('.tp-head'), s1: rel(steps[0]), s2: rel(steps[1]), diff: g('.tp-diff'),
      s1Bg: getComputedStyle(steps[0]).backgroundColor, s1Shadow: getComputedStyle(steps[0]).boxShadow,
      s2Bg: getComputedStyle(steps[1]).backgroundColor,
      no1: getComputedStyle(steps[0].querySelector('.tp-step-no')).backgroundColor,
      body: g('.tp-body'), bodyBorder: cs('.tp-body').borderTopColor,
      bodyPad: [cs('.tp-body-in').paddingTop, cs('.tp-body-in').paddingRight, cs('.tp-body-in').paddingBottom, cs('.tp-body-in').paddingLeft].join(' '),
      ta: g('.tp-textarea'), taH: cs('.tp-textarea').height,
      files: g('.tp-files'), sect: g('.tp-sect'), btns: [...document.querySelectorAll('.tp-file-btn')].map(rel),
      rows: [...document.querySelectorAll('.tp-file-row')].map(rel),
      rowBg: getComputedStyle(document.querySelector('.tp-file-row')).backgroundColor,
      aiBg: getComputedStyle(document.querySelector('.tp-file-row.is-ai')).backgroundColor,
      mini: rel(document.querySelector('.tp-mini')),
      ref: g('.tp-ref-head'), refBg: cs('.tp-ref-head').backgroundColor,
      foot: g('.tp-foot'), pri: g('.tp-primary'),
      priBg: cs('.tp-primary').backgroundColor,
      over: document.querySelector('.tp-body-in').scrollWidth - document.querySelector('.tp-body-in').clientWidth,
    };
  });
  ok('D1 头部 56 高，两张步骤卡等宽、各 439（1024 内容列）', d.head.h === 56 && d.head.w === 1024 && d.s1.h === 56 && Math.abs(d.s1.w - d.s2.w) <= 1 && d.s1.w === 439 && d.s2.x > d.s1.x + d.s1.w && d.diff.w === 96 && d.diff.h === 56, JSON.stringify([d.head, d.s1, d.s2, d.diff]));
  ok('D2 当前步骤浅蓝底 #F5F8FF + 浅蓝描边，下一步 #F7F7F7；数字圈主色', d.s1Bg === 'rgb(245, 248, 255)' && /218, 228, 254/.test(d.s1Shadow) && d.s2Bg === 'rgb(247, 247, 247)' && d.no1 === 'rgb(55, 112, 247)', [d.s1Bg, d.s1Shadow, d.s2Bg, d.no1].join(' / '));
  ok('D3 主体白卡：描边 #EEEEEE、内容内距 20/30/20/30', d.bodyBorder === 'rgb(238, 238, 238)' && d.bodyPad === '20px 30px 20px 30px' && d.body.w === 1024, JSON.stringify([d.bodyBorder, d.bodyPad, d.body.w]));
  ok('D4 目标文本域 962×128（= 1024 列 − 描边 − 左右内距）', d.ta.h === 128 && d.ta.w === 962, JSON.stringify(d.ta));
  ok('D5 文件输入块：头 36 + 两颗 32 高按钮（126 / 140）', d.sect.h === 36 && d.btns.length === 2 && d.btns[0].h === 32 && d.btns[0].w === 126 && d.btns[1].w === 140, JSON.stringify([d.sect, d.btns]));
  ok('D6 三行文件：40 高、默认 #F7F7F7、AI 那行暖色 #FFF7E8', d.rows.length === 3 && d.rows.every(r => r.h === 40) && d.rowBg === 'rgb(247, 247, 247)' && d.aiBg === 'rgb(255, 247, 232)', JSON.stringify(d.rows) + ' ' + d.rowBg + ' / ' + d.aiBg);
  ok('D7 行内动作键 28 高', d.mini.h === 28, JSON.stringify(d.mini));
  ok('D8 参考代码源头 36 高、底 #F7F7F7', d.ref.h === 36 && d.refBg === 'rgb(247, 247, 247)', JSON.stringify([d.ref, d.refBg]));
  ok('D9 底部 56 高、主键 212×36 居中、主色底', d.foot.h === 56 && d.pri.w === 212 && d.pri.h === 36 && Math.abs((d.pri.x + d.pri.w / 2) - (d.foot.x + d.foot.w / 2)) <= 1 && d.priBg === 'rgb(55, 112, 247)', JSON.stringify([d.foot, d.pri, d.priBg]));
  ok('D10 主体不出横向滚动', d.over <= 0, String(d.over));
  ok('D11 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ E 分组图标墨迹：箭头 / 文件夹与文字同心（≤0.6px） ============ */
{
  const p = await mk('cecoder-home.html', () => { localStorage.clear(); localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.setItem('cecoder.wdTab', '任务'); });
  const e = await p.evaluate(() => {
    const h = [...document.querySelectorAll('.wd-grp-head')].find(x => x.getBoundingClientRect().width > 0 && !x.parentElement.classList.contains('is-open') && x.querySelector('.wd-caret-folder')) || document.querySelector('.wd-grp-head');
    const f = h.querySelector('.wd-caret-folder path').getBoundingClientRect();
    const nm = h.querySelector('.wd-grp-name');
    const cs = getComputedStyle(nm);
    const cv = document.createElement('canvas').getContext('2d');
    cv.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const tm = cv.measureText(nm.textContent);
    const rng = document.createRange(); rng.selectNodeContents(nm);
    const t = rng.getBoundingClientRect();
    const lh = parseFloat(cs.lineHeight);
    const baseline = t.y + (lh - (tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent)) / 2 + tm.actualBoundingBoxAscent;
    return { ink: +(f.y + f.height / 2).toFixed(2), text: +(baseline - (tm.actualBoundingBoxAscent - tm.actualBoundingBoxDescent) / 2).toFixed(2) };
  });
  ok('E1 折叠态文件夹墨迹中心与文字差 ≤0.6px（不再下沉）', Math.abs(e.ink - e.text) <= 0.6, JSON.stringify(e));
  await p.close();
}

await b.close();
if (fail.length) { console.log('\n失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
console.log('\n第 47 轮：' + pass + ' pass / ' + fail.length + ' fail');
process.exit(fail.length ? 1 : 0);
