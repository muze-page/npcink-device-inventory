# v3 Rebuild and Release Summary

## Date
2026-06-24

## Scope
This document summarizes the device inventory rebuild completed in this workspace and the current release state for the WordPress plugin and desktop upload agent.

## Product Direction
The plugin was rebuilt without preserving the old four-table design as the product model.

The old tables were:

- `wp_npcink_device_pc`
- `wp_npcink_device_style`
- `wp_npcink_device_manual`
- `wp_npcink_device_auto`

The new model is asset-centered:

- `wp_npcink_assets`
- `wp_npcink_asset_identities`
- `wp_npcink_asset_observations`
- `wp_npcink_asset_events`

This keeps manual records, client uploads, matching identities, observations, and historical changes under one asset ledger instead of splitting product behavior by legacy table type.

## WordPress Plugin Changes
The WordPress side now exposes v3 REST routes under `/wp-json/npcink/v1`:

- `/assets`
- `/assets/{uuid}`
- `/assets/{uuid}/identities`
- `/assets/{uuid}/observations`
- `/assets/{uuid}/events`
- `/device-observations`
- `/settings`
- `/client-tokens`

The old admin partials, old table-specific screens, old `vite-search` app, and old upload contract were removed from the runtime surface.

The current admin UI is a single v3 asset workspace. It supports:

- asset list, search, type filter, and status filter
- asset detail drawer
- identities, observations, and events
- expandable hardware and raw JSON details
- client-token creation and copyable onboarding snippets

## Legacy Data Import
The old export JSON files were imported locally through a one-off WP-CLI script:

```text
.github/scripts/import-device-export-v3.php
```

The import result was:

- assets: 169
- identities: 1109
- observations: 169
- events: 933

Manual and automatic historical events all mapped to assets. No legacy import JSON parse warnings were reported.

The local pre-import v3 backup is:

```text
.local-backups/v3-before-import-20260624-173721.sql
```

The old export JSON files remain local-only and are intentionally not committed.

## Desktop Agent
The desktop upload software is not a complete rewrite. It was adapted to the v3 upload contract.

Current behavior:

- collects static hardware data locally
- computes `stable_device_id_v2`
- submits to `/wp-json/npcink/v1/device-observations`
- uses full client token values in the form `mda_<token-id>_<token-secret>`
- signs upload requests with HMAC SHA-256 headers
- sends v3 observation payloads with identity, summary, hardware, and raw data

The local macOS package was built at:

```text
ele-rs/src-tauri/target/release/bundle/dmg/Npcink Device Agent_0.1.0_aarch64.dmg
```

Local smoke tests confirmed:

- DMG checksum verification passed.
- The app bundle launches through macOS `open`.
- A real local upload created a new asset on first submission.
- A second submission matched the same asset instead of creating a duplicate.
- The temporary token and test asset were removed after verification.

## Verification Already Run
Local verification included:

```bash
npm run build --prefix vite-admin
npm run lint --prefix vite-admin
composer run phpstan
composer run phpcs
cargo test
npm run build
npm run tauri:build
git diff --check
```

The local WordPress import baseline after cleanup is:

- assets: 169
- identities: 1109
- observations: 169
- events: 933

## GitHub Packaging
GitHub Actions now has two packaging workflows:

- `.github/workflows/preview.yml`
- `.github/workflows/release.yml`

The preview workflow can be triggered manually with package choices:

- `all`
- `plugin`
- `desktop`
- `macos`
- `windows`

For the immediate installer build, use `package=desktop` to build:

- macOS DMG on `macos-latest`
- Windows NSIS installer on `windows-latest`

The release workflow builds plugin and desktop packages when a `v*` tag is pushed.

## Remaining Release Risks
Before full rollout:

- Test the Windows installer on real Windows desktop and laptop machines.
- Confirm second upload from each Windows test machine returns `matched`.
- Confirm Windows hardware UUID, serial, BIOS, baseboard, and MAC values are stable.
- Sign and notarize macOS packages before external distribution.
- Decide whether Windows packages need code signing before wider rollout.
- Move or ignore the local `设备数据备份/` folder so export data is not accidentally committed.

## Recommended Next Step
Use GitHub Actions preview build for desktop installers, then run a three-machine pilot:

- one Windows desktop
- one Windows laptop
- one machine with multiple or virtual network adapters

Each test machine should upload twice. The first upload may create or match an asset. The second upload must match the same asset.
