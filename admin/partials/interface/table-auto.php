<?php

/**
 * 接口 变更自动记录查询接口
 * 接收UUID，返回查询的数据列表
 */
if (!class_exists('DEMA_Admin_Interface_Table_Auto')) {
    class DEMA_Admin_Interface_Table_Auto extends DEMA_Admin_Interface
    {
        /**
         * 接收数据
         */
        public static function run()
        {
            //TODO:考虑合并两个接口，并且使用缓存技术
            //查指定设备 - 设备变更信息接口
            add_action('wp_ajax_auto_change_data_callback',  array(__CLASS__, 'auto_change_data_callback'));

            //查全部 - 设备变更信息接口
            add_action('wp_ajax_auto_change_all_data_callback',  array(__CLASS__, 'auto_change_all_data_callback'));
        }
        /**
         * 创建查询接口，查询指定的设备变更信息
         */
        public static function auto_change_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_auto_name;

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

            //返回值逆序排列
            $object = array_reverse($object);

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
        //查询全部变更自动记录数据
        public static function auto_change_all_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_auto_name; //自动记录
            $table_data = $wpdb->prefix . self::$table_pc_name; //电脑设备
            $table_style = $wpdb->prefix . self::$table_style_name; //自定义设备
            // 使用 $wpdb 对象执行 SQL 查询
            $results = $wpdb->get_results("SELECT * FROM $table_name", OBJECT);

            // 将查询结果转换为数组对象
            $data_array = array();
            foreach ($results as $result) {
                $data_array[] = (array) $result;
            };

            // 遍历数组对象，根据UUID值查询第二张表，获取name字段的值并更新原始数组对象
            foreach ($data_array as $key => $data) {
                $uuid = $data['record_uuid']; //拿到UUID
                $table_name = $data['table_name']; //表名
                $name_result = null;
                //自定义设备
                if ($table_name == 'style') {
                    // 查询第二张表获取name字段的值
                    $name_result = $wpdb->get_row($wpdb->prepare("SELECT name, number  FROM $table_style WHERE uuid = %s", $uuid), ARRAY_A);
                }

                //电脑设备
                if ($table_name == 'data') {
                    // 查询第二张表获取name字段的值
                    $name_result = $wpdb->get_row($wpdb->prepare("SELECT name, number FROM $table_data WHERE uuid = %s", $uuid), ARRAY_A);
                }


                if ($name_result) {
                    // 更新原始数组对象中的name键名
                    $name = $name_result['name'];
                    $number = $name_result['number'];
                    //$data_array[$key]['number'] =  $number;
                    $data_array[$key]['msg'] = $name   . " _ "  . $number;
                }
            }

            //关键值替换
            // 准备替换表名映射
            $tableNameMap = array(
                'style' => '自定义设备',
                'data' => '电脑设备'
            );
            // 准备字段名表名映射
            $columnNameMap = array(
                'state' => '设备状态',
            );

            // 准备字段名表名映射
            $oldValueMap = array(
                'apply' => '使用',
                'idie' => '闲置',
                'fault' => '故障',
                'repair' => '维修',
                'scrap' => '报废',
            );

            // 遍历数据并替换匹配的table_name值
            foreach ($data_array as &$row) {
                if (isset($row['table_name']) && isset($tableNameMap[$row['table_name']])) {
                    $row['table_name'] = $tableNameMap[$row['table_name']];
                }
                if (isset($row['column_name']) && isset($columnNameMap[$row['column_name']])) {
                    $row['column_name'] = $columnNameMap[$row['column_name']];
                }
                if (isset($row['old_value']) && isset($oldValueMap[$row['old_value']])) {
                    $row['old_value'] = $oldValueMap[$row['old_value']];
                }
                if (isset($row['new_value']) && isset($oldValueMap[$row['new_value']])) {
                    $row['new_value'] = $oldValueMap[$row['new_value']];
                }
            }
            unset($row); // 销毁引用变量

            return wp_send_json_success(['message' => '查询全部变更自动记录数据成功', 'data' =>  $data_array,]);
        }
    }
}
