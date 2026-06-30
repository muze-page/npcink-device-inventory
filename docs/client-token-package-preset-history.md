# Client Token Package Preset History

## Date
2026-06-30

## Scope
This document summarizes the troubleshooting and implementation history for the client-token package preset flow in the WordPress admin and the Tauri desktop uploader.

The work covered:

- WordPress REST routes for client-token management.
- Admin UI copy and layout for upload endpoints and full client tokens.
- Desktop agent preset packaging through `agent-preset.local.json`.
- Release package freshness and local artifact hygiene.

## Initial Symptoms

The admin UI showed this REST error when copying package configuration:

```text
未找到匹配 URL 和请求方式的路由。
```

The visible token ID in the modal was:

```text
devtest000001
```

The backend route accepted only 12 lowercase alphanumeric characters:

```php
/client-tokens/(?P<id>[a-z0-9]{12})/package-config
```

`devtest000001` is 13 characters, so WordPress failed route matching before entering the callback. The conclusion was that this was not a copy-modal problem; it was an ID contract mismatch. The selected resolution was to use newly created 12-character tokens and not add compatibility for old 13-character local test tokens, because no such tokens needed to be preserved.

## Admin UI Findings

The token modal had two related UI problems.

First, long URLs and full token values were rendered in Ant Design `Typography.Text` inline code blocks inside an Alert. They collapsed into a narrow vertical column. The fix was to:

- give the snippet rows explicit classes,
- make the code blocks full-width,
- account for Ant Design `Space` wrapping children in `.ant-space-item`,
- keep the copy icon from shrinking the text column.

Second, the modal displayed the upload endpoint twice:

- once in the stable "客户端上传地址" panel,
- again inside the warning Alert shown after token creation.

This duplicated the same concept and made the two areas look semantically different. The selected UI contract is now:

- the top blue panel owns the stable upload endpoint,
- the warning Alert owns the full upload credential and command-line smoke-test snippet.

The warning message was also changed from "完整授权码只显示一次" to "完整授权码包含上传权限" because the new package-config endpoint can return the full token again for administrators.

## Cache Finding

The admin page enqueued fixed filenames:

```text
vite-admin/dist/index.css
vite-admin/dist/index.js
```

The original enqueue version was the plugin version, so browser caches could keep stale CSS after local rebuilds. The enqueue logic now versions the app assets with `filemtime()` for the built CSS and JS files.

## Package Config Flow

The backend now exposes:

```text
GET /wp-json/npcink/v1/client-tokens/{id}/package-config
PATCH /wp-json/npcink/v1/client-tokens/{id}
```

The package-config response contains:

- `siteUrl`
- `uploadEndpoint`
- `tokenId`
- `tokenSecret`
- `tokenValue`
- `tokenName`
- `targets`
- `generatedAt`

This endpoint intentionally returns credential material to administrators with `manage_options`. Operation audit logging was considered but explicitly deferred to avoid adding complexity in this phase.

The admin table also gained:

- token enable/disable control,
- "复制打包配置" action,
- clearer delete confirmation copy.

## Desktop Agent Preset Flow

The desktop uploader now supports preset packaging:

```bash
cp src-tauri/agent-preset.example.json src-tauri/agent-preset.local.json
npm run tauri:build
```

`agent-preset.local.json` is ignored by git and embedded at build time through `NPCINK_AGENT_PRESET`. When a preset is present, the app:

- uses the preset upload endpoint,
- uses `tokenValue` when present,
- falls back to `mda_<tokenId>_<tokenSecret>` when needed,
- hides site/token inputs,
- leaves only the upload remark editable.

The preset example was corrected to use a 12-character token ID so it matches the REST route contract.

## Validation Added

Preset packaging now fails fast during Tauri build if `agent-preset.local.json` is malformed or incomplete.

The build script validates:

- valid JSON,
- `uploadEndpoint` or `siteUrl`,
- `tokenValue`, or both `tokenId` and `tokenSecret`.

Rust unit tests cover:

- preferring `uploadEndpoint` and full `tokenValue`,
- falling back to `siteUrl` plus `tokenId/tokenSecret`.

No PHP unit-test framework was introduced. The project currently relies on PHP syntax checks, PHPStan, PHPCS, release checks, and manual/local WordPress verification for REST behavior.

## Local Artifact Cleanup

The following local-only artifacts were removed and added to `.gitignore`:

```text
设备数据备份/
device-inventory-current.png
```

The zip release artifacts remain ignored:

```text
release/
*.zip
```

After Vite rebuilds, release packages must be regenerated and synchronized before publishing:

```bash
npm run build:release
cp release/npcink-device-inventory.zip sj/npcink-device-inventory.zip
npm run check:release
```

## Verification History

The following checks passed after the implementation:

```bash
php -l admin/partials/npcink-device-inventory-admin-menu.php
php -l includes/v3/rest/class-npcink-device-inventory-settings-controller.php
npm run build --prefix vite-admin
npm run build --prefix ele-rs
cargo test
composer phpstan
composer phpcs
npm run check:release
git diff --check
```

`npm run check:release` verifies:

- hardware audit fixture,
- admin frontend lint,
- admin frontend production build,
- WordPress.org review rules,
- PHPStan,
- PHPCS,
- whitespace,
- release zip structure,
- release zip asset freshness,
- release and submission zip hash equality.

## Decisions

- Do not add operation audit logging for copying package config in this phase.
- Do not support old 13-character local test token IDs.
- Keep `agent-preset.local.json` local-only and ignored.
- Keep release zip files ignored, but regenerate and sync them before publishing.
- Treat the upload endpoint as non-secret; treat full token values as upload credentials.

## Related Commits

```text
2b2e287 Add client token package preset flow
e90bf01 Validate packaged agent presets
```
