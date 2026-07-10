# Plugin-first Release Strategy 2026-07-09

## Context

The v2.7.9 release was prepared after v2.7.8 to ship WordPress plugin changes:

- admin analysis UI and department-control polish;
- WordPress.org update-index repair documentation;
- refreshed release and submission materials.

The release was technically successful: local checks passed, `master` was pushed,
`v2.7.9` was tagged, and GitHub Actions created a public GitHub Release with the
WordPress plugin zip, macOS DMG, Windows installer, updater manifests, and
signatures.

The follow-up lesson is that plugin patch releases and desktop uploader releases
are not the same product event. The desktop app is a helper client. If it has no
functional change, rebuilding and republishing desktop artifacts adds time,
review surface, and update noise without improving the plugin release.

## Decision

Use a plugin-first release policy for ordinary WordPress plugin updates.

For plugin-only patch releases:

- bump the WordPress plugin version and `README.txt` stable tag;
- update `README.txt` changelog and upgrade notice;
- rebuild and verify `release/npcink-device-inventory.zip`;
- run the plugin release gates;
- publish the plugin update;
- keep the desktop uploader on the existing official version and artifacts.

Only rebuild desktop artifacts when the release changes desktop behavior or its
update contract.

Desktop rebuild triggers include:

- changes under `ele-rs/`;
- changes to desktop updater manifests, signing, bundle configuration, or
desktop release scripts;
- a required desktop version bump;
- a release goal that explicitly validates desktop upload, install, or updater
behavior;
- dependency/security updates that materially affect the desktop app.

If none of those apply, reuse the latest known-good desktop artifacts.

## Implemented Workflow Shape

The tagged workflow now compares the current `v*` tag with the nearest previous
`v*` tag before building artifacts.

It runs a full desktop release when there is no earlier release tag, or when the
diff includes one of these desktop release paths:

- `ele-rs/`;
- desktop update-manifest build or validation scripts;
- release-scope detection scripts;
- `.github/workflows/release.yml`.

A full desktop release builds the plugin zip, macOS updater package and DMG,
Windows installer and signature, then generates new `latest.json` and
`latest-desktop.json`.

A plugin-only release always builds and validates `npcink-device-inventory.zip`,
but skips both desktop runners. Before creating the GitHub Release it downloads
`latest.json` and `latest-desktop.json` from the previous release tag and uploads
those exact files alongside the new plugin zip. This is required because
`releases/latest` moves to the new plugin release: omitting the two manifests
would break existing desktop clients even though their binaries did not change.

The reused manifests continue to point at the last desktop release and its
signed artifacts. Plugin-only releases therefore do not rebuild, republish, or
retarget desktop binaries.

The first tag after this workflow change intentionally takes the full desktop
path because the release workflow itself changed. This validates the new full
path before later plugin-only tags use the lightweight route.

## Release Checklist Adjustment

For plugin-only releases, use this local baseline:

```bash
npm run build:release
npm run check:release
composer eval:project:quality-gate
```

`npm run check:release` 包含 `check:release-scope`，用于验证插件和桌面
发布范围的路径规则。

Run desktop checks only when the tag diff contains a desktop release path:

```bash
npm --prefix ele-rs run build
cd ele-rs && cargo test
cd ele-rs/src-tauri && cargo check
```

For desktop releases, still verify the updater path with the existing manifest
checks and, when possible, real GUI smoke tests.

## Operating Principle

Keep release scope proportional to the product change.

The WordPress plugin is the primary distribution surface for admin UI, REST,
data model, permissions, backup/restore, and WordPress.org packaging changes.
The desktop app is distributed when the collector, uploader, installer, signing,
or updater changes. Treating every plugin patch as a desktop release makes the
release process heavier than the actual change.
