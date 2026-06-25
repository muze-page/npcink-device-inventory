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
			'old_value' => isset($event['old_value']) ? sanitize_textarea_field((string) $event['old_value']) : null,
			'new_value' => isset($event['new_value']) ? sanitize_textarea_field((string) $event['new_value']) : null,
			'message' => isset($event['message']) ? sanitize_textarea_field($event['message']) : null,
			'actor_user_id' => isset($event['actor_user_id']) ? intval($event['actor_user_id']) : null,
			'actor_name' => isset($event['actor_name']) ? sanitize_text_field($event['actor_name']) : '',
			'payload_json' => isset($event['payload']) ? Npcink_Device_Inventory_V3_Sanitizer::json_encode($event['payload']) : null,
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

	public function list_all($args)
	{
		global $wpdb;
		$page = max(1, intval($args['page']));
		$page_size = max(1, min(100, intval($args['pageSize'])));
		$offset = ($page - 1) * $page_size;
		$events_table = Npcink_Device_Inventory_V3_Tables::events();
		$assets_table = Npcink_Device_Inventory_V3_Tables::assets();
		$where = array();
		$params = array();

		if (!empty($args['event_source'])) {
			$where[] = 'e.event_source = %s';
			$params[] = sanitize_key($args['event_source']);
		}

		if (!empty($args['event_type'])) {
			$where[] = 'e.event_type = %s';
			$params[] = sanitize_key($args['event_type']);
		}

		if (!empty($args['search'])) {
			$like = '%' . $wpdb->esc_like(sanitize_text_field($args['search'])) . '%';
			$where[] = '(e.message LIKE %s OR e.field_name LIKE %s OR a.asset_number LIKE %s OR a.name LIKE %s)';
			array_push($params, $like, $like, $like, $like);
		}

		$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
		$count_sql = "SELECT COUNT(*) FROM $events_table e LEFT JOIN $assets_table a ON a.id = e.asset_id $where_sql";
		$total = $params ? $wpdb->get_var($wpdb->prepare($count_sql, $params)) : $wpdb->get_var($count_sql);
		$query_sql = "SELECT e.*, a.uuid AS asset_uuid, a.asset_number, a.name AS asset_name, a.asset_type, a.status, a.department, a.owner_name
			FROM $events_table e
			LEFT JOIN $assets_table a ON a.id = e.asset_id
			$where_sql
			ORDER BY e.created_at DESC, e.id DESC
			LIMIT %d OFFSET %d";
		$query_params = array_merge($params, array($page_size, $offset));
		$items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

		return array('items' => $items ?: array(), 'total' => intval($total), 'page' => $page, 'pageSize' => $page_size);
	}
}
