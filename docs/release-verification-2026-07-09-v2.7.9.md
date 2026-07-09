# Release Verification 2026-07-09 v2.7.9

## Candidate

- Date: 2026-07-09
- Planned plugin tag: `v2.7.9`
- WordPress plugin version: `2.7.9`
- Desktop app version: `0.1.5`
- Previous release tag: `v2.7.8`
- Scope: admin analysis polish and release-documentation refresh.

## Included Changes

- Admin analysis workspace now has clearer department controls and denser review surfaces.
- WordPress.org update-index repair documentation records the v2.7.8 package transition.
- Project documentation and WordPress.org submission materials are refreshed for the current release workflow.

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
- Release package hash: `fcbd7b18247344c56e249aedec4749a5b0e820884af421568548a78eb2522e8c`.

## Tagged Release Checks

To complete after pushing `v2.7.9`:

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
