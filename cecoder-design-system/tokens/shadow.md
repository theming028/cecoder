# 投影 Shadow / 层级 Elevation

| 变量 | box-shadow | 用途 |
| --- | --- | --- |
| `--cds-shadow-0` / `--semi-shadow-0` | `none` | 无投影（贴平页面） |
| `--cds-shadow-1` / `--semi-shadow-1` | `none` | 1 级（当前为 none，预留给描边态） |
| `--cds-shadow-2` / `--semi-shadow-2` | `0px 2px 4px rgba(0, 0, 0, 0.14), 0px 0px 1px rgba(0, 0, 0, 0.16)` | 2 级（卡片/下拉悬浮） |
| `--cds-shadow-elevated` / `--semi-shadow-elevated` | `var(--semi-shadow-elevated)` | 浮层：Modal / Popover / Toast / Notification |
| `--cds-shadow-knob` / `--semi-shadow-knob` | `0 4px 6px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.3)` | 滑块把手等小圆钮 |

> 说明：底层组件库默认主题 `shadow-0/1` 为 `none`，层级主要依靠 **描边** 与 **背景色差**（bg-0→bg-4）区分；`shadow-2` 与 `shadow-elevated` 用于真正浮起元素。深色模式下 `--semi-shadow-elevated` 会切换为带内描边的版本（见 tokens.css dark 块）。

## z-index 层级约定

| 场景 | 变量 | 值 |
| --- | --- | --- |
| portal / 通用插槽 | `--semi-z-portal` | 1 |
| affix 固钉 | `--semi-z-affix` | 10 |
| backtop 回到顶部 | `--semi-z-backtop` | 10 |
| badge 徽标 | `--semi-z-badge` | 10 |
| table 固定列 | `--semi-z-table-fixed` | 101 |
| modal 模态 | `--semi-z-modal` | 1000 |
| toast / notification | `--semi-z-toast` | 1010 |
| popover 气泡 | `--semi-z-popover` | 1030 |
| dropdown 下拉 | `--semi-z-dropdown` | 1050 |
| tooltip 文字提示 | `--semi-z-tooltip` | 1060 |
| image 预览 | `--semi-z-image_preview` | 1070 |

