# WordPress.org 上传前检查清单

> 当前版本以根目录 `npcink-device-inventory.php` 和 `README.txt` 为准。正式上传前重新运行 `npm run build:submission && npm run check:submission`，不要复用历史 zip 或旧 manifest。

## 必须项

- [x] 上传包是 zip 文件。
- [x] 上传包文件名为 `npcink-device-inventory.zip`。
- [x] zip 根目录为 `npcink-device-inventory/`。
- [x] 主插件文件位于根目录：`npcink-device-inventory/npcink-device-inventory.php`。
- [x] `README.txt` 存在且非空。
- [x] `README.txt` Stable tag 与主插件版本一致。
- [x] License 为 GPLv2 or later。
- [x] 包内包含前端构建产物。
- [x] 包内包含对应前端源码和构建配置。
- [x] 包内不包含 `node_modules`。
- [x] 包内不包含 `.map` sourcemap。
- [x] 包内不包含 `.env`。
- [x] 包内不包含 `.DS_Store`。
- [x] 包内不包含旧平台、支付、OS 图片素材。
- [x] 包内不包含旧版本号 `2601083`。
- [ ] 3.0.1 候选包在 GitHub `wordpress/plugin-check-action` 中通过；本地总门不伪造该结果。
- [x] `README.txt` 暂不声明 Screenshots，避免 WordPress.org 使用重构前旧图。
- [x] `sj/assets/` manifest 只把 banner 和 icon 标为可发布，旧截图标为 `stale_do_not_publish`。
- [ ] 3.0 管理界面冻结后重新采集截图，再恢复 `README.txt` Screenshots 区段。
- [x] `languages/npcink-device-inventory.pot` 已更新。
- [x] 提交资料包含新用户快速开始文档。
- [x] 提交资料包含桌面上传软件单独发布说明。

## 审核注意点

- 插件使用自定义数据库表，因为它是设备资产台账系统，需要分页、筛选、导入导出、变更记录和设备上报数据存储。
- 自定义表 SQL 已用插件内部表名、字段白名单、`$wpdb->prepare()` 和 scoped PHPCS 注释处理。
- 插件正常运行不调用第三方服务。
- 设备上传 endpoint 需要 client token + HMAC 签名。
- 管理端 REST endpoint 需要 WordPress 用户具备 `manage_options`。
- 前端 React/TypeScript 源码随包提供，不依赖不可访问的外部仓库说明源码。

## 提交后

- WordPress.org 审核通过后，会分配 SVN 仓库。
- 首次正式上线时，需要把插件文件提交到 SVN `trunk/`，并按当前插件版本创建对应的 `tags/<version>/`。
- SVN 仓库不要提交 zip 文件；上传的是单个文件和目录。
