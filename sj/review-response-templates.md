# WordPress.org 审核回复模板

下面是收到审核追问时可复制修改的英文回复模板。

## 1. 如果审核询问自定义数据库表

```text
Thank you for reviewing the plugin.

The plugin uses custom database tables because it manages structured device
inventory records, signed client uploads, import/export workflows, and manual
and automatic change history. This data is not a good fit for a single option
or post meta storage model because the plugin needs filtering, pagination,
dedicated record UUIDs, and change tracking.

The custom table usage is scoped to plugin-owned tables. Table names are built
from plugin-defined names, dynamic order and column fragments are allow-listed,
and user-supplied values are sanitized and prepared. Activation schema changes
only create or update plugin-owned tables, indexes, and triggers. Optional
uninstall cleanup only drops plugin-owned tables and only when the administrator
enabled the delete-data setting before uninstalling.
```

## 2. 如果审核询问构建后的 JavaScript 源码

```text
The package includes both the built JavaScript assets and the corresponding
React/TypeScript source and build configuration.

Admin app source and build files are included under vite-admin, including
vite-admin/src, vite-admin/package.json, vite-admin/package-lock.json,
vite-admin/vite.config.ts, and vite-admin/tsconfig*.json.

The assets can be rebuilt by running npm ci and npm run build inside the
vite-admin directory.
```

## 3. 如果审核询问第三方服务或隐私

```text
The plugin stores device asset data in the site's own WordPress database. It
does not transmit device inventory data to Npcink or any third-party service
during normal plugin operation.

Depending on site owner usage, stored records may include device names,
assigned users or locations, departments, status values, IP addresses, hardware
identifiers, hardware details, and change history. This is disclosed in the
README privacy section.
```

## 4. 如果审核询问公开 REST endpoint

```text
The public query and upload REST endpoints are not unrestricted endpoints.
Public query requires the site-specific access code and applies a short-window
rate limit. Device upload requires a client token id, timestamp, nonce, and HMAC
signature. Admin endpoints require a logged-in WordPress user with manage_options.
```

## 5. 如果审核询问商标或素材

```text
Bundled platform, payment, and OS image assets were removed before submission.
The UI now uses generic text labels instead of bundled third-party platform or
payment images. The package scan also verifies that those removed image assets
do not reappear in the release package.
```
