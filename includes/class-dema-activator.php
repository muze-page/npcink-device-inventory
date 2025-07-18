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
		if (get_option(self::$option) === false) {
			self::device_manage_create_option();
		}

		//创建自定义类型设备管理表
		self::create_style_device_table();
	}
	//新建数据库表 - 存储数据用
	// 在插件激活时创建数据库表
	//使用特定算法算出的UUID数据做设备唯一编号，
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
			name VARCHAR(10) NOT NULL,
			state VARCHAR(10) NOT NULL,
			number VARCHAR(36) NOT NULL,
			department VARCHAR(10) NOT NULL,
			ip VARCHAR(15) NOT NULL, 
			purchase VARCHAR(10) NOT NULL, 
			depreciation VARCHAR(10) NOT NULL, 
			time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uuid VARCHAR(36) NOT NULL,
            data JSON,
            PRIMARY KEY (id),
			UNIQUE (number)
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
			user VARCHAR(10) NOT NULL,
			type VARCHAR(10) NOT NULL,
            data VARCHAR(120) NOT NULL,
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			uuid VARCHAR(36) NOT NULL,
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
		// 生成随机字符串
		$random_string = uniqid(mt_rand(), true);
		//再加密下
		$pss =  wp_hash_password($random_string);

		$option = array(
			"route" => "device-post-data", //默认路由
			"password" => $pss, //默认密码
			"device_show_number" => 10, //默认每页显示数量
			"delete_mysql" => false, //默认是否删除数据库
			"depreciation_year" => 36, //折旧月限
			"residual_value_rate" => 5, //残值率
			"department" => array("开发部", "推广部", "运营部", "默认"), //默认部门
			"public_search_route" => "public-search-page", //默认公开搜索路由
		);
		//保存
		update_option(self::$option, $option);
	}

	//创建自定义类型设备管理表
	public static function create_style_device_table()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix .  self::$table_style_name;

		// 检查是否已存在同名表
		if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE $table_name (
            id INT NOT NULL AUTO_INCREMENT,
			name VARCHAR(10) NOT NULL,
			purpose VARCHAR(10) NOT NULL,
			state VARCHAR(10) NOT NULL,
            time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			uuid VARCHAR(36) NOT NULL,
			data JSON,
            PRIMARY KEY (id)
            
        );";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);

			// 在 dbDelta($sql); 后添加触发器
			//我太懒了，你自己生成UUID吧，
			$trigger_sql = "
    CREATE TRIGGER before_insert_style_device
    BEFORE INSERT ON `$table_name`
    FOR EACH ROW
    BEGIN
        IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
            SET NEW.uuid = UUID();
        END IF;
    END;
";

			$wpdb->query($trigger_sql);
		}
	}
}
