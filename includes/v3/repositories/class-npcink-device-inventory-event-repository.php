<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Event_Repository
{
	public function create($asset_id, $event)
	{
		global $wpdb;
		$row = array(
			'asset_id' => $asset_id ? intval($asset_id) : null,
			'event_source' => sanitize_key($event['event_source']),
			'event_type' => sanitize_key($event['event_type']),
			'field_name' => isset($event['field_name']) ? sanitize_text_field($event['field_name']) : null,
			'old_value' => isset($event['old_value']) ? (string) $event['old_value'] : null,
			'new_value' => isset($event['new_value']) ? (string) $event['new_value'] : null,
			'message' => isset($event['message']) ? sanitize_textarea_field($event['message']) : null,
			'actor_user_id' => isset($event['actor_user_id']) ? intval($event['actor_user_id']) : null,
			'actor_name' => isset($event['actor_name']) ? sanitize_text_field($event['actor_name']) : '',
			'payload_json' => isset($event['payload']) ? wp_json_encode($event['payload']) : null,
		);

		return $wpdb->insert(
			Npcink_Device_Inventory_V3_Tables::events(),
			$row,
			array('%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s')
		) !== false;
	}

	public function list_for_asset($asset_id, $page, $page_size)
	{
		global $wpdb;
		$page = max(1, intval($page));
		$page_size = max(1, min(100, intval($page_size)));
		$offset = ($page - 1) * $page_size;
		$table = Npcink_Device_Inventory_V3_Tables::events();
		$total = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table WHERE asset_id = %d", $asset_id));
		$items = $wpdb->get_results(
			$wpdb->prepare("SELECT * FROM $table WHERE asset_id = %d ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d", $asset_id, $page_size, $offset),
			ARRAY_A
		);
		return array('items' => $items ?: array(), 'total' => intval($total), 'page' => $page, 'pageSize' => $page_size);
	}
}
