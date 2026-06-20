<?php

/**
 * 在插件激活期间激发 - 创建数据表用
 *
 * @link       https://www.npc.ink
 * @since      1.0.0
 *
 * @package    Npcink_Device_Manage
 * @subpackage Npcink_Device_Manage/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    Npcink_Device_Manage
 * @subpackage Npcink_Device_Manage/includes
 * @author     Npcink <1355471563@qq.com>
 */
class Npcink_Device_Manage_Activator extends Npcink_Device_Manage_Admin_Interface
{

	/**
	 * 插件激活时运行的主要方法
	 *
	 * @since    1.0.0
	 */
	public static function run()
	{
		$current_version = defined('NPCINK_DEVICE_MANAGE_VERSION') ? NPCINK_DEVICE_MANAGE_VERSION : '1.0.0';
		self::upgrade_schema(null, $current_version);
	}

	/**
	 * 版本升级时执行数据库与索引增量迁移
	 */
	public static function upgrade_schema($installed_version, $current_version)
	{
		//存储电脑设备信息用
		self::create_table_pc();

		//创建自定义类型设备管理表
		self::create_table_style();

		//变更手动记录表
		self::create_table_manual();

		//变更自动记录表
		self::create_table_auto();

		//补齐索引（老库升级时保障）
		self::ensure_pc_indexes();
		self::ensure_style_indexes();
		self::ensure_manual_indexes();
		self::ensure_auto_indexes();

		//判断，所有选项都是空的，才会给初始值
		if (get_option(self::$option) === false) {
			self::device_manage_create_option();
		}

		if (!empty($current_version)) {
			update_option('npcink_device_manage_plugin_version', $current_version);
		}
	}

	/**
	 * 确保索引存在（老库升级）
	 */
	private static function ensure_index($table_name, $index_name, $index_sql)
	{
		if (self::index_exists($table_name, $index_name)) {
			return;
		}
		global $wpdb;
		$wpdb->query("ALTER TABLE `$table_name` ADD $index_sql");
	}

	private static function ensure_pc_indexes()
	{
		global $wpdb;
		$table_name = $wpdb->prefix . self::$table_pc_name;
		self::ensure_index($table_name, 'idx_name', 'KEY idx_name (name)');
		self::ensure_index($table_name, 'idx_dept_state', 'KEY idx_dept_state (department, state)');
		self::ensure_index($table_name, 'idx_department', 'KEY idx_department (department)');
		self::ensure_index($table_name, 'idx_created_at', 'KEY idx_created_at (created_at)');
		self::ensure_index($table_name, 'idx_dept_created', 'KEY idx_dept_created (department, created_at)');
		self::ensure_index($table_name, 'idx_state', 'KEY idx_state (state)');
		self::ensure_index($table_name, 'idx_updated_at', 'KEY idx_updated_at (updated_at)');
	}

	private static function ensure_style_indexes()
	{
		global $wpdb;
		$table_name = $wpdb->prefix . self::$table_style_name;
		self::ensure_index($table_name, 'idx_name', 'KEY idx_name (name)');
		self::ensure_index($table_name, 'idx_purpose', 'KEY idx_purpose (purpose)');
		self::ensure_index($table_name, 'idx_category', 'KEY idx_category (category)');
		self::ensure_index($table_name, 'idx_state_category', 'KEY idx_state_category (state, category)');
		self::ensure_index($table_name, 'idx_created_at', 'KEY idx_created_at (created_at)');
	}

	private static function ensure_manual_indexes()
	{
		global $wpdb;
		$table_name = $wpdb->prefix . self::$table_manual_name;
		self::ensure_index($table_name, 'idx_user', 'KEY idx_user (user)');
		self::ensure_index($table_name, 'idx_type', 'KEY idx_type (type)');
		self::ensure_index($table_name, 'idx_record_uuid', 'KEY idx_record_uuid (record_uuid)');
		self::ensure_index($table_name, 'idx_created_at', 'KEY idx_created_at (created_at)');
	}

	private static function ensure_auto_indexes()
	{
		global $wpdb;
		$table_name = $wpdb->prefix . self::$table_auto_name;
		self::ensure_index($table_name, 'idx_record_uuid', 'KEY idx_record_uuid (record_uuid)');
		self::ensure_index($table_name, 'idx_table_name', 'KEY idx_table_name (table_name)');
		self::ensure_index($table_name, 'idx_column_name', 'KEY idx_column_name (column_name)');
		self::ensure_index($table_name, 'idx_table_column', 'KEY idx_table_column (table_name, column_name)');
		self::ensure_index($table_name, 'idx_changed_at', 'KEY idx_changed_at (changed_at)');
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

		// 创建/更新表结构
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
        PRIMARY KEY  (id),
        UNIQUE KEY number (number),
        UNIQUE KEY uuid (uuid),
		KEY idx_name (name),
        KEY idx_dept_state (department, state),
        KEY idx_department (department),
        KEY idx_created_at (created_at),
        KEY idx_dept_created (department, created_at),
		KEY idx_state (state),
		KEY idx_updated_at (updated_at)
	  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电脑设备信息表';";

		// 执行 SQL 语句
		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);

		// 检查触发器是否已存在且指向正确的表
		$trigger_table = $wpdb->get_var($wpdb->prepare(
			"SELECT EVENT_OBJECT_TABLE FROM INFORMATION_SCHEMA.TRIGGERS 
			 WHERE TRIGGER_NAME = %s 
			 AND TRIGGER_SCHEMA = DATABASE()
			 LIMIT 1",
			'after_update_device_data'
		));

		$needs_recreate = empty($trigger_table) || $trigger_table !== $pc_table_name;

		if ($needs_recreate) {
			$wpdb->query("DROP TRIGGER IF EXISTS after_update_device_data");
			// 创建UPDATE触发器，当name、state、number、depreciation、ip、purchase、department字段发生变化时记录到自动记录表
			$auto_table_name = $wpdb->prefix . self::$table_auto_name;

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

		// 创建/更新表结构
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
        PRIMARY KEY  (id),
        UNIQUE KEY uuid (uuid),
        KEY idx_name (name),
        KEY idx_purpose (purpose),
		KEY idx_category (category),
		KEY idx_state_category (state, category),
		KEY idx_created_at (created_at)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自定义设备记录表';";

		// 执行 SQL 语句
		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);

		// 生成列与索引（按需）
		self::maybe_add_style_generated_columns($style_table_name);

		// 检查插入触发器是否已存在且指向正确的表
		$before_trigger_table = $wpdb->get_var($wpdb->prepare(
			"SELECT EVENT_OBJECT_TABLE FROM INFORMATION_SCHEMA.TRIGGERS
			 WHERE TRIGGER_NAME = %s
			 AND TRIGGER_SCHEMA = DATABASE()
			 LIMIT 1",
			'before_insert_style_device'
		));

		$before_needs_recreate = empty($before_trigger_table) || $before_trigger_table !== $style_table_name;
		if ($before_needs_recreate) {
			$wpdb->query("DROP TRIGGER IF EXISTS before_insert_style_device");
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
			$wpdb->query($trigger_sql);
		}

		// 检查自定义设备表的触发器是否已存在且指向正确的表
		$style_trigger_table = $wpdb->get_var($wpdb->prepare(
			"SELECT EVENT_OBJECT_TABLE FROM INFORMATION_SCHEMA.TRIGGERS 
			 WHERE TRIGGER_NAME = %s 
			 AND TRIGGER_SCHEMA = DATABASE()
			 LIMIT 1",
			'after_update_style_device'
		));

		$style_needs_recreate = empty($style_trigger_table) || $style_trigger_table !== $style_table_name;

		if ($style_needs_recreate) {
			$wpdb->query("DROP TRIGGER IF EXISTS after_update_style_device");
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

		// 创建/更新表结构
		$sql = "CREATE TABLE `$table_name` (
        id INT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
        user VARCHAR(64) NOT NULL COMMENT '变更人姓名',
        type VARCHAR(64) NOT NULL COMMENT '变更类型',
        data TEXT NOT NULL COMMENT '变更说明',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
        record_uuid VARCHAR(36) NOT NULL COMMENT '变更记录唯一标识',
        PRIMARY KEY  (id),
        KEY idx_user (user),
        KEY idx_type (type),
        KEY idx_record_uuid (record_uuid),
        KEY idx_created_at (created_at)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='变更手动记录表';";
		//这里的UUID取自对应设备的UUID

		// 执行 SQL 语句
		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
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

		// 创建/更新表结构
		$sql = "CREATE TABLE `$table_name` (
       id INT NOT NULL AUTO_INCREMENT,
	   table_name VARCHAR(64) COMMENT '变更的表名',
       column_name VARCHAR(64) COMMENT '变更的字段名',
       old_value VARCHAR(128) COMMENT '变更前的值',
       new_value VARCHAR(128) COMMENT '变更后的值',
	   changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
       record_uuid VARCHAR(36) COMMENT '记录的uuid',
       PRIMARY KEY  (id),
       KEY idx_record_uuid (record_uuid),
       KEY idx_table_name (table_name),
       KEY idx_column_name (column_name),
       KEY idx_table_column (table_name, column_name),
       KEY idx_changed_at (changed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='变更自动记录表';";

		//这里的UUID取自对应设备的UUID

		// 执行 SQL 语句
		require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
		dbDelta($sql);
	}

	/**
	 * 为自定义设备表添加 JSON 生成列与索引（仅在支持时执行）
	 */
	private static function maybe_add_style_generated_columns($table_name)
	{
		if (!self::supports_generated_columns()) {
			return;
		}

		global $wpdb;

		if (!self::column_exists($table_name, 'platform')) {
			$wpdb->query(
				"ALTER TABLE `$table_name`
				 ADD COLUMN platform VARCHAR(64)
				 GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.platform'))) STORED"
			);
		}

		if (!self::column_exists($table_name, 'pay_method')) {
			$wpdb->query(
				"ALTER TABLE `$table_name`
				 ADD COLUMN pay_method VARCHAR(64)
				 GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data, '$.pay_method'))) STORED"
			);
		}

		if (!self::index_exists($table_name, 'idx_platform')) {
			$wpdb->query("ALTER TABLE `$table_name` ADD KEY idx_platform (platform)");
		}

		if (!self::index_exists($table_name, 'idx_pay_method')) {
			$wpdb->query("ALTER TABLE `$table_name` ADD KEY idx_pay_method (pay_method)");
		}
	}

	/**
	 * 判断数据库是否支持生成列
	 */
	private static function supports_generated_columns()
	{
		global $wpdb;
		$version = $wpdb->get_var('SELECT VERSION()');
		if (empty($version)) {
			return false;
		}

		if (stripos($version, 'mariadb') !== false) {
			$ver = self::extract_version_number($version);
			return $ver && version_compare($ver, '10.2.1', '>=');
		}

		$ver = self::extract_version_number($version);
		return $ver && version_compare($ver, '5.7.0', '>=');
	}

	/**
	 * 提取版本号（数字部分）
	 */
	private static function extract_version_number($version)
	{
		if (preg_match('/(\d+\.\d+(?:\.\d+)?)/', $version, $matches)) {
			return $matches[1];
		}
		return null;
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
			"password" => $pss, //默认密码
			"delete_mysql" => false, //默认是否删除数据库
			"depreciation_year" => 36, //折旧月限
			"residual_value_rate" => 5, //残值率（百分比）
			"department" => array("开发部", "推广部", "运营部", "默认"), //默认部门
			"public_search_route" => "public-search-page", //默认公开搜索路由
			"client_tokens" => array(), //新版上传授权码列表
		);
		//保存
		update_option(self::$option, $option);
	}
}
