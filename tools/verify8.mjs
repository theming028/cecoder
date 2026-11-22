/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
const F = 'file:///' + BASE + '/cecoder-home.html';
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
const p = await b.newPage();
const errs = [];
p.on('pageerror', e => errs.push('pageerror ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto(F, { waitUntil: 'load' });
await p.evaluate(() => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); localStorage.setItem('cecoder.wdTab', '任务'); }); /* 第 38 轮：默认展开/默认会话页签，折叠态 + 任务页签基线显式指定 */
await p.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 350));

let pass = 0; const fail = [];
const ok = (name, cond, extra) => { if (cond) pass++; else fail.push(name + (extra !== undefined ? ' ← ' + extra : '')); };
const cs = (sel, prop) => p.evaluate((s, pr) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, sel, prop);
const box = sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [+r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)]; }, sel);

/* ---------- 1 非选中 tab 的底线 ---------- */
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 700));
ok('1 tabs 容器底线 #E5E5E5', (await cs('.wd-tabs', 'boxShadow')).includes('rgb(229, 229, 229)'), await cs('.wd-tabs', 'boxShadow'));
ok('1 未选中 tab 有底线', (await cs('.wd-tab:not(.is-active)', 'boxShadow')).includes('inset') && (await cs('.wd-tab:not(.is-active)', 'boxShadow')).includes('rgb(229, 229, 229)'), await cs('.wd-tab:not(.is-active)', 'boxShadow'));
ok('1 选中 tab 无底线', (await cs('.wd-tab.is-active', 'boxShadow')) === 'none', await cs('.wd-tab.is-active', 'boxShadow'));
ok('1 无遗留 ::before 分隔条', await p.evaluate(() => getComputedStyle(document.querySelector('.wd-tabs'), '::before').content === 'none'));

/* ---------- 2 wd-newtask 默认文字色 ---------- */
ok('2 newtask 文字 #6B6B6B', (await cs('.wd-newtask', 'color')) === 'rgb(107, 107, 107)', await cs('.wd-newtask', 'color'));
ok('2 newtask 加号 #6B6B6B', (await cs('.wd-newtask .ico', 'color')) === 'rgb(107, 107, 107)', await cs('.wd-newtask .ico', 'color'));
const nt = await box('.wd-newtask');
await p.mouse.move(nt[0] + nt[2] / 2, nt[1] + nt[3] / 2);
await new Promise(r => setTimeout(r, 260));
ok('2 newtask hover 转主色', (await cs('.wd-newtask', 'color')) === 'rgb(55, 112, 247)', await cs('.wd-newtask', 'color'));
await p.mouse.move(700, 500);

/* ---------- 3 sc-acts 投影 ---------- */
await p.click('#scIdle'); await new Promise(r => setTimeout(r, 300));
const sh = 'rgba(0, 0, 0, 0.08) 0px 1px 2px 0px';
const btnSh = await p.evaluate(() => [...document.querySelectorAll('.sc-btn')].map(e => getComputedStyle(e).boxShadow));
ok('3 两个文字按钮投影', btnSh.length === 2 && btnSh.every(v => v === sh), JSON.stringify(btnSh));
ok('3 折叠按钮投影', (await cs('.sc-fold', 'boxShadow')) === sh, await cs('.sc-fold', 'boxShadow'));

/* ---------- 4 数字滚动 + 图表绘制 ---------- */
const early = await p.evaluate(() => ({
  n: [...document.querySelectorAll('.sc-metric-v')].map(e => e.textContent),
  clip: getComputedStyle(document.querySelector('.sc-chart > svg')).clipPath
}));
ok('4 首帧数字在滚动中', early.n[0] !== '12' || early.n[3] !== '51%', JSON.stringify(early.n));
ok('4 首帧图表未画完', /inset\(0px [1-9]/.test(early.clip), early.clip);
await new Promise(r => setTimeout(r, 1300));
const late = await p.evaluate(() => ({
  n: [...document.querySelectorAll('.sc-metric-v')].map(e => e.textContent),
  clip: getComputedStyle(document.querySelector('.sc-chart > svg')).clipPath,
  dot: getComputedStyle(document.querySelector('.sc-chart-dot circle')).transform
}));
ok('4 终态数字 12/2/1/51%', late.n.join(',') === '12,2,1,51%', late.n.join(','));
ok('4 图表绘制完成', /^inset\(0px (0%|0px)( 0px 0px)?\)$/.test(late.clip), late.clip);
ok('4 数据点弹出到位', late.dot === 'matrix(1, 0, 0, 1, 0, 0)', late.dot);
/* 折叠再展开能重播 */
await p.click('#scFold'); await new Promise(r => setTimeout(r, 420));
await p.click('#scFold'); await new Promise(r => setTimeout(r, 120));
const replay = await p.evaluate(() => ({ clip: getComputedStyle(document.querySelector('.sc-chart > svg')).clipPath, n: document.querySelector('.sc-metric-v').textContent }));
ok('4 重开后重播', /inset\(0px [1-9]/.test(replay.clip) || replay.n !== '12', JSON.stringify(replay));
await new Promise(r => setTimeout(r, 1200));

/* ---------- 5 标题蓝线已移除 ---------- */
ok('5 hero::after 无内容', (await cs('.hero-title', '::after') || '').includes('none') || await p.evaluate(() => getComputedStyle(document.querySelector('.hero-title'), '::after').height === 'auto'), await p.evaluate(() => getComputedStyle(document.querySelector('.hero-title'), '::after').height));

/* ---------- 6 六个工作台各自的子项 ---------- */
const names = ['通用', '需求', '架构', '交互', '开发', '测试'];
const seen = [];
for (const n of names) {
  await p.evaluate(n => document.querySelector(`[data-chips="process"] .chip[data-wb="${n}"]`).click(), n);
  await new Promise(r => setTimeout(r, 230));
  seen.push(await p.evaluate(() => ({
    open: document.getElementById('wbSlot').classList.contains('is-open'),
    h: document.querySelector('.wb-bar').getBoundingClientRect().height,
    opts: [...document.querySelectorAll('.wb-opt')].map(e => e.textContent),
    act: [...document.querySelectorAll('.wb-opt')].filter(e => e.classList.contains('is-active')).map(e => e.textContent)
  })));
}
ok('6 六个工作台都弹出子项', seen.every(s => s.open && s.h === 56), JSON.stringify(seen.map(s => s.open)));
ok('6 每个工作台各有 4 个子项', seen.every(s => s.opts.length === 4), JSON.stringify(seen.map(s => s.opts.length)));
ok('6 六套子项互不相同', new Set(seen.map(s => s.opts.join('/'))).size === 6);
ok('6 默认选中第一项', seen.every(s => s.act.length === 1 && s.act[0] === s.opts[0]), JSON.stringify(seen.map(s => s.act)));
/* 每台记住自己的选择 */
await p.evaluate(() => document.querySelector('[data-chips="process"] .chip[data-wb="需求"]').click());
await new Promise(r => setTimeout(r, 200));
await p.evaluate(() => document.querySelectorAll('.wb-opt')[2].click());
await new Promise(r => setTimeout(r, 150));
const picked = await p.evaluate(() => document.querySelector('.wb-opt.is-active').textContent);
await p.evaluate(() => document.querySelector('[data-chips="process"] .chip[data-wb="架构"]').click());
await new Promise(r => setTimeout(r, 180));
await p.evaluate(() => document.querySelector('[data-chips="process"] .chip[data-wb="需求"]').click());
await new Promise(r => setTimeout(r, 200));
const back = await p.evaluate(() => document.querySelector('.wb-opt.is-active').textContent);
ok('6 切回来还记得选中的子项', picked === back && picked === '验收标准', picked + ' → ' + back);

/* ---------- 7 关闭图标淡一级 ---------- */
ok('7 关闭子项 × 为 #A9A9A9', (await cs('.wb-close', 'color')) === 'rgb(169, 169, 169)', await cs('.wb-close', 'color'));
await p.evaluate(() => document.querySelector('[data-chips="quick"] .chip[data-quick="技术任务"]').click());
await new Promise(r => setTimeout(r, 250));
ok('7 关闭工序 × 为 #A9A9A9', (await cs('.qf-icon[data-bar-close]', 'color')) === 'rgb(169, 169, 169)', await cs('.qf-icon[data-bar-close]', 'color'));
await p.evaluate(() => document.querySelector('[data-chips="quick"] .chip.is-active').click());
await new Promise(r => setTimeout(r, 200));

/* ---------- 8 tooltip + 收起图标 ---------- */
const hoverTip = async sel => {
  const r = await box(sel);
  await p.mouse.move(r[0] + r[2] / 2, r[1] + r[3] / 2);
  await new Promise(r2 => setTimeout(r2, 700));
  const t = await p.evaluate(() => { const e = document.querySelector('.cds-tip'); const rr = e.getBoundingClientRect(); return { txt: e.textContent, on: e.classList.contains('is-on'), l: rr.left, t: rr.top, w: rr.width, h: rr.height }; });
  await p.mouse.move(700, 520);
  await new Promise(r2 => setTimeout(r2, 260));
  return t;
};
const t1 = await hoverTip('#scFold');
ok('8 折叠看板 tooltip', t1.on && t1.txt === '折叠看板', JSON.stringify(t1));
await p.click('#scFold'); await new Promise(r => setTimeout(r, 420));
const t2 = await hoverTip('#scFold');
ok('8 展开看板 tooltip', t2.on && t2.txt === '展开看板', JSON.stringify(t2));
ok('8 tooltip 在可视区内', t2.l >= 0 && t2.t >= 0 && t2.l + t2.w <= 1440, JSON.stringify(t2));
await p.evaluate(() => { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: false })); });
await p.reload({ waitUntil: 'load' }); await new Promise(r => setTimeout(r, 320));
const t3 = await hoverTip('.menu-btn');
ok('8 展开任务列表 tooltip', t3.on && t3.txt === '展开任务列表', JSON.stringify(t3));
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 700));
const t4 = await hoverTip('.wd-collapse');
ok('8 收起任务列表 tooltip', t4.on && t4.txt === '收起任务列表', JSON.stringify(t4));
ok('8 抽屉内 tooltip 不被裁', t4.l + t4.w <= 1440 && t4.t >= 0 && t4.w === 96, JSON.stringify(t4));
/* 收起图标几何：设计稿 direction/to-left —— 指向左的箭头 + 右侧竖条（9.33x8.12 居中） */
const iconGeo = await p.evaluate(() => {
  const svg = document.querySelector('.wd-collapse svg');
  return { vb: svg.getAttribute('viewBox'), paths: svg.querySelectorAll('path').length, rects: svg.querySelectorAll('rect').length };
});
/* 第 34 轮：与工具行「排序」图标同规格（14 网格满版） */
ok('8 收起图标为箭头 + 竖条', iconGeo.vb === '0 0 14 14' && iconGeo.paths === 1 && iconGeo.rects === 1, JSON.stringify(iconGeo));

/* ---------- 9 分组名与箭头对齐 ---------- */
const align = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('.wd-grp-head').forEach(h => {
    const nm = h.querySelector('.wd-grp-name'), cr = h.querySelector('.wd-caret');
    const rng = document.createRange(); rng.selectNodeContents(nm);
    const t = rng.getBoundingClientRect(), c = cr.getBoundingClientRect();
    out.push(+(((c.top + c.bottom) / 2) - ((t.top + t.bottom) / 2)).toFixed(2));
  });
  return out;
});
ok('9 文字与箭头中心差 ≤0.75px', align.every(v => Math.abs(v) <= 0.75), JSON.stringify(align));

/* ---------- 10 空态文字 ---------- */
await p.evaluate(() => { const w = document.querySelectorAll('.wd-grp')[4]; if (!w.classList.contains('is-open')) w.querySelector('.wd-grp-head').click(); });
await new Promise(r => setTimeout(r, 320));
const emp = await p.evaluate(() => {
  const t = document.querySelector('#wdViewTask .wd-empty-title');
  const bs = [...document.querySelectorAll('#wdViewTask .wd-empty-acts button')];
  const g = e => [getComputedStyle(e).color, getComputedStyle(e).textDecorationLine, getComputedStyle(e).fontSize];
  return { title: g(t), acts: bs.map(b => g(b)) };
});
ok('10 空态标题 #A9A9A9 13px（第 17 轮统一 13）', emp.title[0] === 'rgb(169, 169, 169)' && emp.title[2] === '13px', JSON.stringify(emp.title));
/* 第 21 轮：任务页签有两个空分组（Nutstore / AI Native Factory），动作链接共 4 个，样式必须一致 */
ok('10 动作链接 #6B6B6B + 下划线（每个空态 2 个）',
  emp.acts.length >= 2 && emp.acts.length % 2 === 0 && emp.acts.every(a => a[0] === 'rgb(107, 107, 107)' && a[1] === 'underline'),
  JSON.stringify(emp.acts));

/* ---------- 11 模态三条线 ---------- */
await p.click('.wd-collapse'); await new Promise(r => setTimeout(r, 320));
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 420));
await p.evaluate(() => document.getElementById('wdSync').click());
await new Promise(r => setTimeout(r, 520));
const lines = await p.evaluate(() => {
  const g = s => getComputedStyle(document.querySelector(s)).boxShadow;
  return { head: g('.cm-head'), left: g('.cm-left'), foot: g('.cm-foot') };
});
const line = 'rgb(235, 236, 237)';
ok('11 头底部线', lines.head.includes('0px -1px 0px 0px inset') && lines.head.includes(line), lines.head);
ok('11 左栏右缘线', lines.left.includes('-1px 0px 0px 0px inset') && lines.left.includes(line), lines.left);
ok('11 脚顶部线', lines.foot.includes('0px 1px 0px 0px inset') && lines.foot.includes(line), lines.foot);
const mb = await box('.cm-panel');
/* 第 18 轮：高改为面板 - 80（上下各 40），不再固定 804 */
ok('11 模态盒 1080 宽、高 = 面板 - 80', mb[2] === 1080 && mb[3] === (await p.evaluate(() => document.querySelector('.panel').getBoundingClientRect().height)) - 80, JSON.stringify(mb));

console.log('PASS', pass, 'FAIL', fail.length);
if (fail.length) console.log(fail.join('\n'));
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await b.close();
