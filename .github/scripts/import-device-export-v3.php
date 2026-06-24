<?php
/**
 * One-off local importer for the legacy four-table JSON export.
 *
 * Usage:
 * NPCINK_IMPORT_DIR="设备数据备份" NPCINK_IMPORT_RESET=1 wp eval-file .github/scripts/import-device-export-v3.php
 */

if (!defined('ABSPATH')) {
	fwrite(STDERR, "This script must run through WP-CLI eval-file.\n");
	exit(1);
}

global $wpdb;

$import_dir = getenv('NPCINK_IMPORT_DIR');
if (!$import_dir) {
	$import_dir = dirname(__DIR__, 2) . '/设备数据备份';
} elseif (!str_starts_with($import_dir, '/')) {
	$import_dir = dirname(__DIR__, 2) . '/' . $import_dir;
}

if (!is_dir($import_dir)) {
	npcink_import_fail("Import directory not found: $import_dir");
}

$tables = array(
	'assets' => $wpdb->prefix . 'npcink_assets',
	'identities' => $wpdb->prefix . 'npcink_asset_identities',
	'observations' => $wpdb->prefix . 'npcink_asset_observations',
	'events' => $wpdb->prefix . 'npcink_asset_events',
);

if (getenv('NPCINK_IMPORT_RESET')) {
	npcink_import_log('Resetting v3 tables...');
	foreach (array('events', 'observations', 'identities', 'assets') as $key) {
		$wpdb->query('TRUNCATE TABLE `' . esc_sql($tables[$key]) . '`');
	}
}

$exports = npcink_import_load_exports($import_dir);
$pc_rows = $exports['npcink_device_pc']['data'] ?? array();
$style_rows = $exports['npcink_device_style']['data'] ?? array();
$manual_rows = $exports['npcink_device_manual']['data'] ?? array();
$auto_rows = $exports['npcink_device_auto']['data'] ?? array();

$stats = array(
	'assets_pc' => 0,
	'assets_custom' => 0,
	'identities' => 0,
	'observations' => 0,
	'events' => 0,
	'manual_events_skipped' => 0,
	'auto_events_skipped' => 0,
	'json_warnings' => 0,
);

$used_asset_numbers = npcink_import_existing_values($tables['assets'], 'asset_number');
$used_uuids = npcink_import_existing_values($tables['assets'], 'uuid');
$legacy_uuid_to_asset_id = array();

foreach ($pc_rows as $row) {
	$parsed = npcink_import_decode_json($row['data'] ?? '', $stats);
	$legacy_uuid = npcink_import_text($row['uuid'] ?? '');
	$uuid = npcink_import_unique_uuid($legacy_uuid, $used_uuids);
	$asset_number = npcink_import_unique_asset_number($row['number'] ?? '', 'PC-' . ($row['id'] ?? ''), $used_asset_numbers);
	$summary = npcink_import_pc_summary($row, $parsed);
	$created_at = npcink_import_datetime($row['created_at'] ?? '');
	$updated_at = npcink_import_datetime($row['updated_at'] ?? $created_at);

	$asset_id = npcink_import_insert_asset(
		$tables['assets'],
		array(
			'uuid' => $uuid,
			'asset_type' => 'pc',
			'asset_number' => $asset_number,
			'name' => $summary['device_model'] ?: (($row['name'] ?? '') ?: ('PC ' . $asset_number)),
			'owner_name' => $row['name'] ?? '',
			'department' => $row['department'] ?? '',
			'status' => npcink_import_status($row['state'] ?? ''),
			'category' => 'computer',
			'purchase_price' => $row['purchase'] ?? 0,
			'residual_value' => $row['depreciation'] ?? 0,
			'metadata_json' => npcink_import_json(
				array(
					'legacy' => npcink_import_without_data($row, 'npcink_device_pc'),
					'finance' => array(
						'purchase' => $row['purchase'] ?? '',
						'depreciation' => $row['depreciation'] ?? '',
					),
				)
			),
			'created_at' => $created_at,
			'updated_at' => $updated_at,
		)
	);

	$stats['assets_pc']++;
	if ($legacy_uuid) {
		$legacy_uuid_to_asset_id[$legacy_uuid] = $asset_id;
	}

	$stats['identities'] += npcink_import_insert_identity($tables['identities'], $asset_id, 'legacy_uuid', $legacy_uuid, 100, 'legacy_import', 1);
	$stats['identities'] += npcink_import_insert_identity($tables['identities'], $asset_id, 'asset_number', $asset_number, 95, 'legacy_import', 0);
	foreach (npcink_import_pc_identities($parsed) as $identity) {
		$stats['identities'] += npcink_import_insert_identity(
			$tables['identities'],
			$asset_id,
			$identity['type'],
			$identity['value'],
			$identity['confidence'],
			'legacy_import',
			0
		);
	}

	npcink_import_insert_observation(
		$tables['observations'],
		$asset_id,
		array(
			'source' => 'legacy_import',
			'schema_version' => 3,
			'observed_at' => $updated_at,
			'received_at' => $updated_at,
			'summary_json' => npcink_import_json($summary),
			'hardware_json' => npcink_import_json(npcink_import_pc_hardware($parsed)),
			'raw_json' => npcink_import_json(array('legacy_row' => $row, 'parsed_data' => $parsed)),
		)
	);
	$stats['observations']++;

	npcink_import_insert_event(
		$tables['events'],
		$asset_id,
		array(
			'event_source' => 'legacy_import',
			'event_type' => 'imported',
			'message' => 'Legacy PC asset imported.',
			'payload_json' => npcink_import_json(npcink_import_without_data($row, 'npcink_device_pc')),
			'created_at' => $created_at,
		)
	);
	$stats['events']++;
}

foreach ($style_rows as $row) {
	$parsed = npcink_import_decode_json($row['data'] ?? '', $stats);
	$legacy_uuid = npcink_import_text($row['uuid'] ?? '');
	$uuid = npcink_import_unique_uuid($legacy_uuid, $used_uuids);
	$asset_number = npcink_import_unique_asset_number($row['number'] ?? '', 'CUSTOM-' . ($row['id'] ?? ''), $used_asset_numbers);
	$created_at = npcink_import_datetime($row['created_at'] ?? '');
	$name = npcink_import_text($parsed['title'] ?? '') ?: npcink_import_text($row['name'] ?? '') ?: ('Custom ' . $asset_number);

	$asset_id = npcink_import_insert_asset(
		$tables['assets'],
		array(
			'uuid' => $uuid,
			'asset_type' => 'custom',
			'asset_number' => $asset_number,
			'name' => $name,
			'owner_name' => $row['name'] ?? '',
			'department' => '',
			'status' => npcink_import_status($row['state'] ?? ''),
			'category' => $row['category'] ?? '',
			'purchase_price' => $parsed['total'] ?? 0,
			'residual_value' => 0,
			'metadata_json' => npcink_import_json(
				array(
					'legacy' => npcink_import_without_data($row, 'npcink_device_style'),
					'purchase' => $parsed,
					'purpose' => $row['purpose'] ?? '',
				)
			),
			'created_at' => $created_at,
			'updated_at' => $created_at,
		)
	);

	$stats['assets_custom']++;
	if ($legacy_uuid) {
		$legacy_uuid_to_asset_id[$legacy_uuid] = $asset_id;
	}

	$stats['identities'] += npcink_import_insert_identity($tables['identities'], $asset_id, 'legacy_uuid', $legacy_uuid, 100, 'legacy_import', 1);
	$stats['identities'] += npcink_import_insert_identity($tables['identities'], $asset_id, 'asset_number', $asset_number, 95, 'legacy_import', 0);
	$stats['identities'] += npcink_import_insert_identity($tables['identities'], $asset_id, 'order_number', $parsed['order'] ?? '', 80, 'legacy_import', 0);

	$summary = array(
		'device_model' => $name,
		'category' => npcink_import_text($row['category'] ?? ''),
		'platform' => npcink_import_text($parsed['platform'] ?? ''),
		'primary_ip' => '',
		'os_label' => '',
		'cpu' => '',
		'memory_bytes' => 0,
		'disk_bytes' => 0,
	);

	npcink_import_insert_observation(
		$tables['observations'],
		$asset_id,
		array(
			'source' => 'legacy_import',
			'schema_version' => 3,
			'observed_at' => $created_at,
			'received_at' => $created_at,
			'summary_json' => npcink_import_json($summary),
			'hardware_json' => npcink_import_json(array('custom' => $parsed)),
			'raw_json' => npcink_import_json(array('legacy_row' => $row, 'parsed_data' => $parsed)),
		)
	);
	$stats['observations']++;

	npcink_import_insert_event(
		$tables['events'],
		$asset_id,
		array(
			'event_source' => 'legacy_import',
			'event_type' => 'imported',
			'message' => 'Legacy custom asset imported.',
			'payload_json' => npcink_import_json(npcink_import_without_data($row, 'npcink_device_style')),
			'created_at' => $created_at,
		)
	);
	$stats['events']++;
}

foreach ($manual_rows as $row) {
	$asset_id = $legacy_uuid_to_asset_id[npcink_import_text($row['record_uuid'] ?? '')] ?? 0;
	if (!$asset_id) {
		$stats['manual_events_skipped']++;
		continue;
	}
	npcink_import_insert_event(
		$tables['events'],
		$asset_id,
		array(
			'event_source' => 'legacy_manual',
			'event_type' => npcink_import_event_type($row['type'] ?? 'manual'),
			'message' => $row['data'] ?? '',
			'actor_name' => $row['user'] ?? '',
			'payload_json' => npcink_import_json($row),
			'created_at' => npcink_import_datetime($row['created_at'] ?? ''),
		)
	);
	$stats['events']++;
}

foreach ($auto_rows as $row) {
	$asset_id = $legacy_uuid_to_asset_id[npcink_import_text($row['record_uuid'] ?? '')] ?? 0;
	if (!$asset_id) {
		$stats['auto_events_skipped']++;
		continue;
	}
	npcink_import_insert_event(
		$tables['events'],
		$asset_id,
		array(
			'event_source' => 'legacy_auto',
			'event_type' => 'field_changed',
			'field_name' => $row['column_name'] ?? '',
			'old_value' => $row['old_value'] ?? '',
			'new_value' => $row['new_value'] ?? '',
			'message' => 'Legacy ' . ($row['table_name'] ?? 'record') . '.' . ($row['column_name'] ?? 'field') . ' changed.',
			'payload_json' => npcink_import_json($row),
			'created_at' => npcink_import_datetime($row['changed_at'] ?? ''),
		)
	);
	$stats['events']++;
}

npcink_import_log('Import complete:');
foreach ($stats as $key => $value) {
	npcink_import_log("  $key: $value");
}

function npcink_import_load_exports($import_dir)
{
	$exports = array();
	foreach (glob($import_dir . '/*.json') ?: array() as $file) {
		$contents = file_get_contents($file);
		$data = json_decode($contents, true);
		if (!is_array($data) || empty($data['name']) || !isset($data['data']) || !is_array($data['data'])) {
			npcink_import_fail("Invalid export file: $file");
		}
		$exports[$data['name']] = $data;
	}

	foreach (array('npcink_device_pc', 'npcink_device_style', 'npcink_device_manual', 'npcink_device_auto') as $required) {
		if (!isset($exports[$required])) {
			npcink_import_fail("Missing export: $required");
		}
	}

	return $exports;
}

function npcink_import_existing_values($table, $column)
{
	global $wpdb;
	$values = $wpdb->get_col('SELECT `' . esc_sql($column) . '` FROM `' . esc_sql($table) . '`');
	return array_fill_keys(array_map('strval', $values ?: array()), true);
}

function npcink_import_decode_json($json, &$stats)
{
	if (!is_string($json) || trim($json) === '') {
		return array();
	}
	$data = json_decode($json, true);
	if (!is_array($data)) {
		$stats['json_warnings']++;
		return array();
	}
	return $data;
}

function npcink_import_unique_uuid($legacy_uuid, &$used_uuids)
{
	$uuid = npcink_import_text($legacy_uuid);
	if ($uuid === '' || isset($used_uuids[$uuid])) {
		do {
			$uuid = wp_generate_uuid4();
		} while (isset($used_uuids[$uuid]));
	}
	$used_uuids[$uuid] = true;
	return $uuid;
}

function npcink_import_unique_asset_number($candidate, $fallback, &$used_asset_numbers)
{
	$base = npcink_import_text($candidate);
	if ($base === '') {
		$base = npcink_import_text($fallback);
	}
	$base = substr($base, 0, 54);
	$value = $base;
	$i = 2;
	while (isset($used_asset_numbers[$value])) {
		$suffix = '-' . $i;
		$value = substr($base, 0, 64 - strlen($suffix)) . $suffix;
		$i++;
	}
	$used_asset_numbers[$value] = true;
	return $value;
}

function npcink_import_insert_asset($table, $row)
{
	global $wpdb;
	$ok = $wpdb->insert(
		$table,
		$row,
		array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s', '%s', '%s')
	);
	if ($ok === false) {
		npcink_import_fail('Asset insert failed: ' . $wpdb->last_error);
	}
	return (int) $wpdb->insert_id;
}

function npcink_import_insert_identity($table, $asset_id, $type, $value, $confidence, $source, $is_primary)
{
	global $wpdb;
	$value = npcink_import_text($value);
	if ($value === '') {
		return 0;
	}
	$wpdb->query(
		$wpdb->prepare(
			'INSERT IGNORE INTO `' . esc_sql($table) . '` (asset_id, identity_type, identity_value, confidence, is_primary, source) VALUES (%d, %s, %s, %f, %d, %s)',
			$asset_id,
			sanitize_key($type),
			substr($value, 0, 191),
			(float) $confidence,
			$is_primary ? 1 : 0,
			sanitize_key($source)
		)
	);
	return $wpdb->rows_affected > 0 ? 1 : 0;
}

function npcink_import_insert_observation($table, $asset_id, $row)
{
	global $wpdb;
	$row = array_merge(array('asset_id' => $asset_id), $row);
	$ok = $wpdb->insert(
		$table,
		$row,
		array('%d', '%s', '%d', '%s', '%s', '%s', '%s', '%s')
	);
	if ($ok === false) {
		npcink_import_fail('Observation insert failed: ' . $wpdb->last_error);
	}
}

function npcink_import_insert_event($table, $asset_id, $data)
{
	global $wpdb;
	$row = array(
		'asset_id' => $asset_id ?: null,
		'event_source' => sanitize_key($data['event_source'] ?? 'legacy_import'),
		'event_type' => sanitize_key($data['event_type'] ?? 'event'),
		'field_name' => npcink_import_text($data['field_name'] ?? ''),
		'old_value' => (string) ($data['old_value'] ?? ''),
		'new_value' => (string) ($data['new_value'] ?? ''),
		'message' => (string) ($data['message'] ?? ''),
		'actor_user_id' => null,
		'actor_name' => npcink_import_text($data['actor_name'] ?? ''),
		'payload_json' => $data['payload_json'] ?? npcink_import_json(array()),
		'created_at' => npcink_import_datetime($data['created_at'] ?? ''),
	);
	$ok = $wpdb->insert(
		$table,
		$row,
		array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s')
	);
	if ($ok === false) {
		npcink_import_fail('Event insert failed: ' . $wpdb->last_error);
	}
}

function npcink_import_pc_summary($row, $data)
{
	$system = is_array($data['system'] ?? null) ? $data['system'] : array();
	$os = is_array($data['os'] ?? null) ? $data['os'] : array();
	$cpu = is_array($data['cpu'] ?? null) ? $data['cpu'] : array();
	$model_parts = array_filter(array(npcink_import_text($system['manufacturer'] ?? ''), npcink_import_text($system['model'] ?? '')));
	$memory_bytes = 0;
	foreach (($data['memLayout'] ?? array()) as $mem) {
		if (is_array($mem)) {
			$memory_bytes += (int) ($mem['size'] ?? 0);
		}
	}
	$disk_bytes = 0;
	foreach (($data['diskLayout'] ?? array()) as $disk) {
		if (is_array($disk)) {
			$disk_bytes += (int) ($disk['size'] ?? 0);
		}
	}

	return array(
		'device_model' => implode(' ', $model_parts),
		'hostname' => npcink_import_text($os['hostname'] ?? ''),
		'os_label' => npcink_import_text($os['distro'] ?? $os['platform'] ?? ''),
		'platform' => npcink_import_text($os['platform'] ?? ''),
		'cpu' => npcink_import_text($cpu['brand'] ?? ''),
		'memory_bytes' => $memory_bytes,
		'disk_bytes' => $disk_bytes,
		'primary_ip' => npcink_import_primary_ip($row, $data),
	);
}

function npcink_import_primary_ip($row, $data)
{
	$legacy_ip = npcink_import_text($row['ip'] ?? '');
	if ($legacy_ip !== '') {
		return $legacy_ip;
	}
	foreach (($data['net'] ?? array()) as $net) {
		if (is_array($net) && !empty($net['ip4']) && empty($net['internal'])) {
			return npcink_import_text($net['ip4']);
		}
	}
	return '';
}

function npcink_import_pc_hardware($data)
{
	return array(
		'os' => $data['os'] ?? array(),
		'cpu' => $data['cpu'] ?? array(),
		'memory' => $data['memLayout'] ?? array(),
		'disks' => $data['diskLayout'] ?? array(),
		'network' => $data['net'] ?? array(),
		'graphics' => $data['graphics'] ?? array(),
		'bios' => $data['bios'] ?? array(),
		'system' => $data['system'] ?? array(),
		'baseboard' => $data['baseboard'] ?? array(),
		'chassis' => $data['chassis'] ?? array(),
		'uuid' => $data['uuid'] ?? array(),
	);
}

function npcink_import_pc_identities($data)
{
	$identities = array();
	$map = array(
		array('hardware_uuid', $data['uuid']['hardware'] ?? '', 98),
		array('system_uuid', $data['system']['uuid'] ?? '', 96),
		array('system_serial', $data['system']['serial'] ?? '', 90),
		array('bios_serial', $data['bios']['serial'] ?? '', 86),
		array('baseboard_serial', $data['baseboard']['serial'] ?? '', 84),
	);
	foreach ($map as $item) {
		if (npcink_import_text($item[1]) !== '') {
			$identities[] = array('type' => $item[0], 'value' => $item[1], 'confidence' => $item[2]);
		}
	}
	foreach (($data['uuid']['macs'] ?? array()) as $mac) {
		if (npcink_import_text($mac) !== '') {
			$identities[] = array('type' => 'mac_address', 'value' => strtolower($mac), 'confidence' => 92);
		}
	}
	foreach (($data['net'] ?? array()) as $net) {
		if (is_array($net) && npcink_import_text($net['mac'] ?? '') !== '' && $net['mac'] !== '00:00:00:00:00:00') {
			$identities[] = array('type' => 'mac_address', 'value' => strtolower($net['mac']), 'confidence' => 88);
		}
	}
	return $identities;
}

function npcink_import_without_data($row, $source_table)
{
	$copy = $row;
	unset($copy['data']);
	$copy['source_table'] = $source_table;
	return $copy;
}

function npcink_import_status($status)
{
	$value = strtolower(trim((string) $status));
	if (in_array($value, array('使用', 'apply', 'active', 'in_use'), true)) {
		return 'active';
	}
	if (in_array($value, array('闲置', 'idle', 'idie', 'inactive'), true)) {
		return 'inactive';
	}
	if (in_array($value, array('报废', 'scrap', 'retired'), true)) {
		return 'retired';
	}
	if (in_array($value, array('维修', '维护', '故障', 'maintenance'), true)) {
		return 'maintenance';
	}
	return 'active';
}

function npcink_import_event_type($value)
{
	$type = sanitize_key($value);
	return $type ?: 'manual';
}

function npcink_import_datetime($value)
{
	$value = trim((string) $value);
	if ($value === '') {
		return current_time('mysql');
	}
	$time = strtotime($value);
	if (!$time) {
		return current_time('mysql');
	}
	return gmdate('Y-m-d H:i:s', $time);
}

function npcink_import_text($value)
{
	if (is_scalar($value)) {
		return trim(wp_strip_all_tags((string) $value));
	}
	return '';
}

function npcink_import_json($value)
{
	return wp_json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function npcink_import_log($message)
{
	if (class_exists('WP_CLI')) {
		WP_CLI::log($message);
		return;
	}
	fwrite(STDOUT, $message . "\n");
}

function npcink_import_fail($message)
{
	if (class_exists('WP_CLI')) {
		WP_CLI::error($message);
	}
	fwrite(STDERR, $message . "\n");
	exit(1);
}
