/* 第 49 轮验收：默认折叠 / 底部固定 / 代码库路径单行 / 文本域真文字 / 步骤卡 hover / 页签描边 /
   滚动条位置 / 文本域焦点 / 本地文件选择 / 文字说明弹窗 */
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

/* ============ A 两处容器默认折叠 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const a = await p.evaluate(() => {
    const h = s => Math.round(document.querySelector(s).getBoundingClientRect().height);
    const cs = s => getComputedStyle(document.querySelector(s));
    return {
      files: document.querySelector('.tp-files').className, ref: document.querySelector('.tp-ref').className,
      filesH: h('.tp-files'), refH: h('.tp-ref'),
      filesIn: cs('.tp-files-in').display, refIn: cs('.tp-ref-in').display,
      filesCaret: cs('.tp-files .tp-sect-caret').transform, refCaret: cs('.tp-ref .tp-sect-caret').transform,
      filesAria: document.querySelector('.tp-files [data-tp-toggle]').getAttribute('aria-expanded'),
      refAria: document.querySelector('.tp-ref [data-tp-toggle]').getAttribute('aria-expanded'),
    };
  });
  ok('A1 文件输入 / 参考代码源 默认折叠（38 高、内容隐藏、箭头朝右、aria=false）',
    /is-closed/.test(a.files) && /is-closed/.test(a.ref) && a.filesH === 38 && a.refH === 38 && a.filesIn === 'none' && a.refIn === 'none'
    && /matrix\(0, -1, 1, 0/.test(a.filesCaret) && /matrix\(0, -1, 1, 0/.test(a.refCaret) && a.filesAria === 'false' && a.refAria === 'false',
    JSON.stringify(a));

  await p.tap('.tp-files [data-tp-toggle]'); await wait(250);
  await p.tap('.tp-ref [data-tp-toggle]'); await wait(300);
  const a2 = await p.evaluate(() => {
    const h = s => Math.round(document.querySelector(s).getBoundingClientRect().height);
    return { filesH: h('.tp-files'), refH: h('.tp-ref'), filesAria: document.querySelector('.tp-files [data-tp-toggle]').getAttribute('aria-expanded') };
  });
  ok('A2 点开后再合上：状态可逆（展开后高度明显变大、aria=true）', a2.filesH > 200 && a2.refH > 300 && a2.filesAria === 'true', JSON.stringify(a2));
  ok('A3 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ B 底部始终贴底（多视口） ============ */
{
  const rows = [];
  for (const [w, h] of [[1440, 900], [1440, 1600], [1280, 720], [1920, 1080]]) {
    const p = await mk('cecoder-task.html?id=0', w, h);
    rows.push(await p.evaluate(() => {
      const wrap = document.querySelector('.tp-wrap').getBoundingClientRect();
      const foot = document.querySelector('.tp-foot').getBoundingClientRect();
      return { w: innerWidth, h: innerHeight, gap: Math.round(wrap.bottom - foot.bottom) };
    }));
    await p.close();
  }
  ok('B1 四种视口下底部按钮条都贴齐容器底（gap = 0）', rows.every(r => r.gap === 0), JSON.stringify(rows));
}

/* ============ C 代码库路径 = 同一对象的单一状态 ============ */
{
  const p = await mk('cecoder-task.html?id=0', 1440, 1600);
  await p.tap('.tp-ref [data-tp-toggle]'); await wait(350);
  const c = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const rel = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { x: Math.round(r.left - pm.left), y: Math.round(r.top - pm.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const keys = [...document.querySelectorAll('.tp-repo-in .tp-fld-k')].map(e => e.textContent.trim());
    const btn = document.querySelector('.tp-repo-in .tp-btn28');
    return {
      keys, rows: document.querySelectorAll('.tp-repo-in .tp-row').length,
      btn: rel('.tp-repo-in .tp-btn28'), btnTxt: btn.textContent.trim(),
      link: document.querySelector('.tp-repo-in .tp-pick-link') ? document.querySelector('.tp-repo-in .tp-pick-link').textContent.trim() : null,
    };
  });
  ok('C1 只有一行「代码库路径」（不再是空态 + 已选两行并排）', c.keys.filter(k => k === '代码库路径').length === 1 && c.rows === 3, JSON.stringify([c.keys, c.rows]));
  ok('C2 那一行是「已选」态：文件夹按钮带路径 + 重新选择链接', /Users\/you\/project-repo/.test(c.btnTxt) && c.btn.h === 28 && c.link === '重新选择', JSON.stringify([c.btnTxt, c.btn, c.link]));
  await p.close();
}

/* ============ D 文本域放真文字 / 焦点无 outline ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const d = await p.evaluate(() => {
    const ta = document.querySelector('.tp-textarea');
    return { val: ta.value, ph: ta.getAttribute('placeholder'), color: getComputedStyle(ta).color };
  });
  ok('D1 目标文本域里是真文字（不是 placeholder），且不再挂 placeholder', d.val.length > 40 && /背景：/.test(d.val) && d.ph === null && d.color === 'rgb(31, 31, 31)', JSON.stringify([d.val.slice(0, 12), d.ph, d.color]));

  await p.click('.tp-textarea'); await wait(200);
  const f = await p.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.tp-textarea'));
    return { outline: cs.outlineStyle, width: cs.outlineWidth, border: cs.borderTopColor, active: document.activeElement === document.querySelector('.tp-textarea') };
  });
  ok('D2 焦点态没有 outline（描边仍是 #EEEEEE）', f.active && f.outline === 'none' && f.border === 'rgb(238, 238, 238)', JSON.stringify(f));
  await p.close();
}

/* ============ E 步骤卡：hover 白底、标题默认中粗 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const e0 = await p.evaluate(() => {
    const s = document.querySelectorAll('.tp-step')[1];
    return { bg: getComputedStyle(s).backgroundColor, w1: getComputedStyle(document.querySelectorAll('.tp-step-txt b')[0]).fontWeight, w2: getComputedStyle(document.querySelectorAll('.tp-step-txt b')[1]).fontWeight };
  });
  ok('E1 标题默认就是中粗（两张卡都 500）', e0.w1 === '500' && e0.w2 === '500', JSON.stringify(e0));
  await p.hover('.tp-step:nth-of-type(2)'); await wait(220);
  const e1 = await p.evaluate(() => getComputedStyle(document.querySelectorAll('.tp-step')[1]).backgroundColor);
  ok('E2 未选中步骤卡 hover 底色变白', e1 === 'rgb(255, 255, 255)', e1);
  await p.hover('.tp-step.is-on'); await wait(220);
  const e2 = await p.evaluate(() => getComputedStyle(document.querySelector('.tp-step.is-on')).backgroundColor);
  ok('E3 当前步骤 hover 仍是浅蓝 #F5F8FF（不被白底覆盖）', e2 === 'rgb(245, 248, 255)', e2);
  await p.close();
}

/* ============ F 选中页签的按钮描边 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const f = await p.evaluate(() => {
    const on = document.querySelector('.tk-tab.is-on');
    const cs = getComputedStyle(on);
    return { shadow: cs.boxShadow, h: Math.round(on.getBoundingClientRect().height), radius: cs.borderRadius, bg: cs.backgroundColor };
  });
  ok('F1 选中页签是白底 + 1px #EEEEEE 内描边 + r4、28 高（按钮形态）', /238, 238, 238/.test(f.shadow) && /inset/.test(f.shadow) && f.bg === 'rgb(255, 255, 255)' && f.h === 28 && f.radius === '4px', JSON.stringify(f));
  await p.close();
}

/* ============ G 滚动条落在 .tp-wrap（内容层不再自滚） ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  await p.tap('.tp-files [data-tp-toggle]'); await wait(250);
  await p.tap('.tp-ref [data-tp-toggle]'); await wait(350);
  const g = await p.evaluate(() => {
    const inn = document.querySelector('.tp-body-in');
    const wrap = document.querySelector('.tp-wrap');
    return {
      innOverflow: getComputedStyle(inn).overflowY,
      wrapOverflow: getComputedStyle(wrap).overflowY,
      innScrolls: inn.scrollHeight > inn.clientHeight + 1,
      wrapScrolls: wrap.scrollHeight > wrap.clientHeight + 1,
      bodyFlex: getComputedStyle(document.querySelector('.tp-body')).flex,
    };
  });
  ok('G1 内容层不自滚（overflow visible、主体 flex: 0 0 auto），滚动条在 .tp-wrap', g.innOverflow === 'visible' && g.wrapOverflow === 'auto' && g.innScrolls === false && g.wrapScrolls === true && /^0 0 auto/.test(g.bodyFlex), JSON.stringify(g));
  ok('G2 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ H 上传本地资料 → 系统文件选择窗 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  await p.tap('.tp-files [data-tp-toggle]'); await wait(300);
  const hasInput = await p.evaluate(() => {
    const i = document.getElementById('tpFileInput');
    return i ? { type: i.type, multiple: i.multiple, hidden: i.hidden } : null;
  });
  ok('H1 页面里有一个隐藏的 file 输入（multiple）', hasInput && hasInput.type === 'file' && hasInput.multiple === true && hasInput.hidden === true, JSON.stringify(hasInput));

  let chooser = null;
  try {
    const [fc] = await Promise.all([p.waitForFileChooser({ timeout: 2500 }), p.click('.tp-file-btn[data-file-pick]')]);
    chooser = !!fc;
  } catch (err) { chooser = false; }
  ok('H2 点「上传本地资料」弹出系统文件选择窗', chooser === true, String(chooser));
  await p.close();
}

/* ============ I 补充 / 更改文字说明 → 480 宽弹窗 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  await p.tap('.tp-files [data-tp-toggle]'); await wait(300);
  const i0 = await p.evaluate(() => {
    const open = document.getElementById('tpNoteModal').classList.contains('is-open');
    return { open, display: getComputedStyle(document.getElementById('tpNoteModal')).display };
  });
  ok('I1 弹窗默认关闭', i0.open === false && i0.display === 'none', JSON.stringify(i0));

  await p.tap('.tp-file-row .tp-mini[data-tp-note]'); await wait(320);
  const i1 = await p.evaluate(() => {
    const m = document.getElementById('tpNoteModal');
    const d = document.querySelector('.tp-dlg');
    const r = d.getBoundingClientRect();
    return {
      open: m.classList.contains('is-open'), aria: m.getAttribute('aria-hidden'),
      w: Math.round(r.width), title: document.getElementById('tpNoteTitle').textContent.trim(),
      ta: !!document.querySelector('.tp-dlg-ta'), taH: Math.round(document.querySelector('.tp-dlg-ta').getBoundingClientRect().height),
      focused: document.activeElement === document.querySelector('.tp-dlg-ta'),
      saved: !!document.getElementById('tpNoteSave'),
    };
  });
  ok('I2 点「补充文字说明」弹出 480 宽弹窗（标题随之、含多行文本框、打开即聚焦）',
    i1.open === true && i1.aria === 'false' && i1.w === 480 && i1.title === '补充文字说明' && i1.ta === true && i1.taH > 100 && i1.focused === true, JSON.stringify(i1));

  await p.type('.tp-dlg-ta', '变更范围以登录失败分支为主，接口契约不变。');
  await wait(150);
  await p.tap('#tpNoteSave'); await wait(300);
  const i3 = await p.evaluate(() => {
    const m = document.getElementById('tpNoteModal');
    const btn = document.querySelector('.tp-file-row .tp-mini[data-tp-note]');
    return { open: m.classList.contains('is-open'), aria: m.getAttribute('aria-hidden'), val: btn.getAttribute('data-note-value'), label: btn.textContent.trim() };
  });
  ok('I3 保存后关闭弹窗，内容留在该行按钮上（标签转「更改文字说明」）', i3.open === false && i3.aria === 'true' && /登录失败分支/.test(i3.val || '') && i3.label === '更改文字说明', JSON.stringify(i3));

  await p.tap('.tp-mini[data-tp-note="更改文字说明"]'); await wait(300);
  const i4 = await p.evaluate(() => ({ title: document.getElementById('tpNoteTitle').textContent.trim(), val: document.querySelector('.tp-dlg-ta').value }));
  ok('I4 「更改文字说明」打开时带出原内容', i4.title === '更改文字说明' && /登录失败分支/.test(i4.val), JSON.stringify(i4));

  await p.keyboard.press('Escape'); await wait(250);
  const i5 = await p.evaluate(() => document.getElementById('tpNoteModal').classList.contains('is-open'));
  ok('I5 Esc 关闭弹窗', i5 === false, String(i5));
  ok('I6 全程无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ============ J tp-tip 颜色 = 警告橙 #FF7D00 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  await p.tap('.tp-files [data-tp-toggle]'); await wait(300);
  const j = await p.evaluate(() => {
    const t = document.querySelector('.tp-tip');
    return { color: getComputedStyle(t).color, txt: t.textContent.trim().slice(0, 6) };
  });
  ok('J1 「建议补充如下资料…」是警告橙 #FF7D00', j.color === 'rgb(255, 125, 0)' && /建议补充/.test(j.txt), JSON.stringify(j));
  await p.close();
}

await b.close();
if (fail.length) { console.log('\n失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
console.log('\n第 49 轮：' + pass + ' pass / ' + fail.length + ' fail');
process.exit(fail.length ? 1 : 0);
