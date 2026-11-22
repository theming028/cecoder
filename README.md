# Cecoder 工作台原型（高保真静态原型）

Cecoder 桌面工作台的交互原型，按 MasterGo 设计稿 1:1 还原。纯静态：HTML + CSS + 原生 JS，无构建依赖即可打开（`tools/` 里的脚本仅用于重新拼页与自动化验收）。

## 一、先看效果（零配置）

直接双击打开下面三个文件即可（Chrome / Edge）：

| 文件 | 是什么 |
|---|---|
| `cecoder-home.html` | 首页：任务发起、快捷入口、工作目录 |
| `cecoder-session.html` | 会话页：左栏任务列表 + 对话流 + 右栏（变更 / 文件） |
| `cecoder-task.html` | 任务执行页：任务信息 / 工序进度 / 工序资产 + 专注模式 |

建议窗口宽度 1440 及以上看完整形态；布局在 960 / 1100 / 1200 / 1440 / 1920 都做过回归。

## 二、目录结构

```
Cecoder/
├── cecoder-home.html          ← 产物（构建生成，不要手改）
├── cecoder-session.html       ← 产物
├── cecoder-task.html          ← 产物
├── assets/
│   ├── tokens.css             设计 Token（颜色 / 圆角 / 阴影 / 动效曲线）
│   ├── app.css                全站样式（按页面分段落，带轮次注释）
│   └── app.js                 全站交互（抽屉 / 页签 / 工序条 / 专注模式 …）
├── src/                       ← 真源码：页面被拆成 14 个片段
│   ├── top.html  drawer.html  panelmain.html  chathead.html
│   ├── rightpanel.html  taskview.html  stageopen.html
│   ├── homeA.html  chat.html  homeB.html  composer.html
│   ├── closemain.html  floats.html  tail.html
├── cecoder-design-system/     设计系统（Token / 组件 / 样例，独立可查）
├── tools/                     构建与自动化验收
│   ├── build-pages.mjs        片段 → 三个 html
│   ├── layers/                MasterGo 抓下来的图层数据（几何 / 样式，改版时对照用）
│   ├── verify*.mjs            分轮验收脚本（第 5 ~ 37 轮，共 34 个）
│   └── package.json           仅两个依赖：puppeteer-core / @mastergo/magic-mcp
├── COMPONENTS.md              组件与交互清单（组件、状态、坑位说明）
├── PLAN.md                    逐轮改动记录（每轮改了什么、为什么、怎么验的）
└── reference/                 过程截图（各轮视觉核验留档，可删）
```

## 三、改代码的正确姿势

**不要直接改 `cecoder-*.html`。** 它们是 `src/` 片段拼出来的，下次构建会被覆盖。

```bash
# 1) 改 src/ 下的片段，或 assets/app.css、assets/app.js
# 2) 重新拼页（在项目根目录执行）
node tools/build-pages.mjs
# 3) 刷新浏览器
```

样式规范（重要）：

- 颜色 / 圆角 / 动效曲线一律走 `assets/tokens.css` 里的 CSS 变量，**不写硬编码 hex**；
- 动效统一曲线 `cubic-bezier(.2,.8,.2,1)`，抽屉、折叠、工序条都用同一条，改时长请三块一起改（`PLAN.md` 第 37 轮记过：只改一块会出现“卡顿感”）；
- 新增元素注意层叠上下文：`.task-top` 与 `.menu-btn` 都在 z 9，DOM 靠后的会把前面的压掉。

## 四、跑自动化验收（可选）

验收脚本用真实 Chrome headless 量几何、取像素、点交互，比肉眼靠谱。

```bash
cd tools
npm install                      # 装 puppeteer-core（约 75MB，不含 Chrome 本体）

# 回到项目根目录执行
cd ..
node tools/verify37.mjs          # 第 37 轮（本轮最新）
node tools/verify36.mjs          # 工序条居中 / 滚动条 / 折叠
node tools/verify25.mjs          # 会话页整体
# 全部 34 个：
for f in tools/verify*.mjs; do node $f; done
```

脚本约定：

- 必须在**项目根目录**执行（内部用 `process.cwd()` 当根）；
- 要本机有 Chrome，默认找 `C:/Program Files/Google/Chrome/Application/chrome.exe`，换路径用 `CHROME_PATH` 环境变量；
- 根目录想换别处用 `CECODER_ROOT`。

## 五、本轮（第 37 轮）完成的改动

1. 「全链路」改名「任务信息」；
2. 工序条折叠/展开改成与左右栏抽屉同一条弹性曲线，三块（工序条 / 页签条 / 内容区）同步运动；
3. 左栏收起后，顶栏左侧让出菜单键位（否则没有入口再展开左栏）；
4. 页签条右侧改为**专注模式**：进入后收走左栏、右栏、顶栏、工序条，只留页签条；按钮或 `Esc` 退出并还原左右栏原状；
5. 会话页 `chat` 的左右 32px 是**外间距**（margin），输入卡 `.c-card` 同样 32px，两者左边缘对齐。

逐轮的完整改动记录见 `PLAN.md`（模块 1 ~ 187）。

## 六、这份交付里没有的东西

- `node_modules`（在 `tools/` 里 `npm install` 自己装）
- `.token`（MasterGo 抓稿凭证，属个人凭据，未包含）
- 调试期的临时脚本与 Chrome 用户目录（`cdp-profile*`），跟产品无关

## 七、关于这个仓库

- 仓库内容 = 上面这份交付包（`tools/` 里是可直接跑的构建与验收脚本）。
- `.mg-d2c/` 是本地调试工作区（Chrome 用户目录、抓稿凭据、过程截图，约 150MB），已 `.gitignore`，不入库。
- 历史是**一次性全新提交**，没有保留过程 commit。
