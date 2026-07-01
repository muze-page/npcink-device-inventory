<?php

if (!defined('ABSPATH')) {
    exit;
}

//添加菜单，传递数据
if (!class_exists('Npcink_Device_Inventory_Admin_Menu')) {
    class Npcink_Device_Inventory_Admin_Menu extends Npcink_Device_Inventory_Admin_Interface
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
            $page_title = self::admin_page_title();
            // 添加一个菜单到 WordPress 后台的“设置”菜单下
            add_submenu_page(
                'plugins.php',
                $page_title,
                $page_title,
                'manage_options',
                'npcink_device_inventory_settings',
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
	                <div id="root"></div>
	            </div>
	<?php

        }

        private static function admin_page_title()
        {
            $locale = function_exists('determine_locale') ? determine_locale() : get_locale();
            if (0 === strpos($locale, 'zh_')) {
                return '设备资产管理';
            }

            return __('Device Inventory', 'npcink-device-inventory');
        }

        /**
         * Admin labels used by the bundled React app.
         *
         * WordPress.org will handle gettext translations for PHP strings after release.
         * The bundled app receives a small locale-aware label map so the first admin
         * screen is usable in both English and Simplified Chinese immediately.
         */
        private static function admin_labels()
        {
            $locale = function_exists('determine_locale') ? determine_locale() : get_locale();
            if (0 === strpos($locale, 'zh_')) {
                return array(
                    'assets' => '资产台账',
                    'client_tokens' => '客户端令牌',
                    'settings' => '设置',
                );
            }

            return array(
                'assets' => __('Assets', 'npcink-device-inventory'),
                'client_tokens' => __('Client Tokens', 'npcink-device-inventory'),
                'settings' => __('Settings', 'npcink-device-inventory'),
            );
        }
        /**
         * 加载资源
         */
        public static function load_admin_script($hook)
        {
            $ver = self::$plugin_version;
            $name = self::$plugin_name;
            //是否是指定页面
            if ('plugins_page_npcink_device_inventory_settings' != $hook) {
                return;
            }

	            $plugin_url = plugin_dir_url(dirname(__DIR__));
	            $plugin_path = dirname(dirname(__DIR__)) . '/';
	            $app_css_path = $plugin_path . 'vite-admin/dist/index.css';
	            $app_js_path = $plugin_path . 'vite-admin/dist/index.js';
	            $app_css_ver = file_exists($app_css_path) ? (string) filemtime($app_css_path) : $ver;
	            $app_js_ver = file_exists($app_js_path) ? (string) filemtime($app_js_path) : $ver;
	            wp_enqueue_style($name, $plugin_url . 'admin/css/npcink-device-inventory-admin.css', array(), $ver, false);
	            wp_enqueue_style($name . '-app', $plugin_url . 'vite-admin/dist/index.css', array(), $app_css_ver, false);
	            wp_enqueue_script($name, $plugin_url . 'vite-admin/dist/index.js', array(), $app_js_ver, true);
	            wp_localize_script(
	                $name,
	                'npcinkDeviceInventoryData',
	                array(
	                    'site' => home_url(),
	                    'rest_url' => esc_url_raw(rest_url('npcink-device-inventory/v1')),
	                    'rest_nonce' => wp_create_nonce('wp_rest'),
	                    'locale' => function_exists('determine_locale') ? determine_locale() : get_locale(),
	                    'labels' => self::admin_labels(),
	                )
	            );
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

    }
}
