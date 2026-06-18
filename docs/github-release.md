# GitHub release packaging

This repository builds three release artifacts through GitHub Actions:

- `magick-device-manage-plugin.zip`: installable WordPress plugin package.
- `Magick Device Agent_*.dmg`: macOS hardware information uploader.
- `Magick Device Agent_*_x64-setup.exe`: Windows hardware information uploader.

## Manual build

Open GitHub Actions and run `Build release packages` with `workflow_dispatch`.
The artifacts are attached to the workflow run.

## Tagged release

Create and push a version tag:

```bash
git tag v0.1.0
git push github v0.1.0
```

The workflow uploads the same artifacts to a GitHub Release automatically.

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
