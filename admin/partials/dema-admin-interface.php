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
         * 验证
         */
        public static function password_verification($data)
        {
            $password = isset($data['password']) ? $data['password'] : '';

            return $password === 8577;
        }

        public static function submit_data_callback($request)
        {
            header('Access-Control-Allow-Origin: http://localhost:5173');
            $data = $request->get_params();

            if (self::password_verification($data)) {
                // 密码验证通过，继续处理数据

                $name = $data['name'];
                $datas = json_encode($data['data']);

                $uuid_hardware = $data['data']['uuid']['hardware'];

                global $wpdb;
                $table_name = $wpdb->prefix . 'custom_table';

                // 查询是否已经存在相同的 uuid_hardware 的数据
                $result = $wpdb->get_results(
                    $wpdb->prepare(
                        "SELECT * FROM $table_name WHERE uuid = %s;",
                        $uuid_hardware
                    ),
                    ARRAY_A
                );

                if (!$result) {
                    // 数据不存在，插入新数据

                    $wpdb->insert(
                        $table_name,
                        array(
                            'uuid' => $uuid_hardware,
                            'stylename' => $name,
                            'notes' => '', // 可根据需要设置其他默认值
                            'dataNew' => $datas,
                        ),
                        array('%s', '%s', '%s', '%s')
                    );

                    return new WP_REST_Response(array(
                        'message' => '提交成功！',
                        'data' => $data,
                    ), 200);
                } else {
                    // 数据已经存在，更新原有数据

                    $existing_data = json_decode($result[0]['dataNew'], true);

                    if ($result[0]['stylename'] !== $name) {
                        // 如果名称有变化，更新现有数据
                        $wpdb->update(
                            $table_name,
                            array(
                                'stylename' => $name,
                                'dataOld' => $result[0]['dataNew'],
                                'dataNew' => $datas
                            ),
                            array('id' => $result[0]['id']),
                            array('%s', '%s', '%s'),
                            array('%d')
                        );

                        return new WP_REST_Response(array(
                            'message' => '数据已更新！',
                            'data' => $data,
                        ), 200);
                    } else if ($existing_data !== $data['data']) {
                        // 如果数据有变化，更新现有数据
                        $wpdb->update(
                            $table_name,
                            array(
                                'dataOld' => $result[0]['dataNew'],
                                'dataNew' => $datas
                            ),
                            array('id' => $result[0]['id']),
                            array('%s', '%s'),
                            array('%d')
                        );

                        return new WP_REST_Response(array(
                            'message' => '数据已更新！',
                            'data' => $data,
                        ), 200);
                    } else {
                        // 数据未变化
                        return new WP_REST_Response(array(
                            'message' => '数据未变化！',
                            'data' => $data,
                        ), 200);
                    }
                }
            } else {
                // 密码验证失败，返回错误的响应
                return new WP_REST_Response(array(
                    'error' => '密码验证失败！',
                    'data' => $data['password'],
                ), 403);
            }
        }
    }
}
