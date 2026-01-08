<?php

/**
 * 添加前端搜索页接口
 */
if (!class_exists('DEMA_Admin_Interface_Search_Page')) {
    class DEMA_Admin_Interface_Search_Page extends DEMA_Admin_Interface
    {
        public static function run()
        {
            //加载JS
            add_action('wp_enqueue_scripts', array(__CLASS__, 'load_search_page_script'));
        }

        //创建页面
        /**
         * @param string $route 路由
         */
        public static  function add_page($route)
        {
            // 创建新页面
            $page_title = '勿删：公共查询设备页';
            $page_content = '<div id="npcinkSearch">错误，请联系管理员</div>';

            $page = array(
                'post_title'   => $page_title,
                'post_content' => $page_content,
                'post_status'  => 'publish',
                'post_type'    => 'page',
                'post_name'    => $route
            );

            // 添加页面
            return wp_insert_post($page);
        }

        public static function load_js()
        {
            $ver = DEMA_Admin_Menu::$plugin_version;
            $name = DEMA_Admin_Menu::$plugin_name . '-search';
            //准备地址
            // $index_css = plugin_dir_url(dirname(__DIR__)) . 'search/dist/index.css';
            // wp_enqueue_style($name, $index_css, array(), $ver, false);
            $index_js = plugin_dir_url(dirname(dirname(__DIR__))) . 'vite-search/dist/index.js';


            wp_enqueue_script($name, $index_js, array(), $ver, true);

            $pf_api_translation_array = array(
                'site' => get_home_url(), //首页网址
            );
            wp_localize_script($name, 'dataLocal', $pf_api_translation_array); //传给search项目
        }

        //判断
        public static function load_search_page_script()
        {
            //获取查询页路由
            $route = self::get_seting('public_search_route');
            // 获取当前页面对象
            $current_page = get_page_by_path(get_query_var('pagename'));

            // 检查它是否是目标页面（用目标页面的实际段塞替换“目标页面段塞”）
            if ($current_page && $current_page->post_name === $route) {
                self::load_js();
            }
        }
    }
}
