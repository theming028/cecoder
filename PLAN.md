# PLAN — Cecoder 首页（MasterGo「首页 - 1」1440×900）

## 概览
- 设计稿来源：MasterGo `file=193158744355579&page_id=2868:50016&layer_id=2868:50017`，顶层 Frame「首页 - 1」= 1440×900。
- 目标产物（第 30 轮起）：三个独立页面 `cecoder-home.html`（落地首页）/ `cecoder-session.html`（会话页）/ `cecoder-task.html`（任务执行页）+ 共享 `assets/tokens.css`、`assets/app.css`、`assets/app.js`（浏览器直开，无外部依赖）。
- 框架/样式：原生 HTML + CSS。**无框架**；构建只做拼装 —— 源码是 `src/*.html` 部件，由 `.mg-d2c/build-pages.mjs` 按页组装。稿件是 1440×900 的桌面应用画框，但落地为**自适应窗口**（见下）。
- Token 体系：沿用仓库内 Cecoder Design System（`semi-*` 原值 → `--cds-*` 语义层），页面级补充 7 个稿件专属灰阶。
- 响应式范围：**宽高自适应**。画框 `100% × 100vh`（min 960×700）；面板四边贴 `8/48/8/0`；内容列 860 水平居中，窄窗收缩为 `100vw-120px`；Hero 顶部 `clamp(150px,22vh,240px)`；工具栏/输入区/版本号锚定底部，中间由弹簧吸收高度差。1440×900 下所有坐标与稿件逐像素一致。
- 交互态范围：hover / active / focus / 下拉展开 / 选中 / toast / 标题入场动效 / 悬浮球拖拽。
- 交互态已按 MasterGo DSL 真值落地：场景卡 hover（`2960:44433`）、工作台 chip 选中（`dy2983:48053`）、快速任务 chip 选中（`nk2868:58658`）、新建 chip hover（`nk2868:57925`）。
- chip 与 tooltip 规范来自 `pages/home6.json`（Tooltip-center 72×28 / r6 / rgba(29,33,41,.8) / 12/20 白字 / 箭头 10×4）。
- 输入卡激活态来自 `pages/home7.json`·`home8.json` 的 矩形 246：描边 `#C9C9C9` + `0 0 0 4px rgba(0,0,0,.05)` 外环。
- 发送按钮箭头改用 `extract-svg` 导出的原 path（向上箭头，viewBox 12.32×10.16）。
- 快速任务 hover / 选中的紫色统一用 `#5B58FF`（quick-chip 的 `textColor` 真值；hover 为其淡底版本）。
- 新增两条内联容器的真值：工作台「选择子项」`dy2983:48726`（860×56）、快速任务「推荐工序」`2960:44863`（860×82）。

## 设计 Token（取自 DSL，非肉眼估色）
| 角色 | 值 | 用在哪 |
| --- | --- | --- |
| 页面底色 | `#E5EDF5` | 画框、顶栏背景 |
| 白面板 | `#FFFFFF` + 描边 `#DAE3ED` | 窗口面板 8,48 / 1424×852 |
| 文本 1/2/3/4 | `#1F1F1F` / `#6B6B6B` / `#868686` / `#A9A9A9` | 标题正文 / 次级 / 辅助 / 占位 |
| 主操作 | `#3770F7` | 发送键、选中 chip 文本 |
| 品牌蓝 | `#3491FA` | 工作空间头像 P |
| 柔和描边 | `#EEEEEE` | chip、附件圆、药丸触发器 |
| 卡片描边 | `#E5E5E5` | 输入卡 |
| 虚线描边 | `#C9C9C9` | 场景卡「+」框、新建 chip |
| 场景卡底 | `#F7F7F7` | 用户洞察看板卡 |
| 输入区背板 | `#F2F2F2` | 输入卡下的 836×168 背板 |
| 分段轨道 | `#D4DDE7` / `#C8D3DF` | 研发工作台分段控件 |

字号阶梯（MiSans）：24/32·600（Hero）、16/24·500（场景卡标题）、14/22·400|500（正文/控件）、14/20（药丸内文字）、12/20（场景卡描述）、12/16（脚注）、12/12·500（版本号 2.0.1，按字形墨迹做光学垂直对齐）。
圆角：8（面板/卡片/分段）、6（分段选中）、4（chip/占位框/次级行）、圆（附件、发送、悬浮球、32px 药丸）。
阴影：卡片 `0 1px 4px rgba(0,0,0,.04)`；悬浮球 `0 8px 16px rgba(0,0,0,.08)` + `blur(15px)`。

## 模块清单（顶层 y 轴，绝对坐标）
1. `tb` 顶栏（0,0 / 1440×40）：交通灯 16,18 · 工作空间 88,8 / 178×32 · 分段控件 570,8 / 300×32 · 使用帮助 1252,8 / 100×32 · 设置 1360,8 / 72×32
2. `panel` 白面板（8,48 / 1424×852，上圆角 8）：内部 flex = 左抽屉 + `.panel-main`；`overflow:hidden` 保证抽屉不越界
3. `menu-btn` 折叠侧栏（16,56 / 28×28）：在 `.panel-main` 内（left 7/top 7），抽屉展开时淡出
4. `hero`（290,198 / 860）：标题 24/32·600 + 8px + 描述 14/22 / 宽 718
5. `scene` 场景卡（290,284 / 860×80）：虚线「+」48×48 @306,300 + 文本块 @366,300
6. `toolbar`（290,660 / 856×32）：工作台 label + 6 chip（340→666）+ 1×20 分隔线 @682.5 + 快速任务（opacity .8）+ 4 chip + 新建（虚线）
7. `composer`（290,704 / 860×168）：背板 836×168 @302 + 白卡 860×128 + 药丸行 @778,788 + 次级行 @308,838
8. `version`（671,880 / 98×12）：CECODER 矢量字标 + 2.0.1；整组 99px 定宽居中，字标与数字按墨迹中线对齐（脚本量测，换字体也不跑偏）
9. `ws-drawer` 工作任务列表侧栏（panel 内 320×850，图层 `3038:44396`）：**宽度 0→320 挤压内容**（不是浮层）；head 44 / tabs 40（底 `#F7F7F7`）/ tools 32（上 16）/ list（上 16），列表内「目录文件夹 36（可展开，箭头展开转下）→ 虚线新建 28 → 4 张任务卡（80/80/100/80）→ 3 个折叠目录 36（相邻叠 1px）+ 1 个展开的空目录 → 空态」逐段对齐稿件坐标
10. `wb-slot` 工作台子项容器（860×56，`dy2983:48726`）：选中「通用」后插入工具行下方，spring 吸收高度（工具行上移 64）；子项单选、右上关闭取消选中
11. `qf-slot` 快速任务工序容器（860×82，`2960:44863`）：选中快速任务后插入，标题「技术任务 · N 道 推荐工序」+ 可横向滚动工序条（01…08，箭头间隔 2）+ 编辑（改名/删除/新增，切换为「完成」）/ 关闭
12. `float` 数字分身（1352,812 / 56×56）：白玻璃圆 + 蓝色渐变 logo + 1px 描边环；可按住拖到任意位置（8px 边距吸附）

## 顶栏/控件间距口径
- 分段控件：轨道 300×32，内边距 2px，三个按钮间距 **2px** ⇒ 选中 118、未选 86，分隔线 1×16 落在 779。

## 为什么重写布局
旧实现用「margin-top:117 / flex 弹簧 / padding 推底」逼近，累计误差 2–20px（composer 高 154 vs 128、send 按钮 y 差 15、menu 按钮差 7、顶栏按钮无底色…）。
稿件的每个模块都是画框内的绝对定位块，因此直接以 DSL 坐标落位，逐块用 `verify.mjs` 校验（39 项，容差 1px，当前 37/39；两项差异仅因本机无 MiSans，文字宽度差 2–3px）。
抽屉改挤压后内容列以 `.panel-main` 为基准居中：1440×900 下 stage 由 `290,198` 平移到 `450,198`（宽度仍 860），纵向坐标不动。

## 第 6 轮（工作台看板 / 云端同步模态 / 侧栏拖宽）

| 模块 | 稿 | 状态 |
|---|---|---|
| 13 侧栏拖宽 + 记忆 | —（本轮需求） | 300~480 拖拽、键盘微调、`localStorage` 记忆开合与宽度 |
| 14 工作台 chip 图标 | `dy2983:48499` | 6 个 tab 图标只在选中态出现，选中宽 66 与稿一致 |
| 15 场景卡看板态 | `2960:48845` / `2983:45725` | idle 80 → 192 → 60 三态，指标卡/图表卡/折叠键齐全 |
| 16 云端任务同步模态 | `2983:54273` / `dy2983:45478` | 1080×804，左列表 + 右详情 + 居中脚 + 顶部 Message |

新增图层：`layers/{modal-a,modal-b,tb-chip-icon,scene-open,scene-collapsed}.json`，图标落 `icons-extra.json`（key 20–30）。
遗留：`工序 / 资产` 两个 tab 稿件未给，按现有体系补了只读 chips 与空态；场景卡展开/折叠不做记忆（需求只要求侧栏记忆）。

## 第 7 轮（分段滑动 / 卡片选中 / 互斥 / 动效）

| 模块 | 稿 | 状态 |
|---|---|---|
| 17 顶栏分段底板滑动 | `2983:53345` radio-button-group | 120/88/88，`.seg-pill` 位移+变宽，`no-anim` 首屏定位 |
| 18 指标卡投影 | `2960:48845` effect_6:097 | 4 张指标卡 + 图表卡补 `0 1px 2px rgba(0,0,0,.08)` |
| 19 两组 tab 互斥 | —（本轮需求） | 工作台 / 快速任务同时只留一组选中 |
| 20 分组头状态 | `3038:44396` 容器 1603 / 1597 | 灰底只属于展开态，箭头紧跟文字 4px，待确认文案转橙 |
| 21 任务卡选中 | 容器 1611 矩形 259 | `#3770F7 @11%` + r4，单选 |
| 22 进度条入场 | —（本轮需求） | 逐段 scaleX 0→1，重开重放 |
| 23 `wd-newtask` 细节 | 容器 1664 | 灰色加号 + 蓝字，虚线 #C9C9C9 |
| 24 `c-env` 深一级 | —（本轮需求） | hover fill-1 / 展开 fill-2 |

新增图层：`layers/{task2,task3,h5..h8}.json`；校验：`verify7.mjs`（27 项）。

## 第 8 轮（tab 底线 / 文字与图标 / 动效 / tooltip / 模态线）

| 模块 | 稿 | 状态 |
|---|---|---|
| 25 非选中 tab 底线 | `tabs/card-gutter` 0 0 1px #E5E5E5 | 容器 + 非选中 tab 各带 inset 底线，选中态压掉 |
| 26 `wd-newtask` 默认字色 | `dy2983:44301` tc #6B6B6B | 文字与加号同灰，hover 转蓝 |
| 27 `sc-acts` 投影 | `effect_6:097` | 分身建议/更多数据/折叠键均补 |
| 28 看板入场动效 | —（本轮需求） | 数字滚动 720ms + 折线 clip 绘制 + 数据点弹出 |
| 29 标题蓝线 | —（本轮需求） | 删除 `.hero-title::after` 与 keyframes |
| 30 六套选择子项 | `dy2983:48726` + 补 | 六台各 4 项，按台记忆 |
| 31 关闭 × 淡一级 | `paint_1204:26645` | #A9A9A9（子项 / 工序两处） |
| 32 图标按钮 tooltip | —（本轮需求） | body 级单例，4 个按钮接入 |
| 33 收起图标重绘 | `联集 5` | 9.33×8.12 竖条+角标 |
| 34 分组名/箭头对齐 | `Link 65x22` | viewBox 归一化，差 0.5px |
| 35 空态文字 | 容器 1659 | 标题 #A9A9A9，动作 #6B6B6B + 下划线 |
| 36 模态三条线 | 矩形 204/221/541 | 头底、脚顶、左栏右缘 |

校验：`verify8.mjs` 37 项全绿。

## 第 9 轮（整卡展开 / 输入撑高 / 搜索与排序 / 分身表情）

| 模块 | 稿 | 状态 |
|---|---|---|
| 37 看板折叠后整卡可展开 | —（本轮需求） | `data-state="collapsed"` 时补 `role=button` / `tabindex` / `cursor:pointer`，除 `.sc-btn/.sc-fold` 外整块点击或回车都展开 |
| 38 MiniCloud 折叠无间隙 | 容器 1597 起 | `.wd-grp:not(.is-open) + .wd-groups` 去掉 12px 段落间距，首个目录叠 -1px；折叠时补 `is-edge` 下边线 |
| 39 输入框自动撑高 | —（本轮需求） | `--ci-h` 由 scrollHeight 写入，46→256；卡高 = 输入+82，背板 `height:100%`，底边不动、整块向上长 |
| 40 c-env 中性灰 | —（本轮需求） | hover `#E6E6E6` / 展开 `#DADADA`（新 token `--cds-gray-hover/active`），展开时箭头翻转 180° |
| 41 本地 / 工作目录图标 | `nk2868:58628` | 本地换 14×14 云朵（`2958:43820`），工作目录换 `general/folder`（`1204:55166`） |
| 42 添加工作目录 | —（本轮需求） | `showDirectoryPicker()` 优先，`SecurityError`/不支持时退回 `input[webkitdirectory]`；选完追加同构分组（展开+空态+可折叠） |
| 43 排序下拉 | —（本轮需求） | 工具行右对齐菜单：按创建时间 / 按更新顺序，卡上带 `data-created/updated`，组内倒序重排；非默认顺序按钮转主色 |
| 44 搜索激活态 | `2983:52581` | 整行换成 288×32 白底搜索框 + `0 0 0 1.6px #6692F9` 外环，输入实时过滤，× 或 Esc 复原 |
| 45 分身表情动效 | —（本轮需求） | 眼睑（顶部拉闸眨眼）、^^ 笑眼、微笑嘴；点头 / 摇头 / 蹦跶（整球离地压扁）；待机呼吸 |

新增图标：31 folder / 32 cloud / 33 close-circle-fill / 34 check。
校验：`verify9.mjs` 53 项全绿；`verify8` 37、`verify7` 27、`verify6` 35、`verify.mjs` 37/39（2 项字体宽度）、`wd-verify`/`verify-bars` ALL OK。

## 第 10 轮（分身清晰度 / 空态留白 / 工序名色）

| 模块 | 稿 | 状态 |
|---|---|---|
| 46 分身图标发虚 | —（本轮需求） | 根因三条：① `.fab-outer` 常驻 `4.4s infinite` 的 `scale(1.012)+translateY(-.4px)`，56px 的球被按 56.67px 反复重采样；② `.fab-body` 常驻 `will-change:transform` 被提升成独立图层；③ 眼神偏移写小数 px、拖拽坐标不取整，球停在半像素。改为稳态零 transform / 无 will-change，呼吸降级为 `fabBreathe`（只 translateY(-1px)，1.9s）由 JS 每 6~9s 播一次，眼神与拖拽坐标全部取整。1x 屏 Laplacian 方差 747 → 1889 |
| 47 空态下留白 | 容器 1659 | `.wd-empty` 补 `padding-bottom:24px`，上 24 = 下 24，底边贴齐分组 |
| 48 工序名颜色 | `2960:44863` | `.qf-name` 显式 `color: var(--cds-text-primary)`，序号 `.qf-no` 仍按激活/非激活走主色与三级灰 |

校验：`verify10.mjs` 20 项全绿；`verify9` 54（呼吸断言改写为「稳态静止 + 可按需播放」）、`verify8` 37、`verify7` 27、`verify6` 35、`verify.mjs` 37/39（2 项字体宽度）、`wd-verify`/`verify-bars` ALL OK；1920→960 五档冒烟无报错。

## 第 11 轮（更多操作显隐 / 搜索微动效 / 低分辨率适配 / 内容列 50%）

| 模块 | 稿 | 状态 |
|---|---|---|
| 49 更多操作显隐 | —（本轮需求） | `.wd-more` 默认 `opacity:0 + pointer-events:none`，仅卡片 `:hover` / `is-sel` / `:focus-visible` 时出现；用 opacity 保 20px 占位，标题不因图标闪现而跳；7 张卡统一补齐（原来只有 2 张有） |
| 50 搜索框微动效 | `2983:52581` | 不再 `display:none` 硬切：搜索框绝对定位 `right:0`，宽度 32 → 100% 过渡 260ms；工具行其余元素淡出 + 左移 6px；框内元素延时 120ms 淡入；收起时先淡出再缩回，结束时 `visibility:hidden`（不可 Tab 聚焦） |
| 51 低分辨率滚动条 | —（本轮需求） | `.stage` 常开 `overflow-y:auto` + `overflow-x:clip`，但 `scrollbar-width:none`；只有 `scrollHeight - clientHeight > 4` 才加 `.is-scroll` 显形。顺带修掉 `c-hint` 写死 `left:663px` 造成的 128px 横向溢出，和 flex 亚像素 1px 伪溢出（归零 scrollTop） |
| 52 内容列 50% | —（本轮需求） | `width: min(clamp(680px, 50%, 860px), calc(100% - 24px))`。50% 相对 `panel-main`（左栏展开会自动变小，右栏同理），最小 680、最大稿件 860；`--cds-stage-min` 可调 |
| 53 工具行窄容器 | —（本轮需求） | `@container (max-width: 820px)` 下 toolbar 变 2×2 网格（一组一排），隐藏竖分隔线，chips 不再被压缩（避免内部横向滚动）；副标题允许换行 + `text-wrap: pretty` |

校验：新增 `verify11.mjs` 47 项全绿（含模拟左栏/右栏/双栏出现时的宽度自适应）；`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 27、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`verify.mjs` 37/39（余 2 项 MiSans 字宽）。
基线脚本（verify/verify6/verify-bars）统一注入 `.stage{width:860px}` —— 它们校验的是「稿件 860 宽」下的像素落点。

## 第 12 轮（更多操作菜单 / 待确认底色 / 下拉灰度 / 模态入面板 / 工序编辑弹窗）

| 模块 | 稿 | 状态 |
|---|---|---|
| 54 任务卡「更多操作」菜单 | —（本轮需求） | 点 ⋯ 弹出 `fixed` 菜单：查看任务详情 / 编辑 / 删除；按按钮右缘对齐，下方放不下自动翻到上方，视口左右夹紧；抽屉 `overflow:hidden` 会裁卡片内浮层，所以菜单挂在 `.cds-frame` 下（z 260），点外部 / Esc / 滚动 / 收抽屉都关闭；按钮加 `aria-haspopup=menu` / `aria-expanded`，`↑↓` 循环、`Tab` 收起 |
| 55 待确认卡橙底 | —（本轮需求） | `.wd-card.is-todo { background: var(--cds-orangered-1) }`（#FFF3E8），hover #FFEBDC；选中态仍归蓝（选中优先于提醒），`is-todo` 只加在「待确认」那张卡上 |
| 56 下拉菜单灰度 | —（本轮需求） | 全局 `.semi-select-option:hover` 与 `.wd-menu-item:hover` 改 #F4F4F4（原 `--cds-fill-hover` 偏蓝灰 #E7ECF2），容器边框改 #E5E5E5（原 `--cds-border` #DEE4ED） |
| 57 目录名字号 | —（本轮需求） | `.wd-grp-name` 12 → 13px（行高 22 不变） |
| 58 模态进 panel + 毛玻璃 | `2983:54273` | `.cds-modal` 从 `fixed` 改为 panel 的 `absolute; inset:0` 子层，由 panel `overflow:hidden` 裁切；`.cm-mask` 加 `backdrop-filter: blur(10px) saturate(1.05)` + `rgba(24,26,30,.28)`；`.cm-panel` 尺寸改相对面板（`min(1080, 100%-80)` / `min(804, 100%-32)`），900 高仍 804，1280×800 / 960×700 自动缩 |
| 59 内容列回滚 860 | —（撤销模块 52） | 按需求撤回第 11 轮的 50% 方案，`width: min(860px, calc(100% - 24px))`；860 只是稿件宽，兜底仍防横溢 |
| 60 收起任务列表图标 | `direction/to-left`（`联集 5` 9.33×8.12） | 去掉旧「竖条 + ←」，换成稿里的纯左箭头（14×14、stroke 1.3），新图标 35 |
| 61 工序编辑改弹窗 | —（本轮需求） | 点编辑不再进行内编辑态（删掉 `.is-edit` / `.qf-del` / `.qf-add` / 完成按钮 / `contenteditable`），改为「编辑工序」弹窗：序号 + 输入框 + 删除逐行，底部「添加工序」，取消 / 应用；应用后回写 `qfSteps` 并重排 chips、同步标题 |

校验：新增 `verify12.mjs` 51 项 + `verify12b.mjs` 40 项（1280×800 / 960×700 等四档模态适配）全绿；`verify11` 47（模块 52 的断言改写为 860）、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 27、`verify6` 35（模态基线 +24，因改为面板内居中）、`wd-verify`/`verify-bars` ALL OK、`verify.mjs` 37/39（余 2 项 MiSans 字宽）。

## 第 13 轮（折叠态橙点 / 标签贴右 / 工序条 / 蒙层纯黑 / 权限图标）

| 模块 | 稿 | 状态 |
|---|---|---|
| 62 折叠态「待确认」提醒点 | `2960:48800`（16×16 外圈 `rgba(247,114,52,.16)` + 6×6 `#F77234`） | `.mb-dot` 挂 `.menu-btn` 右上角（top/right 1px）；`syncMenuDot()` 判断「抽屉里有 `.wd-card.is-todo` 且抽屉收起」，开/合抽屉各算一次；涟漪用 `::after` 从 0.375 扩到 1 并淡出（2.4s 循环），**图标本体不动**（持续 scale 会重采样发虚）；`aria-label` 同步为「展开任务列表（有待确认任务）」 |
| 63 卡片标签默认贴右 | —（本轮需求） | `.wd-more` 改成 `width: 0`，hover/选中/聚焦才展开 20px 把标签向左挤；描边由 `border` 改 `inset box-shadow`（`width:0` 时不留 2px 边框宽）；hover 用 `margin-right:-8px` 吃掉部分右内边距，避免标题在第 1/2 行之间跳（card2 标题刚好 196px 临界） |
| 64 蒙层纯黑 | —（本轮需求） | `.cm-mask` 底色 `rgba(24,26,30,.28)` → `rgba(0,0,0,.4)`，毛玻璃 `blur(10px) saturate(1.05)` 保留 |
| 65 工序条去掉分隔符 | —（本轮需求） | 删 `.qf-sep`（CSS + JS）：`.qf-no` 加 `margin-right: 3px` 补回 5px 气口；chip 宽 84 → 82.3 |
| 66 编辑/关闭图标同色 | `2960:44863` | `.qf-acts .qf-icon` 统一 `--cds-text-disabled`（#A9A9A9），原编辑图标是 `text-primary` 偏深 |
| 67 编辑工序暂不弹窗 | —（本轮需求） | 摘掉 `qfEdit` 的 click 绑定（`qfOpenEdit` 与弹窗 DOM 全部保留，恢复一行即可接线） |
| 68 进度条只蓝段动效 | —（本轮需求） | `.wd-bar.is-anim i` → `.wd-bar.is-anim i.on`，灰色底段静态；延迟选择器同步加 `.on` |
| 69 默认权限正文色 + 盾牌图标 | —（本轮需求） | `.c-perm` 与 `.c-pill-txt` 改 `--cds-text-primary`；图标从 I5（回形针）换成 I36：稿里的「盾牌 + 钥匙孔」14×14 单路径，`fill-rule="evenodd"` 抠出孔洞 |
| 70 收起任务列表图标 | `2983:46666` → `direction/to-left` | 图标 35 重做为「指向左的箭头 + 右侧竖条」（9.33×8.12 居中：箭头 `M8.6 3.5L3.1 7L8.6 10.5` stroke 1.15，竖条 1.21×8.12 r0.6 @x10.43）。**注意**：稿里导出的 path 父级变换丢失（竖条跑到左下、箭头跑到右上），按「箭头+边界线」的标准形态还原 |

校验：新增 `verify13.mjs` 41 项全绿；`verify12` 50、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`（标签/卡片基线整体上移 20）、`verify-bars`、`smoke9` 五档 ALL OK、`verify.mjs` 37/39（MiSans 字宽）。

## 第 14 轮（权限红色告警 / 模态脚线 / 收起图标 / 会话视图 / 涟漪 / hover 抖动）

| 模块 | 稿 | 状态 |
|---|---|---|
| 71 完全访问权限转红 | —（本轮需求） | 下拉第三项改「完全访问权限」并标 `is-risk`；选中后 `.c-perm` 整枚药丸（图标 + 文字）转 `--cds-danger-6`，hover 底色转 `danger-1`；切回默认权限恢复正文色 |
| 72 cm-left-foot 边线 | —（本轮需求） | 加 `inset 0 1px 0 #EBECED`（上）+ `inset -1px 0 0 #E5E5E5`（右），48 高不变 |
| 73 收起图标方向纠正 | `3083:44334` | 按完整 SVG path + `matrix(0,1,-1,0,…)` 还原：竖条在**左**（x2.31，1.21×8.12），粗箭头在**右**且指向左（`M10.6 3.1L5.2 7L10.6 10.9`，stroke 1.4）。第 13 轮把两者放反了 |
| 74 会话 tab 内容 | `3083:44430` | 在 `#wdScroll` 内加 `.wd-view` 双视图：任务视图 / 会话视图，共用滚动条与拖拽滑块。会话稿还原为「普通会话（4 张 66 高会话卡：标题 14/20 + 时间 12/18 + 右上标签/更多）+ 数字分身会话 1 / 工作台会话 7 / Nutstore / AI Native Factory 空态」，搜索占位同步改「搜索会话关键词」；橙点判定也把会话的待确认计入 |
| 75 涟漪加强 | —（本轮需求） | 外圈 16→22px、透明度 .16→.34、2.4s→1.7s，并加 `::before` 错开 .85s 形成双层波纹；实心点本体仍不缩放 |
| 76 hover 抖动 | —（本轮需求） | 标题在 1/2 行临界时，更多按钮展开抢 24px 会触发重排、卡片 80↔100 跳。改为初始布局就把 `.wd-card-title` 的高度定死（`wdLockTitles()`，窗口 resize 重算），宽度仍可变，标签照常被挤 |

校验：新增 `verify14.mjs` 43/43；回归 `verify13` 41、`verify12` 50、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错、`verify.mjs` 37/39（MiSans 字宽老问题）。

## 第 15 轮（拖宽自适应 / 会话页签按稿 3083:44433 精确还原）

| 模块 | 稿 | 状态 |
|---|---|---|
| 77 tab / 添加工作目录随拖宽自适应 | —（本轮需求） | `.wd-tab` 142 定宽 → `flex: 1 1 142px`（320 下正好 142 均分，480 下 222，300 下 132）；`.wd-adddir` 208 定宽 → `flex: 1 1 208px; min-width: 120px`（320=208 / 480=368，右组 72 固定） |
| 78 会话页签工具行 | `3083:44433` @0,0 | 会话页签下没有「添加工作目录」和「点开搜索」：新增 `.wd-sess-search` 内联搜索框（248×32，白底 1px #E5E5E5 r4，占位「搜索会话」#A9A9A9，`flex:1` 随宽自适应）+ 排序按钮（复用同一菜单与状态）；`.wd-tools.is-session` 切换显示，切回任务还原 |
| 79 会话卡序与状态 | `3083:44433` @128-404 | 4 张 66 高卡（间距 4）：① 会话绑定云端工程路径（`is-sel` 蓝 11%，同步徽标描边改 `--cds-blue-2` #DAE4FE + more）② 业务需求，生成交付状态（橙 `is-todo` + 待确认 chip）③ 生成交付状态跟踪表…（昨天 09:21）④ 登录审计日志补全（11/12 21:03）——③④ 顺序按稿对调 |
| 80 分组数与空态 | `3083:44433` | 数字分身会话 8 / 工作台会话 1 / Nutstore 7（原来 1/7/无）；会话空态去掉两个按钮，改为 12/20 #6B6B6B 下划线「新建会话」链接（`.wd-empty-link`） |

校验：新增 `verify15.mjs` 34/34（三档宽度自适应 + 会话换装 + 卡序/计数/空态 + 内联搜索过滤 + Esc 清空 + 切回还原）；回归 `verify14` 43（卡序断言同步新稿）、`verify13` 41、`verify12` 50、`verify11` 50、`verify10` 20、`verify9` 54（修复 `input→wdFilter(event)` 传参回归）、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错、`verify.mjs` 37/39（MiSans 字宽）。

## 第 16 轮（输入卡激活环 / 涟漪点位 / 系统目录选择 / 工作空间自适应 / 加号菜单 / hover 色）

| 模块 | 稿 | 状态 |
|---|---|---|
| 81 输入卡 focus 外环 | —（本轮需求） | `.c-card:focus-within` 的 `0 0 0 4px` 被 `.stage` 的 `overflow-x: clip` 裁掉：stage 盒宽改为「内容 860 + 左右各 6px 内边距」（`min(860+12, 100%-12)` + `padding:0 6px`），内容宽公式逐字不变，版面零位移 |
| 82 涟漪橙点 | `2960:48800` | 从按钮右上角移到与图标同一水平线（`top:50%; margin-top:-3px`，不用 transform，避免与缩放动画冲突） |
| 83 选择其他目录 | —（本轮需求） | 点击「选择其他目录…」不参与选中态，直接调系统文件夹窗：`showDirectoryPicker` 优先（同「添加工作目录」），`file://` 受限时退回 `input[webkitdirectory]`；选完目录名写回药丸与第一项 |
| 84 工作空间自适应 | —（本轮需求） | `.tb-ws-btn` 去 178 定宽、`.tb-ws-name` 去 122 定宽 → `flex:0 1 auto; max-width:224px`；下拉 `width:100%` 跟随按钮 |
| 85 加号菜单 | —（本轮需求） | `#attachMenu`（复用 `.wd-menu.is-float`）在加号上方弹出：添加本地文件（`#filePick` multiple）/ 技能（toast）；点外部/Esc 关闭；`c-attach` 去掉 `data-action` 防双响应 |
| 86 hover 配色 | —（本轮需求） | 本地/工作目录 hover（与展开态）图标+文字转正文色；顶栏工作空间/使用帮助/设置 hover 底改 #FFFFFF |

校验：新增 `verify16.mjs` 42/42；回归 `verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50（860 断言改测内容宽）、`verify12b` 36（编辑工序改为断言「不弹窗」，与第 13 轮接线注释一致）、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35（强制基线 860→872）、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 17 轮（会话搜索激活态 / 空态规格 / 分身毛玻璃 / 标题字重 / 更多图标统一 / 工序投影）

| 模块 | 稿 | 状态 |
|---|---|---|
| 87 会话搜索激活态 | `2983:52581` | `.wd-sess-search:focus-within` 加 1.6px `--cds-search-ring` 外环（描边转透明）、图标与占位文字转正文色，与任务页签搜索框一致 |
| 88 空态规格 | `容器 1659` | `.wd-empty` 改 `padding:24px 0`（上下对称、去掉 margin-top）；标题 `<p>` 的 UA 12px 外边距清零（链接上方不再多出 12px）；容器内标题/动作/链接统一 13px |
| 89 空会话分组 | —（本轮需求） | 会话页签下没有会话卡的分组（数字分身会话 / 工作台会话 / Nutstore）`.wd-sub` 一律换成 `.wd-empty` 块（虚线「新建会话」按钮取消） |
| 90 分身毛玻璃 | —（本轮需求） | `.float` 加 `backdrop-filter: blur(14px) saturate(1.15)`，按钮自身底色透明、可见表面是 SVG 那层 55% 白圆（两层白叠一起会变实心） |
| 91 标题字重 | —（本轮需求） | `.wd-card-title` / `.wd-sess-title` 默认 400，`.is-sel` 才 500 |
| 92 会话「更多」统一 | —（本轮需求） | 去掉 `.wd-sess-act .wd-more` 的 `position:static;width:20px;margin:0;opacity:0` 写死值，与任务卡共用 0→20 展开、inset 描边、hover 底色与同一 `#wdCardMenu` |
| 93 工序投影 | `2960:44863` | `.qf-step` 本来就有 `0 1px 2px rgba(0,0,0,.08)`，被 `.qf-track` 24px 高 + `overflow-y:hidden` 裁掉：轨道盒高 30、上 2 下 4 留绘制区，盒顶 44 + 2 让 chip 仍在稿件 y=46 |
| 94 涟漪间距 | —（本轮需求） | `.mb-dot` `right: 1px → -7px`：图标右缘 21 + 8 = 点左缘 29（按钮 28，故越出 1px），涟漪圈整体跟随 |
| 95 更多按钮右距 | —（本轮需求） | `.wd-more` 出现态去掉 `margin-right:-8px`，按钮右缘距卡片右缘 12px（标签因此净左移 24px） |

校验：新增 `verify17.mjs` 44/44；回归 `verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41（更多右距 12 / 标签距右 36 断言同步）、`verify12` 50、`verify12b` 36、`verify11` 50（标签净移 24）、`verify10` 20、`verify9` 54、`verify8` 37（空态标题 13px）、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK（qf-track 44/30、step y=2）、`smoke9` 五档无报错。

## 第 18 轮（图表竖线 / 空态折行 / 空分组计数 / 环境菜单 / 卡片菜单 / 弹窗自适应与时间轴）

| 模块 | 稿 | 状态 |
|---|---|---|
| 96 图表竖线归位 | `container 1416 · 组 9442` | 稿里 7 条竖网格线属于 `组 9442`（160×36 @20,40），图标导出时把组的 translate 拍平丢了 → 竖线跑到卡片左上（标题后面）。`icons-extra.json` 的 I29 把这 7 条包进 `<g transform="translate(20,40)">`，竖线回到绘图区 y40~76 |
| 97 空态动作不折行 | —（本轮需求） | `.wd-empty` 宽 132 → `max-content`（max-width 100%-48），`.wd-empty-acts` 加 `white-space:nowrap`；两个 13px 链接并排共 142 宽，不再换行 |
| 98 空分组不显示计数 | —（本轮需求） | `.wd-grp:has(.wd-sub .wd-empty) > .wd-grp-head .wd-num { display:none }`，无卡分组右侧数字自动隐藏 |
| 99 环境菜单两项 | —（本轮需求） | 本地下拉 = 本地 / 云环境（删 Docker 容器、云端沙箱） |
| 100 会话「更多」左间距 | —（本轮需求） | 标签到「更多」= 4px（与任务卡一致）。`.wd-sess-act` 的 gap 8→0（任务卡的 4px 来自 `.wd-more` 的 margin-left:4，叠起来就是 8 的错误来源） |
| 101 同步弹窗纵向自适应 | —（本轮需求） | `.cm-panel` 由 `height: min(804px, 100%-32)` 改为 `top:39px; bottom:39px; height:auto`——窗口 1px 边框在模态层之外，39 才是视觉上的「上下各 40」；`cm-pop` 动画同步改 `translateX(-50%)` |
| 102 日志时间轴连续 | —（本轮需求） | 原来每行只画「上一行 padding-bottom 的 16px」，圆点还有 8px margin-top → 线头断在圆点上方。改为每行 `::before` 从自己圆点中心（top:11）向下画满整行高，终点正好是下一行圆心 |
| 103 资产/工序页签留空 | —（本轮需求） | 清空两个 pane 的内容（`.cm-empty` 与 8 步 `.cm-flow` 移除） |
| 104 会话卡「更多」菜单 | —（本轮需求） | 新增 `#wdSessMenu`：置顶 / 重命名 / 归档 / 会话日志 /（`.wd-menu-div` 分隔线）/ 删除（危险色）；`openCardMenu` 按卡片类型选菜单，`bindMenu()` 统一绑定点击与 ↑↓/Esc |

校验：新增 `verify18.mjs` 39/39（竖线落位 / 空态单行 / 计数隐藏 / 环境两项 / 会话间距 / 弹窗四档尺寸 40 边距 / 时间轴无缝 / 两页签留空 / 会话菜单项与分隔线）；回归 `verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50（弹窗高度改「面板-80」）、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35（弹窗内部改相对偏移）、`wd-verify`/`verify-bars` ALL OK（空态 142 宽基线）、`smoke9` 五档无报错。

## 第 19 轮（数字分身右键菜单 / 录音工具条 / 页面背景方案）

| 模块 | 稿 | 状态 |
|---|---|---|
| 105 分身右键菜单 | —（本轮需求） | `contextmenu` → `#fabMenu`（新建分身会话 / 录音 / 隐藏）弹在圆球上方 6px、右缘对齐，Esc / 点外部关闭；隐藏态与录音态不弹 |
| 106 录音工具条 | —（本轮需求） | `.float.is-recording` 从 56 圆球横向长成 212×56 胶囊（高度不变）：红点呼吸 + `00:0N` 计时 + 7 根错相音浪条（`recWave`）+ 白底红块停止；录音中整条可点=停止，回到圆球并保持右缘不动；录音中禁用拖动。**坑**：width 有过渡，变形瞬间 `offsetWidth` 还是旧值 → 必须用目标宽度常量（`FAB_W 56 / REC_W 212`）算左边界，否则工具条往右长会出屏 |
| 107 隐藏 / 找回 | —（本轮需求） | 「隐藏」→ `.is-hidden`（淡出缩小、pointer-events:none）+ toast 提示；按 `H` 找回（隐藏后右键已不可达，故用键盘） |
| 108 页面背景方案 | —（本轮需求，保留原方案） | `.cds-frame[data-bg]` 三套：`ai` 默认（冷蓝底 + 蓝/紫/青三团极光 + 22px 点阵，点阵用 mask 在中间显、四边淡出）；`grid`（32px 方格 + 蓝调）；`plain`（原纯色，随时回退）。切换：按 `B` 循环 / `?bg=plain` / `localStorage['cecoder.bg']`；纹理层是 `.panel-main::before`（`isolation:isolate` + `z-index:-1`，压在所有内容之下且不遮字） |

校验：新增 `verify19.mjs` 39/39（右键菜单位置/项/键盘、录音变形尺寸与右缘、计时与音浪动画、停止回环、隐藏与 H 恢复、三套背景切换与持久化）；回归 `verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 20 轮（背景回退 / 任务空分组 / 会话流骨架屏 / 录音条压扁根因）

| 模块 | 稿 | 状态 |
|---|---|---|
| 109 背景回退 | —（本轮需求） | 极光/网格「效果比较差」，默认回到 `data-bg="plain"`（第 18 轮观感），`B` 键仍可切 ai/grid；storage key 升到 `cecoder.bg.v2` 让旧选择失效 |
| 110 任务空分组 | —（本轮需求） | 空分组用 `.wd-sub.is-empty` + `.wd-empty`（与会话页签同结构）、计数自动隐藏；「AI Native Factory」默认收起（去掉 is-open、补 is-edge、aria-expanded=false） |
| 111 单卡分区间距 | —（本轮需求） | `.wd-grp.is-open + .wd-grp` 补 12px：展开的分组把卡片摊开后，最后一张卡不再贴住下一分组的上边线（折叠时仍是 -1px 叠边） |
| 112 会话流（骨架屏） | `2983:53022` | `.stage.is-chat`：hero / 场景卡 / 工具栏 / 工序条全部让位，中间 `.chat` 变成左右对话骨架屏（AI 侧多行灰条 + 12px 标题，用户侧浅蓝气泡内白条，末尾三点「正在生成」），输入卡贴底、占位改「继续追问，或补充上下文…」。进入：点会话卡 / 输入后发送（Enter 同）；退出：切任务页签、点新建任务、切分段控件、Esc |
| 113 录音条被压扁 | —（两个原因） | ① `.float::after` 那圈 1px 描边是 `border-radius:50%`，56 时是正圆、212 时变椭圆 → 录音态改 28px；② 表情动画（fabJump 落地压扁）会给整条工具条做非等比缩放，圆点跟着变椭圆 → `canPlay()` 加录音/隐藏态判断，进录音时清掉动作类。另外右缘锚定改用 offset 布局坐标，避免 rect 带 scale 导致每次变形漂 1~2px |

校验：新增 `verify20.mjs` 34/34；回归 `verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 21 轮（会话详情页 / 录音条可拖 / 收起图标重做 / 标题锁高 bug / 空分组）

| 模块 | 稿 | 状态 |
|---|---|---|
| 114 会话详情标题栏 | —（本轮需求） | `.chat-head` 规格同 `.wd-head`：44 高、左右 16、底部 `inset 0 -1px #EBECED`；左槽换成「对话 / 轨迹」两个页签（选中主色 + 500 + 2px 下划线），标题栏到对话内容 32px；只在 `.stage.is-chat` 时出现 |
| 115 对话内容宽度 | —（本轮需求） | `.chat-inner` 由 720 居中改为 `width:100%` —— 与输入卡（`.c-card`，同为内容列宽）左右边界完全同步；抽屉拖宽时两者一起变 |
| 116 标签文案 | —（本轮需求） | 对话里的「数字分身」→「Cecoder」 |
| 117 录音条可拖动 | —（本轮需求） | `pointerdown` 不再排除 `is-recording`（只排除 `is-hidden`）；拖动后仍 212×56、计时不断，松手单击才停止 |
| 118 收起图标 | `direction/to-left`（联集 9.33×8.12 @(2,3)） | 按稿里的联集尺寸重排：竖条 1.21×8.12 @x1.98（圆角 0.605）、左指箭头 `M11.02 3.7L4.9 7L11.02 10.3` stroke 1.1（原来 1.4 偏粗、整体偏小偏右）。**注意**：稿里导出的 path 父级 transform 丢失，直接把旋转变换套上去会得到「短竖条 + 大箭头」的斜向错位图形，所以只能用联集 bbox 反推尺寸后按标准形态还原 |
| 119 标题锁高 bug | —（本轮需求） | `wdLockTitles()` 原来会把折叠分组里 `offsetHeight=0` 的标题锁成 `0px`，展开后标题不显示（银行柜面业务 / Cecoder-harness 的卡片都中了）。现在只锁量得到高度的标题，并在任何分组展开/收起后重锁 |
| 120 Nutstore 空态 | —（本轮需求） | 该分组改为 `.wd-sub.is-empty` + `.wd-empty`（去掉卡片），计数自动隐藏 |
| 121 添加工作目录 | —（本轮需求） | 文字色由 `--cds-text-primary` 降一级到 `--cds-text-secondary`（图标本来就是次级色，现在统一） |

校验：新增 `verify21.mjs` 37/37（标题栏/页签/32 间距、两档抽屉宽度下内容宽与输入卡同步、Cecoder 文案、录音条拖动、图标 9.33×8.12 与相对位置、所有卡片标题高度、Nutstore 空态、文字色）；回归 `verify20` 34、`verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34（任务卡 7→6）、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 22 轮（会话空分组 / 卡片选中态 / 通栏标题栏 / 按钮贴角 / 对话底栏）

| 模块 | 稿 | 状态 |
|---|---|---|
| 122 会话空分组 | —（本轮需求） | 会话页签的「AI Native Factory」改为默认收起（`is-edge` + aria-expanded=false），内部保持 `.wd-sub.is-empty` + 空态块、计数隐藏，与其它空分组一致 |
| 123 会话卡选中态 | —（本轮需求） | 点卡片 → 单选：自身加 `.is-sel`（蓝色 11%），同时打开会话详情；点「更多」不触发选中；退出会话后选中保留 |
| 124 标题栏通栏 | —（本轮需求） | `.chat-head` 从 `.stage` 里挪到 `.panel-main`，`left:0; right:0; top:0` 横跨整个面板；左侧 `padding-left:44px` 让开 28px 的展开按钮；`.stage.is-chat` 从 `top:8` 改 `top:44`，标题栏 32px 间距不变 |
| 125 展开按钮贴角 | —（本轮需求） | `.menu-btn` 的 `left/top: 7px` → `0`，贴 panel-main 左上角 |
| 126 对话页底部输入卡 | `2983:53022`（设计稿需登录，按平台语言还原） | 会话态换成「单卡形态」：去掉灰色背板 `.c-plate`（那是首页浮在 hero 上的托底），把「本地 / 工作目录 / Enter 提示」收进卡片内；卡高 = 输入高 + 116，卡内底部留白 12；`composer` 与卡等高，整块就是对话页的底栏 |

校验：新增 `verify22.mjs` 26/26（会话空分组默认收起/空态/计数、卡片单选选中与保留、更多不选中、标题栏通栏与 44 让位、内容下移 44、按钮贴角、输入卡单卡形态与尺寸）；回归 `verify21` 37、`verify20` 34、`verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 23 轮（任务详情：PRD pane 模块移植）

| 模块 | 稿 | 状态 |
|---|---|---|
| 127 任务详情整体 | `开发工作台v1.0 版本-261120(1).html` 的 `#pane` | 点任务卡 → `.panel-main` 整块换成「40 高返回条 + pane（标签栏 + 内容）」。pane 是 PRD 原型整份文档在 iframe 里原样运行（交互 100% 保留），只做两件事：① `.mg-d2c/build-pane.mjs` 生成 `prd/pane.html`——隐藏 `.top/.home/.tasks/.timeline/.copilot/.coachDock`，把 `.work/.main/.pane` 改成单列铺满；② 注入皮肤把 token 对齐到 Cecoder（`--accent #3770F7`、`--fg #1F1F1F`、`--line #E5E5E5`、14px 正文），并补一套 `@media (max-width:1180px)` 覆盖，避免原型在窄面板下切成「整页滚动的移动版」 |
| 128 与主页面联动 | —（本轮需求） | 点卡 → 先落选中态（`.is-sel`）再打开详情；换卡 → iframe `?task=N` 跟着换；退出：返回按钮 / Esc / 切「任务」页签；详情打开时给 `.cds-frame` 加 `is-detail`，右下角数字分身自动淡出让位 |
| 129 层级 | —（本轮需求） | `.task-detail { z-index: 3 }`：盖住 stage，但低于 9 的「展开任务列表」按钮，详情里仍能打开左侧列表；返回条 `padding-left: 40px` 让开该按钮 |
| 130 跨源 iframe 的两个坑 | —（本轮需求） | ① 弹窗里的 `autofocus` 会被浏览器拦截并往控制台报错 → 构建时正则摘掉；② 程序化 `focus()` 同样报错 → 注入「用户未在 pane 内操作前一律跳过 focus」的守卫（`pointerdown` 后恢复） |

校验：新增 `verify23.mjs` 27/27（铺满 panel-main、40 高返回条、标题/序号映射、iframe 内只显示 pane、标签栏 5 个、pane 有内容、无横向溢出、token 对齐、换卡换内容、返回/Esc/页签三条退出、悬浮球让位、层级与展开按钮可点）；回归 `verify22` 26、`verify21` 37、`verify20` 34、`verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28（补「点卡后先退出详情」）、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

产物：`cecoder-home.html`（375KB）+ `prd/pane.html`（1.2MB，**必须同目录一起发布**）。

## 第 24 轮（会话默认选中 / 对话页精简 / 移除任务详情 / 设置弹窗）

| 模块 | 稿 | 状态 |
|---|---|---|
| 131 会话页签默认选中 | —（本轮需求） | 每次进入「会话」页签都把最上面第一张会话卡设为选中（`selectFirstSession`，切 tab 时 setTimeout 0 落类） |
| 132 对话页去掉次级行 | —（本轮需求） | `.panel-main.is-chat .c-foot { display:none }`，输入卡高度回到「输入高 + 82」，`.composer` 同步；灰背板继续保持隐藏 |
| 133 移除任务详情 | —（本轮回退） | 第 23 轮的 `.task-detail`（CSS / HTML / JS）整体删除，`prd/pane.html` 与 `verify23.mjs` 一并删掉；任务卡点击回到「只落选中」。**坑**：删 HTML 时连带了 panel-main 的闭合 `</div>`，导致模态层被塞进 panel-main（同步弹窗宽度变成 1022）——已补回 |
| 134 设置弹窗 | `设置/通用设置`（左 3107:44277 / 右 3107:44311） | 顶栏「设置」→ `.stg-panel`：左右各留 40（`top/bottom:39` + 窗口 1px 边框）、宽 960、**无底栏**；左栏 256 菜单（通用设置 / 模型 / 连接器 / Hooks / 云环境 / 归档任务，取自 PRD 文件里的设置页清单），右栏分组行 + 分段/下拉/开关/输入框控件；开关与分段支持交互、Esc 与蒙层关闭 |
| 135 两个连带修复 | — | ① 会话里的 Esc 只退出会话，不再顺带收起抽屉（`stopImmediatePropagation`）；② `.float` 的 offsetParent 是 `.panel`，拖动/录音变形原来按 frame 坐标算（差 9px），改用 offset 坐标 |

校验：新增 `verify24.mjs` 27/27（默认选中、c-foot 隐藏与卡高、task-detail 彻底移除、设置弹窗结构/切换/开关/分段/关闭）；回归 `verify22` 25、`verify21` 37、`verify20` 34、`verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify7` 28、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 25 轮（分组头：箭头与文字换位）

| 模块 | 稿 | 状态 |
|---|---|---|
| 136 分组头顺序 | —（本轮需求） | 任务分组与会话分组的标题行由「文字 → 箭头」改为「箭头 → 文字」（`[12x12][4][名称][…][计数]`）。静态 10 个分组头全部换位；`.wd-caret` 的 4px 间距从 `margin-left` 改 `margin-right`；`addDirGroup()` 动态新增的目录分组也改成「先箭头后名称」。展开态旋转逻辑不变（`.wd-grp.is-open .wd-caret { rotate(90deg) }`），计数仍靠 `margin-left:auto` 贴右 |

校验：`verify7` 的间距断言改为量「箭头右缘 → 文字左缘 = 4px」，28/28；回归 `verify24` 27、`verify22` 25、`verify21` 37、`verify20` 34、`verify19` 38、`verify18` 39、`verify17` 44、`verify16` 42、`verify15` 34、`verify14` 43、`verify13` 41、`verify12` 50、`verify12b` 36、`verify11` 50、`verify10` 20、`verify9` 54、`verify8` 37、`verify6` 35、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 26 轮（分组头内边距 + 计数颜色统一）

| 模块 | 稿 | 状态 |
|---|---|---|
| 137 分组头内边距 | —（本轮需求） | `.wd-grp-head` 的 `padding: 0 12px` → `0 8px`（任务页签与会话页签共用，一起生效）；箭头离左缘、计数离右缘各近 4px |
| 138 计数颜色 | —（本轮需求） | `.wd-num` 统一三级灰 `--cds-text-tertiary`（#868686），原来 `.n1` 正文色 / `.n2` 次级 / `.n3` 三级 / `.n4` disabled 的四级递进取消；`.wd-num.is-todo`（「有 1 项待确认」）保留 #F77234 —— 它是状态提示不是计数 |

校验：`wd-verify`/`verify-bars` ALL OK、`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12` 50、`verify12b` 36、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 34、`verify21` 37、`verify22` 25、`verify24` 27、`smoke9` 五档无报错。

## 第 27 轮（chat-head 左缘补竖线）

| 模块 | 稿 | 状态 |
|---|---|---|
| 139 chat-head 左缘竖线 | —（本轮需求） | 抽屉右缘的分隔线是 `.ws-drawer` 的**外投影**（`1px 0 0`），被 `.chat-head` 不透明白底压掉，所以标题栏那一行看不到竖线。现在给 `.chat-head` 补 `inset 1px 0 0 0 #EBECED`（与抽屉线同一列、同色），一条线从标题栏到底部贯通 |

校验：`verify21` 37（标题栏底边线断言改为兼容双 inset）、`verify22` 25、`verify24` 27、`verify19` 38、`verify15` 34、`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12` 50、`verify12b` 36、`verify13` 41、`verify14` 43、`verify16` 42、`verify17` 44、`verify18` 39、`verify20` 34、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 29 轮（按钮位置回退 / 会话默认选中并打开 / 收起图标箭头角度）

| 模块 | 稿 | 状态 |
|---|---|---|
| 140 展开按钮位置 | —（本轮需求） | `.menu-btn` 的 `left/top` 由第 22 轮的 `0` 回到 `7px`：实测相对 `#panelMain` 左上角 7,7（面板 9,49 → 按钮 16,56）。第 22 轮是「去掉 7px 贴边」，本轮按要求恢复 |
| 141 会话页签默认选中 | —（本轮需求） | `selectFirstSession()` → `openFirstSession()`：选中第一个**可见**会话卡后**同时打开该会话**（`enterChat()`），侧栏高亮与中间对话流一致；若第一个分组是折叠的，先自动展开再选。选中仍为单选 |
| 142 收起图标箭头 | `direction/to-left`（联集 9.33×8.12 @(2,3)） | 箭头由 `M11.02 3.7L4.9 7L11.02 10.3`（6.12 深 × 6.6 高，开口 ≈59°，偏扁）改为 `M10.76 3.49L6.62 7L10.76 10.51`（4.14 深 × 7.02 高，开口 ≈81°）。开口角度取自稿件自身路径的固有比例（旋转后箭头高 31.94 / 深 18.8 → 深高比 0.59，即 81°），联集尺寸仍精确落在 9.33×8.12；描边 1.1、竖条 1.21×8.12 @x1.98 不变 |

校验：`verify22` 25/25（按钮断言 0,0 → 7,7）、`verify24` 28/28（新增「默认选中同时打开会话」；第 2 段先 Esc 回首页再量 c-foot）、`verify21` 37/37（联集断言改为「按半线宽外扩到可见边缘」——SVG 的 `getBoundingClientRect` 不含 stroke）、`verify12` 50、`verify14` 43（箭头 path 断言同步）；其余全绿：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12b` 36、`verify13` 41、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 34、`wd-verify`/`verify-bars` ALL OK、`smoke9` 五档无报错。

## 第 30 轮（拆成三个独立页面 + 外部共享资源）

| 模块 | 状态 |
|---|---|
| 143 页面拆分 | 原来是单文件 401KB（首页 + 会话流 + 任务详情全在一个 `panel-main` 里）。现在拆成三个独立页面：`cecoder-home.html`（工作台首页）/ `cecoder-session.html`（会话详情）/ `cecoder-task.html`（任务详情），各自 121–153KB |
| 144 共享资源 | `assets/tokens.css`（设计 token + 颜色覆盖，47KB）、`assets/app.css`（页面样式 + 任务页新增样式，97KB）、`assets/app.js`（全部交互，76KB）。三个页面都 `<link>`/`<script src>` 同一套，改一次全站生效，不再复制样式 |
| 145 构建管线 | 新增 `.mg-d2c/build-pages.mjs`：源码拆成 `src/*.html` 部件（top / drawer / panelmain / chathead / rightpanel / stageopen / homeA / chat / homeB / composer / closemain / floats / tail），按页拼装。**旧的 `page.part.html` + `build-page.mjs` 已退役**（保留仅作历史），后续改动请改 `src/` 与 `assets/` |
| 146 链接 | 首页点任务卡 → `cecoder-task.html?tab=任务&id=N`；点会话卡 → `cecoder-session.html?tab=会话&id=N`；任务页「返回」→ `cecoder-home.html?tab=任务`；会话页 Esc → `cecoder-home.html?tab=会话&sel=N`（回列表保留刚才那条的选中）。会话页内点另一条会话 = 原地切换（不重载，`replaceState` 同步 id）。首页输入框发送 → 带这句话跳会话页，落为第一条消息（`sessionStorage` 传话） |
| 147 页面类型判断 | `body[data-page]` = home / session / task。会话页与任务页复用 `is-chat` 那套「单卡输入区」样式；任务页新增 `.task-head`（52 高：返回 + 标题 + 状态 chip + 进度）与 `.task-body`（任务概览四行 + 占位区） |
| 148 home-only 逻辑加守卫 | `#scene` 场景卡、chat 相关（`chatView` / `chat-tab`）在非首页不存在，原脚本是单个 IIFE，一处 null 会中断全脚本 —— 已给场景卡、对话页签加空值守卫，三页均 0 报错 |

校验：新增 `verify25.mjs` 37/37（三页存在与体积、外部资源、首页无会话流、点击卡跳转与 id、会话页标题栏 44/两页签/32 间距/宽度=输入卡/单卡输入区、发送追加消息、会话内原地切换、任务页 52 标题栏与四项元信息/占位/返回链接、Esc 回列表、首页发送带话跳转与首条消息、1024 宽无横向溢出）。
回归：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12` 50、`verify12b` 36、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 14、`verify21` 17、`verify22` 25、`verify24` 28、`wd-verify` / `verify-bars` ALL OK、`smoke9` 五档无报错。
说明：`verify20` 与 `verify21` 里「在首页内切换会话流」的段落已删除（该形态不存在了），相关覆盖转由 `verify25` 承担；两套其余断言照旧。

## 第 31 轮（页面定名 / 落地回首页 / 右栏 / 页签记忆 / 输入卡标签）

| 模块 | 状态 |
|---|---|
| 149 页面定名（按用途） | 三个页面按用途命名并统一到文档与标题：`cecoder-home.html` = **落地首页**（`data-page="home"`）、`cecoder-session.html` = **会话页**（`session`）、`cecoder-task.html` = **任务执行页**（`task`，原「任务详情」）。文件名/URL 不动（`cecoder-task.html` 早已是按用途命名，改名只会打断链接），只改语义与界面文案：`<title>` → 「Cecoder · 任务执行」、`#tkTitle` 兜底 → 「任务执行」、占位文案 → 「任务执行页已独立…」 |
| 150 新建任务回落地 | 所有 `[data-action="新建任务"]`（抽屉头部 `wd-link`、各空分组里的 `wd-newtask`、新增工作目录空态）在任何页面都跳 `cecoder-home.html`（不带参数），并把 `cecoder.wsDrawer.open` 置 false —— 回到最初那张 hero 首屏，而不是带着侧栏的挤压态 |
| 151 chat-tabs 左间距 24 | `.chat-head` 左内边距分两态：抽屉展开（菜单键淡出）时 **24px**（稿件真值），抽屉收起时 44px 让开 left:7 的 28px 菜单键，否则按钮会压住「对话」两个字。切换带 260ms 同缓动过渡（`.ws-drawer.is-open ~ .panel-main .chat-head`） |
| 152 会话页右栏 | `.chat-head` 右端新增 `.chat-more` 开关（14px 图标：面板框 + 竖分隔 + 箭头，展开后箭头旋转 180°）；`src/rightpanel.html` = `.rs-drawer`（panel 内最后一个 flex 子项，宽度 0 → `--rs-w` 挤压内容，左缘 5px 把手拖宽 280–480 默认 320，`localStorage['cecoder.rsDrawer']` 记展开态与宽度，解析期由内联脚本还原避免闪动）。内容：44 头部（上下文 + 收起键）、40 页签（变更 3 / 文件）、改动列表（+18/−4 等）与目录列表；Esc 先收右栏、再按才回列表 |
| 153 页签记忆 | `localStorage['cecoder.wdTab']` 记「任务/会话」；首页无 `?tab=` 时按记忆还原（首次仍是任务）。会话页固定 会话、任务页固定 任务（顺带修掉「直接开 `cecoder-session.html` 时抽屉还停在任务列表」的错位） |
| 154 输入卡类型标签 | 选中快速任务 → 卡内出紫色标签（稿 2960:43661：22 高、底 rgba(91,88,255,.08)、1px rgba(91,88,255,.16)、字 12/20 Medium `#5B58FF`、右侧 12×12 关闭）；选中工作台 → 蓝色标签（稿 2960:44653：底 #F5F8FF、1px #D3DFFD、字 `#3770F7`，文本 = 「工作台全名 · 子项」，换子项文字跟着变）。关掉标签 = 取消上方 chip 选中（工序条同步收起）。卡片高度靠 `--c-tag-h` 变量联动（composer / c-card / c-input / c-row / c-foot 全部 +34），无标签时变量为 0，几何零位移 |
| 155 窄窗兜底 | 960 宽左右栏同开时内容列只剩 ~280：`@container (max-width: 520px)` 把模型名收成只留箭头、权限名截断，保证「加号 / 权限 / 模型 / 发送」始终留在卡内。正常宽度不触发 |

校验：新增 `verify31.mjs` 36/36（新建任务从会话/任务页回首页且落地收起侧栏、页签记忆三态、会话/任务页页签归属、chat-tabs 24/44 两态、右栏展开 320/挤压/拖宽 400/重载记忆/按钮态、Esc 先收右栏再回列表、标签三种联动与卡片 128↔162）。
回归：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12` 50、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 14、`verify21` 17、`verify22` 25、`verify24` 28、`verify25` 37、`wd-verify` / `verify-bars` ALL OK、`smoke9` 五档 no-err。
改了两处旧断言：`verify22` 的「页签左 44 起」改为 24（本轮需求）；`verify17` 的第 10 项先显式点回「任务」页签再量（页签会记忆，测试浏览器共用 localStorage）。

## 第 32 轮（分组「更多」/ 右栏默认一半 + 新图标 / 新建会话回首页形态）

| 模块 | 状态 |
|---|---|
| 156 分组头「更多」 | 分组头由 `<button>` 改为 `div[role="button"][tabindex="0"]`（button 不能嵌套 button），末尾追加 `.wd-more.wd-grp-more`。显隐交互与任务卡完全一致：默认 `width:0 / opacity:0 / pointer-events:none`，`分组头 hover / 键盘聚焦 / 菜单展开` 时展开到 20×20、inset 1px 描边、hover 底色 —— 展开时把右侧计数向左挤 24px（不重排标题）。菜单 `#wdGrpMenu`（floats.html，fixed 定位）：置顶 / 打开文件夹 / 编辑分组 /（分隔线）/ 移除分组（danger）。「置顶」= 移到本容器首位并滚动到可视区，「移除分组」= 200ms 淡出位移后摘除节点（不持久化，刷新即回），其余三项给 toast。无计数的分组（如空的 AI Native Factory）用 `.wd-grp-act` 包住「计数 + 更多」并 `margin-left:auto`，按钮仍贴右内缘 |
| 157 会话分组归属 | 会话页里 **普通会话 / 数字分身会话 / 工作台会话** 是内置分组（系统托管），没有「更多」；**Nutstore / AI Native Factory** 等用户自建分组与任务分组同款，带「更多」。动态「添加工作目录」新建的分组也自动带「更多」（结构从静态头克隆，含 `.wd-grp-act`） |
| 158 右栏默认宽度 | `.rs-drawer` 默认宽 = **panel-main 的一半**（= panel 内容宽 − 已展开的左栏，再 /2），上限 280–720（原 480）。基线在解析期内联脚本里算一次避免闪动；未手动拖过时随窗口 resize、左栏开合（`rsFollow()`）重新对半，拖过之后以 `localStorage['cecoder.rsDrawer'].w` 为准 |
| 159 右栏开关图标 | 换成 14×14「面板 + 右列」图标：圆角外框 + 竖分隔 + 右侧列填充（`.rs-fill`，收起 16% / 展开 55%），去掉原先的箭头与 180° 旋转 |
| 160 新建会话回首页形态 | 所有 `[data-action="新建会话"]`（会话分组的虚线按钮、空态里的「新建会话」）→ 把 `cecoder.wsDrawer.open` 置 true 后跳 `cecoder-home.html?tab=会话&new=1`：左侧保持会话列表展开、右侧切回首页 hero + 输入卡；`new=1` 时**不预选任何会话**（`SUPPRESS_TAB_SEL`），光标自动落在输入框、内容列滚回顶部 |

校验：新增 `verify32.mjs` 30/30（任务页 5 个分组都有更多且默认 0 宽、hover 到 20、菜单 4 项 + 1 分隔线、点更多不折叠分组、Esc 关闭、置顶换位 + toast、移除分组消失；会话页内置 3 组无按钮 / 自建 2 组有；右栏默认 = 一半、左栏收起后跟随、拖拽记忆、新图标存在；新建会话落首页 + 抽屉展开 + 会话页签 + 零选中 + 焦点在输入框；键盘 Enter/Space 折叠）。
回归：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify10` 20、`verify11` 50、`verify12` 50、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 14、`verify21` 17、`verify22` 25、`verify24` 28、`verify25` 37、`verify31` 36、`wd-verify` / `verify-bars` ALL OK、`smoke9` 五档 no-err。
改了四处旧断言：`verify31` 的「右栏展开 320 / 拖到 400」改为「= panel-main 一半 / 拖拽 +78」（本轮需求）；`verify11`、`verify12`、`verify17` 的 `.wd-more` 选择器收窄到 `.wd-card / .wd-sess-card` 内（分组头也有 `.wd-more` 了，全局第一个不再一定是卡片上的）。

## 第 33 轮（分组「更多」间距 / 任务页标题栏与清空 / 去图标 / 图标加大）

| 模块 | 状态 |
|---|---|
| 161 分组「更多」间距 8 | 分组标题栏（任务 tab 全部工作组 + 会话 tab 自建分组）的「更多」与左侧对象（计数 / 组名）间距由 4px 改为 **8px**：新增 `.wd-grp-head:hover .wd-more, .wd-grp-head:focus-visible .wd-more, .wd-grp-head .wd-more.is-open { margin-left: 8px }`。卡片上的「更多」仍是 4px（两处不同场景分开写，互不影响）。按钮仍 20×20，hover 时宽度 0 → 20 的过渡不变 |
| 162 task-head 44 | `.task-head` 高度 52 → **44**（与 `chat-head` / `rs-head` / `wd-head` 同一节奏），左内边距 44 → 16；删掉「返回」链接 `.tk-back` 与竖分隔 `.tk-sep`（对应 CSS 一并删除），标题直接贴左。`body[data-page="task"] .stage.is-chat` 的 `top` 同步 52 → 44 |
| 163 去「添加工作目录」图标 | `#wdAddDir` 里 14px 文件夹 + 图标整块移除，按钮只剩文字（`.wd-adddir` 的 `gap:6px` 对单子元素无影响），虚线框、32 高、次级色不变 |
| 164 任务执行页清空 | 只留标题栏：删掉 `.task-body`（任务概览四行 + 占位卡）与 `TASK_BODY` 构建块；输入卡与版本号在任务页用 CSS 收起（`body[data-page="task"] .composer`、`.stage > .version` = `display:none`）—— **DOM 保留**，`app.js` 里 20 多处 `.c-input` / composer 绑定不用加守卫，日后恢复只删这两条 CSS。`applyTask()` 里的 `setText('tkGroup'…)` 等对已删除节点是 null-safe，不报错 |
| 165 三个面板键图标 14 → 18 | 「展开右栏」`#rsToggle`、「收起任务栏」`.wd-collapse`、「收起右栏」`.rs-collapse` 加大两号：新增 `.ico18`（18×18），三个 SVG 按 **18 网格重绘**（描边 1.4 ≈ 原 1.1×18/14，圆角/箭头等比）：面板框 `x2 y3.5 14×11 r2.4` + 分隔 `x11.3` + 右列填充（`11.3→15.3`，圆角 1.7）；竖条 `1.6×11.2 @2.6` / 镜像 `@13.8`，箭头 `M13.9 4.4L8.6 9L13.9 13.6`（右栏为镜像）。按钮命中区仍是 28×28，图标居中 5/5 |

校验：新增 `verify33.mjs` 25/25（任务分组「更多」与计数间距 8 / 菜单展开时仍 8；会话自建分组左边距 8、展开后右缘 8；task-head 44 且通栏贴顶、标题左 16 垂直居中、无返回无分隔线、内容区空、输入卡与版本号 `display:none`、stage 从 44 起、标题取被点卡片；`#wdAddDir` 零图标节点且文字居中、32 高；三个图标 18×18、按钮 28×28、右栏收起键居中 5/5）。
回归：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify11` 50、`verify12` 50、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 14、`verify21` 18、`verify22` 25、`verify24` 28、`verify25` 35、`verify31` 36、`verify32` 30、`wd-verify` / `verify-bars` ALL OK、`smoke9` 五档 no-err。
改了六处旧断言：`verify25` 的任务页段落（52 高 + 四项元信息 + 返回链接 → 44 高 + 内容为空 + 无返回，返回键改走 `goBack()`）；`verify8` / `verify12` / `verify14` / `verify21` 的收起图标 viewBox 与路径/竖条/描边断言（14 网格 → 18 网格）；`verify21` 的「添加工作目录」段落由「图标同色」改为「按钮内无图标且文字居中」。

## 第 34 轮（图标对齐「排序」/ 右栏默认一半 / 任务执行页整体换稿）

| 模块 | 状态 |
|---|---|
| 166 三个面板键图标回到 14 | 「展开右栏」`#rsToggle`、「收起任务栏」`.wd-collapse`、「收起右栏」`.rs-collapse` 尺寸与工具行「排序」图标一致：**盒子 14×14、viewBox 0 0 14 14**，但改成**满版绘制**（原来是 10.5×8.2 缩在 14 盒里，所以显小）。面板框 12.2×10.2 r2.2 描边 1.2、竖分隔 x9.4；收起/展开为竖条 1.4×9.4 @2.3 + 箭头 `M12.2 3.3L7.5 7L12.2 10.7`（右栏镜像）描边 1.25。按钮命中区仍 28×28，图标居中 7/7 |
| 167 右栏默认宽 = panel-main 的一半 | 第 32 轮已按「一半」算，但有两处会破功，本轮修掉：① `localStorage['cecoder.rsDrawer'].w` 只要存在就当成用户手改宽度还原 —— 早期版本留下的 400/320 会一直生效；现在只有**拖拽后写入 `manual: true`** 才认，否则一律按「一半」重算（`rsManualW()`）。② 上限 720 在 1920 宽屏会把 791 截成 720 —— 上限放宽到 960（`aria-valuemax` 同步）。实测 1440：551 = 1102/2；1920：791 = 1582/2 |
| 168 任务执行页换稿（顶部 + 工序条 + 页签条） | 删掉第 30/33 轮的 `.task-head`（标题栏）与 `.task-body`（任务概览占位），改为稿件 3113:44395 的 1140×206 三段模块（`src/taskview.html`，构建时作为 `pre` 插在 panel-main 里）：**① `.task-top` 44**：三段视图按钮（全链路 76 / 工序进度 (4/9) 119 / 工序资产 (12) 112，12/22、F5F8FF 选中底 + B4C9FC 描边）+ 右侧「自动执行」88×32（F5F8FF 底 / 主色 14/22 / 距右 8）；**② `.task-steps` 122**：9 道工序（24 圆点 + 名称 14/22 + 状态 12/20；已完成 F5F8FF+对勾、当前主色实心 + 32 虚线环、待开始 F2F2F2+序号），工序间距 64、左右内边距 41，连线 1.6 高（前两条主色、其余灰）由 JS 按圆心 ±20 定位，底部 16 起 6 高进度条 =（track−32）×4/9；**③ `.task-tabs` 40**：概要设计（F2F2F2 底 14/500）+ 变更 / Git / 终端 / 浏览器（14 图标 + 14/22 次级字 + 12 关闭键）+ 竖分隔 1×16 + 28 新建键，右侧竖分隔 + 28 收起键 |
| 169 自适应与交互 | 面板窄于稿件 1140 时 `@container (max-width:1139px)` 把工序间距收到 56，9 道工序仍整排放下（960 宽才横向滚动，滚动条隐藏）；`margin:0 auto` 让工序条在宽面板里居中，进度条跟 track 走。JS：视图切换选中态、页签切换 / 关闭（选中交给前一个）、新建键 toast、收起键收起页签行（`is-collapsed` + 箭头翻转）、自动执行 toast |

校验：新增 `verify34.mjs` 31/31（三图标 14×14 且与排序盒子一致、居中 7/7；右栏四种状态：干净 551=1102/2、脏数据 w=400 被忽略、manual=520 保留、1920 宽 791 不被截；任务页三段 y=0/44/166 与高 44/122/40、stage 从 206 起、三段按钮 76/119/112±1、自动执行 88×32 距右 8、9 工序 8 连线均按圆心 ±20、当前项 32 虚线圈、进度条几何、5 页签 + 2 竖分隔、无旧标题栏、无 JS 报错；交互 5 项：视图切换 / 页签切换 / 关闭 / 收起 / toast）。
回归：`verify6` 35、`verify7` 28、`verify8` 37、`verify9` 54、`verify11` 50、`verify12` 50、`verify13` 41、`verify14` 43、`verify15` 34、`verify16` 42、`verify17` 44、`verify18` 39、`verify19` 38、`verify20` 14、`verify21` 18、`verify22` 25、`verify24` 28、`verify25` 38、`verify31` 36、`verify32` 30、`verify33` 22、`wd-verify` / `verify-bars` ALL OK、`smoke9` 五档 no-err。
改了七处旧断言：`verify8` / `verify12` / `verify14` / `verify21` 的收起图标几何（18 → 14 网格满版）；`verify25` 的任务页段落（44 标题栏 → 三段模块 44/122/40 + stage 206）、第 7 段改用 `<title>` 校验任务名；`verify31` 的 D5/D5b（`#tkTitle` → `<title>`）；`verify33` 的 B 段（旧标题栏 → 新模块）与 D 段（18 → 14）。

## 第 35 轮（十项微调：箭头张角 / 滚动条 / 点阵环 / 28 高 / 竖线 / 24 内距 / 13 字号 / 去图标 / 对话 32 / 右栏合并一行）

| 模块 | 状态 |
|---|---|
| 170 两枚收起图标箭头不再扁 | `.wd-collapse` / `.rs-collapse` 的箭头从 `M12.2 3.3L7.5 7L12.2 10.7`（dx 4.7 / 半高 3.7 = 1.27，看着扁）改成 **dx 4.2 / 半高 4.1 = 1.02（≈45°）**：`M11.9 2.9L7.7 7L11.9 11.1`，右栏镜像 `M2.1 2.9L6.3 7L2.1 11.1`；竖条 1.4×9.4 不动，描边 1.25 |
| 171 ts-scroll 真实滚动条 | 去掉 `scrollbar-width:none` + `::-webkit-scrollbar{display:none}`（原先是彻底隐藏），改成 **`overflow-x:auto` + 自绘 6px 滚动条**：thumb `rgba(0,0,0,.16)` 圆角 6、track 透明、hover 加深到 `.28`。**坑**：Chrome 只要看到 `scrollbar-width`/`scrollbar-color` 就会忽略整套 `::-webkit-scrollbar`（退回原生悬浮条），所以这两个属性一个都不能写 |
| 172 当前工序外环 | ① 偏心根因：`::after` 是 **content-box**（`*` 选择器不匹配伪元素），32 宽 + 2px 边框实际占 36，`left/top:-4` 就偏了 2px。改成 `left/top:50%` + `margin:-16px` + `box-sizing:border-box`，几何上必然同心。② 虚线改成 **mask 点阵**：`--ts-ring` 是 32 网格、r15、描边 2、`stroke-dasharray='3 4'` 圆头白圈，当作 mask 用，底色 `background-color` 给主色；`::after` 加 `animation: tsOrbit 6s linear infinite` 绕圆心匀速转（`border: dashed` 既控不了点距也转不动），`prefers-reduced-motion` 下停转 |
| 173 自动执行 28 高 | `.tt-run` 32 → **28**（与三段按钮同高，纵向居中回到 8/8），88 宽、F5F8FF + B4C9FC 不变 |
| 174 两处左缘竖线 | `.task-top`、`.task-tabs` 补 `inset 1px 0 0 0 #EBECED`。**根因**：抽屉右缘那 1px 是抽屉自己的外投影（z-index 2），而这两条是 `z-index:9` 的白底，把线压掉了；`.task-steps` 没有 z-index，所以一直看得见 —— 这就是"只缺两条"的原因。补完三段像素连续（verify35 F1 用 1px 列采样验证） |
| 175 ts-scroll 内边距 24 | `.ts-track` 左右 41 → **24**（上下 24 由 `.ts-item{padding-top:24px}` 承担）；同时去掉上一轮的 `margin:0 auto` 居中 —— 居中了量出来是 60，就不是 24 了。放不下时才横向滚动（960 面板 622 → 需要滚动） |
| 176 ts-name 13px | 字号 14 → **13**，行高 22 → 20（保持名称/状态两行的节奏） |
| 177 两段按钮去图标 + 13px | 全链路、工序资产删掉 `.ico`（只留文字与 `(12)` 计数），`.tt-btn` 字号 12 → **13**；工序进度保留右侧下拉箭头。宽度随之自然收缩：63 / 125 / 103（原稿 76 / 119 / 112 含图标） |
| 178 对话流左右 32 | `.chat` padding `32px 0 8px` → **`32px 32px 8px`**。注意：内容列因此比底部输入卡窄 64（卡仍按 stage 宽度），如需输入卡一起内缩，给 `.panel-main.is-chat .composer` 加左右 32 即可 |
| 179 右栏合并一行 | 删掉 `<header class="rs-head">`（「上下文」+ 收起键）与 `.rs-head/.rs-title` 样式，新 `.rs-top` 一行 44 同时装「变更 / 文件」页签（撑满 44，下划线落到底边）与收起键（`align-self:center`，距右 8）；`.rs-tabs` 40 → 44、`.rs-body` 起点 88 → **44**，整体省掉一行 |

校验：新增 `verify35.mjs` 27/27（两枚箭头张角 1.02 且左右镜像；任务页 1440 无滚动条 / 960 需滚动、首项仍从左 24 起；`scrollbar-width` 不再为 none；track padding `0 24px` + item 24；ts-name 13/20；外环 32×32 + mask + tsOrbit 且中心差 ≤0.5；top/tabs 左竖线 + 1px 列像素三段连续；自动执行 28；两段按钮零图标 13px、工序进度仍有一个箭头；chat padding 32 且内容左右各缩 32；右栏无 `rs-head`、页签行 44/44、body 从 44 起、收起键在页签行右端）。
回归：`verify6~25`、`31`、`32`、`33`、`34`、`wd-verify`、`verify-bars`、`smoke9` 全绿。改了五处旧断言：`verify12`/`verify14` 的箭头 `d`；`verify25` 第 3 段（对话宽度一致性 → 左右各缩 32）与第 6 段（三段按钮宽度 63/125/103）；`verify34` C3/C3b/C4/C8/C13（宽度、28 高、mask 环、24 内距）。

## 第 36 轮（工序条居中 / 底部那条其实是滚动条 / 点工序进度折叠）

| 模块 | 状态 |
|---|---|
| 180 工序整体居中 | `.ts-track` 的 `margin: 0` 改回 **`margin: 0 auto`**（配 `width:max-content`）：放得下时左右空隙相等（1920 各 244、1440 各 36），放不下时剩余空间为负、auto 边距退化为 0，仍从左边 24 起滚 —— **不会**像 flex 里 `justify-content:center` 那样把左端顶进滚动区外拿不回来。第 35 轮为了量内距 24 去掉的居中，本轮恢复 |
| 181 底部那条 = 滚动条（不是进度条） | 稿 16,156 500×6 的那条原来按 `(track−32)×4/9` 画成"假进度条"，用户确认**它其实是滚动条**。改法：① `.ts-scroll` 收掉原生滚动条（`scrollbar-width:none` + `::-webkit-scrollbar{height:0}`），滚动能力不变；② `.ts-prog` 重画为**自绘真实滚动条**（左右各缩 16、离底 4、6 高、圆角 6），默认 `opacity:0 / pointer-events:none`，**放不下才淡入**（`.is-on`）；③ 滑块 `.ts-prog-thumb` 长度 = 视口/内容（不是写死 4/9），位移 = `scrollLeft`/可滚距离；④ 可拖拽（`pointerdown/move/up` + `setPointerCapture`，位移按「可拖距离/可滚距离」等比放大），点轨道空白滚到点击处，hover/拖拽加深到 `.28`。**坑**：`var drag` 会函数级提升，与文件里悬浮球共用的 `drag` 对象撞名（`drag.on` 读 null 直接抛错），改名 `sbDrag` |
| 182 点「工序进度」折叠工序栏 | 「工序进度」按钮补 `aria-expanded`（默认 true）+ `aria-controls="tkStepBar"`；**已选中再点一次 = 折叠**（`setStepsOff`）：`.panel-main` 加 `is-steps-off` → `.task-steps` 122→0（height 过渡 .22s）、`.task-tabs` 166→**44**、`.stage.is-chat` 206→**84**，不留空洞；同时把连线与滚动条收掉（圆点宽高归零后连线没意义）。箭头语义：展开朝下（与稿件一致）、折叠翻上来 —— 规则由 `[aria-expanded="true"]` 改成 **`[aria-expanded="false"]`**。切到全链路再切回工序进度会自动展开（否则一片空白） |

校验：新增 `verify36.mjs` 18/18（1920/1440 左右空隙相等且放得下无滚动条；960 贴左可滚；滚动条几何 16/16/4/6/r6、按需淡入、滑块 = 视口/内容、滚到中点位移吻合、拖 60px 后 scrollLeft 等比推进；折叠态 0/44/84 + aria false + 箭头 180° + 连线与滚动条收起、切走切回自动展开复原 122/166/206、无 JS 报错）。
回归：`verify5~25`、`31~35`、`wd-verify`、`verify-bars`、`smoke9` 全绿。改了两处旧断言：`verify34` C9（进度条 4/9 几何 → 滚动条几何 + 1440 默认不可见）、`verify35` B1（`scrollbar-width` 由「不得为 none」→「必须是 none，由自绘条接管」）。

## 第 37 轮（任务信息改名 / 弹性折叠 / 左栏让位 / 专注模式 / chat 改外间距）

| 模块 | 状态 |
|---|---|
| 183 「全链路」→「任务信息」 | 首段按钮文字改名（`data-task-view` 同步 `flow` → `info`），宽度 63 → **76**（+13，四字）；其余两段不动 |
| 184 折叠动效对齐抽屉 | 原来只有工序条在动（`.22s` + `--cds-motion-ease`），页签条与内容区是**硬跳** —— 这才是「不丝滑」的根因。现在三块统一成抽屉那条曲线 **`.26s cubic-bezier(.2,.8,.2,1)`**：`.task-steps` height、`.task-tabs` top、`.stage.is-chat` top 同曲线同时长。实测中途取样：40ms 时工序条 61.6 / 页签 105.6 / 内容区 145.6，三块行进量一致（122 的行程同步走完），整块收放不再割裂 |
| 185 左栏收起时让位给菜单键 | `.menu-btn` 的 z-index 9 → **10**（`.task-top` 同为 9 且 DOM 更靠后，同级会把菜单键整块压掉，任务页就没有再展开左栏的入口了）；`.task-top` 左内距默认 **44**（菜单键 7~35 占位），`.ws-drawer.is-open ~ .panel-main .task-top` 时回到 8 —— 与 `.chat-head` 同一套写法。注意：子页面进入时 `bootPages()` 会自动展开左栏，收起来后才有这个形态 |
| 186 页签条右侧 = 专注模式 | 原「收起工序资产栏」（`#tkTabsMore` + `.is-collapsed`）整套退场，换成 `#tkFocus`：14 盒四角外扩图标（进）/ 四角内收（出），`aria-pressed` 驱动换图标与主色底。进入：`closeDrawer()` 收左栏、`#rsToggle` 收右栏、`body.is-focus` → `.task-top`/`.task-steps` 高度收 0、页签条顶到 0、内容区 40、菜单键 `display:none`；退出（按钮 / **Esc**）：还原进入前的左右栏开合状态。CSS 特异性坑：`.task-tabs{top:0}` 必须写成 `body.is-focus[data-page="task"]`，否则被 `.panel-main.is-steps-off .task-tabs{top:44px}` 压过（"折叠后再专注"顶部会空一条） |
| 187 会话页 32 改外间距 | 第 35 轮说的是「内间距」，实为**外间距**：`.chat` 的 `padding: 32px 32px 8px` → **`margin: 0 32px; padding: 32px 0 8px`**（滚动条跟着内容列一起内缩 32）；`.panel-main.is-chat .composer` 补 `width:auto; margin: 0 32px`，`.c-card` 与对话内容列左右边线对齐（785 = 796 − 12 内缩，误差 ≤1） |

校验：新增 `verify37.mjs` 24/24（改名与三段宽度 76/125/103；三块 transition 与抽屉同曲线 + 45ms 中途取样行进量同步；左栏收起后菜单键 opacity 1 / x=7、task-top 左内距 44、首按钮 x=44、点菜单键能拉回（320 宽、左 8）；专注模式：图标换态、左栏宽 0、顶栏与工序条 0 高、页签 0 / 内容 40 / 菜单键隐藏、页签仍可点、再点与 Esc 都能退出并还原左右栏；会话页 chat margin 32 / padding 左右 0、内容列宽 = stage 内容宽 − 64、卡与内容列对齐）。
回归：`verify6~25`、`31~36`、`wd-verify`、`verify-bars`、`smoke9` 全绿。改了五处旧断言：`verify34` C3（63 → 76）、D4（收起工序资产栏 → 专注模式）、`verify35` B10（找「任务信息」）、D1（内边距 → 外间距 + 内容列宽）、`verify25` 第 3 段（32 内缩 → 等宽）与第 6 段（63 → 76）、`verify36` D 段的视图 key `flow` → `info`。

## 第 38～43 轮（补记：此前只进了 commit，没落 PLAN）

| 轮次 | 主题 |
|---|---|
| 38 | 左栏默认展开；任务/会话页签互换（默认会话）；分段控件与工具行对齐 |
| 39 | 首页左栏默认展开（仅首页）；两页签工具行统一；内容列 960 自适应；渐变背景 + 磨砂顶栏 + 去 panel 边框 |
| 40 | 分组标记折叠态改柔和彩色文件夹，hover/聚焦/展开回箭头；新增目录落到当前视图 |
| 41 | 首页永远展开；图标与文字对齐 + 8px 间距；箭头绕圆心旋转；随机柔和配色持久化；设置页左栏浅灰底；chat 面板可拖到 320 |
| 42 | 删掉折叠上的涟漪圆点，换成「待确认」浮标（箭头指向按钮 / 有 X 个待确认 / 去处理·稍后） |
| 43 | 浮标圆角 8 + 尖角补橙色描边；`is-chat` 中间面板最窄停在 400 |

## 第 44 轮（左右栏视觉精还原：背景色 / 分组宽度 / 整页渐变叠图）

稿件：左栏 `3292:53926`、右栏 `3292:53930`（file `193158744355579`）。MasterGo MCP 只开放 `/mcp/dsl`，`image|export|screenshot|preview|layers|pages` 全 404，所以**抓不到位图**，只能拿 DSL 树逐项比对；页面整页背景图由用户直接给 `assets/cecoder-bg.png`（1952×364，下缘渐隐）。

| 模块 | 状态 |
|---|---|
| 188 左栏整栏底色 | 白 → **`#F7F7F7`**；`.wd-head` 同底色 + `inset 0 -1px 0 #EBECED`（原为无底色、无内线）。收起/展开只剩右侧 1px 线分隔 |
| 189 页签 → 分段控件 | 原下划线页签整段作废。新结构：`.wd-tabs` 56 高（`padding: 12px 16px`），`::before` 铺 288×32 `rgba(229,229,229,.65)` 圆角 4 作轨道，`::after` 底部 1px `#E5E5E5` 通线；两段各 **144** 宽，选中 `#FFFFFF` + 1px `#E5E5E5` 描边圆角 4，未选中透明无描边，hover `rgba(255,255,255,.55)` |
| 190 工具行 / 添加目录 | `.wd-tools` 上边距 16 → **12**（工具行 y 由 100 → **112**）；`.wd-adddir` 虚线 `1px dashed var(--cds-line-hover)` → **`1px solid #EEEEEE`** |
| 191 分组行改通栏 | `.wd-grp-head` 由 288 内缩改 **320 通栏**（`margin: 0 -16px; padding: 0 12px 0 6px`），底白/灰**反转**：折叠 = `#F7F7F7` + 上下两条 inset 线；展开 = `#FFFFFF` + 只剩上线（`.wd-grp.is-open > .wd-grp-head`） |
| 192 分组名 13 → 12 | 稿面 12/22；字号一改图标墨迹就偏 1px，`.wd-caret { top: 1px → 2px }` 补回来（verify41 B2/C3 复跑 24/24） |
| 193 分组间距 | `.wd-grp.is-open + .wd-grp { margin-top: 0 }`（原 12）；展开体 `.wd-sub` 改白底 320 通栏 `margin: 0 -16px; padding: 0 16px`。折叠相邻之间仍 `margin-top:-1px` **共用一条分隔线**，故相邻分组头步进 **35** 而非 36 |
| 194 右栏底色与内距 | `.rs-drawer` 白 → **`#F7F7F7`** + `inset 1px 0 #EBECED`；`.rs-top` 左内距 16 → **20**（稿面文案左距 20）；`.rs-body` `12px 8px 16px` → **`12px 20px 16px`**（450 宽 → 内容 410） |
| 195 整页背景叠图 | `.cds-frame[data-bg="design"]` 由单层渐变改**双层**：`url("cecoder-bg.png")`（`no-repeat` / `top center` / `100% auto`）+ 第 39 轮那条三档渐变（`#B2D0F9 0% → #D4E6FF 58% → #D5D4FD 100%`，`100% 100%`）。1440 / 1920 截图顶部柔光与渐变自然衔接，无白带 |

校验：`wd-verify` 位置表按新几何整表重写（tab 16/160@56 宽 144、adddir 112、grpHead `0,156,320,36`、卡片 y 236/320/404/508、grp2~grp5 `600/635/670/705`、emptyT y 765，chip/more/title/sub/cnt/bar 全部 +8），28/28 全过。旧断言改了 9 处：`verify7`（折叠灰底 / 展开白底反转）、`verify8` §1 四条（分段轨道 + 分隔线 + 选中/未选中描边）、`verify12`（目录名 12px）、`verify15`（320/480/300 下 tab 宽 144/224/134）、`verify20`（单卡分组间距 12 → 0）、`verify33` A7（右栏距 8 → 12）、`verify38` D2/D11（@160 + 选中纯样式断言）、`verify40` A7（nameX 54 → 36）。

边界实测：960 极限窗左栏仍 320、右栏 280，两栏底色均 `rgb(247,247,247)`；右栏拖到 450（稿面宽）时首行 x = 右栏 x + 20、分组头 y = body 顶 + 12，与稿面 20 内距完全对齐。

回归：`verify6~25`、`31~43`、`wd-verify`、`verify-bars`、`smoke9` **32 个脚本全绿**（smoke9 1024×768 与 960×700 均 no-err）。

## 第 45 轮（新建任务间距归容器 / 收起键底色 / 分组头内距 12 / 未选中段 hover 不变色 / 工具图标 hover 不改描边）

| 模块 | 状态 |
|---|---|
| 196 「新建任务」上方 8px 归容器 | `.wd-newtask` 的 `margin-top: 8px` 删掉，改成 `.wd-grp.is-open > .wd-sub:has(> .wd-newtask:first-child) { padding-top: 8px }`。间距属于分组体而不是按钮自己，按钮被替换/隐藏时不塌、hover 区也不会多带 8px 偏移。用 `:has()` 收窄作用域 —— 空分组（`#wdSub5`）没有按钮，上内距仍是 0，空态标题位置不动（wd-verify 的 `emptyT y=765` 不变） |
| 197 收起键底色 | `.wd-collapse` 默认 `#FFFFFF` → **`transparent`**（栏底已是 `#F7F7F7`，白方块会突出来一块）；hover `var(--cds-surface-subtle)`（= `#F7F7F7`，与栏底同色等于没反馈）→ **`rgba(0,0,0,.05)`**，压出来约 `#EBEBEB`，比栏底深一级 |
| 198 分组头左右内距 12 | `.wd-grp-head` 的 `padding: 0 12px 0 6px` → **`0 12px`**。稿面是 `Link 88x22@12,7` → 箭头左缘 12、计数贴 300（右收口 12）。文字要保持落在 28（与卡片标题 `16+12` 对齐），所以箭头盒子由 14 收到 **12×12**、右间距 8 → **4**（12+12+4=28）。`.wd-caret-chev` 的 `inset: 1px` 随之去掉（盒已是 12，内缩会把箭头缩成 10） |
| 199 未选中段 hover 不变色 | 删掉 `.wd-tab:hover { background: rgba(255,255,255,.55) }`，换成 `.wd-tab:not(.is-active):hover { background: transparent }` —— 原来 hover 会浮一层半透明白，看着像「已经被选中」；选中段 `.is-active:hover` 仍白底 |
| 200 搜索 / 排序 hover 不改描边 | `.wd-icon-btn:hover` 去掉 `border-color: var(--cds-line-hover)`，只留底色 `--cds-surface-subtle` 与图标色转正文色；`.is-on`（排序生效）仍是主色描边 |

校验：新增 `verify45.mjs` **22/22**（A 段：按钮 `margin-top` 0 / 容器 `padding-top` 8 / 头底到按钮顶仍 8 / 按钮 28 高且内容垂直居中 / 空分组不长上内距；B 段：收起键默认 `rgba(0,0,0,0)`、hover 压出 ≈#EBEBEB（<247 且 >220）、移开复透明、尺寸 28×28；C 段：任务 / 会话两个视图各量前 4 个分组头，左右内距 12、箭头 12、名字 28、计数距右缘 12；D 段：未选中段 hover 前后底色同为透明且无描边、选中段 hover 仍白底；E 段：搜索 / 排序键 hover 前后描边同色、但底色有变化）。

旧断言改了 2 处：`verify41` B1（8 → 4）、B3（盒 14×14 → 12×12），`verify7` 分组头间距 8 → 4。

回归：`verify6~25`、`31~43`、`45`、`wd-verify`、`verify-bars`、`smoke9` 全绿。

## 第 47 轮（tt-right 按钮形态 / 链接 hover 主色 / 折叠字重 / 页签浅灰底与专注文案 / 页签下大容器 / 图标墨迹）

稿件：`3140:45042`（task-top）、`3124:54244`（task-tabs）、`3292:53937`（大容器）。

| 模块 | 状态 |
|---|---|
| 201 tt-right 元素 | 自动执行仍是 92×28 文字按钮（13/20 主色、透明底、hover `#F5F8FF`）；「任务信息 / 工序资产」由 `<button role=tab>` 改为 **`<a class="tt-link">`**（无 role、无 is-on），挂在 161×28 `#FAFAFA` 轨道上（80 + 1px 线 + 80）；收起键 hover 文字转主色 |
| 202 链接 hover | `.tt-link:hover` 只改 `color` 为主色，底仍是透明（不再有白块/描边） |
| 203 折叠后字重 | `.panel-main.is-steps-off .tt-now-label { font-weight: 400 }` —— 工序条收起后「工序进度」不再是当前态 |
| 204 页签条底色 | `.task-tabs` 白 → **`#FAFAFA`**，内下边线 `#E5E5E5`；选中页签由 `--cds-surface-inset` 改 **`#FFFFFF`**（灰轨道上白块才浮得出来） |
| 205 专注模式 | 文字 14/**500**/主色（稿 Link 80×28：3+14+4+56+3）；hover 只加底色；进入后文案切「退出专注模式」（JS 改 `.tk-focus-txt`，宽度 80 → 108） |
| 206 大容器（新） | 新增 `.tp-wrap`（top 171 / 折叠 84 / 专注 40）：头部 56 两张步骤卡（`#F5F8FF`+`#DAE4FE` / `#F7F7F7`+`#EEEEEE`，24 数字圈、标题 14、副标题 12/`#868686`）+ 18 箭头 + 右端「差异对比 / Diff」96×56 白底描边；主体白卡（描边 `#EEEEEE`、内距 30）含目标 textarea 128、文件输入卡（2 颗 32 高白底按钮 + 3 行 40 高文件行，AI 行为 `#FFF7E8`/`#FFE4BA`、来源标签白底 r3 主色字、行内 3 颗 28 高白底 mini 键）、参考代码源灰条 36；底部 56 上传内线 + 居中主键 212×36 |
| 207 图标墨迹 | 16 盒比原 14 盒多压 1px，`.wd-caret { top: 2px → 1.5px }`；文件夹/箭头墨迹中心与文字差 0.43px（verify41 B2/C3 仍过） |

校验：新增 `verify47.mjs` **25/25**（A 段：自动执行 92×28 与 hover 底色、链接 `<a>` 各 80 宽 + hover 只变色、收起 20 高与 hover、无 JS 错；B 段：展开 500 → 折起 400 → 复原 500；C 段：页签条 `#FAFAFA` + 选中白块 + 未选中透明、专注键 14/500/主色/80 宽、点击后文案变「退出专注模式」且页签条贴顶 48；D 段：头部 56 + 卡 459 + diff 96、卡底色描边、白卡描边与内距、textarea 128、两颗按钮 126/140、三行 40 高与暖色行、ref 36、底部 56 + 主键 212×36 居中、无横向溢出；E 段：折叠文件夹墨迹与文字 ≤0.6px）。

旧断言改了 4 个脚本：`verify25`（segs → `.tt-link`）、`verify34` C3/C3b/D1（选择器换 `.tt-link`；D1 由「切 tab」改为「是 `<a>` 且点击不产生选中态 + hover 转主色」）、`verify35` B10、`verify37` A1 选择器同步。

回归：`verify6~25`、`31~47`、`wd-verify`、`verify-bars`、`smoke9` **37 个脚本全绿**；960 窄窗面板无横向溢出（副标题省略号截断）。

## 第 48 轮（大容器列宽 1024 居中 / 顶部外距 / 主体可折叠头 / 边框按钮 / 圆圈描边 / 两处可折叠容器 / 主体自适应高度）

稿件：`3292:53937`（大容器）、`3292:53935`（文件输入）、`3292:53973`（参考代码源展开态）。

| 模块 | 状态 |
|---|---|
| 208 列宽与居中 | `.tp-wrap` 加 `--tp-col: 1024px`，三个直接子级（头 / 主体 / 底）`width:100%; max-width:var(--tp-col)`，容器 `align-items:center` → **内容列 1024 且整体居中**。1440 + 左栏展开（面板 1104）时列取上限 1024、左右各余 40；1280（面板 944）时收到 904、仍居中；**底部通栏**（1094 稿面那条内线是整宽），只共中线 |
| 209 顶部外距 | `.tp-wrap { padding: 20px 20px 0 }` —— 原来 `0 20px`，头部直接贴页签条 |
| 210 主体可折叠头 | `.tp-body` 改为「1px 描边 + 36 高标题栏（`#F7F7F7` / 下沿 `#EEEEEE` / 箭头↓ + 文字，同稿面 `文件输入` 的 36 头）+ `.tp-body-in`（内距 20/30/20/30、`overflow-y:auto`）」；点标题栏切 `is-open/is-closed`、箭头转 −90° |
| 211 mini 改边框按钮 | `.tp-mini` 由无边框灰底改为 **白底 + `inset 0 0 0 1px #E5E5E5`**、28 高、内距 8（稿 100/72/44×28 = 文字+16）；hover 底 `#FAFAFA`、「移除」hover 仍走危险红 |
| 212 序号圈描边 | `.tp-step-no` 加 `inset 0 0 0 1px #E5E5E5`（稿 `24×24 r=32 #FFFFFF+#E5E5E5`）；选中态 `is-on` 是主色实心、`box-shadow:none` |
| 213 两处可折叠 | `文件输入` / `参考代码源` 都改成「36 头 + 内容体」两个块，共用 `.tp-sect` 头（箭头 12、文字 18、hover 转主色）与统一折叠 JS（`data-tp-toggle` → 最近容器的 `is-open/is-closed` + `aria-expanded`）；`已就绪` 小标题按稿收到 16 上距、标签胶囊补 1px 描边 |
| 214 参考代码源展开体 | 按 `3292:53973` 补齐：提示语（14/`#868686`）→ 选择条 994×80（`#F7F7F7`/`#E5E5E5`，类型 200×32 + 代码源伸缩 + 添加 60×32 + 竖线 + 手动添加链接，下方两行 12 号提示）→ 代码源卡（36 头 + 分支胶囊 94×22 + 删除键；表单 4 行 28/28/28/64、行间 12，标签列 114 / 输入 400+342 / 文本域 830×64）→ 后端 / 前端代码源两行 36（选中行 `#F5F8FF`+`#DAE4FE`） |
| 215 主体高度 | `.tp-body { flex: 0 1 auto }` + `.tp-body-in { overflow-y:auto }`：**高度跟内容走**（不再 `flex:1` 撑到底），放不下时内部滚动；`.tp-foot { margin-top: 40px }` —— 主体与底部固定 40，两者始终贴着 |

校验：新增 `verify48.mjs` **30/30**（A 段：列 1024 + 居中差 ≤1 + 主体与头同宽 + 底部通栏共中线 + 顶部外距 20；B 段：1280 收到 904 且无横向滚动；C 段：36 头底色/下沿/内距 20-30-20-30、折起后 38 且箭头向右、40 间距恒定、再点复原；D 段：mini 描边 `#E5E5E5` 28 高、未选中圈白底描边、选中圈实心无描边；E 段：两处容器可折起 38、展开体 提示 20 → 选择条 54、类型 200×32 / 添加 60×32 / 链接 56、表单 4 行 28-28-28-64、两行 36、胶囊 94×22 贴右；F 段：1600 高放手时主体 = 内容高度、折起参考代码源矮 400+、两态均 40 间距；900 高时内部滚动、底部贴齐、无横向滚动）。

旧断言改了 1 个脚本：`verify47` D1（卡 459 → 439、头 1024）、D3（内距量 `.tp-body-in` 20/30/20/30、卡宽 1024）、D4（textarea 1002 → 962）、D8（量 `.tp-ref-head` 36）、D10（溢出量 `.tp-body-in`）。

回归：`verify5~25`、`31~43`、`45`、`47`、`48`、`wd-verify`、`verify-bars`、`smoke9` 全绿；960~1920 均无横向溢出。

## 第 49 轮（默认折叠 / 底部固定 / 代码库路径单行 / 文本域真文字 / 步骤卡 hover / 页签描边 / 滚动条位置 / 本地文件 / 文字说明弹窗 / 提示语橙色）

| # | 改动 | 实现 |
|---|---|---|
| 216 | 两处容器默认折叠 | `文件输入` / `参考代码源` 初始 `is-closed` + `aria-expanded="false"` + 箭头 `is-right`（−90°）；点标题栏展开，状态可逆 |
| 217 | 底部始终贴底 | `.tp-foot` 改 `position: sticky; bottom: 0` + `margin-top: auto` + 白底；`.tp-body` 加 `margin-bottom: 40px` → 底部永远贴齐 `.tp-wrap` 底，主体与它**至少** 40（内容短时自动拉开空白） |
| 218 | 代码库路径是同一对象 | 删掉「选择文件夹」空态行，只留已选态：文件夹图标 + `/Users/you/project-repo` + 「重新选择」；表单变 3 行（28/28/64） |
| 219 | 文本域放真文字 | `tp-textarea` 去掉 `placeholder`，value = 背景 / 目标 / 规则三段（3 行 22px） |
| 220 | 步骤卡 hover | `.tp-step:hover { background: #FFFFFF }`（当前步骤仍 `#F5F8FF`）；`.tp-step-txt b` 默认 `font-weight: 500` |
| 221 | 选中页签描边 | `.tk-tab.is-on` 补 `box-shadow: inset 0 0 0 1px #EEEEEE`（稿 paint_2452:37443 = 线条/@color-border-1，inside） |
| 222 | 滚动条落到 `.tp-wrap` | `.tp-body` 改 `flex: 0 0 auto`、`.tp-body-in` 去掉 `overflow-y` → 整个大容器滚；`.tp-wrap` 保留 `overflow-y: auto` + 8px 细条样式（滚动条贴面板右缘，不再挤在白卡里） |
| 223 | 文本域焦点 | `.tp-textarea:focus / :focus-visible { outline: none }`（消掉全局 2px 焦点环，描边保持 #EEEEEE） |
| 224 | 上传本地资料 | 新增隐藏 `#tpFileInput`（multiple）→ 点按钮 `input.click()`，选择后 toast「已添加 N 个本地文件」 |
| 225 | 文字说明弹窗 | 新增 `#tpNoteModal`（480 宽，复用 `.cm-mask`）：头 48（标题随按钮文案）+ 160 高多行文本框 + 取消/保存；`补充文字说明` / `更改文字说明` 都走 `data-tp-note`，保存后文字留在按钮上、标签转「更改文字说明」，Esc / 蒙层 / 取消 均可关 |
| 226 | 提示语颜色 | `.tp-tip` 由 `#1F1F1F` 改 **`#FF7D00`**（稿 textColor paint_1204:56466 = 提示/@colorWarning-6）；`已就绪` 仍 `#F77234` |

校验：新增 `verify49.mjs` **23/23**（A 默认折叠/可逆；B 四种视口底部贴底；C 代码库路径单行 + 已选态；D 文本域真文字 + 焦点无 outline；E 步骤卡标题 500 + hover 白底 + 当前步骤不被覆盖；F 选中页签 1px #EEEEEE；G 内容层不自滚、滚动在 `.tp-wrap`；H `#tpFileInput` 存在且点击真的弹出文件选择窗；I 弹窗 480 宽 / 聚焦 / 保存关闭 / 更改带出原值 / Esc；J 提示语 #FF7D00）。

`verify48` 按新契约重写 31 条（默认折叠、底部贴底、滚动归 `.tp-wrap`、代码库 3 行），`verify47` D5–D7 先展开再量。

## 第 76 轮（任务总结工序页 · 独立页 + 派发弹窗两态）

稿件：`3495:55201`（步骤条）、`3495:55203`（内容）、`3495:55225`（派发弹窗·拆分前）、`3495:55277`（拆分后）。

| # | 模块 | 实现 |
|---|---|---|
| 227 | 新独立页 | `src/summaryview.html` + `cecoder-summary.html`（`body[data-page="summary"]`），沿用 `panel-main.is-chat` 骨架；`build-pages.mjs` 增第 4 个页面与 `chrome(..., extra)` 槽位 |
| 228 | 顶栏出口 | `.task-top` 复用：左「首页」（`.tt-home` → cecoder-home）+ 标题，右「任务执行」（`.sum-back` → cecoder-task）+ 自动执行 |
| 229 | 工序条 43 | `.sum-steps`（top 44 / 43 高）+ `.ss-track` 1024 列内排布：块宽 **88 / 152 / 152 / 180 / 152 / 152**、间距 8、每块前置 56 连线（首块无）；图标 24 圆 —— 已完成 `#F5F8FF`+`#DAE4FE`+蓝勾、当前 **`#3BB346` 实心白勾**、待开始名称 400/`#6B6B6B`；面板 < 980 时 `@container` 收线长与间距，1280 一屏放得下 |
| 230 | 标题条 | `.sum-h` 28 高：20/500「任务总结」+ 两侧各 456 横线（稿 3337:55158） |
| 231 | 任务智能派发卡 | `.sum-dp` 1024×96：底 `#F7F7F7` + `inset 0 0 0 1px #EEEEEE` + `0 1px 2px`；图标 40×40 @16 / 标题 14-500 / 描述 12-20 限宽 700（两行）/ 右侧「打开任务派发」134×32 |
| 232 | 工序资产 | `.sum-assets`：头 42（「工序资产」链接 + 「8 项已记录 · 12 项待产出 · 资产按工序汇总」+ 右上 32×32 全部展开键）；清单 7 行、行距 8 |
| 233 | 展开卡 | 1024×288 = 头 40 + 16 + 标签行 24 + 16 + 表 176 + 16：头（箭头 + 名称 + N 项资产 + 右「2 项待产出」橙）；标签「代码仓库 / 影响文件」`#F5F8FF`+`#DAE4FE` r4；表 992（表头 32 `#F7F7F7` + 4 行 36），列 ≈ 12 / 68 / 692 / 812 / 902（类型·大小带排序箭头） |
| 234 | 折叠行 | 40 高白卡（`inset 0 0 0 1px #EEEEEE`）：箭头 −90° + 名称 + 计数 + 右侧状态（已就绪 `#30953B` 带勾 / N 项待产出 `#FF7D00` / 无产出记录）；点行展开、箭头转正；右上键一键全展开 / 全收 |
| 235 | 底栏 | `.sum-foot` sticky 贴底 56（白底 + 上内线），主键「智能派发任务」212×36 → 打开派发弹窗 |
| 236 | 派发弹窗 | `src/dispatch.html` + `.dp-*`：**1200×804**（头 48 / 左列 400×700 + 左底 48 / 右列 760 / 底 56），`max-width: calc(100% - 48px)` 窄屏自适应 |
| 237 | 左列来源树 | 5 个工序组（概要设计 3 项 / 详细设计 2 项 / 程序设计 3 项 / 缺陷修复 2 项 / 代码开发 0 项 + 「该工序暂无已记录资产」+「4 项待产出」）；组 ⇄ 子项联动（全选 / 半选 `indeterminate`）、底部「全选」+「共 N 项，已选 M 项」 |
| 238 | 右列任务卡 | 勾选即按规则生成：设计三组 → **架构设计**（来源「概要设计、详细设计、程序设计 · 8 项资产」/ 架构师·周宁 / 展开详情 340 高：目标 + 背景 + 传递资产 6 项两列）；代码开发 → **代码开发**（研发经理·陈昊）；缺陷修复 → **缺陷修复**（测试经理·赵小敏，橙底标签）；卡内「任务详情 / 收起详情」「移除」 |
| 239 | 两态 | 空态「还没有派发的任务」+「一键智能拆分全部工序」；点它全选并出 3 张卡；点「派发任务」→ 顶部 toast「已派发 N 项任务，任务已完成」→ 1.4s 后关闭 |
| 240 | 互跳 | 任务页页签条右侧新增 `a.tk-sum-link`「任务总结」→ summary；summary 顶栏「任务执行」→ task、「首页」→ home；summary 工序条前三步可点回 task |

校验：新增 `verify76.mjs` **40/40**（A 骨架/工序条 6 步与块宽/1024 列；B 标题·派发卡·资产头部·展开卡·表格列·7 行落位 802·底栏；C 折叠 / 全展开 / 全收；D 弹窗 1200×804 骨架·空态·勾选出卡·全选 3 张·卡结构·详情 340·计数 15/15·收起详情 120·toast·自动关·Esc；E 四向互跳；F 1280 无横向溢出且工序一屏）。

## 第 77 轮：合并远端 77~79 + 工序链末步统一「任务总结」

先 `git merge origin/main`（远端 77~79：顶栏磨砂白 + 首页入口、变更点卡片、已完成步骤卡归蓝等），
把远端直接改在 `cecoder-task.html` 的正文（`.tp-body-status` / `.tp-chg` 变更点区 / 新 `.tp-foot`）
回填进 `src/taskview.html`，`node tools/build-pages.mjs` 重建后与远端产物逐字节一致，构建链重新单一可信。

| # | 模块 | 实现 |
|---|---|---|
| 241 | 首页工序条 | `QF_STEPS['技术任务']` 末步「交付确认」→「任务总结」；末步加 `data-go="summary"`，点它直接进 `cecoder-summary.html?id=0` |
| 242 | 任务页工序进度 | `#tkStepTrack` 第 9 道「交付确认」→「任务总结」，由 `div` 改 `a.ts-item.ts-go` → `cecoder-summary.html?id=0`；补 `a.ts-item` 去下划线 + hover 主色 |
| 243 | 总结页工序条 | 6 道顺序改为 概要设计 / 详细设计 / 代码变更分析 / 开发实现 / 代码审查 / **任务总结（当前）**，块宽 88/152/180/152/152/152，含间距仍 916 |
| 244 | 跳转闭环 | 首页 → 会话（会话卡）/ 任务（任务卡）；会话 ⇄ 任务（抽屉卡片）；任务 → 总结（第 9 步 + 页签入口）；总结 → 任务（顶部「任务执行」+ 前 5 道工序）/ 首页（顶部） |

校验：新增 `verify77.mjs` **24/24**（首页末步与点击跳转 / 任务页末步 a 链接与尺寸一致 / 总结页末步当前态 + 前 5 道回跳 / 四页顶栏首页入口 + 卡片互跳）；`verify76.mjs` 断言同步到新顺序后 **40/40**。

## 第 78 轮：修复重建导致的回退（tt-right / AI 协作 / 证据链 / 截图预览 / 首页流光）

**根因**：第 50~79 轮期间，另一台设备多次直接改产物 `cecoder-task.html`，`src/taskview.html` 从未同步；
第 76 轮我按 `src` 重建任务页，把这些只存在于产物里的内容整块盖掉（净删 261 行）：
`tt-right` 退回第 47 轮的「任务信息 / 工序资产」文字链接、右栏 `aside.ai-side`（450 宽）、顶栏 `tt-ai`「AI协作」入口、
`evModal` 任务证据链弹窗、`shotViewer` 截图大图预览层、首页 `.c-beam` 外圈流光 —— 全部丢失。

| # | 修复 | 实现 |
|---|---|---|
| 245 | 片段回填 | 以 `066489f:cecoder-task.html`（远端最新产物）为准，按构建槽位切回四个片段：`src/taskview.html`（476~953）、新 `src/aiside.html`（1036~1149）、`src/floats.html`（1151~1558，含 syncModal + evModal + 说明弹窗）、`src/tail.html`（1560~1576，含 shotViewer） |
| 246 | 构建链 | `build-pages.mjs` 增 `P.aiside`，任务页按 `side` 槽位插在 `</div><!-- /panel-main -->` 之后；重建后与远端产物逐行一致（仅空行差） |
| 247 | 首页独有 | 第 79 轮两处只改在产物里，改由构建注入：`tb-home` 加 `aria-current="page"`、`.c-beam` 流光挂在 `.c-card` 与 `.c-foot` 之间 |
| 248 | 本轮改动保留 | 重新应用：页签条 `a.tk-sum-link`「任务总结」、工序进度第 9 道 `<a class="ts-item ts-go">`「任务总结」→ 总结页 |
| 249 | 防回退 | `verify77.mjs` 增 E 段（顶栏四件套与顺序、证据链弹窗、AI 栏 450 宽、收起 ⇄ 入口 ⇄ 恢复），共 **31/31** |

校验：`cecoder-task.html` 与远端产物对比 0 删除行；`verify76` 40/40、`verify77` 31/31；1440 视口下 AI 栏展开不挤压顶栏。

## 第 79 轮：任务总结页按稿完全重铺（工序条统一 + 派发卡精确还原）

**背景**：上一版总结页的工序条、派发卡、工序资产都是按局部稿件拼的，与最新稿面（3337:* / 3495:55203）差得多。
本轮按 MCP DSL 逐节点取数，整页重铺；旧 `.sum-steps/.ss-*` 与旧底栏整套删除。

| # | 模块 | 实现 |
|---|---|---|
| 250 | 工序条 | 改用任务页同款容器 `.task-steps`（1133×87、`.ts-scroll/.ts-track/.ts-item/.ts-link/.ts-prog`），9 道工序、名称与「代码开发」完全一致（概要设计…提交流水线…任务总结）；前 8 道 `is-done` 且整行是指回任务页的链接，末位 `is-now` 当前 |
| 251 | 内容区起点 | `.sum-wrap` 由 87 改为 **131**（顶栏 44 + 工序条 87），1024 列居中不变 |
| 252 | 派发卡（3337:53274） | 1024×96 · `#F7F7F7` + 1px `#EEEEEE` · r4，**去掉卡身投影**（稿里只有图标底有 `0 1 2 rgba(0,0,0,.08)`）；内距 `16 20 16 16`；图标 40×40 白底 r4 + 阴影，图标路径直接用稿里 18.24×14 的分叉箭头（`#1F1F1F`，不再是主色）；标题 14/22 500；描述 700×40、12/20、`#6B6B6B`；按钮 134×32（`0 16` 内距、14 图标 + 4 + 14/22 文字、「打开任务派发」、眼睛图标）距右 20 |
| 253 | 工序资产头（3337:56084） | 42 高：标题 14/22 500 + 副标题 12/20（`#1F1F1F`）；右侧 32×32 收起/展开键距顶 10，图标改稿里的上下双箭头（12.2×9.6） |
| 254 | 展开卡（3337:57973/56289/58085/3395:59974） | 1024×288 = 行头 40（`#F7F7F7` + `#E5E5E5`、上圆角）+ 16 + 标签 24 + 16 + 表 176 + 16；卡身白底 + 1px `#EEEEEE` + `0 8 8 rgba(0,0,0,.06)`；标签胶囊 24 高、`#F5F8FF` + 1px `#DAE4FE`、`0 8` 内距、12/24（仓库值 `#1F1F1F`、文件值 `#868686`） |
| 255 | 表格 | 992×176 = 表头 32 + 4 行 36；列 12/68/692/812/902（56 / 1fr / 120 / 90 / 90）；表头 12/20 500（序号 `#1F1F1F`、其余 `#6B6B6B`，类型/大小带上下三角排序图标），数据行 14/22、行线 `#EBECED` |
| 256 | 折叠行 ×6 | 40 高、白底 + 1px `#EEEEEE`、r4、行距 8；箭头 14 → 4 → 名称 500 → 8 → 资产数 12/16 `#868686`；右侧状态 12/22（`已就绪` 带 12 勾 `#30953B`、`无产出记录` `#30953B`、`待产出` `#FF7D00`）。**稿里「代码审查」的「4 项待产出」误用了成功绿，这里按语义统一成 `#FF7D00`** |
| 257 | 底栏 | 删除（稿里派发入口就是卡右侧的「打开任务派发」）；`.sum-foot/.sum-primary` 样式一并清掉 |
| 258 | 交互 | 行头开合（箭头旋转、`.sa-body` 显隐）、右上「全部展开/收起」、派发卡按钮开弹窗、顶栏「自动执行」吐提示 |

校验：`verify76.mjs` 按新稿重写 **36/36**（工序条 9 道同容器 / 卡几何与配色 / 展开卡 288 / 表格列 / 折叠 / 弹窗 / 互跳 / 1280 不溢出）；`verify77.mjs` C 段同步到 9 道后 **31/31**。
