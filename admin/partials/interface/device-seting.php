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
            add_action('wp_ajax_update_style_name_callback',  array(__CLASS__, 'update_style_name_callback'));
            //add_action('wp_ajax_nopriv_update_style_name_callback',  array(__CLASS__, 'update_style_name_callback'));

            // 删除设备接口
            add_action('wp_ajax_delt_sql_uuid_callback', array(__CLASS__, 'delt_sql_uuid_callback'));
            //add_action('wp_ajax_nopriv_delt_sql_uuid_callback', array(__CLASS__, 'delt_sql_uuid_callback'));
        }

        /**
         * 修改设备信息接口
         */
        public static function update_style_name_callback()
        {


            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';



            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : ''; //唯一标识符
            $data = isset($_POST['data']) ? sanitize_text_field($_POST['data']) : ''; //修改的值
            $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : ''; //字段名

            // 定义字段与数据库类型的映射关系
            $field_map = array(
                'name' => 'name', //姓名
                'number' => 'number', //编号
                'state' => 'state', //状态
                'department' => 'department', //部门
            );

            // 确定要更新的字段
            $field_name = isset($field_map[$type]) ? $field_map[$type] : '';

            try {
                if (!empty($field_name)) {
                    // 使用预处理语句更新数据库中对应的数据
                    $wpdb->update(
                        $table_name,
                        array($field_name => $data),
                        array('uuid' => $uuid),
                        '%s', // 字段类型
                        '%s'  // 条件类型
                    );

                    // 返回更新成功的响应
                    echo json_encode(array(
                        'success' => true,
                        'table_name' => $table_name,
                        'type' => $type,
                        'field_name' => $field_name,
                        'data' => $data,
                        'uuid' => $uuid
                    ));
                } else {
                    // 未找到对应的字段名
                    echo json_encode(array(
                        'success' => false,
                        'error' => '未找到对应的字段名'
                    ));
                }
            } catch (Exception $e) {
                // 返回更新失败的响应，包含详细的错误信息
                echo json_encode(array(
                    'success' => false,
                    'error' => '数据库更新失败: ' . $e->getMessage()
                ));
            }
            wp_die();
        }

        /**
         * 添加删除设备接口 - 删除设备信息和变更信息
         */
        public static  function delt_sql_uuid_callback()
        {


            global $wpdb;
            $table_name = $wpdb->prefix . 'custom_table';
            $table_change = $wpdb->prefix . 'custom_change';



            // 获取前端传递的参数并进行输入验证
            $uuid = isset($_POST['uuid']) ? sanitize_text_field($_POST['uuid']) : '';

            // 使用预处理语句构建SQL查询
            $sql = $wpdb->prepare("DELETE FROM $table_name WHERE uuid = %s", $uuid);
            $sql_change = $wpdb->prepare("DELETE FROM $table_change WHERE uuid = %s", $uuid);

            // 开始事务
            $wpdb->query('START TRANSACTION');

            try {
                // 执行删除操作
                $result = $wpdb->query($sql);
                $result_change = $wpdb->query($sql_change);

                if ($result === false || $result_change === false) {
                    throw new Exception('删除数据时发生错误');
                }

                // 提交事务
                $wpdb->query('COMMIT');

                wp_send_json([
                    'success' => true,
                    'message' => '行数据已成功删除'
                ]);
            } catch (Exception $e) {
                // 回滚事务
                $wpdb->query('ROLLBACK');

                wp_send_json([
                    'success' => false,
                    'message' => $e->getMessage()
                ]);
            } finally {
                wp_die();
            }
        }
    }
}
