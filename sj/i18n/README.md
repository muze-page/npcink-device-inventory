# 中英文文案说明

WordPress.org 插件目录的正式展示内容由 `readme.txt` 生成。当前提交包保留英文 `README.txt` 作为主源文案。

插件上线并进入 WordPress.org 翻译系统后，可通过 translate.wordpress.org 翻译插件名称、描述、FAQ、Stable Readme 和 Development Readme。首发阶段只维护英文和简体中文，避免八国语言带来的持续同步和审批成本。

本目录准备英文源文案和简体中文译稿，供提交、官网说明、审核沟通和后续 translate.wordpress.org 使用。

## 语言

- `en_US` - English
- `zh_CN` - 简体中文

## 文件

- `readme-translations-zh-en.md`：中英文人工可读文案。
- `readme-translations-zh-en.json`：中英文机器可读文案，便于后续复制到翻译工具。
- `wordpress-org-stable-zh_CN.po`：已提交到 translate.wordpress.org 的插件运行字符串简体中文译文。
- `wordpress-org-stable-readme-zh_CN.po`：已提交到 translate.wordpress.org 的插件 readme 简体中文译文。
- `wordpress-org-translation-submission-2026-07-03.md`：2026-07-03 中文翻译提交记录、线上状态和后续动作。

## 使用方式

1. 提交 WordPress.org 时使用根目录 `README.txt` 和 `sj/listing-copy.md` 的英文文案。
2. 国内官网、Gitee/GitHub 说明和客服支持优先使用简体中文文案。
3. 审核通过后进入插件页面的 Development / Translate 链接，提交 `zh_CN` 译稿。
4. 如需自行审批中文译文，按 WordPress.org Polyglots 流程申请 PTE。

## 2026-07-03 translate.wordpress.org 提交状态

已使用 WordPress.org 账号 `Npcink` 将简体中文译文导入 translate.wordpress.org：

- Stable：22 条提交为 `Waiting`。
- Stable Readme：37 条提交为 `Waiting`。
- Development：22 条提交为 `Waiting`。
- Development Readme：37 条提交为 `Waiting`。

总页仍显示 `0%` 是预期状态，因为译文处于待审核状态，还未被中文翻译编辑批准。下一步是申请 `zh_CN` 项目翻译编辑权限（PTE），或等待现有中文编辑审核。
