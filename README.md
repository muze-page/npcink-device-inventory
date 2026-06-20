# Npcink Device Manage

Npcink Device Manage 是一个 WordPress 设备资产管理插件，用于小型团队维护电脑与自定义设备资产、变更记录、部门状态、公开查询页和后台数据面板。

## 组成

- `npcink-device-manage.php`：WordPress 插件入口。
- `admin/`：后台菜单、REST API、数据表读写、导入导出和设置。
- `includes/`：插件加载器、激活/停用、数据库建表和增量迁移。
- `vite-admin/`：后台 React 管理端，构建产物由插件后台加载。
- `vite-search/`：公开查询页前端，构建产物由插件页面加载。
- `ele-rs/`：Rust/Tauri 设备采集与上传客户端。

旧 Electron/Vue 上传器已移除，后续设备上传客户端以 `ele-rs/` 为准。

## 数据表

插件使用 WordPress 数据库前缀加以下表名：

- `npcink_device_pc`：电脑设备资产记录。
- `npcink_device_style`：自定义设备资产记录。
- `npcink_device_manual`：手动变更记录。
- `npcink_device_auto`：自动变更记录。

插件设置保存在 `device_manaje_option`。卸载时仅当设置中允许删除数据时，才会删除上述插件表和设置项。

## 认证与接口

REST namespace 为 `npcink/v1`。

- 管理端接口位于 `/wp-json/npcink/v1/admin/*`，需要当前用户具备 `manage_options` 权限，并通过 WordPress REST nonce。
- 设备上传使用 `/wp-json/npcink/v1/device-post-data-v2`，必须使用后台生成的授权码。客户端会用 timestamp、nonce、body hash 和 HMAC 签名提交。
- 公开查询使用 `/wp-json/npcink/v1/query`，推荐使用后台授权码生成 HMAC 查询签名；旧查询密码仍可通过 `x-npcink-password` 请求头兼容，不应放在 URL query 参数中。
- 开发模式下，后台可通过 `wp_ajax_npcink_device_manage_get_rest_nonce` 为 Vite dev proxy 获取 REST nonce。

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

公开查询页：

```bash
cd vite-search
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
cd /path/to/npcink-device-manage
npm ci --prefix vite-admin
npm run build --prefix vite-admin
npm ci --prefix vite-search
npm run build --prefix vite-search
bash .github/scripts/package-wordpress-plugin.sh
```

输出文件：

```text
release/npcink-device-manage-plugin.zip
```

插件包只包含 WordPress 运行文件、语言文件、许可证/README 和 `vite-admin/dist`、`vite-search/dist` 构建产物；不会包含 `ele-rs/`、源码目录、`node_modules`、Rust `target` 或本地发布缓存。

GitHub Actions 的 `Build preview packages` 可生成预览包；推送 `v*` tag 会触发正式 release workflow。
