<?php

/**
 * 前端添加自定义设备数据接口
 */
if (!class_exists('DEMA_Admin_Interface_Add_Style_Data')) {
    class DEMA_Admin_Interface_Add_Style_Data extends DEMA_Admin_Interface
    {
        //表名
        public static $style_table_name;
        public static function run()
        {
            // 增 - 自定义设备添加信息接口
            add_action('wp_ajax_add_style_device_data_callback',  array(__CLASS__, 'add_style_device_data_callback'));
        }

        /**
         * 添加自定义设备数据接口
         */
        public static function add_style_device_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            // 获取前端传递的参数并进行输入验证，如果有值，肯定是字符串类型
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //生成的uuid
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : null; //使用人
            $purpose = isset($_POST['purpose']) ? sanitize_text_field($_POST['purpose']) : null; //设备用途
            $state = isset($_POST['state']) ? sanitize_text_field($_POST['state']) : null; //设备状态
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //设备信息

            //是否缺少参数
            $variables = compact('uuid', 'name', 'purpose', 'state', 'data');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = [
                    'uuid' => 'uuid - 设备唯一编号',
                    'name' => 'name - 使用人姓名',
                    'purpose' => 'purpose - 用途',
                    'state' => 'state - 设备状态',
                    'data' => 'data - 设备数据'
                ];
                return wp_send_json_error(['error' => '缺少参数：' . $param_names[$null_param]], 400);
            }

            //防止空数据
            if (empty($data) || !is_string($data)) {
                return wp_send_json_error(['error' => 'data 参数为空或不是字符串'], 400);
            }

            //TODO:为啥不能直接用json,非要转换一次
            //json转对象
            $json_data = json_decode(stripslashes($data), true);

            //对象转JSON
            $json = json_encode($json_data, JSON_UNESCAPED_UNICODE);

            // 使用预处理语句插入数据
            $result = $wpdb->insert(
                $table_name,
                array(
                    'uuid' => $uuid,
                    'name' => $name,
                    'purpose' => $purpose,
                    'state' => $state,
                    'data' =>  $json
                ),
                array(
                    '%s', // uuid
                    '%s', // name
                    '%s', // purpose
                    '%s', // state
                    '%s'  // data
                )
            );

            // 检查插入是否成功
            if ($result !== false) {
                return wp_send_json_success([
                    'message' => '添加自定义设备数据成功',
                    // 'data-one' => $data,
                    // 'data-two' => $json_data,
                    //'data-three' => $json
                ]);
            } else {
                return wp_send_json_error([
                    'error' => '添加自定义设备数据失败，可能是字数太多',
                    'reason' => $wpdb->last_error,
                    // 'data-one' => $data,
                    // 'data-two' => $json_data,
                    //'data-three' => $json
                ], 500);
            }
            // 插入成功，可以进行其他操作
            wp_die();
        }
    }
}
