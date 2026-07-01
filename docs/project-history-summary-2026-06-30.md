# Npcink Device Inventory Project History Summary

## Date
2026-06-30

## Scope
This document summarizes the recent product, UI, data, and packaging discussions for `npcink-device-inventory`.

It is intentionally written as a handoff document: a future developer or agent should be able to understand why the current interface looks the way it does, which old-plugin ideas were restored, which were rejected, and what still needs attention.

## Product Direction

The project moved from the old `magick-device-manage` style implementation toward a v3 asset-centered inventory model.

The main direction is:

- keep the new v3 asset model as the technical foundation;
- restore useful old-plugin workflows and visual patterns where they help operators;
- avoid bringing back old table coupling or duplicate control surfaces;
- keep common workflows simple, especially for non-technical users;
- expose technical/debug information only where it is actually useful.

The old plugin was used as a visual and workflow reference, not as an architecture to copy wholesale.

## Old UI Findings

The old version often felt more refined because it had:

- clearer first-screen focus on real assets;
- stable five-card rhythm with enough spacing;
- compact filters close to the asset list;
- stronger card visual anchors;
- a blue hardware-detail hero that made the modal feel coherent;
- detail tabs that separated overview, hardware, records, and settings;
- less dashboard-like noise before the actual work surface.

The new version initially felt heavier because it introduced too many summary panels, oversized typography, dense controls, and some repeated or overly technical fields.

## Key UI Decisions

Accepted:

- use `设备资产管理` as the main admin context;
- keep top-level tabs for `电脑设备`, `自定义设备`, `变更数据`, `硬件盘点`/analysis, and `设置`;
- keep old-style card layout for asset scanning;
- use five cards per row on desktop instead of six;
- keep filters and actions in one compact toolbar;
- use `新增` and `更多` style action labels where the longer text adds clutter;
- move infrequent actions such as old-data import and client token management into settings;
- make detail modals smaller, tighter, and closer to the old modal rhythm;
- reduce global font weight and remove text-shadow-like artificial boldness;
- keep technical/dev information in a dedicated debug/developer area instead of normal operator tabs.

Rejected or removed:

- restoring the old data architecture;
- showing raw JSON or source-mapping data to normal users;
- showing repeated upload endpoint text in multiple areas;
- keeping refresh buttons where browser refresh or data re-query already covers the use case;
- showing `来源` filters where they do not map to a real operator decision;
- showing `盘点设置` inside an asset settings form when the user cannot act on it there.

## Asset Ledger

The asset ledger is the primary workspace.

Important decisions:

- cards should show enough hardware context to identify a machine quickly;
- list view remains available for dense review;
- computer assets and custom assets can have different card content, but should share the same interaction quality;
- card grids should not overflow or crop at the right edge;
- action controls should be aligned, not squeezed between search and segmented controls;
- custom asset cards should resemble the old custom-device workflow where useful, including purchase and usage information.

The user repeatedly preferred the old custom asset detail layout because it grouped information by real-world meaning:

- device information;
- purchase information;
- order information;
- automatic records;
- edit form.

The resulting product direction is to make custom assets feel like purchase/inventory records, not generic computer cards.

## Detail Modal

The computer asset modal should stay compact and visually close to the old design.

Accepted direction:

- blue hero at the top;
- smaller modal scale and smaller fonts;
- no redundant `Intel / memory / disk` line if it duplicates data already shown elsewhere;
- `硬件信息` tab should show essential fields only;
- `详细信息` tab should use category navigation plus a table-like layout for processor, memory, graphics, monitor, baseboard, disk, network, BIOS, system, UUID;
- developer-only identity/source/extension fields should move to a debug tab;
- automatic records and manual records should each have their own simpler workflow;
- settings should be an operator edit surface, not a place for unrelated advanced controls.

Blank hardware fields were traced to data source differences: some legacy/imported/custom assets did not have live `latestObservation.hardware`, so fallback to imported or raw hardware data was needed.

## Manual And Automatic Records

The original manual-record UI was too complex.

Accepted direction for manual records:

- default view is a table of existing records;
- toolbar has search and an `添加` button;
- clicking `添加` opens a focused modal;
- form fields are simple: change person, change item, change description;
- avoid showing the full form inline all the time.

Accepted direction for automatic records:

- show field-level changes in a simple table;
- columns: sequence, option, before, after, time;
- only track practical fields such as name, status, number, department, IP, purchase price, second-hand price;
- add search;
- avoid verbose imported legacy field noise.

The global `变更数据` screen should support toggling between automatic and manual change data. The button label should reflect the currently displayed mode, not the target mode in a confusing way.

The `隐藏姓名` control is intended to mask or blur names for privacy when screenshots or shared views are needed.

## Settings

Settings should be useful and not scattered.

Accepted settings content:

- client upload endpoint and token management;
- enable/disable client access tokens;
- delete token with confirmation;
- public query page settings;
- one-click create public query page;
- edit public query page button;
- import/export actions where they are administrative rather than day-to-day actions;
- depreciation period and residual-rate settings if they affect financial calculations.

Rejected or moved:

- department free-text where a dropdown is possible;
- `盘点设置` inside per-asset settings;
- complete-edit button when inline setting fields are sufficient;
- repeated endpoint text in token creation alerts.

The settings page from the old plugin was used as a checklist, but not all old items should be restored. Only items that map to the current v3 model and current user workflow are retained.

## Public Query Page

A public query page was added so non-admin users can query a specific asset.

Product decisions:

- do not expose a complete asset list publicly;
- query should support asset number or name;
- optional access code is appropriate;
- public results should be polished enough for non-admin users;
- include basic hardware summary for computers;
- avoid exposing raw JSON, MAC, UUID, BIOS serials, or other sensitive identifiers.

The public query page can be created by WordPress page/shortcode integration rather than a fully separate application.

## Hardware And Data Analysis

Hardware analysis and data analysis should not become a wall of numbers.

Accepted direction:

- use an `分析` top-level tab if analysis grows;
- use sub-tabs for `硬件` and `数据`;
- provide table and chart views near each data section;
- use consistent view switch controls;
- show percentages next to counts;
- keep formula explanations available but not visually dominant.

The hardware inventory/analysis area should help answer practical questions such as:

- what CPU/mainboard/memory/disk models are common;
- which departments hold the most assets;
- where asset value is concentrated;
- which machines have missing or stale hardware data.

The old `资产盘点` block was worth restoring in spirit, but the promotional customization block from the old page is not part of the new product.

## Client Access And Packaging

The client uploader should be simple for end users.

The user has about:

- 150 Windows computers;
- 20 Mac computers.

The preferred distribution model is:

- WordPress admin creates a client token;
- admin copies a package preset config from the client token modal;
- `ele-rs` embeds that preset at build time;
- Windows users receive an `.exe`;
- macOS users receive a `.dmg`;
- installed client only asks the user to fill a remark and upload.

Important security decisions:

- upload endpoint is not a secret;
- full token value is an upload credential;
- only administrators should be able to copy package config;
- copying package config should require confirmation;
- tokens must support enable/disable;
- deletion must require confirmation.

The package preset flow uses:

```text
ele-rs/src-tauri/agent-preset.local.json
```

This file is local-only and should not be committed.

The example preset lives at:

```text
ele-rs/src-tauri/agent-preset.example.json
```

Build output expectations:

```text
Windows: ele-rs/src-tauri/target/release/bundle/nsis/*.exe
macOS:   ele-rs/src-tauri/target/release/bundle/dmg/*.dmg
```

## Data Import And Legacy Data

The old data is prepared locally before import.

Therefore:

- avoid making old-data field mapping a major UI workflow;
- keep import as an administrative tool;
- preserve useful imported hardware fields for display fallback;
- do not expose source comparison and raw legacy fields to normal users.

Local old-data backup path:

```text
/Users/muze/gitee/npcink-device-inventory/设备数据备份
```

This is a local artifact and should not be committed.

## Quality And Verification Pattern

The project has relied on these checks during recent work:

```bash
npm run build --prefix vite-admin
npm run lint --prefix vite-admin
npm run build --prefix ele-rs
cargo check --manifest-path ele-rs/src-tauri/Cargo.toml
cargo test --manifest-path ele-rs/src-tauri/Cargo.toml
vendor/bin/phpstan analyse --memory-limit=1G
vendor/bin/phpcs
npm run check:release
```

Not every check is required for every small UI change, but release-facing work should run the broader set.

## Current Operating Principles

- Prefer restoring useful old workflows over copying old architecture.
- Keep operator screens focused and compact.
- Hide technical detail unless the user explicitly opens debug/developer areas.
- Treat screenshots and visual comparison as valid product feedback.
- When the user says "同意", implement the smallest useful version and verify it.
- Do not update release packages unless explicitly requested.
- Do not commit generated zips or local backup artifacts.

## Recommended Next Work

1. Finish any remaining polish in the client token modal and package preset flow.
2. Build one Windows `.exe` and one macOS `.dmg` using a copied token preset for internal testing.
3. Smoke-test the installed client on one Windows machine and one Mac.
4. Review the settings page against the old settings checklist and keep only active, useful settings.
5. Continue visual QA for the analysis tab so table/chart toggles are consistent and percentages are shown.
6. Run release checks only when a publish package is actually requested.

## Related Documents

- `docs/admin-ui-reconciliation-history.md`
- `docs/client-token-package-preset-history.md`
- `docs/modernization-history.md`
- `docs/asset-data-model.md`
- `docs/device-data-v2-contract.md`
- `ele-rs/README.md`
