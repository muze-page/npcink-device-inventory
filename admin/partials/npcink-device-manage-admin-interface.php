<?php

/**
 * 接口 设置各种接口
 */
if (!class_exists('Npcink_Device_Manage_Admin_Interface')) {
    class Npcink_Device_Manage_Admin_Interface
    {

        //选项
        public static $option = "device_manaje_option";

        //电脑设备数据表
        public static $table_pc_name = "npcink_device_pc";

        //自定义设备数据表
        public static $table_style_name = "npcink_device_style";

        //变更手动记录表
        public static $table_manual_name = "npcink_device_manual";

        //变更自动记录表
        public static $table_auto_name = "npcink_device_auto";

        /**
         * 缓存键生成（支持多站点）
         */
        public static function get_cache_key($suffix)
        {
            $blog_id = function_exists('get_current_blog_id') ? get_current_blog_id() : 1;
            return 'npcink_device_manage_' . $blog_id . '_' . $suffix;
        }

        /**
         * 检查数据表是否包含指定列
         */
        public static function column_exists($table_name, $column_name)
        {
            static $column_cache = array();
            $cache_key = $table_name . '::' . $column_name;
            if (array_key_exists($cache_key, $column_cache)) {
                return $column_cache[$cache_key];
            }

            global $wpdb;
            $exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = %s
                     AND COLUMN_NAME = %s",
                    $table_name,
                    $column_name
                )
            );
            $column_cache[$cache_key] = intval($exists) > 0;
            return $column_cache[$cache_key];
        }

        /**
         * 检查数据表是否包含指定索引
         */
        public static function index_exists($table_name, $index_name)
        {
            static $index_cache = array();
            $cache_key = $table_name . '::' . $index_name;
            if (array_key_exists($cache_key, $index_cache)) {
                return $index_cache[$cache_key];
            }

            global $wpdb;
            $exists = $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                     WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = %s
                     AND INDEX_NAME = %s",
                    $table_name,
                    $index_name
                )
            );
            $index_cache[$cache_key] = intval($exists) > 0;
            return $index_cache[$cache_key];
        }

        /**
         * 计算数组行的最新时间戳
         */
        protected static function extract_latest_timestamp($rows, $fields)
        {
            if (!is_array($rows) || empty($fields)) {
                return null;
            }
            $latest = 0;
            foreach ($rows as $row) {
                if (!is_array($row)) {
                    continue;
                }
                foreach ($fields as $field) {
                    if (empty($row[$field])) {
                        continue;
                    }
                    $timestamp = strtotime($row[$field]);
                    if ($timestamp && $timestamp > $latest) {
                        $latest = $timestamp;
                    }
                }
            }
            return $latest > 0 ? $latest : null;
        }

        /**
         * 构建带 ETag/Last-Modified 的 REST 响应
         */
        protected static function rest_response_with_cache($request, $payload, $last_modified = null)
        {
            $encoded = wp_json_encode($payload);
            if ($encoded === false) {
                $encoded = maybe_serialize($payload);
            }
            $etag = '"' . md5($encoded) . '"';

            $last_modified_ts = null;
            if (!empty($last_modified)) {
                $last_modified_ts = is_numeric($last_modified)
                    ? intval($last_modified)
                    : strtotime($last_modified);
            }
            $last_modified_header = $last_modified_ts
                ? gmdate('D, d M Y H:i:s', $last_modified_ts) . ' GMT'
                : null;

            $headers = array(
                'ETag' => $etag,
                'Cache-Control' => 'private, max-age=0, must-revalidate',
                'Vary' => 'Cookie',
            );
            if ($last_modified_header) {
                $headers['Last-Modified'] = $last_modified_header;
            }

            if ($request instanceof WP_REST_Request) {
                $if_none_match = $request->get_header('if-none-match');
                if (self::etag_matches($if_none_match, $etag)) {
                    $not_modified = new WP_REST_Response(null, 304);
                    $not_modified->set_headers($headers);
                    return $not_modified;
                }

                $if_modified_since = $request->get_header('if-modified-since');
                if (!$if_none_match && $last_modified_ts && $if_modified_since) {
                    $since_ts = strtotime($if_modified_since);
                    if ($since_ts && $since_ts >= $last_modified_ts) {
                        $not_modified = new WP_REST_Response(null, 304);
                        $not_modified->set_headers($headers);
                        return $not_modified;
                    }
                }
            }

            $response = rest_ensure_response($payload);
            $response->set_headers($headers);
            return $response;
        }

        /**
         * 判断 ETag 是否匹配
         */
        protected static function etag_matches($if_none_match, $etag)
        {
            if (empty($if_none_match) || empty($etag)) {
                return false;
            }
            $if_none_match = trim($if_none_match);
            if ($if_none_match === '*') {
                return true;
            }
            $needle = self::normalize_etag($etag);
            $parts = array_map('trim', explode(',', $if_none_match));
            foreach ($parts as $part) {
                if (self::normalize_etag($part) === $needle) {
                    return true;
                }
            }
            return false;
        }

        /**
         * 规范化 ETag
         */
        protected static function normalize_etag($etag)
        {
            $etag = trim($etag);
            if (stripos($etag, 'W/') === 0) {
                $etag = substr($etag, 2);
            }
            return trim($etag, "\"'");
        }

        /**
         * 清理电脑设备相关缓存
         */
        public static function clear_pc_cache()
        {
            delete_transient(self::get_cache_key('pc_categories'));
            delete_transient(self::get_cache_key('pc_summary'));
        }

        /**
         * 清理自定义设备相关缓存
         */
        public static function clear_style_cache()
        {
            delete_transient(self::get_cache_key('style_categories'));
        }

        //运行
        public static function run()
        {
            //设置
            require_once plugin_dir_path(__FILE__) . 'interface/seting.php';
            Npcink_Device_Manage_Admin_Interface_Seting::run();

            //电脑设备数据的接收，前端数据查询
            require_once plugin_dir_path(__FILE__) . 'interface/api.php';
            Npcink_Device_Manage_Admin_Interface_API::run();

            //电脑设备设置
            require_once plugin_dir_path(__FILE__) . 'interface/table-pc.php';
            Npcink_Device_Manage_Admin_Interface_Table_PC::run();

            //自定义设备数据增删改查接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-style.php';
            Npcink_Device_Manage_Admin_Interface_Table_Style::run();

            //设备变更手动记录相关接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-manual.php';
            Npcink_Device_Manage_Admin_Interface_Table_Manual::run();

            //设备变更自动记录相关接口
            require_once plugin_dir_path(__FILE__) . 'interface/table-auto.php';
            Npcink_Device_Manage_Admin_Interface_Table_Auto::run();

            //添加前端公共搜索页接口
            require_once plugin_dir_path(__FILE__) . 'interface/search-page.php';
            Npcink_Device_Manage_Admin_Interface_Search_Page::run();
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
            if (is_array($config) && array_key_exists($property, $config) && !empty($config[$property])) {
                return $config[$property];
            }

            if (is_object($config) && property_exists($config, $property) && !empty($config->$property)) {
                return $config->$property;
            } else {
                //不存在则输出默认值
                return $defaultValue;
            }
        }
    } //end
}
