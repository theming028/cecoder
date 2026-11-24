/* 第 48 轮验收（大容器列宽 1024 居中 / 顶部外距 / 主体可折叠头 / 边框按钮 / 圆圈描边 / 两处可折叠容器 / 高度跟内容）
   第 49 轮同步：两处容器默认折叠、底部始终贴底、滚动条交给 .tp-wrap（内容层不再自滚） */
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
  await wait(700);
  p.tap = sel => p.evaluate(s => document.querySelector(s).click(), sel);
  return p;
}

/* ============ A 列宽：max-width 1024 + 整体居中 + 顶部外距 ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 900);
  const a = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const cs = s => getComputedStyle(document.querySelector(s));
    return { pmW: Math.round(pm.width), wrap: rel('.tp-wrap'), head: rel('.tp-head'), body: rel('.tp-body'), foot: rel('.tp-foot'), colMax: cs('.tp-head').maxWidth, padTop: cs('.tp-wrap').paddingTop };
  });
  ok('A1 内容列 max-width = 1024（1440 且左栏展开：面板 1104，列取上限 1024）', a.colMax === '1024px' && a.head.w === 1024, JSON.stringify([a.colMax, a.head.w, a.pmW]));
  ok('A2 内容列整体居中（左右余量相等，差 ≤1）', Math.abs(a.head.x - (a.pmW - a.head.w - a.head.x)) <= 1, JSON.stringify([a.head.x, a.pmW - a.head.x - a.head.w]));
  ok('A3 主体与头部同宽同左缘；底部通栏且共中线', a.body.w === a.head.w && a.body.x === a.head.x && a.foot.w === a.wrap.w - 40 && Math.abs((a.foot.x + a.foot.w / 2) - (a.head.x + a.head.w / 2)) <= 1, JSON.stringify([a.body, a.foot, a.wrap]));
  ok('A4 tp-wrap 顶部外距 20（头部 y − wrap y = 20）', a.padTop === '20px' && a.head.y - a.wrap.y === 20, JSON.stringify([a.padTop, a.head.y, a.wrap]));
  ok('A5 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ B 窄窗收缩 ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1280, 900);
  const r = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const g = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return { x: Math.round(b.left - pm.left), w: Math.round(b.width) }; };
    return { pmW: Math.round(pm.width), head: g('.tp-head'), over: document.querySelector('.tp-wrap').scrollWidth - document.querySelector('.tp-wrap').clientWidth };
  });
  ok('B1 1280（左栏展开，面板 944）时列宽收到 904、仍居中', r.head.w === r.pmW - 40 && Math.abs(r.head.x - (r.pmW - r.head.w - r.head.x)) <= 1, JSON.stringify([r.head, r.pmW]));
  ok('B2 窄窗不出横向滚动', r.over <= 0, String(r.over));
  await p.close();
}

/* ============ C 主体：可折叠标题栏 + 高度跟内容 + 底部贴底 ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 900);
  const c = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { y: Math.round(r.top - pm.top), h: Math.round(r.height), bottom: Math.round(r.bottom) }; };
    const cs = s => getComputedStyle(document.querySelector(s));
    const inn = document.querySelector('.tp-body-in');
    const wrap = document.querySelector('.tp-wrap');
    const body = rel('.tp-body'), foot = rel('.tp-foot');
    return {
      head: rel('.tp-body-head'), headBg: cs('.tp-body-head').backgroundColor, headLine: cs('.tp-body-head').boxShadow,
      bodyPad: [cs('.tp-body-in').paddingTop, cs('.tp-body-in').paddingRight, cs('.tp-body-in').paddingBottom, cs('.tp-body-in').paddingLeft].join(' '),
      body, foot, gap: foot.y - (body.y + body.h),
      innScrolls: inn.scrollHeight > inn.clientHeight + 1,
      wrapScrolls: wrap.scrollHeight > wrap.clientHeight + 1,
      footInWrap: Math.round(wrap.getBoundingClientRect().bottom - document.querySelector('.tp-foot').getBoundingClientRect().bottom),
      sectH: rel('.tp-body-head .tp-sect').h,
      aria: document.querySelector('.tp-body [data-tp-toggle]').getAttribute('aria-expanded'),
    };
  });
  ok('C1 主体有 36 高的可折叠标题栏（#F7F7F7 + 下沿 #EEEEEE）', c.head.h === 36 && c.headBg === 'rgb(247, 247, 247)' && /-1px/.test(c.headLine) && c.sectH === 36, JSON.stringify(c.head) + ' ' + c.headBg + ' ' + c.headLine);
  ok('C2 标题栏下方内容内距 20 / 30 / 20 / 30', c.bodyPad === '20px 30px 20px 30px', c.bodyPad);
  ok('C3 主体高度跟内容（内容层不自滚，超高由 .tp-wrap 滚）', c.innScrolls === false && c.body.h > 200 && (c.wrapScrolls === false || c.wrapScrolls === true), JSON.stringify([c.body, c.innScrolls, c.wrapScrolls]));
  ok('C4 底部贴齐容器底，与主体至少 40 间距', c.footInWrap === 0 && c.gap >= 40, JSON.stringify([c.gap, c.footInWrap]));
  ok('C5 主体标题栏默认展开（aria-expanded=true）', c.aria === 'true', String(c.aria));

  await p.tap('.tp-body [data-tp-toggle]'); await wait(300);
  const c2 = await p.evaluate(() => {
    const cs = s => getComputedStyle(document.querySelector(s));
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { y: Math.round(r.top - pm.top), h: Math.round(r.height) }; };
    const body = rel('.tp-body'), foot = rel('.tp-foot');
    return { inn: cs('.tp-body-in').display, body, gap: foot.y - (body.y + body.h), aria: document.querySelector('.tp-body [data-tp-toggle]').getAttribute('aria-expanded'), caret: cs('.tp-body .tp-sect-caret').transform, closed: document.querySelector('.tp-body').classList.contains('is-closed'), footIn: Math.round(document.querySelector('.tp-wrap').getBoundingClientRect().bottom - document.querySelector('.tp-foot').getBoundingClientRect().bottom) };
  });
  ok('C6 折起后只剩标题栏 38（36+2 描边）、内容隐藏、箭头转成向右', c2.inn === 'none' && c2.body.h === 38 && c2.closed && c2.aria === 'false' && /matrix\(0, -1, 1, 0/.test(c2.caret), JSON.stringify(c2));
  ok('C7 折起后底部仍贴底、间距仍 ≥40', c2.footIn === 0 && c2.gap >= 40, JSON.stringify([c2.gap, c2.footIn]));
  await p.tap('.tp-body [data-tp-toggle]'); await wait(300);
  const c3 = await p.evaluate(() => ({ aria: document.querySelector('.tp-body [data-tp-toggle]').getAttribute('aria-expanded'), h: Math.round(document.querySelector('.tp-body').getBoundingClientRect().height) }));
  ok('C8 再点展开，回到内容高度', c3.aria === 'true' && c3.h > 200, JSON.stringify(c3));
  ok('C9 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ D 边框按钮 / 圆圈描边 ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 900);
  await p.tap('.tp-files [data-tp-toggle]'); await wait(300);
  const d = await p.evaluate(() => {
    const cs = s => getComputedStyle(document.querySelector(s));
    const no2 = document.querySelectorAll('.tp-step-no')[1];
    return {
      mini: cs('.tp-mini').boxShadow, miniH: Math.round(document.querySelector('.tp-mini').getBoundingClientRect().height), miniBg: cs('.tp-mini').backgroundColor,
      no2Shadow: getComputedStyle(no2).boxShadow, no2Bg: getComputedStyle(no2).backgroundColor, no2Color: getComputedStyle(no2).color,
      no1Shadow: cs('.tp-step.is-on .tp-step-no').boxShadow, no1Bg: cs('.tp-step.is-on .tp-step-no').backgroundColor,
    };
  });
  ok('D1 tp-mini 是白底 + 1px #E5E5E5 描边、28 高', /inset/.test(d.mini) && /229, 229, 229/.test(d.mini) && d.miniBg === 'rgb(255, 255, 255)' && d.miniH === 28, d.mini + ' ' + d.miniH);
  ok('D2 未选中序号圈白底 + 1px #E5E5E5 描边、字色 #6B6B6B', /229, 229, 229/.test(d.no2Shadow) && d.no2Bg === 'rgb(255, 255, 255)' && d.no2Color === 'rgb(107, 107, 107)', d.no2Shadow + ' ' + d.no2Bg);
  ok('D3 选中序号圈主色实心、无描边', d.no1Bg === 'rgb(55, 112, 247)' && d.no1Shadow === 'none', d.no1Bg + ' / ' + d.no1Shadow);
  ok('D4 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ E 文件输入 / 参考代码源：默认折叠 → 展开（稿 3292:53973） ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 900);
  const e0 = await p.evaluate(() => {
    const cs = s => getComputedStyle(document.querySelector(s));
    const h = s => Math.round(document.querySelector(s).getBoundingClientRect().height);
    return {
      filesHead: Math.round(document.querySelector('.tp-files .tp-sect').getBoundingClientRect().height),
      filesBg: cs('.tp-files-head').backgroundColor, filesH: h('.tp-files'),
      refHead: Math.round(document.querySelector('.tp-ref .tp-sect').getBoundingClientRect().height),
      refBg: cs('.tp-ref-head').backgroundColor, refH: h('.tp-ref'),
      filesAria: document.querySelector('.tp-files [data-tp-toggle]').getAttribute('aria-expanded'),
      refAria: document.querySelector('.tp-ref [data-tp-toggle]').getAttribute('aria-expanded'),
      filesIn: cs('.tp-files-in').display, refIn: cs('.tp-ref-in').display,
    };
  });
  ok('E1 两处都是 36 高标题栏（#F7F7F7），且默认折叠（38 / 内容 display:none / aria=false）',
    e0.filesHead === 36 && e0.filesBg === 'rgb(247, 247, 247)' && e0.refHead === 36 && e0.refBg === 'rgb(247, 247, 247)' &&
    e0.filesH === 38 && e0.refH === 38 && e0.filesIn === 'none' && e0.refIn === 'none' && e0.filesAria === 'false' && e0.refAria === 'false', JSON.stringify(e0));

  await p.tap('.tp-files [data-tp-toggle]'); await wait(250);
  const e1 = await p.evaluate(() => ({
    inn: getComputedStyle(document.querySelector('.tp-files-in')).display,
    h: Math.round(document.querySelector('.tp-files').getBoundingClientRect().height),
    aria: document.querySelector('.tp-files [data-tp-toggle]').getAttribute('aria-expanded'),
  }));
  ok('E2 文件输入展开（内容 display:block、高度 > 200、aria=true）', e1.inn === 'block' && e1.h > 200 && e1.aria === 'true', JSON.stringify(e1));

  await p.tap('.tp-ref [data-tp-toggle]'); await wait(300);
  const e3 = await p.evaluate(() => {
    const base = document.querySelector('.tp-ref-in').getBoundingClientRect();
    const rel = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { x: Math.round(r.left - base.left), y: Math.round(r.top - base.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    return {
      refH: Math.round(document.querySelector('.tp-ref').getBoundingClientRect().height),
      tip: rel('.tp-ref-tip'), pick: rel('.tp-pick'), selA: rel('.tp-sel-a'),
      add: rel('.tp-pick-add'), link: rel('.tp-pick-link'),
      repo: rel('.tp-repo'), rows: [...document.querySelectorAll('.tp-repo-in .tp-row')].map(e => Math.round(e.getBoundingClientRect().height)),
      area: rel('.tp-area'), src: [...document.querySelectorAll('.tp-src-row')].map(e => Math.round(e.getBoundingClientRect().height)),
      pill: rel('.tp-pill'), del: rel('.tp-repo-head .tp-del'), grp: rel('.tp-repo-head .tp-chip-grp'),
    };
  });
  ok('E3 展开后头部 36 → 提示 20 → 选择条 54（与稿 3292:53973 同序）', e3.refH > 400 && e3.tip.y === 20 && e3.tip.h === 22 && e3.pick.y === 54, JSON.stringify([e3.refH, e3.tip, e3.pick]));
  ok('E4 选择条：类型 200×32 / 添加 60×32 / 手动添加链接 56', e3.selA.w === 200 && e3.selA.h === 32 && e3.add.w === 60 && e3.add.h === 32 && e3.link.w === 56, JSON.stringify([e3.selA, e3.add, e3.link]));
  ok('E5 代码源卡：头 36 + 3 行表单（28/28/64，行间 12）+ 两行 36 的分支行', e3.repo.w === e3.pick.w && JSON.stringify(e3.rows) === '[28,28,64]' && e3.area.h === 64 && e3.src.join() === '36,36', JSON.stringify([e3.repo, e3.rows, e3.src]));
  ok('E6 分支胶囊 94×22，整组（胶囊+竖线+删除+右内距）141 宽贴右、删除右缘距卡右 13', e3.pill.w === 94 && e3.pill.h === 22 && Math.abs(e3.grp.w - 141) <= 1 && Math.abs((e3.repo.x + e3.repo.w - 13) - (e3.del.x + e3.del.w)) <= 2, JSON.stringify([e3.pill, e3.grp, e3.del]));
  ok('E7 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ F 高度自适应 + 底部贴底 + 滚动条落在 .tp-wrap ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 1600);
  const tall = await p.evaluate(() => {
    const body = document.querySelector('.tp-body').getBoundingClientRect();
    const foot = document.querySelector('.tp-foot').getBoundingClientRect();
    const wrap = document.querySelector('.tp-wrap');
    return { h: Math.round(body.height), gap: Math.round(foot.top - body.bottom), footIn: Math.round(wrap.getBoundingClientRect().bottom - foot.bottom), scrolls: wrap.scrollHeight > wrap.clientHeight + 1 };
  });
  await p.tap('.tp-files [data-tp-toggle]'); await wait(250);
  await p.tap('.tp-ref [data-tp-toggle]'); await wait(350);
  const tall2 = await p.evaluate(() => {
    const body = document.querySelector('.tp-body').getBoundingClientRect();
    const foot = document.querySelector('.tp-foot').getBoundingClientRect();
    const wrap = document.querySelector('.tp-wrap');
    const inn = document.querySelector('.tp-body-in');
    return { h: Math.round(body.height), gap: Math.round(foot.top - body.bottom), footIn: Math.round(wrap.getBoundingClientRect().bottom - foot.bottom), scrolls: wrap.scrollHeight > wrap.clientHeight + 1, inn: inn.scrollHeight > inn.clientHeight + 1 };
  });
  ok('F1 1600 高下：主体高度跟着内容长（折起 336 → 展开明显更高），底部始终贴底', tall.h < 400 && tall2.h > 900 && tall.footIn === 0 && tall2.footIn === 0, JSON.stringify([tall, tall2]));
  ok('F2 内容放得下时 .tp-wrap 不滚、内容层也不滚、底部间距 ≥40', tall.scrolls === false && tall2.scrolls === false && tall2.inn === false && tall2.gap >= 40, JSON.stringify([tall, tall2]));
  await p.close();
}

{
  const p = await mk('cecoder-task.html?id=0', 1440, 900);
  await p.tap('.tp-files [data-tp-toggle]'); await wait(250);
  await p.tap('.tp-ref [data-tp-toggle]'); await wait(350);
  const r = await p.evaluate(() => {
    const wrap = document.querySelector('.tp-wrap');
    const inn = document.querySelector('.tp-body-in');
    const foot = document.querySelector('.tp-foot');
    const before = { footIn: Math.round(wrap.getBoundingClientRect().bottom - foot.getBoundingClientRect().bottom) };
    wrap.scrollTop = 9999;
    return { before, scrolls: wrap.scrollHeight > wrap.clientHeight + 1, inn: inn.scrollHeight > inn.clientHeight + 1, maxTop: wrap.scrollHeight - wrap.clientHeight, over: wrap.scrollWidth - wrap.clientWidth };
  });
  await wait(200);
  const after = await p.evaluate(() => {
    const wrap = document.querySelector('.tp-wrap');
    const foot = document.querySelector('.tp-foot');
    const body = document.querySelector('.tp-body');
    return { top: Math.round(wrap.scrollTop), footIn: Math.round(wrap.getBoundingClientRect().bottom - foot.getBoundingClientRect().bottom), gap: Math.round(foot.getBoundingClientRect().top - body.getBoundingClientRect().bottom) };
  });
  ok('F3 900 高时：滚动发生在 .tp-wrap（内容层不再自滚），滚到底能看到 40 间距，底部全程贴底', r.scrolls === true && r.inn === false && r.maxTop > 100 && after.top === r.maxTop && after.footIn === 0 && after.gap === 40 && r.before.footIn === 0, JSON.stringify([r, after]));
  ok('F4 纵向滚动时不带出横向滚动', r.over <= 0, String(r.over));
  await p.close();
}

await b.close();
if (fail.length) { console.log('\n失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
console.log('\n第 48 轮：' + pass + ' pass / ' + fail.length + ' fail');
process.exit(fail.length ? 1 : 0);
