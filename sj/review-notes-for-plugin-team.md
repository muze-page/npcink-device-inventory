# Notes for the WordPress.org Plugin Review Team

Plugin: Npcink Device Inventory

Version: 2.7.0

Slug: npcink-device-inventory

## Summary

Npcink Device Inventory is a device asset management plugin. It stores device
inventory data in WordPress, supports signed device upload workflows, provides
admin inventory screens, tracks manual and automatic changes, and exposes an
authorized public search page.

## Data and Privacy

The plugin stores data in the site's own WordPress database. It does not send
device inventory data to Npcink or any third-party service during normal plugin
operation.

Depending on site owner usage, stored records may include device names,
assigned people or locations, departments, status values, IP addresses, hardware
identifiers, hardware details, and change history.

## REST Authorization

The public query and upload endpoints require:

- client token id
- timestamp
- nonce
- HMAC signature

Admin REST endpoints require a logged-in WordPress user with `manage_options`.

## JavaScript Source

The package includes both the built JavaScript files and the corresponding
React/TypeScript source and build configuration:

- `vite-admin/src`
- `vite-admin/package.json`
- `vite-admin/package-lock.json`
- `vite-admin/vite.config.ts`
- `vite-admin/tsconfig*.json`
- `vite-search/src`
- `vite-search/package.json`
- `vite-search/package-lock.json`
- `vite-search/vite.config.ts`
- `vite-search/tsconfig*.json`

The built assets can be reproduced by running:

```bash
npm install
npm run build
```

inside each Vite app directory.

## Custom Database Tables

The plugin uses custom database tables because it manages structured device
inventory records, change history, import/export workflows, and signed client
upload data.

The custom table usage is intentionally scoped:

- table names are plugin-owned;
- schema and trigger routines run during activation or upgrade;
- request filters and order fields are allow-listed;
- user-supplied values are sanitized and prepared;
- uninstall cleanup only touches plugin-owned tables and only when the
  administrator enabled the delete-data setting before uninstalling.

Scoped PHPCS comments are included only for reviewed custom-table cases such as
direct custom table queries, activation schema changes, schema introspection,
and optional uninstall cleanup.

## Assets and Trademarks

The package does not include bundled platform, payment, or OS image assets.
Those were replaced with text labels to reduce licensing and trademark risk.

The plugin does not load JavaScript or CSS from third-party CDNs during normal
operation.

## Local Verification

The following checks were run successfully before packaging:

```bash
npm run build --prefix vite-admin
npm run build --prefix vite-search
composer phpcs
composer phpstan
npm run build:release
cp release/npcink-device-inventory.zip sj/npcink-device-inventory.zip
npm run check:release
wp --path='/Users/muze/Local Sites/npcink-device-inventory/app/public' plugin check /Users/muze/gitee/npcink-device-inventory/release/npcink-device-inventory --format=json
```

Plugin Check result:

- 0 errors
- 0 warnings
