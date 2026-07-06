<?php

if (!defined('ABSPATH')) {
	fwrite(STDERR, "Run this file with WP-CLI: wp eval-file scripts/wp-backup-restore-rehearsal.php\n");
	exit(1);
}

global $wpdb;

$prefix = 'RESTORE-E2E-' . gmdate('YmdHis');
$asset_number = $prefix . '-001';
$conflict_asset_number = $prefix . '-002';
$asset_uuid = wp_generate_uuid4();
$conflict_uuid = wp_generate_uuid4();
$identity_value = $prefix . '-SERIAL';
$root_dir = getenv('NPCINK_RESTORE_REHEARSAL_ROOT');

if (!$root_dir || !is_dir($root_dir)) {
	fwrite(STDERR, "NPCINK_RESTORE_REHEARSAL_ROOT is required.\n");
	exit(1);
}

if (!function_exists('rest_do_request')) {
	fwrite(STDERR, "WordPress REST API is not available.\n");
	exit(1);
}

$admins = get_users(array('role' => 'administrator', 'number' => 1, 'fields' => 'ID'));
if (empty($admins)) {
	fwrite(STDERR, "No administrator user found.\n");
	exit(1);
}
wp_set_current_user((int) $admins[0]);
rest_get_server();

if (!class_exists('Npcink_Device_Inventory_V3_Tables')) {
	fwrite(STDERR, "Npcink Device Inventory plugin is not loaded. Activate it before running this rehearsal.\n");
	exit(1);
}

$cleanup = function () use ($wpdb) {
	$assets_table = Npcink_Device_Inventory_V3_Tables::assets();
	$identities_table = Npcink_Device_Inventory_V3_Tables::identities();
	$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
	$events_table = Npcink_Device_Inventory_V3_Tables::events();
	$asset_ids = $wpdb->get_col(
		$wpdb->prepare("SELECT id FROM {$assets_table} WHERE asset_number LIKE %s", 'RESTORE-E2E-%')
	);
	if (!empty($asset_ids)) {
		$id_placeholders = implode(',', array_fill(0, count($asset_ids), '%d'));
		$asset_ids = array_map('intval', $asset_ids);
		// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Local rehearsal cleanup for plugin-owned tables.
		$wpdb->query($wpdb->prepare("DELETE FROM {$events_table} WHERE asset_id IN ({$id_placeholders})", $asset_ids));
		$wpdb->query($wpdb->prepare("DELETE FROM {$observations_table} WHERE asset_id IN ({$id_placeholders})", $asset_ids));
		$wpdb->query($wpdb->prepare("DELETE FROM {$identities_table} WHERE asset_id IN ({$id_placeholders})", $asset_ids));
		$wpdb->query($wpdb->prepare("DELETE FROM {$assets_table} WHERE id IN ({$id_placeholders})", $asset_ids));
		// phpcs:enable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	}
};

$request_restore = function ($backup, $dry_run) {
	$request = new WP_REST_Request('POST', '/npcink-device-inventory/v1/backup-restore');
	$request->set_header('content-type', 'application/json');
	$request->set_body(wp_json_encode(array('backup' => $backup, 'dryRun' => $dry_run)));
	$response = rest_do_request($request);
	if (is_wp_error($response)) {
		return $response;
	}
	return $response instanceof WP_REST_Response ? $response->get_data() : $response;
};

$assert = function ($condition, $message) {
	if (!$condition) {
		fwrite(STDERR, "Backup restore rehearsal failed: {$message}\n");
		exit(1);
	}
};

$cleanup();

$backup = array(
	'schema' => 'npcink-device-inventory/v3-admin-export',
	'exportedAt' => gmdate('c'),
	'settings' => array(
		'publicQueryPageSlug' => 'restore-e2e-public-search',
		'observationRetentionDays' => 30,
		'assetNumberPrefix' => 'E2E',
		'depreciationPeriodMonths' => 24,
		'defaultResidualRate' => 8,
		'countAvailableAssetsOnly' => true,
	),
	'assets' => array(
		array(
			'id' => 1,
			'uuid' => $asset_uuid,
			'assetType' => 'computer',
			'assetNumber' => $asset_number,
			'name' => 'Restore E2E Asset',
			'ownerName' => 'Restore E2E',
			'department' => 'QA',
			'status' => 'active',
			'category' => 'Laptop',
			'purchasePrice' => 100,
			'residualValue' => 10,
			'metadata' => array('restoreRehearsal' => true),
			'createdAt' => '2026-07-06T00:00:00+00:00',
			'updatedAt' => '2026-07-06T00:00:00+00:00',
		),
	),
	'identities' => array(
		array(
			'assetNumber' => $asset_number,
			'identities' => array(
				array('identityType' => 'serial', 'identityValue' => $identity_value, 'confidence' => 100, 'isPrimary' => true),
			),
		),
	),
	'observations' => array(
		array(
			'assetNumber' => $asset_number,
			'source' => 'restore_e2e',
			'schemaVersion' => 3,
			'observedAt' => '2026-07-06T00:10:00+00:00',
			'receivedAt' => '2026-07-06T00:11:00+00:00',
			'summary' => array('deviceName' => 'restore-e2e'),
			'hardware' => array('cpu' => array('model' => 'fixture')),
			'raw' => array('restoreRehearsal' => true),
		),
	),
	'events' => array(
		array(
			'assetNumber' => $asset_number,
			'eventSource' => 'restore_e2e',
			'eventType' => 'note',
			'message' => 'Restore rehearsal event',
			'payload' => array('restoreRehearsal' => true),
			'createdAt' => '2026-07-06T00:12:00+00:00',
		),
	),
);

$preview = $request_restore($backup, true);
$assert(is_array($preview) && empty($preview['data']['summary']['conflicts']), 'dry-run preview should succeed without conflicts');
$assert((int) $preview['data']['summary']['planned']['assetsCreated'] === 1, 'dry-run should plan one asset create');
$assert((int) $preview['data']['summary']['planned']['identitiesCreated'] === 1, 'dry-run should plan one identity create');

$import = $request_restore($backup, false);
$assert(is_array($import) && (int) $import['data']['summary']['imported']['assetsCreated'] === 1, 'import should create one asset');
$assert((int) $import['data']['summary']['imported']['identitiesCreated'] === 1, 'import should create one identity');
$assert((int) $import['data']['summary']['imported']['observationsCreated'] === 1, 'import should create one observation');
$assert((int) $import['data']['summary']['imported']['eventsCreated'] === 1, 'import should create one event');

$second_preview = $request_restore($backup, true);
$assert(is_array($second_preview) && (int) $second_preview['data']['summary']['planned']['assetsUpdated'] === 1, 'second dry-run should plan asset update');
$assert((int) $second_preview['data']['summary']['planned']['identitiesExisting'] === 1, 'second dry-run should identify existing identity');

$conflict_backup = $backup;
$conflict_backup['assets'] = array(
	array(
		'id' => 2,
		'uuid' => $conflict_uuid,
		'assetNumber' => $conflict_asset_number,
		'name' => 'Restore E2E Conflict Asset',
	),
);
$conflict_backup['identities'] = array(
	array(
		'assetNumber' => $conflict_asset_number,
		'identities' => array(
			array('identityType' => 'serial', 'identityValue' => $identity_value),
		),
	),
);

$conflict_preview = $request_restore($conflict_backup, true);
$assert(is_array($conflict_preview) && !empty($conflict_preview['data']['summary']['conflicts']), 'conflict dry-run should expose conflicts');

$conflict_import = $request_restore($conflict_backup, false);
$assert(is_array($conflict_import), 'conflict import should return a REST error response');
$assert(isset($conflict_import['code']) && $conflict_import['code'] === 'backup_conflicts', 'conflict import should use backup_conflicts');
$assert(isset($conflict_import['data']['status']) && (int) $conflict_import['data']['status'] === 409, 'conflict import should return 409');

$cleanup();

echo "Backup restore rehearsal verified {$asset_number}.\n";
