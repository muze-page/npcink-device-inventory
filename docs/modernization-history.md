# Npcink Device Inventory Modernization History

## Status

Current local state after commit `b7e4d63` on 2026-06-20.

This document summarizes the modernization work done for the WordPress plugin
and the new Rust/Tauri hardware uploader. It records the product decisions,
data-model changes, local migration results, and remaining follow-up work.

## Starting Point

The project originally used `/ele` to collect and upload hardware information.
That Electron-era client had already been used for more than a year and had
accumulated more than 100 device records in the WordPress plugin database.

The modernization goal was to rebuild the uploader with Rust/Tauri for Windows
and macOS, while also cleaning up the WordPress plugin data model, upload
security, packaging, and admin experience.

## Main Decisions

1. New uploads use one v2 endpoint only:
   `POST /wp-json/npcink-device-inventory/v1/device-observations`.
2. Legacy compatibility is not a long-term runtime requirement. Old data is
   converted once into the new structure.
3. The stored device JSON is normalized into `_npcink_device`, `asset`, and
   `raw`.
4. Admin list, detail, statistics, and export use `asset` as the canonical data
   source.
5. `name` in the upload request is only an optional upload note. It is kept for
   operator context such as current user, desk, department, or test label.
6. Upload notes do not participate in device identity matching and do not
   overwrite the asset name on update.
7. Repeated uploads from the same physical computer update the existing row
   instead of creating a duplicate row.
8. The old shared upload password path is replaced by client authorization code
   plus HMAC request signing.
9. User-facing product names now use `Npcink Device Inventory` for the WordPress
   plugin and `Npcink Device Agent` for the desktop uploader.

## Naming Migration

The first naming pass updated product-facing names, installer names, GitHub
artifact names, and Rust/Tauri package names.

The second naming pass removed the remaining project-owned historical technical
identifiers:

- WordPress plugin slug and package path: `npcink-device-inventory`.
- Plugin bootstrap file: `npcink-device-inventory.php`.
- Vite asset base path under `/wp-content/plugins/npcink-device-inventory/`.
- HMAC headers: `X-Npcink-Device-*`.
- Stored metadata key: `_npcink_device`.

These names were migrated together because they affect installed plugin paths,
upload signatures, stored JSON, admin readers, and release scripts.

## Device Identity Rule

The stable row key is `stable_device_id_v2`, stored in the database `uuid`
column.

The server derives it from stable hardware identity in this priority order:

1. Hardware UUID.
2. System UUID.
3. System serial number.
4. Baseboard serial number.
5. BIOS serial number.
6. Primary MAC address as fallback.

Known placeholder values are ignored, including all-zero UUIDs, `Default
string`, `To be filled by O.E.M.`, and repeated SMBIOS pseudo UUIDs such as
`03000200-0400-0500-0006-000700080009`.

This rule exists because CPU, memory, disk, and some network details may change
over a device lifetime. They should update the hardware snapshot, not create a
new asset. At the same time, false hardware UUIDs from some Windows machines
must not merge unrelated computers.

## Rust/Tauri Uploader

The new uploader lives in `ele-rs/`.

Implemented capabilities:

- Rust hardware collection for Windows/macOS direction.
- CLI commands:
  - `inspect --pretty`
  - `stable-id`
  - `submit --site URL --token TOKEN [--note NOTE]`
- Tauri desktop shell with simplified settings, overview, and details views.
- Optional upload note instead of required user name.
- HMAC-signed v2 upload using a backend-generated authorization code.

The CLI still accepts `--name` as a compatibility alias, but documentation and
scripts use `--note`.

## WordPress Plugin Changes

Implemented backend changes:

- v2 upload endpoint stores normalized `_npcink_device`, `asset`, and `raw`.
- v2 upload updates an existing device by `stable_device_id_v2`.
- Existing asset name is preserved on update; upload notes are stored under
  `asset.upload`.
- Client authorization tokens can be generated, listed, used, and revoked.
- HMAC verification checks token id, timestamp, nonce, body hash, and signature.
- Nonce replay is rejected.
- Old route/password upload path is no longer the main path.
- Migration precheck and apply endpoints convert old rows into the v2 structure.
- Migration can collapse identical stable-ID history rows into one device.
- `.DS_Store` is ignored and removed from Git tracking.

Implemented admin/frontend changes:

- Config page supports multiple upload authorization codes.
- Device list/detail reads the normalized `asset` structure.
- Hardware fields are rendered as readable tables/lists instead of raw JSON.
- Disk reporting excludes mounted app DMG volumes and avoids counting macOS
  APFS system/data volumes as separate physical disks.
- Upload software UI was simplified from a technical JSON preview into a
  lighter operator-facing interface.
- `vite-admin` and `vite-search` keep separate entry points, but their lint and
  build hygiene has been aligned.
- Vite plugin asset base paths now use an absolute plugin URL base.
- Frontend vendor chunks are split to avoid large production bundle warnings.
- Browserslist data has been refreshed.

Implemented quality gates:

- Composer dev tooling was added for PHPStan, PHPCS, WPCS, and
  PHPCompatibilityWP.
- The initial PHPCS gate focuses on WordPress security checks and PHP
  compatibility instead of broad legacy formatting churn.
- PHPStan runs against the plugin PHP surface at level 0 with WordPress
  extensions enabled.

## Local Data Migration Result

Before the final identity re-key, a JSON backup was written to:

```text
/Users/muze/gitee/npcink-device-inventory/.local-backups/pre-identity-rekey-20260620-064542.json
```

Local WordPress migration result:

- Scanned rows before migration: 163.
- Updated rows: 158.
- Historical duplicate rows merged: 5.
- Failed rows: 0.
- Rows after migration: 158.
- Rows with v2 `asset` structure: 158.
- Duplicate stable IDs after migration: 0.
- Migration precheck after migration:
  - `already_migrated`: 158.
  - `ready`: 0.
  - `needs_review`: 0.
  - `blocked`: 0.

The 5 merged rows were historical duplicate imports for the same stable device
identity, including local test records and several numbered re-import rows.

## Packaging And Release

GitHub Actions were prepared to build:

- WordPress plugin zip.
- macOS DMG for Npcink Device Agent.
- Windows installer for Npcink Device Agent.

Preview packaging is intended for UI and installer checks before tagged
releases. The GitHub Actions Node version was moved to Node 24 to avoid Node 20
deprecation warnings.

The first macOS/Windows packages can be used internally unsigned, but external
distribution should add code signing and macOS notarization.

## Local Preview Setup

The plugin was symlinked into the Local WP plugin directory for preview:

```text
/Users/muze/Local Sites/npcink-device-inventory/app/public/wp-content/plugins
```

The upload software can be previewed locally through the Tauri dev command in
`ele-rs/`.

## Verification Performed

The following checks passed during the modernization pass:

- PHP syntax checks for plugin PHP files.
- `composer validate --strict`.
- `composer run phpstan`.
- `composer run phpcs`.
- `cargo check` for `ele-rs`.
- `cargo test` for `ele-rs`.
- `cargo clippy -- -D warnings` for `ele-rs`.
- `npm run build` for `ele-rs`.
- `npm run lint` for `vite-admin`.
- `npm run build` for `vite-admin`.
- `npm run lint` for `vite-search`.
- `npm run build` for `vite-search`.
- `npm audit --omit=dev --audit-level=moderate` for `vite-admin` and
  `vite-search`.
- `.github/scripts/verify-local-e2e.sh`.
- `.github/scripts/package-wordpress-plugin.sh`.
- Local WordPress migration precheck after migration.
- `git diff --check`.

## Current Git State

Committed modernization work:

```text
b7e4d63 feat: modernize device upload identity
```

After that commit, the untracked legacy `ele/` directory was removed from the
workspace. Future uploader work uses `ele-rs/`.

The tracked `.DS_Store` files were removed from Git and `.gitignore` now ignores
future `.DS_Store` files.

## Open Follow-Ups

Recommended next work:

1. Add more real Windows and macOS samples to validate collector fields across
   hardware vendors.
2. Improve Windows serial/baseboard collection quality where system UUID is a
   known placeholder.
3. Add release signing:
   - Apple Developer ID signing and notarization for macOS.
   - Code signing certificate for Windows installer.
4. Add a small admin-facing audit view for recent uploads, showing upload note,
   token used, matched device, and update time.
5. Finalize installer icons and run preview packages from GitHub Actions before
   tagging a release.

## Related Documents

- `docs/device-data-v2-contract.md`
- `docs/ele-rust-phase1.md`
- `docs/github-release.md`
