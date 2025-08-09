<?php

/**
 * 接口 接收传来的数据
 * 使用特定算法算出的UUID，用于校验机器唯一性，
 * 第一张网卡的mac地址加设备UUID，再进行md5处理，得到UUID
 */
if (!class_exists('DEMA_Admin_Interface_Pc_Data_Input')) {
    class DEMA_Admin_Interface_Pc_Data_Input extends DEMA_Admin_Interface
    {
        //表名
        public static $table_name;

        /**
         * 接收数据
         */
        public static function run()
        {

            /**
             * 添加接收设备数据api接口
             * http://localhost:10048/wp-json/npcink/v1/submit-data
             */
            add_action('rest_api_init', array(__CLASS__, 'create_custom_endpoint'));

            /**
             * 添加查询设备数据api接口
             * http://localhost:10048/wp-json/npcink/v1/query?number=1&password=9527
             */
            add_action('rest_api_init', array(__CLASS__, 'create_query_endpoint'));
        }

        /**
         * 添加查询设备数据api接口
         * 
         */
        public static function create_query_endpoint()
        {
            register_rest_route('npcink/v1', '/query', array(
                'methods' => 'GET',
                'callback' => array(__CLASS__, 'query_data'),
                'permission_callback' => '__return_true', // 无需验权（验证密码即可）
            ));
        }

        /**
         * 前端查询数据
         * data:编号或姓名
         * password:密码
         * all inspect
         */
        public static function query_data($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . self::$table_data_name;
            header('Access-Control-Allow-Origin: *');

            // 获取传递过来的字符串参数并进行安全过滤
            $query_data = isset($request['data']) ? sanitize_text_field($request['data']) : null;
            $query_password = isset($request['password']) ? sanitize_text_field($request['password']) : null;

            /**
             * 安全检查 - 是否为空
             */
            if (empty($query_data)) {
                return wp_send_json_error(
                    [
                        'error' => '请填写需要查询的值',
                    ],
                    400
                );
            }
            if (empty($query_password)) {
                return wp_send_json_error(
                    [
                        'error' => '请填写客户端传输数据用的验证密码',
                    ],
                    400
                );
            }

            // 验证密码
            $is_valid_password = self::password_verification($query_password);
            if (!$is_valid_password) {
                // 密码验证失败
                return wp_send_json_error(
                    [
                        'error' => '密码验证失败，请检查！',
                    ],
                    403
                );
            }


            // 构造 SQL 查询语句
            $query = $wpdb->prepare("SELECT * FROM " . self::$table_name . " WHERE number = %d OR name = %s", $query_data, $query_data);

            // 执行查询
            $result = $wpdb->get_row($query);

            if ($result) {
                // 返回查询结果
                wp_send_json_success([
                    'message' => '查询成功',
                    'data' => $result,

                ]);
            } else {
                return wp_send_json_error([
                    'error' => '数据不存在，请换个姓名或编号再试试'
                ], 404);
                // 数据不存在

            }
        }



        //接收数据
        public static function create_custom_endpoint()
        {
            //获取路由地址
            $styleRoute =  self::get_seting('route');

            register_rest_route('npcink/v1', $styleRoute, array(
                'methods'  => 'POST',
                'callback' => array(__CLASS__, 'submit_data_callback'),
                'permission_callback' => '__return_true', // 无需验权（验证密码即可）
            ));
        }

        /**
         * 上传数据
         * all inspect
         */
        public static function submit_data_callback($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . self::$table_data_name;
            header('Access-Control-Allow-Origin: *');

            //拿到传来的姓名，检查字符串
            $name = isset($request['name']) ? sanitize_text_field($request['name']) : null;

            //拿到传来的密码，检查密码
            $password = isset($request['password']) ? sanitize_text_field($request['password']) : null;

            //拿到传来的JSON对象字符串，检查字符串
            $data = isset($request['data']) ? sanitize_text_field($request['data']) : null;

            //姓名是否为空
            if (empty($name)) {
                return wp_send_json_error([
                    'error' => '姓名为空，请填写',
                ], 400);
            }

            //密码是否为空
            if (empty($password)) {
                return wp_send_json_error([
                    'error' => '密码为空，请填写',
                ], 400);
            }

            //文本转对象
            $data_obj = json_decode($data);

            //是否为空
            if (empty($data_obj)) {
                return wp_send_json_error([
                    'error' => '硬件数据为空，请检查',
                ], 400);
            }


            //验证密码
            $proving =  self::password_verification($password);
            if (!$proving) {
                return wp_send_json_error(
                    [
                        'error' => '密码验证失败，请检查密码！',
                    ],
                    400
                );
            }

            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一
            $uuid_hardware = $data_obj->uuid->hardware;; //唯一UUID
            $uuid_one_net = $data_obj->uuid->macs[0]; //第一个网口的MAC地址
            $uuid = md5($uuid_hardware . $uuid_one_net); //拼接，进行md5处理，短点更好看

            //检查是否存在重复数据
            $repeatData = self::check_data_repeat($uuid);
            if ($repeatData) {
                //数据存在，更新现有数据
                return self::check_Data_Change($repeatData, $data, $name);
            }

            //生成随机编号，充当设备默认编号
            $random_string = uniqid(mt_rand(), true);

            //只取随机编号的后6位，你不会真的要用这套系统管理数十万台设备吧？不会吧！不会吧！
            $last_six_digits = substr($random_string, -6);

            // 数据不存在，插入新数据
            $insert_data = [
                'name' => $name, // 姓名
                'state' => 'idie', // 默认状态为启用
                'number' =>  $last_six_digits, // 编号
                'department' => '默认', // 默认部门
                'purchase' => 0, //采购价'
                'depreciation' => 0, //二手价
                'ip' => '127.0.0.1', //默认IP地址
                'uuid' => $uuid, // 唯一标识符
                'data' => $data, // 数据
            ];

            // 准备插入数据的格式
            $data_formats = [
                '%s', // 姓名是字符串
                '%s', // 状态是字符串
                '%s', // 编号是字符串
                '%s', // 部门是字符串
                '%f', // 采购价是数字
                '%f', //二手价是数字
                '%s', // ip是字符串
                '%s', // 唯一标识符是字符串
                '%s', // 数据是字符串
            ];

            // 执行插入操作
            $res = $wpdb->insert(
                self::$table_name,
                $insert_data,
                $data_formats
            );


            if ($res) {
                $response = [
                    'message' => '数据提交成功！',
                ];
                return wp_send_json_success($response);
            } else {
                $error_message = $wpdb->last_error;
                $response = [
                    'error' => '数据提交失败！',
                    'message' => $error_message,
                ];
                return wp_send_json_error($response, 500);
            }

            wp_die();
        }

        /**
         * 验证密码是否正确 是否允许传输数据
         * @param $input_Password
         * @return boolean
         */
        private static function password_verification($input_Password)
        {
            $setting_Password = self::get_seting('password'); // 获取设置的密码

            // 使用 wp_check_password 直接验证密码
            $valid_password = wp_check_password($input_Password, $setting_Password);

            return $valid_password; // 返回验证结果
        }



        /**
         * 检查数据库中是否存在指定 UUID 的数据
         * @param string $uuid 要检查的 UUID
         * @return array|null 返回关联数组表示数据库中找到的数据行，如果未找到则返回 null
         */
        private static function check_data_repeat(string $uuid): ?array
        {
            global $wpdb;

            $table = self::$table_name;

            // 准备 SQL 查询语句
            $sql = $wpdb->prepare("SELECT * FROM $table WHERE uuid = %s;", $uuid);

            // 执行查询
            $result = $wpdb->get_row($sql, ARRAY_A);

            // 检查是否查询成功
            if ($result === null) {
                // 查询失败或未找到匹配数据
                return null;
            }

            // 查询成功，返回结果
            return $result;
        }



        /**
         * 更新现有数据
         * @param $existingData 查出的数据
         * @param $data 设备JSON字符串数据
         * @param $data_obj 设备对象数据
         * @param $uuid 设备唯一标识符
         * @return bool
         */
        public static function check_Data_Change($existingData, $data, $name)
        {
            global $wpdb;
            //TODO: 如果名称或数据有变化，更新现有数据
            try {
                $result = $wpdb->update(
                    self::$table_name,
                    [
                        //'name' => $name,//不更新名字
                        'data' => $data,
                    ],
                    ['id' => $existingData['id']],
                    ['%s', '%s'],
                    ['%d']
                );

                if ($result !== false) {
                    //姓名
                    $user = $existingData['name'];
                    //编号
                    $number = $existingData['number'];
                    return wp_send_json_success(
                        [
                            'message' => "姓名：$user ，编号：$number ，更新成功",
                            'data' => $result,

                        ]
                    );
                } else {
                    throw new Exception('更新失败');
                }
            } catch (Exception $e) {
                return wp_send_json_error(['error' => $e->getMessage(), 'message' => $wpdb->last_error], 500);
            }


            wp_die();
        }
    }
}
