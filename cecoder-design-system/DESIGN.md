# Cecoder 设计系统规范 · DESIGN.md

> 本文件是 Cecoder 设计系统的**总规范**，定义设计价值观、Token 体系、命名约定、布局与交互规则、组件目录。喂 AI 生成 HTML 时，本文件提供"为什么这样做"，`ai-prompt.md` 提供"具体怎么做"，`tokens/` 提供真值，`components/` 提供逐组件契约。

---

## 1. 设计原则

| 原则 | 含义 | 对生成 HTML 的要求 |
| --- | --- | --- |
| **语义优先** | 颜色/尺寸表达"含义"而非"外观" | 永远用 `--cds-*` 语义变量，不用裸色值/裸 px |
| **双层 Token** | Layer1 原始值忠实 Cecoder，Layer2 语义别名更易用 | 新代码引用 Layer2；需要与 Cecoder 完全一致时引用 Layer1 |
| **明暗同构** | 同一套变量名，浅深两套值 | 用变量而非条件判断，切 `theme-mode="dark"` 自动适配 |
| **层级靠描边+背景差** | Cecoder 默认几乎不用大投影，层级主要靠 border 与 bg-0→bg-4 | 区分卡片/容器层次优先用 `--cds-bg-*` 与 `--cds-border`，浮层才用 `--cds-shadow-elevated` |
| **克制强调** | 主色仅用于"非常需要强调"的场景 | 一个页面主色按钮 ≤ 1 个主操作，其余用 tertiary/default |

---

## 2. Token 体系

Token 分两层，全部在 `tokens/tokens.css`：

- **Layer 1 `--semi-*`**：从 Cecoder SCSS 1:1 迁移的原始变量。调色板以 **RGB 三元组**存储（如 `--semi-blue-5: 0,100,250`），用 `rgba(var(--semi-blue-5), α)` 取色——这是 Cecoder 的真实机制，保留它可保证与组件库行为一致。
- **Layer 2 `--cds-*`**：Cecoder 语义别名，`var()` 指向 Layer 1。**生成 HTML 默认用这层。**

### 2.1 色彩
- 主色/次要/第三色：`--cds-color-primary` / `-secondary` / `-tertiary`（各含 hover/active/disabled/bg）。
- 功能色：`--cds-color-success` / `-warning` / `-danger` / `-info`（各含浅底 `--cds-color-*-bg`）。
- 文本：`--cds-text-primary|secondary|tertiary|disabled|inverse`。
- 背景：`--cds-bg-page|container|elevated|overlay`。
- 描边/填充：`--cds-border`、`--cds-focus-border`、`--cds-fill(-hover/-active)`、`--cds-disabled-bg/-border`、`--cds-overlay`。
- 详见 `tokens/color.md`。

### 2.2 文字
字体族 Inter + 中文回退；8 档字号（12/14 正文 + 16~32 标题）与固定行高；3 档字重（200/400/600），另 `<strong>` 标签默认字重固定为 **500**（`--cds-font-weight-strong`）。详见 `tokens/typography.md`。

| 用途 | 变量 |
| --- | --- |
| 辅助/说明 | `--cds-font-xs` (12/16) |
| 正文·默认 | `--cds-font-sm` (14/20) |
| 标题 H6~H1 | `--cds-font-h6 … --cds-font-h1` |
| 标题字重 | `--cds-font-weight-bold` (600) |
| `<strong>` 默认字重 | `--cds-font-weight-strong` (500) |

### 2.3 间距
10 档：2/4/8/12/16/20/24/32/40（+0），`--cds-space-1 … --cds-space-9`。表单项之间默认 16，卡片内边距 16~20，区块之间 24。详见 `tokens/spacing-radius-size.md`。

### 2.4 圆角
**固定规范：卡片（card / 容器类）默认圆角一律 8px**，用 `--cds-radius-card`（=8px）。其余：xs/sm=3px（按钮/标签）、md=6px（菜单）、lg=12px（模态）、full=9999px（胶囊）、circle=50%（头像）。`--cds-radius-*`。

> ⚠️ 卡片不要用 `--cds-radius-lg`(12px) 或 `sm`(3px)，统一 `--cds-radius-card`(8px)。

### 2.5 投影 & 层级
`--cds-shadow-0/1` 为 none，`--cds-shadow-2` 用于悬浮卡片，`--cds-shadow-elevated` 用于 Modal/Popover/Toast。z-index 由 `--semi-z-*` 约定。详见 `tokens/shadow.md`。

### 2.6 控件尺寸
高 24/32/40（sm/default/lg），图标 8/12/16/20/24。`--cds-height-control*`。

### 2.7 固定规范（必须遵守）
1. **卡片圆角固定 8px**：所有 card / 容器类元素一律 `var(--cds-radius-card)`（8px），不得用 3px/6px/12px 混用。
2. **控件统一默认常规尺寸**：Button / Input / Select / Cascader / DatePicker / Tabs / Switch 等所有表单与交互控件，**默认一律使用 default 尺寸（高 32px，`--cds-height-control`）**。除非有明确理由，禁止在同一页面混用 small/large，以保证视觉统一。
3. **表格默认行高 36px（含 padding 的总高度）**：Table 单元格统一 `height: var(--cds-table-row-height)`（36px）且 `box-sizing: border-box`，**这 36px 是包含上下 padding 在内的整行总高**。由于 Cecoder body 单元格默认上下 padding 为 16px 会把行撑到约 53px，规范做法是把垂直 padding 压到 8px（`--cds-space-3`）配合 border-box 的 36px 高度，使总高恰为 36px。见 `tokens/component-overrides.css`。
4. **组件必须可交互**：转译/生成的页面中，所有可交互组件（标签页切换、下拉选择、任务/节点选中、开关、按钮反馈）都要真正可点击并改变状态；无真实数据时**用合理的假数据填充**，不允许出现"看起来像但点不动"的静态摆设。
5. **一屏一主操作**：一个页面（或弹窗）内**最多只有一个主按钮（primary solid）**，因为倡导"一个页面只做一件主要的事"。其余动作用 tertiary / borderless / 文字按钮降级。
6. **降低信息噪声**：AI 生成的产物要**适当精简页面内容**——去除冗余说明、重复标签、装饰性元素；用层级（背景差/描边/留白）和分组承载信息，而不是堆砌文字与颜色。
7. **禁用态无 hover 反馈**：所有 disabled 元素在鼠标悬停时**不给任何样式变化**（不变色、不浮起、不变描边），仅通过 `Tooltip` 给出禁用原因提示。
8. **不要重复发明视觉规则**：每个页面都复用同一套 token 与组件契约，**禁止为某页面另起一套配色/间距/圆角/组件样式**。新需求优先用既有组件与语义 token 组合解决。
9. **优先用官方 SVG 图标库**：图标一律使用 `@douyinfe/semi-icons`（1048 个，命名 `IconXxx` / `IconXxxStroked`，见 `components/Icon.md`），**不要用 emoji、unicode 字符或自造 svg 代替语义图标**。
10. **下拉/选择器选项列表内边距统一 8px**：全局 `.semi-select-option-list-wrapper { padding: var(--cds-space-3) }`（8px），见 `tokens/component-overrides.css`。
11. **AI 对话气泡圆角固定 8px**：`.semi-ai-chat-dialogue-content-bubble` 与 `.semi-ai-chat-dialogue-content-userBubble` 一律 `var(--cds-radius-card)`（8px）。
12. **AI 对话中用户发送的气泡使用「浅蓝底 + 黑色文字」**：运行时用户气泡真实类名是 `.semi-ai-chat-dialogue-content-user`（与 `-bubble` 同挂一个元素，`mode="bubble"` 下与助手共用 `-bubble`；`.semi-ai-chat-dialogue-content-userBubble` 仅在 `mode="userBubble"` 出现）。用户气泡统一 `background: var(--cds-color-primary-bg)`（浅蓝底）+ `color: rgba(var(--semi-grey-9),1)`（明态为黑字），助手气泡保持中性灰底。暗色模式下 `--cds-color-primary-bg` 与 `--semi-grey-9` 随 Cecoder 调色板反转，自动转为可读的浅蓝底 + 浅色文字。见 `tokens/component-overrides.css` §4。
13. **表头字号统一 12px**：Table 表头 `.semi-table-row-head` 字号一律 `var(--cds-table-header-font-size)`（12px），与正文 14px 形成层级区分。选择器特异度需 ≥ Cecoder 自带规则，故覆盖带 `!important`。见 `tokens/component-overrides.css`。
14. **AI 消息操作栏默认不显示**：`.semi-ai-chat-dialogue-action`（复制/分享/点赞/点踩/更多）默认 `display: none`，降低信息噪声；需要时由业务显式开启，不默认占用气泡下方留白。
15. **AI 建议条用小一号尺寸**：`.semi-ai-chat-dialogue-hints` 内的建议项 `.semi-ai-chat-dialogue-hint-content` 字号由默认 14px 降为 `var(--cds-font-xs)`（12px，小一号），item 内边距/间距同步压缩一档。
16. **代码/Diff/终端使用默认字体族 + 12px**：代码块、Diff、终端输出一律 `font-family: var(--cds-font-family-code)`（**该 token 现解析为默认字体族 `--semi-font-family-regular`，不单独使用等宽代码字体**）+ `font-size: var(--cds-font-size-code)`（12px），行高 1.7；禁止硬编码字体栈或字号。
17. **对话栏标题 12px**：`.semi-ai-chat-dialogue-title` 字号由 Cecoder 默认 16px 统一降为 `var(--cds-font-xs)`（12px），与栏内其他 12px 文本对齐。见 `tokens/component-overrides.css` §6c。
18. **步骤流程节点必须有连接线且居中**：横向工序（步骤流程）节点之间必须绘制连接线表示先后顺序，连接线垂直居中于节点、用 `var(--cds-border)`、首尾不外延；节点内容（含 idle 待开始态）一律居中对齐。见 `tokens/component-overrides.css` §7 + `showcase/workbench.css .wb-node`。
19. **转译不得擅改原型既有交互与布局**：把原型 PRD 转译成高保真 HTML 时，**必须忠实保留原型已定义的信息架构、布局结构、分区顺序与既有人机交互**（如折叠/展开、选中态、状态切换、增删、Tab 切换、抽屉、两态页面等），**不得擅自增删区块、调换布局层级或替换交互模型**。只允许在保持上述前提下，把视觉换成 Cecoder token + Cecoder 官方组件实现。任何与原型不一致的取舍都需先与需求方确认。
20. **`<strong>` 标签默认字重 500**：全局 `strong` 一律 `font-weight: var(--cds-font-weight-strong)`（500），覆盖浏览器 UA 默认（bolder≈700）与 Cecoder 的 `.semi-typography strong` / `.semi-markdownRender-component-p strong`（默认 600）。加粗强调统一走 500，不再用 600/700。见 `tokens/component-overrides.css` §8。
21. **卡片标题默认字号 14px**：Card 标题 `.semi-card-header-wrapper-title` 一律 `var(--cds-card-title-font-size)`（14px）。见 `tokens/component-overrides.css` §9a。
22. **页面标题最大用 h6**：页面/区块标题原则上最高只用 `h6`（16px，`--cds-font-h6`）；`h5` 及以上（h5/h4/h3/h2/h1）除非有明确要求，否则不使用。见 `tokens/typography.md`。
23. **Tab 非选中项文字用一级正文色**：所有类型 Tab 的非选中项文字颜色统一为 `var(--cds-text-primary)`（一级正文），而非 Cecoder 默认的次要色 `text-2`。选中项仍用各类型自身高亮色。见 `tokens/component-overrides.css` §9b。
24. **AI 对话栏默认无头像、用户气泡无称呼、输入区无顶线**：① 默认不显示 AI 与用户头像——既覆盖包裹类 `.semi-ai-chat-dialogue-avatar`，也覆盖对话栏容器内 Cecoder `Avatar` 实际渲染出的通用类 `.semi-ai-chat-dialogue-container` / `.semi-ai-chat-dialogue-container-right` 内的 `.semi-avatar`（限定作用域，不误伤顶栏 / Copilot 头部等页面其它位置的 `.semi-avatar`；业务如需头像可显式开启）；② 用户自己发送的气泡不显示称呼 `.semi-ai-chat-dialogue-title`（容器 `.semi-ai-chat-dialogue-container-right` 内隐藏）；③ AI 输入区容器不加 `border-top` 分隔线（用留白分隔）。见 `tokens/component-overrides.css` §9c/§9d/§9e。
25. **反 AI 感为硬性验收标准**：在 UI 实现层面，「反 AI 感」是产品能否通过验收的硬指标，详见 §2.8。

### 2.8 反 AI 感（硬性验收标准）

> 目的：避免产品因视觉上的「AI 流水线感」降低消费者的信任与舒适度。下列任一出现即视为**不通过验收**。

**禁止清单（被标签化为「AI 默认审美」的元素，一律不得使用）**
- **蓝紫渐变**：禁止 `linear-gradient` / `radial-gradient` 作背景，尤其 `primary → ai-purple` 这类渐变（图标/品牌/卡片背景均用纯色 token）。
- **玻璃拟态**：禁止 `backdrop-filter: blur()` 的卡片 / 面板 / 浮层。
- **霓虹发光**：禁止彩色 `box-shadow` / `text-shadow` 辉光（外发光、霓虹描边）。投影仅用中性 `--cds-shadow-*` 表达层级。
- **过大圆角**：内容 / 卡片表面 `border-radius` 不得超过 `--cds-radius-max`（12px）。卡片=8px、按钮/标签=3px、菜单=6px、模态=12px；`full/circle` 仅限胶囊标签、头像、开关等合法用途。
- **弹跳动效**：禁止 `bounce` / `elastic` 缓动与 `scale` 弹跳关键帧。交互过渡统一用 `--cds-motion-ease`（ease-out）+ `--cds-motion-duration`（200ms）；状态指示可用淡入淡出（opacity），不得弹跳。

**表单无障碍（硬性）**
- **占位符不得替代标签**：每个表单控件必须有可见 `<label>` 或等价的可访问名称；`placeholder` 只作补充提示，不得当作字段名。
- **对比度过无障碍标准**：所有表单状态（默认 / hover / focus / disabled / error / placeholder 文本）的文字与背景对比度须满足 WCAG AA——正文 ≥ 4.5:1，大字（≥18pt 或 14pt 粗体）与图标 ≥ 3:1。禁用态文字不得低于 `--cds-text-disabled` 的合规对比。

**确定性兜底**：以上「弹跳动效」「过大圆角」由 `tokens/component-overrides.css` §10 统一缓动与圆角上限结构性约束；其余为生成期禁止项 + 评审验收项（见 `ai-prompt.md` 铁律 31–33 与自检清单）。

---

## 3. 命名约定（DOM 类名）

```
.semi-{component}                    组件根，如 .semi-button
.semi-{component}-{type|size|state}  变体/状态，如 .semi-button-primary、.semi-button-large、.semi-input-disabled
.semi-{component}-{slot}             子元素，如 .semi-card-header、.semi-modal-body
.semi-{component}-{sub}              子组件，如 .semi-table-row、.semi-tabs-bar
.is-{state}                          部分布尔态，如 .is-disabled、.is-active
```

- 前缀固定 `semi`（可在 ConfigProvider 改 `prefixCls`，Cecoder 默认保留 `semi` 以与组件库对齐）。
- 生成静态 HTML 时**直接复用这些类名**，使后续替换为 Cecoder React 组件零成本。
- 各组件真实前缀见 `components/_index.md` 表格与每个契约段的"CSS 类名前缀"。
- **AI 组件例外（kebab）**：`AIChatDialogue` / `AIChatInput` 运行时类名是 kebab：`.semi-ai-chat-dialogue*`、`.semi-ai-chat-input`（不是 camelCase `aiChatDialogue`）。其中用户侧气泡额外带 `.semi-ai-chat-dialogue-content-user`。官方 `semi.css` 已含全部样式，`theme-mode="dark"` 自动换肤。

---

## 4. 布局规则

- 页面骨架：`Layout`（Header / Sider / Content / Footer）。
- 栅格：24 列 `Row/Col`，间距用 `gutter`（16 的倍数常用）。
- 间距节奏：组件内 8/12，组件间 16/24，区块间 32/40。
- 响应式：Cecoder 栅格断点 xs<768 sm≥768 md≥992 lg≥1200 xl≥1600；移动优先时单列堆叠。
- 对齐：表单用 Form 的 `labelPosition`（top/left/inset）。

---

## 5. 交互状态

每个可交互控件至少覆盖：`default → hover → active → focus → disabled`，语义色对应：

| 状态 | Token 规律 |
| --- | --- |
| hover | 原色 `-hover`（如 `--cds-color-primary-hover`） |
| active | 原色 `-active` |
| disabled | `-disabled` / `--cds-disabled-*`；**hover 无任何样式变化**，仅用 Tooltip 说明禁用原因 |
| focus | `--cds-focus-border`（蓝色描边）+ 不加粗阴影 |
| 浅底按钮 | `--cds-color-primary-bg` 系列 |

---

## 6. 组件目录（85 个，按分类）

| 分类 | 组件 |
| --- | --- |
| 通用 | Button, IconButton, Icon, Typography, Tag, Avatar, Badge, Highlight, HotKeys |
| 布局 | Layout, Grid, Card, Collapse, Collapsible, Divider, Space, Resizable, Cropper* |
| 导航 | Anchor, Breadcrumb, Dropdown, Pagination, Steps, Tabs, Navigation, SideBar, BackTop, FloatButton, UserGuide*, SideSheet* |
| 数据输入 | Form, Input, InputNumber, AutoComplete, Cascader, Checkbox, ColorPicker, DatePicker, TimePicker, PinCode, Radio, Rating, Select, Slider, Switch, TagInput, Transfer, TreeSelect, Upload, DragMove, ScrollList |
| 数据展示 | List, Carousel, Table, Tree, Calendar, Descriptions, Empty, Image, JsonViewer, OverflowList, Timeline, CodeHighlight*, Lottie |
| 反馈 | Modal, Notification, Toast, Popconfirm, Popover, Tooltip, Progress, Spin, Skeleton, Banner, Feedback, SideSheet, UserGuide |
| AI 能力 | Chat, AIChatDialogue, AIChatInput, MarkdownRender, AudioPlayer, VideoPlayer |
| 全局配置 | ConfigProvider, Locale, ResizeObserver |

> 每个组件的 **官方完整文档**（说明 / 何时使用 / 代码演示用法 / API 参考 / Methods / ARIA / 设计变量）见 `components/<组件>.md`，文件开头附有该组件 **真实源码文件指针**（DOM/JS `.tsx`、`interface.ts`、foundation `constants.ts` 类名枚举、`.scss` 样式、`_story` 示例）。组件↔文档↔源码总表见 `components/_index.md`。

---

## 7. 深色模式

在 `<body>` 上加 `theme-mode="dark"` 即整体切换：文本/背景/描边/功能色浅底/`--semi-shadow-elevated` 全部自动换成暗色值（Layer 1 已内置 dark 覆盖块）。AI 生成时应**始终引用变量**，从而天然支持明暗。

---

## 8. 喂 AI 的标准姿势

1. 角色 + 规则：粘贴 `ai-prompt.md`。
2. 真值：粘贴 `tokens/tokens.css`。
3. 规范摘要：粘贴本文件第 2/3 节（或全文）。
4. 组件契约：只粘贴用到的 `components/<组件>.md`（组件文档：用法示例 + API + 类名 + 设计变量）。
5. 描述你的页面需求。

模型输出应满足：**所有颜色/字号/间距/圆角/投影走 `--cds-*` 变量、类名走 `.semi-*` 约定、覆盖 hover/active/focus/disabled、支持 `theme-mode="dark"`。**
