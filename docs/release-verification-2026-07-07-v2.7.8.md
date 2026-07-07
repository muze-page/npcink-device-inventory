# Release Verification 2026-07-07 v2.7.8

## Candidate

- Date: 2026-07-07
- Planned plugin tag: `v2.7.8`
- WordPress plugin version: `2.7.8`
- Desktop app version: `0.1.5`
- Previous release tag: `v2.7.7`
- Scope: post-v2.7.7 hardening patch release.

## Included Changes

- Public asset query now requires an access code before the feature can be enabled.
- Public asset query adds transient-backed rate limiting for repeated anonymous attempts.
- Asset list search avoids high-cost metadata / observation JSON scans for ordinary short keywords while preserving IP, MAC, and serial-style extended search.
- Backup restore Plugin Check database-query annotations now explicitly cover non-cacheable restore transaction and lookup reads.
- Desktop updater controls no longer duplicate the software update panel in the page body.
- Release readiness now includes public query and asset search regression fixtures.

## Local Checks

Run from repository root:

```bash
npm run build:release
npm run check:release
composer eval:project:quality-gate
npm --prefix ele-rs run build
cd ele-rs && cargo test
cd ele-rs/src-tauri && cargo check
```

Results:

- `npm run build:release`: passed; generated `release/npcink-device-inventory.zip`.
- `npm run check:release`: passed.
- `composer eval:project:quality-gate`: passed; `Checks needing review: 0`.
- `npm --prefix ele-rs run build`: passed.
- `cd ele-rs && cargo test`: passed; 2 tests passed.
- `cd ele-rs/src-tauri && cargo check`: passed.
- Release package hash: `324d8645ee0e583e760e14ea54d6cefc802205f988728c1b05743007ce89c07e`.

## Real Environment Smoke

Confirmed by manual smoke before preparing this release:

- macOS GUI desktop update click-through: passed.
- Windows install, upload, and update smoke: passed.
- Clean WordPress install from release zip: passed.
- Public query page browser smoke: passed.

## Tagged Release Checks

To complete after pushing `v2.7.8`:

- Release workflow:
- Release URL:
- `npcink-device-inventory.zip`:
- macOS DMG:
- macOS updater package and signature:
- Windows installer and updater signature:
- `latest.json`:
- `latest-desktop.json`:
- Desktop manifest check against downloaded artifacts:

## Decision

- Release candidate status: ready to tag.
- Follow-up required after tag: confirm GitHub Actions release workflow and release assets.
