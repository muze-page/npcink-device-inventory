<?php

/**
 * 硬件变更接口 - 增删改查
 */
if (!class_exists('DEMA_Admin_Interface_Device_Change')) {
    class DEMA_Admin_Interface_Device_Change extends DEMA_Admin_Interface
    {
        public static function run()
        {
            // 增 - 设备变更信息接口
            add_action('wp_ajax_add_change_data_callback',  array(__CLASS__, 'add_change_data_callback'));

            // 改 - 设备变更信息接口
            add_action('wp_ajax_modify_change_data_callback',  array(__CLASS__, 'modify_change_data_callback'));

            //查 - 设备变更信息接口
            add_action('wp_ajax_search_change_data_callback',  array(__CLASS__, 'search_change_data_callback'));
        }

        /**
         * 增 - 设备变更信息接口
         */
        public static function add_change_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';

            // 获取前端传递的参数并进行输入验证，如果有值，肯定是字符串类型
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //id
            $user = isset($_POST['user']) ? sanitize_text_field($_POST['user']) : null; //用户名
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : null; //字段名
            $msg = isset($_POST['msg']) ? sanitize_text_field($_POST['msg']) : null; //修改的值

            //是否缺少参数
            // 假设 $uuid, $user, $type, $data 是需要检查的变量
            $variables = compact('uuid', 'user', 'type', 'msg');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = ['uuid' => 'uuid - 设备唯一编号', 'user' => 'user - 变更用户名', 'type' => 'type - 变更类型', 'msg' => 'msg - 变更内容'];
                return wp_send_json_error(['message' => '缺少参数：' . $param_names[$null_param]]);
            }


            // 使用预处理语句插入数据
            $result = $wpdb->insert(
                $table_name,
                array(
                    'uuid' => $uuid,
                    'user' => $user,
                    'type' => $type,
                    'msg' => $msg
                ),
                array(
                    '%s', // uuid
                    '%s', // user
                    '%s', // type
                    '%s'  // msg
                )
            );

            // 检查插入是否成功
            if ($result === false) {
                wp_send_json_error(['message' => '插入变更数据失败']);
            } else {
                wp_send_json_success(['message' => '插入变更数据成功']);
            }
            // 插入成功，可以进行其他操作
        }


        /**
         * 修改 - 设备变更信息接口
         */
        public static function modify_change_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';
            // 获取前端传递的参数并进行输入验证
            $id = isset($_POST['id']) ? sanitize_text_field($_POST['id']) : null; //id
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : null; //字段名
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //修改的值
            //检查参数是否均为字符串类型
            if (!isset($id,  $type, $data)) {
                return wp_send_json_error(['message' => '所有参数必须是字符串类型']);
            }

            // 定义字段与类型的映射关系
            $field_map = array(
                'user' => 'user', //修改姓名
                'type' => 'type', //类型
                'msg' => 'msg', //修改描述
            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : null;

            if (empty($field_name)) {
                // 未找到对应的字段名
                return wp_send_json_error(['message' => '未找到对应的字段名']);
            }
            // 使用预处理语句更新数据库中对应的数据
            $result = $wpdb->update(
                $table_name,
                array($field_name => $data),
                array('id' => $id),
                '%s', // 字段类型
                '%s'  // 条件类型
            );

            // 返回更新成功的响应
            echo json_encode(array(
                'success' => true,
                '表名' => $table_name,
                '类型' => $type,
                '字段名' => $field_name,
                '数据' => $data,
                'id' => $id
            ));

            if ($result) {
                return wp_send_json_success(['message' => '数据库更新成功']);
            } else {
                return wp_send_json_error(['message' => '数据库更新失败']);
            }
            wp_die();
        }

        /**
         * 创建查询接口，
         */
        public static function search_change_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_change';

            //拿到值
            $object_data = $_POST['uuid'];
            //拿到uuid
            $uuid = json_decode(stripslashes($object_data));

            //查询
            // 使用预处理语句执行查询
            $object = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                ARRAY_A
            );

            // $object = self::get_custom_table_data_by_uuid($uuid);
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
    }
}
