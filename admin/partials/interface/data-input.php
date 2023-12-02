<?php

/**
 * 接口 接收传来的数据
 */
//http://localhost:10048/wp-json/custom/v1/submit-data
if (!class_exists('DEMA_Admin_Interface_DataInput')) {
    class DEMA_Admin_Interface_DataInput extends DEMA_Admin_Interface
    {
        

        //表名
        public static $table_name;

        //接收的数据
        public static $receive_data ;

        //设备唯一标识符
        public static $uuid_md5;

        /**
         * 接收数据
         */
        public static function run()
        {
            //添加接收设备数据api接口
            add_action('rest_api_init', array(__CLASS__, 'create_custom_endpoint'));
        }

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

            //拿到传来的值
            $data = $request->get_params();

            //拿到传来的密码
            $password = isset($data['password']) ? $data['password'] : '';

            //验证密码
            self::password_verification($password);

            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一

            $uuid_hardware = $data['data']['uuid']['hardware']; //唯一UUID
            $uuid_one_net = $data['data']['uuid']['macs'][0]; //第一个网口的MAC地址
            self::$uuid_md5 = md5($uuid_hardware . $uuid_one_net); //进行md5处理，短点更好看

            $name = $data['name']; //姓名
            $state = $data['state']; //状态
            $datas = json_encode($data['data']); //数据

            //将传来的数据存入公共
            self::$receive_data = $data;

            //检查是否存在重复数据
            $existingData = self::check_data_repeat();


            if (!$existingData) {
                // 数据不存在，插入新数据
                $wpdb->insert(
                    self::$table_name,
                    [
                        'uuid' => self::$uuid_md5,
                        'name' => $name,
                        'is_enabled' => $state,
                        'dataNew' => $datas,
                    ],
                    ['%s', '%s', '%s', '%s']
                );

                $response = [
                    'message' => '提交成功！',
                    'data' => $data,
                ];
            } else {
                //数据存在，插入新数据并记录变化
                $response =  self::checkDataChange($existingData);
            }



            return new WP_REST_Response($response, 200);
        }

        /**
         * 验证密码是否正确 是否允许传输数据
         * @param $input_Password
         * @return boolean
         */
        private static function password_verification($input_Password)
        {
            $setting_Password =  self::get_seting('password');
            if (!($input_Password ==  $setting_Password)) {
                return new WP_REST_Response(
                    [
                        'error' => '密码验证失败,请重新填写密码！',
                        'input_password' => $input_Password,
                    ],
                    403
                );
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
         * 数据变化
         * @param $existingData 查出的数据
         * @return bool
         */
        public static function checkDataChange($existingData)
        {
            global $wpdb;

            $name = self::$receive_data['name']; //姓名
            $state = self::$receive_data['state']; //状态
            $datas = json_encode(self::$receive_data['data']); //数据

            //获取原始数据
            $existingDataDecoded = json_decode($existingData['dataNew'], true);

            if ($existingData['name'] !== $name || $existingDataDecoded !== self::$receive_data['data']) 
            {
                // 如果名称或数据有变化，更新现有数据
                $wpdb->update(
                    self::$table_name,
                    [
                        'name' => $name,
                        'is_enabled' => $state,
                        'dataOld' => $existingData['dataNew'],
                        'dataNew' => $datas,
                    ],
                    ['id' => $existingData['id']],
                    ['%s', '%s', '%s', '%s'],
                    ['%d']
                );

                //存储变更数据
                $diffs = [];
                $dataNew = json_decode($datas, true);//传来的值存入新值字段
                $dataOld =  $existingDataDecoded;//原来的值存储旧值字段
                self::compare_arrays($dataNew, $dataOld, $diffs);


                //为每个变化数据添加UUID
                $updatedData = array_map(function ($obj) use ($dataNew) {
                    $obj["uuid"] = self::$uuid_md5;
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
                    'data' => self::$receive_data,
                ];
            }
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
