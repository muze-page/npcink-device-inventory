<?php
//添加菜单，传递数据
if (!class_exists('DEMA_Admin_Menu')) {
    class DEMA_Admin_Menu extends DEMA_Admin_Interface
    {
        public static $plugin_name; //插件名
        public static $plugin_version; //插件版本
        public static function run_menu($name, $version)
        {
            //传值
            self::$plugin_name = $name;
            self::$plugin_version = $version;
            //添加菜单
            add_action('admin_menu', array(__CLASS__, 'dema_menu'));

            //加载 CSS 和 JS 资源
            add_action('admin_enqueue_scripts', array(__CLASS__, 'load_admin_script'));

            //对js文件进行module接入
            add_filter('script_loader_tag', array(__CLASS__, 'refund_type_script'), 10, 2);
        }
        //创建菜单
        public static function dema_menu()
        {
            // 添加一个菜单到 WordPress 后台的“设置”菜单下
            add_submenu_page(
                'plugins.php',
                '电脑资产管理',
                '电脑资产管理',
                'administrator',
                'dema_seting',
                array(__CLASS__, 'menu_displays'),
                '200.1'
            );
        }




        public static function menu_displays()
        {
?>
            <div class="wrap">
                <!--标题-->
                <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
                <div id='root'>数据加载中，请稍等</div>
            </div>
<?php

        }
        /**
         * 加载资源
         */
        public static function load_admin_script($hook)
        {
            $ver = self::$plugin_version;
            $name = self::$plugin_name;
            //是否是指定页面
            if ('plugins_page_dema_seting' != $hook) {
                return;
            }

            //准备地址
            $index_css = plugin_dir_url(dirname(__DIR__)) . 'admin-vite/dist/index.css';
            $index_js = plugin_dir_url(dirname(__DIR__)) . 'admin-vite/dist/index.js';

            wp_enqueue_style($name, $index_css, array(), $ver, false);
            wp_enqueue_script($name, $index_js, array(), $ver, true);


            $pf_api_translation_array = array(
                'site' => get_home_url(), //首页网址
                'ajaxurl' => admin_url('admin-ajax.php'),
                'data' => self::get_device_data(), //传递设备数据
                'styleData' => self::get_style_device_data(), //传递自定义设备数据'
                'option' => get_option(self::$option), //传递选项
                'table_data_name' => self::$table_data_name, //设备数据表名
                'table_change_name' => self::$table_change_name, //手动变更记录数据表名
                'table_style_name' => self::$table_style_name, //自定义设备数据表名
                'table_change_auto' => self::$table_change_auto, //自动变更记录表名
            );
            wp_localize_script($name, 'dataLocal', $pf_api_translation_array); //传给vite项目
        }

        //对js文件进行module接入
        public static function refund_type_script($tag, $handle)
        {
            // 在这里判断需要添加 type 属性的 JS 文件，比如文件名包含 xxx.js
            if (strpos($tag, 'index.js') !== false) {
                // 在 script 标签中添加 type 属性
                $tag = str_replace('<script', '<script type="module"', $tag);
            }
            return $tag;
        }

        /**
         * 获取数据
         */
        // 自定义函数，用于从表中获取数据
        public static function get_device_data()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_data_name;

            // 获取所有数据
            $result = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);

            return $result;
        }

        /**
         * 获取自定义设备数据表内容
         */
        public static function get_style_device_data()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            // 获取所有数据
            $result = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
            return $result;
        }
    }
}
