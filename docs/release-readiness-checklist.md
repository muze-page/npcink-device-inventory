# 发布前检查清单

## 目标

这份清单用于每次发布 `Npcink Device Inventory` 前做最后验收。它覆盖代码静态检查、前端构建、发布包结构、包哈希和本地后台冒烟测试。

## 自动检查

在仓库根目录运行：

```bash
npm run check:release
```

该命令会依次执行：

- `npm run check:hardware-audit`，验证硬件盘点规则 fixture。
- `npm run lint`，验证后台 React/TypeScript 代码。
- `npm run build`，生成后台生产资源。
- `composer run phpstan`，验证 PHP 静态类型。
- `composer run phpcs`，验证 WordPress/PHP 编码规范。
- `git diff --check`，检查空白字符问题。
- `node scripts/check-release-package.mjs release/npcink-device-inventory.zip`。
- `node scripts/check-release-package.mjs sj/npcink-device-inventory.zip`。
- 对比 zip 内的 `vite-admin/dist/index.html`、`index.css`、`index.js` 与本地刚构建的文件，避免源码已改但发布包仍是旧资源。
- 对比 `release/` 和 `sj/` 两个 zip 的 SHA-256，确认提交包和备份包一致。

如果 zip 不存在，先运行：

```bash
npm run build:release
```

再把生成的 `release/npcink-device-inventory.zip` 同步到 `sj/npcink-device-inventory.zip` 后重新执行检查。

## 本地后台冒烟

在本地 WordPress 后台打开：

```text
http://npcink-device-manage.local/wp-admin/plugins.php?page=npcink_device_inventory_settings
```

至少确认：

- 页面能进入 `电脑设备`，资产卡片正常显示。
- 资产详情弹窗能打开，并显示 `硬件信息`、`详细信息`、`自动记录`、`手动记录`、`设置`。
- 搜索资产编号能过滤出目标资产。
- `更多操作` 中的 `导入旧数据` 能打开预览弹窗。
- `卡片` / `列表` 视图能切换。
- `批量模式` 能进入和退出。
- `硬件盘点` 页面能显示摘要、硬件概览和问题面板。
- 浏览器控制台没有新的 error。

## REST 权限检查

未登录状态下确认：

```text
GET  /wp-json/npcink/v1/assets                 -> 403
GET  /wp-json/npcink/v1/settings               -> 403
POST /wp-json/npcink/v1/device-observations    -> 401
```

## 干净安装检查

当前开发站点通常是源码软链接挂载。正式提交前仍应额外准备一个干净 WordPress，上传 `release/npcink-device-inventory.zip`，确认：

- 插件可启用，无 fatal error。
- 后台菜单出现。
- 首次进入后台页面无 JS 错误。
- REST 路由注册成功。
- 插件停用再启用后数据表和设置仍正常。

## 提交前确认

- 不提交本地旧数据备份目录。
- 不提交临时截图。
- 不提交 `node_modules`、`vendor`、`.release-build` 或额外 zip。
- 上传 WordPress.org 时使用 `release/npcink-device-inventory.zip`。
