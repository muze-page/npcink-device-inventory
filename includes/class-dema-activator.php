<?php

/**
 * 在插件激活期间激发
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
		//register_activation_hook(__FILE__, array(__CLASS__, 'device_manage_create_table'));
		self::device_manage_create_table();
	}
	//新建数据库表 - 存储数据用
	// 在插件激活时创建数据库表
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
            uuid VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
			styleNumber INT(11) NOT NULL,
            styleName VARCHAR(255),
            dataNew JSON,
            dataOld JSON,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        );";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}
	}
}
