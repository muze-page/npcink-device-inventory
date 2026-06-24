<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_V3_Tables
{
	public const OPTION = 'npcink_device_inventory_v3_options';
	public const ASSETS = 'npcink_assets';
	public const IDENTITIES = 'npcink_asset_identities';
	public const OBSERVATIONS = 'npcink_asset_observations';
	public const EVENTS = 'npcink_asset_events';

	public static function name($table)
	{
		global $wpdb;
		return $wpdb->prefix . $table;
	}

	public static function assets()
	{
		return self::name(self::ASSETS);
	}

	public static function identities()
	{
		return self::name(self::IDENTITIES);
	}

	public static function observations()
	{
		return self::name(self::OBSERVATIONS);
	}

	public static function events()
	{
		return self::name(self::EVENTS);
	}

	public static function default_options()
	{
		return array(
			'client_tokens' => array(),
			'public_query_enabled' => false,
			'observation_retention_days' => 0,
			'asset_number_prefix' => 'A',
			'delete_data_on_uninstall' => false,
		);
	}

	public static function options()
	{
		$options = get_option(self::OPTION);
		if (!is_array($options)) {
			$options = array();
		}
		return array_merge(self::default_options(), $options);
	}
}
