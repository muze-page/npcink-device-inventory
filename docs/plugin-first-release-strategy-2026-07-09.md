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

## Current Workflow State

As of v2.7.9, `.github/workflows/release.yml` still builds all release artifacts
for every `v*` tag:

- WordPress plugin zip;
- macOS DMG and signed updater package;
- Windows installer and signature;
- `latest.json` and `latest-desktop.json`.

That means a plugin-only tag currently still republishes desktop artifacts even
when `ele-rs/package.json` remains on the same desktop version. In v2.7.9 this
was harmless because the desktop version stayed `0.1.5`, but it was unnecessary
work for a plugin-only release.

The preview workflow already has a better shape for this distinction because it
can build only `plugin`, only desktop targets, or `all`.

## Desired Workflow Shape

Future workflow work should make tagged releases explicitly support a
plugin-only path.

The preferred behavior:

- default tagged releases to the WordPress plugin package;
- build desktop artifacts only when requested or when desktop paths changed;
- keep existing desktop release assets visible as the active desktop download
when a plugin-only release is published;
- avoid changing `latest.json` and `latest-desktop.json` unless the desktop app
or updater artifacts actually change.

One practical implementation path:

1. Add a release mode input for manual release workflows, or split plugin and
   desktop release workflows.
2. Add path-based detection for `ele-rs/`, desktop manifest scripts, updater
   signing config, and workflow files.
3. Let the GitHub Release job attach new plugin artifacts while preserving or
   referencing the latest desktop artifacts when the release is plugin-only.
4. Keep a separate desktop release checklist for releases that intentionally
   change `ele-rs/package.json` or updater behavior.

This change should be implemented carefully because the current release job
builds desktop update manifests from the artifacts it downloads. A plugin-only
release must not generate desktop manifests that point to missing desktop
artifacts.

## Release Checklist Adjustment

For plugin-only releases, use this local baseline:

```bash
npm run build:release
npm run check:release
composer eval:project:quality-gate
```

Run desktop checks only when desktop triggers apply:

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
