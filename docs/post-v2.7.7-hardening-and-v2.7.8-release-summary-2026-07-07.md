# Post-v2.7.7 Hardening and v2.7.8 Release Summary

## Context

After `v2.7.7`, the project entered a release hardening pass driven by local smoke results, Plugin Check / release-readiness evidence, and an adversarial `npcink-eval-lab` review. The goal was not to add new product surface area, but to close high-risk gaps before treating the current release line as stable.

The main scope was intentionally limited to:

- Backup restore Plugin Check follow-up.
- Public query security hardening.
- Asset list search performance guardrails.
- Desktop updater surface cleanup.
- Release regression gates and final `v2.7.8` patch release.

Signing, notarization, and broader feature work were kept out of scope.

## Main Decisions

### Ship a patch release instead of mutating v2.7.7

`v2.7.7` was already tagged at `db9999a`, while the hardening work landed afterward on `master`. The project therefore used a new immutable patch release, `v2.7.8`, instead of rewriting the old tag or silently replacing release artifacts.

### Keep public query enabled only with an access code

The public query route remained anonymous by design, but the enabled state now requires an access code hash. This avoids an accidentally open asset lookup page when an administrator enables the feature without configuring a code.

The endpoint also gained transient-backed rate limiting keyed by `REMOTE_ADDR`. The implementation deliberately does not trust forwarded IP headers.

### Narrow expensive asset search paths

Asset list search now keeps ordinary keyword search on indexed / normal asset fields and only enables extended JSON / observation / identity searches for inputs likely to be hardware identifiers:

- IP prefixes.
- MAC-like tokens.
- Long serial-like identifiers.

This preserves useful hardware search behavior while avoiding unnecessary `metadata_json LIKE`, `summary_json LIKE`, and related subquery cost for normal short text.

### Move release confidence into repeatable gates

Manual smoke is still required for real desktop and WordPress environments, but regressions found in this phase were moved into automated release readiness:

- `npm run check:public-query`
- `npm run check:asset-search`
- Existing `npm run check:release`
- `composer eval:project:quality-gate`

This makes the release gate stronger without depending only on historical notes.

## Implemented Changes

### Public Query

- `includes/class-npcink-device-inventory-public.php`
  - Requires access code configuration before serving enabled public query.
  - Adds `PUBLIC_QUERY_RATE_LIMIT` and `PUBLIC_QUERY_RATE_WINDOW`.
  - Applies rate limiting before password validation to reduce brute-force pressure.
  - Shows a clear frontend notice when public query is enabled but not configured.

- `includes/v3/rest/class-npcink-device-inventory-settings-controller.php`
  - Rejects enabling public query when no access code exists and no new access code is submitted.

- `vite-admin/src/pages/index.tsx`
  - Adds admin form validation so enabling public query without an access code is caught before save.

### Backup Restore

- `includes/v3/rest/class-npcink-device-inventory-backup-restore-controller.php`
  - Expanded PHPCS annotations for restore transaction and lookup reads to include `WordPress.DB.DirectDatabaseQuery.NoCaching`.
  - Behavior was not changed; restore lookups intentionally need current transaction state.

### Asset Search

- `includes/v3/repositories/class-npcink-device-inventory-asset-repository.php`
  - Added an `extended_search` flag.
  - Guarded high-cost metadata, identity, and observation search clauses.
  - Adjusted ranking cases so extended matches are only considered when extended search is active.
  - Tightened `should_search_extended_asset_data()`.

### Desktop Updater UI

- Removed the duplicated in-page software update panel after the same function moved to the top settings/menu surface.
- This shipped as part of desktop version `0.1.5`.

### Regression Gates

- `tests/public-query-fixtures.php`
  - Covers disabled public query.
  - Covers enabled but missing access code.
  - Covers invalid access code.
  - Covers repeated attempts hitting the rate limit.
  - Covers valid access code returning the public allow-list payload.

- `tests/asset-search-fixtures.php`
  - Covers extended-search trigger behavior.
  - Confirms SQL guards for expensive asset metadata / observation search paths.

- `scripts/check-release-readiness.mjs`
  - Runs both new fixtures as part of `npm run check:release`.

- `docs/release-readiness-checklist.md`
  - Documents the new release gate coverage.

## Verification History

### Before v2.7.8

The hardening branch passed:

- `php -l` for touched PHP files.
- `npm --prefix vite-admin run build`.
- `npm run build:release`.
- `npm run check:release`.
- `composer eval:project:quality-gate` with `Checks needing review: 0`.
- `npm --prefix ele-rs run build`.
- `cd ele-rs && cargo test`.
- `cd ele-rs/src-tauri && cargo check`.

Manual smoke was reported as passed for:

- macOS GUI update click-through.
- Windows install / upload / update.
- Clean WordPress zip install.
- Public query page in a real browser.

### v2.7.8 Release

`v2.7.8` was prepared at commit `97370e1` and tagged as `v2.7.8`.

Versions:

- WordPress plugin: `2.7.8`.
- Desktop app: `0.1.5`.

Local release package hash before tagging:

- `release/npcink-device-inventory.zip`: `324d8645ee0e583e760e14ea54d6cefc802205f988728c1b05743007ce89c07e`.

GitHub Actions:

- Workflow: `Build release packages`.
- Run ID: `28838097669`.
- Result: success.

Release URL:

- <https://github.com/muze-page/npcink-device-inventory/releases/tag/v2.7.8>

Confirmed release assets:

- `npcink-device-inventory.zip`
- `Npcink.Device.Agent_0.1.5_aarch64.dmg`
- `Npcink.Device.Agent.app.tar.gz`
- `Npcink.Device.Agent.app.tar.gz.sig`
- `Npcink.Device.Agent_0.1.5_x64-setup.exe`
- `Npcink.Device.Agent_0.1.5_x64-setup.exe.sig`
- `latest.json`
- `latest-desktop.json`
- `plugin-check-results.txt`

Downloaded release assets passed:

```bash
npm run check:desktop-manifests -- <downloaded-v2.7.8-assets>
```

Result:

- `Desktop update manifest check passed for 0.1.5.`

## Current State

At the end of this phase:

- `master`, `origin/master`, and `v2.7.8` pointed to `97370e1`.
- The GitHub Release for `v2.7.8` was published, not draft, and not prerelease.
- The local working tree was clean before this summary document was added.

## Follow-Up Guidance

Do not continue patching the `v2.7.8` release artifact in place. If further release-blocking defects are found, create a new patch release.

Recommended next stage:

- Observe `v2.7.8` in real use.
- Track public query 403 / 429 feedback.
- Watch asset list search responsiveness on larger data sets.
- Confirm desktop updater behavior from `0.1.4` to `0.1.5` after more external installs.
- Start new feature work only after the release observation window is quiet.

Deferred items remain:

- macOS Developer ID signing and notarization.
- Windows code signing.
- Broader product features such as reports, lifecycle workflows, or bulk operations.
