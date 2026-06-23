<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 自定义设备接口（REST 在 api.php 中处理）
 */
if (!class_exists('Npcink_Device_Inventory_Admin_Interface_Table_Style')) {
    class Npcink_Device_Inventory_Admin_Interface_Table_Style extends Npcink_Device_Inventory_Admin_Interface
    {
        public static function run()
        {
            // REST 接口已接管管理员端操作。
        }
    }
}
