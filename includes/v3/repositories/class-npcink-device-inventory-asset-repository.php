<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Asset_Repository
{
	public function find_by_uuid($uuid)
	{
		global $wpdb;
		return $wpdb->get_row(
			$wpdb->prepare('SELECT * FROM ' . Npcink_Device_Inventory_V3_Tables::assets() . ' WHERE uuid = %s', $uuid),
			ARRAY_A
		);
	}

	public function find_by_id($id)
	{
		global $wpdb;
		return $wpdb->get_row(
			$wpdb->prepare('SELECT * FROM ' . Npcink_Device_Inventory_V3_Tables::assets() . ' WHERE id = %d', $id),
			ARRAY_A
		);
	}

	public function list_assets($args)
	{
		global $wpdb;
		$page = max(1, intval($args['page']));
		$page_size = max(1, min(100, intval($args['pageSize'])));
		$offset = ($page - 1) * $page_size;
		$where = array();
		$params = array();

		foreach (array('asset_type', 'status', 'department', 'category') as $field) {
			if (!empty($args[$field])) {
				$where[] = "$field = %s";
				$params[] = sanitize_text_field($args[$field]);
			}
		}

		if (!empty($args['asset_scope'])) {
			$scope = sanitize_key($args['asset_scope']);
			if ('computer' === $scope) {
				$where[] = "asset_type IN ('pc', 'computer')";
			} elseif ('other' === $scope) {
				$where[] = "asset_type NOT IN ('pc', 'computer')";
			}
		}

		if (!empty($args['search'])) {
			$like = '%' . $wpdb->esc_like(sanitize_text_field($args['search'])) . '%';
			$where[] = '(asset_number LIKE %s OR name LIKE %s OR owner_name LIKE %s OR department LIKE %s)';
			array_push($params, $like, $like, $like, $like);
		}

		$where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
		$table = Npcink_Device_Inventory_V3_Tables::assets();
		$total_sql = "SELECT COUNT(*) FROM $table $where_sql";
		$total = $params ? $wpdb->get_var($wpdb->prepare($total_sql, $params)) : $wpdb->get_var($total_sql);

		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		$query_sql = "SELECT a.*,
				lo.summary_json AS latest_summary_json,
				lo.hardware_json AS latest_hardware_json,
				lo.observed_at AS latest_observed_at,
				lo.source AS latest_observation_source
			FROM $table a
			LEFT JOIN $observations_table lo ON lo.id = (
				SELECT o.id
				FROM $observations_table o
				WHERE o.asset_id = a.id
				ORDER BY o.observed_at DESC, o.id DESC
				LIMIT 1
			)
			$where_sql
			ORDER BY a.updated_at DESC, a.id DESC
			LIMIT %d OFFSET %d";
		$query_params = array_merge($params, array($page_size, $offset));
		$items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

		return array(
			'items' => $items ?: array(),
			'total' => intval($total),
			'page' => $page,
			'pageSize' => $page_size,
		);
	}

	public function create($data)
	{
		global $wpdb;
		$uuid = !empty($data['uuid']) ? sanitize_text_field($data['uuid']) : wp_generate_uuid4();
		$asset_number = !empty($data['asset_number']) ? sanitize_text_field($data['asset_number']) : $this->next_asset_number();
		$row = array(
			'uuid' => $uuid,
			'asset_type' => sanitize_key($data['asset_type']),
			'asset_number' => $asset_number,
			'name' => sanitize_text_field($data['name']),
			'owner_name' => sanitize_text_field($data['owner_name']),
			'department' => sanitize_text_field($data['department']),
			'status' => sanitize_key($data['status']),
			'category' => sanitize_text_field($data['category']),
			'purchase_price' => floatval($data['purchase_price']),
			'residual_value' => floatval($data['residual_value']),
			'metadata_json' => Npcink_Device_Inventory_V3_Sanitizer::json_encode($data['metadata']),
		);

		$result = $wpdb->insert(
			Npcink_Device_Inventory_V3_Tables::assets(),
			$row,
			array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s')
		);

		if ($result === false) {
			return null;
		}
		return $this->find_by_id($wpdb->insert_id);
	}

	public function update($uuid, $data)
	{
		global $wpdb;
		$allowed = array(
			'asset_type' => '%s',
			'asset_number' => '%s',
			'name' => '%s',
			'owner_name' => '%s',
			'department' => '%s',
			'status' => '%s',
			'category' => '%s',
			'purchase_price' => '%f',
			'residual_value' => '%f',
			'metadata_json' => '%s',
		);
		$row = array();
		$formats = array();

		foreach ($allowed as $field => $format) {
			if (!array_key_exists($field, $data)) {
				continue;
			}
			$value = $data[$field];
			if ($field === 'metadata_json' && is_array($value)) {
				$value = Npcink_Device_Inventory_V3_Sanitizer::json_encode($value);
			} elseif ($format === '%s') {
				$value = sanitize_text_field($value);
			} elseif ($format === '%f') {
				$value = floatval($value);
			}
			$row[$field] = $value;
			$formats[] = $format;
		}

		if (empty($row)) {
			return $this->find_by_uuid($uuid);
		}

		$result = $wpdb->update(
			Npcink_Device_Inventory_V3_Tables::assets(),
			$row,
			array('uuid' => $uuid),
			$formats,
			array('%s')
		);

		if ($result === false) {
			return null;
		}
		return $this->find_by_uuid($uuid);
	}

	private function next_asset_number()
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$prefix = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $options['asset_number_prefix']);
		if ($prefix === '') {
			$prefix = 'A';
		}
		return $prefix . gmdate('ymdHis') . wp_rand(100, 999);
	}
}
