# Asset List Empty After Backup Restore Incident - 2026-07-06

## Summary

After importing a JSON backup exported from the current package, the admin UI showed empty "电脑设备" and "自定义设备" tabs while "变更数据" looked normal.

The import itself was not the root cause. Production data existed in the plugin tables, but the asset list query failed on the production MySQL engine because it evaluated an empty regular expression:

```sql
a.metadata_json REGEXP ''
```

Production MySQL returned:

```text
Got error 'empty (sub)expression' from regexp
```

The events page stayed normal because it uses the event repository and does not execute the asset list `REGEXP` filter.

## Evidence

The backup file used for the import contained all expected sections:

```text
assets:       170
identities:   1087
observations: 170
events:       967

asset types:
pc:     162
custom:   8
```

Local dry-run and import-path fixture checks against the same JSON planned/imported:

```text
assetsCreated:       170
identitiesCreated:  1087
observationsCreated: 170
eventsCreated:       967
skipped.assets:        0
conflicts:             0
```

Production database read-only checks showed the restored asset data was present:

```text
wp_npcink_assets:             170
wp_npcink_asset_identities:  1087
wp_npcink_asset_observations: 170
wp_npcink_asset_events:       966

asset_type=pc:     162
asset_type=custom:   8

orphan_events:       0
orphan_observations: 0
```

The production plugin file matched the current backup restore controller, so the backend restore code was current. The failure reproduced in the asset repository list query, not in restore.

## Root Cause

`Npcink_Device_Inventory_Asset_Repository::list_assets()` always included the purchase-platform filter expression:

```sql
AND (%s = '' OR a.metadata_json REGEXP %s)
```

When no purchase platform filter was selected, `build_platform_regex()` returned an empty string. Although the left side of the `OR` should logically disable the filter, MySQL still parsed/evaluated the invalid empty regex and returned a query error on production.

Because the repository returned empty results after the database error, the UI rendered empty asset lists.

## Fix

The repository now separates "is the platform filter active" from "which regex should be evaluated":

```php
$platform_filter = $platform_regex === '' ? '' : '1';
$platform_query_regex = $platform_regex === '' ? 'a^' : $platform_regex;
```

When the filter is inactive, SQL still receives a syntactically valid never-match regex (`a^`), while the filter gate remains disabled.

Production hotfix verification after deploying the file:

```text
repo_all total=170
repo_computer total=162
repo_other total=8
```

## Why The Initial Investigation Missed It

The initial investigation focused too early on backup/import correctness. That proved the JSON and restore controller were valid, but did not prove production asset-list reads were valid.

Specific misses:

- The first pass validated the backup file and local restore path, but did not immediately compare production database counts with production API/repository counts.
- The backup restore fixture uses a mocked `$wpdb`, so it cannot catch SQL-engine-specific behavior like `REGEXP ''`.
- Without SSH access at first, the investigation stopped at likely package/version and import-path causes instead of directly proving the DB/API split.

The correct split was:

```text
backup file has assets -> production DB has assets -> production asset API is empty
```

That points to read/query failure, not import failure.

## Prevention

For any future "import succeeded but UI is empty" report, use this order:

1. Count rows in the backup file.
2. Count rows in production plugin tables.
3. Count rows through the repository/API with the same filters used by the UI.
4. If DB has rows but API is empty, inspect SQL errors before revisiting import logic.

Add release/smoke coverage for asset list reads with empty optional filters:

```text
GET /assets?assetScope=all&page=1&pageSize=5
GET /assets?assetScope=computer&page=1&pageSize=5
GET /assets?assetScope=other&page=1&pageSize=5
```

Repository tests that use mocks are not enough for SQL compatibility. Dynamic SQL paths using `REGEXP`, `LIKE`, optional filters, or custom table joins need at least one real database smoke check before release.
