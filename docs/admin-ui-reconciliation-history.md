# Admin UI Reconciliation History

## Date
2026-06-25

## Scope
This document summarizes the recent admin UI reconciliation work for `Npcink Device Inventory`.

The work started from a comparison with the old `magick-device-manage` plugin and ended with a release-readiness pass for the current v3 asset-centered plugin. It records the product judgment, UI decisions, implemented changes, verification evidence, and remaining recommended work.

## Background
The v3 rebuild had moved the plugin from the old table-specific product model to an asset-centered model:

- old model: computer device, custom device, manual change data, automatic change data, and hardware check screens
- new model: assets, identities, observations, and events under one asset ledger

After the rebuild, the user compared the current admin screen with the old plugin and raised an important product concern: the old UI still felt better in several workflows, especially the asset ledger cards and device detail modal.

The old plugin was installed locally for visual comparison at:

```text
http://npcink-device-manage.local/wp-admin/plugins.php?page=dema_seting
```

The current plugin page is:

```text
http://npcink-device-manage.local/wp-admin/plugins.php?page=npcink_device_inventory_settings
```

The old data backup used for comparison is local-only:

```text
/Users/muze/gitee/npcink-device-inventory/设备数据备份
```

That backup is intentionally not committed.

## Main Product Conclusion
The old UI felt better not because the old data model was better, but because the old UI had a clearer working surface:

- the first screen showed assets immediately instead of summary blocks first
- the asset cards had a strong visual anchor, stable card rhythm, and more useful hardware text
- filters were close to the asset list and did not feel like a separate dashboard
- the detail modal had a strong blue device hero, clear tabs, and scan-friendly hardware fields
- operators could move from asset card to detail to change records with fewer conceptual jumps

The final direction was therefore:

Do not restore the old four-table architecture, but bring back the useful old operator workflow and visual structure on top of the v3 asset model.

## UI Decisions
The admin surface is now treated as an operations workspace, not a marketing page or dashboard mosaic.

Accepted UI decisions:

- keep the v3 asset ledger as the product center
- restore old-style asset cards for computer assets
- keep top-level workspaces: asset ledger, change data, hardware audit, settings
- keep asset sub-tabs: computer assets, other assets, all assets
- use card and table views, with compact card mode for dense scanning
- keep filters close to the asset list
- use a modal-style device detail surface with hero and tabs
- show standard fields, imported fields, and latest collected fields together
- keep hardware audit as an operational issue list, not just statistics
- keep legacy import simple because old data is prepared locally before import

Rejected or intentionally avoided:

- restoring the old table model
- making old-data field mapping a major admin workflow
- adding more dashboard cards before the actual asset work area
- keeping manual legacy import mapping after the user clarified local preprocessing is already done

## Implemented Admin Changes

### Asset Ledger
Implemented capabilities:

- old-style computer asset card layout
- card view and list view
- compact card mode
- status/search filters
- saved local filters
- current-filter export
- batch mode
- current-page selection
- batch archive
- batch field updates
- batch updates write `bulk_updated` change records when fields actually change

The batch edit flow now avoids writing noisy events when selected assets do not change.

### Legacy Import
Implemented capabilities:

- legacy import preview
- automatic field recognition
- local prepared data flow
- imported hardware stored under `metadata.importedHardware`

The removed feature was manual legacy field mapping. This was removed because the user clarified old data is processed locally before import.

### Hardware Display Fallback
Implemented a shared hardware context so cards, detail views, audit summaries, and CSV export can read hardware fields from either:

- `latestObservation.summary`
- `latestObservation.hardware`
- `metadata.importedHardware`
- `metadata.importedHardware.raw`

This was necessary because legacy imported assets may have no live `latestObservation`.

The fallback logic recognizes old export shapes such as:

- `memLayout`
- `diskLayout`
- `graphics.controllers`
- `net`
- `baseboard`
- `system`

### Detail Modal
Implemented capabilities:

- blue device hero inspired by the old plugin
- detail tabs for hardware info, detailed info, automatic records, manual records, and settings
- recent activity list combining automatic observations, detected configuration changes, manual records, and legacy events
- field source comparison matrix:
  - standard field
  - imported field
  - latest collection
- long-value wrapping for UUIDs and hardware text

### Change Data
Implemented capabilities:

- source labels for legacy automatic, legacy manual, and legacy import events
- event type option for batch update records
- `bulk_updated` records for real batch changes

### Hardware Audit
Implemented capabilities:

- hardware issue detection for CPU, GPU, memory, and disk missing values
- duplicate number, duplicate IP, and suspected duplicate device detection
- department and owner missing detection
- imported-only and stale collection detection
- maintenance status detection
- issue groups:
  - all
  - duplicate risk
  - data missing
  - hardware missing
  - collection status
  - maintenance status
- issue type filter
- handled/unhandled local state
- restore handled issue
- issue export
- view asset from issue

Current real local data has zero detected hardware issues, so a fixture check was added to keep the issue logic verifiable.

## Release Readiness Changes

### Hardware Audit Fixture
Added a deterministic fixture and check:

```text
vite-admin/tests/fixtures/hardware-audit-assets.json
vite-admin/scripts/check-hardware-audit-fixture.mjs
```

Command:

```bash
npm run check:hardware-audit
```

The fixture covers:

- duplicate number
- duplicate IP
- missing department
- missing owner
- missing CPU
- missing GPU
- missing memory
- missing disk
- imported-only asset
- maintenance asset

### Hardware Audit Logic Extraction
Moved pure audit and hardware parsing logic from the page file into:

```text
vite-admin/src/utils/hardwareAudit.ts
```

Reason:

- the page should own UI state and rendering
- audit rules should be independently testable
- the fixture check and UI should use exactly the same logic

### REST and Storage Safety
Added a v3 sanitizer:

```text
includes/v3/class-npcink-device-inventory-v3-sanitizer.php
```

It is used for JSON-like values stored in:

- asset metadata
- event payload
- observation summary
- observation hardware
- observation raw payload

Additional safety changes:

- event old/new values use textarea sanitization
- manual event message must be a non-empty scalar
- manual event message is sanitized before event creation
- upload signature headers validate timestamp, nonce length, and `sha256=<64 hex chars>` signature shape

The existing security model remains:

- admin REST routes require `manage_options`
- WordPress REST nonce is sent by the admin app
- device observation upload can use administrator auth or signed client token auth

### Vite Build Decision
Manual chunk splitting was tried to reduce bundle warning size. It reduced the entry bundle, but browser smoke testing showed an Ant Design/React runtime cycle:

```text
Cannot read properties of undefined (reading 'createContext')
```

Decision:

- revert to stable single-module admin bundle
- explicitly raise `chunkSizeWarningLimit` to 1300
- document that this is intentional for the WordPress admin surface

Reason:

The admin app is loaded as one WordPress admin module. Stability is more important than splitting Ant Design into multiple manual chunks for this release.

### Release Package Scripts
Added release package scripts:

```text
scripts/build-release-package.mjs
scripts/check-release-package.mjs
```

The build script packages only runtime files, including:

- root plugin files
- `admin/`
- `includes/`
- `languages/`
- `vite-admin/dist/`

The check script prevents release packages from containing:

- `.git`
- `node_modules`
- `vendor`
- `release`
- `设备数据备份`
- `device-inventory-current.png`
- `vite-admin/src`
- `vite-admin/tests`
- `vite-admin/scripts`
- Vite source config files
- `ele-rs`
- accidental zip artifacts

The previous release package included `vite-admin/src`. The new release package excludes source files and local data.

## Commits Produced
Recent relevant commits:

```text
3836cab Refine device inventory admin UI
b7cb9e3 Add inventory audit workflow refinements
5e22169 Add release readiness checks
```

## Verification Performed
The following checks passed in the final stage:

```bash
npm run check:hardware-audit
npm run lint
npm run build
composer run phpstan
composer run phpcs
node scripts/check-release-package.mjs release/npcink-device-inventory.zip
node scripts/check-release-package.mjs sj/npcink-device-inventory.zip
git diff --check
```

Browser smoke testing against the local WordPress admin page also passed for:

- asset cards
- asset detail modal
- recent activity
- field source comparison
- search filtering
- legacy import preview
- batch mode
- batch update modal audit copy
- change data `bulk_updated` filter
- hardware audit panel and empty state

## Current Release Package
Generated packages:

```text
release/npcink-device-inventory.zip
sj/npcink-device-inventory.zip
```

Both packages have the same hash:

```text
36b4aff57e15210c68f777417adbe35a89d0683535ca4e017f47b15dae97c7e3
```

Current package shape:

- file count: 53
- uncompressed bytes: 1377513
- compressed bytes: 444611

The package manifest was updated at:

```text
sj/package-manifest.json
```

## Current Local-Only Files
The following files/directories remain local and should not be committed:

```text
device-inventory-current.png
设备数据备份/
```

## Remaining Recommendations

### 1. Clean Zip Install Validation
Install `release/npcink-device-inventory.zip` into a clean local WordPress site, not the current development-mounted plugin directory.

Validate:

- plugin installs
- plugin activates
- admin menu appears
- admin app loads
- REST settings/assets/events routes work
- client token create/delete works
- old prepared data import works
- uninstall setting behavior is understood

### 2. Multi-Admin Hardware Audit Decision
Current handled issue state is browser-local. Before wider multi-admin use, decide whether handled issue state should remain local or move to server-side event/metadata state.

### 3. Real Hardware Pilot
Run a small pilot with:

- one Windows desktop
- one Windows laptop
- one machine with multiple or virtual network adapters

Each machine should upload twice. The second upload must match the same asset.

### 4. Installer Signing
Before public distribution:

- sign and notarize macOS packages
- decide whether Windows packages need signing before external use

### 5. Optional UI Polish
The current UI is functionally strong enough for release validation. Future polish should focus on:

- detail modal density at narrow desktop widths
- hardware audit server-side handled state
- more operator-friendly issue explanations
- better visible distinction between imported-only assets and actively collected assets

## Handoff Summary
The project should not go back to the old plugin architecture. The old plugin remains useful as a design reference, especially for the asset card rhythm and detail modal scanning experience.

The current implementation keeps the v3 asset-centered model and restores the operator workflows that made the old plugin feel effective.

The next best step is a clean zip install validation.
