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
         * 添加选项保存接口
         */
        public static  function save_option_callback()
        {
            // 获取通过 Ajax POST 请求传递的对象数据
            $object_data = isset($_POST['object_data']) ? sanitize_text_field($_POST['object_data']) : null;

            // 将 JSON 字符串解析为 PHP 对象
            $object = json_decode(stripslashes($object_data));

            if (empty($object)) {
                return wp_send_json_error([
                    'error' => '设置选项为空',
                ], 403);
            }

            //进行对象验证
            $validation_result = self::validate_object($object);

            if ($validation_result === true) {
                // 所有验证通过，可以继续处理对象
                // 保存设置选项
                //拿到选项中的password，加密后存储
                // 获取原始密码
                $raw_password = $object->password;

                // 使用 wp_hash_password 函数对密码进行加密
                $hashed_password = wp_hash_password($raw_password);

                // 将加密后的密码替换 $object 中原来的密码值
                $object->password = $hashed_password;


                update_option(self::$option, $object);

                // 发送成功响应
                // 使用 wp_send_json 函数发送 JSON 响应，避免汉字转义200, JSON_UNESCAPED_UNICODE
                return wp_send_json_success(['message' => '设置选项已保存']);
            } else {
                // 发送错误响应
                return wp_send_json_error(['message' => $validation_result,]);
            }
        }


        //选项类型验证
        public static function validate_object($object)
        {
            //验证是否为字符串数组
            function is_string_array($array)
            {
                return array_reduce($array, function ($carry, $item) {
                    return $carry && is_string($item);
                }, true);
            }
            // 需要验证的属性列表
            $required_properties = ['route', 'password', 'delete_mysql', 'department', 'device_show_number', 'public_search_route'];

            // 循环遍历需要验证的属性
            foreach ($required_properties as $property) {
                // 检查属性是否存在
                if (!property_exists($object, $property)) {
                    return "缺少属性：$property";
                }

                // 根据属性类型进行验证
                switch ($property) {
                    case 'route':
                        if (!is_string($object->route)) {
                            return 'route 属性必须是字符串类型';
                        }
                        break;
                    case 'password':
                        if (!is_string($object->password)) {
                            return 'password 属性必须是字符串类型';
                        }
                        break;
                    case 'delete_mysql':
                        if (!is_bool($object->delete_mysql)) {
                            return 'delete_mysql 属性必须是布尔类型';
                        }
                        break;
                    case 'department':
                        if (!is_string_array($object->department)) {
                            return 'department 属性必须是字符串数组类型';
                        }
                        break;

                    case 'device_show_number':
                        if (is_numeric($object->device_show_number)) {
                            if (is_string($object->device_show_number)) {
                                return 'device_show_number 属性必须是数字类型';
                            }
                        }

                        break;

                    case 'public_search_route':
                        if (!is_string($object->public_search_route)) {
                            return 'public_search_route 属性必须是字符串类型';
                        }
                        break;


                    default:
                        // 如果有其他属性需要验证，可以在这里添加逻辑
                        break;
                }
            }

            // 所有属性验证通过
            return true;
        }



        /**
         * 添加数据导出接口
         */
        public static function export_data_callback()
        {
            global $wpdb;

            // 获取前端传递的参数并进行输入验证
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : null;

            // 检查表名是否合法
            if (!preg_match('/^[a-zA-Z_]+$/', $name)) {
                return wp_send_json_error([
                    'message' => '无效的表名'
                ]);
            }

            // 构建SQL语句
            $table_name = $wpdb->prefix . $name;
            $sql = "SELECT * FROM $table_name";

            // 执行查询操作
            $rows = $wpdb->get_results($sql, ARRAY_A);

            if ($rows) {
                //正常返回数据

                return wp_send_json_success([
                    'data' => $rows,
                    'message' => '成功导出数据',
                ]);
            } else {
                return  wp_send_json_error([
                    'message' => '查询数据时发生错误,请检查表名是否正确'
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
            $text_data = isset($_POST['data']) ? ($_POST['data']) : null;
            $name = isset($_POST['name']) ? ($_POST['name']) : null;

            //拿到解析后的值
            $data = json_decode(stripslashes($text_data), true);

            // 检查传来的数据是否为空
            if (empty($data)) {
                $response = array(
                    'message' => '传递的数据为空，请检查文件'
                );
                return wp_send_json_error($response);
            }

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
                }

                // 检查插入结果
                if ($result) {
                    $response = array(
                        'message' => '导入成功，导入前的设备信息未变更',
                    );
                    return wp_send_json_success($response);
                } else {
                    $error_message = $wpdb->last_error;
                    //echo "插入操作失败，错误信息：$error_message";

                    $response = array(
                        'message' => '导入数据时发生错误，请检查数据格式',
                        'data' => ($insert_data[1]),
                        'msg' => $error_message,
                    );
                    return wp_send_json_error($response);
                }
            }
            wp_die();
        }

        /**
         * 移除部门接口
         * 接受部门名称，查找数据库中包含此部门的，替换为默认
         */
        public static function remove_department_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';



            // 获取通过 Ajax POST 请求传递的对象数据
            $data = isset($_POST['data']) ? ($_POST['data']) : null;
            // 检查是否收到了正确的数据
            if (!$data) {
                // 发送错误响应，未收到正确的数据
                return wp_send_json_error(['message' => '未收到部门的数据！']);
            }

            // 尝试解析 JSON 数据
            $object = json_decode(stripslashes($data));

            // 执行更新操作
            // 更新表中department字段的值为$object的行，将其替换为"默认"
            $result = $wpdb->update(
                $table_name,
                array('department' => '默认'),
                array('department' => $object)
            );

            // 检查更新操作是否成功
            if ($result) {
                // 发送错误响应
                return wp_send_json_error(['message' => '更新数据时发生错误！']);
            }

            // 发送成功响应
            // 确保 $object 是字符串类型
            $object_value = $wpdb->prepare('%s', $object);
            return wp_send_json_success([
                'message' => '已移除！' . $object_value . '部门',
                'msg' => $result,
            ]);

            // 使用 wp_send_json 函数发送 JSON 响应，避免汉字转义
            //wp_send_json($response, 200, JSON_UNESCAPED_UNICODE);

        }
    }
}
