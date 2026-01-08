<?php

/**
 * 自动变更接口（legacy admin-ajax 已移除，REST 在 api.php 中处理）
 */
if (!class_exists('DEMA_Admin_Interface_Table_Auto')) {
    class DEMA_Admin_Interface_Table_Auto extends DEMA_Admin_Interface
    {
        public static function run()
        {
            // REST 接口已接管管理员端操作。
        }
    }
}
