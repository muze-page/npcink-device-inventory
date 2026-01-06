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
        }

        /**
         * 添加选项保存接口
         */
        public static  function save_option_callback()
        {
            self::ensure_admin_ajax();
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
                //TODO:不知为啥，初次使用，不修改设置内容，点击保存按钮后，可能拿不到密码，这里做个保底
                // 生成随机字符串
                $random_string = uniqid(mt_rand(), true);

                $object->password  = self::get_seting('password') ? self::get_seting('password') : wp_hash_password($random_string);
            }



            // 尝试更新选项
            $result = update_option(self::$option, $object);

            if ($result !== false) {
                self::clear_pc_cache();
                // 发送成功响应
                return wp_send_json_success(['message' => '设置选项已保存', 'msg' => $object,]);
            } else {
                // 选项未改变会返回false
                return wp_send_json_error(['error' => '没有变化', 'reason' => $wpdb->last_error, 'msg' => $result, 'msg2' => $object], 500);
                //return wp_send_json_success(['message' => '已保存', 'msg' => $object,]);
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
            $required_properties = ['route', 'password', 'delete_mysql',   'public_search_route'];

            //提示
            $prompt = array(
                'route' => '请输入路由',
                'password' => '请输入密码',
                'public_search_route' => '请输入路由',
                'delete_mysql' => '请选择删除数据库的状态',
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
                            return 'password 属性必须是非空字符串类型';
                        }
                        if (empty($object->password)) {
                            return '密码不能为0';
                        }
                        break;
                    case 'delete_mysql':
                        if (!is_bool($object->delete_mysql)) {
                            return 'delete_mysql 属性必须是布尔类型';
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
            self::ensure_admin_ajax();
            global $wpdb;

            // 获取前端传递的参数并进行输入验证
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : null;

            if (empty($name)) {
                return wp_send_json_error(['error' => '缺少表名'], 400);
            }
            $allowed_tables = array(
                self::$table_pc_name,
                self::$table_style_name,
                self::$table_manual_name,
                self::$table_auto_name,
            );
            if (!in_array($name, $allowed_tables, true)) {
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
            self::ensure_admin_ajax();
            global $wpdb;

            // 获取前端传递的参数并进行输入验证
            $text_data = isset($_POST['data']) ? ($_POST['data']) : null; //获取数据
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : null; //获取表名
            $allowed_tables = array(
                self::$table_pc_name,
                self::$table_style_name,
                self::$table_manual_name,
                self::$table_auto_name,
            );

            //拿到解析后的值
            $data_php = json_decode(stripslashes($text_data), true);
            $data = $data_php['data']; //拿到设备数据
            // 检查传来的数据是否为空
            if (empty($data)) {
                return wp_send_json_error(['error' => '传递的数据为空，请检查文件'], 400);
            }
            // 检查传来的数据库表名是否为空
            if (empty($name)) {
                return wp_send_json_error(['error' => '传递的数据库表名为空，请检查'], 400);
            }
            if (!in_array($name, $allowed_tables, true)) {
                return wp_send_json_error(['error' => '无效的表名'], 400);
            }

            // 构建插入数据的数组
            $insert_data = array();
            //电脑设备数据
            if ($name == self::$table_pc_name) {
                foreach ($data as $item) {
                    //设备信息是否为空
                    if (empty($item['data']) || empty($item['uuid'])) {
                        return wp_send_json_error(['error' => '设备信息为空，请检查'], 400);
                    }
                    //是否有重复数据
                    $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                    $table_name = $wpdb->prefix . self::$table_pc_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE uuid = %s",
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
                            'purchase' => isset($item['purchase']) ? $item['purchase'] : 0,
                            'depreciation' => isset($item['depreciation']) ? $item['depreciation'] : 0,
                            'ip' => isset($item['ip']) ? $item['ip'] : '',
                            'created_at' => isset($item['created_at']) ? ($item['created_at']) : null,
                            'updated_at' => isset($item['updated_at']) ? ($item['updated_at']) : null,
                            'uuid' => isset($item['uuid']) ? $item['uuid'] : '',
                            'data' => isset($item['data']) ? ($item['data']) : null,
                        );
                    }
                }
            }

            //自定义设备数据
            if ($name == self::$table_style_name) {
                foreach ($data as $item) {
                    //是否有重复数据
                    $uuid = isset($item['uuid']) ? $item['uuid'] : null; //唯一标识符
                    $table_name = $wpdb->prefix . self::$table_style_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE uuid = %s",
                            $uuid
                        ),
                        ARRAY_A
                    );
                    //没有重复数据，插入数据
                    if (!$existingData) {
                        $insert_data[] = array(
                            'name' => isset($item['name']) ? $item['name'] :  null, //名称
                            'number' => isset($item['number']) ? $item['number'] :  null, //编号
                            'state' => isset($item['state']) ? $item['state'] :  null, //状态
                            'category' => isset($item['category']) ? $item['category'] :  null, //类别
                            'purpose' => isset($item['purpose']) ? $item['purpose'] :  null, //用途
                            'created_at' => isset($item['created_at']) ? $item['created_at'] :  null, //创建时间
                            'uuid' => isset($item['uuid']) ? $item['uuid'] :  null, //唯一标识符
                            'data' => isset($item['data']) ? $item['data'] :  null, //设备数据
                        );
                    }
                }
            }
            //手动变更数据
            if ($name == self::$table_manual_name) {
                foreach ($data as $item) {
                    //是否有重复数据 - 使用record_uuid和created_at来检查重复
                    $record_uuid = isset($item['record_uuid']) ? $item['record_uuid'] : null;
                    $created_at = isset($item['created_at']) ? $item['created_at'] : null;

                    if (!$record_uuid || !$created_at) {
                        // 如果必要字段缺失，跳过此条记录
                        continue;
                    }

                    $table_name = $wpdb->prefix . self::$table_manual_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE record_uuid = %s AND created_at = %s",
                            $record_uuid,
                            $created_at
                        ),
                        ARRAY_A
                    );

                    if (!$existingData) {
                        $insert_data[] = array(
                            'record_uuid' => isset($item['record_uuid']) ? $item['record_uuid'] :  null,
                            'created_at' => isset($item['created_at']) ? $item['created_at'] : null,
                            'user' => isset($item['user']) ? $item['user'] :  null,
                            'type' => isset($item['type']) ? $item['type'] :  null,
                            'data' => isset($item['data']) ? $item['data'] :  null,
                        );
                    }
                }
            }

            //变更自动记录数据
            if ($name == self::$table_auto_name) {
                foreach ($data as $item) {
                    //是否有重复数据 - 使用record_uuid和changed_at来检查重复
                    $record_uuid = isset($item['record_uuid']) ? $item['record_uuid'] : null;
                    $changed_at = isset($item['changed_at']) ? $item['changed_at'] : null;

                    if (!$record_uuid || !$changed_at) {
                        // 如果必要字段缺失，跳过此条记录
                        continue;
                    }

                    $table_name = $wpdb->prefix . self::$table_auto_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE record_uuid = %s AND changed_at = %s",
                            $record_uuid,
                            $changed_at
                        ),
                        ARRAY_A
                    );

                    if (!$existingData) {
                        $insert_data[] = array(
                            'table_name' => isset($item['table_name']) ? $item['table_name'] :  null, //表名
                            'column_name' => isset($item['column_name']) ? $item['column_name'] : null, //字段名
                            'old_value' => isset($item['old_value']) ? $item['old_value'] :  null, //旧值
                            'new_value' => isset($item['new_value']) ? $item['new_value'] :  null, //新值
                            'changed_at' => isset($item['changed_at']) ? $item['changed_at'] :  null, //变更时间
                            'record_uuid' => isset($item['record_uuid']) ? $item['record_uuid'] :  null, //记录唯一标识符
                        );
                    }
                }
            }


            //检查是否有可更新的数据
            if (empty($insert_data)) {
                // 获取原始数据总数
                $total_records = is_array($data) ? count($data) : 0;

                return wp_send_json_error([
                    'error' => sprintf(
                        '已检查 %d 条记录，但由于以下原因未导入任何数据：%s',
                        $total_records,
                        $total_records > 0
                            ? '所有记录均已存在于数据库中'
                            : '导入文件中没有有效数据'
                    ),
                    'total_records' => $total_records,
                    'imported_records' => 0
                ], 200); // 使用200状态码，因为这不是一个错误，而是一个正常的业务逻辑结果
            }

            //准备数据库表名
            $table_name = $wpdb->prefix . $name;

            // 执行批量插入操作
            foreach ($insert_data as $item) {
                $result = $wpdb->insert($table_name, $item);
            }

            // 检查插入结果
            if ($result !== false) {
                $imported_count = count($insert_data);
                if ($name == self::$table_pc_name) {
                    self::clear_pc_cache();
                }
                if ($name == self::$table_style_name) {
                    self::clear_style_cache();
                }
                return wp_send_json_success([
                    'message' => sprintf('成功导入 %d 条记录，刷新页面后查看', $imported_count),
                    'imported_records' => $imported_count,
                    'total_records' => is_array($data) ? count($data) : 0
                ]);
            } else {
                $response = array(
                    'error' => '数据导入失败',
                    'message' => '导入过程中发生数据库错误，请检查数据格式或联系管理员',
                    'reason' => $wpdb->last_error,
                );
                return wp_send_json_error($response, 500);
            }

            wp_die();
        }
    }
}
