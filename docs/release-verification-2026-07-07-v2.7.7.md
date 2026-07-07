# Release Verification 2026-07-07 v2.7.7

## Candidate

- Date: 2026-07-07
- Git commit: `db9999a` (`Prepare v2.7.7 release candidate`)
- Plugin tag: `v2.7.7`
- WordPress plugin version: `2.7.7`
- Desktop app version: `0.1.4`
- Previous desktop release used for update testing: `v2.7.6` / desktop `0.1.3`

## Local Checks

- `git status --short --branch`: clean after the v2.7.7 release candidate commit was pushed.
- `node --check scripts/check-desktop-update-manifests.mjs`: passed.
- `TAG_NAME=v2.7.7 node scripts/build-desktop-update-manifests.mjs <fixture> && npm run check:desktop-manifests -- <fixture>`: passed; generated manifest version `0.1.4`.
- `npm run build:release`: passed; generated `release/npcink-device-inventory.zip`.
- `npm run check:release`: passed; package hash `d96cb1b2fb9c24291e3b0138e4ff94e5b4857afbd93c1e8118dfc107d323bc65`.
- `cd ele-rs && cargo test`: passed; 2 tests passed.
- `cd ele-rs/src-tauri && cargo check`: passed.
- `cd ele-rs && npm run build`: passed.

## Preview Builds

Preview runs before this version bump passed on the same release workflow shape:

- Plugin preview run: <https://github.com/muze-page/npcink-device-inventory/actions/runs/28806120151>
- macOS desktop preview run: <https://github.com/muze-page/npcink-device-inventory/actions/runs/28806121037>
- Windows desktop preview run: <https://github.com/muze-page/npcink-device-inventory/actions/runs/28806120425>

Artifacts:

- `preview-npcink-device-inventory-plugin`: passed
- `plugin-check-results`: passed
- `preview-npcink-device-agent-macos`: passed
- `preview-npcink-device-agent-windows`: passed

## Tagged Release Checks

- Release workflow: <https://github.com/muze-page/npcink-device-inventory/actions/runs/28834242263> passed.
- Release URL: <https://github.com/muze-page/npcink-device-inventory/releases/tag/v2.7.7>
- Release state: published, not draft, not prerelease.
- `npcink-device-inventory.zip`: present.
- macOS DMG `Npcink.Device.Agent_0.1.4_aarch64.dmg`: present.
- macOS updater `Npcink.Device.Agent.app.tar.gz`: present.
- macOS updater signature `Npcink.Device.Agent.app.tar.gz.sig`: present.
- Windows installer `Npcink.Device.Agent_0.1.4_x64-setup.exe`: present.
- Windows updater signature `Npcink.Device.Agent_0.1.4_x64-setup.exe.sig`: present.
- `latest.json`: present and available from `releases/latest/download/latest.json`.
- `latest-desktop.json`: present and available from `releases/latest/download/latest-desktop.json`.
- Desktop manifest check against downloaded release artifacts: passed for desktop version `0.1.4`.

## Desktop Update Smoke

This step requires installing the previous official desktop release package on
real macOS and Windows machines before checking for updates.

- macOS previous official version installed: pending
- macOS update check entry used: pending
- macOS update result: pending
- Windows previous official version installed: pending
- Windows update check entry used: pending
- Windows update result: pending

## Upload Smoke

- WordPress site: pending
- Temporary upload token created: pending
- macOS upload result: pending
- Windows upload result: pending
- Temporary upload token disabled: pending

## Known Limits

- macOS DMG signing/notarization: not added; internal testing only.
- Windows code signing: not added; internal testing only.
- Public GitHub Release access: required for desktop updater.
- Plugin Check annotations: direct database call caching warnings remain in
  `includes/v3/rest/class-npcink-device-inventory-backup-restore-controller.php`;
  they did not fail the release workflow.
- Any release blocker: none from local checks, preview builds, release workflow, or release asset manifest checks.

## Decision

- Release candidate status: tagged release artifacts passed.
- Follow-up required before external use: real macOS and Windows update smoke from previous official 0.1.3 packages, plus upload smoke against a WordPress site.
- Follow-up allowed after tag: code signing/notarization, installer trust hardening, and caching cleanup for Plugin Check warnings.
