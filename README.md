# Npcink Device Inventory

Npcink Device Inventory 是一个 WordPress 设备资产管理插件，用于小型团队维护设备资产、采集快照、身份匹配和事件时间线。

## 组成

- `npcink-device-inventory.php`：WordPress 插件入口。
- `admin/`：后台菜单、REST API、数据表读写、导入导出和设置。
- `includes/`：插件加载器、激活/停用、数据库建表和增量迁移。
- `vite-admin/`：后台 React 管理端，构建产物由插件后台加载。
- `ele-rs/`：Rust/Tauri 设备采集与上传客户端。

设备上传客户端以 `ele-rs/` 为准。

## 数据模型

v3 使用统一资产模型，详细契约见 `docs/asset-data-model.md`。插件运行时使用 WordPress 数据库前缀加以下表名：

- `npcink_assets`：资产主表。
- `npcink_asset_identities`：资产身份与匹配信号。
- `npcink_asset_observations`：客户端采集、导入或人工录入的资产快照。
- `npcink_asset_events`：统一事件和审计时间线。

主要 REST 入口：

- `POST /wp-json/npcink-device-inventory/v1/device-observations`：软件端上传采集事实。
- `GET|POST /wp-json/npcink-device-inventory/v1/assets`：管理资产列表与新增资产。
- `GET|PATCH|DELETE /wp-json/npcink-device-inventory/v1/assets/{uuid}`：资产详情、更新、软删除。
- `GET|POST /wp-json/npcink-device-inventory/v1/assets/{uuid}/identities`：资产身份。
- `GET /wp-json/npcink-device-inventory/v1/assets/{uuid}/observations`：资产采集快照。
- `GET|POST /wp-json/npcink-device-inventory/v1/assets/{uuid}/events`：资产事件时间线。
- `GET|PATCH /wp-json/npcink-device-inventory/v1/settings`：插件设置。
- `POST /wp-json/npcink-device-inventory/v1/client-tokens`：创建软件端授权码。
- `PATCH|DELETE /wp-json/npcink-device-inventory/v1/client-tokens/{id}`：启停或删除软件端授权码。
- `GET /wp-json/npcink-device-inventory/v1/client-tokens/{id}/package-config`：复制客户端预设打包配置。

插件设置保存在 `npcink_device_inventory_v3_options`。卸载时仅当设置中允许删除数据时，才会删除插件表和设置项。

## 认证与接口

REST namespace 为 `npcink-device-inventory/v1`。

- 管理端接口需要当前用户具备 `manage_options` 权限，并通过 WordPress REST nonce。
- 设备上传使用 `/wp-json/npcink-device-inventory/v1/device-observations`，必须使用后台生成的完整授权码。客户端会用 timestamp、nonce、body hash 和 HMAC 签名提交。
- 软件端可填写站点首页、`/wp-json`、`/wp-json/npcink-device-inventory/v1` 或完整上传 endpoint，客户端会自动归一化到 v3 上传接口。

## 本地验证

PHP 与 WordPress 插件检查：

```bash
composer install
composer run phpstan
composer run phpcs
```

后台管理端：

```bash
cd vite-admin
npm ci
npm run build
```

Rust/Tauri 上传器：

```bash
cd ele-rs
npm ci
cargo test
npm run build
```

本地端到端 HMAC 验收需要已安装并启用插件的 WordPress 站点：

```bash
WP_PATH="/path/to/wordpress" \
SITE_URL="https://example.local" \
DEVICE_NOTE="验收设备" \
bash .github/scripts/verify-local-e2e.sh
```

## 发布打包

生成 WordPress 插件 zip：

```bash
cd /path/to/npcink-device-inventory
npm ci --prefix vite-admin
npm run build --prefix vite-admin
bash .github/scripts/package-wordpress-plugin.sh
```

输出文件：

```text
release/npcink-device-inventory-plugin.zip
```

插件包只包含 WordPress 运行文件、语言文件、许可证/README 和 `vite-admin/dist` 构建产物；不会包含 `ele-rs/`、`node_modules`、Rust `target` 或本地发布缓存。

GitHub Actions 的 `Build preview packages` 可生成预览包；推送 `v*` tag 会触发正式 release workflow。
