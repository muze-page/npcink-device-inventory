<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Observation_Repository
{
	public function create($asset_id, $observation)
	{
		global $wpdb;
		$row = array(
			'asset_id' => intval($asset_id),
			'source' => sanitize_key($observation['source']),
			'schema_version' => intval($observation['schema_version']),
			'observed_at' => sanitize_text_field($observation['observed_at']),
			'summary_json' => wp_json_encode($observation['summary']),
			'hardware_json' => wp_json_encode($observation['hardware']),
			'raw_json' => wp_json_encode($observation['raw']),
		);

		$result = $wpdb->insert(
			Npcink_Device_Inventory_V3_Tables::observations(),
			$row,
			array('%d', '%s', '%d', '%s', '%s', '%s', '%s')
		);
		if ($result === false) {
			return null;
		}
		return $this->find_by_id($wpdb->insert_id);
	}

	public function find_by_id($id)
	{
		global $wpdb;
		return $wpdb->get_row(
			$wpdb->prepare('SELECT * FROM ' . Npcink_Device_Inventory_V3_Tables::observations() . ' WHERE id = %d', $id),
			ARRAY_A
		);
	}

	public function list_for_asset($asset_id, $page, $page_size)
	{
		global $wpdb;
		$page = max(1, intval($page));
		$page_size = max(1, min(100, intval($page_size)));
		$offset = ($page - 1) * $page_size;
		$table = Npcink_Device_Inventory_V3_Tables::observations();
		$total = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE asset_id = %d", $asset_id));
		$items = $wpdb->get_results(
			$wpdb->prepare("SELECT * FROM $table WHERE asset_id = %d ORDER BY observed_at DESC, id DESC LIMIT %d OFFSET %d", $asset_id, $page_size, $offset),
			ARRAY_A
		);
		return array('items' => $items ?: array(), 'total' => intval($total), 'page' => $page, 'pageSize' => $page_size);
	}
}
