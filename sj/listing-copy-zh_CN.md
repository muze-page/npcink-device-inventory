# Npcink Device Inventory 中文文案

## 插件名称

Npcink Device Inventory

## 短描述

在 WordPress 中管理设备资产：后台台账、签名客户端上报、变更记录、导入导出和授权公开查询。

## 长描述

Npcink Device Inventory 是一个设备资产管理插件，适合希望把硬件库存和设备台账保存在 WordPress 内的团队使用。

插件提供：

- 电脑和自定义资产的后台设备台账。
- 设备编号、部门、状态、采购价值和折旧价值字段。
- 手动变更记录和自动变更记录。
- 插件自有数据表的导入和导出工具。
- 受客户端授权码和 HMAC 签名保护的公开查询页面。
- 可选桌面采集客户端使用的签名 REST 上报接口。

插件不会从第三方 CDN 加载 JavaScript 或 CSS。构建后的 React 资源随插件包本地提供，并在 `vite-admin` 下包含对应的 React/TypeScript 源码和构建配置。

## 安装

1. 将 `npcink-device-inventory` 文件夹上传到 `/wp-content/plugins/`。
2. 在 WordPress 插件页面启用插件。
3. 打开 Plugins > Device Inventory。
4. 使用上传或公开查询流程前，请先检查插件设置并生成客户端授权码。

## 常见问题

### 插件会把数据发送到第三方服务吗？

不会。插件把设备资产数据存储在站点自己的 WordPress 数据库中，正常运行时不会联系第三方服务。

### 插件会存储哪些数据？

插件可存储设备名称、编号、部门、状态、IP 地址、可选客户端提交的硬件详情、变更记录和插件设置。

### 公开查询和上传接口是否允许匿名访问？

它们不是无限制开放的。公开查询需要站点专用访问码并受限流保护；设备上传需要客户端授权码和 HMAC 签名。管理端接口需要具备 `manage_options` 权限的 WordPress 用户。

### 卸载时会发生什么？

只有管理员在卸载前启用了删除数据设置，插件才会删除自己的自定义数据表和设置。

### 构建后的 JavaScript 源码在哪里？

插件包包含构建产物和对应的 React/TypeScript 源码。后台应用源码在 `vite-admin/src`，构建配置位于 `vite-admin/package.json` 和 `vite-admin/vite.config.ts`。

## 隐私

Npcink Device Inventory 将设备资产数据存储在本地 WordPress 数据库中。根据站点管理员的配置和使用方式，数据可能包括设备名称、分配用户或位置、部门、状态、IP 地址、硬件标识、硬件详情和变更历史。

插件正常运行时不会把这些数据传输给 Npcink 或任何第三方服务器。站点管理员负责向用户和员工说明自己的设备库存管理政策。
