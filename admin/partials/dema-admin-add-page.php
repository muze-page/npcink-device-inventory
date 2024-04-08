<?php

/**
 * 接口 设置各种接口
 */
if (!class_exists('DEMA_Admin_Add_Page')) {
    class DEMA_Admin_Add_Page extends DEMA_Admin_Menu
    {
        //运行
        public static function runs()
        {

            //创建页面
            add_action('init', array(__CLASS__, 'my_custom_plugin_setup'));

            //加载JS
            add_action('wp_enqueue_scripts', array(__CLASS__, 'load_custom_script_on_specific_page'));

            
        }

        //创建页面
        public static  function my_custom_plugin_setup()
        {
            // 检查是否已经存在自定义页面
            $page_slug = 'goto'; //链接
            $config = 'my_custom_plugin_page_a3'; //唯一标识
            $existing_page_id = get_option($config);

            if ($existing_page_id) {
                return; // 页面已经存在，不执行后续操作
            }

            // 创建新页面
            $page_title = '公共查询设备页';
            $page_content = '<div id="npcinkSearch">错误，请联系管理员</div>';

            $page = array(
                'post_title'   => $page_title,
                'post_content' => $page_content,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_name'    => $page_slug
            );

            // 添加页面，并获取页面ID
            $page_id = wp_insert_post($page);


            // 存储页面ID
            update_option($config, $page_id);
        }

        public static function load_custom_script_on_specific_page()
        {
            // Get the current page object
            $current_page = get_page_by_path(get_query_var('pagename'));

            // Check if it's the target page (replace 'target-page-slug' with the actual slug of your target page)
            if ($current_page && $current_page->post_name === 'goto') {

                 //准备地址
            $index_css = plugin_dir_url(dirname(__DIR__)) . 'search/dist/index.css';
            $index_js = plugin_dir_url(dirname(__DIR__)) . 'search/dist/index.js';
                // Enqueue your JavaScript file
                wp_enqueue_style('custom-script', $index_css, array(), '2.0', false);
                wp_enqueue_script('custom-script', $index_js, array(), '1.0', true);

                $pf_api_translation_array = array(
                    'site' => get_home_url(), //首页网址
                    'option' => get_option(self::$option), //传递选项
                );
                wp_localize_script('custom-script', 'dataLocal', $pf_api_translation_array); //传给search项目
            }
        }


        
    }
}
