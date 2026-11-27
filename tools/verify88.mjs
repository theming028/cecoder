/* 第 88 轮验收：UI 设计工序 · 第 1 / 2 步（稿 4138:56968）
   页签下方内容区：顶部标题行 / 主卡 1024×478（卡头 78 + 5 张 234×112 设计系统卡 + 生成设置）
   底栏 tp-foot（复用）主键「下一步，输入设计资产」 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1920, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-ui.html', { waitUntil: 'load' });
await wait(300);
const menu = await p.$('.menu-btn');
if (menu) { await menu.click(); await wait(500); }

const g = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const cs = e => getComputedStyle(e);
  const col = q('.ug-col'), top = q('.ug-top'), card = q('.ug-card'), ch = q('.ug-ch'), sys = q('.ug-sys');
  const cb = col.getBoundingClientRect(), sb = sys.getBoundingClientRect();
  const cards = [...document.querySelectorAll('.ug-scard')].map(c => {
    const r = c.getBoundingClientRect();
    return {
      name: c.querySelector('.ug-sname').textContent,
      on: c.classList.contains('is-on'),
      rel: [Math.round(r.x - sb.x), Math.round(r.y - sb.y)],
      box: [Math.round(r.width), Math.round(r.height)],
      bg: cs(c).backgroundColor, sh: cs(c).boxShadow,
      nCol: cs(c.querySelector('.ug-sname')).color, nFw: cs(c.querySelector('.ug-sname')).fontWeight, nFs: cs(c.querySelector('.ug-sname')).fontSize,
      dCol: cs(c.querySelector('.ug-sdesc')).color, dFs: cs(c.querySelector('.ug-sdesc')).fontSize + '/' + cs(c.querySelector('.ug-sdesc')).lineHeight,
      ico: box(c.querySelector('.ug-sico')).slice(2), icoBg: cs(c.querySelector('.ug-sico')).backgroundColor, icoR: cs(c.querySelector('.ug-sico')).borderRadius,
      acts: [...c.querySelectorAll('.ug-sbtn')].map(x => ({ t: x.textContent.trim(), w: Math.round(x.getBoundingClientRect().width), h: Math.round(x.getBoundingClientRect().height), sh: cs(x).boxShadow, col: cs(x).color })),
    };
  });
  const sep = q('.ug-sep'), set = q('.ug-set'), opts = q('.ug-opts');
  const optL = q('.ug-opt-l'), cbx = [...document.querySelectorAll('.ug-cbx')], rd = [...document.querySelectorAll('.ug-rd')];
  const foot = q('.tp-foot'), prim = q('#ugNext');
  const cbb = cb, ftb = foot.getBoundingClientRect();
  return {
    colW: Math.round(cb.width), colX: Math.round(cb.x),
    top: box(top), titleFs: cs(q('.ug-title')).fontSize + '/' + cs(q('.ug-title')).fontWeight + '/' + cs(q('.ug-title')).lineHeight,
    exit: box(q('.ug-exit')), exitSh: cs(q('.ug-exit')).boxShadow,
    card: box(card), ch: box(ch), chBg: cs(ch).backgroundColor, chSh: cs(ch).boxShadow,
    ct: cs(q('.ug-ct')).fontSize + '/' + cs(q('.ug-ct')).fontWeight, cs_: cs(q('.ug-cs')).fontSize + '/' + cs(q('.ug-cs')).color,
    step: box(q('.ug-step')), stepR: cs(q('.ug-step')).borderRadius, stepBg: cs(q('.ug-step')).backgroundColor,
    cards,
    sep: [box(sep)[3], box(sep)[1] - box(card)[1], cs(sep).backgroundColor],
    set: [box(set)[1] - box(card)[1], cs(set).fontSize + '/' + cs(set).fontWeight],
    opts: [box(opts)[1] - box(card)[1], box(opts)[3]],
    optLx: Math.round(optL.getBoundingClientRect().x - cb.x),
    cbx: cbx.map(l => ({ on: l.querySelector('input').checked, boxBg: cs(l.querySelector('.ug-box')).backgroundColor, w: Math.round(l.getBoundingClientRect().width) })),
    rd: rd.map(l => ({ on: l.querySelector('input').checked, sh: cs(l.querySelector('.ug-dot')).boxShadow, w: Math.round(l.getBoundingClientRect().width) })),
    foot: [Math.round(ftb.height), Math.round(ftb.y), Math.round(ftb.width), cs(foot).boxShadow, cs(foot).backgroundColor],
    prim: { t: prim.textContent.trim(), h: Math.round(prim.getBoundingClientRect().height), bg: cs(prim).backgroundColor, w: Math.round(prim.getBoundingClientRect().width), cx: Math.round(prim.getBoundingClientRect().x + prim.getBoundingClientRect().width / 2), footCx: Math.round(ftb.x + ftb.width / 2) },
    wrapOver: q('.ug-wrap').scrollHeight > q('.ug-wrap').clientHeight,
  };
});

/* ---------- A 内容区骨架（对照稿 1024×530） ---------- */
ok('A1 中栏 1134 时内容列宽 1024（稿面宽）', g.colW === 1024, g.colW);
ok('A2 顶部行 640×32 靠右、标题 20/500/28', g.top[2] === 640 && g.top[3] === 32 && g.titleFs === '20px/500/28px' && Math.abs((g.colX + 1024) - (g.top[0] + 640)) < 1, JSON.stringify(g.top) + ' ' + g.titleFs);
ok('A3 「退出引导，返回一页式」172×32、白底 1px #E5E5E5', g.exit[2] === 172 && g.exit[3] === 32 && /rgb\(229, 229, 229\) 0px 0px 0px 1px inset/.test(g.exitSh), JSON.stringify(g.exit) + ' ' + g.exitSh);
ok('A4 主卡 1024×478、白底 1px #E5E5E5', g.card[2] === 1024 && g.card[3] === 478, JSON.stringify(g.card));
ok('A5 卡头 78 高、#F7F7F7 底、左右上与底边各 1px #E5E5E5（稿矩形 569 自带三边描边）', g.ch[3] === 78 && g.chBg === 'rgb(247, 247, 247)' && /rgb\(229, 229, 229\) 1px 0px 0px 0px inset/.test(g.chSh) && /rgb\(229, 229, 229\) -1px 0px 0px 0px inset/.test(g.chSh) && /rgb\(229, 229, 229\) 0px 1px 0px 0px inset/.test(g.chSh) && /rgb\(229, 229, 229\) 0px -1px 0px 0px inset/.test(g.chSh), g.ch[3] + ' ' + g.chBg + ' ' + g.chSh);
ok('A6 卡头标题 16/500、副标题 12/400 #6B6B6B', g.ct === '16px/500' && g.cs_ === '12px/rgb(107, 107, 107)', g.ct + ' ' + g.cs_);
ok('A7 「第 1 / 2 步」90×28 药丸（radius 32、白底 1px #E5E5E5）', g.step[2] === 90 && g.step[3] === 28 && g.stepR === '32px' && g.stepBg === 'rgb(255, 255, 255)', JSON.stringify(g.step) + ' ' + g.stepR);

/* ---------- B 设计系统卡 ---------- */
ok('B1 五张卡 234×112，位置 (0,0)(250,0)(500,0)(750,0)(0,128)', g.cards.length === 5 && g.cards.every(c => c.box[0] === 234 && c.box[1] === 112) && JSON.stringify(g.cards.map(c => c.rel)) === JSON.stringify([[0, 0], [250, 0], [500, 0], [750, 0], [0, 128]]), JSON.stringify(g.cards.map(c => c.rel)));
ok('B2 卡片顺序 Cecoder / Arco / Ant / TDesign / Semi（稿面第 2 行只放 Semi）', JSON.stringify(g.cards.map(c => c.name)) === JSON.stringify(['Cecoder 设计系统', 'Arco Design', 'Ant Design', 'TDesign', 'Semi Design']), JSON.stringify(g.cards.map(c => c.name)));
const on = g.cards[0], off = g.cards[1];
ok('B3 选中卡：#F5F8FF 底 + 1.6px 主色 #3770F7 描边（稿矩形 581），名称主色、描述 #1F1F1F', on.on && on.bg === 'rgb(245, 248, 255)' && /rgb\(55, 112, 247\) 0px 0px 0px 1.6px inset/.test(on.sh) && on.nCol === 'rgb(55, 112, 247)' && on.dCol === 'rgb(31, 31, 31)', on.bg + ' ' + on.sh);
ok('B4 未选中卡：白底 1px #EEEEEE、名称 #1F1F1F、描述 #868686 12/16', !off.on && off.bg === 'rgb(255, 255, 255)' && /rgb\(238, 238, 238\) 0px 0px 0px 1px inset/.test(off.sh) && off.nCol === 'rgb(31, 31, 31)' && off.dCol === 'rgb(134, 134, 134)' && off.dFs === '12px/16px', off.sh);
ok('B5 选中卡按钮「已选」68×28 蓝字 + 1px #DAE4FE、「预览」50×28', on.acts[0].t.replace(/\s/g, '') === '已选' && on.acts[0].w === 68 && on.acts[0].h === 28 && on.acts[0].col === 'rgb(55, 112, 247)' && /rgb\(218, 228, 254\)/.test(on.acts[0].sh) && on.acts[1].t === '预览' && on.acts[1].w === 50, JSON.stringify(on.acts));
ok('B6 未选中卡「选用」50×28 + 1px #E5E5E5', off.acts[0].t === '选用' && off.acts[0].w === 50 && /rgb\(229, 229, 229\)/.test(off.acts[0].sh), JSON.stringify(off.acts));
ok('B7 图标 40×40 radius 4，五张底色 白/#F1EAFF/#F7EDD9/#D6EBFF/#D5F7DB',
  JSON.stringify(g.cards.map(c => c.icoBg)) === JSON.stringify(['rgb(255, 255, 255)', 'rgb(241, 234, 255)', 'rgb(214, 235, 255)', 'rgb(213, 247, 219)', 'rgb(247, 237, 217)']) && g.cards.every(c => c.ico[0] === 40 && c.ico[1] === 40 && c.icoR === '4px'),
  JSON.stringify(g.cards.map(c => c.icoBg)));

await p.hover('.ug-scard:nth-child(2)');
await wait(320);
const hov = await p.evaluate(() => {
  const c = document.querySelectorAll('.ug-scard')[1];
  return { bg: getComputedStyle(c).backgroundColor, on: c.classList.contains('is-on') };
});
ok('B8 未选中卡 hover 浅灰底 #FAFAFA（选中卡不受影响）', !hov.on && hov.bg === 'rgb(250, 250, 250)', JSON.stringify(hov));
await p.mouse.move(0, 0); await wait(200);

/* ---------- C 生成设置 ---------- */
ok('C1 分隔线 1px #EEEEEE 位于卡体 362', g.sep[0] === 1 && g.sep[1] === 362 && g.sep[2] === 'rgb(238, 238, 238)', JSON.stringify(g.sep));
ok('C2 「生成设置」16/500，位于卡体 386', g.set[0] === 386 && g.set[1] === '16px/500', JSON.stringify(g.set));
ok('C3 设置行位于卡体 422、高 24', g.opts[0] === 422 && g.opts[1] === 24, JSON.stringify(g.opts));
ok('C4 复选框「网页端」选中（蓝底）、「手机端」未选（白底），各 62 宽', g.cbx[0].on && g.cbx[0].boxBg === 'rgb(55, 112, 247)' && !g.cbx[1].on && g.cbx[1].boxBg === 'rgb(255, 255, 255)' && g.cbx[0].w === 62 && g.cbx[1].w === 62, JSON.stringify(g.cbx));
ok('C5 单选「1440px」选中（蓝圈）、「1920px」未选（文字完整，宽 60~70）', g.rd[0].on && /rgb\(55, 112, 247\)/.test(g.rd[0].sh) && !g.rd[1].on && g.rd[0].w >= 60 && g.rd[0].w <= 70, JSON.stringify(g.rd));

/* ---------- D 底栏 tp-foot ---------- */
ok('D1 tp-foot 56 高、白底、顶部与左侧各 1px #EBECED（左线不断）、满中栏宽', g.foot[0] === 56 && g.foot[2] === 1134 && g.foot[4] === 'rgb(255, 255, 255)' && /rgb\(235, 236, 237\) 0px 1px 0px 0px inset/.test(g.foot[3]) && /rgb\(235, 236, 237\) 1px 0px 0px 0px inset/.test(g.foot[3]), JSON.stringify(g.foot));
ok('D2 主键「下一步，输入设计资产」36 高、主色、居中', g.prim.t === '下一步，输入设计资产' && g.prim.h === 36 && g.prim.bg === 'rgb(55, 112, 247)' && Math.abs(g.prim.cx - g.prim.footCx) <= 1, JSON.stringify(g.prim));

/* ---------- E 交互 ---------- */
await p.evaluate(() => document.querySelectorAll('.ug-scard')[1].querySelector('[data-pick]').click());
await wait(200);
const e1 = await p.evaluate(() => [...document.querySelectorAll('.ug-scard')].map(c => c.classList.contains('is-on') + ':' + c.querySelector('[data-pick]').textContent.trim()));
ok('E1 点 Arco「选用」→ 单选迁移，按钮文案互换（已选/选用）', e1[1] === 'true:已选' && e1[0] === 'false:选用', JSON.stringify(e1));
await p.evaluate(() => document.querySelectorAll('.ug-cbx')[1].click());
await p.evaluate(() => document.querySelectorAll('.ug-rd')[1].click());
await wait(150);
const e2 = await p.evaluate(() => ({ cb: [...document.querySelectorAll('.ug-cbx input')].map(i => i.checked), rd: [...document.querySelectorAll('.ug-rd input')].map(i => i.checked) }));
ok('E2 复选「手机端」与单选「1920px」可切换', e2.cb[1] === true && e2.rd[1] === true && e2.rd[0] === false, JSON.stringify(e2));
await p.click('#ugNext'); await wait(200);
const e3 = await p.evaluate(() => { const t = [...document.querySelectorAll('.semi-toast')]; return t.length ? t[t.length - 1].textContent : ''; });
ok('E3 点「下一步」有反馈提示', /输入设计资产/.test(e3), e3);
await p.evaluate(() => { const c = document.querySelectorAll('.ug-scard')[0]; c.querySelector('[data-pick]').click(); });
await wait(200);
const e4 = await p.evaluate(() => [...document.querySelectorAll('.ug-scard')].map(c => c.classList.contains('is-on') + ':' + c.querySelector('[data-pick]').textContent.trim())[0]);
ok('E4 再选回 Cecoder → 仍是「已选」，无重复选中', e4 === 'true:已选', e4);

/* ---------- F 响应式 ---------- */
const resp = [];
for (const w of [1152, 1280, 1440, 1920]) {
  await p.setViewport({ width: w, height: 900 });
  await wait(320);
  resp.push(await p.evaluate(() => {
    const wrap = document.querySelector('.ug-wrap');
    const cards = [...document.querySelectorAll('.ug-scard')];
    const cb = wrap.getBoundingClientRect();
    return {
      w: innerWidth, over: document.documentElement.scrollWidth - innerWidth,
      allIn: cards.every(c => { const r = c.getBoundingClientRect(); return r.left >= cb.left - 1 && r.right <= cb.right + 1; }),
      cardW: Math.round(cards[0].getBoundingClientRect().width),
      footH: Math.round(document.querySelector('.tp-foot').getBoundingClientRect().height),
      topH: Math.round(document.querySelector('.ug-top').getBoundingClientRect().height),
    };
  }));
}
ok('F1 1152~1920 四档：无横向溢出、卡片不出容器、底栏 56、顶行不溢出', resp.every(r => r.over <= 0 && r.allIn && r.footH === 56 && r.topH <= 66), JSON.stringify(resp));

ok('G1 无 console / pageerror', p.__e.length === 0, JSON.stringify(p.__e));
await b.close();
console.log('\n第 88 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) console.log('FAIL:\n - ' + fail.join('\n - '));
