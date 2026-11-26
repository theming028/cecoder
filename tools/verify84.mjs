/* 第 84 轮验收：代码生成页 —— 逐张从第一张生成 & 全部生成完进度条 100% / 文件夹图标与文字色 +
   真实本地文件夹选择 / cg-sels 间隔线 / 已确认变更分析卡 hover 白底 / 补 AI 对话栏 */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-device-scale-factor=1'] });
let pass = 0; const fail = [];
const ok = (n, c, x) => { if (c) pass++; else fail.push(n + (x !== undefined ? ' ← ' + x : '')); };
const wait = ms => new Promise(r => setTimeout(r, ms));

const p = await b.newPage(); p.__e = [];
p.on('pageerror', e => p.__e.push('pageerror: ' + e.message));
p.on('console', m => { if (m.type() === 'error') p.__e.push('console: ' + m.text()); });
await p.setViewport({ width: 1440, height: 1000 });
await p.goto('file:///' + BASE + '/cecoder-codegen.html', { waitUntil: 'load' });
await wait(260);

/* ---------- A 右侧 AI 对话栏 ---------- */
const a = await p.evaluate(() => {
  const side = document.querySelector('.ai-side');
  const main = document.querySelector('.panel-main');
  const stage = document.querySelector('.stage');
  if (!side) return { none: true };
  const r = side.getBoundingClientRect(), m = main.getBoundingClientRect();
  const cs = getComputedStyle(side);
  const col = document.querySelector('.cg-col').getBoundingClientRect();
  return {
    w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y),
    display: cs.display, hidden: side.getAttribute('aria-hidden'),
    inPanel: side.parentNode.classList.contains('panel'),
    afterMain: side.previousElementSibling === main || m.right <= r.x + 1,
    headTxt: (side.querySelector('.ai-h-title') || {}).textContent.trim().split('\n')[0].trim(),
    stageHidden: getComputedStyle(stage).display === 'none',
    colW: Math.round(col.width),
  };
});
ok('A1 代码生成页右栏带出 AI 对话栏（450×满高、挂在 .panel 内 .panel-main 之后）',
  !a.none && a.w === 450 && a.h > 700 && a.display !== 'none' && a.inPanel && a.afterMain, JSON.stringify(a));
ok('A2 AI 对话栏标题仍是「生成任务的业务代码」，中栏让位（< 1094 且不溢出）',
  a.headTxt === '生成任务的业务代码' && a.colW > 0 && a.colW < 1094, JSON.stringify([a.headTxt, a.colW]));

/* ---------- B 从第一张卡开始生成，全部生成完 = 进度条 100% ---------- */
const b1 = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.cg-card')];
  return {
    n: cards.length,
    states: cards.map(c => c.getAttribute('data-state')),
    firstFlow: !!cards[0].querySelector('.cg-flow'),
    firstChipsDone: cards[0].querySelectorAll('.cg-chip.is-done').length,
    stats: document.getElementById('cgStats').textContent.replace(/\s+/g, ''),
    barW: document.getElementById('cgBar').getBoundingClientRect().width,
    trackW: document.querySelector('.cg-bar').getBoundingClientRect().width,
  };
});
ok('B1 四张卡里第一张就是「生成中」（带生成流程），其余待生成',
  b1.n === 4 && b1.states[0] === 'running' && b1.states.slice(1).every(s => s === 'todo') && b1.firstFlow,
  JSON.stringify(b1.states));
ok('B2 起手统计 已生成 0/4 · 待确认 0 · 已确认 0/4，进度条 0', b1.stats === '已生成0/4·待确认0·已确认0/4' && b1.barW < 2, b1.stats + ' / ' + b1.barW);

/* 逐张生成：等到没有 running / todo（4 张 × 5 chip × 700ms + 卡间 420ms ≈ 15.3s） */
let done = false;
for (let i = 0; i < 60; i++) {
  await wait(500);
  const s = await p.evaluate(() => ({
    run: document.querySelectorAll('.cg-card[data-state="running"]').length,
    todo: document.querySelectorAll('.cg-card[data-state="todo"]').length,
  }));
  if (!s.run && !s.todo) { done = true; break; }
}
await wait(700);
const b2 = await p.evaluate(() => {
  const bar = document.getElementById('cgBar');
  const track = document.querySelector('.cg-bar');
  return {
    barW: +bar.getBoundingClientRect().width.toFixed(1),
    trackW: +track.getBoundingClientRect().width.toFixed(1),
    pct: bar.style.width,
    now: track.getAttribute('aria-valuenow'),
    max: track.getAttribute('aria-valuemax'),
    stats: document.getElementById('cgStats').textContent.replace(/\s+/g, ''),
    states: [...document.querySelectorAll('.cg-card')].map(c => c.getAttribute('data-state')),
    tags: [...document.querySelectorAll('.cg-card .cg-st')].map(e => e.textContent),
    flows: document.querySelectorAll('.cg-flow').length,
  };
});
ok('B3 全部 4 张生成完（依次转「待确认」，流程条收起）', done && b2.states.every(s => s === 'confirm') && b2.tags.every(t => t === '待确认') && b2.flows === 0, JSON.stringify(b2.states));
ok('B4 全部生成完后进度条跑满（100%，与轨道等宽）',
  b2.trackW - b2.barW < 1 && parseFloat(b2.pct) === 100 && b2.now === '4' && b2.max === '4', JSON.stringify([b2.barW, b2.trackW, b2.pct]));
ok('B5 统计随之落定 已生成 4/4 · 待确认 4 · 已确认 0/4', b2.stats === '已生成4/4·待确认4·已确认0/4', b2.stats);

/* 重新生成：清零后从第一张再来 */
await p.click('#cgRegen');
await wait(400);
const b3 = await p.evaluate(() => ({
  stats: document.getElementById('cgStats').textContent.replace(/\s+/g, ''),
  first: document.querySelector('.cg-card').getAttribute('data-state'),
  barW: +document.getElementById('cgBar').getBoundingClientRect().width.toFixed(1),
}));
ok('B6 「全部重新生成」清零并回到第 1 张生成中', b3.first === 'running' && b3.stats === '已生成0/4·待确认0·已确认0/4' && b3.barW < 40, JSON.stringify(b3));

/* ---------- C 选择本地仓库：稿面文件夹图标 + 文字 #1F1F1F + 真实文件夹选择 ---------- */
const c1 = await p.evaluate(() => {
  const pick = document.querySelector('.cg-pick');
  const svg = pick.querySelector('svg');
  const t = pick.querySelector('.cg-pick-t');
  const r = pick.getBoundingClientRect();
  return {
    vb: svg.getAttribute('viewBox'),
    paths: svg.querySelectorAll('path').length,
    d0: (svg.querySelector('path') || {}).getAttribute ? svg.querySelector('path').getAttribute('d').slice(0, 26) : '',
    w: Math.round(r.width), h: Math.round(r.height),
    txtColor: getComputedStyle(t).color, icoColor: getComputedStyle(pick.querySelector('.ico')).color,
    label: t.textContent,
    dirInput: !!pick.parentNode.querySelector('input.cg-dir[webkitdirectory]'),
  };
});
ok('C1 文件夹图标换成稿面 general/folder（48 视框 4 段路径）',
  c1.vb === '0 0 48 48' && c1.paths === 4 && c1.d0.indexOf('M3 40V8q0-1.66') === 0, JSON.stringify(c1));
ok('C2 按钮文字 #1F1F1F（图标仍 #6B6B6B），尺寸 126×28', c1.txtColor === 'rgb(31, 31, 31)' && c1.icoColor === 'rgb(107, 107, 107)' && c1.w === 126 && c1.h === 28, JSON.stringify(c1));
ok('C3 配了隐藏的 webkitdirectory 输入，点击即调起本地文件夹选择', c1.dirInput && c1.label === '选择本地仓库', JSON.stringify(c1.dirInput));

/* 真选一个目录（puppeteer 对 directory input 支持传目录） */
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-repo-'));
fs.mkdirSync(path.join(tmpDir, 'paa-web-local'), { recursive: true });
fs.writeFileSync(path.join(tmpDir, 'paa-web-local', 'a.txt'), 'x');
const inputEl = await p.$('.cg-repo .cg-dir');
let picked = { okPick: false, label: '' };
try {
  await inputEl.uploadFile(tmpDir);
  await wait(300);
  picked = await p.evaluate(() => ({
    okPick: !!document.querySelector('.semi-toast'),
    label: document.querySelector('.cg-pick-t').textContent,
  }));
} catch (e) { picked = { okPick: false, label: 'ERR ' + e.message.slice(0, 60) }; }
ok('C4 选中本地文件夹后按钮文案变成该文件夹名并给出提示',
  /paa-web-local|cg-repo-/.test(picked.label) && picked.okPick, JSON.stringify(picked));

/* ---------- D 两个 select 与按钮之间的竖向间隔线 ---------- */
const d = await p.evaluate(() => {
  const sels = document.querySelector('.cg-sels');
  const div = sels && sels.querySelector('.cg-div');
  const s2 = sels && sels.querySelector('.cg-sel.is-sm');
  const pick = sels && sels.querySelector('.cg-pick');
  if (!div) return { none: true };
  const r = div.getBoundingClientRect(), a2 = s2.getBoundingClientRect(), rp = pick.getBoundingClientRect();
  const cs = getComputedStyle(div);
  return {
    w: +r.width.toFixed(1), h: +r.height.toFixed(1), bg: cs.backgroundColor,
    gapL: +(r.x - a2.right).toFixed(1), gapR: +(rp.x - r.right).toFixed(1),
    order: [...sels.children].map(e => e.className.split(' ')[0]),
  };
});
ok('D1 .cg-sels 内补了 1×16 竖间隔线（#E5E5E5），夹在 select 与按钮之间',
  !d.none && d.w === 1 && d.h === 16 && d.bg === 'rgb(229, 229, 229)' &&
  d.order.indexOf('cg-div') === 2 && d.gapL === 8 && d.gapR === 15, JSON.stringify(d));

/* ---------- E 已确认的变更分析卡 hover 变白 ---------- */
const e1 = await p.evaluate(() => {
  const el = document.querySelector('a.cg-step');
  const r = el.getBoundingClientRect();
  return { bg: getComputedStyle(el).backgroundColor, cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
});
await p.mouse.move(e1.cx, e1.cy);
await wait(320);
const e2 = await p.evaluate(() => getComputedStyle(document.querySelector('a.cg-step')).backgroundColor);
ok('E1 已确认变更分析卡 默认灰壳 #F7F7F7、hover 变白 #FFFFFF',
  e1.bg === 'rgb(247, 247, 247)' && e2 === 'rgb(255, 255, 255)', JSON.stringify([e1.bg, e2]));

/* ---------- F 无溢出 / 无脚本报错 ---------- */
const f = await p.evaluate(() => {
  const col = document.querySelector('.cg-col');
  const de = document.documentElement;
  return { colOver: col.scrollWidth - col.clientWidth, docOver: de.scrollWidth - de.clientWidth };
});
ok('F1 中栏与文档均无横向溢出', f.colOver <= 1 && f.docOver <= 1, JSON.stringify(f));
ok('F2 无脚本报错', p.__e.length === 0, p.__e.slice(0, 2).join(' | '));

console.log('\n第 84 轮：' + pass + '/' + (pass + fail.length));
if (fail.length) { console.log('FAIL:'); fail.forEach(x => console.log(' - ' + x)); }
await b.close();
process.exit(fail.length ? 1 : 0);
