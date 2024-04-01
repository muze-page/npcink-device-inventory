<?php

/**
 * 在插件激活期间激发 - 创建数据表用
 *
 * @link       https://www.npc.ink
 * @since      1.0.0
 *
 * @package    Dema
 * @subpackage Dema/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Dema
 * @subpackage Dema/includes
 * @author     Npcink <1355471563@qq.com>
 */
class Dema_Activator
{

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function run()
	{
		//主数据表
		self::device_manage_create_table();
		//数据变更表
		self::device_manage_create_change();
	}
	//新建数据库表 - 存储数据用
	// 在插件激活时创建数据库表
	public static function device_manage_create_table()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix . 'custom_table';

		// 检查是否已存在同名表
		if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE $table_name (
            id INT(11) NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			number INT(11) NOT NULL,
			state VARCHAR(36) NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            uuid VARCHAR(36) NOT NULL,
            data JSON,
            PRIMARY KEY (id)
        );";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}
	}

	/**
	 * 创建配置信息变更表
	 */
	public static function device_manage_create_change()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix . 'custom_change';

		// 检查是否已存在同名表
		if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE $table_name (
            id INT NOT NULL AUTO_INCREMENT,
            uuid TEXT,
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			user TEXT,
			type TEXT,
            msg TEXT,
            PRIMARY KEY (id)
            
        );";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}
	}
}
/**
 * 新建表
 * id -唯一ID
 * obj_id - 唯一识别号
 * obj_time 变更时间
 * obj_new 变更后的值
 * obj_old 变更前的值
 */
