<?php

/**
 * 接口 硬件变更自动记录查询接口
 * 接收UUID，返回查询的数据列表
 */
if (!class_exists('DEMA_Admin_Interface_Change_Auto_Record')) {
    class DEMA_Admin_Interface_Change_Auto_Record extends DEMA_Admin_Interface
    {
        /**
         * 接收数据
         */
        public static function run()
        {
            //查 - 设备变更信息接口
            add_action('wp_ajax_auto_change_data_callback',  array(__CLASS__, 'auto_change_data_callback'));

            //查全部 - 设备变更信息接口
            add_action('wp_ajax_auto_change_all_data_callback',  array(__CLASS__, 'auto_change_all_data_callback'));
        }
        /**
         * 创建查询接口，
         */
        public static function auto_change_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_change_auto;

            //拿到值
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //字段名

            //检查是否有值
            if (empty($uuid)) {
                return wp_send_json_error(['error' => '缺少参数：uuid - 设备唯一编号'], 400);
            }

            //查询
            // 使用预处理语句执行查询
            $object = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table_name WHERE record_uuid = %s", $uuid),
                ARRAY_A
            );

            if (!empty($object)) {
                // 返回查询结果
                return wp_send_json_success([
                    'message' => '查询指定设备变更自动记录成功',
                    'data' =>  $object,
                ]);
            } else {
                // 返回空数组表示没有找到符合条件的记录
                return wp_send_json_error([
                    'error' => '暂未查到变更记录',
                    'reason' => $wpdb->last_error,
                    'data' =>  [],
                ], 500);
            }
        }
        //查询全部变更数据
        public static function auto_change_all_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_change_auto;
            // 使用 $wpdb 对象执行 SQL 查询
            $results = $wpdb->get_results("SELECT * FROM $table_name", OBJECT);

            // 将查询结果转换为数组对象
            $data_array = array();
            foreach ($results as $result) {
                $data_array[] = (array) $result;
            }
            return wp_send_json_success(['message' => '查询全部变更自动记录数据成功', 'data' =>  $data_array,]);
        }
    }
}
