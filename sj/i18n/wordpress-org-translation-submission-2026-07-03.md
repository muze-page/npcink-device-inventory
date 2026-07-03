# WordPress.org 中文翻译提交记录

日期：2026-07-03

本文档记录 `Npcink Device Inventory` 在 translate.wordpress.org 上提交简体中文译文的过程、使用文件、线上状态和后续动作。它用于后续申请 PTE、跟进审核和避免重复提交。

## 背景

插件已上线到 WordPress.org，并进入 translate.wordpress.org 翻译系统。

插件信息：

- 插件名称：`Npcink Device Inventory`
- 插件 slug：`npcink-device-inventory`
- Text Domain：`npcink-device-inventory`
- Locale：`zh_CN` / Chinese (China)
- 翻译入口：`https://translate.wordpress.org/locale/zh-cn/default/wp-plugins/npcink-device-inventory/`

仓库内此前已经准备了中文文案，但尚未提交到 translate.wordpress.org：

- `sj/listing-copy-zh_CN.md`
- `sj/i18n/readme-translations-zh-en.md`
- `sj/i18n/readme-translations-zh-en.json`

线上初始状态为：

- Stable：Translated `0`，Waiting `0`，Untranslated `22`
- Stable Readme：Translated `0`，Waiting `0`，Untranslated `37`
- Development：Translated `0`，Waiting `0`，Untranslated `22`
- Development Readme：Translated `0`，Waiting `0`，Untranslated `37`

## 提交方式

本次没有逐条在网页表单中复制粘贴，而是先整理为 PO 文件，再通过 GlotPress 的 `Import Translations` 页面导入。

生成并提交的本地文件：

- `sj/i18n/wordpress-org-stable-zh_CN.po`
- `sj/i18n/wordpress-org-stable-readme-zh_CN.po`

`wordpress-org-stable-zh_CN.po` 覆盖插件运行字符串。部分原文已经是中文，因此译文保持原文一致；英文短字符串按实际后台语境翻译，例如：

- `Settings` -> `设置`
- `Client Tokens` -> `客户端令牌`
- `Assets` -> `资产`
- `Device Inventory` -> `设备台账`

`wordpress-org-stable-readme-zh_CN.po` 覆盖插件目录 readme 字符串，包括短描述、插件说明、FAQ、隐私说明、安装步骤、changelog 和截图说明。

## 实际提交结果

已使用 WordPress.org 账号 `Npcink` 登录并完成导入。

导入结果：

- Stable：`22 translations were added`
- Stable Readme：`37 translations were added`
- Development：已导入同一批插件运行字符串，22 条进入 Waiting
- Development Readme：已导入同一批 readme 字符串，37 条进入 Waiting

最终线上总页状态：

| 子项目 | Translated | Fuzzy | Untranslated | Waiting | Changes requested |
|---|---:|---:|---:|---:|---:|
| Stable | 0 | 0 | 0 | 22 | 0 |
| Stable Readme | 0 | 0 | 0 | 37 | 0 |
| Development | 0 | 0 | 0 | 22 | 0 |
| Development Readme | 0 | 0 | 0 | 37 | 0 |

总进度仍显示 `0%` 是预期状态，因为译文处于 `Waiting`，还不是已批准的 `Current`。WordPress.org 语言包通常需要 Stable 字符串达到 90% 已批准后才会生成。

## 后续动作

下一步应申请 `zh_CN` 的 PTE（Project Translation Editor）权限，或等待现有中文翻译编辑审核。

PTE 申请重点信息：

- Plugin Name：`Npcink Device Inventory`
- Plugin Slug：`npcink-device-inventory`
- Plugin URL：`https://wordpress.org/plugins/npcink-device-inventory/`
- Translate URL：`https://translate.wordpress.org/locale/zh-cn/default/wp-plugins/npcink-device-inventory/`
- Locale tag：`#zh_CN`
- WordPress.org 用户：`@Npcink`

申请通过后，需要在 translate.wordpress.org 中把本次 Waiting 译文审核为 Current。审核通过后，插件页 readme 中文通常会较快展示；插件运行字符串语言包则以 Stable 已批准进度为准。

## 注意事项

- 不要重复导入同一批译文，避免制造重复 Waiting 记录。
- 后续插件发版后，如 readme 或 gettext 字符串变化，应重新从线上待翻译字符串整理 PO。
- 若修改 PO 文件，需保留 HTML 标签、代码标签和 URL 原文结构，避免 GlotPress 校验 warning。
- 当前 PO 文件是线上提交记录的一部分，应随仓库保留，便于后续 PTE 审核和复核。
