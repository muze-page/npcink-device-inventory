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
            global $wpdb;
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
            if ($validation_result !== true) {
                // 发送错误响应
                return wp_send_json_error(['error' => $validation_result,], 500);
            }

            // 所有验证通过，可以继续处理对象
            // 保存设置选项
            //拿到选项中的password，加密后存储
            // 获取原始密码
            $raw_password = $object->password;

            //若密码的值是“已设定”，则替换为原有密码

            if ($raw_password !== '已设定') {
                // 使用 wp_hash_password 函数对密码进行加密
                $hashed_password = wp_hash_password($raw_password);

                // 将加密后的密码替换 $object 中原来的密码值
                $object->password = $hashed_password;
            } else {
                //使用原密码，不更新密码
                $object->password  = self::get_seting('password');
            }



            // 尝试更新选项
            $result = update_option(self::$option, $object);

            if ($result !== false) {
                // 发送成功响应
                return wp_send_json_success(['message' => '设置选项已保存',]);
            } else {
                // 选项未改变会返回false
                //return wp_send_json_error(['error' => '已保存', 'reason' => $wpdb->last_error, 'msg' => $result, 'msg2' => $object], 500);
                return wp_send_json_success(['message' => '已保存',]);
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

            //提示
            function findValueByKey($key, $array)
            {
                // 检查变量 $key 是否存在于数组的键中
                if (array_key_exists($key, $array)) {
                    // 返回与 $key 相匹配的键名的值
                    return $array[$key];
                } else {
                    // 如果没有找到匹配项，则返回 null 或者其他自定义的值
                    return "未找到匹配项";
                }
            }

            // 需要验证的属性列表
            $required_properties = ['route', 'password', 'delete_mysql', 'department', 'device_show_number', 'public_search_route'];

            //提示
            $prompt = array(
                'route' => '请输入路由',
                'password' => '请输入密码',
                'public_search_route' => '请输入路由',
                'delete_mysql' => '请选择删除数据库的状态',
                'department' => '请提供部门',
                'device_show_number' => '请选择显示设备数量',
                'public_search_route' => '请输入公共查询页面路由',
            );



            // 循环遍历需要验证的属性
            foreach ($required_properties as $property) {
                // 检查属性是否存在
                if (!property_exists($object, $property)) {
                    // 调用函数并输出提示
                    $result = findValueByKey($property, $prompt);

                    return "缺少属性：$property" . ' - ' . $result;
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

            if (empty($name)) {
                return wp_send_json_error(['error' => '缺少表名'], 400);
            }
            // 检查表名是否合法
            if (!preg_match('/^[a-zA-Z_]+$/', $name)) {
                return wp_send_json_error(['error' => '无效的表名'], 400);
            }

            // 构建SQL语句
            $table_name = $wpdb->prefix . $name;
            $sql = "SELECT * FROM $table_name";

            // 执行查询操作
            $rows = $wpdb->get_results($sql, ARRAY_A);

            // 根据查询结果返回响应
            if ($rows) {
                // 正常返回数据
                wp_send_json_success(['message' => '成功导出数据', 'data' => $rows,]);
            } else {
                // 返回导出数据失败的错误
                wp_send_json_error(['error' => '导出数据失败', 'reason' => $wpdb->last_error,], 500);
            }

            // 结束请求
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
                return wp_send_json_error(['error' => '传递的数据为空，请检查文件'], 400);
            }
            // 检查传来的姓名是否为空
            if (empty($name)) {
                return wp_send_json_error(['error' => '传递的表名为空，请检查'], 400);
            }

            // 构建插入数据的数组
            $insert_data = array();
            if ($name == self::$table_data_name) {
                foreach ($data as $item) {
                    //设备信息是否为空
                    if (empty($item['data'])||empty($item['uuid'])) {
                        return wp_send_json_error(['error' => '设备信息为空，请检查'], 400);
                    }
                    //是否有重复数据
                    $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                    $table_name = $wpdb->prefix . self::$table_data_name;
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
            if ($name == self::$table_change_name) {
                foreach ($data as $item) {
                    //是否有重复数据
                    $time = isset($item['time']) ? $item['time'] : null;
                    $table_name = $wpdb->prefix . self::$table_change_name;
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
                            'data' => isset($item['data']) ? $item['data'] :  null,
                        );
                    }
                }
            }

            //检查是否有可更新的数据
            if (empty($insert_data)) {
                return wp_send_json_error(['error' => '没有可更新的数据'], 500);
            }

            //准备数据库表名
            $table_name = $wpdb->prefix . $name;

            // 执行批量插入操作
            foreach ($insert_data as $item) {
                $result = $wpdb->insert($table_name, $item);
            }

            // 检查插入结果
            if ($result) {
                return wp_send_json_success([
                    'message' => '成功导入 - ' . count($insert_data) . '套设备信息',
                ]);
            } else {
                $response = array(
                    'error' => '导入数据时发生错误，请检查数据格式',
                    'data' => ($insert_data[1]),
                    'reason' => $wpdb->last_error,
                );
                return wp_send_json_error($response, 500);
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
            $table_name = $wpdb->prefix . self::$table_data_name;
            // 获取通过 Ajax POST 请求传递的对象数据
            $data = isset($_POST['data']) ? ($_POST['data']) : null;
            // 检查是否收到了正确的数据
            if (empty($data)) {
                // 发送错误响应，未收到正确的数据
                return wp_send_json_error(['error' => '未收到部门的数据！'], 400);
            }

            // 执行更新操作
            // 更新表中department字段的值为$object的行，将其替换为"默认"
            $result = $wpdb->update(
                $table_name,
                array('department' => '默认'),
                array('department' => $data)
            );

            // 检查更新操作是否成功
            if ($result === false) {
                // 发送错误响应
                return wp_send_json_error(['error' => '更新数据时发生错误！', 'reason' => $wpdb->last_error,], 500);
            }

            // 发送成功响应
            // 确保 $object 是字符串类型
            return wp_send_json_success([
                'message' => '已移除！' . $data . '部门',
            ]);
        }
    }
}
