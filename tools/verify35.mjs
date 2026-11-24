/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
/* 第 35 轮验收（10 条）
   1 收起任务栏 / 收起右栏 的箭头不再扁（张角 ≈45°，两枚互为镜像）
   2 ts-scroll 横向滚动条「真实、按需」：不写死隐藏，放得下不出现、放不下出现
   3 ts-icon 外环与圆点同心，且是持续旋转的点阵虚线
   4 自动执行 28 高
   5 顶部工具条 / 页签条左缘补 1px 竖线（与工序条连成一条）
   6 ts-scroll 内边距统一 24
   7 ts-name 字号 13
   8 任务信息（原全链路）/ 工序资产 去图标、字号 13
   9 会话页 chat 容器左右内边距 32
   10 右栏「变更 / 文件」页签上移占住标题栏，整体少一行 44
*/
import puppeteer from 'puppeteer-core';
const ROOT = BASE;
const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const OPEN = () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); } catch (e) { } };
async function mk(url, w = 1440, h = 900, seed = OPEN) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.evaluateOnNewDocument(seed);
  await p.goto('file:///' + ROOT + '/' + url, { waitUntil: 'load' });
  await wait(800);
  return p;
}
/* 从 path d 里读出「竖条端点到箭头顶点」的张角：dx / (dy/2)，1 就是 45° */
function arrowGeom(d) {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const [x1, y1, x2, y2, x3, y3] = n;
  const half = Math.abs(y3 - y1) / 2;
  return { dx: Math.abs(x2 - x1), half, ratio: Math.abs(x2 - x1) / half, d };
}

/* ========== A 两个收起图标的箭头 ========== */
{
  const p = await mk('cecoder-home.html?tab=%E4%BB%BB%E5%8A%A1');
  const g = await p.evaluate(() => {
    const pick = s => { const e = document.querySelector(s); const sv = e && e.querySelector('svg'); return sv ? { d: sv.querySelector('path').getAttribute('d'), rect: sv.querySelector('rect').getAttribute('x'), vb: sv.getAttribute('viewBox') } : null; };
    return { wd: pick('.wd-collapse') };
  });
  const a = arrowGeom(g.wd.d);
  /* 45° 上下各 3° 的容差：dx / (dy/2) ∈ [0.88, 1.12]；改前是 4.7/3.7 = 1.27（扁） */
  ok('A1 收起任务栏箭头张角 ≈45°（不扁）', a.ratio >= 0.88 && a.ratio <= 1.12, JSON.stringify(a));
  ok('A1b 仍是 14 画布、竖条 1.4 宽', g.wd.vb === '0 0 14 14', g.wd.vb);

  await p.close();
  const q = await mk('cecoder-session.html?id=0', 1440, 900, () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); } catch (e) { } });
  await q.click('#rsToggle');
  await wait(600);
  const g2 = await q.evaluate(() => {
    const e = document.querySelector('.rs-collapse'); const sv = e && e.querySelector('svg');
    return sv ? { d: sv.querySelector('path').getAttribute('d'), vb: sv.getAttribute('viewBox') } : null;
  });
  const c = arrowGeom(g2.d);
  ok('A2 收起右栏箭头张角 ≈45°（不扁）', c.ratio >= 0.88 && c.ratio <= 1.12, JSON.stringify(c));
  /* 镜像：x 全部 = 14 − 另一枚 */
  const mir = (x) => Math.round((14 - x) * 10) / 10;
  const n1 = (g.wd.d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const n2 = (g2.d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  ok('A3 两枚箭头左右镜像', Math.abs(n1[0] - mir(n2[0])) < .2 && Math.abs(n1[2] - mir(n2[2])) < .2 && n1[1] === n2[1], n1.join(',') + ' | ' + n2.join(','));
  ok('A4 无 JS 报错', q.__e.length === 0 && p.__e.length === 0, p.__e.concat(q.__e).join(' | '));
  await q.close();
}

/* ========== B 任务页：滚动条 / 内边距 / 字号 / 环 / 竖线 / 按钮 ========== */
{
  const p = await mk('cecoder-task.html?id=1');
  const d = await p.evaluate(() => {
    const sc = document.getElementById('tkStepScroll');
    const tr = document.getElementById('tkStepTrack');
    const cs = getComputedStyle(sc);
    const icon = document.querySelector('.ts-item.is-now .ts-icon');
    const ic = icon.getBoundingClientRect();
    const af = getComputedStyle(icon, '::after');
    const afterBox = { l: parseFloat(af.left) + parseFloat(af.marginLeft), t: parseFloat(af.top) + parseFloat(af.marginTop), w: parseFloat(af.width), h: parseFloat(af.height) };
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const segs = [...document.querySelectorAll('.tt-links .tt-link')];
    return {
      overflowX: cs.overflowX, sbWidth: cs.scrollbarWidth,
      sw: sc.scrollWidth, cw: sc.clientWidth,
      trackPad: getComputedStyle(tr).padding,
      itemPadTop: getComputedStyle(document.querySelector('.ts-item')).paddingTop,
      nameFS: getComputedStyle(document.querySelector('.ts-name')).fontSize,
      nameLH: getComputedStyle(document.querySelector('.ts-name')).lineHeight,
      ring: { w: afterBox.w, h: afterBox.h, anim: af.animationName, dur: af.animationDuration, mask: /^url/.test(af.maskImage || af.webkitMaskImage || ''), l: afterBox.l, t: afterBox.t },
      iconC: { cx: ic.width / 2, cy: ic.height / 2 },
      ringC: { cx: afterBox.l + afterBox.w / 2, cy: afterBox.t + afterBox.h / 2 },
      shadow: { top: getComputedStyle(document.querySelector('.task-top')).boxShadow, tabs: getComputedStyle(document.querySelector('.task-tabs')).boxShadow, steps: getComputedStyle(document.querySelector('.task-steps')).boxShadow },
      runH: Math.round(document.querySelector('.tt-run').getBoundingClientRect().height),
      segs: segs.map(s => ({ t: s.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height), ico: s.querySelectorAll('.ico').length, fs: getComputedStyle(s).fontSize })),
      pmW: Math.round(pm.width),
    };
  });
  /* 2 滚动条：不隐藏、按需 */
  /* 第 36 轮：改成「自绘滚动条」—— 原生收起来（scrollbar-width:none），滚动能力仍在（overflow-x auto）+ 自绘那条按需出现 */
  ok('B1 原生滚动条收起来、滚动仍是 auto（自绘 .ts-prog 接管）', d.overflowX === 'auto' && d.sbWidth === 'none', d.overflowX + ' / ' + d.sbWidth);
  /* 第 46 轮：工序横排后整条 1450，1440 窗的 1104 面板放不下 → 滚动条按需出现 */
  ok('B2 1440（1104 面板）放不下 → 出现滚动条', d.sw > d.cw + 1 && d.pmW === 1104, d.sw + '/' + d.cw);
  /* 6 内边距（第 46 轮：轨道左右 20、工序距顶 20） */
  ok('B3 轨道左右内距 20、工序距顶 20', d.trackPad === '0px 20px' && d.itemPadTop === '20px', d.trackPad + ' / ' + d.itemPadTop);
  /* 7 字号 */
  ok('B4 ts-name 14/22（第 46 轮稿面）', d.nameFS === '14px' && d.nameLH === '22px', d.nameFS + '/' + d.nameLH);
  /* 3 环 */
  ok('B5 外环 32×32、点阵遮罩、持续旋转', d.ring.w === 32 && d.ring.h === 32 && d.ring.mask && d.ring.anim === 'tsOrbit' && d.ring.dur !== '0s', JSON.stringify(d.ring));
  ok('B6 外环与圆点同心（中心差 ≤0.5）', Math.abs(d.ringC.cx - d.iconC.cx) <= .5 && Math.abs(d.ringC.cy - d.iconC.cy) <= .5, JSON.stringify(d.ringC) + ' vs ' + JSON.stringify(d.iconC));
  /* 5 竖线 */
  const hasL = s => /rgb\(235, 236, 237\) 1px 0px 0px 0px inset/.test(s);
  ok('B7 顶部工具条与页签条左缘都有 1px 竖线', hasL(d.shadow.top) && hasL(d.shadow.tabs), JSON.stringify(d.shadow));
  /* 4 自动执行 */
  ok('B9 自动执行 28 高', d.runH === 28, String(d.runH));
  /* 8 两段按钮 */
  /* 第 46 轮：顶栏改成「任务信息 / 工序资产」两段 + 独立的「工序进度 | 收起」组 */
  const flow = d.segs.find(s => s.t === '任务信息'), assets = d.segs.find(s => s.t.indexOf('工序资产') === 0);
  ok('B10 任务信息 / 工序资产 无图标、字号 14', !!flow && !!assets && flow.ico === 0 && assets.ico === 0 && flow.fs === '14px' && assets.fs === '14px', JSON.stringify(d.segs));
  ok('B11 工序进度独立成组、箭头在「收起」键里', await p.evaluate(() => {
    const g = document.querySelector('.tt-now');
    return !!g && /工序进度/.test(g.textContent) && !!document.querySelector('#tkStepsToggle .tt-caret');
  }), 'missing');
  ok('B12 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== C 窄面板才出现滚动条 ========== */
{
  const p = await mk('cecoder-task.html?id=1', 960, 800);
  const d = await p.evaluate(() => {
    const sc = document.getElementById('tkStepScroll');
    const tr = document.getElementById('tkStepTrack');
    const it = [...document.querySelectorAll('.ts-item')];
    const s = document.querySelector('.task-steps').getBoundingClientRect();
    return { sw: sc.scrollWidth, cw: sc.clientWidth, need: sc.scrollWidth > sc.clientWidth, gapL: Math.round(it[0].getBoundingClientRect().left - s.left), padL: getComputedStyle(tr).paddingLeft };
  });
  ok('C1 960（622 面板）放不下 → 需要滚动', d.need === true, d.sw + '/' + d.cw);
  ok('C2 滚动时首项仍从左 20 起（内边距没被居中吃掉）', d.gapL === 20 && d.padL === '20px', d.gapL + '/' + d.padL);
  await p.close();
}

/* ========== D 会话页：chat 内边距 32 ========== */
{
  const p = await mk('cecoder-session.html?id=0');
  const d = await p.evaluate(() => {
    const chat = document.querySelector('.chat');
    const inner = document.querySelector('.chat-inner').getBoundingClientRect();
    const cr = chat.getBoundingClientRect();
    const cs = getComputedStyle(chat);
    const stg = document.querySelector('.stage');
    const ss = getComputedStyle(stg);
    const sw = stg.clientWidth - parseFloat(ss.paddingLeft) - parseFloat(ss.paddingRight);
    return { pad: cs.padding, mar: cs.margin, w: Math.round(cr.width), stageW: Math.round(sw), top: parseInt(cs.paddingTop, 10), bottom: parseInt(cs.paddingBottom, 10) };
  });
  /* 第 37 轮：更正为「外间距」—— 32 由 margin 承担，padding 左右归 0，内容列宽 = stage 内容宽 − 64 */
  ok('D1 chat 左右 32 是外间距（margin，不是 padding）', d.mar === '0px 32px' && d.pad === '32px 0px 8px' && d.top === 32 && d.bottom === 8, JSON.stringify(d));
  ok('D1b 内容列宽 = stage 内容宽 − 64', Math.abs(d.w - (d.stageW - 64)) <= 1, d.w + ' vs ' + d.stageW);
  ok('D2 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== E 右栏：页签上移占住标题栏 ========== */
{
  const p = await mk('cecoder-session.html?id=0', 1440, 900, () => { try { localStorage.setItem('cecoder.wsDrawer', JSON.stringify({ open: true })); localStorage.removeItem('cecoder.rsDrawer'); } catch (e) { } });
  await p.click('#rsToggle');
  await wait(600);
  const d = await p.evaluate(() => {
    const top = document.querySelector('.rs-top');
    const tabs = document.querySelector('.rs-tabs');
    const tab = document.querySelector('.rs-tab');
    const body = document.querySelector('.rs-body');
    const dr = document.getElementById('rsDrawer').getBoundingClientRect();
    const tb = tabs.getBoundingClientRect();
    return {
      head: !!document.querySelector('.rs-head'),
      title: !!document.querySelector('.rs-title'),
      topH: Math.round(top.getBoundingClientRect().height),
      tabsH: Math.round(tb.height), tabH: Math.round(tab.getBoundingClientRect().height),
      labels: [...document.querySelectorAll('.rs-tab')].map(t => t.textContent.trim()),
      collapseInTop: !!top.querySelector('.rs-collapse'),
      collapseRect: (() => { const r = top.querySelector('.rs-collapse').getBoundingClientRect(); return { right: Math.round(top.getBoundingClientRect().right - r.right), w: Math.round(r.width) }; })(),
      bodyTop: Math.round(body.getBoundingClientRect().top - dr.top),
      drawerTop: Math.round(dr.top),
    };
  });
  ok('E1 「上下文」标题栏已移除', !d.head && !d.title, d.head + '/' + d.title);
  ok('E2 页签行 44 高、页签同高（下划线与行底对齐）', d.topH === 44 && d.tabsH === 44 && d.tabH === 44, d.topH + '/' + d.tabsH + '/' + d.tabH);
  ok('E3 变更 / 文件 在最上面一行', d.labels.join(',') === '变更,文件' && d.bodyTop === 44, d.labels.join(',') + ' bodyTop=' + d.bodyTop);
  ok('E4 收起键挪进页签行右端（28×28、距右 8）', d.collapseInTop && d.collapseRect.w === 28 && d.collapseRect.right === 8, JSON.stringify(d.collapseRect));
  ok('E5 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

/* ========== F 竖线三段连续（像素验证：顶部条 / 工序条 / 页签条 左缘同一列都是线色） ========== */
{
  const p = await mk('cecoder-task.html?id=1');
  const box = await p.evaluate(() => {
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    const t = document.querySelector('.task-top').getBoundingClientRect();
    const s = document.querySelector('.task-steps').getBoundingClientRect();
    const b2 = document.querySelector('.task-tabs').getBoundingClientRect();
    return { x: Math.round(pm.left), y: Math.round(t.top), rows: [Math.round(t.top - t.top + 20), Math.round(s.top - t.top + 60), Math.round(b2.top - t.top + 20)] };
  });
  const cdp = await p.target().createCDPSession();
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: box.x, y: box.y, width: 1, height: 210, scale: 1 }, captureBeyondViewport: true });
  const px = await p.evaluate(async (b64, rows) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return rows.map(y => { const d = g.getImageData(0, y, 1, 1).data; return d[0] + ',' + d[1] + ',' + d[2]; });
  }, Buffer.from(data, 'base64').toString('base64'), box.rows);
  const isLine = v => { const [r, gg, bb] = v.split(',').map(Number); return r >= 225 && r <= 245 && Math.abs(gg - r) <= 4 && Math.abs(bb - r) <= 6; };
  ok('F1 三段左缘同一条竖线（像素 235,236,237）', px.every(isLine), JSON.stringify(px));
  ok('F2 无 JS 报错', p.__e.length === 0, p.__e.join(' | '));
  await p.close();
}

await b.close();
console.log('\n通过 ' + pass + ' / ' + (pass + fail.length));
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
