<?php
//添加菜单，传递数据
if (!class_exists('Npcink_Device_Manage_Admin_Menu')) {
    class Npcink_Device_Manage_Admin_Menu extends Npcink_Device_Manage_Admin_Interface
    {
        public static $plugin_name; //插件名
        public static $plugin_version; //插件版本
        public static function run_menu($name, $version)
        {
            //传值
            self::$plugin_name = $name;
            self::$plugin_version = $version;
            //添加菜单
            add_action('admin_menu', array(__CLASS__, 'register_admin_menu'));

            //加载 CSS 和 JS 资源
            add_action('admin_enqueue_scripts', array(__CLASS__, 'load_admin_script'));

            //对js文件进行module接入
            add_filter('script_loader_tag', array(__CLASS__, 'refund_type_script'), 10, 2);
        }
        //创建菜单
        public static function register_admin_menu()
        {
            // 添加一个菜单到 WordPress 后台的“设置”菜单下
            add_submenu_page(
                'plugins.php',
                '设备资产管理',
                '设备资产管理',
                'manage_options',
                'npcink_device_manage_settings',
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
            if ('plugins_page_npcink_device_manage_settings' != $hook) {
                return;
            }

            //准备地址
            $index_css = plugin_dir_url(dirname(__DIR__)) . 'vite-admin/dist/index.css';
            $index_js = plugin_dir_url(dirname(__DIR__)) . 'vite-admin/dist/index.js';

            wp_enqueue_style($name, $index_css, array(), $ver, false);
            wp_enqueue_script($name, $index_js, array(), $ver, true);

            //准备数据库名称
            $sql_table_name = [
                'pcData' => self::$table_pc_name, //设备数据表名
                'styleData' => self::$table_style_name, //自定义设备数据表名
                'changeManualData' => self::$table_manual_name, //手动变更记录数据表名
                'changeAutoData' => self::$table_auto_name, //自动变更记录表名
            ];


            $option = get_option(self::$option);
            if (is_object($option)) {
                $option->password = '已设定';
                $option->client_tokens = Npcink_Device_Manage_Admin_Interface_API::public_client_tokens();
                $option->has_client_token = !empty(array_filter($option->client_tokens, function ($token) {
                    return !empty($token['enabled']);
                }));
                unset($option->client_token_key_hash);
                unset($option->client_token_id, $option->client_token_preview, $option->client_token_created_at);
            } elseif (is_array($option)) {
                $option['password'] = '已设定';
                $option['client_tokens'] = Npcink_Device_Manage_Admin_Interface_API::public_client_tokens();
                $option['has_client_token'] = !empty(array_filter($option['client_tokens'], function ($token) {
                    return !empty($token['enabled']);
                }));
                unset($option['client_token_key_hash']);
                unset($option['client_token_id'], $option['client_token_preview'], $option['client_token_created_at']);
            }

            $pf_api_translation_array = array(
                'site' => get_home_url(), //首页网址
                'rest_url' => rest_url('npcink/v1'), //REST API 基础地址
                'rest_nonce' => wp_create_nonce('wp_rest'),
                'option' => $option, //传递选项（脱敏）
                'sqlTableName' => $sql_table_name, //数据库表名
            );
            wp_localize_script($name, 'dataLocal', $pf_api_translation_array); //传给vite项目
        }

        //对js文件进行module接入
        public static function refund_type_script($tag, $handle)
        {
            if ($handle === self::$plugin_name && strpos($tag, 'index.js') !== false) {
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
            $table_name = $wpdb->prefix . self::$table_pc_name;

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
