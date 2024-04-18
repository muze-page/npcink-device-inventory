<?php
//删除插件时执行
if (!class_exists('Mare_Admin_Uninstall')) {
    class Mare_Admin_Uninstall extends DEMA_Admin_Interface
    {
        //执行
        public static function run()
        {
            /**
             * 引入获取选项的方法
             */
            require plugin_dir_path(__FILE__) . 'dema-admin-interface.php';

            //获取选项值
            $config = DEMA_Admin_Interface::get_seting('delete_mysql');

            //进行判断
            if ($config) {
                $result = [self::$table_data_name, self::$table_change_name];
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

            foreach ($table_names as $name) {
                $table_name = $wpdb->prefix . $name;

                if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
                    return "数据表 $table_name 不存在！";
                } else {
                    $wpdb->query("DROP TABLE IF EXISTS $table_name");
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
            delete_option(self::$option);
        }
    }
}
