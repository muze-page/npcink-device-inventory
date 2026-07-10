# Release Verification 2026-07-10 v2.8.0

## Candidate

- Date: 2026-07-10
- Planned plugin tag: `v2.8.0`
- WordPress plugin version: `2.8.0`
- Desktop app version: `0.1.5` (unchanged)
- Previous release tag: `v2.7.9`
- Scope: analysis issue remediation and asset-assignment hardening.

## Included Changes

- The undeletable `未分配` department remains the fallback for new, updated, imported, and restored assets.
- Analysis issue handled and reopened states persist through asset events.
- Selected `部门待分配` issues can be assigned to a concrete department with an auditable event.
- `责任人缺失` now applies only to active assets; idle assets may remain without a user.
- Selected active assets with missing owners can be assigned a responsibility owner with an auditable event.
- Missing valuation data can be edited from the value-analysis work queue.

## Local Checks

Run from the repository root:

```bash
npm run build:submission
npm run check:submission
composer eval:project:quality-gate
```

Results:

- Frontend build, lint, and hardware-audit fixture: passed.
- PHP syntax, PHPCS, and PHPStan: passed.
- Backup/restore, public-query, asset-search, and issue-state fixtures: passed.
- WordPress.org package rules and release package structure: passed for both release and submission packages.
- Project quality gate: passed with `Checks needing review: 0`.
- Local plugin activation smoke: passed; plugin remained active at version `2.8.0`.
- Local WordPress browser smoke: passed.
- Release package hash: `e1353cb39eed8acc511cc48316c114d1a43bbc2adfd77fd2a3f9cc740dbe8ae8`.

The browser smoke verified:

- an active asset without an owner reports `责任人缺失`;
- an idle asset without an owner does not report `责任人缺失`;
- selected owner assignment updates `ownerName` and records `analysis_owner_assignment`;
- the issue remains resolved after refresh;
- temporary users, assets, and events are removed after verification.

Desktop build checks are not part of the local candidate gate because this release does not change `ele-rs/`, desktop updater contracts, or desktop packaging configuration.

## Tagged Release Checks

To complete after pushing `v2.8.0`:

- Release workflow:
- Release URL:
- `npcink-device-inventory.zip`:
- Desktop artifacts and updater manifests:

## Decision

- Release candidate status: ready to tag.
- Follow-up required after tag: confirm the GitHub Actions release workflow and published release assets.
