<?php

/**
 * 接口 接收传来的数据
 */
if (!class_exists('DEMA_Admin_Interface_DataInput')) {
    class DEMA_Admin_Interface_DataInput extends DEMA_Admin_Interface
    {
        //表名
        public static $table_name;

        //接收的数据
        public static $receive_data;

        //设备唯一标识符
        public static $uuid_md5;

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
         * data:编号或姓名
         * password:密码
         * all inspect
         */
        public static function query_data($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . "custom_table";
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
         * 处理传来的数据
         */
        public static function submit_data_callback($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . "custom_table";

            header('Access-Control-Allow-Origin: *');

            //拿到传来的姓名，检查字符串
            $name = isset($request['name']) ? sanitize_text_field($request['name']) : null;
            //拿到传来的密码，检查密码
            $password = isset($request['password']) ? sanitize_text_field($request['password']) : null;
            //拿到传来的对象，检查对象
            $data = isset($request['data']) ? sanitize_text_field($request['data']) : null;


            //文本转对象
            $data = json_decode(stripslashes($data));

            if (empty($data)) {
                return wp_send_json_error([
                    'error' => '硬件数据为空，请检查',

                ], 400);
            }

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
            //验证密码
            $proving =  self::password_verification($password);
            if (!$proving) {
                return wp_send_json_error(
                    [
                        'error' => '密码验证失败，请检查密码！',
                        'name' => $name,
                        'password' => $password,
                        'data' => $data,
                        'qq' => $request['password'],
                        'ww' => self::get_seting('password'),
                    ],
                    400
                );
            }



            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一

            $uuid_hardware = $data->uuid->hardware;; //唯一UUID
            $uuid_one_net = $data->uuid->macs[0]; //第一个网口的MAC地址
            self::$uuid_md5 = md5($uuid_hardware . $uuid_one_net); //进行md5处理，短点更好看




            //检查是否存在重复数据
            $existingData = self::check_data_repeat();

            if (!$existingData) {
                // 数据不存在，插入新数据
                $wpdb->insert(
                    self::$table_name,
                    [
                        'name' => $name, //姓名
                        'state' => "idie", //默认状态为启用
                        'number' => 0, //编号
                        'department' => "默认", //默认部门
                        'uuid' => self::$uuid_md5, //唯一标识符
                        'data' => $data, //数据
                    ],
                    ['%s', '%s', '%s', '%s', '%s', '%s']
                );

                $response = [
                    'message' => '数据提交成功！',
                    'msg'=>$existingData
                ];
                return wp_send_json_success($response);
            } else {

                //将传来的数据存入公共
                self::$receive_data = $data;
                //数据存在，更新现有数据
                $response =  self::check_Data_Change($existingData);
                return wp_send_json_success($response);
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
            $setting_Password =  self::get_seting('password'); //设置的密码
            //验证
            $valid_password = wp_check_password($input_Password, $setting_Password);

            if ($valid_password) {
                return true;
            } else {
                return false;
            }
        }


        /**
         * 判断数据是否重复,没有为null,有为查出的数据
         * 
         * @return null|data
         */
        private  static function check_data_repeat()
        {
            global $wpdb;

            $table = self::$table_name;
            //根据唯一UUID查找是否存在数据
            $existingData = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM $table WHERE uuid = %s;",
                    self::$uuid_md5
                ),
                ARRAY_A
            );
            return $existingData;
        }

        /**
         * 已有数据则更新现有数据
         * @param $existingData 查出的数据
         * @return bool
         */
        public static function check_Data_Change($existingData)
        {
            global $wpdb;

            $name = self::$receive_data['name']; //姓名
            $data_afferent = self::$receive_data['data']; //传来的数据




            //TODO: 如果名称或数据有变化，更新现有数据
            $wpdb->update(
                self::$table_name,
                [
                    'name' => $name,

                    'data' => json_encode($data_afferent),
                ],
                ['id' => $existingData['id']],
                ['%s', '%s'],
                ['%d']
            );

            //存入变更数据
            $diffs = [];

            //存入变更表
            // self::compare_arrays($data_afferent,  json_decode($query_data, true), $diffs); //检测数据变化

            //添加UUID
            foreach ($diffs as &$obj) {
                $obj["uuid"] = self::$uuid_md5;
            }

            unset($obj); // 重置引用

            //存入数据库
            self::data_change($diffs);

            $response = [
                'message' => '现有数据已更新！',
            ];

            return $response;
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
    }
}
