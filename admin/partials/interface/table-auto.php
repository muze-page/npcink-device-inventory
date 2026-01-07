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
            // admin-ajax 已迁移到 REST，保留类方法供 REST 复用
        }

        /**
         * 查询全部变更自动记录数据
         */
        public static function auto_change_data_callback()
        {
            self::ensure_admin_ajax();
            global $wpdb;
            $table_auto = $wpdb->prefix . self::$table_auto_name; // 自动记录
            $table_pc = $wpdb->prefix . self::$table_pc_name; // 电脑设备
            $table_style = $wpdb->prefix . self::$table_style_name; // 自定义设备

            // 获取UUID参数
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null;

            $select_sql = "SELECT a.*,
                CASE
                    WHEN a.table_name = 'pc' THEN CONCAT(COALESCE(p.name, ''), ' _ ', COALESCE(p.number, ''))
                    WHEN a.table_name = 'style' THEN CONCAT(COALESCE(s.name, ''), ' _ ', COALESCE(s.number, ''))
                    ELSE NULL
                END AS msg
                FROM $table_auto a
                LEFT JOIN $table_pc p ON a.table_name = 'pc' AND a.record_uuid = p.uuid
                LEFT JOIN $table_style s ON a.table_name = 'style' AND a.record_uuid = s.uuid";

            // 如果提供了UUID，则查询指定设备的变更记录
            if (!empty($uuid)) {
                $object = $wpdb->get_results(
                    $wpdb->prepare("$select_sql WHERE a.record_uuid = %s ORDER BY a.id DESC", $uuid),
                    ARRAY_A
                );

                if (!is_wp_error($object) && !empty($object)) {
                    // 返回查询结果
                    wp_send_json_success([
                        'message' => '查询指定设备变更自动记录成功',
                        'data' => self::process_auto_change_data($object),
                    ]);
                } else {
                    // 返回空数组表示没有找到符合条件的记录
                    wp_send_json_error([
                        'error' => '自动变更记录暂未查到',
                    ], 404);//强调没有查到内容
                }
                return;
            }

            // 没有提供UUID，则查询所有变更记录
            $results = $wpdb->get_results("$select_sql ORDER BY a.id DESC", ARRAY_A);

            if (is_wp_error($results)) {
                wp_send_json_error([
                    'error' => '数据库查询出错',
                    'reason' => $wpdb->last_error,
                ], 500);
                return;
            }

            // 处理数据，添加设备信息
            $data_array = self::process_auto_change_data($results);

            wp_send_json_success([
                'message' => '查询全部变更自动记录数据成功',
                'data' => $data_array
            ]);
        }

        /**
         * 处理自动变更数据，添加设备相关信息
         *
         * @param array $data 变更记录数据
         * @return array 处理后的数据
         */
        private static function process_auto_change_data($data)
        {
            if (empty($data)) {
                return [];
            }

            // 关键值替换映射
            // 表名
            $tableNameMap = [
                //'style' => '自定义设备',
                //'pc' => '电脑设备'
            ];

            //列名
            $columnNameMap = [
                //'state' => '设备状态',
            ];

            //状态
            $oldValueMap = [
                //'apply' => '使用',
                //'idie' => '闲置',
                //'fault' => '故障',
                //'repair' => '维修',
                //'scrap' => '报废',
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
