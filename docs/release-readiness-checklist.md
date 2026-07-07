# 发布前检查清单

## 目标

这份清单用于每次发布 `Npcink Device Inventory` 前做最后验收。它覆盖代码静态检查、前端构建、发布包结构、桌面更新清单和本地后台冒烟测试。

## 自动检查

在仓库根目录运行：

```bash
npm run check:release
```

该命令面向日常 GitHub release 包，只检查 `release/npcink-device-inventory.zip`，并要求仓库中不存在陈旧的 `sj/npcink-device-inventory.zip`。它会依次执行：

- `npm run check:hardware-audit`，验证硬件盘点规则 fixture。
- `npm run lint`，验证后台 React/TypeScript 代码。
- `npm run build`，生成后台生产资源。
- `node scripts/check-wordpress-org-review-rules.mjs`，检查 WordPress.org 人工审核曾指出但 PCP 不一定拦截的问题。
- `npm run check:backup-restore`，验证 JSON 备份恢复离线夹具。
- `composer run phpstan`，验证 PHP 静态类型。
- `composer run phpcs`，验证 WordPress/PHP 编码规范。
- `git diff --check`，检查空白字符问题。
- `node scripts/check-release-package.mjs release/npcink-device-inventory.zip`。
- `node scripts/check-wordpress-org-review-rules.mjs release/npcink-device-inventory.zip`。
- 对比 zip 内的 `vite-admin/dist/index.html`、`index.css`、`index.js` 与本地刚构建的文件，避免源码已改但发布包仍是旧资源。

如果 zip 不存在，先运行：

```bash
npm run build:release
```

再重新执行 `npm run check:release`。

如果本次要提交 WordPress.org，再显式运行：

```bash
npm run build:submission
npm run check:submission
```

submission 检查会同时验证 `release/npcink-device-inventory.zip` 和 `sj/npcink-device-inventory.zip`，并对比两个 zip 的 SHA-256，确认提交包和 release 包一致。

## Eval Lab 对抗式质量门

发布前可以运行本地只读 eval-lab 质量门：

```bash
composer eval:project:quality-gate
```

该命令通过 `scripts/eval-lab.sh` 调用相邻的 `npcink-eval-lab` checkout，或使用 `NPCINK_EVAL_LAB_PATH` 指向其它位置。它只生成本地评估报告，不写 WordPress，不进入插件发布包，不替代 `npm run check:release`、GitHub Actions 或真实机器 smoke。

## WordPress.org 人工审核规则

2026-06-26 的插件审核反馈说明：PCP / Plugin Check 通过不代表人工审核规则全部覆盖。发布前必须额外确认：

- 不得在源码或构建产物中硬编码 `/wp-admin/admin-ajax.php` 或 `/api/wp-admin/admin-ajax.php`。如果确实需要 Ajax endpoint，必须在 PHP 中使用 `admin_url('admin-ajax.php')` 计算地址，再通过 `wp_localize_script()` 或等价方式传给 JS。
- `wp_localize_script()` 暴露到 `window` 的对象名必须使用插件唯一前缀。当前约定是 `npcinkDeviceInventoryData`，不得使用 `dataLocal` 这类泛名。
- 不要从旧调试文档或历史构建产物中恢复 `dataLocal`、静态 `admin-ajax.php` 路径、`vite-search` 旧发布说明。

这些规则已经固化在：

```bash
node scripts/check-wordpress-org-review-rules.mjs
node scripts/check-wordpress-org-review-rules.mjs release/npcink-device-inventory.zip
```

如果这个检查失败，先修源码并重新 `npm run build:release`，不要只手改 `dist` 或 zip。WordPress.org submission 发布前由 `npm run check:submission` 额外检查 `sj/npcink-device-inventory.zip`。

## 桌面更新清单检查

tag release workflow 会在生成 `latest.json` 和 `latest-desktop.json` 后执行：

```bash
npm run check:desktop-manifests -- artifacts
```

该检查会确认：

- `ele-rs/package.json` 和 `ele-rs/src-tauri/tauri.conf.json` 的桌面端版本一致。
- `latest.json` 和 `latest-desktop.json` 的版本号与桌面端版本一致。
- `latest.json` 同时包含 `darwin-aarch64` 和 `windows-x86_64` 平台。
- updater 平台条目都有签名。
- 下载地址和 release 地址都是 GitHub Release URL。
- URL 中不得出现空格或 `%20`，避免 GitHub Release 资产名空格变点号后下载失败。

正式桌面更新发布前，还要人工确认本机安装的是上一版正式 Release 包，而不是本地开发构建包；不要复用相同桌面版本号发布不同内容。

在真实 GUI 更新 smoke 前，可以先用上一版 app bundle 和本次 release 资产做升级路径预检：

```bash
npm run check:desktop-update-transition -- --previous-app="/path/to/Npcink Device Agent.app" --artifacts="/path/to/downloaded/release-assets"
```

该检查确认上一版 app 的 `CFBundleShortVersionString` 小于本次 `latest.json` / `latest-desktop.json` 版本，并确认 macOS Tauri updater 包、签名和 DMG 下载地址都指向 GitHub Release。它不能替代真实 app 内“检查更新 / 下载安装并重启”的 GUI smoke。

## 本地后台冒烟

在本地 WordPress 后台打开：

```text
http://npcink-device-manage.local/wp-admin/plugins.php?page=npcink_device_inventory_settings
```

至少确认：

- 页面能进入 `电脑设备`，资产卡片正常显示。
- 资产详情弹窗能打开，并显示 `硬件信息`、`详细信息`、`自动记录`、`手动记录`、`设置`。
- 搜索资产编号能过滤出目标资产。
- `数据工具` 中的标准资产表格导入能下载模板、生成预览并按资产编号新增或更新。
- `卡片` / `列表` 视图能切换。
- `批量模式` 能进入和退出。
- `硬件盘点` 页面能显示摘要、硬件概览和问题面板。
- 浏览器控制台没有新的 error。

## REST 权限检查

未登录状态下确认：

```text
GET  /wp-json/npcink-device-inventory/v1/assets                 -> 403
GET  /wp-json/npcink-device-inventory/v1/settings               -> 403
POST /wp-json/npcink-device-inventory/v1/device-observations    -> 401
```

## 干净安装检查

当前开发站点通常是源码软链接挂载。正式提交前仍应额外准备一个干净 WordPress，上传 `release/npcink-device-inventory.zip`，确认：

- 插件可启用，无 fatal error。
- 后台菜单出现。
- 首次进入后台页面无 JS 错误。
- REST 路由注册成功。
- 插件停用再启用后数据表和设置仍正常。

## 桌面上传器冒烟

发布桌面包前至少确认：

- GitHub Actions preview 能分别构建 `macos` 和 `windows` 桌面包。
- macOS 安装包仍标注为内部测试；正式外部分发前必须补 Apple Developer ID 签名和公证。
- Windows 安装包能在真实 Windows 机器安装、启动、采集并上传。
- 设置页“软件更新”和原生菜单“检查更新”都能触发同一套更新检查。
- 从上一版正式 Release 包升级到新版，版本号、下载地址和安装进度显示正常。

每次 release candidate 使用 `docs/release-candidate-verification-template.md` 记录本地命令、GitHub Actions preview、tagged release artifacts、桌面更新和上传冒烟结果。

## 提交前确认

- 不提交本地旧数据备份目录。
- 不提交临时截图。
- 不提交 `node_modules`、`vendor`、`.release-build` 或额外 zip。
- 日常 GitHub release 使用 `release/npcink-device-inventory.zip`。
- 上传 WordPress.org 前先运行 `npm run build:submission && npm run check:submission`，再使用 `sj/npcink-device-inventory.zip`。
