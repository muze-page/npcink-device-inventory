<?php

if (!defined('ABSPATH')) {
	exit;
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Schema introspection uses INFORMATION_SCHEMA with in-request static caches for plugin-owned table checks.

if (!class_exists('Npcink_Device_Inventory_Admin_Interface')) {
	class Npcink_Device_Inventory_Admin_Interface
	{
		public static $table_assets_name = 'npcink_assets';
		public static $table_asset_identities_name = 'npcink_asset_identities';
		public static $table_asset_observations_name = 'npcink_asset_observations';
		public static $table_asset_events_name = 'npcink_asset_events';

		public static function index_exists($table_name, $index_name)
		{
			static $index_cache = array();
			$cache_key = $table_name . '::' . $index_name;
			if (array_key_exists($cache_key, $index_cache)) {
				return $index_cache[$cache_key];
			}

			global $wpdb;
			$exists = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
					 WHERE TABLE_SCHEMA = DATABASE()
					 AND TABLE_NAME = %s
					 AND INDEX_NAME = %s',
					$table_name,
					$index_name
				)
			);
			$index_cache[$cache_key] = intval($exists) > 0;
			return $index_cache[$cache_key];
		}

		public static function run()
		{
			require_once plugin_dir_path(dirname(dirname(__FILE__))) . 'includes/v3/class-npcink-device-inventory-v3-rest.php';
			Npcink_Device_Inventory_V3_Rest::run();
		}
	}
}
