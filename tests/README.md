# Test Fixtures And Regression Checks

This folder contains lightweight regression checks that can run without a full WordPress browser session.

- `backup-restore-fixtures.php`: JSON backup/restore dry-run and import behavior fixtures.
- `public-query-fixtures.php`: public query access-code and rate-limit fixtures.
- `asset-search-fixtures.php`: asset search cost and extended-search guard fixtures.
- `fixtures/device-observation-demo.json`: synthetic, sanitized hardware observation sample for documentation and parser experiments.

Run the root package scripts for the supported checks:

```bash
npm run check:backup-restore
npm run check:public-query
npm run check:asset-search
```
