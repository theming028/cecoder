/* 第 125 轮验收：UI 生成完成页「页面层级和状态」的收齐 / 展开微动效
   要和左侧任务栏（.wd-grp / .wd-caret）同一套手感：
   · 箭头：transform .22s cubic-bezier(.2,.8,.2,1) + opacity .17s，折叠时 rotate(-90deg) scale(.86)；
   · 列表：max-height 320 ↔ 0、opacity 1 ↔ 0、margin-top 4 ↔ 0，.26s 同一条缓动曲线（原来是 hidden 瞬切）；
   · 行为：三个页面组（账密登录 / Gmail 邮箱登录 / 账号恢复页）都走同一条 aria-controls 绑定，
     折叠态用 .is-fold + aria-hidden 表达（display:none 无法过渡）。 */
import puppeteer from 'puppeteer-core';

const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
const EXE = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let pass = 0, fail = 0;
const ok = (label, cond, detail) => {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  << ' + detail : '')); }
};
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: EXE, headless: 'new', args: ['--force-device-scale-factor=1', '--enable-unsafe-swiftshader'] });
const h = await b.newPage();
const errs = [];
h.on('pageerror', e => errs.push(e.message));
h.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await h.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await h.goto('file:///' + BASE + '/cecoder-uidone.html', { waitUntil: 'load' });
await wait(1000);

const read = () => h.evaluate(() => {
  const row = document.getElementById('udTreeHead');
  const ul = document.getElementById('udStates');
  const chev = row.querySelector('.ud-chev-d');
  const c = getComputedStyle(ul);
  return {
    exp: row.getAttribute('aria-expanded'),
    rowFold: row.classList.contains('is-fold'),
    ulFold: ul.classList.contains('is-fold'),
    aria: ul.getAttribute('aria-hidden'),
    height: Math.round(ul.getBoundingClientRect().height),
    op: +c.opacity,
    maxH: c.maxHeight,
    tr: c.transition,
    chev: getComputedStyle(chev).transform,
    chevTr: getComputedStyle(chev).transition
  };
});

/* ---------- A 常态与过渡参数 ---------- */
const A = await read();
ok('A1 默认展开（账密登录 6 条状态可见）', A.exp === 'true' && !A.ulFold && A.height > 100, JSON.stringify([A.exp, A.height]));
ok('A2 箭头过渡曲线与任务栏同一档：transform .22s cubic-bezier(.2,.8,.2,1)',
  /transform 0\.22s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(A.chevTr), A.chevTr.slice(0, 90));
ok('A3 箭头带 opacity .17s（和 .wd-caret 一样有淡切）', /opacity 0\.17s/.test(A.chevTr), A.chevTr.slice(0, 90));
ok('A4 列表过渡 = max-height .26s 同曲线 + opacity .18s',
  /max-height 0\.26s cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/.test(A.tr) && /opacity 0\.18s/.test(A.tr), A.tr.slice(0, 140));
ok('A5 展开态不再用 hidden（否则没法过渡）', A.maxH === '320px' && A.op === 1, JSON.stringify([A.maxH, A.op]));

/* ---------- B 收起：中间态必须在动 ---------- */
await h.click('#udTreeHead');
await wait(90);
const B1 = await read();
ok('B1 收起过程中高度在压缩（0 < h < 原高）', B1.height > 0 && B1.height < A.height, JSON.stringify([B1.height, A.height]));
ok('B2 收起过程中透明度在降（0 < op < 1）', B1.op > 0 && B1.op < 1, String(B1.op));
ok('B3 收起过程中箭头正在转（矩阵不是单位阵也不是终态）', B1.chev !== 'none' && B1.chev !== 'matrix(0, -0.86, 0.86, 0, 0, 0)', B1.chev);
await wait(400);
const B2 = await read();
ok('B4 收起终态：高度 0 / 透明 0 / max-height 0', B2.height === 0 && B2.op === 0 && B2.maxH === '0px', JSON.stringify([B2.height, B2.op, B2.maxH]));
ok('B5 收起终态：is-fold + aria-hidden=true + aria-expanded=false', B2.ulFold && B2.rowFold && B2.aria === 'true' && B2.exp === 'false', JSON.stringify(B2));
ok('B6 收起终态箭头 = rotate(-90deg) scale(.86)', /matrix\(0, -0\.86, 0\.86, 0/.test(B2.chev), B2.chev);

/* ---------- C 再展开 ---------- */
await h.click('#udTreeHead');
await wait(90);
const C1 = await read();
ok('C1 展开过程中高度在长（0 < h < 目标高）', C1.height > 0 && C1.height <= A.height, JSON.stringify([C1.height, A.height]));
await wait(450);
const C2 = await read();
ok('C2 展开终态回到满高 + 全不透明', C2.height === A.height && C2.op === 1, JSON.stringify([C2.height, C2.op]));
ok('C3 展开终态：is-fold 移除 + aria-hidden=false', !C2.ulFold && C2.aria === 'false', JSON.stringify([C2.ulFold, C2.aria]));

/* ---------- D 另外两个页面组同一条动效 ---------- */
const gmail = () => h.evaluate(() => {
  const row = document.getElementById('udPgGmail'), ul = document.getElementById('udPgGmailStates');
  return { exp: row.getAttribute('aria-expanded'), fold: ul.classList.contains('is-fold'), h: Math.round(ul.getBoundingClientRect().height), aria: ul.getAttribute('aria-hidden'), chev: getComputedStyle(row.querySelector('.ud-chev-r')).transform };
});
const D0 = await gmail();
ok('D1 Gmail 组默认收起（is-fold / 高 0 / aria-hidden）', D0.fold && D0.h === 0 && D0.aria === 'true', JSON.stringify(D0));
await h.click('#udPgGmail');
await wait(450);
const D1 = await gmail();
ok('D2 点开：高度撑开、is-fold 移除、箭头转 90°', !D1.fold && D1.h > 0 && D1.aria === 'false' && /matrix\(0, 1, -1, 0|matrix\(0\.0000/.test(D1.chev), JSON.stringify(D1));
await h.click('#udPgGmail');
await wait(450);
const D2 = await gmail();
ok('D3 再点收起回来', D2.fold && D2.h === 0 && D2.aria === 'true' && /0\.86/.test(D2.chev), JSON.stringify(D2));

/* 账号恢复页同样绑上了（第 98 轮那段 hidden 逻辑已合并，不会再一开一合） */
await h.click('#udPgRecover');
await wait(450);
const D3 = await h.evaluate(() => {
  const ul = document.getElementById('udPgRecoverStates');
  return { exp: document.getElementById('udPgRecover').getAttribute('aria-expanded'), h: Math.round(ul.getBoundingClientRect().height), fold: ul.classList.contains('is-fold') };
});
ok('D4 账号恢复页一次点开（没有重复绑定导致又收起）', D3.exp === 'true' && !D3.fold && D3.h > 0, JSON.stringify(D3));

ok('E1 全程无 JS 报错', errs.length === 0, JSON.stringify(errs.slice(0, 3)));

await b.close();
console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
