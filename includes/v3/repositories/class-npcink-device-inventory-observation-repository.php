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
			'summary_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode($observation['summary']),
			'hardware_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode($observation['hardware']),
			'raw_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode($observation['raw']),
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
			$wpdb->prepare(
				'SELECT * FROM %i WHERE id = %d',
				Npcink_Device_Inventory_V3_Tables::observations(),
				$id
			),
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
		$total = $wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM %i WHERE asset_id = %d', $table, $asset_id));
		$items = $wpdb->get_results(
			$wpdb->prepare(
				'SELECT * FROM %i WHERE asset_id = %d ORDER BY observed_at DESC, id DESC LIMIT %d OFFSET %d',
				$table,
				$asset_id,
				$page_size,
				$offset
			),
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
		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		$assets_table = Npcink_Device_Inventory_V3_Tables::assets();
		$where = array();
		$params = array();

		if (!empty($args['source'])) {
			$where[] = 'o.source = %s';
			$params[] = sanitize_key($args['source']);
		}

		if (!empty($args['search'])) {
			$like = '%' . $wpdb->esc_like(sanitize_text_field($args['search'])) . '%';
			$where[] = '(a.asset_number LIKE %s OR a.name LIKE %s OR a.department LIKE %s OR o.summary_json LIKE %s)';
			array_push($params, $like, $like, $like, $like);
		}

		$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
		$total = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM %i o LEFT JOIN %i a ON a.id = o.asset_id $where_sql",
				array_merge(array($observations_table, $assets_table), $params)
			)
		);
		$query_params = array_merge(array($observations_table, $assets_table), $params, array($page_size, $offset));
		$items = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT o.*, a.uuid AS asset_uuid, a.asset_number, a.name AS asset_name, a.asset_type, a.status, a.department, a.owner_name
			FROM %i o
			LEFT JOIN %i a ON a.id = o.asset_id
			$where_sql
			ORDER BY o.observed_at DESC, o.id DESC
			LIMIT %d OFFSET %d",
				$query_params
			),
			ARRAY_A
		);

		return array('items' => $items ?: array(), 'total' => intval($total), 'page' => $page, 'pageSize' => $page_size);
	}
}
