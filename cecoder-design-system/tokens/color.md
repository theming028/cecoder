# 色彩 Color

## 1. 语义色（Semantic · 优先在 HTML 中使用）

语义变量同时提供 `--semi-color-*`（原始）与 `--cds-*`（Cecoder 别名）两层。下表给出别名到原始变量的映射；**解析后的具体色值见 `tokens.css` Layer 1/Layer 2，需结合下方调色板三元组**。

| 语义 | Cecoder 别名 | 原始变量 | 说明 |
| --- | --- | --- | --- |
| 主色 primary | `--cds-color-primary` | `--semi-color-primary` | 主要颜色。仅在需要非常强调的情况下使用。 |
| 主色·悬浮 | `--cds-color-primary-hover` | `--semi-color-primary-hover` | 主要颜色悬浮态 |
| 主色·按下 | `--cds-color-primary-active` | `--semi-color-primary-active` | 主要颜色激活态 |
| 主色·禁用 | `--cds-color-primary-disabled` | `--semi-color-primary-disabled` | 主要颜色禁用态 |
| 主色浅底 | `--cds-color-primary-bg` | `--semi-color-primary-light-default` | 浅版主要颜色（多用于背景）。仅在需要非常强调的情况下使用。 |
| 次要色 | `--cds-color-secondary` | `--semi-color-secondary` | 次要颜色。强调作用次于主要颜色，但仍然具有强调作用。 |
| 第三色 | `--cds-color-tertiary` | `--semi-color-tertiary` | 第三颜色，可以在页面上多次使用 |
| 成功 | `--cds-color-success` | `--semi-color-success` | 成功色，表示安全、成功、开启的状态 |
| 警告 | `--cds-color-warning` | `--semi-color-warning` | 警示色，表示警告、不安全的状态 |
| 危险 | `--cds-color-danger` | `--semi-color-danger` | 危险色，表示危险的操作、或需要特别注意的危险信息 |
| 信息 | `--cds-color-info` | `--semi-color-info` | 信息色, 通常用于表达客观、中立信息 |
| 链接 | `--cds-color-link` | `--semi-color-link` | 链接颜色 |
| 文本·主 | `--cds-text-primary` | `--semi-color-text-0` | 文本/图标颜色 - 最主要 |
| 文本·次 | `--cds-text-secondary` | `--semi-color-text-1` | 文本/图标颜色 - 稍次要 |
| 文本·三 | `--cds-text-tertiary` | `--semi-color-text-2` | 文本/图标颜色 - 次要 |
| 文本·禁用 | `--cds-text-disabled` | `--semi-color-text-3` | 文本/图标颜色 - 最次要 |
| 页面底 | `--cds-bg-page` | `--semi-color-bg-0` | 背景色 - 最下层（底部页面） |
| 容器底 | `--cds-bg-container` | `--semi-color-bg-1` | 背景色 - 次下层（页面中需要提升的内容） |
| 浮层底 | `--cds-bg-elevated` | `--semi-color-bg-2` | 背景色 - 中间层（模态等容器） |
| 默认描边 | `--cds-border` | `--semi-color-border` | 默认描边颜色 |
| 聚焦描边 | `--cds-focus-border` | `--semi-color-focus-border` | 多用于边框激活态颜色 |
| 填充 | `--cds-fill` | `--semi-color-fill-0` | 填充色 - 默认态 |
| 遮罩 | `--cds-overlay` | `--semi-color-overlay-bg` | 蒙层背景色 |

> 注：上表“原始变量”值为 `rgba(var(--semi-xxx), a)` 形式，需结合下方调色板三元组解析；完整可解析值见 `tokens.css` 的 Layer 2。

## 2. 调色板 Palette（10 级色阶 0→9，浅→深）

底层组件库原始存储为 **RGB 三元组**（如 `--semi-blue-5: 0,100,250`），在 CSS 中以 `rgba(var(--semi-blue-5), 1)` 使用。下表给出对应十六进制。

| 级别 | grey | red | pink | purple | violet | indigo | blue | light-blue | cyan | teal | green | light-green | lime | yellow | amber | orange |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **0** | `#f9f9f9` | `#fef2ed` | `#fdecef` | `#f7e9f7` | `#f3edf9` | `#eceff8` | `#eaf5ff` | `#e9f7fd` | `#e5f7f8` | `#e4f7f4` | `#ecf7ec` | `#f3f8ec` | `#f2fae6` | `#fffdea` | `#fefbeb` | `#fff8ea` |
| **1** | `#e6e8ea` | `#feddd2` | `#fbcfd8` | `#efcaf0` | `#e2d1f4` | `#d1d8f0` | `#cbe7fe` | `#c9ecfc` | `#c2eff0` | `#c0f0e8` | `#d0f0d1` | `#e3f0d0` | `#e3f6c5` | `#fefbcb` | `#fcf5ce` | `#feeecc` |
| **2** | `#c6cacd` | `#fdb7a5` | `#f6a0b5` | `#dd9be0` | `#c4a7e9` | `#a7b3e1` | `#98cdfd` | `#95d8f8` | `#8adde2` | `#87e0d3` | `#a4e0a7` | `#c8e2a5` | `#cbed8e` | `#fdf398` | `#f9e89e` | `#fed998` |
| **3** | `#a7abb0` | `#fb9078` | `#f27396` | `#c96fd1` | `#a67fdd` | `#8090d3` | `#65b2fc` | `#62c3f5` | `#58cbd3` | `#54d1c1` | `#7dd182` | `#add37e` | `#b7e35b` | `#fce865` | `#f6d86f` | `#fdc165` |
| **4** | `#888d92` | `#fa664c` | `#ed487b` | `#b449c2` | `#885bd2` | `#5e6fc4` | `#3295fb` | `#30acf1` | `#2cb8c5` | `#27c2b0` | `#5ac262` | `#93c55b` | `#a7da2c` | `#fbda32` | `#f3c641` | `#fda633` |
| **5** | `#6b7075` | `#f93920` | `#e91e63` | `#9e28b3` | `#6a3ac7` | `#3f51b5` | `#0064fa` | `#0095ee` | `#05a4b6` | `#00b3a1` | `#3bb346` | `#7bb63c` | `#9bd100` | `#fac800` | `#f0b114` | `#fc8800` |
| **6** | `#555b61` | `#d52515` | `#c51356` | `#871e9e` | `#572fb3` | `#3342a1` | `#0062d6` | `#007bca` | `#038698` | `#009589` | `#30953b` | `#649830` | `#7eae00` | `#d0aa00` | `#c88a0f` | `#d26700` |
| **7** | `#41464c` | `#b2140c` | `#a20b48` | `#71168a` | `#46259e` | `#28348c` | `#004fb3` | `#0063a7` | `#016979` | `#00776f` | `#25772f` | `#4e7926` | `#638b00` | `#a78b00` | `#a0660a` | `#a84a00` |
| **8** | `#2e3238` | `#8e0805` | `#7e053a` | `#5c0f75` | `#361c8a` | `#1f2878` | `#003d8f` | `#004b83` | `#004d5b` | `#005955` | `#1b5924` | `#395b1b` | `#486800` | `#7d6a00` | `#784606` | `#7e3100` |
| **9** | `#1c1f23` | `#6a0103` | `#5a012b` | `#490a61` | `#281475` | `#171d63` | `#002c6b` | `#00355f` | `#00323d` | `#003c3a` | `#113c18` | `#253d12` | `#2f4600` | `#534800` | `#502b03` | `#541d00` |

| 中性 | grey | 用途 |
| --- | --- | --- |
| black | `#000000` | 纯黑 |
| white | `#ffffff` | 纯白 |

## 3. 数据可视化色板（vchart data-0…19）

用于图表，详见 `tokens.css` 中 `--semi-color-data-*`。

