# GitHub release packaging

This repository builds three release artifacts through GitHub Actions:

- `magick-device-manage-plugin.zip`: installable WordPress plugin package.
- `Magick Device Agent_*.dmg`: macOS hardware information uploader.
- `Magick Device Agent_*_x64-setup.exe`: Windows hardware information uploader.

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
