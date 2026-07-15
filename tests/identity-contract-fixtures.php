<?php

define('ABSPATH', __DIR__ . '/');

function sanitize_text_field($value)
{
	return trim((string) $value);
}

require_once __DIR__ . '/../includes/v3/services/class-npcink-device-inventory-device-identity-service.php';

function npcink_identity_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Identity contract fixture failed: {$message}\n");
		exit(1);
	}
}

$service = new Npcink_Device_Inventory_Device_Identity_Service();
$canonical_observation = array(
	'_npcink_device' => array(
		'device_uuid_v1' => 'client-value-must-not-be-trusted',
		'fallback_device_v1' => 'client-fallback-must-not-be-trusted',
	),
	'asset' => array(
		'identity' => array('device_uuid_v1' => 'another-client-value'),
		'hardware' => array(
			'hardwareUuid' => ' BOARD-UUID ',
			'system' => array('uuid' => ' BOARD-UUID '),
			'baseboard' => array(
				'manufacturer' => ' Example  Inc ',
				'product' => 'Board Pro',
				'serial' => 'BOARD-001',
			),
			'network' => array(
				'primary' => array('mac' => 'aa:bb:cc:dd:ee:01', 'virtual' => false, 'internal' => false),
			),
		),
	),
);
$canonical = $service->primary_identity($canonical_observation);
npcink_identity_assert($canonical['type'] === 'device_uuid_v1', 'canonical motherboard identity must be preferred');
npcink_identity_assert($canonical['value'] === 'device-v1-8c8a3dad23be3fc4e958ca4c94cea', 'PHP canonical identity must match the Rust fixture');
npcink_identity_assert($canonical['value'] !== 'client-value-must-not-be-trusted', 'client-declared identity must be ignored');

$fallback_observation = array(
	'asset' => array(
		'hardware' => array(
			'hardwareUuid' => 'HW-SHARED',
			'network' => array(
				'primary' => array('mac' => 'aa:bb:cc:dd:ee:01', 'virtual' => false, 'internal' => false),
			),
		),
	),
);
$fallback = $service->primary_identity($fallback_observation);
npcink_identity_assert($fallback['type'] === 'fallback_device_v1', 'fallback identity must be used when motherboard facts are incomplete');
npcink_identity_assert($fallback['value'] === 'fallback-v1-a6987ef89bdc403942b084ff7ba72', 'PHP fallback identity must match the Rust fixture');

$different_mac = $fallback_observation;
$different_mac['asset']['hardware']['network']['primary']['mac'] = 'aa:bb:cc:dd:ee:02';
npcink_identity_assert($service->primary_identity($different_mac)['value'] !== $fallback['value'], 'physical MAC must separate shared hardware UUIDs');

$virtual_only = $fallback_observation;
$virtual_only['asset']['hardware']['network']['primary']['virtual'] = true;
$missing = $service->primary_identity($virtual_only);
npcink_identity_assert($missing['type'] === '' && $missing['value'] === '', 'a virtual-only MAC must not produce an identity');

$invalid_fixture = json_decode(file_get_contents(__DIR__ . '/fixtures/device-identity-invalid-values.json'), true);
npcink_identity_assert(is_array($invalid_fixture) && !empty($invalid_fixture['invalidValues']), 'shared invalid identity fixture must load');
foreach ($invalid_fixture['invalidValues'] as $invalid_value) {
	$invalid_canonical = $canonical_observation;
	$invalid_canonical['asset']['hardware']['baseboard']['serial'] = $invalid_value;
	npcink_identity_assert(
		$service->from_observation($invalid_canonical)['value'] === '',
		'PHP canonical identity must reject shared invalid value: ' . $invalid_value
	);

	$invalid_fallback = $fallback_observation;
	$invalid_fallback['asset']['hardware']['hardwareUuid'] = $invalid_value;
	npcink_identity_assert(
		$service->fallback_from_observation($invalid_fallback)['value'] === '',
		'PHP fallback identity must reject shared invalid value: ' . $invalid_value
	);
}

echo "Identity contract fixture checks passed.\n";
