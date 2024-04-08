<?php

/**
 * 设置接口
 */
if (!class_exists('DEMA_Admin_Interface_Seting')) {
    class DEMA_Admin_Interface_Seting extends DEMA_Admin_Interface
    {
        public static function run()
        {
            // 保存设置选项接口
            add_action('wp_ajax_save_object_option', array(__CLASS__, 'save_option_callback'));

            //导出数据接口
            add_action('wp_ajax_export_data_callback', array(__CLASS__, 'export_data_callback'));

            //导入数据接口
            add_action('wp_ajax_import_data_callback', array(__CLASS__, 'import_data_callback'));

            //移除部门接口
            add_action('wp_ajax_remove_department_callback', array(__CLASS__, 'remove_department_callback'));
        }
        /**
         * 移除部门接口
         * 接受部门名称，查找数据库中包含此部门的，替换为默认
         */
        public static function remove_department_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';

            // 检查是否收到了正确的数据
            if (isset($_POST['data'])) {
                // 获取通过 Ajax POST 请求传递的对象数据
                $data = $_POST['data'];

                // 尝试解析 JSON 数据
                $object = json_decode(stripslashes($data));

                // 确保成功解析了 JSON 数据
                if ($object !== null) {
                    // 确保 $object 是字符串类型
                    $object_value = $wpdb->prepare('%s', $object);

                    // 执行更新操作
                    // 更新表中department字段的值为$object的行，将其替换为"默认"
                    $result = $wpdb->update(
                        $table_name,
                        array('department' => '默认'),
                        array('department' => $object)
                    );

                    // 检查更新操作是否成功
                    if ($result !== false) {
                        // 发送成功响应
                        $response = array(
                            'message' => '设置选项已保存！',
                            'object' => $object_value,
                        );

                        // 使用 wp_send_json 函数发送 JSON 响应，避免汉字转义
                        wp_send_json($response, 200, JSON_UNESCAPED_UNICODE);
                    } else {
                        // 发送错误响应
                        $response = array(
                            'error' => '更新数据时发生错误。',
                        );

                        wp_send_json($response, 500);
                    }
                } else {
                    // 发送错误响应，无法解析 JSON 数据
                    $response = array(
                        'error' => '无法解析收到的数据。',
                    );

                    wp_send_json($response, 400);
                }
            } else {
                // 发送错误响应，未收到正确的数据
                $response = array(
                    'error' => '未收到正确的数据。',
                );

                wp_send_json($response, 400);
            }
        }

        /**
         * 添加选项保存接口
         */
        public static  function save_option_callback()
        {
            // 获取通过 Ajax POST 请求传递的对象数据
            $object_data = $_POST['object_data'];

            // 将 JSON 字符串解析为 PHP 对象
            $object = json_decode(stripslashes($object_data));

            //TODO:验证数据格式，department必须的字符串数组
            // 保存设置选项
            update_option(self::$option, $object);

            // 发送成功响应
            $response = array(
                'message' => '设置选项已保存！',
                'object' => $object,

            );

            // 使用 wp_send_json 函数发送 JSON 响应，避免汉字转义
            wp_send_json($response, 200, JSON_UNESCAPED_UNICODE);
        }


        /**
         * 添加数据导出接口
         */
        public static function export_data_callback()
        {
            global $wpdb;

            // 获取前端传递的参数并进行输入验证
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';

            // 检查表名是否合法
            if (!preg_match('/^[a-zA-Z_]+$/', $name)) {
                wp_send_json([
                    'success' => false,
                    'message' => '无效的表名'
                ]);
                return;
            }

            // 构建SQL语句
            $table_name = $wpdb->prefix . $name;
            $sql = "SELECT * FROM $table_name";

            // 执行查询操作
            $rows = $wpdb->get_results($sql, ARRAY_A);

            if ($rows) {
                wp_send_json([
                    'success' => true,
                    'data' => $rows
                ]);
            } else {
                wp_send_json([
                    'success' => false,
                    'message' => '查询数据时发生错误'
                ]);
            }

            wp_die();
        }



        /**
         * 添加数据导入接口
         */
        public static function import_data_callback()
        {
            global $wpdb;

            // 获取前端传递的参数并进行输入验证
            $text_data = isset($_POST['data']) ? ($_POST['data']) : '';
            $data = json_decode(stripslashes($text_data), true);

            $name = isset($_POST['name']) ? ($_POST['name']) : '';

            if (!empty($data)) {
                // 构建插入数据的数组
                $insert_data = array();
                if ($name == "custom_table") {
                    foreach ($data as $item) {
                        //是否有重复数据
                        $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                        $table_name = $wpdb->prefix . 'custom_table';
                        $existingData = $wpdb->get_row(
                            $wpdb->prepare(
                                "SELECT * FROM $table_name WHERE uuid = %s;",
                                $uuid
                            ),
                            ARRAY_A
                        );

                        if (!$existingData) {
                            $insert_data[] = array(
                                'name' => isset($item['name']) ? $item['name'] : '',
                                'state' => isset($item['state']) ? $item['state'] : 'apply',
                                'number' => isset($item['number']) ? $item['number'] : 0,
                                'department' => isset($item['department']) ? $item['department'] : 0,
                                'time' => isset($item['time']) ? ($item['time']) : null,
                                'uuid' => isset($item['uuid']) ? $item['uuid'] : '',
                                'data' => isset($item['data']) ? ($item['data']) : null,
                            );
                        }
                    }
                }
                if ($name == "custom_change") {
                    foreach ($data as $item) {
                        //是否有重复数据
                        $time = isset($item['time']) ? $item['time'] : null;
                        $table_name = $wpdb->prefix . 'custom_change';
                        $existingData = $wpdb->get_row(
                            $wpdb->prepare(
                                "SELECT * FROM $table_name WHERE time = %s;",
                                $time
                            ),
                            ARRAY_A
                        );

                        if (!$existingData) {
                            $insert_data[] = array(
                                'uuid' => isset($item['uuid']) ? $item['uuid'] :  null,
                                'time' => isset($item['time']) ? $item['time'] :  0,
                                'user' => isset($item['user']) ? $item['user'] :  null,
                                'type' => isset($item['type']) ? $item['type'] :  null,
                                'msg' => isset($item['msg']) ? $item['msg'] :  null,
                            );
                        }
                    }
                }

                //准备数据库表名
                $table_name = $wpdb->prefix . $name;

                // 执行批量插入操作
                foreach ($insert_data as $item) {
                    $result = $wpdb->insert($table_name, $item);
                    // echo 'insert_data: ';
                    //print_r($item);
                }

                // 检查插入结果
                if ($result) {
                    $response = array(
                        'success' => true,
                        'message' => '已成功导入',
                        'msg' => $name
                    );
                } else {
                    $error_message = $wpdb->last_error;
                    echo "插入操作失败，错误信息：$error_message";

                    $response = array(
                        'success' => false,
                        'message' => '导入数据时发生错误',
                        'data' => ($insert_data[1])
                    );
                }
            } else {
                $response = array(
                    'success' => false,
                    'message' => '传递的数据为空'
                );
            }
            // 返回JSON格式的结果
            wp_send_json($response);
            wp_die();
        }
    }
}
