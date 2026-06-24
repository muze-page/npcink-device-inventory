<?php

if (!defined('ABSPATH')) {
	exit;
}

// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- Activation SQL only touches plugin-owned tables and internally constructed schema fragments.
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- Activation and upgrade routines create or update plugin-owned custom tables, indexes, and triggers.

/**
 * 在插件激活期间激发 - 创建数据表用
 *
 * @link       https://www.npc.ink
 * @since      1.0.0
 *
 * @package    Npcink_Device_Inventory
 * @subpackage Npcink_Device_Inventory/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Npcink_Device_Inventory
 * @subpackage Npcink_Device_Inventory/includes
 * @author     Npcink <1355471563@qq.com>
 */
class Npcink_Device_Inventory_Activator extends Npcink_Device_Inventory_Admin_Interface
{

	/**
	 * 插件激活时运行的主要方法
	 *
	 * @since    1.0.0
	 */
	public static function run()
	{
		$current_version = defined('NPCINK_DEVICE_INVENTORY_VERSION') ? NPCINK_DEVICE_INVENTORY_VERSION : '1.0.0';
		self::upgrade_schema(null, $current_version);
	}

	/**
	 * 版本升级时执行数据库与索引增量迁移
	 */
	public static function upgrade_schema($installed_version, $current_version)
	{
		// 新资产模型：资产、身份、采集快照、统一事件。
		self::create_table_assets();
		self::create_table_asset_identities();
		self::create_table_asset_observations();
		self::create_table_asset_events();

		self::create_default_v3_options();

		if (!empty($current_version)) {
			update_option('npcink_device_inventory_plugin_version', $current_version);
		}
		update_option('npcink_device_inventory_data_model_version', '3');
	}

	/**
	 * 校验并转义插件内部表名。
	 */
	private static function quote_internal_table_name($table_name)
	{
		global $wpdb;
		$allowed_tables = array(
			$wpdb->prefix . self::$table_assets_name,
			$wpdb->prefix . self::$table_asset_identities_name,
			$wpdb->prefix . self::$table_asset_observations_name,
			$wpdb->prefix . self::$table_asset_events_name,
		);

		if (!is_string($table_name) || !in_array($table_name, $allowed_tables, true) || !preg_match('/^[A-Za-z0-9_]+$/', $table_name)) {
			return null;
		}

		return '`' . str_replace('`', '``', $table_name) . '`';
	}

	/**
	 * 创建 v3 默认选项。
	 */
	private static function create_default_v3_options()
	{
		if (get_option('npcink_device_inventory_v3_options') !== false) {
			return;
		}

		update_option(
			'npcink_device_inventory_v3_options',
			array(
				'client_tokens' => array(),
				'public_query_enabled' => false,
				'observation_retention_days' => 0,
				'asset_number_prefix' => 'A',
				'delete_data_on_uninstall' => false,
			)
		);
	}

	/**
	 * 创建资产主表。
	 */
	public static function create_table_assets()
	{
		global $wpdb;

		$table_name = $wpdb->prefix . self::$table_assets_name;
		$sql = "CREATE TABLE `$table_name` (
	        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	        uuid CHAR(36) NOT NULL COMMENT '资产UUID',
	        asset_type VARCHAR(64) NOT NULL COMMENT '资产类型',
	        asset_number VARCHAR(64) NOT NULL COMMENT '资产编号',
	        name VARCHAR(191) NOT NULL DEFAULT '' COMMENT '资产名称',
	        owner_name VARCHAR(191) NOT NULL DEFAULT '' COMMENT '使用人',
	        department VARCHAR(191) NOT NULL DEFAULT '' COMMENT '部门',
	        status VARCHAR(64) NOT NULL DEFAULT 'active' COMMENT '资产状态',
	        category VARCHAR(191) NOT NULL DEFAULT '' COMMENT '分类',
	        purchase_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '采购价',
	        residual_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '残值',
	        metadata_json JSON COMMENT '扩展资产信息',
	        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
	        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
	        PRIMARY KEY  (id),
	        UNIQUE KEY uuid (uuid),
	        UNIQUE KEY asset_number (asset_number),
	        KEY idx_asset_type_status (asset_type, status),
	        KEY idx_department_status (department, status),
	        KEY idx_owner_name (owner_name),
	        KEY idx_category (category),
	        KEY idx_updated_at (updated_at)
	     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产主表';";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}

	/**
	 * 创建资产身份表。
	 */
	public static function create_table_asset_identities()
	{
		global $wpdb;

		$table_name = $wpdb->prefix . self::$table_asset_identities_name;
		$sql = "CREATE TABLE `$table_name` (
	        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	        asset_id BIGINT UNSIGNED NOT NULL COMMENT '资产ID',
	        identity_type VARCHAR(64) NOT NULL COMMENT '身份类型',
	        identity_value VARCHAR(191) NOT NULL COMMENT '身份值',
	        confidence DECIMAL(5, 2) NOT NULL DEFAULT 100.00 COMMENT '匹配置信度',
	        is_primary TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主身份',
	        source VARCHAR(64) NOT NULL DEFAULT '' COMMENT '身份来源',
	        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
	        PRIMARY KEY  (id),
	        UNIQUE KEY identity (identity_type, identity_value),
	        KEY idx_asset_id (asset_id),
	        KEY idx_asset_identity (asset_id, identity_type),
	        KEY idx_primary_identity (asset_id, is_primary)
	     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产身份表';";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}

	/**
	 * 创建资产采集快照表。
	 */
	public static function create_table_asset_observations()
	{
		global $wpdb;

		$table_name = $wpdb->prefix . self::$table_asset_observations_name;
		$sql = "CREATE TABLE `$table_name` (
	        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	        asset_id BIGINT UNSIGNED NOT NULL COMMENT '资产ID',
	        source VARCHAR(64) NOT NULL COMMENT '采集来源',
	        schema_version SMALLINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '采集结构版本',
	        observed_at DATETIME NOT NULL COMMENT '采集时间',
	        received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
	        summary_json JSON COMMENT '摘要数据',
	        hardware_json JSON COMMENT '硬件明细',
	        raw_json LONGTEXT COMMENT '原始数据',
	        PRIMARY KEY  (id),
	        KEY idx_asset_observed (asset_id, observed_at),
	        KEY idx_source_observed (source, observed_at),
	        KEY idx_schema_version (schema_version),
	        KEY idx_received_at (received_at)
	     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产采集快照表';";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}

	/**
	 * 创建资产事件表。
	 */
	public static function create_table_asset_events()
	{
		global $wpdb;

		$table_name = $wpdb->prefix . self::$table_asset_events_name;
		$sql = "CREATE TABLE `$table_name` (
	        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	        asset_id BIGINT UNSIGNED COMMENT '资产ID',
	        event_source VARCHAR(64) NOT NULL COMMENT '事件来源',
	        event_type VARCHAR(64) NOT NULL COMMENT '事件类型',
	        field_name VARCHAR(191) COMMENT '字段名',
	        old_value LONGTEXT COMMENT '变更前值',
	        new_value LONGTEXT COMMENT '变更后值',
	        message TEXT COMMENT '事件说明',
	        actor_user_id BIGINT UNSIGNED COMMENT '操作人用户ID',
	        actor_name VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作人名称',
	        payload_json JSON COMMENT '事件扩展数据',
	        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
	        PRIMARY KEY  (id),
	        KEY idx_asset_created (asset_id, created_at),
	        KEY idx_source_type (event_source, event_type),
	        KEY idx_field_name (field_name),
	        KEY idx_actor_user_id (actor_user_id),
	        KEY idx_created_at (created_at)
	     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产事件表';";

		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}
}
