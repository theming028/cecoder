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

async function page(w = 1440, h = 900, dw = 320, open = true) {
  const p = await b.newPage();
  p.__errs = [];
  p.on('pageerror', e => p.__errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.__errs.push(m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto(F, { waitUntil: 'load' });
  await p.evaluate(o => localStorage.setItem('cecoder.wsDrawer', JSON.stringify(o)), { open: !!open, w: dw });
  await p.reload({ waitUntil: 'load' });
  await wait(700);
  return p;
}

/* ========== 1 右键菜单 ========== */
{
  const p = await page();
  const f = await (await p.$('.float')).boundingBox();
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(300);
  const d = await p.evaluate(() => {
    const m = document.getElementById('fabMenu');
    const r = m.getBoundingClientRect();
    const br = document.querySelector('.float').getBoundingClientRect();
    return { hidden: m.hidden, items: [...m.querySelectorAll('.wd-menu-item')].map(x => x.textContent),
      above: r.bottom <= br.top + 0.5, gap: Math.round(br.top - r.bottom),
      rightAligned: Math.abs(r.right - br.right) < 1.5, focus: document.activeElement && document.activeElement.textContent };
  });
  ok('1 右键弹出菜单', d.hidden === false, '');
  ok('1 菜单项 = 新建分身会话/录音/隐藏', d.items.join('|') === '新建分身会话|录音|隐藏', d.items.join('|'));
  ok('1 菜单在圆球上方（间距约 6）', d.above && d.gap >= 5 && d.gap <= 7, d.gap + ' ' + d.above);
  ok('1 与圆球右缘对齐', d.rightAligned, '');
  ok('1 首项自动聚焦', d.focus === '新建分身会话', String(d.focus));
  await p.keyboard.press('Escape');
  await wait(200);
  ok('1 Esc 关闭菜单', await p.evaluate(() => document.getElementById('fabMenu').hidden), '');

  /* 左键不弹菜单 */
  await p.mouse.click(f.x + 28, f.y + 28);
  await wait(250);
  ok('1 左键不弹菜单', await p.evaluate(() => document.getElementById('fabMenu').hidden), '');
  /* 新建分身会话 → toast */
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(200);
  await p.evaluate(() => document.querySelector('#fabMenu .wd-menu-item').click());
  await wait(300);
  const t = await p.evaluate(() => { const all = document.querySelectorAll('.semi-toast'); return all.length ? all[all.length - 1].textContent : ''; });
  ok('1 新建分身会话 → toast', /新建分身会话/.test(t || ''), String(t));
  ok('1 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 2 录音：球 → 工具条 → 停止回球 ========== */
{
  const p = await page();
  /* 用布局坐标（offsetLeft+offsetWidth），避开表情动画 transform 带来的 ±2px 偏差 */
  const before = await p.evaluate(() => { const el = document.querySelector('.float'); return { w: el.offsetWidth, h: el.offsetHeight, right: el.offsetLeft + el.offsetWidth }; });
  const f = await (await p.$('.float')).boundingBox();
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(220);
  await p.evaluate(() => [...document.querySelectorAll('#fabMenu .wd-menu-item')][1].click());
  await p.mouse.move(500, 400);
  await wait(1400);
  const rec = await p.evaluate(() => {
    const el = document.querySelector('.float');
    const r = el.getBoundingClientRect();
    const wave = document.querySelector('.rec-wave i');
    const cs = getComputedStyle(wave);
    return { cls: el.className, w: Math.round(r.width), h: Math.round(r.height), right: el.offsetLeft + el.offsetWidth,
      aria: el.getAttribute('aria-label'), time: document.getElementById('recTime').textContent,
      anim: cs.animationName, animDur: cs.animationDuration,
      svgOpacity: getComputedStyle(el.querySelector('svg')).opacity,
      recDisp: getComputedStyle(el.querySelector('.fab-rec')).display,
      dotAnim: getComputedStyle(document.querySelector('.rec-dot')).animationName,
      bars: document.querySelectorAll('.rec-wave i').length,
      delays: [...document.querySelectorAll('.rec-wave i')].map(x => getComputedStyle(x).animationDelay) };
  });
  ok('2 进入录音态', d_c(rec.cls, 'is-recording'), rec.cls);
  ok('2 工具条高度 = 圆球 56', rec.h === before.h && rec.h === 56, String(rec.h));
  ok('2 工具条宽 212', rec.w === 212, String(rec.w));
  ok('2 右缘不跑位', Math.abs(rec.right - before.right) <= 1, rec.right + ' vs ' + before.right);
  ok('2 头像淡出、录音 UI 显示', Number(rec.svgOpacity) < 0.05 && rec.recDisp === 'flex', rec.svgOpacity + ' ' + rec.recDisp);
  ok('2 计时在走', /^00:0[1-9]$/.test(rec.time), rec.time);
  ok('2 7 根音浪条 + recWave 动画', rec.bars === 7 && rec.anim === 'recWave', rec.bars + ' ' + rec.anim);
  ok('2 音浪相位错开（延迟不全相同）', new Set(rec.delays).size >= 5, JSON.stringify(rec.delays));
  ok('2 红点呼吸动画', rec.dotAnim === 'recPulse', rec.dotAnim);
  ok('2 录音态 aria 提示改为停止', /停止/.test(rec.aria || ''), rec.aria);

  /* 点击整条 → 停止 */
  const rr = await (await p.$('.float')).boundingBox();
  await p.mouse.click(rr.x + rr.width / 2, rr.y + rr.height / 2);
  await wait(600);
  const stop = await p.evaluate(() => {
    const el = document.querySelector('.float');
    const r = el.getBoundingClientRect();
    /* 统一用布局坐标（offsetLeft+offsetWidth），rect 会带表情动画的 scale */
    return { cls: el.className, w: el.offsetWidth, h: el.offsetHeight, right: el.offsetLeft + el.offsetWidth,
      toast: (function () { const a = document.querySelectorAll('.semi-toast'); return a.length ? a[a.length - 1].textContent : ''; })(),
      aria: el.getAttribute('aria-label') };
  });
  ok('2 点击后回到圆球 56', stop.w === 56 && stop.h === 56, stop.w + 'x' + stop.h);
  ok('2 回到球后右缘仍对齐', Math.abs(stop.right - before.right) <= 1, String(stop.right));
  ok('2 停止后 toast 带时长', /录音已保存 · 00:0\d/.test(stop.toast || ''), String(stop.toast));
  ok('2 退出录音态、aria 复原', !/is-recording/.test(stop.cls) && /数字分身/.test(stop.aria || ''), stop.cls + ' ' + stop.aria);
  ok('2 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}
function d_c(cls, k) { return cls.split(/\s+/).indexOf(k) >= 0; }

/* ========== 3 隐藏 / H 找回 ========== */
{
  const p = await page();
  const f = await (await p.$('.float')).boundingBox();
  await p.mouse.click(f.x + 28, f.y + 28, { button: 'right' });
  await wait(200);
  await p.evaluate(() => [...document.querySelectorAll('#fabMenu .wd-menu-item')][2].click());
  await wait(400);
  const hid = await p.evaluate(() => {
    const el = document.querySelector('.float');
    return { cls: el.className, op: getComputedStyle(el).opacity, pe: getComputedStyle(el).pointerEvents,
      toast: (document.querySelector('.semi-toast') || {}).textContent };
  });
  ok('3 隐藏后透明且不可点', d_c(hid.cls, 'is-hidden') && Number(hid.op) < 0.1 && hid.pe === 'none', JSON.stringify(hid));
  ok('3 隐藏后提示按 H 找回', /按 H/.test(hid.toast || ''), String(hid.toast));
  await p.keyboard.press('h');
  await wait(400);
  const back = await p.evaluate(() => ({ cls: document.querySelector('.float').className, op: getComputedStyle(document.querySelector('.float')).opacity }));
  ok('3 按 H 恢复', !d_c(back.cls, 'is-hidden') && Number(back.op) > 0.8, JSON.stringify(back));
  ok('3 无 JS 报错', p.__errs.length === 0, p.__errs.join(' | '));
  await p.close();
}

/* ========== 4 背景方案（第 39 轮：默认改稿件渐变 design，ai/grid 仍可切换） ========== */
{
  const p = await page();
  const d0 = await p.evaluate(() => {
    const fr = document.querySelector('.cds-frame');
    const before = getComputedStyle(document.querySelector('.panel-main'), '::before');
    return { bg: fr.dataset.bg, panelBg: getComputedStyle(document.querySelector('.panel')).backgroundImage,
      pattern: before.backgroundImage, mask: before.maskImage || before.webkitMaskImage };
  });
  ok('4 默认设计稿渐变', d0.bg === 'design', String(d0.bg));
  ok('4 渐变方案面板纯白、无纹理', d0.panelBg === 'none' && d0.pattern === 'none', d0.panelBg + ' | ' + d0.pattern);

  await p.keyboard.press('b');
  await wait(250);
  const d1 = await p.evaluate(() => ({ bg: document.querySelector('.cds-frame').dataset.bg,
    toast: (function () { const a = document.querySelectorAll('.semi-toast'); return a.length ? a[a.length - 1].textContent : ''; })(),
    panelBg: getComputedStyle(document.querySelector('.panel')).backgroundImage.slice(0, 30),
    img: getComputedStyle(document.querySelector('.panel-main'), '::before').backgroundImage.slice(0, 40),
    z: getComputedStyle(document.querySelector('.panel-main'), '::before').zIndex }));
  ok('4 B 切到极光', d1.bg === 'ai' && /极光/.test(d1.toast || ''), JSON.stringify({ bg: d1.bg, toast: d1.toast }));
  ok('4 极光：面板蓝紫氛围层 + 点阵纹理', /radial-gradient/.test(d1.panelBg) && /radial-gradient/.test(d1.img), d1.panelBg + ' | ' + d1.img);
  ok('4 纹理压在内容下面（z -1）', d1.z === '-1', d1.z);

  await p.keyboard.press('b');
  await wait(250);
  const d2 = await p.evaluate(() => ({ bg: document.querySelector('.cds-frame').dataset.bg,
    toast: (function () { const a = document.querySelectorAll('.semi-toast'); return a.length ? a[a.length - 1].textContent : ''; })(),
    img: getComputedStyle(document.querySelector('.panel-main'), '::before').backgroundImage.slice(0, 30) }));
  ok('4 再按 B 到工程网格', d2.bg === 'grid' && /工程网格/.test(d2.toast || ''), JSON.stringify(d2));
  ok('4 网格是线性方格', /linear-gradient/.test(d2.img), d2.img);

  await p.keyboard.press('b');
  await wait(250);
  ok('4 再循环回设计稿渐变', (await p.evaluate(() => document.querySelector('.cds-frame').dataset.bg)) === 'design', '');
  await p.reload({ waitUntil: 'load' });
  await wait(400);
  ok('4 刷新后记住选择', (await p.evaluate(() => document.querySelector('.cds-frame').dataset.bg)) === 'design', '');
  await p.close();

  const p2 = await b.newPage();
  await p2.setViewport({ width: 1440, height: 900 });
  await p2.goto(F + '?bg=ai', { waitUntil: 'load' });
  await wait(400);
  ok('4 ?bg=ai 可直达极光', (await p2.evaluate(() => document.querySelector('.cds-frame').dataset.bg)) === 'ai', '');
  await p2.close();
}

console.log('PASS ' + pass + ' / ' + (pass + fail.length));
fail.forEach(f => console.log('  FAIL ' + f));
await b.close();
