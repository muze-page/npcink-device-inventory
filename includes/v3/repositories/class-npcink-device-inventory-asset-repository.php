<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Asset_Repository
{
	const CACHE_GROUP = 'npcink_device_inventory_assets';
	const CACHE_TTL = 60;

	public function find_by_uuid($uuid)
	{
		global $wpdb;
		$uuid = sanitize_text_field($uuid);
		$cache_key = $this->build_cache_key(
			'uuid',
			array(
				'uuid' => $uuid,
				'version' => $this->get_list_cache_version(),
			)
		);
		$cached = wp_cache_get($cache_key, self::CACHE_GROUP);
		if ($cached !== false) {
			return $cached;
		}

		$assets_table = Npcink_Device_Inventory_V3_Tables::assets();
		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned asset table query is wrapped in the object cache.
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT a.*,
					lo.summary_json AS latest_summary_json,
					lo.hardware_json AS latest_hardware_json,
					lo.observed_at AS latest_observed_at,
					lo.source AS latest_observation_source
				FROM %i a
				LEFT JOIN %i lo ON lo.id = (
					SELECT o.id
					FROM %i o
					WHERE o.asset_id = a.id
					ORDER BY o.observed_at DESC, o.id DESC
					LIMIT 1
				)
				WHERE a.uuid = %s",
				$assets_table,
				$observations_table,
				$observations_table,
				$uuid
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		wp_cache_set($cache_key, $row, self::CACHE_GROUP, self::CACHE_TTL);
		return $row;
	}

	public function find_by_id($id)
	{
		global $wpdb;
		$id = intval($id);
		$cache_key = $this->build_cache_key(
			'id',
			array(
				'id' => $id,
				'version' => $this->get_list_cache_version(),
			)
		);
		$cached = wp_cache_get($cache_key, self::CACHE_GROUP);
		if ($cached !== false) {
			return $cached;
		}

		$assets_table = Npcink_Device_Inventory_V3_Tables::assets();
		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned asset table query is wrapped in the object cache.
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT a.*,
					lo.summary_json AS latest_summary_json,
					lo.hardware_json AS latest_hardware_json,
					lo.observed_at AS latest_observed_at,
					lo.source AS latest_observation_source
				FROM %i a
				LEFT JOIN %i lo ON lo.id = (
					SELECT o.id
					FROM %i o
					WHERE o.asset_id = a.id
					ORDER BY o.observed_at DESC, o.id DESC
					LIMIT 1
				)
				WHERE a.id = %d",
				$assets_table,
				$observations_table,
				$observations_table,
				$id
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		wp_cache_set($cache_key, $row, self::CACHE_GROUP, self::CACHE_TTL);
		return $row;
	}

	public function list_assets($args)
	{
		global $wpdb;
		$page = max(1, intval($args['page']));
		$page_size = max(1, min(100, intval($args['pageSize'])));
		$offset = ($page - 1) * $page_size;
		$cache_key = $this->build_cache_key(
			'list',
			array(
				'args' => $this->sanitize_list_cache_args($args),
				'page' => $page,
				'page_size' => $page_size,
				'version' => $this->get_list_cache_version(),
			)
		);
		$cached = wp_cache_get($cache_key, self::CACHE_GROUP);
		if ($cached !== false) {
			return $cached;
		}

		$asset_type = isset($args['asset_type']) ? sanitize_text_field($args['asset_type']) : '';
		$status = isset($args['status']) ? sanitize_text_field($args['status']) : '';
		$department = isset($args['department']) ? sanitize_text_field($args['department']) : '';
		$category = isset($args['category']) ? sanitize_text_field($args['category']) : '';
		$asset_scope = isset($args['asset_scope']) ? sanitize_key($args['asset_scope']) : '';
		if ($asset_scope !== 'computer' && $asset_scope !== 'other') {
			$asset_scope = '';
		}
		$search = isset($args['search']) ? sanitize_text_field($args['search']) : '';
		$like = '%' . $wpdb->esc_like($search) . '%';
		$platform_regex = $this->build_platform_regex(isset($args['purchase_platform']) ? $args['purchase_platform'] : '');
		$table = Npcink_Device_Inventory_V3_Tables::assets();
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned asset table query is wrapped in the object cache.
		$total = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM %i
				WHERE (%s = '' OR asset_type = %s)
				AND (%s = '' OR status = %s)
				AND (%s = '' OR department = %s)
				AND (%s = '' OR category = %s)
				AND (%s = '' OR (%s = 'computer' AND asset_type IN ('pc', 'computer')) OR (%s = 'other' AND asset_type NOT IN ('pc', 'computer')))
				AND (%s = '' OR asset_number LIKE %s OR name LIKE %s OR owner_name LIKE %s OR department LIKE %s OR metadata_json LIKE %s)
				AND (%s = '' OR metadata_json REGEXP %s)",
				$table,
				$asset_type,
				$asset_type,
				$status,
				$status,
				$department,
				$department,
				$category,
				$category,
				$asset_scope,
				$asset_scope,
				$asset_scope,
				$search,
				$like,
				$like,
				$like,
				$like,
				$like,
				$platform_regex,
				$platform_regex
			)
		);

		$observations_table = Npcink_Device_Inventory_V3_Tables::observations();
		$items = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT a.*,
				lo.summary_json AS latest_summary_json,
				lo.hardware_json AS latest_hardware_json,
				lo.observed_at AS latest_observed_at,
				lo.source AS latest_observation_source
			FROM %i a
			LEFT JOIN %i lo ON lo.id = (
				SELECT o.id
				FROM %i o
				WHERE o.asset_id = a.id
				ORDER BY o.observed_at DESC, o.id DESC
				LIMIT 1
			)
			WHERE (%s = '' OR a.asset_type = %s)
			AND (%s = '' OR a.status = %s)
			AND (%s = '' OR a.department = %s)
			AND (%s = '' OR a.category = %s)
			AND (%s = '' OR (%s = 'computer' AND a.asset_type IN ('pc', 'computer')) OR (%s = 'other' AND a.asset_type NOT IN ('pc', 'computer')))
			AND (%s = '' OR a.asset_number LIKE %s OR a.name LIKE %s OR a.owner_name LIKE %s OR a.department LIKE %s OR a.metadata_json LIKE %s)
			AND (%s = '' OR a.metadata_json REGEXP %s)
			ORDER BY a.updated_at DESC, a.id DESC
			LIMIT %d OFFSET %d",
				$table,
				$observations_table,
				$observations_table,
				$asset_type,
				$asset_type,
				$status,
				$status,
				$department,
				$department,
				$category,
				$category,
				$asset_scope,
				$asset_scope,
				$asset_scope,
				$search,
				$like,
				$like,
				$like,
				$like,
				$like,
				$platform_regex,
				$platform_regex,
				$page_size,
				$offset
			),
			ARRAY_A
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery

		$result = array(
			'items' => $items ?: array(),
			'total' => intval($total),
			'page' => $page,
			'pageSize' => $page_size,
		);
		wp_cache_set($cache_key, $result, self::CACHE_GROUP, self::CACHE_TTL);
		return $result;
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

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned asset table write invalidates repository object-cache version after success.
		$result = $wpdb->insert(
			Npcink_Device_Inventory_V3_Tables::assets(),
			$row,
			array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%f', '%s')
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		if ($result === false) {
			return null;
		}
		$version = $this->get_list_cache_version();
		wp_cache_set('list_version', $version + 1, self::CACHE_GROUP);
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

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned asset table write invalidates repository object-cache version after success.
		$result = $wpdb->update(
			Npcink_Device_Inventory_V3_Tables::assets(),
			$row,
			array('uuid' => $uuid),
			$formats,
			array('%s')
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		if ($result === false) {
			return null;
		}
		$version = $this->get_list_cache_version();
		wp_cache_set('list_version', $version + 1, self::CACHE_GROUP);
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

	private function build_cache_key($prefix, $parts)
	{
		$encoded = wp_json_encode($parts);
		return $prefix . ':' . md5(is_string($encoded) ? $encoded : serialize($parts));
	}

	private function build_platform_regex($value)
	{
		$platforms = array_filter(
			array_map('sanitize_text_field', explode('|', (string) $value))
		);
		if (empty($platforms)) {
			return '';
		}
		$escaped = array_map(
			function ($platform) {
				return preg_quote($platform, '/');
			},
			$platforms
		);
		return implode('|', $escaped);
	}

	private function sanitize_list_cache_args($args)
	{
		$result = array();
		foreach (array('asset_type', 'status', 'department', 'category', 'asset_scope', 'search', 'purchase_platform') as $field) {
			$result[$field] = isset($args[$field]) ? sanitize_text_field((string) $args[$field]) : '';
		}
		return $result;
	}

	private function get_list_cache_version()
	{
		$version = wp_cache_get('list_version', self::CACHE_GROUP);
		if ($version === false) {
			$version = 1;
			wp_cache_set('list_version', $version, self::CACHE_GROUP);
		}
		return intval($version);
	}

}
