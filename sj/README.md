# Npcink Device Inventory WordPress.org 提交资料归档

日期：2026-06-21 起持续维护

这个目录用于归档 `Npcink Device Inventory` 提交到 WordPress.org 插件目录时需要的资料、展示素材、审核沟通文案和提交记录。日常 GitHub release 以仓库根目录的 `README.md`、`README.txt`、`docs/release-readiness-checklist.md` 和 `release/npcink-device-inventory.zip` 为准；只有准备 WordPress.org submission 时，才显式生成并使用 `sj/npcink-device-inventory.zip`。

## 上传文件

- 上传包：`sj/npcink-device-inventory.zip`
- 原始生成位置：`release/npcink-device-inventory.zip`
- 插件 slug：`npcink-device-inventory`
- 当前主版本：以根目录 `npcink-device-inventory.php` 的 `Version` 和 `README.txt` 的 `Stable tag` 为准。
- zip 根目录：`npcink-device-inventory/`

## 文件说明

- `wordpress-org-upload-checklist.md`：上传前检查清单。
- `submission-form-copy.md`：WordPress.org 提交表单可复制文案。
- `review-notes-for-plugin-team.md`：给 Plugin Review Team 的英文技术说明。
- `review-response-templates.md`：若审核追问 JS 源码、自定义表、商标素材等问题时的回复模板。
- `release-stage-summary-and-next-steps.md`：当前阶段总结、冻结建议和下一阶段提交流程。
- `wordpress-org-submission-history.md`：提交审核前的历史决策、改名过程、验证结果和当前状态归档。
- `technical-verification-record.md`：本地构建、PCP、包扫描、REST 冒烟验证记录。
- `package-manifest.json`：包名、版本、hash、验证摘要的机器可读记录。
- `new-user-quick-start.md`：新用户安装、设置、录入、上传和备份快速开始。
- `desktop-uploader-release-notes.md`：桌面上传软件单独发布说明。
- `npcink-device-inventory.zip`：准备上传的插件 zip，只在运行 `npm run build:submission` 时生成或刷新。
- `assets/`：WordPress.org 插件目录展示素材；当前只发布 banner 和 icon，目录中的旧截图已明确标记为不得发布。
- `listing-copy.md`：英文插件目录描述、FAQ、隐私说明主文案。
- `listing-copy-zh_CN.md`：简体中文描述、FAQ、隐私说明主文案。
- `i18n/`：英文和简体中文文案，供后续 translate.wordpress.org 使用。

## 官方参考

- Plugin submission FAQ: https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/
- Planning, submitting, and maintaining plugins: https://developer.wordpress.org/plugins/wordpress-org/planning-submitting-and-maintaining-plugins/
- Detailed plugin guidelines: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Subversion after approval: https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/

## 上传步骤

1. 在仓库根目录运行 `npm run build:submission && npm run check:submission`。
2. 登录 WordPress.org 账号。
3. 打开插件提交页：https://wordpress.org/plugins/developers/add/
4. 上传 `sj/npcink-device-inventory.zip`。
5. 使用 `submission-form-copy.md` 中的英文简介作为提交说明。
6. 提交后关注 WordPress.org 账号邮箱，等待自动确认和人工审核邮件。
7. 如果收到审核问题，优先参考 `review-response-templates.md` 回复。

## 中英文资料

提交包中的 `README.txt` 仍以英文为主源文案。首发阶段只维护英文和简体中文，避免八国语言带来的持续同步和审批成本。

已准备语言：

```text
en_US, zh_CN
```

英文用于 WordPress.org 审核和插件页主文案；中文用于国内说明、客服支持，以及审核通过后提交到 translate.wordpress.org 的 `zh_CN` 翻译。

## 审核通过后的展示图上传

审核通过并拿到 WordPress.org SVN 仓库后，将 `sj/assets/` 下的四个当前 PNG 放到 SVN 顶层 `assets/`：

```text
assets/banner-772x250.png
assets/banner-1544x500.png
assets/icon-128x128.png
assets/icon-256x256.png
```

这些展示图片不要放进插件 zip，也不要放到 `trunk/assets/`。现存 `screenshot-1.png` 到 `screenshot-5.png` 仅作历史对照；在 3.0 界面冻结并重新采集前不要上传。
