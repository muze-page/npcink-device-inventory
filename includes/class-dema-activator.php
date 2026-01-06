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
	 * 插件激活时运行的主要方法
	 *
	 * @since    1.0.0
	 */
	public static function run()
	{
		//存储电脑设备信息用
		self::create_table_pc();

		//创建自定义类型设备管理表
		self::create_table_style();

		//变更手动记录表
		self::create_table_manual();

		//变更自动记录表
		self::create_table_auto();

		//判断，所有选项都是空的，才会给初始值
		if (get_option(self::$option) === false) {
			self::device_manage_create_option();
		}
	}

	/**
	 * 新建数据库表 - 存储电脑设备数据用
	 * 在插件激活时创建数据库表
	 * 使用特定算法算出的UUID数据做设备唯一编号
	 */
	public static function create_table_pc()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$pc_table_name = $wpdb->prefix . self::$table_pc_name; //电脑设备数据表

		// 检查是否已存在同名表
		if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $pc_table_name)) != $pc_table_name) {
			// 创建表结构
			$sql = "CREATE TABLE `$pc_table_name` (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(100) NOT NULL COMMENT '姓名',
            number VARCHAR(50) NOT NULL COMMENT '设备编号',
			state VARCHAR(64) NOT NULL COMMENT '状态',
            department VARCHAR(64) NOT NULL COMMENT '部门',
            purchase DECIMAL(12, 2) NOT NULL COMMENT '采购价', 
            depreciation DECIMAL(12, 2) NOT NULL COMMENT '二手价', 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
			ip VARCHAR(45) NOT NULL COMMENT 'IP地址', 
			uuid CHAR(36) NOT NULL COMMENT '设备唯一标识符',
            data JSON COMMENT '设备信息',
            PRIMARY KEY (id),
            UNIQUE (number),
            UNIQUE (uuid),
			-- 添加复合索引
            KEY idx_dept_state (department, state),
            KEY idx_created_at (created_at),
            KEY idx_dept_created (department, created_at)
            -- 对于查询频繁的字段组合
		  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电脑设备信息表';";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}

		// 检查触发器是否已存在
		$trigger_exists = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS 
			 WHERE TRIGGER_NAME = %s 
			 AND TRIGGER_SCHEMA = DATABASE()",
			'after_update_device_data'
		));

		// 如果触发器不存在，则创建它
		if ($trigger_exists == 0) {
			// 创建UPDATE触发器，当name、state、number、depreciation、ip、purchase、department、updated_at字段发生变化时记录到自动记录表
			$auto_table_name = $wpdb->prefix . self::$table_auto_name;

			// 创建新的UPDATE触发器
			$update_trigger_sql = "
			CREATE TRIGGER after_update_device_data
			AFTER UPDATE ON `$pc_table_name`
			FOR EACH ROW
			BEGIN
				IF OLD.name != NEW.name THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'name', OLD.name, NEW.name);
				END IF;
				
				IF OLD.state != NEW.state THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'state', OLD.state, NEW.state);
				END IF;
				
				IF OLD.number != NEW.number THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'number', OLD.number, NEW.number);
				END IF;
				
				IF OLD.department != NEW.department THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'department', OLD.department, NEW.department);
				END IF;
				
				IF OLD.ip != NEW.ip THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'ip', OLD.ip, NEW.ip);
				END IF;
				
				IF OLD.purchase != NEW.purchase THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'purchase', OLD.purchase, NEW.purchase);
				END IF;
				
				IF OLD.depreciation != NEW.depreciation THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('pc', NEW.uuid, 'depreciation', OLD.depreciation, NEW.depreciation);
				END IF;

			END;
			";

			// 执行触发器 SQL
			$wpdb->query($update_trigger_sql);
		}
	}

	/**
	 * 创建自定义类型设备管理表
	 */
	public static function create_table_style()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$style_table_name = $wpdb->prefix . self::$table_style_name; //自定义类型设备管理表

		// 检查是否已存在同名表
		if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $style_table_name)) != $style_table_name) {
			// 创建表结构
			$sql = "CREATE TABLE `$style_table_name` (
            id INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
            name VARCHAR(64) NOT NULL COMMENT '姓名',
			number VARCHAR(50) NOT NULL COMMENT '设备编号',
			state VARCHAR(64) NOT NULL COMMENT '状态',
            category VARCHAR(64) NOT NULL COMMENT '分类',
            purpose VARCHAR(128) NOT NULL COMMENT '用途',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            uuid VARCHAR(36) NOT NULL COMMENT '设备唯一标识符',
            data JSON COMMENT '自定义设备数据',
            PRIMARY KEY (id),
            UNIQUE (uuid),
            KEY idx_name (name),
            KEY idx_purpose (purpose)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自定义设备记录表';";

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);

			// 添加触发器
			$trigger_sql = "
            CREATE TRIGGER before_insert_style_device
            BEFORE INSERT ON `$style_table_name`
            FOR EACH ROW
            BEGIN
                IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
                    SET NEW.uuid = UUID();
                END IF;
            END;
            ";

			// 执行触发器 SQL
			$wpdb->query($trigger_sql);
		}

		// 检查自定义设备表的触发器是否已存在
		$style_trigger_exists = $wpdb->get_var($wpdb->prepare(
			"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS 
			 WHERE TRIGGER_NAME = %s 
			 AND TRIGGER_SCHEMA = DATABASE()",
			'after_update_style_device'
		));

		// 如果触发器不存在，则创建它
		if ($style_trigger_exists == 0) {
			// 创建自定义设备表的UPDATE触发器
			$auto_table_name = $wpdb->prefix . self::$table_auto_name;

			$update_style_trigger_sql = "
			CREATE TRIGGER after_update_style_device
			AFTER UPDATE ON `$style_table_name`
			FOR EACH ROW
			BEGIN
				IF OLD.name != NEW.name THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('style', NEW.uuid, 'name', OLD.name, NEW.name);
				END IF;

				IF OLD.number != NEW.number THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('style', NEW.uuid, 'number', OLD.number, NEW.number);
				END IF;
				
				IF OLD.purpose != NEW.purpose THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('style', NEW.uuid, 'purpose', OLD.purpose, NEW.purpose);
				END IF;
				
				IF OLD.state != NEW.state THEN
					INSERT INTO `$auto_table_name` (table_name, record_uuid, column_name, old_value, new_value)
					VALUES ('style', NEW.uuid, 'state', OLD.state, NEW.state);
				END IF;
			END;
			";

			// 执行触发器 SQL
			$wpdb->query($update_style_trigger_sql);
		}
	}

	/**
	 * 手动变更记录表
	 */
	public static function create_table_manual()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix . self::$table_manual_name;

		// 检查是否已存在同名表
		if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)) != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE `$table_name` (
            id INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
            user VARCHAR(64) NOT NULL COMMENT '变更人姓名',
            type VARCHAR(64) NOT NULL COMMENT '变更类型',
            data TEXT NOT NULL COMMENT '变更说明',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
            record_uuid VARCHAR(36) NOT NULL COMMENT '变更记录唯一标识',
            PRIMARY KEY (id),
            KEY idx_user (user),
            KEY idx_type (type)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='变更手动记录表';";
			//这里的UUID取自对应设备的UUID

			// 执行 SQL 语句
			require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
			dbDelta($sql);
		}
	}

	/**
	 * 创建配置信息变更记录表 - 自动记录
	 */
	public static function create_table_auto()
	{
		// 获取全局 $wpdb 对象
		global $wpdb;

		// 定义表名
		$table_name = $wpdb->prefix . self::$table_auto_name;

		// 检查是否已存在同名表
		if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)) != $table_name) {
			// 创建表结构
			$sql = "CREATE TABLE `$table_name` (
           id INT AUTO_INCREMENT PRIMARY KEY,
		   table_name VARCHAR(64) COMMENT '变更的表名',
           column_name VARCHAR(64) COMMENT '变更的字段名',
           old_value VARCHAR(128) COMMENT '变更前的值',
           new_value VARCHAR(128) COMMENT '变更后的值',
		   changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
           record_uuid VARCHAR(36) COMMENT '记录的uuid'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='变更自动记录表';";

			//这里的UUID取自对应设备的UUID

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
			"delete_mysql" => false, //默认是否删除数据库
			"depreciation_year" => 36, //折旧月限
			"residual_value_rate" => 5, //残值率（百分比）
			"department" => array("开发部", "推广部", "运营部", "默认"), //默认部门
			"public_search_route" => "public-search-page", //默认公开搜索路由
		);
		//保存
		update_option(self::$option, $option);
	}
}
