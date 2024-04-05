<?php

/**
 * 接口 设置各种接口
 */
if (!class_exists('DEMA_Admin_Add_Page')) {
    class DEMA_Admin_Add_Page
    {
        //运行
        public static function run()
        {
            /**
             * 注册
             */
            add_filter('theme_page_templates', array(__CLASS__, 'custom_page_templates'));
        }
        public static function custom_page_templates($templates)
        {
            // 添加新的页面模板
            $new_templates = array(
                'template-one.php' => 'Custom Template',
                //'template-two.php' => 'Another Custom Template'
                // 添加更多页面模板，按照相同的格式进行添加
            );

            // 合并新的模板数组到现有的模板数组中
            $templates = array_merge($templates, $new_templates);

            return $templates;
        }
    }
}
