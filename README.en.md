# Npcink Device Inventory

Npcink Device Inventory is a WordPress plugin for small-team device asset management. It tracks assets, observation snapshots, identity matching signals, and event timelines.

## Project Layout

- `npcink-device-inventory.php`: WordPress plugin bootstrap.
- `admin/`: admin menu, REST API, table access, import/export, and settings.
- `includes/`: plugin loader, activation/deactivation, schema creation, and migrations.
- `vite-admin/`: React admin app loaded by the WordPress admin page.
- `ele-rs/`: Rust/Tauri hardware collector and uploader.

New uploader work should use `ele-rs/`.

## Data Model

v3 uses a unified asset model. See `docs/asset-data-model.md` for the contract. Runtime tables use the active WordPress database prefix:

- `npcink_assets`: canonical asset records.
- `npcink_asset_identities`: asset identity and matching signals.
- `npcink_asset_observations`: client, import, or manual observation snapshots.
- `npcink_asset_events`: unified event and audit timeline.

Plugin settings are stored in `npcink_device_inventory_v3_options`. During uninstall, the plugin deletes its tables and option only when the stored setting allows database deletion.

## API And Auth

The REST namespace is `npcink/v1`.

- Admin endpoints require `manage_options` plus a valid WordPress REST nonce.
- Device upload uses `/wp-json/npcink/v1/device-observations` and requires a full authorization code generated in the admin UI. The client signs requests with timestamp, nonce, body hash, and HMAC.
- The desktop client may receive the site home URL, `/wp-json`, `/wp-json/npcink/v1`, or the full upload endpoint. It normalizes these inputs to the v3 observation endpoint.

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
bash .github/scripts/package-wordpress-plugin.sh
```

Output:

```text
release/npcink-device-inventory-plugin.zip
```

The plugin zip contains only WordPress runtime files, language files, licenses/readmes, and built `vite-admin/dist` assets. It excludes `ele-rs/`, `node_modules`, Rust `target`, and local release caches.

Use the `Build preview packages` GitHub Actions workflow for preview artifacts. Pushing a `v*` tag triggers the release workflow.
