# Release Candidate Verification 2026-07-07 Post-Hardening

## Candidate

- Date: 2026-07-07
- Scope: follow-up hardening after issues 3, 4, and 6.
- Base commit before this verification work: `d2d1d79` (`Harden public query and asset search`).
- WordPress plugin version: `2.7.7`.
- Desktop app version: `0.1.4`.

## Implemented Regression Gates

- Added `npm run check:public-query`.
  - Confirms disabled public query rejects requests.
  - Confirms enabled public query without an access code rejects requests.
  - Confirms invalid access codes reject requests.
  - Confirms repeated attempts hit the public query rate limit.
  - Confirms a valid access code can return the public asset allow-list payload.
- Added `npm run check:asset-search`.
  - Confirms short or ordinary text keywords do not trigger extended JSON / observation search.
  - Confirms IP prefixes, MAC-like tokens, and long serial-like tokens still trigger extended search.
  - Confirms generated list SQL guards high-cost metadata, identity, and observation clauses behind the extended-search flag.
- Added both fixtures to `npm run check:release`.

## Automated Checks

Run from repository root on 2026-07-07:

```bash
npm run build:release
npm run check:release
composer eval:project:quality-gate
```

Results:

- `npm run build:release`: passed; rebuilt `release/npcink-device-inventory.zip`.
- `npm run check:release`: passed.
- `npm run check:public-query`: passed as part of `check:release`.
- `npm run check:asset-search`: passed as part of `check:release`.
- `composer eval:project:quality-gate`: passed; `Checks needing review: 0`.
- Release package hash: `d5e7e7127d655c90178a4830fb3ffd5bc6d002967a61ce5a2fead17455089838`.

## Manual Smoke Status

Still requires real environment confirmation before a broader release:

- macOS app GUI update click-through from previous official desktop release.
- Windows app install, upload smoke, and update smoke.
- Clean WordPress install from `release/npcink-device-inventory.zip`.
- Public query page manual smoke:
  - cannot enable public query without access code,
  - wrong access code returns forbidden response,
  - repeated attempts eventually return rate limit,
  - correct access code returns only public allow-list fields.

## Decision

- Automated release-candidate gate: pass.
- Broader release status: hold until the manual smoke items above are confirmed.
- Follow-up allowed after manual smoke: signing/notarization and external distribution hardening.
