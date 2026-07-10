<?php

define('ABSPATH', __DIR__ . '/');

function sanitize_text_field($value) {
	return trim((string) $value);
}

class Npcink_Device_Inventory_Observation_Repository
{
	private $rows;

	public function __construct($rows)
	{
		$this->rows = $rows;
	}

	public function list_latest_identity_rows()
	{
		return $this->rows;
	}
}

require_once __DIR__ . '/../includes/v3/services/class-npcink-device-inventory-identity-extractor.php';
require_once __DIR__ . '/../includes/v3/services/class-npcink-device-inventory-device-identity-service.php';
require_once __DIR__ . '/../includes/v3/services/class-npcink-device-inventory-identity-audit-service.php';

function npcink_identity_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Identity compatibility fixture failed: {$message}\n");
		exit(1);
	}
}

$extractor = new Npcink_Device_Inventory_Identity_Extractor();
$identities = $extractor->extract(array(
	'_npcink_device' => array('device_uuid_v1' => 'device-v1-example', 'stable_device_id_v3' => 'v3-example', 'stable_device_id_v2' => 'v2-example'),
	'asset' => array(
		'identity' => array('legacy_device_id_v1' => 'legacy-example', 'hardware_uuid' => 'HW-SHARED', 'primary_mac' => 'aa:bb:cc:dd:ee:01'),
		'hardware' => array('system' => array('uuid' => 'HW-SHARED')),
	),
));
npcink_identity_assert($identities[0]['type'] === 'device_uuid_v1', 'canonical device identity must be the first matching identity');
npcink_identity_assert(in_array('legacy_device_id_v1', array_column($identities, 'type'), true), 'legacy V1 identity must remain available as a compatibility signal');

$device_identity = new Npcink_Device_Inventory_Device_Identity_Service();
$board_observation = array(
	'asset' => array(
		'identity' => array('hardware_uuid' => ' BOARD-UUID '),
		'hardware' => array(
			'baseboard' => array('manufacturer' => ' Example  Inc ', 'product' => 'Board Pro', 'serial' => 'BOARD-001'),
		),
	),
);
$board_uuid = $device_identity->from_observation($board_observation);
npcink_identity_assert($board_uuid['value'] !== '', 'a valid motherboard fingerprint must generate a device UUID');
npcink_identity_assert($board_uuid['value'] === 'device-v1-8c8a3dad23be3fc4e958ca4c94cea', 'PHP calculation must match the cross-end device UUID contract fixture');
$replaced_disk_observation = $board_observation;
$replaced_disk_observation['asset']['hardware']['disk'] = array(array('serial' => 'replacement-disk'));
npcink_identity_assert($device_identity->from_observation($replaced_disk_observation)['value'] === $board_uuid['value'], 'replaceable disk data must not change device UUID');
$new_board_observation = $board_observation;
$new_board_observation['asset']['hardware']['baseboard']['serial'] = 'BOARD-002';
npcink_identity_assert($device_identity->from_observation($new_board_observation)['value'] !== $board_uuid['value'], 'changing the motherboard must create a new device UUID');

$row = function ($uuid, $number, $mac) {
	return array(
		'asset_uuid' => $uuid,
		'asset_number' => $number,
		'asset_name' => $number,
		'department' => '测试部',
		'owner_name' => '',
		'observed_at' => '2026-07-10 12:00:00',
		'source' => 'fixture',
		'schema_version' => 3,
		'hardware_json' => wp_json_encode(array('system' => array('uuid' => 'HW-SHARED'))),
		'raw_json' => wp_json_encode(array('asset' => array('identity' => array('hardware_uuid' => 'HW-SHARED', 'primary_mac' => $mac)))),
	);
};

function wp_json_encode($value) {
	return json_encode($value);
}

$audit = new Npcink_Device_Inventory_Identity_Audit_Service(
	new Npcink_Device_Inventory_Observation_Repository(array(
		$row('asset-one', 'ONE', 'aa:bb:cc:dd:ee:01'),
		$row('asset-two', 'TWO', 'aa:bb:cc:dd:ee:02'),
	))
);
$report = $audit->report(1, 20);
npcink_identity_assert($report['summary']['uuidMacConflictGroups'] === 1, 'same UUID with distinct MACs must be classified as a historical identity conflict');
npcink_identity_assert($report['groups'][0]['classification'] === 'uuid_mac_conflict', 'audit must not call a UUID/MAC mismatch a duplicate device');

echo "Identity compatibility fixture checks passed.\n";
