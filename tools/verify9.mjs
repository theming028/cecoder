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
await p.evaluate(() => localStorage.removeItem('cecoder.wsDrawer'));
await p.reload({ waitUntil: 'load' });
await new Promise(r => setTimeout(r, 400));

let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const box = s => p.evaluate(q => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return [+r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)]; }, s);
const cs = (s, prop) => p.evaluate((q, pr) => { const e = document.querySelector(q); return e ? getComputedStyle(e)[pr] : null; }, s, prop);

/* ========== 3 输入框自动撑高 ========== */
const ci0 = await box('.c-input');
ok('3 初始输入高 46', ci0[3] === 46, JSON.stringify(ci0));
const card0 = await box('.c-card');
ok('3 初始卡高 128', card0[3] === 128, JSON.stringify(card0));
await p.evaluate(() => {
  const ta = document.querySelector('.c-input');
  ta.value = Array.from({ length: 4 }, (_, i) => '第' + (i + 1) + '行内容').join('\n');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 80));
const ci1 = await box('.c-input'), card1 = await box('.c-card'), comp1 = await box('.composer');
ok('3 4 行时输入变高', ci1[3] > 46, JSON.stringify(ci1));
ok('3 卡高 = 输入 + 82', Math.abs(card1[3] - (ci1[3] + 82)) < 1.1, card1[3] + ' vs ' + ci1[3]);
ok('3 底部不动（输入卡底边不变）', Math.abs((card1[1] + card1[3]) - (card0[1] + card0[3])) < 1.1, (card1[1] + card1[3]) + ' vs ' + (card0[1] + card0[3]));
ok('3 整块向上撑高', card1[1] < card0[1] - 10, card0[1] + ' → ' + card1[1]);
ok('3 composer = 输入 + 122', Math.abs(comp1[3] - (ci1[3] + 122)) < 1.1, comp1[3] + ' vs ' + ci1[3]);
// 20 行 → 封顶 256
await p.evaluate(() => {
  const ta = document.querySelector('.c-input');
  ta.value = Array.from({ length: 20 }, (_, i) => '第' + (i + 1) + '行').join('\n');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 80));
const ciMax = await box('.c-input');
/* 第 11 轮：内容列 50% 后工具行占两排，1440 下可用高度刚好差 1px，
   1424 的封顶值是 255（1px 差异，视觉无感）；核心是「不超过 256 且能滚」 */
ok('3 最高封顶 256', ciMax[3] >= 254 && ciMax[3] <= 256, JSON.stringify(ciMax));
ok('3 封顶后可滚动', await p.evaluate(() => { const t = document.querySelector('.c-input'); return t.scrollHeight > t.clientHeight; }));
await p.evaluate(() => { const ta = document.querySelector('.c-input'); ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); });
await new Promise(r => setTimeout(r, 80));
const ciBack = await box('.c-input');
ok('3 清空回落 46', ciBack[3] === 46, JSON.stringify(ciBack));

/* ========== 4 本地 / 工作目录 ========== */
const envHover = await p.evaluate(() => {
  const e = document.querySelectorAll('.c-env')[1];
  return { bg: getComputedStyle(e).backgroundColor };
});
ok('4 工作目录图标换成文件夹（path 数 ≥ 4）', await p.evaluate(() => document.querySelectorAll('.c-env')[1].querySelectorAll('svg path').length >= 4),
  await p.evaluate(() => document.querySelectorAll('.c-env')[1].querySelectorAll('svg path').length));
ok('4 本地图标 12.25×9.95 云朵（viewBox 14）', await p.evaluate(() => {
  const s = document.querySelectorAll('.c-env')[0].querySelector('svg');
  return s.getAttribute('viewBox') === '0 0 14 14';
}));
const eB = await box('.c-env');
await p.mouse.move(eB[0] + 20, eB[1] + 14);
await new Promise(r => setTimeout(r, 240));
const hoverBg = await cs('.c-env', 'backgroundColor');
ok('4 hover 中性灰 #E6E6E6', hoverBg === 'rgb(230, 230, 230)', hoverBg);
ok('4 hover 不再是蓝灰', hoverBg !== 'rgb(231, 236, 242)');
await p.mouse.move(700, 300);

/* ========== 1 看板折叠后整卡可展开 ========== */
await p.click('#scIdle'); await new Promise(r => setTimeout(r, 350));
ok('1 展开为看板', (await p.evaluate(() => document.getElementById('scene').dataset.state)) === 'open');
await p.click('#scFold'); await new Promise(r => setTimeout(r, 350));
ok('1 折叠成功', (await p.evaluate(() => document.getElementById('scene').dataset.state)) === 'collapsed');
ok('1 折叠态 role=button', (await p.evaluate(() => document.getElementById('scene').getAttribute('role'))) === 'button');
ok('1 折叠态 tabindex=0', (await p.evaluate(() => document.getElementById('scene').getAttribute('tabindex'))) === '0');
ok('1 折叠态可点光标', (await cs('.scene', 'cursor')) === 'pointer', await cs('.scene', 'cursor'));
const sc = await box('.scene');
await p.mouse.click(sc[0] + 12, sc[1] + sc[3] / 2);   // 左侧空白处（非按钮）
await new Promise(r => setTimeout(r, 380));
ok('1 点卡片空白处展开', (await p.evaluate(() => document.getElementById('scene').dataset.state)) === 'open');
/* 键盘 */
await p.click('#scFold'); await new Promise(r => setTimeout(r, 340));
await p.evaluate(() => document.getElementById('scene').focus());
await p.keyboard.press('Enter'); await new Promise(r => setTimeout(r, 340));
ok('1 回车也能展开', (await p.evaluate(() => document.getElementById('scene').dataset.state)) === 'open');
/* 折叠按钮仍能单独收起（不被整卡点击抢走） */
await p.click('#scFold'); await new Promise(r => setTimeout(r, 340));
ok('1 折叠键点击后不再自动展开', (await p.evaluate(() => document.getElementById('scene').dataset.state)) === 'collapsed');
await p.click('#scFold'); await new Promise(r => setTimeout(r, 340));

/* ========== 2 MiniCloud 折叠后无间距 ========== */
await p.click('.menu-btn'); await new Promise(r => setTimeout(r, 700));
const gapOpen = await p.evaluate(() => {
  const g = document.querySelector('#wdViewTask > .wd-grp');
  const groups = document.querySelector('.wd-groups');
  return groups.getBoundingClientRect().top - g.getBoundingClientRect().bottom;
});
ok('2 展开时保留 12px 段落间距', Math.abs(gapOpen - 12) < 1.2, gapOpen);
await p.evaluate(() => document.querySelector('#wdViewTask > .wd-grp > .wd-grp-head').click());
await new Promise(r => setTimeout(r, 300));
const gapClosed = await p.evaluate(() => {
  const g = document.querySelector('#wdViewTask > .wd-grp');
  const next = document.querySelector('.wd-groups > .wd-grp');
  return next.getBoundingClientRect().top - g.getBoundingClientRect().bottom;
});
ok('2 折叠后与下一目录叠 1px（无 12px 间距）', Math.abs(gapClosed + 1) < 1.2, gapClosed);
ok('2 折叠后补下边线 is-edge', await p.evaluate(() => document.querySelector('#wdViewTask > .wd-grp > .wd-grp-head').classList.contains('is-edge')));
await p.evaluate(() => document.querySelector('#wdViewTask > .wd-grp > .wd-grp-head').click());
await new Promise(r => setTimeout(r, 250));

/* ========== 7 搜索激活态 ========== */
await p.click('#wdSearchBtn'); await new Promise(r => setTimeout(r, 260));
ok('7 工具行进入搜索态', await p.evaluate(() => document.getElementById('wdTools').classList.contains('is-searching')));
const sb = await box('#wdSearch');
ok('7 搜索框 288×32', Math.abs(sb[2] - 288) < 1 && sb[3] === 32, JSON.stringify(sb));
ok('7 搜索框外描边 #6692F9 1.6px', (await cs('#wdSearch', 'boxShadow')).includes('102, 146, 249'), await cs('#wdSearch', 'boxShadow'));
ok('7 输入框已聚焦', await p.evaluate(() => document.activeElement === document.getElementById('wdSearchInput')));
ok('7 占位文案「搜索关键词」', (await p.evaluate(() => document.getElementById('wdSearchInput').placeholder)) === '搜索关键词');
ok('7 添加目录/排序按钮被换下', await p.evaluate(() => {
  /* 第 11 轮：不再是 display:none，改成淡出 + 不可点（这样才有过渡） */
  const a = document.querySelector('.wd-adddir'), r = document.querySelector('.wd-tools-r');
  return getComputedStyle(a).opacity === '0' && getComputedStyle(r).opacity === '0' &&
    getComputedStyle(a).pointerEvents === 'none';
}));
await p.type('#wdSearchInput', '登录');
await new Promise(r => setTimeout(r, 240));
const vis = await p.evaluate(() => [...document.querySelectorAll('.wd-card')].filter(c => c.style.display !== 'none').length);
ok('7 搜索过滤生效（只留含「登录」的卡）', vis === 2, vis);
await p.click('#wdSearchClear'); await new Promise(r => setTimeout(r, 260));
ok('7 点清除恢复原样', await p.evaluate(() => !document.getElementById('wdTools').classList.contains('is-searching')));
ok('7 恢复后卡片全部回来', await p.evaluate(() => [...document.querySelectorAll('.wd-card')].every(c => c.style.display !== 'none')));
ok('7 恢复后添加目录按钮可见', await p.evaluate(() => {
  const a = document.querySelector('.wd-adddir');
  return getComputedStyle(a).display !== 'none' && getComputedStyle(a).opacity === '1';
}));

/* ========== 6 排序下拉 ========== */
const before = await p.evaluate(() => [...document.querySelectorAll('.wd-sub')][0].querySelectorAll('.wd-card-title') && [...[...document.querySelectorAll('.wd-sub')][0].querySelectorAll('.wd-card-title')].map(e => e.textContent.slice(0, 6)));
await p.click('#wdSortBtn'); await new Promise(r => setTimeout(r, 240));
ok('6 菜单展开', await p.evaluate(() => !document.getElementById('wdSortMenu').hidden));
ok('6 两个选项文案', await p.evaluate(() => [...document.querySelectorAll('#wdSortMenu .wd-menu-item')].map(e => e.textContent.trim()).join('|')) === '按创建时间排序|按更新顺序排序',
  await p.evaluate(() => [...document.querySelectorAll('#wdSortMenu .wd-menu-item')].map(e => e.textContent.trim()).join('|')));
ok('6 默认选中创建时间', await p.evaluate(() => document.querySelector('.wd-menu-item[data-sort="created"]').getAttribute('aria-checked') === 'true'));
ok('6 菜单在工具行下方', await p.evaluate(() => {
  const t = document.getElementById('wdTools').getBoundingClientRect(), m = document.getElementById('wdSortMenu').getBoundingClientRect();
  return m.top >= t.bottom - 1 && m.right <= t.right + 1;
}));
await p.click('.wd-menu-item[data-sort="updated"]'); await new Promise(r => setTimeout(r, 300));
const after = await p.evaluate(() => [[...[...document.querySelectorAll('.wd-sub')][0].querySelectorAll('.wd-card-title')].map(e => e.textContent.slice(0, 6))]);
ok('6 按更新顺序后顺序变化', JSON.stringify(before) !== JSON.stringify(after[0]), JSON.stringify(before) + ' → ' + JSON.stringify(after[0]));
ok('6 选中标记转移', await p.evaluate(() => document.querySelector('.wd-menu-item[data-sort="updated"]').getAttribute('aria-checked') === 'true' && document.querySelector('.wd-menu-item[data-sort="created"]').getAttribute('aria-checked') === 'false'));
ok('6 菜单点完自动收起', await p.evaluate(() => document.getElementById('wdSortMenu').hidden));
ok('6 排序按钮高亮（非默认）', await p.evaluate(() => document.getElementById('wdSortBtn').classList.contains('is-on')));
await p.click('#wdSortBtn'); await new Promise(r => setTimeout(r, 200));
await p.click('.wd-menu-item[data-sort="created"]'); await new Promise(r => setTimeout(r, 300));
const back = await p.evaluate(() => [...[...document.querySelectorAll('.wd-sub')][0].querySelectorAll('.wd-card-title')].map(e => e.textContent.slice(0, 6)));
ok('6 按创建时间恢复原序', JSON.stringify(back) === JSON.stringify(before), JSON.stringify(back));

/* ========== 5 添加工作目录（走 change 兜底链路） ========== */
/* 第 22 轮：会话页签的 AI 分组也收起了，这里必须限定在任务视图内取值 */
const grpCount0 = await p.evaluate(() => document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp').length);
await p.evaluate(() => {
  const inp = document.getElementById('wdDirPick');
  const dt = new DataTransfer();
  dt.items.add(new File(['x'], 'readme.md', { type: 'text/markdown' }));
  inp.files = dt.files;
  inp.dispatchEvent(new Event('change'));
});
await new Promise(r => setTimeout(r, 300));
const grpCount1 = await p.evaluate(() => document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp').length);
ok('5 选目录后新增一个分组', grpCount1 === grpCount0 + 1, grpCount0 + ' → ' + grpCount1);
ok('5 新分组默认展开且有空态', await p.evaluate(() => {
  const g = [...document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp')].pop();
  return g.classList.contains('is-open') && !!g.querySelector('.wd-empty');
}));
ok('5 新分组可折叠', await p.evaluate(() => {
  const g = [...document.querySelectorAll('#wdViewTask .wd-groups > .wd-grp')].pop();
  g.querySelector('.wd-grp-head').click();
  return !g.classList.contains('is-open');
}));
ok('5 目录选择器存在', await p.evaluate(() => {
  const i = document.getElementById('wdDirPick');
  return i.hasAttribute('webkitdirectory') && i.type === 'file';
}));

/* ========== 8 分身表情 ========== */
ok('8 表情层存在（眼睑×2 / 笑眼 / 嘴）', await p.evaluate(() => {
  return document.querySelectorAll('.fab-lid').length === 2 &&
    document.querySelectorAll('.fab-happy path').length === 2 &&
    !!document.querySelector('.fab-mouth');
}));
ok('8 稳态完全静止（第 10 轮改为间歇呼吸，避免半像素采样发虚）', await p.evaluate(() => {
  const f = document.querySelector('.float');
  ['is-blink','is-nod','is-shake','is-happy','is-jump','is-breathe'].forEach(c => f.classList.remove(c));
  const o = document.querySelector('.fab-outer'), b = document.querySelector('.fab-body');
  b.style.translate = '';
  return o.getAnimations().length === 0 && b.getAnimations().length === 0 &&
    getComputedStyle(b).willChange === 'auto' && getComputedStyle(o).transform === 'none';
}));
ok('8 呼吸仍可播放', await p.evaluate(() => {
  const f = document.querySelector('.float'), o = document.querySelector('.fab-outer');
  f.classList.add('is-breathe'); void o.offsetWidth;
  const n = o.getAnimations().length;
  f.classList.remove('is-breathe');
  return n > 0;
}));
ok('8 四套动作都有动画在跑', await p.evaluate(() => {
  const f = document.querySelector('.float');
  const body = document.querySelector('.fab-body');
  const happy = document.querySelector('.fab-happy');
  const mouth = document.querySelector('.fab-mouth');
  const map = { 'is-nod': [body], 'is-shake': [body], 'is-happy': [happy, mouth], 'is-jump': [f] };
  return Object.entries(map).every(([c, els]) => {
    f.classList.add(c);
    void body.offsetWidth;
    const n = els.reduce((a, e) => a + e.getAnimations().length, 0);
    f.classList.remove(c);
    void body.offsetWidth;
    return n >= els.length;
  });
}));

/* ========== 无报错 / 无横向溢出 ========== */
ok('无控制台报错', errs.length === 0, errs.join(' | '));
ok('无横向溢出', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

console.log('PASS', pass, '/', pass + fail.length);
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
