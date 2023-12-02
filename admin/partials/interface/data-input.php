<?php

/**
 * 接口 接收传来的数据
 */
//http://localhost:10048/wp-json/custom/v1/submit-data
if (!class_exists('DEMA_Admin_Interface_DataInput')) {
    class DEMA_Admin_Interface_DataInput extends DEMA_Admin_Interface
    {
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

            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一

            $uuid_hardware = $data['data']['uuid']['hardware']; //唯一UUID
            $uuid_one_net = $data['data']['uuid']['macs'][0]; //第一个网口的MAC地址
            self::$uuid_md5 = md5($uuid_hardware . $uuid_one_net); //进行md5处理，短点更好看

            $name = $data['name']; //姓名
            $state = $data['state']; //状态
            $datas = json_encode($data['data']); //数据


            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';

            $existingData = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM $table_name WHERE uuid = %s;",
                    self::$uuid_md5
                ),
                ARRAY_A
            );

            if (!$existingData) {
                // 数据不存在，插入新数据
                $wpdb->insert(
                    $table_name,
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
                $existingDataDecoded = json_decode($existingData['dataNew'], true);

                if ($existingData['name'] !== $name || $existingDataDecoded !== $data['data']) {
                    // 如果名称或数据有变化，更新现有数据
                    $wpdb->update(
                        $table_name,
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
                    $dataNew = json_decode($datas, true);
                    $dataOld =  $existingDataDecoded;
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
    }
}
