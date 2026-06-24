# Asset Data Model

## Status

Accepted direction for new development.

This model is the runtime contract for v3. Old export files are treated as
one-time migration inputs, not as runtime compatibility storage.

## Core Concepts

- Asset: the managed item, such as a computer, monitor, peripheral, account, or
  custom business device.
- Identity: a stable signal used to decide whether incoming data belongs to the
  same asset.
- Observation: a collected or imported snapshot of facts about an asset.
- Event: a human or system action that changed, explained, imported, or observed
  asset state.

## Tables

### `npcink_assets`

Canonical asset row.

Important fields:

- `uuid`: public asset identifier.
- `asset_type`: asset family, for example `pc`, `monitor`, `peripheral`, or
  `custom`.
- `asset_number`: human-facing asset number, unique across all assets.
- `name`, `owner_name`, `department`, `status`, `category`: normal list and
  filter fields.
- `purchase_price`, `residual_value`: financial summary fields.
- `metadata_json`: asset-type-specific fields that do not justify new columns.

### `npcink_asset_identities`

Identity claims for matching uploads and imports to assets.

Examples:

- `stable_device_id_v2`
- `hardware_uuid`
- `system_serial`
- `baseboard_serial`
- `bios_serial`
- `mac_address`
- `manual_asset_number`

`identity_type + identity_value` is globally unique so one physical identity
cannot silently point to two different assets.

### `npcink_asset_observations`

Collected snapshots. The current asset row should stay small and searchable;
large hardware data belongs here.

Typical sources:

- `uploader`
- `admin_import`
- `manual_entry`

`summary_json` keeps normalized display summaries, `hardware_json` keeps
structured hardware detail, and `raw_json` preserves source payloads for
debugging.

### `npcink_asset_events`

Unified timeline and audit log.

This table replaces the conceptual split between manual and automatic change
records. Use:

- `event_source`: `manual`, `system`, `upload`, `import`.
- `event_type`: `created`, `updated`, `field_changed`, `observation_received`,
  `merged`, `deleted`, or a narrower product event.
- `field_name`, `old_value`, `new_value`: field-level change data when relevant.
- `message`: human-readable note.
- `payload_json`: structured event-specific detail.

## Extension Rule

Do not add a new asset category by creating another asset table. Add an
`asset_type`, identities, observations, and events instead.

Old data should be converted into this model before import.
