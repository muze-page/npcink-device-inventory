<?php

/**
 * 接口 设置各种接口
 */
if (!class_exists('DEMA_Admin_Interface')) {
    class DEMA_Admin_Interface
    {

        //选项
        public static $option = "device_manaje_option";

        //电脑设备数据表
        public static $table_data_name = "npcink_device_data";

        //自定义设备数据表
        public static $table_style_name = "npcink_device_style";

        //变更手动记录表
        public static $table_change_name = "npcink_device_change";

        //变更自动记录表
        public static $table_change_auto = "npcink_device_auto";

        //运行
        public static function run()
        {
            //设置
            require_once plugin_dir_path(__FILE__) . 'interface/seting.php';
            DEMA_Admin_Interface_Seting::run();

            //电脑设备数据的接收，前端数据查询
            require_once plugin_dir_path(__FILE__) . 'interface/api.php';
            DEMA_Admin_Interface_API::run();

            //电脑设备设置
            require_once plugin_dir_path(__FILE__) . 'interface/table-pc.php';
            DEMA_Admin_Interface_Table_PC::run();

            //自定义设备数据增删改查接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-style.php';
            DEMA_Admin_Interface_Table_Style::run();

            //设备变更手动记录相关接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-manual.php';
            DEMA_Admin_Interface_Table_Manual::run();

            //设备变更自动记录相关接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-auto.php';
            DEMA_Admin_Interface_Table_Auto::run();

            //添加前端公共搜索页接口
            require_once plugin_dir_path(__FILE__) . 'interface/search-page.php';
            DEMA_Admin_Interface_Search_Page::run();
        }


        /**
         * 提供选项
         */
        public static function get_seting($name)
        {
            //拿到选项值
            $config = get_option(self::$option);
            $value =  self::get_config($config, $name);
            return $value;
        }
        /**
         * 从对象中获取属性值
         *
         * @param object $config 对象
         * @param string $property 从对象中获取的属性名
         * @param string $defaultValue 默认值（可选）
         * @return mixed 属性值或默认值
         */
        public static function get_config($config, $property, $defaultValue = false)
        {
            /**
             * 是否是对象
             * 对象中是否有此键名
             * 在对象中的此值是否为空
             */
            if (is_object($config) && property_exists($config, $property) && !empty($config->$property)) {
                return $config->$property;
            } else {
                //不存在则输出默认值
                return $defaultValue;
            }
        }
    } //end
}
