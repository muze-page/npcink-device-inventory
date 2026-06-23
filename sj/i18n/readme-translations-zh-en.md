# Readme Translations - English and Simplified Chinese

Source: `sj/listing-copy.md`

## en_US - English

### Short Description

Manage device assets in WordPress with an admin inventory, signed client uploads, change records, import/export, and an authorized public search page.

### Description

Npcink Device Inventory is a device asset management plugin for teams that want to keep hardware inventory inside WordPress.

The plugin provides:

- Admin device inventory for computers and custom assets.
- Device numbers, departments, status fields, purchase values, and depreciation values.
- Manual and automatic change records.
- Import and export tools for plugin-owned data tables.
- A public search page protected by a client authorization token and HMAC signature.
- A signed REST upload endpoint for an optional desktop collection client.

The WordPress plugin does not load JavaScript or CSS from third-party CDNs. Built React assets are bundled locally in the plugin package, with the corresponding React/TypeScript source and build configuration included under `vite-admin` and `vite-search`.

### FAQ

#### Does this plugin send data to a third-party service?

No. The WordPress plugin stores device asset data in the site's own WordPress database and does not contact a third-party service for normal operation.

#### What data is stored?

The plugin can store device asset fields such as device name, number, department, status, IP address, hardware details submitted by the optional client, change records, and plugin settings.

#### Are public query and upload endpoints open to anonymous users?

No. Public query and upload endpoints require a client authorization token and HMAC signature. Admin endpoints require a WordPress user with `manage_options`.

#### What happens on uninstall?

The plugin only deletes its custom tables and settings when the administrator has enabled the delete-data setting before uninstalling.

#### Where is the source for bundled JavaScript?

The WordPress package includes the built files and the corresponding React/TypeScript source. Admin app source is in `vite-admin/src`; public search app source is in `vite-search/src`.

### Privacy

Npcink Device Inventory stores device asset data in the local WordPress database. Depending on how the site owner configures and uses the plugin, stored data may include device names, assigned users or locations, departments, status values, IP addresses, hardware identifiers, hardware details, and change history.

The plugin does not transmit this data to Npcink or any third-party server during normal plugin operation. Site administrators are responsible for informing users and employees about their own device inventory policies.

## zh_CN - 简体中文

### 短描述

在 WordPress 中管理设备资产：后台台账、签名客户端上报、变更记录、导入导出和授权公开查询。

### 描述

Npcink Device Inventory 是一个设备资产管理插件，适合希望把硬件库存和设备台账保存在 WordPress 内的团队使用。

插件提供：

- 电脑和自定义资产的后台设备台账。
- 设备编号、部门、状态、采购价值和折旧价值字段。
- 手动变更记录和自动变更记录。
- 插件自有数据表的导入和导出工具。
- 受客户端授权码和 HMAC 签名保护的公开查询页面。
- 可选桌面采集客户端使用的签名 REST 上报接口。

插件不会从第三方 CDN 加载 JavaScript 或 CSS。构建后的 React 资源随插件包本地提供，并在 `vite-admin` 和 `vite-search` 下包含对应的 React/TypeScript 源码和构建配置。

### 常见问题

#### 插件会把数据发送到第三方服务吗？

不会。插件把设备资产数据存储在站点自己的 WordPress 数据库中，正常运行时不会联系第三方服务。

#### 插件会存储哪些数据？

插件可存储设备名称、编号、部门、状态、IP 地址、可选客户端提交的硬件详情、变更记录和插件设置。

#### 公开查询和上传接口是否允许匿名访问？

不允许。公开查询和上传接口需要客户端授权码和 HMAC 签名。管理端接口需要具备 `manage_options` 权限的 WordPress 用户。

#### 卸载时会发生什么？

只有管理员在卸载前启用了删除数据设置，插件才会删除自己的自定义数据表和设置。

#### 构建后的 JavaScript 源码在哪里？

插件包包含构建产物和对应的 React/TypeScript 源码。后台应用源码在 `vite-admin/src`，公开查询应用源码在 `vite-search/src`。

### 隐私

Npcink Device Inventory 将设备资产数据存储在本地 WordPress 数据库中。根据站点管理员的配置和使用方式，数据可能包括设备名称、分配用户或位置、部门、状态、IP 地址、硬件标识、硬件详情和变更历史。

插件正常运行时不会把这些数据传输给 Npcink 或任何第三方服务器。站点管理员负责向用户和员工说明自己的设备库存管理政策。
