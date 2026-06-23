# WordPress.org 提交准备历史总结

日期：2026-06-23

本文档归纳 `Npcink Device Inventory` 在提交 WordPress.org 插件审核前的主要历史决策、已完成事项、验证结果和当前状态。它用于后续交接、审核追问回复和避免重复排查。

## 当前结论

项目已经完成首发提交前的准备工作，可以进入 WordPress.org 插件审核提交流程。

当前提交身份：

- 插件名称：`Npcink Device Inventory`
- 插件 slug：`npcink-device-inventory`
- Text Domain：`npcink-device-inventory`
- 插件版本：`2.6.1083`
- 上传包：`sj/npcink-device-inventory.zip`
- zip 根目录：`npcink-device-inventory/`
- SHA-256：`f94739d08938e1f1ee89dad0aaa36c25b652cc4a0b2493bdc8cfcae77bf527c8`

建议下一步是提交 `sj/npcink-device-inventory.zip` 到 WordPress.org 插件审核，不建议在审核前继续做大功能、重构后台 UI 或调整接口协议。

## 历史推进脉络

### 1. 适配 WordPress.org 插件目录

最初判断是：项目可以提交 WordPress.org，但还缺少标准插件目录材料和审核安全项。

随后补齐了：

- WordPress.org 标准 `README.txt`。
- 插件 header 元信息，包括版本、最低 WordPress 版本、PHP 版本、许可证和 text domain。
- FAQ、安装说明、截图说明、隐私说明、changelog 和 upgrade notice。
- `sj/submission-form-copy.md`，用于复制到 WordPress.org 提交表单。
- `sj/review-notes-for-plugin-team.md`，用于向 Plugin Review Team 说明技术边界。
- `sj/review-response-templates.md`，用于审核追问时快速回复。
- `sj/wordpress-org-upload-checklist.md`，用于提交前检查。

### 2. 打包和审核风险收敛

为适配 WordPress.org 审核，打包逻辑改为生成标准插件包，并排除不应进入 zip 的开发和提交资料。

关键处理：

- 打包脚本生成 `release/npcink-device-inventory.zip`。
- 上传副本同步为 `sj/npcink-device-inventory.zip`。
- zip 根目录固定为 `npcink-device-inventory/`。
- 包内不包含 `node_modules`、`.env`、`.DS_Store`、`.map`、`.github`、`release`。
- 包内包含前端构建产物，同时包含对应 React/TypeScript 源码和构建配置，便于审核团队验证 bundled JavaScript source。
- 移除或替换授权不明确、商标风险较高的平台、支付、OS/device 图片素材，改为文本标签。

### 3. 展示资产、截图和文案

WordPress.org 插件页展示资产已放在 `sj/assets/`：

- `banner-772x250.png`
- `banner-1544x500.png`
- `icon-128x128.png`
- `icon-256x256.png`
- `screenshot-1.png` 到 `screenshot-5.png`

这些图片不进入插件 zip。审核通过并拿到 SVN 仓库后，应提交到 SVN 顶层 `assets/` 目录。

已准备的文案：

- 英文插件目录文案：`sj/listing-copy.md`
- 简体中文插件目录文案：`sj/listing-copy-zh_CN.md`
- 中英文翻译资料：`sj/i18n/`
- 新用户快速开始：`sj/new-user-quick-start.md`
- 桌面上传软件说明：`sj/desktop-uploader-release-notes.md`

首发语言策略收敛为英文和简体中文，不在首发前扩展多语言，以降低审核和维护成本。

### 4. GitHub 远端和本地历史同步

发布准备过程中曾出现本地分支历史和远端 `master` 不一致的问题。根因是部分提交曾通过 GitHub API 写入远端，导致远端提交 SHA 和本地提交 SHA 不同，但文件 tree 内容一致。

处理方式：

- 先确认远端 `master` 当前 SHA。
- 用 `git fetch origin master` 拉取远端真实提交。
- 将本地改名提交 rebase 到 `origin/master`。
- 再使用 Git CLI 执行 `git push origin master`。

最终 Git CLI 推送成功，远端 `master` 当前提交为：

```text
4b030d6 Rename plugin to Npcink Device Inventory
```

### 5. 插件改名决策

提交审核前确认插件名称时，旧名 `Npcink Device Manage` 不够自然，语义也偏动作而非产品类别。最终改为：

```text
Npcink Device Inventory
```

这个名称更符合插件实际用途：在 WordPress 中管理设备资产台账、库存和查询。

改名范围包括：

- 主插件文件：`npcink-device-inventory.php`
- 插件名：`Npcink Device Inventory`
- slug：`npcink-device-inventory`
- text domain：`npcink-device-inventory`
- PHP 类名前缀和函数前缀
- 语言模板：`languages/npcink-device-inventory.pot`
- 打包脚本、CI workflow、README、提交资料和审核资料

后续仓库名和本地目录也统一为 `npcink-device-inventory`，旧字符串只作为历史旧名说明保留。

## 最终验证结果

改名后重新执行并通过：

```bash
php -l npcink-device-inventory.php
php -l uninstall.php
php -l index.php
find admin includes -name "*.php" -print0 | xargs -0 -n1 php -l
composer phpcs
composer phpstan
npm install --prefix vite-admin
npm run build --prefix vite-admin
npm install --prefix vite-search
npm run build --prefix vite-search
bash .github/scripts/package-wordpress-plugin.sh
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin check /Users/muze/gitee/npcink-device-inventory/release/npcink-device-inventory --format=json
```

结果：

- PHP syntax：通过
- PHPCS：通过，`21 / 21 (100%)`
- PHPStan：通过，`No errors`
- Vite admin build：通过，仅有已知 chunk size warning
- Vite search build：通过，仅有已知 chunk size warning
- Plugin Check：通过，`No errors found`
- 包扫描：通过，无旧 slug、无禁止开发文件、无不应提交的依赖目录

当前上传包：

```text
sj/npcink-device-inventory.zip
```

该文件和 `release/npcink-device-inventory.zip` 的 SHA-256 一致：

```text
f94739d08938e1f1ee89dad0aaa36c25b652cc4a0b2493bdc8cfcae77bf527c8
```

## 提交审核时使用的资料

提交入口：

```text
https://wordpress.org/plugins/developers/add/
```

提交表单建议使用：

```text
sj/submission-form-copy.md
```

如表单要求 Additional Information，可说明：

```text
Npcink Device Inventory stores device inventory data in the site's own WordPress database. It does not contact a third-party service during normal plugin operation. Public query and upload endpoints require a client authorization token and HMAC signature. Admin endpoints require a WordPress user with manage_options. The package includes bundled React build files together with the corresponding TypeScript/React source and build configuration. Optional desktop upload tooling is documented separately and is not included in the WordPress plugin package.
```

审核追问时优先参考：

- `sj/review-notes-for-plugin-team.md`
- `sj/review-response-templates.md`
- `sj/technical-verification-record.md`
- `docs/wordpress-org-release-audit.md`

## 当前不建议继续改动的范围

除非 WordPress.org 审核团队提出明确问题，提交前不建议继续改：

- 插件 slug
- Text Domain
- 数据表结构
- REST API 协议
- 后台主要 UI
- 上传签名协议
- 截图和 README 主文案

原因是这些改动会导致 zip hash、截图、验证记录和审核说明重新变化，增加提交前风险。

## 审核通过后的动作

WordPress.org 审核通过后会分配 SVN 仓库。首次发布时应：

1. 将插件代码提交到 SVN `trunk/`。
2. 创建 `tags/2.6.1083/`。
3. 将 `sj/assets/` 中的 banner、icon 和 screenshots 提交到 SVN 顶层 `assets/`。
4. 不要向 SVN 提交 zip 文件。
