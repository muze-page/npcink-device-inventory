<?php

/**
 * 前端添加自定义设备数据，增删改查接口
 */
if (!class_exists('DEMA_Admin_Interface_Style_Data')) {
    class DEMA_Admin_Interface_Style_Data extends DEMA_Admin_Interface
    {
        //表名
        public static $style_table_name;
        public static function run()
        {
            // 增 - 自定义设备添加信息接口
            add_action('wp_ajax_add_style_device_data_callback',  array(__CLASS__, 'add_style_device_data_callback'));

            //删
            add_action('wp_ajax_delete_style_device_data_callback',  array(__CLASS__, 'delete_style_device_data_callback'));

            //改
            add_action('wp_ajax_update_style_device_data_callback',  array(__CLASS__, 'update_style_device_data_callback'));
        }

        /**
         * 增- 添加自定义设备数据接口
         */
        public static function add_style_device_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            // 获取前端传递的参数并进行输入验证，如果有值，肯定是字符串类型
            // $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //生成的uuid
            $name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : null; //使用人
            $purpose = isset($_POST['purpose']) ? sanitize_text_field($_POST['purpose']) : null; //设备用途
            $state = isset($_POST['state']) ? sanitize_text_field($_POST['state']) : null; //设备状态
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //设备信息

            //是否缺少参数
            $variables = compact('name', 'purpose', 'state', 'data');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = [
                    //'uuid' => 'uuid - 设备唯一编号',
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
                    // 'uuid' => $uuid,
                    'name' => $name,
                    'purpose' => $purpose,
                    'state' => $state,
                    'data' =>  $json
                ),
                array(
                    //'%s', // uuid
                    '%s', // name
                    '%s', // purpose
                    '%s', // state
                    '%s'  // data
                )
            );

            // 检查插入是否成功
            if ($result !== false) {
                // 插入成功后，获取自动生成的ID、UUID和time
                $inserted_id = $wpdb->insert_id;

                // 从数据库中查询刚插入的记录，获取自动生成的UUID和created_at
                $inserted_record = $wpdb->get_row(
                    $wpdb->prepare("SELECT uuid, created_at FROM $table_name WHERE id = %d", $inserted_id)
                );

                $inserted_uuid = $inserted_record->uuid;
                $inserted_created_at = $inserted_record->created_at;

                //返回对应的值给本地用，方便在不刷新页面的情况下获取正常的数据，便于后续设置用
                return wp_send_json_success([
                    'message' => '添加自定义设备数据成功',
                    'id' => $inserted_id,
                    'uuid' => $inserted_uuid,
                    'created_at' => $inserted_created_at
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

        /**
         * 删
         * 接收指定UUID，删除对应内容
         */
        public static function delete_style_device_data_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            $table_auto = $wpdb->prefix . self::$table_change_auto;

            // 获取前端传递的参数并进行输入验证，如果有值，肯定是字符串类型
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //生成的uuid

            if (empty($uuid)) {
                return wp_send_json_error(['error' => '缺少参数：uuid'], 400);
            }

            //检查数据库是否存在传来的UUID
            $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE uuid = %s", $uuid));
            if ($exists == 0) {
                return wp_send_json_error(['error' => '指定的UUID不存在'], 404);
            }

            // 执行删除操作
            $result = $wpdb->delete(
                $table_name,
                array('uuid' => $uuid), // WHERE 条件
                array('%s') // uuid 类型
            );

            // 同时从$table_change_auto表中删除record_uuid为相同UUID的记录
            $result_auto = $wpdb->delete(
                $table_auto,
                array('record_uuid' => $uuid),
                array('%s')
            );

            if ($result !== false && $result_auto !== false) {
                return wp_send_json_success(['message' => '删除成功']);
            } else {
                return wp_send_json_error(['error' => '删除失败', 'reason' => $wpdb->last_error], 500);
            }

            wp_die();
        }

        /**
         * 改
         * 根据传来的UUID，进行数据替换
         */
        public static function update_style_device_data_callback()
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

            // 特别检查uuid是否为空字符串
            if ($uuid === '' || $uuid === false) {
                $null_param = 'uuid';
            }

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

            // 执行更新操作
            $result = $wpdb->update(
                $table_name,
                array(
                    'name' => $name,
                    'purpose' => $purpose,
                    'state' => $state,
                    'data' => $json
                ),
                array('uuid' => $uuid), // WHERE 条件
                array(
                    '%s', // name
                    '%s', // purpose
                    '%s', // state
                    '%s'  // data
                ),
                array('%s') // WHERE 条件类型
            );

            // 检查插入是否成功
            if ($result !== false) {
                return wp_send_json_success([
                    'message' => '更新自定义设备数据成功',
                    // 'data-one' => $data,
                    // 'data-two' => $json_data,
                    //'data-three' => $json
                ]);
            } else {
                return wp_send_json_error([
                    'error' => '更新自定义设备数据失败' + $wpdb->last_error,
                    'reason' => $wpdb->last_error,
                    // 'data-one' => $data,
                    // 'data-two' => $json_data,
                    //'data-three' => $json
                ], 500);
            }
            // 更新成功，可以进行其他操作
            wp_die();
        }
    }
}
