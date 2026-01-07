<?php

/**
 * 手动变更接口 - 增删改查
 */
if (!class_exists('DEMA_Admin_Interface_Table_Manual')) {
    class DEMA_Admin_Interface_Table_Manual extends DEMA_Admin_Interface
    {
        public static function run()
        {
            // admin-ajax 已迁移到 REST，保留类方法供 REST 复用
        }

        /**
         * 增 - 设备变更信息接口
         */
        public static function add_change_data_callback()
        {
            self::ensure_admin_ajax();
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_manual_name;

            // 获取前端传递的参数并进行输入验证，如果有值，肯定是字符串类型
            $record_uuid = isset($_POST['record_uuid']) ? sanitize_text_field($_POST['record_uuid']) : null; //id
            $user = isset($_POST['user']) ? sanitize_text_field($_POST['user']) : null; //用户名
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : null; //字段名
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //修改的值

            //是否缺少参数
            // 假设 $uuid, $user, $type, $data 是需要检查的变量
            $variables = compact('record_uuid', 'user', 'type', 'data');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = ['record_uuid' => 'record_uuid - 设备唯一编号', 'user' => 'user - 变更用户名', 'type' => 'type - 变更类型', 'data' => 'data - 变更内容'];
                return wp_send_json_error(['error' => '缺少参数：' . $param_names[$null_param]], 400);
            }


            // 使用预处理语句插入数据
            $result = $wpdb->insert(
                $table_name,
                array(
                    'record_uuid' => $record_uuid,
                    'user' => $user,
                    'type' => $type,
                    'data' => $data
                ),
                array(
                    '%s', // uuid
                    '%s', // user
                    '%s', // type
                    '%s'  // data
                )
            );

            // 检查插入是否成功
            if ($result !== false) {
                return wp_send_json_success(['message' => '插入变更数据成功']);
            } else {
                return wp_send_json_error(['error' => '插入变更数据失败，可能是字数太多', 'reason' => $wpdb->last_error,], 500);
            }
            // 插入成功，可以进行其他操作
            wp_die();
        }


        /**
         * 修改 - 设备变更信息接口
         */
        public static function modify_change_data_callback()
        {
            self::ensure_admin_ajax();
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_manual_name;
            // 获取前端传递的参数并进行输入验证
            $id = isset($_POST['id']) ? sanitize_text_field($_POST['id']) : null; //id序号
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : null; //字段名
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //修改的值
            //是否缺少参数
            // 假设 $uuid, $user, $type, $data 是需要检查的变量
            $variables = compact('id',  'type', 'data');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = ['id' => 'id - 设备唯一编号',  'type' => 'type - 变更类型', 'data' => 'data - 变更内容'];
                return wp_send_json_error(['error' => '缺少参数：' . $param_names[$null_param]], 400);
            }

            // 定义字段与类型的映射关系
            $field_map = array(
                'user' => 'user', //修改姓名
                'type' => 'type', //类型
                'data' => 'data', //修改描述
            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : null;

            if (empty($field_name)) {
                // 未找到对应的字段名
                return wp_send_json_error(['error' => '未找到字段名 - ' . $type], 400);
            }

            // 使用预处理语句更新数据库中对应的数据
            $result = $wpdb->update(
                $table_name,
                array($field_name => $data),
                array('id' => $id),
                '%s', // 字段类型
                '%s'  // 条件类型
            );

            if ($result !== false) {
                // 返回更新成功的响应
                return wp_send_json_success(['message' => '已更新']);
            } else {
                // 获取更新失败的原因
                return wp_send_json_error(['error' => '更新失败', 'reason' => $wpdb->last_error], 500);
            }
            wp_die();
        }

        /**
         * 创建查询接口，
         */
        public static function search_change_data_callback()
        {
            self::ensure_admin_ajax();
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_manual_name;//手动变更表

            //拿到值
            $record_uuid = isset($_POST['record_uuid']) ? sanitize_text_field($_POST['record_uuid']) : null; //字段名

            //检查是否有record_uuid值
            if (empty($record_uuid)) {
                return wp_send_json_error(['error' => '缺少参数：record_uuid - 设备唯一编号'], 400);
            }
            // 使用预处理语句执行查询
            $object = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table_name WHERE record_uuid = %s", $record_uuid),
                ARRAY_A
            );

            if (!empty($object)) {
                // 返回查询结果
                return wp_send_json_success(['message' => '查询成功', 'data' =>  $object,]);
            } else {
                // 返回空数组表示没有找到符合条件的记录
                return wp_send_json_error(['error' => '手动变更记录暂未查到', 'reason' => $wpdb->last_error,], 404);
            }
        }

        //输出全部变更数据
        public static function search_change_all_data_callback()
        {
            self::ensure_admin_ajax();
            global $wpdb;
            $table_data_pc = $wpdb->prefix . self::$table_pc_name; //获取电脑设备数据表
            $table_data_manual = $wpdb->prefix . self::$table_manual_name; //获取手动变更数据表

            $sql = "SELECT m.*, p.name AS pc_name, p.number AS pc_number, p.department AS pc_department
                FROM $table_data_manual m
                LEFT JOIN $table_data_pc p ON m.record_uuid = p.uuid";
            $results = $wpdb->get_results($sql, ARRAY_A);

            $data_array = array();
            foreach ($results as $row) {
                if (!empty($row['pc_name'])) {
                    $row['msg'] = $row['pc_name'] . " _ " . $row['pc_department'] . " _ " . $row['pc_number'];
                }
                unset($row['pc_name'], $row['pc_number'], $row['pc_department']);
                $data_array[] = $row;
            }
            return wp_send_json_success(['message' => '查询成功', 'data' =>  $data_array,]);
        }
    }
}
