<?php
//接口
//http://localhost:10048/wp-json/custom/v1/submit-data
if (!class_exists('DEMA_Admin_Interface')) {
    class DEMA_Admin_Interface
    {
        public static function run()
        {
            add_action('rest_api_init', array(__CLASS__, 'create_custom_endpoint'));
        }
        public static function create_custom_endpoint()
        {
            register_rest_route('custom/v1', '/submit-data', array(
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
            $password = isset($data['password']) ? $data['password'] : '';

            return $password == 8577;
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
                    'old' => isset($item['old']) ? sanitize_text_field($item['old']) : ''
                );
                $wpdb->insert($table_name, $data);
            }
        }
    }
}
