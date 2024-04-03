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
             add_action('wp_ajax_save_object_option', array(__CLASS__, 'save_object_option_callback'));
             //add_action('wp_ajax_nopriv_save_object_option', array(__CLASS__, 'save_object_option_callback'));

             //导出数据接口
             add_action('wp_ajax_export_data_callback', array(__CLASS__, 'export_data_callback'));
             //add_action('wp_ajax_nopriv_export_data_callback', array(__CLASS__, 'export_data_callback'));
 
             //导入数据接口
             add_action('wp_ajax_import_config_data_callback', array(__CLASS__, 'import_config_data_callback'));
             //add_action('wp_ajax_nopriv_import_config_data_callback', array(__CLASS__, 'import_config_data_callback'));
        }
         /**
         * 添加选项保存接口
         */
        public static  function save_object_option_callback()
        {
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
         * 添加数据导出接口
         */
        public static function export_data_callback()
        {
            global $wpdb;

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

            // 获取前端传递的参数并进行输入验证
            $text_data = isset($_POST['data']) ? ($_POST['data']) : '';
            $data = json_decode(stripslashes($text_data), true);

            $name = isset($_POST['name']) ? ($_POST['name']) : '';

            if (!empty($data)) {
                // 构建插入数据的数组
                $insert_data = array();
                if ($name == "custom_table") {
                    foreach ($data as $item) {
                        //是否有重复数据
                        $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                        $table_name = $wpdb->prefix . 'custom_table';
                        $existingData = $wpdb->get_row(
                            $wpdb->prepare(
                                "SELECT * FROM $table_name WHERE uuid = %s;",
                                $uuid
                            ),
                            ARRAY_A
                        );

                        if (!$existingData) {
                            $insert_data[] = array(
                                'is_enabled' => isset($item['is_enabled']) ? $item['is_enabled'] : 1,
                                'name' => isset($item['name']) ? $item['name'] : '',
                                'styleName' => isset($item['styleName']) ? $item['styleName'] : null,
                                'styleNumber' => isset($item['styleNumber']) ? $item['styleNumber'] : 0,
                                'uuid' => isset($item['uuid']) ? $item['uuid'] : '',
                                'dataNew' => isset($item['dataNew']) ? ($item['dataNew']) : null,
                                'dataOld' => isset($item['dataOld']) ? ($item['dataOld']) : null
                            );
                        }
                    }
                }
                if ($name == "custom_change") {
                    foreach ($data as $item) {
                        //是否有重复数据
                        $time = isset($item['time']) ? $item['time'] : null;
                        $table_name = $wpdb->prefix . 'custom_change';
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
                                'type' => isset($item['type']) ? $item['type'] :  null,
                                'new' => isset($item['new']) ? $item['new'] :  null,
                                'old' => isset($item['old']) ? $item['old'] :  null,
                                'ch_name' => isset($item['ch_name']) ? $item['ch_name'] :  null,
                                'ch_describe' => isset($item['ch_describe']) ? $item['ch_describe'] :  null,
                            );
                        }
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
    }
}