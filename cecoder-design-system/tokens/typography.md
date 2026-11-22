# 文字 Typography

## 字体族

```css
font-family: var(--cds-font-family);
/* Inter, -apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif */
```

> **代码字体规范**：整个设计系统里的「代码 / Diff / 终端」对象统一使用**默认字体族**，不单独使用代码（等宽）字体。`--cds-font-family-code` 现解析为默认字体族；代码区仅保留字号 `--cds-font-size-code: 12px`。

## 字号与行高

| 层级 | Cecoder 变量 | 字号 | 行高 | 用途 |
| --- | --- | --- | --- | --- |
| small | `--cds-font-xs` | 12px | 16px | 辅助/说明文字 |
| regular | `--cds-font-sm` | 14px | 20px | 正文/控件默认 |
| header-6 | `--cds-font-h6` | 16px | 22px | 六级标题 |
| header-5 | `--cds-font-h5` | 18px | 24px | 五级标题 |
| header-4 | `--cds-font-h4` | 20px | 28px | 四级标题 |
| header-3 | `--cds-font-h3` | 24px | 32px | 三级标题 |
| header-2 | `--cds-font-h2` | 28px | 40px | 二级标题 |
| header-1 | `--cds-font-h1` | 32px | 44px | 一级标题 |

## 字重

| 变量 | 值 | 用途 |
| --- | --- | --- |
| `--cds-font-weight-light` | 200 | 细（少用） |
| `--cds-font-weight-regular` | 400 | 正文 |
| `--cds-font-weight-bold` | 600 | 标题/强调 |
| `--cds-font-weight-strong` | 500 | `<strong>` 标签默认字重（Cecoder 规范，见 component-overrides.css §8） |

