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
class Dema_Activator extends DEMA_Admin_Interface
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
		//判断，所有选项都是空的，才会给初始值
		if (get_option(self::$option) == false) {
			self::device_manage_create_option();
		}
	}
	//新建数据库表 - 存储数据用
	// 在插件激活时创建数据库表
	public static function device_manage_create_table()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix .  self::$table_data_name;

		// 检查是否已存在同名表
		if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE $table_name (
            id INT(11) NOT NULL AUTO_INCREMENT,
			name VARCHAR(255) NOT NULL,
			state VARCHAR(255) NOT NULL,
			number INT(12) NOT NULL,
			department VARCHAR(255) NOT NULL,
			time DATETIME DEFAULT CURRENT_TIMESTAMP,
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
		$table_name = $wpdb->prefix .  self::$table_change_name;

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

	/**
	 * 创建选项初始值
	 */
	public static function device_manage_create_option()
	{

		$option = array(
			"route" => "device-post-data",
			"password" => "9527",
			"device_show_number" => 8,
			"delete_mysql" => false,
			"department" => array("开发部", "推广部", "运营部", "默认"),
			"public_search_route" => "public-search-page"
		);
		//保存
		update_option(self::$option, $option);
	}
}
