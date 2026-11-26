/* 第 80 轮验收：顶栏 tab / 流光一轮 / 任务页细节 / UI设计页 / 总结页资产 / 预览大图 / 派发弹窗还原 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function mk(url, w = 1920, h = 1200) {
  const p = await b.newPage(); p.__e = [];
  p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
  await p.setViewport({ width: w, height: h });
  await p.goto('file:///' + BASE + '/' + url, { waitUntil: 'load' });
  await wait(700);
  p.tap = sel => p.evaluate(s => document.querySelector(s).click(), sel);
  return p;
}

/* ============ A 顶栏：tab 间距 2px / 研发工作台回首页 / 流光只一轮 ============ */
{
  const p = await mk('cecoder-home.html');
  const a = await p.evaluate(() => {
    const seg = document.querySelector('.tb-seg');
    const items = [...seg.querySelectorAll('.seg-item')];
    const div = seg.querySelector('.seg-div');
    const groups = [...seg.children].filter(e => e.classList.contains('seg-item') || e.classList.contains('seg-div'));
    const gaps = [];
    for (let i = 1; i < groups.length; i++) gaps.push(Math.round(groups[i].getBoundingClientRect().left - groups[i - 1].getBoundingClientRect().right));
    const cs = getComputedStyle(document.querySelector('.c-wave'), '::before');
    const beam = document.querySelector('.c-beam');
    return {
      n: items.length, gapCss: getComputedStyle(seg).gap, gaps,
      divPos: getComputedStyle(div).position, segW: Math.round(seg.getBoundingClientRect().width),
      iter: cs.animationIterationCount, beamAnim: getComputedStyle(beam).animationName,
    };
  });
  ok('A1 三个 tab 间距 2px（含竖线也走同一间距）', a.n === 3 && a.gapCss === '2px' && a.gaps.every(g => g === 2), a.gaps.join('/'));
  ok('A2 竖线回到普通流内、容器由内容撑开', a.divPos === 'static' && a.segW > 300 && a.segW < 320, a.divPos + ' ' + a.segW);
  ok('A3 外圈流光只跑一轮（iteration-count = 1 + 结束后淡出）', a.iter === '1' && /c-beam-off/.test(a.beamAnim), a.iter + ' ' + a.beamAnim);
  await wait(2800);
  ok('A4 一轮结束后流光隐藏', await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.c-beam')); return s.visibility === 'hidden' || s.opacity === '0'; }));
  await p.close();

  const q = await mk('cecoder-task.html?id=0');
  await q.tap('.seg-item[data-seg="研发工作台"]'); await wait(900);
  ok('A5 点顶栏「研发工作台」→ 回首页', /cecoder-home\.html/.test(q.url()), q.url());
  await q.close();
}

/* ============ B 任务页：去首页键 / 去任务总结 / 文件输入展开 / 页签 / 差异对比 / UI设计 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  const b1 = await p.evaluate(() => {
    const top = document.querySelector('.task-top');
    const files = document.querySelector('.tp-files');
    const on = document.querySelector('.tk-tabs-l .tk-tab.is-on');
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    return {
      home: !!top.querySelector('.tt-home'), sep: !!top.querySelector('.tt-home-sep'),
      titleX: Math.round(top.querySelector('.tt-title').getBoundingClientRect().left - pm.left),
      sumLink: !!document.querySelector('.tk-sum-link'),
      filesOpen: files.classList.contains('is-open') && !files.classList.contains('is-closed'),
      filesH: Math.round(files.getBoundingClientRect().height),
      caretRot: getComputedStyle(files.querySelector('.tp-sect-caret')).transform,
      onTab: on.textContent.trim(),
      step3: document.querySelector('.ts-item[data-step="3"] .ts-name').textContent,
      step3Href: document.querySelector('.ts-item[data-step="3"]').getAttribute('href'),
      diff: !!document.getElementById('tpDiff'),
    };
  });
  ok('B1 中栏 task-top 去掉「首页」+ 间隔线', b1.home === false && b1.sep === false, b1.home + ' ' + b1.sep);
  ok('B2 专注模式旁不再有「任务总结」入口', b1.sumLink === false);
  ok('B3 文件输入默认展开（is-open、箭头朝下、高度 > 200）', b1.filesOpen && b1.filesH > 200 && b1.caretRot === 'none', b1.filesH + ' ' + b1.caretRot);
  ok('B4 当前页签文字 = 代码开发', b1.onTab === '代码开发', b1.onTab);
  ok('B5 第 3 道工序 = UI设计，链到 cecoder-ui.html', b1.step3 === 'UI设计' && b1.step3Href === 'cecoder-ui.html?id=0', b1.step3 + ' ' + b1.step3Href);

  await p.tap('#tpDiff'); await wait(300);
  const d = await p.evaluate(() => ({
    on: [...document.querySelectorAll('.tk-tabs-l .tk-tab')].filter(t => t.classList.contains('is-on')).map(t => t.textContent.trim().replace(/\s+/g, '')),
  }));
  ok('B6 点「差异对比」→ 切到中栏「变更」页签', d.on.length === 1 && d.on[0].indexOf('变更') === 0, d.on.join(','));
  ok('B7 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ C UI设计专属页：中栏空 ============ */
{
  const p = await mk('cecoder-ui.html?id=0');
  const c = await p.evaluate(() => {
    const items = [...document.querySelectorAll('#tkStepTrack .ts-item')];
    const now = document.querySelector('.ts-item.is-now');
    const blank = document.querySelector('.ui-blank');
    const pm = document.querySelector('.panel-main').getBoundingClientRect();
    return {
      names: items.map(i => i.querySelector('.ts-name').textContent),
      now: now ? now.querySelector('.ts-name').textContent : '',
      blank: !!blank,
      blankBox: blank ? [Math.round(blank.getBoundingClientRect().width), Math.round(blank.getBoundingClientRect().height)] : null,
      hasWrap: !!document.querySelector('.tp-wrap'),
      home: !!document.querySelector('.task-top .tt-home'),
      title: document.querySelector('.tt-title').textContent,
    };
  });
  ok('C1 UID 页 9 道工序、第 3 道当前 = UI设计', c.names.length === 9 && c.names[2] === 'UI设计' && c.now === 'UI设计', c.names.join('/'));
  ok('C2 中栏留空（无任务正文、空白区铺满）', c.blank === true && c.hasWrap === false && c.blankBox[0] > 600 && c.blankBox[1] > 800, JSON.stringify(c.blankBox));
  ok('C3 顶栏同样不放「首页」', c.home === false);
  ok('C4 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

/* ============ D 总结页：sa-tags 只在代码开发 / 序号灰 / 待产出橙 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  const d = await p.evaluate(() => {
    const rows = [...document.querySelectorAll('.sa-row')];
    const byName = n => rows.find(r => r.querySelector('.sa-name').textContent === n);
    const dev = byName('代码开发');
    dev.querySelector('.sa-row-h').click();
    const seq = getComputedStyle(document.querySelector('.sa-body .sa-tr:not(.is-th) > span')).color;
    const warn = [...document.querySelectorAll('.sa-st.is-warn')].map(e => getComputedStyle(e).color);
    const done = [...document.querySelectorAll('.sa-st:not(.is-warn)')].map(e => getComputedStyle(e).color);
    return {
      tags: rows.map(r => r.querySelectorAll('.sa-tag').length),
      devTags: dev.querySelectorAll('.sa-tag').length,
      devTagH: [...dev.querySelectorAll('.sa-tag')].map(e => Math.round(e.getBoundingClientRect().height)),
      seq, warn: [...new Set(warn)], done: [...new Set(done)],
    };
  });
  ok('D1 只有「代码开发」容器里有 sa-tags（2 条 24 高），其余 6 个都没有', d.tags.join(',') === '0,0,0,2,0,0,0' && d.devTagH.every(v => v === 24), d.tags.join(',') + ' ' + d.devTagH.join('/'));
  ok('D2 表格序号数字偏灰 #868686', d.seq === 'rgb(134, 134, 134)', d.seq);
  ok('D3 表格「待产出」橙色 #FF7D00、「已产出」保持正文色', d.warn.join() === 'rgb(255, 125, 0)' && d.done.join() === 'rgb(31, 31, 31)', d.warn + ' / ' + d.done);
  await p.close();
}

/* ============ E AI 栏：蒙层大图按原尺寸呈现 ============ */
{
  const p = await mk('cecoder-task.html?id=0');
  await p.tap('.ai-shot'); await wait(700);
  const e = await p.evaluate(() => {
    const img = document.getElementById('shotViewerImg');
    const r = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    return {
      open: document.getElementById('shotViewer').classList.contains('is-open'),
      w: Math.round(r.width), nat: img.naturalWidth,
      bg: cs.backgroundColor, shadow: cs.boxShadow, filter: cs.filter,
      inView: r.width <= innerWidth && r.height <= innerHeight,
    };
  });
  ok('E1 大图按原尺寸 1:1 呈现（696 宽，不再缩到 348）', e.open && e.w === e.nat && e.w >= 640, e.w + '/' + e.nat);
  ok('E2 不铺白底方框，改用跟随像素的投影', e.bg === 'rgba(0, 0, 0, 0)' && e.shadow === 'none' && /drop-shadow/.test(e.filter), e.bg + ' ' + e.filter.slice(0, 30));
  ok('E3 大图不越出视口', e.inView);
  await p.close();
}

/* ============ F 派发弹窗：按 3495:55225 / 3495:55277 还原 ============ */
{
  const p = await mk('cecoder-summary.html?id=0');
  await p.tap('#sumOpenDispatch'); await wait(420);
  const f = await p.evaluate(() => {
    const dlg = document.querySelector('.dp-dlg').getBoundingClientRect();
    const rel = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left - dlg.left), Math.round(r.top - dlg.top), Math.round(r.width), Math.round(r.height)]; };
    const cs = (s, k) => getComputedStyle(document.querySelector(s))[k];
    const grp = document.querySelector('.dp-grp');
    const grpBox = grp.getBoundingClientRect();
    return {
      dlg: [Math.round(dlg.width), Math.round(dlg.height)],
      panelH: Math.round(document.querySelector('.panel').getBoundingClientRect().height),
      dlgBg: getComputedStyle(document.querySelector('.dp-dlg')).backgroundColor,
      leftBg: cs('.dp-left', 'backgroundColor'),
      headBg: cs('.dp-head', 'backgroundColor'),
      footBg: cs('.dp-foot', 'backgroundColor'),
      grpBg: getComputedStyle(grp).backgroundColor,
      grpShadow: getComputedStyle(grp).boxShadow,
      grpCkX: Math.round(grp.querySelector('.is-grp').getBoundingClientRect().left - grpBox.left),
      descFont: cs('.dp-l-d', 'fontSize'),
      empty: rel(document.querySelector('.dp-empty')),
      emptyBg: cs('.dp-empty', 'backgroundColor'),
      emptyShadow: cs('.dp-empty', 'boxShadow'),
      emptyBorder: cs('.dp-empty', 'border'),
      lfoot: rel(document.querySelector('.dp-left-foot')),
      count: document.getElementById('dpCount').textContent,
      stateRight: (() => { const st = document.querySelector('.dp-grp.is-empty'); return Math.round(st.getBoundingClientRect().right - st.querySelector('.dp-grp-state').getBoundingClientRect().right); })(),
    };
  });
  ok('F1 弹窗 1200 宽 / 上下各 40 撑满面板、底 #F2F2F2、头/底白、左列 #F7F7F7',
    f.dlg[0] === 1200 && f.dlg[1] === f.panelH - 80 && f.dlgBg === 'rgb(242, 242, 242)' && f.headBg === 'rgb(255, 255, 255)' &&
    f.footBg === 'rgb(255, 255, 255)' && f.leftBg === 'rgb(247, 247, 247)', JSON.stringify([f.dlg, f.dlgBg, f.leftBg]));
  ok('F2 左列工序卡：白底 + 仅 0 1 2 阴影（无描边）、工序勾缩进 17、描述 12px',
    f.grpBg === 'rgb(255, 255, 255)' && /rgba\(0, 0, 0, 0\.08\) 0px 1px 2px/.test(f.grpShadow) && f.grpCkX === 17 && f.descFont === '12px',
    JSON.stringify([f.grpBg, f.grpShadow, f.grpCkX, f.descFont]));
  ok('F3 右列空态 760×600、#FAFAFA + 1px 虚线 #C9C9C9', f.empty[2] === 760 && f.empty[3] === 600 && f.emptyBg === 'rgb(250, 250, 250)' && /1px dashed rgb\(201, 201, 201\)/.test(f.emptyBorder), JSON.stringify([f.empty, f.emptyBg, f.emptyBorder]));
  ok('F4 左列底栏 48、计数与稿同构（共 N 项，已选 M 项）', f.lfoot[3] === 48 && /^共 \d+ 项，已选 \d+ 项$/.test(f.count), f.count);
  ok('F5 「4 项待产出」贴右 16', f.stateRight === 16, f.stateRight);

  await p.tap('#dpSelectAll'); await wait(320);
  const g = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.dp-card')];
    const card = document.querySelector('.dp-card[data-key="arch"]');
    const cb = card.getBoundingClientRect();
    const rel = el => { const r = el.getBoundingClientRect(); return [Math.round(r.left - cb.left), Math.round(r.top - cb.top), Math.round(r.width), Math.round(r.height)]; };
    const dv = [...card.querySelectorAll('.dp-dv-list .dp-ck')];
    return {
      types: cards.map(c => c.querySelector('.dp-type').textContent),
      h: cards.map(c => Math.round(c.getBoundingClientRect().height)),
      det: rel(card.querySelector('.dp-detail')),
      tag: rel(card.querySelector('.dp-type')),
      dvN: dv.length,
      dvOneLine: dv.every(e => e.getBoundingClientRect().height <= 23),
      btnIcon: card.querySelector('.dp-card-btns .dp-btn svg') !== null,
      dvTitleFont: getComputedStyle(card.querySelector('.dp-dv-t')).fontSize + '/' + getComputedStyle(card.querySelector('.dp-dv-t')).fontWeight,
    };
  });
  ok('F6 全选 → 三张卡（代码开发 / 架构设计 / 缺陷修复，与稿的堆叠顺序一致）', g.types.join('/') === '代码开发/架构设计/缺陷修复', g.types.join('/'));
  ok('F7 架构卡 342、详情 728×202 @16,124、传递资产 6 项单行',
    g.h[1] === 342 && g.det.join('/') === '16/124/728/202' && g.dvN === 6 && g.dvOneLine, JSON.stringify([g.h, g.det, g.dvN, g.dvOneLine]));
  ok('F8 类型标签 60×20 @16,17；详情分隔标题 14/500；按钮带下拉图标',
    g.tag.join('/') === '16/17/60/20' && g.dvTitleFont === '14px/500' && g.btnIcon,
    JSON.stringify([g.tag, g.dvTitleFont, g.btnIcon]));
  ok('F9 无脚本报错', p.__e.length === 0, p.__e.slice(0, 3).join(' / '));
  await p.close();
}

console.log('\n' + pass + '/' + (pass + fail.length) + ' 通过');
if (fail.length) { console.log('失败：'); fail.forEach(f => console.log('  ✗ ' + f)); }
await b.close();
