# Release Candidate Verification Template

Use this template for each release candidate before creating or announcing a
tagged release. Copy the sections into a dated verification note, then fill the
actual command output, GitHub Actions run links, artifact names, and real-device
results.

## Candidate

- Date:
- Git commit:
- Planned plugin tag:
- WordPress plugin version:
- Desktop app version:
- Previous desktop release used for update testing:

## Local Checks

Run from the repository root unless noted.

```bash
git status --short --branch
npm run build:release
npm run check:release
cd ele-rs
cargo test
npm run build
```

Results:

- `git status --short --branch`:
- `npm run build:release`:
- `npm run check:release`:
- `cd ele-rs && cargo test`:
- `cd ele-rs && npm run build`:

## Preview Builds

Run GitHub Actions `Build preview packages` before tagging.

- Plugin preview run:
- macOS desktop preview run:
- Windows desktop preview run:

Artifacts to inspect:

- `preview-npcink-device-inventory-plugin`:
- `preview-npcink-device-agent-macos`:
- `preview-npcink-device-agent-windows`:

## Tagged Release Checks

After the tag workflow finishes, record:

- Release URL:
- `npcink-device-inventory.zip`:
- macOS DMG:
- macOS updater `.tar.gz`:
- macOS updater signature:
- Windows installer:
- Windows updater signature:
- `latest.json`:
- `latest-desktop.json`:

Run against downloaded release artifacts or the workflow artifact directory:

```bash
npm run check:desktop-manifests -- artifacts
```

Result:

- Desktop manifest check:

## Desktop Update Smoke

Before update testing, confirm the installed app is the previous official
Release package, not a local development build.

- macOS previous official version installed:
- macOS update check entry used: Settings / native menu
- macOS update result:
- Windows previous official version installed:
- Windows update check entry used: Settings / native menu
- Windows update result:

## Upload Smoke

- WordPress site:
- Temporary upload token created:
- macOS upload result:
- Windows upload result:
- Temporary upload token disabled:

## Known Limits

- macOS DMG signing/notarization:
- Windows code signing:
- Public GitHub Release access:
- Any release blocker:

## Decision

- Release candidate status: pass / hold
- Follow-up required before tag:
- Follow-up allowed after tag:
