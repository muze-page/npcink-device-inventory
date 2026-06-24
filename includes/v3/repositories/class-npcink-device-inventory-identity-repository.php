<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Identity_Repository
{
	public function find_asset_id_by_identities($identities)
	{
		global $wpdb;
		if (empty($identities)) {
			return null;
		}

		foreach ($identities as $identity) {
			if (empty($identity['type']) || empty($identity['value'])) {
				continue;
			}
			$asset_id = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT asset_id FROM ' . Npcink_Device_Inventory_V3_Tables::identities() . ' WHERE identity_type = %s AND identity_value = %s LIMIT 1',
					$identity['type'],
					$identity['value']
				)
			);
			if ($asset_id) {
				return intval($asset_id);
			}
		}

		return null;
	}

	public function list_for_asset($asset_id)
	{
		global $wpdb;
		return $wpdb->get_results(
			$wpdb->prepare(
				'SELECT * FROM ' . Npcink_Device_Inventory_V3_Tables::identities() . ' WHERE asset_id = %d ORDER BY is_primary DESC, id ASC',
				$asset_id
			),
			ARRAY_A
		) ?: array();
	}

	public function add($asset_id, $identity, $is_primary = false)
	{
		global $wpdb;
		$type = sanitize_key($identity['type']);
		$value = sanitize_text_field($identity['value']);
		if ($type === '' || $value === '') {
			return false;
		}

		$result = $wpdb->query(
			$wpdb->prepare(
				'INSERT IGNORE INTO ' . Npcink_Device_Inventory_V3_Tables::identities() . '
				(asset_id, identity_type, identity_value, confidence, is_primary, source)
				VALUES (%d, %s, %s, %f, %d, %s)',
				$asset_id,
				$type,
				$value,
				isset($identity['confidence']) ? floatval($identity['confidence']) : 100.0,
				$is_primary ? 1 : 0,
				isset($identity['source']) ? sanitize_key($identity['source']) : 'upload'
			)
		);

		return $result !== false;
	}

	public function add_many($asset_id, $identities)
	{
		$index = 0;
		foreach ($identities as $identity) {
			$this->add($asset_id, $identity, $index === 0);
			$index++;
		}
	}
}
