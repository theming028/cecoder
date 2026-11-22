# COMPONENTS — Cecoder 首页组件树

## 复用策略
不引入任何组件库运行时（单文件交付）。原子件以「类 + 设计 token」实现，等价于 Semi Design 的对应组件：

| 自建组件 | 等价 Semi 组件 | 来源节点 | 说明 / 变体 |
| --- | --- | --- | --- |
| `.tb-btn` | Button（`type=tertiary`，带底） | 容器 849 / Link | 100×32、72×32；底 `#F3F6F9` + 描边 `#DEE4ED`；hover 加深 |
| `.tb-ws-btn` | Dropdown + Avatar | 容器 71 | 178×32；20px 方头像（蓝底 `#3491FA`）+ 截断文本 + 12px caret |
| `.seg-item` | RadioButtonGroup | radio-button-group | 轨道 300×32 `#D4DDE7`，轨道内边距 2px，三按钮间距 **2px**：选中 118×28 白底（含图标），未选 86×26；中点分隔线 1×16 @x779 |
| `.chip` | Tag/Link（描边型） | 容器 1367 / 999、Link 组件 | 高 32、描边 `#EEEEEE`、圆角 4、gap 4、内边距 9；**工作台 hover**＝`#F2F2F2` + `#E5E5E5`；**快速任务 hover**＝字 `#5B58FF`（组语义紫）+ 底 `rgba(91,88,255,.06)` + 描边 `rgba(91,88,255,.16)`；**工作台选中真值**（ws-chip）：底 `#F5F8FF` + 1px 实线 `#C7D7FC` + 字/图标 `#3770F7` + 字重 500；**快速任务选中真值**（quick-chip）：底 `rgba(91,88,255,.08)` + 1px 实线 `rgba(91,88,255,.16)` + 字 **`#5B58FF`**（DSL 节点 fill 是 `#1F1F1F`，但 `textColor` 段覆盖为 `paint_2960:44209`）+ 500；`chip-new` 默认 1px dashed `#C9C9C9` + 字/图标 `#868686` + gap 2，**hover 真值**（new-hover）：底 `#F5F8FF` + 仍虚线 `#8EAEFA` + 字/图标 `#3770F7`；**tooltip**：`data-tip` 驱动，`rgba(29,33,41,.8)`、r6、12/20 白字、`4px 12px`、箭头 10×4、间距 6px、280ms 延迟 |
| `.c-attach` | Button（circle） | 组 9153 | 32 圆、描边 `#EEEEEE`、加号图标 |
| `.c-pill` | Dropdown trigger | 容器 895 / 组 9415 | 32 高、圆角 16；`c-perm` 114 宽带描边（11px 内边距），`c-model` 159 宽无描边、两端对齐 |
| `.c-env` | Dropdown trigger（text） | 容器 894 | 28 高、无描边、8px 内边距；图标 14 + 文本 + caret |
| `.cds-dd` / `.semi-select-option-list-wrapper` | Dropdown | — | 点击开合、选中回填、点外部关闭；输入区内向上弹出。**内边距统一 6px、条目间距 2px**（`display:flex; flex-direction:column; gap:2px`），条目 32 高、`0 12px` |
| `.semi-toast` | Toast | — | 交互反馈，1.8s 自动消失 |
| `.scene` | Card（可点击） | 矩形 526 / 容器 1475 | 860×80、底 `#F7F7F7`、描边 `#EEEEEE`、圆角 8；虚线「+」48×48（底 `#FFFFFF`、1px dashed `#C9C9C9`、加号 `#1F1F1F`）。**hover 真值**（layers/scene-hover.json）：底 `#F5F8FF`(Blue1) + **1px dashed** `#B4C9FC`(Blue3)，「+」框同样转 `#B4C9FC`（保持虚线）、底仍白、加号仍 `#1F1F1F`；**无投影、无位移、无右侧箭头** |
| `.float` | FloatButton（数字分身） | 容器 1354 | 56 圆、`rgba(255,255,255,.85)` + blur15 + 阴影；**1px 描边 `rgba(31,31,31,.10)`**（`::after` 覆盖层，不影响 56×56 与内嵌矢量）；**可按住任意拖动**：pointer 事件、4px 判定、8px 边距吸附、拖动后不触发点击 |
| `.c-send` | FloatButton（发送） | 容器 62（home1） | 32 圆 `#3770F7`；图标用设计稿 `extract-svg` 原 path（`viewBox 9.84 10.94 12.32 10.16` + `matrix(0,-1,1,0,-11,31)`，向上箭头），**不是** Semi send 纸飞机 |
| `.ws-drawer` / `.panel-main` | Drawer（**panel 内停靠栏**，320 定宽） | 容器 1674（`3038:44396`） | 抽屉是 `.panel` 的 flex 子项：`width 0→320` 过渡（260ms `cubic-bezier(.2,.8,.2,1)`）**挤压**内容而非浮层，`overflow:hidden` + panel 圆角裁切保证不越界；内层 `.ws-drawer-in` 固定 320 宽防止动画期文字重排；右缘 `1px 0 0 #EBECED`；`.panel-main` 承接内容列，`.stage` 以它为基准重新居中；展开时 `menu-btn` 淡出（收起键由抽屉头接管），无外投影、无点外部关闭 |
| `.wd-head` / `.wd-link` / `.wd-collapse` | 面板头 44 | 容器 1661 | 标题 14/22·500 `#1F1F1F` @16；右侧「新建任务」(＋14，gap 2) + 「云端同步」两枚 `#3770F7` 文字链，间距 12；收起键 28×28（图标＝竖条＋左向角标，`extract-svg` 原件重绘）、左边距 16、右缘 304 |
| `.wd-tabs` / `.wd-tab` | Card Gutter Tabs | 容器 1651 / tabs/card-gutter | 条高 40（上 8 内边距，**整条底 `#F7F7F7`** + `inset 0 -1px #EBECED`）；两枚 142×32、间距 4、`r 4 4 0 0`；选中白底（无下边线，压住 `#E5E5E5` 基线）+ `#3770F7`，未选 `#F7F7F7`；「会话」带 12/22 `#A9A9A9` 计数 |
| `.wd-adddir` / `.wd-icon-btn` | Button（dashed） / IconButton | 容器 1577 / 1574 | 「添加工作目录」208×32、1px dashed `#C9C9C9`、r4、图标 14 + gap 6 + 文本，整体居中；右侧搜索/排序各 32×32（1px `#E5E5E5`、r4、图标 14、间距 8） |
| `.wd-grp` / `.wd-grp-head` / `.wd-sub` | Collapse Row（工作目录文件夹，可展开） | 容器 1603/1599/1662/1600/1597 | 结构 `.wd-grp > button.wd-grp-head[aria-expanded] + .wd-sub`：头部用原生 `button`（披露控件语义，键盘/读屏可用）而不是 div；36 高、左右 12 内边距；名称 12/22（展开态 500）；箭头 12×12（稿件 4.786×8.321 原 path）、名后 4，**展开时 `rotate(90deg)` 转成向下**（200ms）；计数右对齐。底色＝`#F7F7F7`（展开/选中）或 `#FFFFFF`；描边 `inset 0 ±1px #EBECED`，相邻折叠行 `margin-top:-1px` 叠成单线（展开行不叠）；`.wd-sub` 展开后是同一套「虚线新建 + 任务卡」 |
| `.wd-newtask` | Button（dashed） | 容器 1664 / dy2983:44300 | 288×28、1px dashed `#C9C9C9`、r4、＋12 + gap 4 + 12/22 `#3770F7`，上距分组头 8 |
| `.wd-card` | Card（列表项） | 容器 1611/1652/1641/1642 | 288 宽、内边距 12、白底、卡间 4px、`cursor:pointer`、**hover `#F7F7F7`**；标题 14/20·500 最多 2 行（max-width 202）→ 8 → 副标题 12/18 `#6B6B6B` + 右侧 `4/7` 12/18 `#A9A9A9` → 8 → 进度条 2px。单行卡 80 高、双行卡 100 高（12+20×2+8+18+8+2+12） |
| `.wd-chip` | Tag（描边型，20 高） | 容器 1639 / 1640 | 内边距 3 + 1px 描边 + r4 + 12 号字，图标与文字 gap 2：`执行中`=白底/`#DAE4FE`/`#3770F7`＋12 加载弧（1.1s 匀速旋转）；`待确认`=`#FFF3E8`/`#FDDDC3`/`#F77234`；`有风险`=`#FFECE8`/`#FDCDC5`/`#F53F3F`；`未开始`=白底/`#E5E5E5`/`#6B6B6B` |
| `.wd-more` / `.wd-bar` | IconButton 20 / Progress | 路径 / 矩形 523-529 | 更多 20×20（1px `#E5E5E5`、r4、`extract-svg` 三点）；进度条 264×2、flex 分段、gap 2、r2，已完 `#57A9FB`（blue-5）未完 `#E5E5E5`，`0/2` 按稿件不画段 |
| `.wd-empty` | Empty | 容器 1659/1658 | 132 定宽居中，上距末组 24；`该目录下还没有任务` 12/20 `#1F1F1F` → 8 → 「新建任务」12/20 `#868686` + 「同步云端任务」`#6B6B6B`，间距 12 |
| `.wd-thumb` | 自绘滚动条 | 矩形 219 | 6×自适应、右距 4（x 310..316）、`rgba(0,0,0,.16)`、r6、可拖拽；原生滚动条隐藏，`scrollHeight<=clientHeight` 时不显示 |
| `.wb-bar` | Card（子项选择容器） | 容器 1591（`dy2983:48726` · 860×56） | 选中工作台「通用」后挤出：底 `#F7F7F7`、r8、**`inset 0 0 0 1px #EEEEEE` 当描边（不占布局宽度，内容正好落在 12）**；「选择子项」14/22·500 @ (12,17)；子项 chip 高 32（`0 12` · 1px `#E5E5E5` · r4 · 14/24），间距 8，选中 `#F5F8FF`/`#C7D7FC`；关闭 24×24 绝对定位 (828,8) |
| `.qf-bar` | Card（推荐工序容器） | 容器 1498（`2960:44863` · 860×82） | 选中快速任务后挤出：底 `#F7F7F7`、r8、同款 inset 描边；标题「技术任务 · N 道」12/22 `#1F1F1F` + 「推荐工序」12/22 `#868686`（间距 4）@ (12,12)；工序条 @ (12,46) 836×24：chip 高 24（`0 8` · r4 · 白底 + `0 1px 2px rgba(0,0,0,.08)` · 12/22），首项 `#1F1F1F` 其余 `#868686`，间隔箭头 16×16、间距 2，可横向滚动（可滚时右侧 6% 渐隐蒙版）；编辑/关闭 24×24 @ (800,8)/(828,8) |
| `.c-card` | 输入卡 | 矩形 207 / 矩形 246 | 860×128、r8；默认底白 + 1px `#E5E5E5` + `0 1px 4px rgba(0,0,0,.04)`。**激活态**（home7/8 矩形 246 真值）：描边 `#C9C9C9` + `0 0 0 4px rgba(0,0,0,.05)` 外环 |

## 品牌矢量（直接取自 DSL path，未手绘）
- 版本号 CECODER 字标：`容器 1404 / 路径`，66×12 viewBox，`currentColor` 填充 `#A9A9A9`。
- 悬浮球 logo：`容器 1354` 两段 path —— 半透明白圆 + 渐变字形 `linear-gradient(127deg,#39C8FC 7%,#1B78FE 96%)`。
- 图标复用 Semi Icons 的 24 网格 path（菜单、加号、显示器、文件夹、问号、齿轮、caret）；**发送箭头例外**，用 `extract-svg` 导出 `容器 62` 的设计稿原 path。

## 交互态真值来源（MasterGo DSL 直取）
`.mg-d2c/fetch-dsl.mjs` 走 `GET https://mastergo.com/mcp/dsl?fileId&layerId` + `X-MG-UserAccessToken`，把交互态图层落成 `layers/*.json`：

| 文件 | layer | 用途 |
|---|---|---|
| `layers/scene-hover.json` | `2960:44433` | 场景卡 hover |
| `layers/ws-chip.json` | `dy2983:48053` | 工作台 chip 选中 |
| `layers/quick-chip.json` | `nk2868:58658` | 快速任务 chip 选中 |
| `layers/new-hover.json` | `nk2868:57925` | 新建 chip hover |
| `pages/home6.json` | `nk2868:57819` | tooltip 规范（Tooltip-center 72×28 / 箭头 10×4） |
| `pages/home7.json` · `home8.json` | `nk2868:58572` · `2960:44323` | 输入卡激活态（矩形 246：`#C9C9C9` + 4px 外环） |
| `layers/workside.json` | `3038:44396` | 工作任务列表侧栏整幅（320×852，含分组/卡片/空态/滚动条） |
| `layers/ws-general.json` | `dy2983:48726` | 工作台「选择子项」容器（860×56，含 4 个子项 chip 选中态） |
| `layers/quick-flow.json` | `2960:44863` | 快速任务「推荐工序」容器（860×82，含 8 道工序 chip + 箭头 + 编辑/关闭） |

重抓：`node .mg-d2c/fetch-dsl.mjs --all`（令牌放 `.mg-d2c/.token`）。色值 token：`--cds-blue-1 #F5F8FF` / `--cds-blue-3 #B4C9FC` / `--cds-blue-4 #8EAEFA` / `--cds-blue-chip #C7D7FC`，主色 `#3770F7`。

## 响应式布局规则（不再锁 1440）
- 画框：`100% × 100vh`，`min 960×700`；面板 `left/right 8 / top 48 / bottom 0`。
- 内容列：`width: min(860px, 100vw - 120px)`，水平居中；输入卡 `left/right 0`、背板 `left/right 12`、文字域 `left/right 11`。
- 纵向：Hero 顶部 `clamp(150px, 22vh, 240px)`（900 高时=198）；工具行/输入区/版本号**锚定底部**（底部距 8px），中间用 `flex:1` 弹簧吸收高度差。
- 顶栏：分段控件 `left:50%` 居中，右侧按钮贴面板右缘，工作空间贴左侧。

## 动效规范
- 标题「从一个想法开始」：逐字（`--i` 48ms 步进）`translateY(18px)+scale(.94)+blur(8px)` → 归位，叠加一次蓝色扫光（`background-clip:text` 渐变位移）；下方 2px 蓝色光条单次划过；副标题延后 620ms 淡入。`prefers-reduced-motion` 下全部降级为静态。
- 悬浮球可拖动；`overflow:hidden` 下用 `::after` 画描边环，避免 1px border 挤压 56px 矢量。

## 构建顺序（改版时的安全顺序）
token（`:root` 补充灰阶）→ 画框/面板 → 顶栏原子（tb-btn / seg-item / tb-ws-btn / chip）→ Hero → 场景卡 → 工具栏 → 输入区（附件 / 药丸 / 发送 / 次级行）→ 版本号 → 悬浮球。

## 校验
`node .mg-d2c/verify.mjs`：39 个关键盒模型与稿件绝对坐标对照（容差 1px），并额外跑 1920/1600/1280/1024/960 五档自适应检查。
`node .mg-d2c/zoom.mjs`：出 2x 局部放大图（顶栏/分段/场景/输入区/次级行/悬浮球）。
`node .mg-d2c/shot.mjs`：出 1440×900 整页图。
`node .mg-d2c/wd-verify.mjs`：侧栏 35 项盒模型对照（头/Tab/工具行/分组/卡片/chip/进度条/滑块），当前 33 项完全命中，2 项差异仅因本机无 MiSans（文字宽度）。
`node .mg-d2c/wd-inter.mjs`：侧栏开合与滚动条行为（菜单键开、点外部关、Esc 关、收起键关、滑块随滚动位移）。

## 第 6 轮新增（工作台看板 / 同步模态 / 侧栏拖宽）

### 侧栏可拖宽 + 记忆
- 结构：`.ws-drawer` 内加 `.ws-resizer`（右缘 5px，`cursor:col-resize`，`role=separator`）。宽度走 CSS 变量 `--ws-w`，`.ws-drawer-in` 同宽承接，抽屉仍是「挤压式」不浮层。
- 范围 `300 ~ 480`（默认 320）；拖拽时加 `.is-resizing` 关闭全部宽度过渡，松手写 localStorage。
- 键盘：`←/→` 16px 步进（`Shift` 32），`Home/End` 到两端。
- 记忆键 `cecoder.wsDrawer = {open:boolean, w:number}`。解析阶段用 `</aside>` 后的内联脚本还原（`is-open` + `no-anim`），下一帧再撤 `no-anim`，避免首屏「先收后开」闪动。
- 因宽度可变，工具行 `.wd-adddir` 改 `flex:1 1 auto; min-width:0`，卡片标题/分组名去掉固定 `max-width` 改 `min-width:0 + ellipsis`。

### 工作台 chip：图标只在选中态出现
稿件 `dy2983:48499`（容器 1589 · 416×32）给了 6 个 chip 的选中形态：66×32 · 1px `#C7D7FC` · 底 `#F5F8FF` · 字/图标 `#3770F7` · 字重 500 · 图标 14 于 x=10、文字于 x=28。
实现：每个 chip 内置 `<span class="ico ico14 chip-ico">`，`.chip-ico{display:none}`、`.chip.is-active .chip-ico{display:inline-flex}`。
算式校验：未选中 `28+9×2+2=48`；选中 `1+9+14+4+28+9+1=66`（与稿一致，无需改 padding）。
6 个图标 viewBox 统一为 `0 0 14 14`（原图是紧贴字形 bbox，直接塞 14 框会整体放大约 14%），路径坐标本就落在 0~14 的框内。

### 场景卡三态（idle 80 / 看板 192 / 折叠 60）
| 态 | 尺寸 | 结构 |
|---|---|---|
| `data-state="idle"` | 860×80 | `.sc-idle`：48 虚线加号 + 标题/副标题，整卡可点 |
| `open` | 860×192 | `.sc-dash`：头 48（标题 16/24 + 副 12/20 `#868686`）+ 16 + 卡行 88 + 20 |
| `collapsed` | 860×60 | 头压成单行 28（标题与副标题同行，副标题 x=108），卡行隐藏 |

- 稿 `2960:48845`：底 `#F7F7F7` + 1px `#EEEEEE` + r8；4 张指标卡 143×88 白底 r8 + 1 张图表卡 200×88，间距 12，左右内边距 20。
- 指标卡：`padding:8px 20px`，标签 12/20 `#6B6B6B` → 数值 20/28 600 `#1F1F1F`（风险项 `#F53F3F`）→ 说明 12/20 `#868686`，行距各 2。
- 图表：`extract-svg` 导出整卡（viewBox 改 `0 0 200 88`，含网格/折线/面积），叠一个 4px 蓝描边数据点；标题 HTML 定位 `left:20 top:8`。
- 操作区：`分身建议 / 更多数据` 90×28 白底 r4（图标 14 + gap 4 + 文字 + padding 8），折叠键 28×28。
- 折叠箭头：看板态朝上（收起），折叠态 `rotate(180deg)` 朝下——稿件两态都放了 `direction/up` 实例，按交互语义改。
- 窄列兜底：`@container (max-width:620px)` 时隐藏图表卡、指标卡 padding 收到 12，避免「工序完成率」被裁（960 + 抽屉展开时内容列仅 502）。

### 云端任务同步模态（`2983:54273` / `dy2983:45478`）
- 面板 1080×804（`min(1080, 100vw-80) × min(804, 100vh-96)`），r8，遮罩 `rgba(0,0,0,.4)`；头 48 / 体 700 / 脚 56。
- 左栏 320 满贴 `#F7F7F7`：`20` 内边距 + 「云端任务」分割线 22 + 5 张 280×70 任务卡（间距 4）+ 底部 48 白条（`全选/反选` + `共 N 项，已选 M 项`）。
- 任务卡：当前行 `#F5F8FF` + 1px `#B4C9FC`，其余白底 + `0 1px 2px rgba(0,0,0,.08)`；勾选框 14 r2（选中 `#3770F7`，未选白底 + 1px `#C4C7C9`）；标题 14/22（当前行 500）；状态签 44×20 r4（进行中 `#3770F7` on `#F5F8FF`，未开始 `#6B6B6B` on 白 + 1px `#E5E5E5`）。
- 右详情 680：标题行 16/24 + 状态签 + `TASK-…` 12/20；tabs 40（间距 24，active 蓝字 + 2px 下划线）；内容上距 32；字段行「标签 56 / 值 600」+ 8px 下内边距 + 1px `#EEEEEE` 分割。日志 tab 为时间轴（6px 圆点 + 正文 + 时间），资产为空态，工序为只读 chips。
- 脚按钮居中（稿：取消 @444、开始同步 @532）：取消 76×32 白底 + 1px `#E5E5E5`；主按钮 104×32 `#3770F7`，同步中 `#B4C9FC` + 14px 转圈 + 「同步中」。
- 交互：行点选=设为当前并勾上；勾选框只切勾选；`全选/反选` 按「是否全选」切换文案；同步 1.6s 后顶部居中弹 Message（`top:56`，白卡 + 图标 20 + 14/22 500，成功黑字/失败 `#F53F3F`）；重复同步走失败态。
- Esc 用捕获阶段监听：先关模态，不再连带关侧栏。

## 第 7 轮（分段滑动 / 卡片选中 / 互斥 tab / 动效细节）

### 顶栏分段控件：底板滑动
- 稿件结构（`任务 - 3` · `radio-button-group` 300×32，底 `#D4DDE7`，r8）：三段 **120 / 88 / 88，间距 0**，内边距 2；选中项 120×28 白底 r6（padding 16 + 图标 14 + gap 4 + 文字 70），未选中 88×26（文字 56 + padding 16×2）。
- 实现：`.tb-seg` 内加一层 `.seg-pill`（绝对定位，`left:2 top:2`，r6，白底），JS 按当前 `.seg-item` 的 `offsetLeft/offsetWidth` 写 `translateX + width`，过渡 `.3s cubic-bezier(.22,.85,.2,1)`；按钮自身只换字重，不再铺底 → 切换是「底板滑过去 + 宽度变」。
- 首次定位用 `.no-anim` 掐掉过渡（避免首屏从 0 滑入）；`resize` 与 `document.fonts.ready` 各校准一次（字体换宽后位置会偏）。
- 层级：`.seg-div`(0) < `.seg-pill`(1) < `.seg-item`(2)，分隔线不会被画到白色底板上。

### 工作台 / 快速任务两组互斥
- `[data-chips]` 点击时先把**另一组**的 `.is-active` 全部清掉，再落自己的选中；`.chip-new` 不参与。`syncBars()` 随之为两个容器开合。
- 语义：这是「一个任务只能属于一种入口」——要么选工作台（通用/需求/…），要么选快速任务（技术任务/缺陷修复/…）。

### 任务卡选中（`wd-card`）
- 真值：`任务 - 1` 首卡 `矩形 259` = **#3770F7 @ opacity .11**，r4（压在白底上 ≈ `#E9EFFE`）。
- 实现：`.wd-card.is-sel{background:rgba(55,112,247,.11)}`，hover `.16`；整栏单选（点另一张会接管），再点自己取消。`aria-pressed` 同步；卡片支持 Enter/Space。默认不预选。

### 侧栏细节
- **展开态才有灰底**：`.wd-grp-head.is-tint` 静态类删掉，改成 `.wd-grp.is-open > .wd-grp-head{background:#F7F7F7}`，同时字重 500 + 箭头转主色；折叠态一律白底（hover 仍是 #F7F7F7）。
- **文字↔箭头 4px**：`.wd-grp-name` 由 `flex:1 1 auto` 改 `flex:0 1 auto`，箭头 `margin-left:4px; flex:0 0 auto`，数字继续 `margin-left:auto` 贴右。原来名字吃掉整行，箭头被顶到最右边。
- **「有 1 项待确认」是橙色**：该文本节点 `fill=#6B6B6B` 但 `textColor = paint_13:1125 = #F77234`，取 textColor → `.wd-num.is-todo{color:var(--cds-orangered-6)}`。
- **`wd-newtask` 的加号是灰的**：`tips/plus` 的 Vector 填 `paint_1204:26804 = #6B6B6B`，只有文字 #3770F7（与头部全蓝的「新建任务」链接不同）；size 288×28、r4、1px dashed #C9C9C9、内容 [12][4][12/22 文字] = 64 居中（x=112）。hover 才转蓝底 + 蓝虚线（`blue-1` / `blue-3`）。

### 进度条入场动效（`wd-bar`）
- `.wd-bar.is-anim i{animation:wdBarGrow .46s cubic-bezier(.22,.8,.2,1) both}`，逐段 `animation-delay`（0/45/…/270ms），`transform-origin:left` 让每段从自身左缘长出去，读起来像一次从左到右的填充。
- 触发：`openDrawer()` 里 120ms 后 `growBars()`（先摘类 → 强制 reflow → 再加，保证可重放）；`closeDrawer()` 摘类复位；记忆为「展开」时首屏 160ms 也放一次。`prefers-reduced-motion` 下不播放。

### 其它
- `sc-metric` / `sc-chart` 补 `0 1px 2px 0 rgba(0,0,0,.08)`（稿件 `effect_6:097` · shadow-special）。
- `c-env` 悬停/展开各深一级：hover `--cds-fill-hover`(#E7ECF2)、展开或按下 `--cds-fill-active`(#DAE3ED)，原来是 fill-0 `#EEEEEE`。

## 第 8 轮（tab 底线 / 文字色 / 动效 / tooltip / 模态线）

### 侧栏双 Tab：非选中态补底线
- 稿 `tabs/card-gutter [16,52 288x32] bd=#E5E5E5 w0px 0px 1px` —— 底线在 gutter 上，两个 tab 自己 `w1px 1px 0px`（只有上/左/右）。
- 之前用 `.wd-tabs::before` 画整条线，但 `.wd-tab` 有 `z-index:1`，线被压在 tab 底下（且 tab 不透明），看着就是「非选中 tab 悬空」。改成：容器 `inset 0 -1px #E5E5E5` + 非选中 tab `box-shadow: inset 0 -1px 0 0 #E5E5E5`，选中态 `box-shadow:none` —— 白底自然把线压掉，形成「贴着内容」的活页效果。

### `wd-newtask` 默认文字是灰的
- 文字节点 `dy2983:44301` 的 `fill=#3770F7` 但 **`textColor = paint_1204:26804 = #6B6B6B`** —— 以 textColor 为准。加号同色，hover 才一起转 `#3770F7`。
- 于是这个按钮和抽屉头部那个「+ 新建任务」链接（全蓝 14px）是两种东西，别复用同一套颜色。

### `sc-acts` 三个按钮补投影
- 稿 `nk2868:58002` / `nk2868:58011`（90×28）+ `2960:48843`（28×28）都挂 `effect_6:097` = `0 1px 2px rgba(0,0,0,.08)`，与指标卡同源。

### 看板入场动效
- 数字：`data-count` + `data-suffix`，`requestAnimationFrame` 里 easeOutCubic（1-(1-p)³，720ms），`font-variant-numeric: tabular-nums` 防抖宽。
- 折线：`.sc-chart > svg:not(.sc-chart-dot){clip-path:inset(0 100% 0 0)}`，展开时 `animation: scChartDraw 860ms` 推到 `inset(0)`；数据点 `transform-box:fill-box` + `scale(0→1)` 在 820ms 弹一下。
- 重播套路同进度条：摘 `is-drawing` → `void offsetWidth` → 加回；`prefers-reduced-motion` 下三条规则全部 `none` 并直接落终值。

### 六套「选择子项」
- 「通用」= 稿件原文（PPT 编写/汇报材料/思路整理/挑战我）；其余五台按同一体系补：需求（澄清/用户故事/验收标准/竞品对标）、架构（技术选型/系统设计/数据模型/接口契约）、交互（流程梳理/原型说明/状态与异常/文案打磨）、开发（编码实现/代码审查/重构治理/单测补齐）、测试（用例设计/缺陷复现/回归清单/性能验证）。
- `wbRender()` 动态渲染，`wbPick[tab]` 记住每台各自的选中项；切台只重建列表，容器高度恒 56 不跳动。

### 图标按钮 tooltip（body 级单例）
- 抽屉是 `overflow:hidden`，伪元素气泡会被裁（尤其收起键贴着右缘）。改成 `.cds-tip` 单例 append 到 body，`position:fixed` 由 JS 算位置：优先上方，空间不足转下方，水平夹在 8px ~ vw-8。
- 280ms 延迟与 chip 一致；`focusin` 也弹（无障碍）。触发选择器 `[data-tip]:not(.chip)`，chip 仍走纯 CSS 那套。
- 文案随状态走：`scFold` 折叠看板 ↔ 展开看板（`setScene` 里同步 `data-tip`）；`wd-collapse` 收起任务列表；`menu-btn` 展开任务列表。

### 收起任务列表图标重绘
- 稿 `联集 5` 是「竖条 + 左向角标」的并集，路径自带 `matrix(0,1,-1,0,45.86,-29.86)`，直接取 bbox 会被实例的非等比缩放带偏（算出 4.45×8.12）。
- 按报告尺寸 **9.33×8.12** 重画：竖条 1.3×8.12（r0.65）于 x=2.31，角标 `M10.9 3.55 L5.95 7 L10.9 10.45` 描边 1.3 圆角。两者等高，视觉即「|‹」。

### 分组名与箭头对齐
- 真凶是图标 16 的 `viewBox="-3.607 -1.839 12 12"`：字形在框里偏下 1.87px。归一成 `0.268 0.036 12 12`（把字形 bbox 中心放到框中心）后，文字与箭头中心差从 2.4px 收到 **0.5px**。

### 空态文字
- 标题 tc = `paint_1204:26645 = #A9A9A9`；两个动作 tc 都是 `#6B6B6B` 且 **`decoration: underline`**（原来第一个是 #868686、且都没下划线）。

### 模态三条线
- `cm-head` ← 矩形 204 `inset 0 -1px #EBECED`；`cm-foot` ← 矩形 221 `inset 0 1px #EBECED`；`cm-left` ← 矩形 541 `inset -1px 0 #EBECED`（整列 700 高）。
- 一律用 inset shadow，不加 `border`，否则 1080×804 的盒模型会各差 1px。

## 第 9 轮（整卡展开 / 输入撑高 / 搜索排序 / 分身表情）

### 看板折叠 = 整卡按钮
- `.scene[data-state="collapsed"]` 时补 `role="button"`、`tabindex="0"`、`aria-label="展开用户洞察看板"`、`cursor:pointer`，展开后全部收回（避免和卡片自己的按钮语义打架）。
- 点击处理里先 `closest('.sc-btn, .sc-fold')` 放行——折叠键自己还要能收起，不能被整卡点击立刻弹回。

### 侧栏首目录折叠后的间距
- 原来 12px 是 `.wd-groups` 的段落间距（首目录 vs 其余目录）。折叠后仍是 12px，看起来像两种元素。
- 现改为：`.wd-scroll > .wd-grp:not(.is-open) + .wd-groups { margin-top: 0 }` + 首个 `.wd-grp` `margin-top:-1px`，和其余折叠目录一样叠成一条线；JS 折叠时同步补 `is-edge`。

### 输入框自动撑高（`--ci-h`）
- 一个变量驱动四件事：`.c-input` 高、`.c-card` 高（+82）、`.c-row` 顶（+37）、`.c-foot` 顶（+88）、`.composer` 高（+122）。默认 46 = 两行，上限 256。
- 测量用 `height:auto` → `scrollHeight` → clamp，再写回 inline 高度；发送/清空后回落。
- 底边不动是靠 `.stage` 的 flex 弹簧：composer 变高 → spacer 变矮 → 上面所有内容整体上移。

### `c-env` 底色与图标
- hover `#E6E6E6` / 展开 `#DADADA`（token `--cds-gray-hover` / `--cds-gray-active`），中性灰而不是原来的蓝灰 `#E7ECF2`；展开时箭头 `rotate(180deg)`（稿里 `direction/down` 带 rotate 180）。
- 图标真值：本地 = 14×14 云朵（`2958:43820`），工作目录 = `general/folder`（`1204:55166`，4 个 path）。原来两个都错用了「收起面板」图标。

### 工具行三件套
- **添加工作目录**：`showDirectoryPicker()`（拿真实目录名）→ 失败退回 `input[webkitdirectory]`；新增分组复用同一套 DOM 结构与 `bindGrpHead`，空态按钮手动补事件（克隆节点不带监听）。
- **搜索**：`2983:52581` 288×32 白底 + `box-shadow: 0 0 0 1.6px #6692F9`（不占盒模型）；左 12 放大镜、4px 后文字、右 12 收 16 的 `close-circle-fill`。输入实时过滤（卡 `display:none` + 整组无命中则隐藏整组），× 或 Esc 复原。
- **排序**：右对齐菜单（白底 r8 + `shadow-elevated`，选项 32 高），`aria-checked` 打勾；卡上 `data-created` / `data-updated`（分钟数）组内倒序重排；非默认顺序时排序按钮 `is-on` 转主色。

### 数字分身的表情
- 图形本身是「脸」：两条竖杠是眼、下面横杠是下巴。补三层：眼睑（白色圆角块，`scaleY(0)→1` 从上往下拉闸）、^^ 笑眼（两条弧）、微笑嘴（`stroke: url(#cdsFloatGrad)`）。
- 两层 `<g>` 各管一个 transform：`.fab-outer` 待机呼吸，`.fab-body` 点头/摇头；蹦跶在 `.float` 上做（整球离地 + 落地压扁 + 二次弹跳）。
- JS 调度：眨眼 3.2~7s 随机；5.2~10.4s 随机抽一个动作；hover 点头、click 开心；`prefers-reduced-motion` 全关。

### 撑高时的「装不下」兜底
- `ciGrow` 先压到 46 量出弹簧富余：`maxFit = 46 + (spacer 高 - 24)`，取 `min(256, maxFit)`，保证输入卡底边永远不越出面板块底边（1440×900 看板展开时上限约 217，看板收起时才是完整 256）。
- 小窗里内容列本来就要滚（`max-height:820px` 时 `.stage` 可滚），此时放行完整 256，并用 `ciReveal()` 把输入卡滚进视野，避免对着看不见的输入框打字。

### 分身「眼随手动」
- 用独立 `translate` 属性（不是 `transform`）给 `.fab-body` 加偏移，和 nod/shake 的 `transform` 动画互不覆盖；`requestAnimationFrame` 节流，拖拽时归零。
- 偏移量**必须取整到整像素**（±2px 两档）：小数 px 会让 56px 的 SVG 停在半像素上被插值，看起来就是糊的。

## 第 10 轮（分身清晰度 / 空态留白 / 工序名色）

### 分身为什么糊，以及怎么修
- **病根**：`scale(1.012)` 让 56×56 的 SVG 内容按 56.67×56.67 光栅化，再双线性缩放回 56 —— 每条边都不是纯色，永远有一条灰蓝过渡带；再叠加 `will-change:transform`（常驻图层）与小数 `translate`，等于整颗球长期停在半像素上。
- **修法**：稳态一律 `transform:none`、`will-change:auto`；呼吸改成一次性 `fabBreathe`（`translateY(-1px)`，1.9s），JS 每 6~9s 播一次；「眼随手动」与拖拽落点全部 `Math.round`。
- **量化**：1x 屏元素截图的 3×3 Laplacian 方差，旧 747 → 新 1889（越大越锐）。
- 注意：动作播放期间（jump 的 scale、nod 的 rotate）仍会短暂重采样，属于动效本身的正常代价；关键是**静止时必须回到零变换**。

### 空态底部留白
- `.wd-empty` 原来是 `margin:24px auto 0`，下方贴死分组底边。补 `padding-bottom:24px` 后上下都是 24；`padding` 不参与 132px 居中宽度计算，标题/按钮的横向位置不受影响。

### 工序名颜色
- `.qf-name` 显式给 `--cds-text-primary`（#1F1F1F）。之前它靠继承 `.qf-step`，非激活态是三级灰 #868686，看起来「看着不像任务名，像占位」。
- 序号 `.qf-no` 保持原逻辑：激活步 primary、其余 tertiary；分隔线用 `currentColor` + 透明度，跟着变。

## 第 11 轮（更多操作显隐 / 搜索微动效 / 低分辨率 / 内容列 50%）

### 更多操作：为什么是 opacity 而不是 display
- `display:none ↔ flex` 会让标题可用宽度在 hover 瞬间多/少 24px，文字当场重排。
- 用 `opacity:0 + pointer-events:none` 保占位，hover / 选中 / 键盘聚焦时淡入 140ms；标题宽度恒定，卡片不抖。
- 只认 `:hover`、`.is-sel`、`:focus-visible`——不要用 `:focus-within`：鼠标点完卡片焦点会留在卡片上，`:focus-within` 会让按钮永远亮着。

### 搜索框：一次「从右侧拉开」
- 结构不变（还是 `.wd-search` 一个容器），改成 `position:absolute; right:0`，`width:32px ⇄ 100%`。
- 宽度过渡 260ms `cubic-bezier(.22,.85,.2,1)`；工具行其他元素同时 `opacity 0 + translateX(-6px)`；框内图标/输入/清除延时 120ms 淡入。
- 收起时反过来：opacity 先走（0.14s），宽度后收，`visibility` 用 `0s .26s` 延迟切换——既保留过渡，又让隐藏后的 input 不能被 Tab 聚焦。
- 阴影是 `box-shadow: 0 0 0 1.6px`，跟随宽度变化，不会被裁（这也是没用 `clip-path` 展开的原因：clip-path 会连外环阴影一起裁掉）。

### 内容列宽度与滚动
- `width: min(clamp(680px, 50%, 860px), calc(100% - 24px))`：
  - 50% 相对 `panel-main` → 左栏展开、右栏出现（未来）都自动跟着变；
  - 680 是「再窄就没法放工具行」的下限，可用 `--cds-stage-min` 调；
  - 外层 `min(..., 100% - 24px)` 保证极端窄窗也不横溢。
- 1440×900：711；1920：860（封顶）；1366/1280：680（触底）；1440+左栏：680。
- 滚动：`overflow-y:auto` 常开但 `scrollbar-width:none`，`is-scroll`（>4px）时才显形——flex 亚像素会让 `scrollHeight` 恒比 `clientHeight` 多 1px，那 1px 不该长出一条滚动条。
- 1px 伪溢出还会让浏览器在聚焦输入框时把内容列滚 1px，`syncStageScroll()` 里顺手 `scrollTop = 0` 归位。

### 工具行两排（@container 820）
- 宽度 < 820 时改 `display:grid; grid-template-columns: auto minmax(0,1fr)`，子元素天然排成「工作台 / 快速任务」两排；`.tb-div` 藏掉。
- 同时 `.tb-chips { flex: 0 0 auto; flex-wrap: wrap }`——之前 chips 被压缩后自身出现横向滚动条，正是「横向条」的来源。

## 第 12 轮（更多操作菜单 / 待确认底色 / 下拉灰度 / 模态层级 / 工序弹窗）

### 任务卡「更多操作」为什么是 fixed 菜单
- 抽屉是 `overflow:hidden` 的滑出层，菜单挂在卡片里会被裁掉半截；挂 `.cds-frame` 下 `position:fixed` + `z-index:260` 才能压住抽屉。
- 定位按触发按钮的 `right` 对齐，`top = bottom + 4`；下方空间不足（`top + h > innerHeight - 8`）翻到按钮上方；左右夹在 8px 内。
- 关闭时机：点菜单项 / 点页面其它地方 / Esc / 抽屉内滚动 / 窗口 resize / 收抽屉。
- 键盘：按钮 `ArrowDown` 打开并把焦点交给首项，菜单内 `↑↓` 循环、`Tab` 收起、`Esc` 回到按钮。

### 待确认卡：橙色提醒是「底色」不是「标签」
- 标签本来就有 `.wd-chip-todo`（#FFF3E8 底 + #FDDDC3 边 + #F77234 字），这次把同一套橙色降到卡片底色，扫视时先看到「这张要确认」。
- 选中态优先：`.is-todo.is-sel` 覆盖回蓝色 11%，否则「选中」这件事会被橙底吃掉。

### 下拉菜单的中性灰
- `--cds-fill-hover` 是蓝灰系（#E7ECF2），用于按钮 hover 没错，但放在下拉 item 上会显得「这项被选中了」。item hover 一律 #F4F4F4。
- 容器边框同理：#DEE4ED → #E5E5E5（纯灰度）。选中的 item 仍是主色文字 + 主色浅底，靠色相而不是灰度区分。

### 模态：从「盖住整屏」到「盖住面板」
- 原来 `.cds-modal` 是 body 级 `fixed; inset:0`，会连顶栏和画框留白一起压暗。改为 `.panel` 的绝对定位子层后，蒙层只覆盖窗口面板，且被 panel 的 `overflow:hidden` + 8px 圆角裁切。
- 尺寸不能再写 `100vh`：`100vh` 是视口高，面板比它少 48px 顶栏。改成 `min(804px, calc(100% - 32px))` / `min(1080px, calc(100% - 80px))`。
- 毛玻璃 = `backdrop-filter: blur(10px) saturate(1.05)` + `rgba(24,26,30,.28)`。只加深不模糊会像「关灯」，只模糊不加深会像「失焦」。
- 副作用：面板内居中后 1440×900 下弹窗顶从 48 变 72（面板 850 高、弹窗 804，上下各 23）。这是「不出面板」的必然结果，基线脚本已同步。

### 工序编辑：弹窗取代行内编辑态
- 行内编辑的问题：工序 chips 是 24px 高的流式条，`contenteditable` 一进去整条宽度就跳；删除按钮 × 只有 12px，误触和看不清都容易发生。
- 弹窗里一行一道：序号（`pad2`）+ 输入框 + 删除；行高 40，`focus-within` 才描主色边框；底部「添加工序」虚线按钮；`回车` 追加下一道。
- 应用时统一 `trim + filter(Boolean)`，全空则禁用「应用」；写完 `qfSteps` 再 `qfRender()`，标题「技术任务 · N 道」自动跟着变。

## 第 13 轮（折叠提醒点 / 标签贴右 / 工序条 / 蒙层 / 权限图标）

### 折叠态提醒点：涟漪动的是外圈，不是图标
- 稿 `2960:48800` 是「16×16 淡橙圆（rgba(247,114,52,.16)）+ 6×6 实心点（#F77234）」—— 这就是涟漪的一帧。
- 动画只给 `::after` 伪元素做 `scale(.375) → scale(1)` + 淡出，2.4s 无限循环；按钮里的 `.ico` 全程 `transform: none`。**持续缩放 SVG 会重采样发虚**（第 10 轮分身踩过）。
- 显示条件是「有待确认卡片 && 抽屉收起」，在 `openDrawer` / `closeDrawer` 各算一次；判断直接查 DOM（`.wd-card.is-todo`），数据一变就跟着变。

### 「更多操作」不占位 + 标签贴右
- `width: 0 → 20px` 过渡，配 `overflow: hidden` + 图标 `position: absolute`，宽度变化时图标是「被拉开」而不是被压扁。
- 描边不能写 `border`：`width:0` 时 `box-sizing: border-box` 仍会留 2px 边框，标签贴不到右内缘。改用 `box-shadow: inset 0 0 0 1px`。
- **副作用与解法**：按钮占的 24px 会从标题那里扣走，card2 标题（196px）正好卡在临界，hover 时会被压成两行、卡片 80→100 跳。用 `margin-right: -8px` 让按钮吃掉部分右内边距，标题可用宽只少 16px，实测不再换行。这是 288px 卡片宽度下的物理约束：挤标签必然压标题，只能把挤压量的一部分转移给内边距。

### 蒙层：纯黑 + 毛玻璃
- `rgba(24,26,30,.28)` 偏冷蓝，叠在白面板上会发灰蓝；改 `rgba(0,0,0,.4)` 才是中性压暗。`backdrop-filter` 保留，只改底色不冲突。

### 工序条：没有分隔竖线
- 稿里 chip 内是「序号 + 空格 + 工序名」，没有 1px 竖线。删掉 `.qf-sep` 后序号与名字间距靠 `.qf-no { margin-right: 3px }`（gap 2 + 3 = 5）补回。
- 编辑与关闭两个 icon 在稿里同色（#A9A9A9），不要再让编辑用 `text-primary` 显得「更重要」。

### 进度条：只让蓝段长
- `.wd-bar.is-anim i.on` 才挂 `wdBarGrow`；灰段是静态底色，跟着动会像整条在"重排"。
- 延迟选择器也要带 `.on`（`.wd-bar i.on:nth-child(n)`），否则灰段会继承 45/90/135ms 的 delay 却无动画，白留空档。

### 「默认权限」= 盾牌钥匙孔
- 稿里的图标是盾形轮廓 + 钥匙孔（圆环 + 竖杆），单 path、14×14，坐标 1.67~12.3。三层子路径要用 `fill-rule="evenodd"`：外轮廓实心、钥匙孔挖空、圆心再填实，才得到环。
- 文字与图标统一 `--cds-text-primary`；`c-model` 仍是次级灰，两者不再混同。

### 收起图标：箭头 + 右侧竖条
- 稿 `2983:46666` 的 `direction/to-left` 由两段组成：一条 4×32 的圆头竖条 + 一个开口约 95° 的 chevron，整体 9.33×8.12。
- **导出数据有坑**：`extractSvg` 给的 path 父级变换丢失，矩形跑到左下、箭头跑到右上，bbox 变成 29.86×54.62（与布局里的 9.33×8.12 矛盾）。只能按「箭头 + 边界线」的语义还原，不能逐点照搬。

## 第 14 轮（权限告警 / 图标方向 / 双视图 / 涟漪 / 抖动）

### 权限药丸的红色语义
- 只有「完全访问权限」是高风险项，用 `data-risk` 标记而不是靠文字 includes 判断，改文案不会误伤。
- 颜色要同时作用到 `.c-pill-txt` 和 `svg`（后者继承 `color`），只给文字上色会出现「红字灰盾」的割裂。

### 收起图标：导出数据里藏着旋转矩阵
- `extractSvg` 给的 `viewBox="10 -14.62 29.86 54.62"` 与 path 上的 `transform="matrix(0,1,-1,0,…)"` 必须一起看。旋转后：竖条 x10–14、箭头尖 x21、两臂 x37–40 —— **竖条在左、箭头在右指向左**。
- 第 13 轮只按图层树 bbox（9.33×8.12）猜，把两者放反了。chevron 尖端与竖条之间要留约 1.5px 净距，贴死会读成字母 K。

### 任务 / 会话双视图
- 不要拆成两个滚动容器：滚动条滑块、搜索、排序、卡片菜单都只绑一次。在 `#wdScroll` 里放两个 `.wd-view`，切换时只改 `hidden`。
- `.wd-view[hidden]` 必须 `display:none !important`——某些容器规则会把隐藏元素重新显示。
- 新增视图会污染**直接子选择器**（`.wd-scroll > .wd-grp`）和全局 `querySelectorAll('.wd-grp-head')` / `.wd-empty-acts button` 的基线断言；CSS 与旧验证脚本都要加 `#wdViewTask` 作用域。
- 会话卡与任务卡同构但高度 66（无进度条），用 `.wd-sess-card` 独立类，避免改 `.wd-card` 影响任务视图基线。

### hover 抖动：锁高度而不是锁宽度
- 根因不是动画本身，而是 `.wd-card-title` 的 `-webkit-line-clamp:2`：宽度一变，1 行↔2 行切换就让卡片 80↔100。
- 在 `mouseenter` 里锁高不可靠——`:hover` 样式与事件几乎同时生效，读到的已是挤压后的高度。改为**初始布局就把高度定死**（`t.style.height = t.offsetHeight + 'px'`），窗口 resize 时清空重算。
- 只锁高度不锁宽度，因此「更多」展开挤标签的视觉效果完全保留。

### 涟漪
- 两层伪元素 + 0.85s 错相位，比单层更快更明显；动画只走伪元素，实心圆点全程 `transform:none`。

## 第 15 轮（自适应宽度 / 会话页签换装）

### 自适应：把「定宽」改成「flex-basis」
- tab 142、添加工作目录 208 在稿件 320 下是「凑好」的值；拖宽后要跟着长，只需把 `width` 换成 `flex: 1 1 <原宽>` 并留 `min-width` 兜底，320 时的表现与稿完全一致（basis = 原宽）。
- 抽屉宽度有 300 下限钳制（拖拽范围 300–480），测 288 会被钳到 300：两 tab 各 132、按钮 188。

### 会话页签的工具行是「换装」不是「另一套」
- 稿里会话页签没有添加工作目录、搜索是常驻内联框（不是从图标展开）。在同一个 `.wd-tools` 里放 `.wd-sess-search`，用 `.is-session` 类切换：任务态显示 adddir+搜索图标，会话态显示内联框。
- 排序按钮只有一个实例，两个页签共用同一菜单与状态，不复制。
- **坑**：`.wd-sess-search` 初始带 `hidden`，只在 tab 切换时 `hidden = !session`。忘了解这一步，输入事件全打在一个隐藏 input 上，Escape 会漏到 body 把抽屉收掉。
- **回归坑**：`wdFilter` 加参数后，老的 `addEventListener('input', wdFilter)` 会把事件对象当 query 传入（`.trim is not a function`）——监听器要包一层箭头函数。

### 会话卡序
- 稿内 y 坐标：选中卡 @0（会话绑定云端工程路径）、待确认 @70、昨天 09:21 @140、11/12 @210 —— 时间倒序，选中置顶。
