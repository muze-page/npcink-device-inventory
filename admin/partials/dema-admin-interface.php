<?php

/**
 * 接口 接收传来的数据
 */
//http://localhost:10048/wp-json/custom/v1/submit-data
if (!class_exists('DEMA_Admin_Interface')) {
    class DEMA_Admin_Interface
    {
        //选项
        public static $option = "device_object_option";

        public static function run()
        {
            //添加接收设备数据api接口
            add_action('rest_api_init', array(__CLASS__, 'create_custom_endpoint'));

            // 保存设置选项接口
            add_action('wp_ajax_save_object_option', array(__CLASS__, 'save_object_option_callback'));
            add_action('wp_ajax_nopriv_save_object_option', array(__CLASS__, 'save_object_option_callback'));

            //添加查询变更接口
            add_action('wp_ajax_search_change_data_callback',  array(__CLASS__, 'search_change_data_callback'));
            add_action('wp_ajax_nopriv_search_change_data_callback',  array(__CLASS__, 'search_change_data_callback'));

            // 修改设备信息接口
            add_action('wp_ajax_update_style_name_callback',  array(__CLASS__, 'update_style_name_callback'));
            add_action('wp_ajax_nopriv_update_style_name_callback',  array(__CLASS__, 'update_style_name_callback'));

            // 修改设备变更信息接口
            add_action('wp_ajax_update_change_callback',  array(__CLASS__, 'update_change_callback'));
            add_action('wp_ajax_nopriv_update_change_callback',  array(__CLASS__, 'update_change_callback'));


            // 删除设备接口
            add_action('wp_ajax_delt_sql_uuid_callback', array(__CLASS__, 'delt_sql_uuid_callback'));
            add_action('wp_ajax_nopriv_delt_sql_uuid_callback', array(__CLASS__, 'delt_sql_uuid_callback'));

            //导出数据接口
            add_action('wp_ajax_export_data_callback', array(__CLASS__, 'export_data_callback'));
            add_action('wp_ajax_nopriv_export_data_callback', array(__CLASS__, 'export_data_callback'));

            //导入数据接口
            add_action('wp_ajax_import_config_data_callback', array(__CLASS__, 'import_config_data_callback'));
            add_action('wp_ajax_nopriv_import_config_data_callback', array(__CLASS__, 'import_config_data_callback'));
        }

        /**
         * 接收数据
         */
        public static function create_custom_endpoint()
        {
            $styleRoute =  self::get_seting('route');

            register_rest_route('npcink/v1', $styleRoute, array(
                'methods'  => 'POST',
                'callback' => array(__CLASS__, 'submit_data_callback'),
                'permission_callback' => '__return_true', // 无需验权
            ));
        }

        /**
         * 验证密码是否正确 是否允许传输数据
         */
        public static function password_verification($data)
        {
            $dataPassword =  self::get_seting('password');

            $password = isset($data['password']) ? $data['password'] : '';

            return $password == $dataPassword;
        }

        /**
         * 处理传来的数据
         */
        public static function submit_data_callback($request)
        {
            header('Access-Control-Allow-Origin: *');

            $data = $request->get_params();

            if (!self::password_verification($data)) {
                return new WP_REST_Response(
                    [
                        'error' => '密码验证失败！',
                        'data' => $data['password'],
                    ],
                    403
                );
            }

            $name = $data['name'];
            $datas = json_encode($data['data']);
            $uuid_hardware = $data['data']['uuid']['hardware'];

            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';

            $existingData = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM $table_name WHERE uuid = %s;",
                    $uuid_hardware
                ),
                ARRAY_A
            );

            if (!$existingData) {
                // 数据不存在，插入新数据
                $wpdb->insert(
                    $table_name,
                    [
                        'uuid' => $uuid_hardware,
                        'name' => $name,
                        'dataNew' => $datas,
                    ],
                    ['%s', '%s', '%s']
                );

                $response = [
                    'message' => '提交成功！',
                    'data' => $data,
                ];
            } else {
                $existingDataDecoded = json_decode($existingData['dataNew'], true);

                if ($existingData['name'] !== $name || $existingDataDecoded !== $data['data']) {
                    // 如果名称或数据有变化，更新现有数据
                    $wpdb->update(
                        $table_name,
                        [
                            'name' => $name,
                            'dataOld' => $existingData['dataNew'],
                            'dataNew' => $datas,
                        ],
                        ['id' => $existingData['id']],
                        ['%s', '%s', '%s'],
                        ['%d']
                    );

                    //存储变更数据
                    $diffs = [];
                    $dataNew = json_decode($datas, true);
                    $dataOld =  $existingDataDecoded;
                    self::compare_arrays($dataNew, $dataOld, $diffs);


                    //添加UUID
                    $updatedData = array_map(function ($obj) use ($dataNew) {
                        $obj["uuid"] = $dataNew["uuid"]["hardware"];
                        return $obj;
                    }, $diffs);

                    // 存入表中
                    self::data_change($updatedData);

                    /**
                     * 检测数据变化
                     * 准备变化的数据
                     * 存入数据库
                     */

                    $response = [
                        'message' => '数据已更新！',
                        'change' => $updatedData,
                    ];
                } else {
                    // 数据未变化
                    $response = [
                        'message' => '数据未变化！',
                        'data' => $data,
                    ];
                }
            }

            return new WP_REST_Response($response, 200);
        }
        /**
         * 检测数据变化
         */
        public static function compare_arrays($arr1, $arr2, &$diffs, $prefix = '')
        {

            foreach ($arr1 as $key => $value1) {
                if (is_array($value1)) {
                    self::compare_arrays($value1, $arr2[$key], $diffs, $prefix . $key . '.');
                } else if ($arr2[$key] !== $value1) {
                    $diff = [
                        'type' => $prefix . $key,
                        'new' => $value1,
                        'old' => $arr2[$key],
                    ];
                    array_push($diffs, $diff);
                }
            }
        }

        /**
         * 数据存入 数据变化表
         */
        public static function data_change($arr)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';

            foreach ($arr as $item) {
                $data = array(
                    'uuid' => isset($item['uuid']) ? sanitize_text_field($item['uuid']) : '默认uuid',
                    'type' => isset($item['type']) ? sanitize_text_field($item['type']) : '',
                    'new' => isset($item['new']) ? sanitize_text_field($item['new']) : '',
                    'old' => isset($item['old']) ? sanitize_text_field($item['old']) : '',
                    'ch_name' => "默认名",
                    'ch_describe' => "默认描述"
                );
                $wpdb->insert($table_name, $data);
            }
        }

        /**
         * 添加选项保存接口
         */
        public static  function save_object_option_callback()
        {

            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            // 获取通过 Ajax POST 请求传递的对象数据
            $object_data = $_POST['object_data'];

            // 将 JSON 字符串解析为 PHP 对象
            $object = json_decode(stripslashes($object_data));

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
         * 创建查询接口，
         */
        public static function search_change_data_callback()
        {

            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            $object_data = $_POST['uuid'];
            //拿到uuid
            $uuid = json_decode(stripslashes($object_data));

            $object = self::get_custom_table_data_by_uuid($uuid);
            //数据库中查找
            // 处理请求，并生成响应数据
            $response = array(
                'status' => 'success',
                'message' => '处理下：Received data1=' . $object,
                'data' =>  $object,
            );



            // 返回响应数据
            wp_send_json($response);
        }

        /**
         * 查找功能
         */
        public static function get_custom_table_data_by_uuid($uuid)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';

            // 使用预处理语句执行查询
            $results = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                ARRAY_A
            );

            return $results;
        }

        /**
         * 修改设备信息接口
         */
        public static function update_style_name_callback()
        {


            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';

            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : ''; //唯一标识符
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : ''; //修改的值
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : ''; //字段名

            // 定义字段与类型的映射关系
            $field_map = array(
                'styleName' => 'styleName',
                'styleNumber' => 'styleNumber',
                'type' => 'is_enabled' //修改状态

            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : '';

            try {
                if (!empty($field_name)) {
                    // 使用预处理语句更新数据库中对应的数据
                    $wpdb->update(
                        $table_name,
                        array($field_name => $data),
                        array('uuid' => $uuid),
                        '%s', // 字段类型
                        '%s'  // 条件类型
                    );

                    // 返回更新成功的响应
                    echo json_encode(array(
                        'success' => true,
                        'table_name' => $table_name,
                        'type' => $type,
                        'field_name' => $field_name,
                        'data' => $data,
                        'uuid' => $uuid
                    ));
                } else {
                    // 未找到对应的字段名
                    echo json_encode(array(
                        'success' => false,
                        'error' => '未找到对应的字段名'
                    ));
                }
            } catch (Exception $e) {
                // 返回更新失败的响应，包含详细的错误信息
                echo json_encode(array(
                    'success' => false,
                    'error' => '数据库更新失败: ' . $e->getMessage()
                ));
            }



            wp_die();
        }

        /**
         * 修改设备变更信息接口
         */
        public static function update_change_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';

            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            // 获取前端传递的参数并进行输入验证
            $id = isset($_POST['id']) ? sanitize_text_field($_POST['id']) : ''; //id
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : ''; //字段名
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : ''; //修改的值


            // 定义字段与类型的映射关系
            $field_map = array(
                'ch_name' => 'ch_name', //修改姓名
                'ch_describe' => 'ch_describe', //修改描述


            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : '';

            try {
                if (!empty($field_name)) {
                    // 使用预处理语句更新数据库中对应的数据
                    $wpdb->update(
                        $table_name,
                        array($field_name => $data),
                        array('id' => $id),
                        '%s', // 字段类型
                        '%s'  // 条件类型
                    );

                    // 返回更新成功的响应
                    echo json_encode(array(
                        'success' => true,
                        'table_name' => $table_name,
                        'type' => $type,
                        'field_name' => $field_name,
                        'data' => $data,
                        'id' => $id
                    ));
                } else {
                    // 未找到对应的字段名
                    echo json_encode(array(
                        'success' => false,
                        'error' => '未找到对应的字段名'
                    ));
                }
            } catch (Exception $e) {
                // 返回更新失败的响应，包含详细的错误信息
                echo json_encode(array(
                    'success' => false,
                    'error' => '数据库更新失败: ' . $e->getMessage()
                ));
            }



            wp_die();
        }


        /**
         * 添加删除设备接口
         */
        public static  function delt_sql_uuid_callback()
        {


            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';
            $table_change = $wpdb->prefix . 'custom_change';

            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : '';

            // 使用预处理语句构建SQL查询
            $sql = $wpdb->prepare("DELETE FROM $table_name WHERE uuid = %s", $uuid);
            $sql_change = $wpdb->prepare("DELETE FROM $table_change WHERE uuid = %s", $uuid);

            // 开始事务
            $wpdb->query('START TRANSACTION');

            try {
                // 执行删除操作
                $result = $wpdb->query($sql);
                $result_change = $wpdb->query($sql_change);

                if ($result === false || $result_change === false) {
                    throw new Exception('删除数据时发生错误');
                }

                // 提交事务
                $wpdb->query('COMMIT');

                wp_send_json([
                    'success' => true,
                    'message' => '行数据已成功删除'
                ]);
            } catch (Exception $e) {
                // 回滚事务
                $wpdb->query('ROLLBACK');

                wp_send_json([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            } finally {
                wp_die();
            }
        }

        /**
         * 添加数据导出接口
         */
        public static function export_data_callback()
        {
            global $wpdb;


            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

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
        public static function import_config_data_callback()
        {
            global $wpdb;


            // 设置跨域访问标头
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: POST');
            header('Access-Control-Allow-Headers: Content-Type');

            // 获取前端传递的参数并进行输入验证
            $text_data = isset($_POST['data']) ? ($_POST['data']) : '';
            $data = json_decode(stripslashes($text_data), true);

            $name = isset($_POST['name']) ? ($_POST['name']) : '';

            if (!empty($data)) {
                // 构建插入数据的数组
                $insert_data = array();
                if ($name == "custom_table") {
                    foreach ($data as $item) {
                        $insert_data[] = array(
                            'is_enabled' => isset($item['is_enabled']) ? $item['is_enabled'] : 1,
                            'name' => isset($item['name']) ? $item['name'] : '',
                            'styleName' => isset($item['styleName']) ? $item['styleName'] : null,
                            'styleNumber' => isset($item['styleNumber']) ? $item['styleNumber'] : 0,
                            'uuid' => isset($item['uuid']) ? $item['uuid'] : '',
                            'dataNew' => isset($item['dataNew']) ? json_encode($item['dataNew']) : null,
                            'dataOld' => isset($item['dataOld']) ? json_encode($item['dataOld']) : null
                        );
                    }
                }
                if ($name == "custom_change") {
                    foreach ($data as $item) {
                        $insert_data[] = array(
                            'uuid' => isset($item['uuid']) ? $item['uuid'] :  null,
                            'time' => isset($item['time']) ? $item['time'] :  0,
                            'type' => isset($item['type']) ? $item['type'] :  null,
                            'new' => isset($item['new']) ? $item['new'] :  null,
                            'old' => isset($item['old']) ? $item['old'] :  null,
                            'ch_name' => isset($item['ch_name']) ? $item['ch_name'] :  null,
                            'ch_describe' => isset($item['ch_describe']) ? $item['ch_describe'] :  null,
                        );
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






        /**
         * 提供选项
         */
        public static function get_seting($option)
        {
            //拿到选项值
            $config = get_option(self::$option);
            $value =  self::get_config($config, $option);
            return $value;
        }
        /**
         * 从对象中获取属性值
         *
         * @param object $config 对象
         * @param string $property 从对象中获取的属性名
         * @param string $defaultValue 默认值（可选）
         * @return mixed 属性值或默认值
         */
        public static function get_config($config, $property, $defaultValue = false)
        {
            /**
             * 是否是对象
             * 对象中是否有此键名
             * 在对象中的此值是否为空
             */
            if (is_object($config) && property_exists($config, $property) && !empty($config->$property)) {
                return $config->$property;
            } else {
                //不存在则输出默认值
                return $defaultValue;
            }
        }
    } //end
}
