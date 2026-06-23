# WordPress.org 提交表单文案

## Upload File

Use:

```text
/Users/muze/gitee/npcink-device-inventory/sj/npcink-device-inventory.zip
```

## Plugin Name

```text
Npcink Device Inventory
```

## Suggested Slug

```text
npcink-device-inventory
```

## Short Description

```text
Manage device assets in WordPress with an admin inventory, signed client uploads, change records, import/export, and an authorized public search page.
```

## Brief Overview for Submission

```text
Npcink Device Inventory is a WordPress plugin for managing device and hardware asset records inside WordPress. It provides an admin inventory for computers and custom assets, device numbers, departments, status fields, purchase and depreciation values, manual and automatic change records, import/export tools, a signed REST upload endpoint for an optional collection client, and an authorized public search page.

The plugin stores data in the site's own WordPress database and does not contact a third-party service during normal operation. Public query and upload endpoints require a client authorization token and HMAC signature. Admin endpoints require a WordPress user with manage_options.

The package includes built React assets and the corresponding React/TypeScript source and build configuration under vite-admin and vite-search. The package does not include node_modules, sourcemaps, external CDN assets, or bundled trademark/payment/platform image assets.
```

## Optional Reviewer Note

```text
Notes for review:

- Plugin Check was run locally with 0 errors and 0 warnings.
- The plugin uses custom database tables because it manages device inventory, import/export, change history, and signed client upload data. SQL uses plugin-owned table names, allow-listed columns/order fragments, and prepared values where user input is involved.
- Built JavaScript is included together with the corresponding React/TypeScript source and Vite build configuration in the plugin package.
- No JavaScript or CSS is loaded from third-party CDNs during normal plugin operation.
- The public search and upload REST endpoints require client token + HMAC authorization. Admin endpoints require manage_options.
```

## Tags from README

```text
inventory, assets, device management, rest api, admin
```

## Version and Compatibility

```text
Version: 2.6.1083
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
License: GPLv2 or later
```
