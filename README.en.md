# Npcink Device Inventory

Npcink Device Inventory is a WordPress plugin for small-team device asset management. It tracks PC assets, custom devices, manual and automatic change records, departments, statuses, public lookup pages, and an admin dashboard.

## Project Layout

- `npcink-device-inventory.php`: WordPress plugin bootstrap.
- `admin/`: admin menu, REST API, table access, import/export, and settings.
- `includes/`: plugin loader, activation/deactivation, schema creation, and migrations.
- `vite-admin/`: React admin app loaded by the WordPress admin page.
- `vite-search/`: public lookup page app.
- `ele-rs/`: Rust/Tauri hardware collector and uploader.

New uploader work should use `ele-rs/`.

## Data Tables

The plugin creates these tables with the active WordPress database prefix:

- `npcink_device_pc`: PC asset records.
- `npcink_device_style`: custom device asset records.
- `npcink_device_manual`: manual change records.
- `npcink_device_auto`: automatic change records.

Plugin settings are stored in `device_manaje_option`. During uninstall, the plugin deletes its tables and option only when the stored setting allows database deletion.

## API And Auth

The REST namespace is `npcink/v1`.

- Admin endpoints live under `/wp-json/npcink/v1/admin/*` and require `manage_options` plus a valid WordPress REST nonce.
- Device upload uses `/wp-json/npcink/v1/device-post-data-v2` and requires an authorization code generated in the admin UI. The client signs requests with timestamp, nonce, body hash, and HMAC.
- Public lookup uses `/wp-json/npcink/v1/query` and requires an admin-generated authorization code with HMAC lookup signatures.
- In development, `wp_ajax_npcink_device_inventory_get_rest_nonce` can provide a REST nonce for Vite dev proxy usage.

## Local Verification

PHP and plugin checks:

```bash
composer install
composer run phpstan
composer run phpcs
```

Admin app:

```bash
cd vite-admin
npm ci
npm run build
```

Public search app:

```bash
cd vite-search
npm ci
npm run build
```

Rust/Tauri uploader:

```bash
cd ele-rs
npm ci
cargo test
npm run build
```

Local HMAC end-to-end verification requires a WordPress site with this plugin installed and active:

```bash
WP_PATH="/path/to/wordpress" \
SITE_URL="https://example.local" \
DEVICE_NOTE="verification-device" \
bash .github/scripts/verify-local-e2e.sh
```

## Release Packaging

Build the WordPress plugin zip:

```bash
cd /path/to/npcink-device-inventory
npm ci --prefix vite-admin
npm run build --prefix vite-admin
npm ci --prefix vite-search
npm run build --prefix vite-search
bash .github/scripts/package-wordpress-plugin.sh
```

Output:

```text
release/npcink-device-inventory-plugin.zip
```

The plugin zip contains only WordPress runtime files, language files, licenses/readmes, and built `vite-admin/dist` plus `vite-search/dist` assets. It excludes `ele-rs/`, source-only app directories, `node_modules`, Rust `target`, and local release caches.

Use the `Build preview packages` GitHub Actions workflow for preview artifacts. Pushing a `v*` tag triggers the release workflow.
