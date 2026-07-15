<?php

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Recomputes the canonical motherboard-backed identity from each asset's most
 * recent observation. This service never merges assets: ambiguous values stay
 * visible for review and only one-to-one candidates can be written.
 */
class Npcink_Device_Inventory_Device_Identity_Reconciliation_Service
{
	private $observations;
	private $identities;
	private $events;
	private $device_identity;

	public function __construct(
		Npcink_Device_Inventory_Observation_Repository $observations,
		Npcink_Device_Inventory_Identity_Repository $identities,
		Npcink_Device_Inventory_Event_Service $events,
		Npcink_Device_Inventory_Device_Identity_Service $device_identity
	) {
		$this->observations = $observations;
		$this->identities = $identities;
		$this->events = $events;
		$this->device_identity = $device_identity;
	}

	public function preview($page, $page_size)
	{
		$items = $this->build_items();
		$page = max(1, intval($page));
		$page_size = max(1, min(100, intval($page_size)));
		$total = count($items);
		return array(
			'summary' => $this->summary($items),
			'items' => array_slice($items, ($page - 1) * $page_size, $page_size),
			'page' => $page,
			'pageSize' => $page_size,
			'total' => $total,
		);
	}

	public function apply()
	{
		$items = $this->build_items();
		$result = array(
			'written' => 0,
			'already' => 0,
			'collisions' => 0,
			'insufficient' => 0,
			'failed' => 0,
		);
		foreach ($items as $item) {
			if ($item['status'] === 'already') {
				$result['already']++;
				continue;
			}
			if ($item['status'] === 'collision') {
				$result['collisions']++;
				continue;
			}
			if ($item['status'] !== 'ready') {
				$result['insufficient']++;
				continue;
			}

			$claim = $this->identities->claim(
				intval($item['assetId']),
				array(
					'type' => Npcink_Device_Inventory_Device_Identity_Service::TYPE,
					'value' => $item['deviceUuid'],
					'confidence' => 100,
					'source' => 'reconciliation',
				),
				true
			);
			if ($claim['status'] === Npcink_Device_Inventory_Identity_Repository::CLAIM_INSERTED) {
				$result['written']++;
				$this->events->record(
					intval($item['assetId']),
					'system',
					'identity_reconciled',
					'Canonical motherboard-backed device UUID written from the latest observation.',
					array('identityType' => Npcink_Device_Inventory_Device_Identity_Service::TYPE, 'identityValue' => $item['deviceUuid'])
				);
			} elseif ($claim['status'] === Npcink_Device_Inventory_Identity_Repository::CLAIM_OWNED) {
				$result['already']++;
			} elseif ($claim['status'] === Npcink_Device_Inventory_Identity_Repository::CLAIM_CONFLICT) {
				$result['collisions']++;
			} else {
				$result['failed']++;
			}
		}
		return $result;
	}

	private function build_items()
	{
		$items = array();
		$counts = array();
		foreach ($this->observations->list_latest_identity_rows() as $row) {
			$identity = $this->identity_from_row($row);
			$candidate = $this->device_identity->from_parts($identity['identity'], $identity['hardware']);
			$item = array(
				'assetId' => intval($row['asset_id']),
				'assetUuid' => (string) $row['asset_uuid'],
				'assetNumber' => (string) $row['asset_number'],
				'name' => (string) $row['asset_name'],
				'department' => (string) $row['department'],
				'observedAt' => (string) $row['observed_at'],
				'deviceUuid' => $candidate['value'],
				'status' => $candidate['value'] === '' ? 'insufficient' : 'ready',
				'reason' => $candidate['reason'],
			);
			$items[] = $item;
			if ($candidate['value'] !== '') {
				$counts[$candidate['value']] = isset($counts[$candidate['value']]) ? $counts[$candidate['value']] + 1 : 1;
			}
		}

		$owners = $this->identities->find_asset_ids_by_identity_values(Npcink_Device_Inventory_Device_Identity_Service::TYPE, array_keys($counts));
		foreach ($items as &$item) {
			if ($item['status'] !== 'ready') {
				continue;
			}
			if ($counts[$item['deviceUuid']] > 1) {
				$item['status'] = 'collision';
				$item['reason'] = 'same_device_uuid_in_multiple_assets';
				continue;
			}
			$owner = isset($owners[$item['deviceUuid']]) ? $owners[$item['deviceUuid']] : null;
			if ($owner) {
				if (intval($owner) === intval($item['assetId'])) {
					$item['status'] = 'already';
					$item['reason'] = 'already_reconciled';
				} else {
					$item['status'] = 'collision';
					$item['reason'] = 'device_uuid_owned_by_another_asset';
				}
			}
		}
		unset($item);

		usort($items, function ($left, $right) {
			$order = array('collision' => 0, 'insufficient' => 1, 'ready' => 2, 'already' => 3);
			$left_order = isset($order[$left['status']]) ? $order[$left['status']] : 9;
			$right_order = isset($order[$right['status']]) ? $order[$right['status']] : 9;
			if ($left_order === $right_order) {
				return strcmp($left['assetUuid'], $right['assetUuid']);
			}
			return $left_order - $right_order;
		});
		return $items;
	}

	private function summary($items)
	{
		$summary = array('auditedAssets' => count($items), 'ready' => 0, 'already' => 0, 'collisions' => 0, 'insufficient' => 0);
		foreach ($items as $item) {
			if ($item['status'] === 'collision') {
				$summary['collisions']++;
			} elseif (isset($summary[$item['status']])) {
				$summary[$item['status']]++;
			}
		}
		return $summary;
	}

	private function identity_from_row($row)
	{
		$raw = json_decode(isset($row['raw_json']) ? $row['raw_json'] : '', true);
		$payload = is_array($raw) && isset($raw['observation']) && is_array($raw['observation']) ? $raw['observation'] : $raw;
		$asset = is_array($payload) && isset($payload['asset']) && is_array($payload['asset']) ? $payload['asset'] : array();
		$identity = isset($asset['identity']) && is_array($asset['identity']) ? $asset['identity'] : array();
		$hardware = json_decode(isset($row['hardware_json']) ? $row['hardware_json'] : '', true);
		return array('identity' => $identity, 'hardware' => is_array($hardware) ? $hardware : array());
	}
}
