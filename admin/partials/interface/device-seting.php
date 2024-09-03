<?php

/**
 * 硬件信息设置接口 - 改
 */
if (!class_exists('DEMA_Admin_Interface_Device_Seting')) {
    class DEMA_Admin_Interface_Device_Seting extends DEMA_Admin_Interface
    {
        public static function run()
        {
            // 修改 - 设备信息接口
            add_action('wp_ajax_modify_device_callback',  array(__CLASS__, 'modify_device_callback'));

            // 删除设备接口
            add_action('wp_ajax_delt_device_callback', array(__CLASS__, 'delt_device_callback'));
        }

        /**
         * 修改设备信息接口
         */
        public static function modify_device_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_data_name;

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //唯一标识符
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : null; //修改的值
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : null; //字段名

            //是否缺少参数
            // 假设 $uuid, $user, $type, $data 是需要检查的变量
            $variables = compact('uuid', 'data', 'type');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = ['uuid' => 'uuid - 设备唯一编号', 'data' => 'user - 变更的值', 'type' => 'type - 变更的字段名'];
                return wp_send_json_error(['error' => '缺少参数：' . $param_names[$null_param]], 400);
            }


            // 定义字段与数据库类型的映射关系
            $field_map = array(
                'name' => 'name', //姓名
                'number' => 'number', //编号
                'state' => 'state', //状态
                'department' => 'department', //部门
                'purchase' => 'purchase', //采购价
                'depreciation' => 'depreciation', //折旧价
                'ip' => 'ip', //IP 地址
            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : null;

            //检查字段是否为空
            if (empty($field_name)) {
                return wp_send_json_error(['error' => '没有找到字段名 - ' . $type], 400);
            }

            // 查询数据库中原本的值
            $current_value = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT $field_name FROM $table_name WHERE uuid = %s",
                    $uuid
                )
            );

            // 检查要更新的值是否与数据库中原本的值相同
            if ($current_value === $data) {
                wp_send_json_error(['error' => self::process_string($field_name) . '未改变，无需更新', 'reason' => $current_value], 500);
            }

            //若类型是编号的时候，检查是否存在重复编号
            if ($type == 'number') {
                // 检查是否存在重复编号
                $existing_number = $wpdb->get_var($wpdb->prepare(
                    "SELECT number FROM $table_name WHERE number = %s AND uuid != %s",
                    $data,
                    $uuid
                ));

                if ($existing_number) {
                    return wp_send_json_error(['error' => '更新失败，编号已存在', 'msg' => $existing_number], 500);
                }
            }





            // 使用预处理语句更新数据库中对应的数据
            $result = $wpdb->update(
                $table_name,
                array($field_name => $data),
                array('uuid' => $uuid),
                '%s', // 字段类型
                '%s'  // 条件类型
            );
            if (!is_wp_error($result) && $result != 0) {
                return wp_send_json_success(['message' => self::process_string($field_name) . '已更新']);
            } else {
                return wp_send_json_error(['error' => '更新失败，请检查错误原因', 'reason' => $wpdb->last_error, 'msg' => $result,], 500);
            }
            wp_die();
        }

        //对象映射
        public static function process_string($input)
        {
            // 定义映射关系
            $mapping = [
                'name' => '姓名',
                'number' => '编号',
                'state' => '状态',
                'department' => '部门',
                'purchase' => '采购价',
                'depreciation' => '折旧价', //折旧价
                'ip' => 'IP 地址', //IP 地址
                // 添加更多的情况...
            ];

            // 检查输入是否在映射中
            if (array_key_exists($input, $mapping)) {
                return $mapping[$input];
            } else {
                return $input; // 默认情况返回原始输入
            }
        }

        /**
         * 添加删除设备接口 - 删除设备信息和变更信息
         */
        public static  function delt_device_callback()
        {
            global $wpdb;
            $data_name = $wpdb->prefix . self::$table_data_name;
            $change_name = $wpdb->prefix . self::$table_change_name;

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null;

            //是否有值
            if (empty($uuid)) {
                return wp_send_json_error(['error' => '缺少uuid参数'], 400);
            }

            // 使用预处理语句构建SQL查询
            $sql = $wpdb->prepare("DELETE FROM $data_name WHERE uuid = %s", $uuid);
            $sql_change = $wpdb->prepare("DELETE FROM $change_name WHERE uuid = %s", $uuid);

            // 开始事务
            $wpdb->query('START TRANSACTION');

            try {
                // 执行删除操作
                $result = $wpdb->query($sql);
                $result_change = $wpdb->query($sql_change);

                // 检查删除操作是否成功
                if ($result === false || $result_change === false) {
                    throw new Exception('删除数据时发生错误');
                }

                // 提交事务
                $wpdb->query('COMMIT');

                // 返回成功响应
                wp_send_json_success(['message' => '此设备已移除']);
            } catch (Exception $e) {
                // 发生异常时回滚事务
                $wpdb->query('ROLLBACK');
                // 返回错误响应
                wp_send_json_error(['error' => $e->getMessage(), 'reason' => $wpdb->last_error,], 500);
            } finally {
                // 结束请求
                wp_die();
            }
        }
    }
}
