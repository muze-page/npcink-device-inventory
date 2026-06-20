# Device Data v2 Contract

## Status

Accepted baseline for the modernization work.

This document defines the current data contract for the Rust/Tauri uploader and
the WordPress plugin. Legacy rows are converted once by the admin migration
tool; new uploads and admin surfaces use this v2 shape only.

## Goals

1. Use one modern v2 structure for all new uploads.
2. Use the v2 stable device id as the database `uuid` for new uploads.
3. Stop treating system-derived entries as physical assets.
4. Let admin list, detail, statistics, and export read the same normalized data.
5. Preserve enough raw data for troubleshooting without using raw data for asset
   counts.

## Non-Goals

- Do not preserve a parallel legacy display or matching path after migration.
- Do not make every collected OS field visible in the UI.

## Upload Endpoint

New uploader path:

```text
POST /wp-json/npcink/v1/device-post-data-v2
```

Request body:

```json
{
  "name": "上传备注，可选",
  "data": {}
}
```

Authentication:

- The v2 uploader uses a client authorization code generated in the WordPress
  admin settings page.
- The authorization code is only entered once in the desktop uploader.
- The client derives an HMAC key from the authorization code and sends:
  `X-Npcink-Device-Token-Id`, `X-Npcink-Device-Timestamp`,
  `X-Npcink-Device-Nonce`, and `X-Npcink-Device-Signature`.
- The signature covers `timestamp + nonce + sha256(raw JSON body)`.
- The server rejects expired timestamps and repeated nonces.
- `name` is an optional upload note. It can contain the current user, desk,
  department, or other operator hint, but it is not used as the stable asset
  owner and does not participate in device identity matching.

The client sends the collector payload. The server is responsible for
normalizing the payload before storing it.

## Stored Data Shape

The stored `data` JSON contains three layers:

```json
{
  "_npcink_device": {},
  "asset": {},
  "raw": {}
}
```

### `_npcink_device`

Server-owned metadata. It is used for migration, audit, and future matching.

```json
{
  "schema_version": 2,
  "migration_source": "upload_v2",
  "legacy_uuid": "md5(uuid.hardware + uuid.macs[0])",
  "stable_device_id_v2": "v2-<29 hex chars>",
  "migration_updated_at": "2026-06-19 16:24:23",
  "collector": {
    "name": "npcink-device-agent",
    "runtime": "rust",
    "version": "0.1.0",
    "schema": "systeminformation-staticdata-compatible-v1",
    "collected_at": "2026-06-19T08:24:23Z"
  }
}
```

Rules:

- `stable_device_id_v2` is the database `uuid` matching value for new uploads.
- The server derives `stable_device_id_v2` from stable hardware identity first:
  hardware UUID, system UUID, system serial, baseboard serial, BIOS serial, then
  primary MAC as fallback.
- Known placeholder identities such as `Default string`, all-zero UUIDs, and
  repeated SMBIOS pseudo UUIDs are ignored.
- `legacy_uuid` is stored only as diagnostic metadata when it can be derived.
- `collector` is copied from the upload payload when available.
- The current database `uuid` column is 32 characters, so the stored v2 id uses
  `v2-` plus the first 29 hex characters of the SHA-256 fingerprint.

### `asset`

Canonical data for the admin UI, statistics, and export.

```json
{
  "identity": {
    "hardware_uuid": "C92BFA63-2689-5952-9415-363F20805F8A",
    "legacy_uuid": "c8490ec70529944c7e77a88411f781b0",
    "stable_device_id_v2": "v2-...",
    "primary_mac": "fe:82:ac:cb:6a:a8",
    "macs": ["fe:82:ac:cb:6a:a8"]
  },
  "upload": {
    "note": "张三",
    "reported_user": "张三",
    "uploaded_at": "2026-06-20 10:30:00"
  },
  "summary": {
    "device_model": "Apple MacBook Air",
    "os": "MacOS 26.5.1",
    "platform": "macos",
    "cpu": "Apple M5",
    "memory_bytes": 17179869184,
    "disk_bytes": 494332366848,
    "graphics": "Apple M5",
    "primary_ip": "192.168.6.106"
  },
  "hardware": {
    "cpu": {},
    "memory": {},
    "disks": [],
    "network": {},
    "graphics": {},
    "displays": [],
    "baseboard": {},
    "bios": {},
    "system": {}
  }
}
```

Admin surfaces read `asset`. Legacy rows without `asset` are converted by the
one-time migration tool.

### `asset.hardware.memory`

```json
{
  "total_bytes": 17179869184,
  "type": "Unified",
  "modules": [
    {
      "size_bytes": 17179869184,
      "type": "Unified",
      "bank": "Unified Memory",
      "manufacturer": "Apple",
      "part_number": "",
      "serial_number": ""
    }
  ]
}
```

Rules:

- Apple Silicon unified memory is represented as one module for reporting.
- Windows memory slots should remain separate modules when available.
- Admin statistics count total memory per device, not per slot, unless a future
  report explicitly asks for slot inventory.

### `asset.hardware.disks`

```json
[
  {
    "name": "Macintosh HD",
    "type": "SSD",
    "interface_type": "",
    "size_bytes": 494332366848,
    "serial_number": "",
    "mount": "/",
    "file_system": "apfs"
  }
]
```

Rules:

- This list means asset disks, not mounted filesystems.
- macOS APFS system/data volumes count as one disk.
- App DMG volumes such as `/Volumes/Npcink Device Agent` are excluded.
- `raw.filesystems` may keep all mounts for troubleshooting.
- Admin statistics count total asset disk capacity per device.

### `asset.hardware.network`

```json
{
  "primary": {
    "iface": "en0",
    "mac": "fe:82:ac:cb:6a:a8",
    "ip4": "192.168.6.106",
    "ip6": "fe80::cde:f849:482f:3db8",
    "default": true
  },
  "interfaces": []
}
```

Rules:

- `identity.primary_mac` must come from the primary routable interface when
  possible.
- Loopback, zero MAC, link-local-only tunnel interfaces, and obvious virtual
  interfaces do not become identity MACs.
- macOS interfaces such as `utun*`, `awdl*`, `llw*`, `anpi*`, `ap*`, `gif*`,
  `stf*`, and `bridge*` are marked virtual or ignored for identity.
- Extra interfaces may be kept for details, but not used for device identity.

### `raw`

`raw` keeps data that may be useful for diagnostics but should not drive normal
admin counts.

Recommended fields:

```json
{
  "filesystems": [],
  "platform": {},
  "source": {}
}
```

Examples:

- `filesystems`: full mount list, including APFS data volumes and mounted DMGs.
- `platform`: macOS `system_profiler` data or Windows CIM source data.
- `source`: original upload payload if a future migration needs it.

## Validation Rules

The v2 receiver should reject uploads when:

- HMAC authorization headers are missing or invalid.
- no stable device identity can be derived from hardware UUID, serial number, or
  primary network information.

The receiver should accept uploads with partial hardware information when the
identity fields are valid. Missing optional fields should render as empty states
instead of blocking upload.

## UI and Reporting Contract

Admin list cards:

- device model: `asset.summary.device_model`
- OS: `asset.summary.os`
- CPU: `asset.summary.cpu`
- memory: `asset.summary.memory_bytes`
- disk: `asset.summary.disk_bytes`
- graphics: `asset.summary.graphics`
- IP: `asset.summary.primary_ip`

Admin detail:

- read `asset.hardware.*`
- hide empty sections
- show raw data only in a diagnostic view if needed

Statistics:

- disk buckets use `asset.summary.disk_bytes`
- memory buckets use `asset.summary.memory_bytes`
- CPU and baseboard buckets use normalized manufacturer/model values

Export:

- use the same `asset.summary` and `asset.hardware` fields as the UI
- do not recalculate from raw mount lists

## Migration Plan

Old data migration will be handled later as a one-time offline process:

1. Export old rows.
2. Build `asset` from existing legacy fields.
3. Clean known issues:
   - duplicate macOS APFS disks
   - mounted app volumes counted as disks
   - invalid or noisy MAC lists
   - missing `memLayout` when `mem.total` exists
4. Preserve original JSON in a backup field or sidecar file.
5. Import verified rows back into WordPress.

No migration button is required before this contract is implemented and tested
with new uploads.

## Implementation Order

1. Add a WordPress normalizer that stores only `_npcink_device`, `asset`, and
   `raw`.
2. Update admin list, summary, detail, and export to read `asset`.
3. Keep Rust uploader focused on reliable collection and clean identity fields.
4. Re-run local v2 upload validation on macOS and Windows samples.
5. Only after the new structure is stable, run the one-time old data migration.
