# WordPress.org Review Feedback - 2026-06-26

## Status

Accepted as release guardrail.

## Context

The WordPress.org review for `npcink-device-inventory` found two issues that were not caught by the previous local release checks:

- The built admin JavaScript contained a static Ajax endpoint path like `/api/wp-admin/admin-ajax.php`.
- Admin script data was localized to the generic global object `dataLocal`.

`composer phpcs`, `composer phpstan`, and Plugin Check / PCP can all pass while these issues still appear in source or bundled assets. Treat PCP as one gate, not the full WordPress.org review surface.

## Current Project Decision

The current runtime uses REST with a nonce supplied by PHP, so the admin app should not fetch `admin-ajax.php` to discover a nonce.

Admin data localized from PHP to JavaScript must use the plugin-specific global:

```text
npcinkDeviceInventoryData
```

Do not use generic globals such as:

```text
dataLocal
```

If a future feature genuinely needs admin Ajax, compute the endpoint in PHP with:

```php
admin_url('admin-ajax.php')
```

Then pass the computed URL to JavaScript through the prefixed localized object.

## Local Guardrail

The release gate now includes:

```bash
node scripts/check-wordpress-org-review-rules.mjs
node scripts/check-wordpress-org-review-rules.mjs release/npcink-device-inventory.zip sj/npcink-device-inventory.zip
```

This check scans source and package contents for:

- static `/wp-admin/admin-ajax.php` and `/api/wp-admin/admin-ajax.php` paths;
- legacy `dataLocal` references in runtime code;
- `wp_localize_script()` object names that do not use the `npcinkDeviceInventory` or `npcink_device_inventory` prefix.

Run `npm run check:release` before uploading a corrected package to WordPress.org.
