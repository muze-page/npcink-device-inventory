# Npcink Device Manage WordPress.org 提交资料

日期：2026-06-21

这个目录用于提交 `Npcink Device Manage` 到 WordPress.org 插件目录前的资料归档。

## 上传文件

- 上传包：`sj/npcink-device-manage.zip`
- 原始生成位置：`release/npcink-device-manage.zip`
- 插件 slug：`npcink-device-manage`
- 插件版本：`2.6.1083`
- zip 根目录：`npcink-device-manage/`

## 文件说明

- `wordpress-org-upload-checklist.md`：上传前检查清单。
- `submission-form-copy.md`：WordPress.org 提交表单可复制文案。
- `review-notes-for-plugin-team.md`：给 Plugin Review Team 的英文技术说明。
- `review-response-templates.md`：若审核追问 JS 源码、自定义表、商标素材等问题时的回复模板。
- `release-stage-summary-and-next-steps.md`：当前阶段总结、冻结建议和下一阶段提交流程。
- `technical-verification-record.md`：本地构建、PCP、包扫描、REST 冒烟验证记录。
- `package-manifest.json`：包名、版本、hash、验证摘要的机器可读记录。
- `new-user-quick-start.md`：新用户安装、设置、录入、上传、公共查询快速开始。
- `desktop-uploader-release-notes.md`：桌面上传软件单独发布说明。
- `npcink-device-manage.zip`：准备上传的插件 zip。
- `assets/`：WordPress.org 插件目录展示用 banner、icon、screenshots，审核通过后放到 SVN 顶层 `assets/` 目录。
- `listing-copy.md`：英文插件目录描述、FAQ、隐私说明主文案。
- `listing-copy-zh_CN.md`：简体中文描述、FAQ、隐私说明主文案。
- `i18n/`：英文和简体中文文案，供后续 translate.wordpress.org 使用。

## 官方参考

- Plugin submission FAQ: https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/
- Planning, submitting, and maintaining plugins: https://developer.wordpress.org/plugins/wordpress-org/planning-submitting-and-maintaining-plugins/
- Detailed plugin guidelines: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Subversion after approval: https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/

## 上传步骤

1. 登录 WordPress.org 账号。
2. 打开插件提交页：https://wordpress.org/plugins/developers/add/
3. 上传 `sj/npcink-device-manage.zip`。
4. 使用 `submission-form-copy.md` 中的英文简介作为提交说明。
5. 提交后关注 WordPress.org 账号邮箱，等待自动确认和人工审核邮件。
6. 如果收到审核问题，优先参考 `review-response-templates.md` 回复。

## 中英文资料

提交包中的 `README.txt` 仍以英文为主源文案。首发阶段只维护英文和简体中文，避免八国语言带来的持续同步和审批成本。

已准备语言：

```text
en_US, zh_CN
```

英文用于 WordPress.org 审核和插件页主文案；中文用于国内说明、客服支持，以及审核通过后提交到 translate.wordpress.org 的 `zh_CN` 翻译。

## 审核通过后的展示图上传

审核通过并拿到 WordPress.org SVN 仓库后，将 `sj/assets/` 下的四个 PNG 放到 SVN 顶层 `assets/`：

```text
assets/banner-772x250.png
assets/banner-1544x500.png
assets/icon-128x128.png
assets/icon-256x256.png
assets/screenshot-1.png
assets/screenshot-2.png
assets/screenshot-3.png
assets/screenshot-4.png
assets/screenshot-5.png
```

这些展示图片不要放进插件 zip，也不要放到 `trunk/assets/`。
