<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Identity_Audit_Service
{
	private $observations;

	public function __construct(Npcink_Device_Inventory_Observation_Repository $observations)
	{
		$this->observations = $observations;
	}

	public function report($page, $page_size)
	{
		$groups = array();
		$insufficient_assets = 0;
		$audited_assets = 0;
		foreach ($this->observations->list_latest_identity_rows() as $row) {
			$identity = $this->identity_from_row($row);
			$audited_assets++;
			if ($identity['hardwareUuid'] === '' || $identity['primaryMac'] === '') {
				$insufficient_assets++;
			}
			if ($identity['hardwareUuid'] === '') {
				continue;
			}
			$key = strtolower($identity['hardwareUuid']);
			if (!isset($groups[$key])) {
				$groups[$key] = array(
					'groupKey' => 'hardware_uuid:' . $key,
					'hardwareUuid' => $identity['hardwareUuid'],
					'assets' => array(),
				);
			}
			$groups[$key]['assets'][] = array(
				'uuid' => (string) $row['asset_uuid'],
				'assetNumber' => (string) $row['asset_number'],
				'name' => (string) $row['asset_name'],
				'department' => (string) $row['department'],
				'ownerName' => (string) $row['owner_name'],
				'primaryMac' => $identity['primaryMac'],
				'stableDeviceIdV3' => $identity['stableDeviceIdV3'],
				'legacyDeviceIdV1' => $identity['legacyDeviceIdV1'],
				'observedAt' => (string) $row['observed_at'],
				'source' => (string) $row['source'],
				'schemaVersion' => intval($row['schema_version']),
			);
		}

		$conflict_groups = array();
		$same_composite_groups = array();
		foreach ($groups as $group) {
			if (count($group['assets']) < 2) {
				continue;
			}
			$macs = array_values(array_unique(array_filter(array_map(function ($asset) {
				return $asset['primaryMac'];
			}, $group['assets']))));
			$group['assetCount'] = count($group['assets']);
			$group['distinctMacCount'] = count($macs);
			$group['classification'] = count($macs) > 1 ? 'uuid_mac_conflict' : 'same_composite_identity';
			if ($group['classification'] === 'uuid_mac_conflict') {
				$conflict_groups[] = $group;
			} else {
				$same_composite_groups[] = $group;
			}
		}
		usort($conflict_groups, function ($left, $right) {
			return $right['assetCount'] <=> $left['assetCount'];
		});
		usort($same_composite_groups, function ($left, $right) {
			return $right['assetCount'] <=> $left['assetCount'];
		});
		$all_groups = array_merge($conflict_groups, $same_composite_groups);
		$page = max(1, intval($page));
		$page_size = max(1, min(100, intval($page_size)));
		$total = count($all_groups);
		return array(
			'summary' => array(
				'auditedAssets' => $audited_assets,
				'uuidMacConflictGroups' => count($conflict_groups),
				'sameCompositeGroups' => count($same_composite_groups),
				'insufficientIdentityAssets' => $insufficient_assets,
			),
			'groups' => array_slice($all_groups, ($page - 1) * $page_size, $page_size),
			'page' => $page,
			'pageSize' => $page_size,
			'total' => $total,
		);
	}

	private function identity_from_row($row)
	{
		$raw = json_decode(isset($row['raw_json']) ? $row['raw_json'] : '', true);
		$payload = is_array($raw) && isset($raw['observation']) && is_array($raw['observation']) ? $raw['observation'] : $raw;
		$asset = is_array($payload) && isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$identity = isset($asset['identity']) && is_array($asset['identity']) ? $asset['identity'] : array();
		$hardware = json_decode(isset($row['hardware_json']) ? $row['hardware_json'] : '', true);
		$system = is_array($hardware) && isset($hardware['system']) && is_array($hardware['system']) ? $hardware['system'] : array();
		$macs = isset($identity['macs']) && is_array($identity['macs']) ? $identity['macs'] : array();
		$primary_mac = isset($identity['primary_mac']) ? $identity['primary_mac'] : (isset($macs[0]) ? $macs[0] : '');
		return array(
			'hardwareUuid' => $this->text(isset($identity['hardware_uuid']) ? $identity['hardware_uuid'] : (isset($system['uuid']) ? $system['uuid'] : '')),
			'primaryMac' => $this->mac($primary_mac),
			'stableDeviceIdV3' => $this->text(isset($identity['stable_device_id_v3']) ? $identity['stable_device_id_v3'] : ''),
			'legacyDeviceIdV1' => $this->text(isset($identity['legacy_device_id_v1']) ? $identity['legacy_device_id_v1'] : ''),
		);
	}

	private function text($value)
	{
		return is_scalar($value) ? sanitize_text_field((string) $value) : '';
	}

	private function mac($value)
	{
		$value = strtolower(str_replace('-', ':', trim((string) $value)));
		return preg_match('/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/', $value) ? $value : '';
	}
}
