# Data Tools And Asset Policy History

Date: 2026-07-03

This note records the product decisions and implementation context from the
asset-status, statistics, settings, depreciation, and data-tool refinement pass.

## Asset Status Policy

Computer assets now use four normal operational statuses:

- `active`: 在用
- `inactive`: 闲置
- `maintenance`: 维护
- `retired`: 报废

`deleted` remains an internal archived state. It can still be used for filtering
and archived records, but normal edit and bulk-status controls should not offer
it as an ordinary device status.

The public status labels were aligned with this policy. In particular,
`inactive` should display as 闲置 and `retired` should display as 报废.

## Statistics Scope

Hardware audit and asset-value statistics now have a setting named
`count_available_assets_only`.

When enabled, only available assets are counted:

- `active`
- `inactive`

The following statuses are excluded from statistics:

- `maintenance`
- `retired`
- `deleted`

The intent is to keep damaged, scrapped, archived, or under-maintenance machines
from distorting hardware and financial summaries, while still preserving those
records in the ledger.

## Depreciation And Purchase Date

Computer assets use `metadata.purchase.order_time` as the editable purchase date
for depreciation. When no explicit purchase date is available, `createdAt` is
used as the fallback.

The asset-value calculation prefers manually entered residual value when present.
If residual value is missing, it estimates current value using:

- purchase price
- purchase date
- default depreciation period in months
- default residual rate

The settings page keeps:

- 折旧年限
- 默认残值率

This is intended for financial estimation, not for replacing manual second-hand
valuation when finance has a more reliable number.

## Settings Page Cleanup

The settings page was narrowed to configuration that belongs there:

- client access base URL and token modal entry
- public query settings
- asset valuation defaults
- statistics scope
- dangerous uninstall data cleanup

The following items were removed from the main settings surface:

- client upload endpoint display, which remains available in the client access modal
- asset number prefix control, because ordinary users do not need to change it
- collection retention-days field, because the cleanup behavior is not currently implemented
- legacy data migration entry

The settings layout was also tightened:

- content is centered and width constrained
- switch rows use left explanation and right control
- uninstall cleanup is isolated under dangerous operations
- save action is sticky at the bottom of the settings form

## Legacy Data Compatibility Removal

The old "导入旧数据" path was removed from the admin UI.

The product no longer treats old plugin exports as a first-class compatibility
path. Historical one-off migration can still be done outside the product by
preparing data locally, but the admin UI should focus on the current v3 asset
model.

The old `metadata.legacy` and `metadata.importedHardware` product semantics were
replaced for new imports. Standard table imports write user-provided hardware
fields under:

```text
metadata.manualHardware
```

This keeps manually supplied hardware data usable for display, public lookup,
and hardware audit without implying legacy compatibility.

## Data Tools

A top-level 数据工具 tab was added. It separates human-facing table workflows from
admin backup workflows.

### Asset Table Import

Asset table import is CSV based.

The admin can:

- download a standard template
- choose import sections:
  - 基础信息
  - 财务信息
  - 手动硬件
- generate a preview
- import using one of three strategies:
  - 新增或更新
  - 只新增
  - 只更新

Asset number is the matching key. This is deliberate: the import tool is for the
current v3 asset ledger, not for guessing arbitrary old field names.

### Asset Table Export

Asset table export is CSV based and intended for finance, admin, and daily
ledger work.

Supported export ranges:

- current filtered result
- currently selected assets
- all computer devices
- all custom devices
- all assets

Supported field groups:

- 基础信息
- 财务信息
- 硬件信息
- 系统信息

CSV is used for the first implementation because it opens cleanly in Excel/WPS
and keeps the implementation simple. Real `.xlsx` export can be added later if
there is enough demand.

### JSON Backup Export

JSON backup export is an admin migration and archive tool, not a daily table
export.

It defaults to all business data and does not split by computer/custom device
because restore and archive workflows need related records to stay together.

Selectable sections:

- 设置
- 资产台账
- 设备匹配标识
- 变更记录
- 电脑采集快照

电脑采集快照 means client-uploaded hardware snapshots. They preserve historical
CPU, memory, disk, graphics, board, IP, OS, and collection-time data. They are
valuable for complete migration or retaining hardware history, but are not
needed for ordinary finance/admin table exports.

The JSON backup does not export client token secrets or public-query access-code
plaintext.

JSON restore/import was intentionally not added in this pass. Restore requires
separate design for overwrite vs merge, duplicate handling, identity conflicts,
token security, and historical event consistency.

## Verification

The implementation should continue to pass:

- `npm run lint`
- `npm run build`
- `npm run check:hardware-audit`
- `composer phpcs`
- `composer phpstan`
- `git diff --check`

