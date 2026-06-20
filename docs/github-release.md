# GitHub release packaging

This repository builds three release artifacts through GitHub Actions:

- `npcink-device-manage-plugin.zip`: installable Npcink Device Manage WordPress plugin package.
- `Npcink Device Agent_*.dmg`: macOS hardware information uploader.
- `Npcink Device Agent_*_x64-setup.exe`: Windows hardware information uploader.

## Preview build

Open GitHub Actions and run `Build preview packages`.

Choose one package target:

- `plugin`: WordPress plugin zip only.
- `macos`: macOS DMG only.
- `windows`: Windows installer only.
- `desktop`: macOS and Windows desktop installers.
- `all`: plugin zip plus both desktop installers.

Preview artifacts are attached to the workflow run and expire after 7 days.
Use this workflow while iterating on UI, icons, copy, and packaging checks.

The preview workflow uses Node 24, runs PHP syntax checks for plugin PHP files,
builds both Vite apps with `npm ci`, audits the WordPress plugin zip boundary,
and runs `cargo check` before building the macOS/Windows Tauri installers.

## Local end-to-end verification

Before creating a tag, run the local end-to-end smoke test against a Local WP
site. `WP_PATH` and `SITE_URL` are required so the script does not assume a
machine-specific local site name.

```bash
WP_PATH="/path/to/wordpress" \
SITE_URL="https://example.local" \
DEVICE_NOTE="验收设备" \
bash .github/scripts/verify-local-e2e.sh
```

The script generates a temporary upload authorization code in WordPress, submits
a signed v2 upload through the Rust CLI, verifies that the stored row has
`_npcink_device`, `asset`, and `raw`, then disables the temporary authorization
code.

## Tagged release

Create and push a version tag:

```bash
git tag v0.1.0
git push github v0.1.0
```

The `Build release packages` workflow runs only for `v*` tags and uploads the
artifacts to a GitHub Release automatically. Do not use a tag until the preview
artifacts have been checked.

## Packaging boundaries

The plugin zip intentionally includes only WordPress runtime files and built web
assets:

- `admin/`
- `includes/`
- `languages/`
- `vite-admin/dist/`
- `vite-search/dist/`
- plugin bootstrap/readme/license files

The old Electron client, the new Rust/Tauri source, docs, local caches,
`node_modules`, and Rust `target` directories are not included in the WordPress
plugin zip.

## Distribution notes

The first macOS DMG is unsigned. It is usable for internal testing, but public
distribution should add Apple Developer ID signing and notarization.

The Windows package currently uses Tauri NSIS output. Add code signing before
distributing outside a trusted internal environment.
