<?php

if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- Optional uninstall cleanup checks and drops only plugin-owned custom tables.

//删除插件时执行
if (!class_exists('Npcink_Device_Manage_Admin_Uninstall')) {
    class Npcink_Device_Manage_Admin_Uninstall
    {
        //执行
        public static function run()
        {
            /**
             * 引入获取选项的方法
             */
            require plugin_dir_path(__FILE__) . 'npcink-device-manage-admin-interface.php';

            //获取选项值
            $config = Npcink_Device_Manage_Admin_Interface::get_seting('delete_mysql');

            //进行判断
            if ($config) {
                $result = [
                    Npcink_Device_Manage_Admin_Interface::$table_pc_name,
                    Npcink_Device_Manage_Admin_Interface::$table_style_name,
                    Npcink_Device_Manage_Admin_Interface::$table_manual_name,
                    Npcink_Device_Manage_Admin_Interface::$table_auto_name
                ];
                self::delete_sql($result); //移除数据库
                self::delete_option(); //移除选项值
            }
        }

        /**
         * 删除指定的数据表
         *
         * @param array $table_names 要删除的数据表名数组
         * @return bool|string 成功返回 true，失败返回错误信息字符串
         */
        public static function delete_sql($table_names = [])
        {
            global $wpdb;

            if (empty($table_names)) {
                return '数据表名不能为空';
            }

            $allowed_table_names = array(
                Npcink_Device_Manage_Admin_Interface::$table_pc_name,
                Npcink_Device_Manage_Admin_Interface::$table_style_name,
                Npcink_Device_Manage_Admin_Interface::$table_manual_name,
                Npcink_Device_Manage_Admin_Interface::$table_auto_name,
            );

            foreach ($table_names as $name) {
                if (!in_array($name, $allowed_table_names, true) || !preg_match('/^[A-Za-z0-9_]+$/', $name)) {
                    return "数据表 $name 不允许删除";
                }

                $table_name = $wpdb->prefix . $name;

                if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($table_name))) != $table_name) {
                    return "数据表 $table_name 不存在！";
                } else {
                    $wpdb->query($wpdb->prepare('DROP TABLE IF EXISTS %i', $table_name));
                }
            }

            return true;
        }


        /**
         * 删除选项
         */
        public static function delete_option()
        {
            // 删除插件设置
            delete_option(Npcink_Device_Manage_Admin_Interface::$option);
        }
    }
}
