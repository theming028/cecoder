/* 第 119 轮验收：首页三处调整
   ① 工作台六个 chip 的图标不再只在选中态出现 —— 默认就带图标；svg 里硬编码的 #3770F7
      全部改成 currentColor，未选中跟文字同色、选中跟 .chip.is-active 变蓝。
      图标常显让每个 chip 48 → 63，工具栏需求宽度 852 → 920，因此顺带把首页 chip 的
      padding/gap 收紧一档，并让 820~920 容器宽度那一段收起两个分区标签（否则 1200px
      窗口会把「+ 新建」顶出内容列）；
   ② `.scene` 场景卡从第 118 轮的黑 10% 回滚到白色磨砂（白 85% + 15px blur + 白 70% 描边），
      `sc-htxt` 的 #152443 一并撤掉，回到 #1F1F1F / #868686；
   ③ 输入区背板 `.c-plate` 试过深色毛玻璃，用户看过之后要求回滚 —— 保持原来的中性灰
      （--cds-surface-inset #F2F2F2），压在它上面的次级行文字也不动；
   ④ 任务列表 MiniCloud Files 分组的前两个任务改成 UI 设计 / 代码开发 两道工序。 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 源码层：chip 图标里不许再留硬编码蓝 ---------- */
const homeSrc = fs.readFileSync(BASE + '/src/homeB.html', 'utf8');
ok('A0 chip 图标 svg 不再硬编码 #3770F7（改 currentColor）', !/#3770F7/.test(homeSrc.slice(homeSrc.indexOf('data-chips="process"'), homeSrc.indexOf('data-chips="quick"'))));

const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1', '--enable-unsafe-swiftshader'] });
const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-home.html', { waitUntil: 'load' });
await wait(1000);

/* ---------- A 工作台 chip：图标常显 ---------- */
const A = await h.evaluate(() => {
  const cs = [...document.querySelectorAll('[data-chips="process"] .chip')];
  return cs.map(c => {
    const ico = c.querySelector('.chip-ico');
    const s = getComputedStyle(ico);
    return {
      t: c.textContent.trim(),
      w: Math.round(c.getBoundingClientRect().width),
      disp: s.display,
      col: s.color,
      active: c.classList.contains('is-active'),
      txt: getComputedStyle(c).color
    };
  });
});
ok('A1 六个工作台 chip 都带图标', A.length === 6 && A.every(x => !!x.disp && x.disp !== 'none'), JSON.stringify(A.map(x => x.disp)));
const idle = A.filter(x => !x.active);
ok('A2 未选中的 chip 图标也显示（不再是 0 图标）', idle.length >= 5 && idle.every(x => x.disp !== 'none'), JSON.stringify(idle.map(x => x.disp)));
ok('A3 未选中图标跟文字同色（currentColor，不是品牌蓝/灰）', idle.every(x => x.col === x.txt), JSON.stringify(idle.map(x => [x.col, x.txt])));
ok('A4 图标常显后 chip 宽 63（含图标 14 + 间距 3），六个一致', A.every(x => x.w === 63), JSON.stringify(A.map(x => x.w)));
/* 第 121 轮：选中态反色成蓝底白字，图标跟着变白 */
ok('A5 选中态图标 = 白（蓝底白字时代）', A.filter(x => x.active).every(x => x.col === 'rgb(255, 255, 255)'), JSON.stringify(A.filter(x => x.active).map(x => x.col)));

/* 切换选中：图标跟着变色，宽度不变（不再出现「选中才多出图标」的跳变） */
await h.click('[data-chips="process"] .chip[data-wb="架构"]');
await wait(300);
const A2b = await h.evaluate(() => {
  const cs = [...document.querySelectorAll('[data-chips="process"] .chip')];
  return cs.map(c => ({ t: c.textContent.trim(), w: Math.round(c.getBoundingClientRect().width), col: getComputedStyle(c.querySelector('.chip-ico')).color }));
});
ok('A6 换选「架构」：宽度不变（无 63→66 跳变）', A2b.every(x => x.w === 63), JSON.stringify(A2b.map(x => x.w)));
ok('A7 换选后只有新选中项是「反色」（白图标）', A2b.filter(x => x.col === 'rgb(255, 255, 255)').length === 1 && A2b.find(x => x.t === '架构').col === 'rgb(255, 255, 255)', JSON.stringify(A2b.map(x => [x.t, x.col])));
await h.click('[data-chips="process"] .chip[data-wb="通用"]');
await wait(300);

/* ---------- B 场景卡回白 ---------- */
const B = await h.evaluate(() => {
  const c = getComputedStyle(document.querySelector('.scene'));
  return { bg: c.backgroundColor, bf: c.backdropFilter || c.webkitBackdropFilter || 'none', border: c.borderColor, bw: c.borderWidth };
});
ok('B1 场景卡底色回到白 85%', /rgba\(255, 255, 255, 0\.85\)/.test(B.bg), B.bg);
ok('B2 恢复 15px 毛玻璃', /blur\(15px\)/.test(B.bf), B.bf);
ok('B3 描边白 70%', /rgba\(255, 255, 255, 0\.7\)/.test(B.border) && B.bw === '1px', JSON.stringify([B.border, B.bw]));

const boxy = await h.evaluate(() => { const r = document.querySelector('.scene').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await h.mouse.move(boxy.x, boxy.y);
await wait(400);
const BH = await h.evaluate(() => getComputedStyle(document.querySelector('.scene')).backgroundColor);
ok('B4 悬浮回到白 96%（与白底时期一致）', /rgba\(255, 255, 255, 0\.96\)/.test(BH), BH);
await h.mouse.move(4, 4);
await wait(300);

await h.click('#scIdle');
await wait(520);
const D = await h.evaluate(() => {
  const q = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).color : null; };
  return { state: document.querySelector('.scene').getAttribute('data-state'), ht: q('.sc-htxt'), title: q('.scene-title'), desc: q('.scene-desc') };
});
ok('B5 看板态已展开', D.state === 'open' || D.state === 'collapsed', D.state);
ok('B6 sc-htxt 回到 #1F1F1F（第 118 轮的 #152443 撤掉）', D.ht === 'rgb(31, 31, 31)', D.ht);
ok('B7 标题 #1F1F1F', D.title === 'rgb(31, 31, 31)', D.title);
ok('B8 副标题回到 #868686', D.desc === 'rgb(134, 134, 134)', D.desc);
await h.click('#scFold').catch(() => {});
await wait(300);

/* ---------- C 输入区背板：灰色（深色毛玻璃那次尝试已按用户要求回滚） ---------- */
await h.reload({ waitUntil: 'load' });
await wait(900);
const C = await h.evaluate(() => {
  const pl = document.querySelector('.c-plate');
  const ft = document.querySelector('.c-foot');
  const p = getComputedStyle(pl), f = getComputedStyle(ft);
  const r = pl.getBoundingClientRect(), card = document.querySelector('.c-card').getBoundingClientRect(), foot = ft.getBoundingClientRect();
  return {
    bg: p.backgroundColor, bf: p.backdropFilter || p.webkitBackdropFilter || 'none', sh: p.boxShadow, radius: p.borderRadius,
    footBg: f.backgroundColor, footBf: f.backdropFilter || f.webkitBackdropFilter || 'none',
    env: getComputedStyle(document.querySelector('.c-env')).color,
    hint: getComputedStyle(document.querySelector('.c-hint')).color,
    plateW: Math.round(r.width), cardW: Math.round(card.width), tail: Math.round(foot.bottom - card.bottom)
  };
});
ok('C1 背板是中性灰（第 127 轮改 #EBEDF1）', C.bg === 'rgb(235, 237, 241)', C.bg);
ok('C2 背板不挂毛玻璃', C.bf === 'none', C.bf);
ok('C3 背板没有额外内描边/投影', C.sh === 'none', C.sh);
ok('C4 背板仍是 8px 圆角、比白卡窄 24、下方留 28 的次级行位置', C.radius === '8px' && Math.abs(C.cardW - C.plateW) === 24 && C.tail >= 28, JSON.stringify([C.radius, C.cardW, C.plateW, C.tail]));
ok('C5 .c-foot 自身不铺底（次级行直接坐在背板上）', C.footBg === 'rgba(0, 0, 0, 0)' && C.footBf === 'none', JSON.stringify([C.footBg, C.footBf]));
ok('C6 次级行文字没有残留白色（灰底上的灰字）', !/rgba?\(255, 255, 255/.test(C.env), C.env);
ok('C7 右侧提示没有残留白色', !/rgba?\(255, 255, 255/.test(C.hint), C.hint);

/* ---------- D 工具栏不溢出（图标常显的代价） ---------- */
const widths = [1920, 1440, 1280, 1200, 1100, 1024];
const of = [];
for (const w of widths) {
  await h.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await h.reload({ waitUntil: 'load' });
  await wait(700);
  of.push(await h.evaluate(() => {
    const tb = document.querySelector('.toolbar');
    const chips = [...document.querySelectorAll('.toolbar .chip')].map(c => Math.round(c.getBoundingClientRect().width));
    return { ov: tb.scrollWidth - tb.clientWidth, cw: Math.min(...chips), n: chips.length, h: Math.round(tb.getBoundingClientRect().height) };
  }));
}
ok('D1 各宽度下工具栏都不溢出', of.every(o => o.ov <= 0), JSON.stringify(of.map(o => o.ov)));
ok('D2 chip 不被压缩（最窄 chip 仍 63）', of.every(o => o.cw === 63), JSON.stringify(of.map(o => o.cw)));
ok('D3 极窄两档仍走两排网格（高度 72）', of[4].h === 72 && of[5].h === 72, JSON.stringify(of.map(o => o.h)));

/* ---------- F 任务列表：MiniCloud Files 前两个任务的工序 ---------- */
await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.reload({ waitUntil: 'load' });
await wait(800);
await h.click('[data-wd-tab="任务"]');
await wait(400);
const F = await h.evaluate(() => {
  const grp = [...document.querySelectorAll('#wdViewTask .wd-grp')]
    .find(g => (g.querySelector('.wd-grp-name') || {}).textContent.trim() === 'MiniCloud Files');
  if (!grp) return null;
  return [...grp.querySelectorAll('.wd-card')].slice(0, 2).map(c => ({
    t: (c.querySelector('.wd-card-title') || {}).textContent.trim(),
    sub: (c.querySelector('.wd-card-sub') || {}).textContent.trim()
  }));
});
ok('F1 找到 MiniCloud Files 分组', !!F && F.length === 2, JSON.stringify(F));
ok('F2 第 1 个任务工序 = UI 设计', !!F && /^UI 设计 ·/.test(F[0].sub), F && F[0].sub);
ok('F3 第 2 个任务工序 = 代码开发', !!F && /^代码开发 ·/.test(F[1].sub), F && F[1].sub);

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
