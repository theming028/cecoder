/* 交付版：路径改为运行时推断（在项目根目录执行 node tools/xxx.mjs 即可） */
const BASE = (process.env.CECODER_ROOT || process.cwd()).replace(/\\/g, '/');
import fs from 'node:fs';
import path from 'node:path';

const ROOT = BASE;
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const P = {
  top: R('src/top.html'),
  drawer: R('src/drawer.html'),
  panelmain: R('src/panelmain.html'),
  chathead: R('src/chathead.html'),
  rightpanel: R('src/rightpanel.html'),
  taskview: R('src/taskview.html'),
  /* 第 77 轮修：任务页右栏「AI 协作」（第 68 轮稿 3347:52836）—— 之前只存在于产物 html 里，
     src 缺失导致重建时整栏丢失，现单独成片段、按 side 槽位插在 panel-main 之后 */
  aiside: R('src/aiside.html'),
  stageopen: R('src/stageopen.html'),
  homeA: R('src/homeA.html'),
  chat: R('src/chat.html'),
  homeB: R('src/homeB.html'),
  composer: R('src/composer.html'),
  closemain: R('src/closemain.html'),
  floats: R('src/floats.html'),
  tail: R('src/tail.html'),
  /* 第 76 轮：任务总结工序页 + 任务智能派发弹窗 */
  summaryview: R('src/summaryview.html'),
  dispatch: R('src/dispatch.html'),
  /* 第 80 轮：UI设计工序专属页（中栏空） */
  uiview: R('src/uiview.html'),
};

/* 会话页 / 任务页沿用 is-chat 那套「单卡输入区」样式，但不需要 hero 等首页块 */
const stageChat = P.stageopen.replace('class="stage"', 'class="stage is-chat"');
const pmChat = P.panelmain.replace('class="panel-main"', 'class="panel-main is-chat"');

function wrap({ title, page, body }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<link rel="stylesheet" href="assets/tokens.css" />
<link rel="stylesheet" href="assets/app.css" />
</head>
<body data-page="${page}">
${body}
<script src="assets/app.js"></script>
</body>
</html>
`;
}

/* pm 之后、stage 之前还可以插一块（会话/任务的标题栏必须挂在 panel-main 上，
   不能塞进 stage —— 否则会和滚动内容叠在一起）。
   第 31 轮：side = 会话页右栏，必须挂在 panel 内、panel-main 之后（flex 挤压），
   所以关闭 panel-main 的 </div> 由这里显式给出，不再用 closemain 的两个连写。 */
const CLOSE_STAGE = '  </div><!-- /stage -->';
const CLOSE_PM = '  </div><!-- /panel-main -->';
const chrome = (pm, pre, stage, main, side, extra) =>
  [P.top, P.drawer, pm, pre, stage, main, P.composer,
   CLOSE_STAGE, CLOSE_PM, side || '', P.floats, extra || '', P.tail]
    .filter(Boolean).join('\n');

/* ---------- 1 首页：hero + 场景卡 + 工具栏 + 工序条 + 输入区 ----------
   第 79 轮两处首页独有（远端只改在产物 html 上，重建会丢）：顶栏「首页」带 aria-current、
   输入卡外圈彩色流光 .c-beam 挂在 c-card 与 c-foot 之间 */
const homeBody = chrome(P.panelmain, '', P.stageopen, [P.homeA, P.homeB].join('\n'))
  .replace('<a class="tb-home" href="cecoder-home.html" aria-label="回到首页">',
           '<a class="tb-home" href="cecoder-home.html" aria-label="回到首页" aria-current="page">')
  .replace('      <div class="c-foot">',
           '      <!-- 第 79 轮：卡外圈的彩色流光（装饰层，纯 CSS 动画，不吃事件） -->\n'
           + '      <span class="c-beam" aria-hidden="true"><span class="c-wave"></span><span class="c-wave c-wave--sharp"></span></span>\n\n'
           + '      <div class="c-foot">');
const home = wrap({
  title: 'Cecoder · 落地首页',
  page: 'home',
  body: homeBody,
});

/* ---------- 2 会话页：对话/轨迹 + 对话流 + 输入区 +（可收起的）右栏 ---------- */
const session = wrap({
  title: 'Cecoder · 会话',
  page: 'session',
  body: chrome(pmChat, P.chathead, stageChat, P.chat, P.rightpanel),
});

/* ---------- 3 任务执行页：第 34 轮整体换稿（工序进度模块 · 1140×206） ---------- */
const task = wrap({
  title: 'Cecoder · 任务执行',
  page: 'task',
  body: chrome(pmChat, P.taskview, stageChat, '', P.aiside),
});

/* ---------- 3.5 UI设计工序页：顶栏 + 工序条，中栏留空 ---------- */
const ui = wrap({
  title: 'Cecoder · UI设计',
  page: 'ui',
  body: chrome(pmChat, P.uiview, stageChat, '', '', ''),
});

/* ---------- 4 任务总结工序页：工序条 6 步 + 内容 1024 列 + 派发弹窗 ---------- */
const summary = wrap({
  title: 'Cecoder · 任务总结',
  page: 'summary',
  body: chrome(pmChat, P.summaryview, stageChat, '', '', P.dispatch),
});

for (const [name, html] of [
  ['cecoder-home.html', home],
  ['cecoder-session.html', session],
  ['cecoder-task.html', task],
  ['cecoder-ui.html', ui],
  ['cecoder-summary.html', summary],
]) {
  fs.writeFileSync(path.join(ROOT, name), html, 'utf8');
  console.log(name.padEnd(22), (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
}
