<?php

/**
 * 电脑信息设置接口 - 删、改
 */
if (!class_exists('DEMA_Admin_Interface_Table_PC')) {
    class DEMA_Admin_Interface_Table_PC extends DEMA_Admin_Interface
    {
        public static function run()
        {
            //获取设备状态和分类键值对
            add_action('wp_ajax_get_device_category_callback', array(__CLASS__, 'get_device_category_callback'));

            // 修改 - 设备信息接口
            add_action('wp_ajax_modify_device_callback',  array(__CLASS__, 'modify_device_callback'));

            // 删除设备接口
            add_action('wp_ajax_delt_device_callback', array(__CLASS__, 'delt_device_callback'));
        }

        /**
         * 获取设备分类键值对接口
         */
        public static function get_device_category_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            // 获取所有部门分类
            $departments = $wpdb->get_results(
                "SELECT DISTINCT department FROM {$table_name} WHERE department IS NOT NULL AND department != ''"
            );

            // 获取所有状态分类
            $states = $wpdb->get_results(
                "SELECT DISTINCT state FROM {$table_name} WHERE state IS NOT NULL AND state != ''"
            );

            // 检查查询是否成功
            if ($wpdb->last_error) {
                wp_send_json_error(['error' => $wpdb->last_error], 500);
                wp_die();
            }

            // 整理部门数据
            $department_result = array_map(function ($item) {
                return [
                    'value' => $item->department,
                    'label' => $item->department
                ];
            }, $departments);

            // 保底状态
            $state_labels = [
                '使用' => '使用',
                '闲置' => '闲置',
                '故障' => '故障',
                '维修' => '维修',
                '报废' => '报废'
            ];

            // 获取数据库中实际存在的状态值
            $existing_states = array_column($states, 'state');

            // 确保所有预定义的状态选项都包含在结果中
            $state_result = [];
            foreach ($state_labels as $value => $label) {
                $state_result[] = [
                    'value' => $value,
                    'label' => $label
                ];
            }

            // 如果数据库中有其他未预定义的状态，也添加进去
            foreach ($existing_states as $state) {
                if (!array_key_exists($state, $state_labels)) {
                    $state_result[] = [
                        'value' => $state,
                        'label' => $state
                    ];
                }
            }

            // 组合结果
            $result = [
                'states' => array_values($state_result), //状态
                'departments' => array_values($department_result), //部门
            ];

            wp_send_json_success($result);
            wp_die();
        }
        /**
         * 修改设备信息接口
         */
        public static function modify_device_callback()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null; //唯一标识符
            $data = isset($_POST['data']) ? stripslashes($_POST['data']) : null; //修改的值

            //是否缺少参数
            $variables = compact('uuid', 'data');

            // 检查是否有参数为 null
            $null_param = array_search(null, $variables, true);

            // 如果有参数为 null，则返回相应的错误消息
            if ($null_param !== false) {
                $param_names = [
                    'uuid' => 'uuid - 设备唯一编号',
                    'data' => 'data - 变更的值'
                ];
                wp_send_json_error([
                    'error' => '缺少参数：' . $param_names[$null_param]
                ], 400);
                wp_die();
            }

            // 检查设备是否存在
            $device_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE uuid = %s",
                $uuid
            ));

            if ($device_exists == 0) {
                wp_send_json_error([
                    'error' => '设备不存在',
                    'reason' => '找不到UUID为 ' . $uuid . ' 的设备'
                ], 404);
                wp_die();
            }

            // 解析JSON数据
            $json_data = json_decode($data, true);

            // 检查JSON解析是否成功
            if (json_last_error() !== JSON_ERROR_NONE) {
                wp_send_json_error([
                    'error' => 'JSON解析失败: ' . json_last_error_msg()
                ], 400);
                wp_die();
            }

            // 定义字段与数据库类型的映射关系
            $field_map = array(
                'name' => 'name', //姓名
                'number' => 'number', //编号
                'state' => 'state', //状态
                'department' => 'department', //部门
                'purchase' => 'purchase', //采购价
                'depreciation' => 'depreciation', //二手价
                'ip' => 'ip', //IP 地址
            );

            // 构建要更新的数据数组
            $update_data = array();
            $update_format = array();

            foreach ($json_data as $key => $value) {
                // 只处理映射中存在的字段
                if (array_key_exists($key, $field_map)) {
                    $update_data[$field_map[$key]] = $value;

                    // 根据字段类型确定格式
                    if (in_array($key, ['purchase', 'depreciation'])) {
                        $update_format[] = '%f'; // 浮点数
                    } elseif (in_array($key, ['name', 'number', 'state', 'department', 'ip'])) {
                        $update_format[] = '%s'; // 字符串
                    } else {
                        $update_format[] = '%s';
                    }
                }
            }

            // 如果没有有效的更新字段
            if (empty($update_data)) {
                wp_send_json_error([
                    'error' => '没有有效的更新字段',
                    'reason' => '传入的数据中不包含可更新的字段'
                ], 400);
                wp_die();
            }

            try {
                // 执行更新操作
                $result = $wpdb->update(
                    $table_name,
                    $update_data,
                    array('uuid' => $uuid),
                    $update_format,
                    array('%s')
                );

                if ($result !== false) {
                    wp_send_json_success([
                        'message' => '设备信息更新成功',
                        'updated_fields' => array_keys($update_data),
                        'data' => $json_data
                    ]);
                } else {
                    throw new Exception('更新失败');
                }
            } catch (Exception $e) {
                wp_send_json_error([
                    'error' => '更新设备信息时发生错误',
                    'reason' => $e->getMessage(),
                    'details' => $wpdb->last_error
                ], 500);
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
                'depreciation' => '二手价', //二手价
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
        public static function delt_device_callback()
        {
            global $wpdb;
            $data_name = $wpdb->prefix . self::$table_pc_name; //数据表名
            $change_name = $wpdb->prefix . self::$table_manual_name; //变更记录表
            $auto_name = $wpdb->prefix . self::$table_auto_name; //自动记录表

            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : null;

            //是否有值
            if (empty($uuid)) {
                wp_send_json_error(['error' => '缺少uuid参数'], 400);
                wp_die();
            }

            // 开始事务
            $wpdb->query('START TRANSACTION');

            try {
                // 使用预处理语句执行删除操作
                $sql = $wpdb->prepare("DELETE FROM $data_name WHERE uuid = %s", $uuid);
                $sql_change = $wpdb->prepare("DELETE FROM $change_name WHERE record_uuid = %s", $uuid);
                $sql_auto = $wpdb->prepare("DELETE FROM $auto_name WHERE record_uuid = %s", $uuid);

                // 执行删除操作
                $result = $wpdb->query($sql);
                $result_change = $wpdb->query($sql_change);
                $result_auto = $wpdb->query($sql_auto);

                // 检查删除操作是否成功
                if ($result === false || $result_change === false || $result_auto === false) {
                    throw new Exception('删除数据时发生错误: ' . $wpdb->last_error);
                }

                // 提交事务
                $wpdb->query('COMMIT');

                // 返回成功响应
                wp_send_json_success(['message' => '此设备已移除']);
            } catch (Exception $e) {
                // 发生异常时回滚事务
                $wpdb->query('ROLLBACK');
                // 返回错误响应
                wp_send_json_error([
                    'error' => $e->getMessage()
                ], 500);
            }

            wp_die();
        }
    }
}
