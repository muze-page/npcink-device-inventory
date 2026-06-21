<?php

/**
 * 电脑信息接口（REST 在 api.php 中处理）
 */
if (!class_exists('Npcink_Device_Manage_Admin_Interface_Table_PC')) {
    class Npcink_Device_Manage_Admin_Interface_Table_PC extends Npcink_Device_Manage_Admin_Interface
    {
        public static function run()
        {
            // REST 接口已接管管理员端操作。
        }
    }
}
