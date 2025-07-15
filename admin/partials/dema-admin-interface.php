<?php

/**
 * 接口 设置各种接口
 */
if (!class_exists('DEMA_Admin_Interface')) {
    class DEMA_Admin_Interface
    {

        //选项
        public static $option = "device_manaje_option";

        //基本数据表
        public static $table_data_name = "npcink_device_data";

        //变更表
        public static $table_change_name = "npcink_device_change";

        //自定义数据表
        public static $table_style_name = "npcink_mdm_style_data";

        //运行
        public static function run()
        {
            //设置
            require_once plugin_dir_path(__FILE__) . 'interface/seting.php';
            DEMA_Admin_Interface_Seting::run();

            //数据接收
            require_once plugin_dir_path(__FILE__) . 'interface/data-input.php';
            DEMA_Admin_Interface_DataInput::run();

            //硬件变更增删改查接口
            require_once plugin_dir_path(__FILE__) . 'interface/device-change.php';
            DEMA_Admin_Interface_Device_Change::run();

            //硬件设置-删改
            require_once plugin_dir_path(__FILE__) . 'interface/device-seting.php';
            DEMA_Admin_Interface_Device_Seting::run();

            //添加前端公共搜索页接口
            require_once plugin_dir_path(__FILE__) . 'interface/add-page.php';
            DEMA_Admin_Interface_Add_Page::run();
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
