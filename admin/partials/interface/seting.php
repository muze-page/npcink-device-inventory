<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 设置校验（REST 在 api.php 中处理）
 */
if (!class_exists('Npcink_Device_Inventory_Admin_Interface_Seting')) {
    class Npcink_Device_Inventory_Admin_Interface_Seting extends Npcink_Device_Inventory_Admin_Interface
    {
        public static function run()
        {
            // REST 接口已接管管理员端操作。
        }

        //选项类型验证
        public static function validate_object($object)
        {
            // 需要验证的属性列表
            $required_properties = ['delete_mysql', 'public_search_route'];

            //提示
            $prompt = array(
                'delete_mysql' => '请选择删除数据库的状态',
                'public_search_route' => '请输入公共查询页面路由',
            );

            // 循环遍历需要验证的属性
            foreach ($required_properties as $property) {
                // 检查属性是否存在
                if (!property_exists($object, $property)) {
                    // 调用函数并输出提示
                    $result = array_key_exists($property, $prompt) ? $prompt[$property] : '未找到匹配项';

                    return "缺少属性：$property" . ' - ' . $result;
                }

                // 根据属性类型进行验证
                switch ($property) {
                    case 'delete_mysql':
                        if (!is_bool($object->delete_mysql)) {
                            return 'delete_mysql 属性必须是布尔类型';
                        }
                        break;
                    case 'public_search_route':
                        if (!is_string($object->public_search_route)) {
                            return 'public_search_route 属性必须是字符串类型';
                        }
                        break;


                    default:
                        // 如果有其他属性需要验证，可以在这里添加逻辑
                        break;
                }
            }

            // 所有属性验证通过
            return true;
        }
    }
}
