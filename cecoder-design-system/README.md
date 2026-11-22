# Cecoder 设计系统（Cecoder Design System）

> 基于 [Cecoder 设计系统](https://github.com/cecoder/cecoder-design-system)（@douyinfe/semi-ui）的颜色、文字、投影、字号字重、间距圆角与**全量组件契约**重新组织而成，专门用于**喂给 AI 生成符合规范的 HTML 页面**。
>
> 所有数值与组件 props 均从 Cecoder 主干源码（`semi-theme-default` / `semi-ui` / `semi-foundation`）自动抽取，未做人工臆测。

## 这是什么

一套「设计系统即提示词」的文档包。前端同事不需要读 Cecoder 源码，只要把对应文件投喂给任意代码大模型，即可生成**结构、类名、配色、字号都符合规范**的 HTML/CSS 页面。

## 目录结构

```
cecoder-design-system/
├── README.md              本文件：定位与使用方式
├── DESIGN.md              ★ 完整设计规范（原则 / token 体系 / 命名 / 布局 / 组件目录）
├── ai-prompt.md           ★ 可直接粘贴给 AI 的「系统提示词」
├── tokens/
│   ├── tokens.css         设计变量双层（Layer1 原始 --semi-* + Layer2 语义 --cds-*，含深色模式）
│   ├── tokens.json        结构化 token（颜色/字体/圆角/间距/尺寸/投影/层级）
│   ├── component-overrides.css  全局组件覆盖：下拉选项列表 8px、AI 气泡圆角 8px、用户气泡蓝色系
│   ├── color.md           色彩（语义色 + 16 色 × 10 级调色板 + 图表色板）
│   ├── typography.md      文字（字体族 / 字号 / 行高 / 字重）
│   ├── shadow.md          投影与 z-index 层级
│   └── spacing-radius-size.md  间距 / 圆角 / 控件尺寸
├── components/            ★ 85 个组件 = 组件规范文档 + 真实源码文件指针
│   ├── _index.md          组件总览（组件↔文档↔源码 映射表）
│   ├── Button.md          官方文档（说明/何时使用/代码演示用法/API/Methods/ARIA/设计变量）+ 源码指针
│   ├── Select.md / Transfer.md / Calendar.md / Cascader.md / Input.md …（每个组件一份）
├── guides/                官方元指南：tokens / 暗色模式 / 设计稿转代码 / 定制主题 / 快速开始 / 组件总览 / MCP-Skills / 无障碍 / 国际化 / AI 能力
├── src/                   ★ 真实组件源码（已打包，20M）：semi-ui / semi-foundation / semi-theme-default / semi-icons
│                          每个组件的 DOM/JS(.tsx)、类型(interface.ts)、类名枚举(constants.ts)、样式(.scss)、示例(_story)
└── showcase/              转译样例：用真实组件渲染的高保真页面
    ├── ai-software-factory-v2.html  ★★★ 最新规范重译版·AI 消费友好范例（忠实原型三栏工作区+列间 resizer+折叠 rail；统一查看器按工序 kind 切换 doc/board/api/diff/report/review 真实组件；单一实心主按钮/控件32px/卡片8px·标题14px/表格36px含padding·表头12px/strong500/页面标题最大h6/Tab非选中一级正文色/官方图标库无emoji/禁用仅Tooltip/代码Diff默认字体族12px/AI气泡8px+用户浅蓝底黑字·助手标题12px·默认无头像·用户气泡无称呼·输入区无顶线/工序节点居中+连接线/左右两栏可拖拽调宽；反AI感硬性验收：无蓝紫渐变·无玻璃拟态·无霓虹辉光·圆角≤12px·过渡ease-out无弹跳·表单有label且对比度过WCAG AA；真实 AIChatDialogue+AIChatInput）
    ├── src/ai-software-factory-v2.reference.jsx  ★ 该页可读源码范例（喂给 AI 的 canonical few-shot：真实组件 + 全 --cds-* token + 规范逐条注释映射）
    ├── ai-software-factory.html   ★ 真实组件 + 客户端 React 运行时（可点击切换/选择、统一 32px、卡片 8px、明暗可用；右栏 Copilot 用真实 AIChatDialogue + AIChatInput）
    ├── giencoder-workbench.html   ★ GienCoder AI 研发工作台转译（首页忠实还原原型布局/交互：任务竖条折叠展开、场景/角色/工序选择+上下文 chip、数字分身面板、洞察看板 add→生成、发送后两态对话沉底；工作视图 11 道工序节点居中+连接线、左右两栏可拖拽调宽、真实 AI 协作栏；已按固定规范自检：单主按钮/表格36px/表头12px/AI标题12px/图标库/禁用仅Tooltip/代码12px/AI气泡8px+用户浅蓝底黑字；反AI感硬性验收：无蓝紫渐变·无玻璃拟态·无霓虹辉光·圆角≤12px·过渡ease-out无弹跳·表单有label且对比度过WCAG AA）
    ├── app-workbench.js / workbench.css   该页 bundle 与布局样式
    ├── app.js                     客户端 React bundle（真实组件交互）
    ├── semi.css / cecoder-tokens.css / page.css   该页依赖样式（官方组件样式 + Cecoder token + 布局）
    ├── ai-software-factory.ssr.html   纯 SSR 静态版（无交互，供对照）
    └── ai-software-factory.cecoder.html   早期纯手写版（供对比）
```

> **组件层说明**：`components/*.md` 是 **Cecoder 设计系统 官方组件文档的逐字副本**——每篇开头列出该组件 **真实源码文件指针**（`src/semi-ui/{组件}` 的 DOM/JS `.tsx`、`interface.ts` 类型、`src/semi-foundation/{组件}` 的 `constants.ts` 类名/枚举与 `.scss` 样式、`_story/Demo.tsx` 示例），正文为官方「说明 / 何时使用 / 代码演示（含完整 JSX 用法示例）/ API 参考 / Methods / ARIA / 设计变量」。源码已物理打包进 `src/`，交付自包含。

> **转译方法（showcase）**：转译页用 Cecoder 真实 React 组件 + 客户端运行时挂载，**所有控件可交互**（标签页/下拉/选中/开关/按钮反馈），统一**默认 32px 尺寸**、卡片**圆角固定 8px**，并叠加官方 `semi.css`(2.105.0)、`component-overrides.css` 与 Cecoder 双层 token，明暗随 token 自动切换。复现脚本见仓库同级 `_build/ssr/`（`client.jsx`/`workbench.jsx` + esbuild 打包）。
>
> **右栏 AI 对话**：定位为 AI 对话栏，直接接入 Cecoder 官方 **`AIChatDialogue` + `AIChatInput`**（消息采用 OpenAI Response Object 格式，用官方 `chatInputToMessage` 把输入转成对话消息）。注意这两个组件的运行时 DOM 类名是 kebab：`.semi-ai-chat-dialogue*` / `.semi-ai-chat-input`（不是 camelCase），官方 `semi.css` 已含其样式，明暗自动换肤。

## 怎么喂给 AI（三种用法）

### 用法 A：生成任意页面（最常用）
把这几样一起发给模型：
1. `ai-prompt.md` 全文（系统提示词 / 角色设定）
2. `tokens/tokens.css` 全文（样式真值，让模型直接 `var()` 引用）
3. 本次涉及的 `components/<组件>.md`（官方完整文档：用法示例 + API + 类名 + 设计变量，按需只发用得到的）

> 提示：`tokens.css` 已自包含明暗两套变量，页面 `body` 上加 `theme-mode="dark"` 即切深色。

### 用法 B：只要规范约束、模型自带样式
只发 `ai-prompt.md` + `DESIGN.md` 的「命名约定」与「token 体系」两节，让模型用语义 token 名（`--cds-*`）输出。

### 用法 C：精确还原某组件
发 `components/<组件>.md`（组件文档含真实用法 JSX 示例 + API + 设计变量 + 源码指针），并要求"只用语义 token、类名遵循 `.semi-*`、参照文档中的代码演示还原 DOM 结构"。

## 关键约定（务必让 AI 遵守）

- **前缀**：所有类名以 `.semi-` 开头，结构 `.semi-{组件}`，变体 `.semi-{组件}-{type|size|state}`，子元素 `.semi-{组件}-{slot}`。生成**纯 HTML 静态页**时直接复用这套类名，便于后续与 Cecoder React 组件对齐。
- **颜色**：优先用 Layer 2 语义变量（`--cds-color-*`、`--cds-text-*`、`--cds-bg-*`、`--cds-border`），**禁止硬编码**十六进制或 `rgba()` 字面量。
- **字号/字重/间距/圆角/投影**：一律用 `--cds-font-*` / `--cds-space-*` / `--cds-radius-*` / `--cds-shadow-*`。
- **状态色**：成功 `--cds-color-success`、警告 `--cds-color-warning`、危险 `--cds-color-danger`、信息 `--cds-color-info`，浅底用对应 `*-bg`。

## 数据来源与可复现

| 内容 | 来源 |
| --- | --- |
| 颜色 / 调色板 / 语义色 / 圆角 / 投影 / 层级 | `semi-theme-default/scss/{_palette,global,variables,mixin}.scss` |
| 字号 / 字重 / 行高 | `variables.scss` + `_font.scss` |
| 组件清单 / 类名前缀 / 变体枚举 | `semi-foundation/{组件}/constants.ts` |
| 组件 props 表 | `semi-ui/{组件}/*.{ts,tsx}` 中真实 `interface/type *Props` |

抽取与生成脚本位于仓库同级 `_build/`，更新 Cecoder 后可一键重跑。

---
_生成自 Cecoder 设计系统 主干（`main`，浅克隆 + sparse-checkout）。Cecoder Design System。_
