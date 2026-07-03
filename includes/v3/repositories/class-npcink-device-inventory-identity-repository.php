<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Identity_Repository
{
	const CACHE_GROUP = 'npcink_device_inventory_identities';
	const CACHE_TTL = 60;

	public function find_asset_id_by_identities($identities)
	{
		global $wpdb;
		$identities_table = Npcink_Device_Inventory_V3_Tables::identities();
		if (empty($identities)) {
			return null;
		}

		foreach ($identities as $identity) {
			if (empty($identity['type']) || empty($identity['value'])) {
				continue;
			}
			$type = sanitize_key($identity['type']);
			$value = sanitize_text_field($identity['value']);
			$cache_key = $this->build_cache_key(
				'identity-asset',
				array(
					'type' => $type,
					'value' => $value,
					'version' => $this->get_list_cache_version(),
				)
			);
			$cached = wp_cache_get($cache_key, self::CACHE_GROUP);
			if ($cached !== false) {
				if ($cached) {
					return intval($cached);
				}
				continue;
			}

			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned identity table query is wrapped in the object cache.
			$asset_id = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT asset_id FROM %i WHERE identity_type = %s AND identity_value = %s LIMIT 1',
					$identities_table,
					$type,
					$value
				)
			);
			// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
			wp_cache_set($cache_key, $asset_id ? intval($asset_id) : 0, self::CACHE_GROUP, self::CACHE_TTL);
			if ($asset_id) {
				return intval($asset_id);
			}
		}

		return null;
	}

	public function list_for_asset($asset_id)
	{
		global $wpdb;
		$asset_id = intval($asset_id);
		$cache_key = $this->build_cache_key(
			'asset-list',
			array(
				'asset_id' => $asset_id,
				'version' => $this->get_list_cache_version(),
			)
		);
		$cached = wp_cache_get($cache_key, self::CACHE_GROUP);
		if ($cached !== false) {
			return $cached;
		}

		$identities_table = Npcink_Device_Inventory_V3_Tables::identities();
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery -- Plugin-owned identity table query is wrapped in the object cache.
		$items = $wpdb->get_results(
			$wpdb->prepare(
				'SELECT * FROM %i WHERE asset_id = %d ORDER BY is_primary DESC, id ASC',
				$identities_table,
				$asset_id
			),
			ARRAY_A
		) ?: array();
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery
		wp_cache_set($cache_key, $items, self::CACHE_GROUP, self::CACHE_TTL);
		return $items;
	}

	public function add($asset_id, $identity, $is_primary = false)
	{
		global $wpdb;
		$type = sanitize_key($identity['type']);
		$value = sanitize_text_field($identity['value']);
		if ($type === '' || $value === '') {
			return false;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Plugin-owned identity table write invalidates repository object-cache version after success.
		$result = $wpdb->query(
			$wpdb->prepare(
				'INSERT IGNORE INTO %i
				(asset_id, identity_type, identity_value, confidence, is_primary, source)
				VALUES (%d, %s, %s, %f, %d, %s)',
				Npcink_Device_Inventory_V3_Tables::identities(),
				$asset_id,
				$type,
				$value,
				isset($identity['confidence']) ? floatval($identity['confidence']) : 100.0,
				$is_primary ? 1 : 0,
				isset($identity['source']) ? sanitize_key($identity['source']) : 'upload'
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

		if ($result !== false) {
			$version = $this->get_list_cache_version();
			wp_cache_set('list_version', $version + 1, self::CACHE_GROUP);
		}
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

	private function build_cache_key($prefix, $parts)
	{
		$encoded = wp_json_encode($parts);
		return $prefix . ':' . md5(is_string($encoded) ? $encoded : serialize($parts));
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
