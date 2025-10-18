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
            // 查数据，提供UUID是查指定设备，不提供则查全部设备
            add_action('wp_ajax_auto_change_data_callback',  array(__CLASS__, 'auto_change_data_callback'));
        }

        /**
         * 查询全部变更自动记录数据
         */
        public static function auto_change_data_callback()
        {
            global $wpdb;
            $table_auto = $wpdb->prefix . self::$table_auto_name; // 自动记录
            $table_pc = $wpdb->prefix . self::$table_pc_name; // 电脑设备
            $table_style = $wpdb->prefix . self::$table_style_name; // 自定义设备

            // 获取UUID参数
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null;

            // 如果提供了UUID，则查询指定设备的变更记录
            if (!empty($uuid)) {
                $object = $wpdb->get_results(
                    $wpdb->prepare("SELECT * FROM $table_auto WHERE record_uuid = %s ORDER BY id DESC", $uuid),
                    ARRAY_A
                );

                if (!is_wp_error($object) && !empty($object)) {
                    // 返回查询结果
                    wp_send_json_success([
                        'message' => '查询指定设备变更自动记录成功',
                        'data' => $object,
                    ]);
                } else {
                    // 返回空数组表示没有找到符合条件的记录
                    wp_send_json_error([
                        'error' => '暂未查到变更记录',
                        'data' => [],
                    ], 204);//强调没有查到内容
                }
                return;
            }

            // 查询所有变更记录
            $results = $wpdb->get_results("SELECT * FROM $table_auto ORDER BY id DESC", ARRAY_A);

            if (is_wp_error($results)) {
                wp_send_json_error([
                    'error' => '数据库查询出错',
                    'reason' => $wpdb->last_error,
                ], 500);
                return;
            }

            // 处理数据，添加设备信息
            $data_array = self::process_auto_change_data($results, $table_pc, $table_style);

            wp_send_json_success([
                'message' => '查询全部变更自动记录数据成功',
                'data' => $data_array
            ]);
        }

        /**
         * 处理自动变更数据，添加设备相关信息
         *
         * @param array $data 变更记录数据
         * @param string $table_pc 电脑设备表名
         * @param string $table_style 自定义设备表名
         * @return array 处理后的数据
         */
        private static function process_auto_change_data($data, $table_pc, $table_style)
        {
            global $wpdb;

            if (empty($data)) {
                return [];
            }

            // 遍历数组对象，根据UUID值查询第二张表，获取name字段的值并更新原始数组对象
            foreach ($data as $key => $record) {
                $uuid = $record['record_uuid']; // 拿到UUID
                $table_name = $record['table_name']; // 表名
                $name_result = null;

                // 根据表名查询对应设备信息
                switch ($table_name) {
                    case 'style':
                        // 自定义设备
                        $name_result = $wpdb->get_row(
                            $wpdb->prepare("SELECT name, number FROM $table_style WHERE uuid = %s", $uuid),
                            ARRAY_A
                        );
                        break;

                    case 'pc':
                        // 电脑设备
                        $name_result = $wpdb->get_row(
                            $wpdb->prepare("SELECT name, number FROM $table_pc WHERE uuid = %s", $uuid),
                            ARRAY_A
                        );
                        break;
                }

                if ($name_result) {
                    // 更新原始数组对象中的msg键
                    $name = $name_result['name'];
                    $number = $name_result['number'];
                    $data[$key]['msg'] = $name . " _ " . $number;
                }
            }

            // 关键值替换映射
            $tableNameMap = [
                'style' => '自定义设备',
                'pc' => '电脑设备'
            ];

            $columnNameMap = [
                'state' => '设备状态',
            ];

            $oldValueMap = [
                'apply' => '使用',
                'idie' => '闲置',
                'fault' => '故障',
                'repair' => '维修',
                'scrap' => '报废',
            ];

            // 遍历数据并替换匹配的值
            foreach ($data as &$row) {
                // 替换表名
                if (isset($row['table_name']) && isset($tableNameMap[$row['table_name']])) {
                    $row['table_name'] = $tableNameMap[$row['table_name']];
                }

                // 替换列名
                if (isset($row['column_name']) && isset($columnNameMap[$row['column_name']])) {
                    $row['column_name'] = $columnNameMap[$row['column_name']];
                }

                // 替换旧值
                if (isset($row['old_value']) && isset($oldValueMap[$row['old_value']])) {
                    $row['old_value'] = $oldValueMap[$row['old_value']];
                }

                // 替换新值
                if (isset($row['new_value']) && isset($oldValueMap[$row['new_value']])) {
                    $row['new_value'] = $oldValueMap[$row['new_value']];
                }
            }

            // 销毁引用变量
            unset($row);

            return $data;
        }
    }
}
