<?php

/**
 * 接口 接收软件传来的数据
 * 使用特定算法算出的UUID，用于校验机器唯一性，
 * 第一张网卡的mac地址加设备UUID，再进行md5处理，得到UUID
 */
if (!class_exists('DEMA_Admin_Interface_API')) {
    class DEMA_Admin_Interface_API extends DEMA_Admin_Interface
    {
        //表名
        public static $table_name;

        public static function run()
        {
            /**
             * 开发态：获取 REST nonce（用于 Vite dev）
             */
            $is_dev = (defined('WP_DEBUG') && WP_DEBUG)
                || (function_exists('wp_get_environment_type') && wp_get_environment_type() === 'development');
            if ($is_dev) {
                add_action('wp_ajax_dema_get_rest_nonce', array(__CLASS__, 'get_rest_nonce_callback'));
            }

            /**
             * 添加接收设备数据api接口
             * http://localhost:10048/wp-json/npcink/v1/submit-data
             */
            add_action('rest_api_init', array(__CLASS__, 'create_custom_endpoint'));

            /**
             * 添加查询设备数据api接口
             * http://localhost:10048/wp-json/npcink/v1/query?number=1&password=9527
             */
            add_action('rest_api_init', array(__CLASS__, 'create_query_endpoint'));

            /**
             * 管理端 REST 接口（分页/搜索/增删改查）
             */
            add_action('rest_api_init', array(__CLASS__, 'create_admin_endpoints'));
        }

        /**
         * 开发态 - 获取 REST nonce
         */
        public static function get_rest_nonce_callback()
        {
            $is_dev = (defined('WP_DEBUG') && WP_DEBUG)
                || (function_exists('wp_get_environment_type') && wp_get_environment_type() === 'development');
            if (!$is_dev) {
                wp_send_json_error(['error' => '接口仅在开发环境可用'], 403);
            }

            if (!current_user_can('manage_options')) {
                wp_send_json_error(['error' => '权限不足'], 403);
            }

            wp_send_json_success([
                'nonce' => wp_create_nonce('wp_rest'),
            ]);
        }

        /**
         * 添加查询设备数据api接口
         * 
         */
        public static function create_query_endpoint()
        {
            register_rest_route('npcink/v1', '/query', array(
                'methods' => 'GET',
                'callback' => array(__CLASS__, 'query_data'),
                'permission_callback' => array(__CLASS__, 'public_permissions_check'),
            ));
        }

        /**
         * 前端查询数据
         * data:编号或姓名
         * password:密码
         * all inspect
         */
        public static function query_data($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . self::$table_pc_name;
            header('Access-Control-Allow-Origin: *');

            // 获取传递过来的字符串参数并进行安全过滤
            $query_data = isset($request['data']) ? sanitize_text_field($request['data']) : null;
            $detail_param = $request instanceof WP_REST_Request ? $request->get_param('detail') : (isset($request['detail']) ? $request['detail'] : null);
            $include_detail = in_array(strtolower((string) $detail_param), array('1', 'true', 'yes'), true);

            /**
             * 安全检查 - 是否为空
             */
            if (empty($query_data)) {
                return wp_send_json_error(
                    [
                        'error' => '请填写需要查询的值',
                    ],
                    400
                );
            }

            $cache_key = self::get_cache_key('public_query_' . md5($query_data . '|' . ($include_detail ? '1' : '0')));
            $cached = get_transient($cache_key);
            if (is_array($cached) && isset($cached['payload'])) {
                $last_modified = isset($cached['last_modified']) ? $cached['last_modified'] : null;
                return self::rest_response_with_cache($request, $cached['payload'], $last_modified);
            }

            // 构造 SQL 查询语句
            $fields = array(
                'id',
                'name',
                'number',
                'state',
                'department',
                'ip',
                'created_at',
                'updated_at',
                'uuid',
            );
            if ($include_detail) {
                $fields[] = 'data';
            } else {
                $fields[] = 'NULL AS data';
            }
            $prepared_query = $wpdb->prepare(
                "SELECT " . implode(', ', $fields) . " FROM " . self::$table_name . " WHERE number = %s OR name = %s",
                $query_data,
                $query_data
            );

            // 执行查询
            $result = $wpdb->get_row($prepared_query);

            if ($result) {
                $payload = array(
                    'success' => true,
                    'data' => array(
                        'message' => '查询成功',
                        'data' => $result,
                    ),
                );
                $last_modified = null;
                if (!empty($result->updated_at)) {
                    $last_modified = $result->updated_at;
                } elseif (!empty($result->created_at)) {
                    $last_modified = $result->created_at;
                }
                set_transient(
                    $cache_key,
                    array(
                        'payload' => $payload,
                        'last_modified' => $last_modified,
                    ),
                    2 * MINUTE_IN_SECONDS
                );
                return self::rest_response_with_cache($request, $payload, $last_modified);
            } else {
                return wp_send_json_error([
                    'error' => '数据不存在，请换个姓名或编号再试试'
                ], 404);
                // 数据不存在
            }
        }



        //接收数据
        public static function create_custom_endpoint()
        {
            //获取路由地址
            $styleRoute =  self::get_seting('route');

            register_rest_route('npcink/v1', $styleRoute, array(
                'methods'  => 'POST',
                'callback' => array(__CLASS__, 'submit_data_callback'),
                'permission_callback' => array(__CLASS__, 'public_permissions_check'),
            ));

            register_rest_route('npcink/v1', '/device-post-data-v2', array(
                'methods'  => WP_REST_Server::CREATABLE,
                'callback' => array(__CLASS__, 'submit_device_data_v2'),
                'permission_callback' => array(__CLASS__, 'public_permissions_check'),
            ));
        }

        /**
         * 上传数据
         * all inspect
         */
        public static function submit_data_callback($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . self::$table_pc_name;
            header('Access-Control-Allow-Origin: *');

            //拿到传来的姓名，检查字符串
            $name = isset($request['name']) ? sanitize_text_field($request['name']) : null;

            //拿到传来的JSON对象字符串，检查字符串
            $data = isset($request['data']) ? sanitize_text_field($request['data']) : null;

            //姓名是否为空
            if (empty($name)) {
                return wp_send_json_error([
                    'error' => '姓名为空，请填写',
                ], 400);
            }

            //文本转对象
            $data_obj = json_decode($data);

            //是否为空
            if (empty($data_obj)) {
                return wp_send_json_error([
                    'error' => '硬件数据为空，请检查',
                ], 400);
            }

            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一
            $uuid_hardware = $data_obj->uuid->hardware; //唯一UUID
            $uuid_one_net = $data_obj->uuid->macs[0]; //第一个网口的MAC地址
            $uuid = md5($uuid_hardware . $uuid_one_net); //拼接，进行md5处理，短点更好看

            // 从网卡信息中提取有效 IP
            $device_ip = self::extract_valid_ip($data_obj);
            if ($device_ip === '') {
                $device_ip = '127.0.0.1';
            }

            //检查是否存在重复数据
            $repeatData = self::check_data_repeat($uuid);
            if ($repeatData) {
                //数据存在，更新现有数据
                return self::check_Data_Change($repeatData, $data, $name);
            }

            //生成随机编号，充当设备默认编号
            $random_string = uniqid(mt_rand(), true);

            //只取随机编号的后6位，你不会真的要用这套系统管理数十万台设备吧？不会吧！不会吧！
            $last_six_digits = substr($random_string, -6);

            // 数据不存在，插入新数据
            $insert_data = [
                'name' => $name, // 姓名
                'state' => '使用', // 默认状态为使用
                'number' =>  $last_six_digits, // 编号
                'department' => '默认', // 默认部门
                'purchase' => 0, //采购价'
                'depreciation' => 0, //二手价
                'ip' => $device_ip, // 默认IP地址
                'uuid' => $uuid, // 唯一标识符
                'data' => $data, // 数据
            ];

            // 准备插入数据的格式
            $data_formats = [
                '%s', // 姓名是字符串
                '%s', // 状态是字符串
                '%s', // 编号是字符串
                '%s', // 部门是字符串
                '%f', // 采购价是数字
                '%f', //二手价是数字
                '%s', // ip是字符串
                '%s', // 唯一标识符是字符串
                '%s', // 数据是字符串
            ];

            // 执行插入操作
            $res = $wpdb->insert(
                self::$table_name,
                $insert_data,
                $data_formats
            );


            if ($res) {
                self::clear_pc_cache();
                $response = [
                    'message' => '数据提交成功！',
                ];
                return wp_send_json_success($response);
            } else {
                $error_message = $wpdb->last_error;
                $response = [
                    'error' => '数据提交失败！',
                    'message' => $error_message,
                ];
                return wp_send_json_error($response, 500);
            }

            wp_die();
        }

        /**
         * v2 客户端上传数据
         * 保持旧 uuid 列不变，优先用 legacy uuid 匹配历史设备，再用 v2 stable id 兜底匹配。
         */
        public static function submit_device_data_v2($request)
        {
            global $wpdb;
            self::$table_name = $wpdb->prefix . self::$table_pc_name;
            header('Access-Control-Allow-Origin: *');

            $name = isset($request['name']) ? sanitize_text_field($request['name']) : '';
            if ($name === '') {
                return new WP_Error('missing_name', '姓名为空，请填写', array('status' => 400));
            }

            $data_obj = self::extract_device_data_from_request($request);
            if (empty($data_obj)) {
                return new WP_Error('missing_device_data', '硬件数据为空，请检查', array('status' => 400));
            }

            $legacy_uuid = self::derive_uuid_from_data($data_obj);
            if ($legacy_uuid === '') {
                return new WP_Error('missing_legacy_uuid', '硬件数据缺少 uuid.hardware 或 uuid.macs[0]', array('status' => 400));
            }

            $stable_id = self::derive_stable_device_id_v2($data_obj, $request);
            $collector = self::extract_collector_metadata($data_obj, $request);
            $data_obj = self::attach_device_migration_meta(
                $data_obj,
                $legacy_uuid,
                $stable_id,
                $collector,
                'upload_v2'
            );

            $data_json = wp_json_encode($data_obj, JSON_UNESCAPED_UNICODE);
            if ($data_json === false) {
                return new WP_Error('json_encode_failed', '硬件数据编码失败', array('status' => 400));
            }

            $existing_data = self::check_data_repeat($legacy_uuid);
            $match_strategy = 'legacy_uuid';
            if (empty($existing_data) && $stable_id !== '') {
                $existing_data = self::find_pc_by_stable_device_id($stable_id);
                $match_strategy = $existing_data ? 'stable_device_id_v2' : 'none';
            }

            if ($existing_data) {
                $result = $wpdb->update(
                    self::$table_name,
                    array(
                        'data' => $data_json,
                        'ip' => self::device_ip_or_default($data_obj),
                    ),
                    array('id' => $existing_data['id']),
                    array('%s', '%s'),
                    array('%d')
                );

                if ($result === false) {
                    return new WP_Error('update_failed', '设备数据更新失败', array(
                        'status' => 500,
                        'detail' => $wpdb->last_error,
                    ));
                }

                self::clear_pc_cache();
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => 'v2 设备数据已更新',
                    'mode' => 'update',
                    'match_strategy' => $match_strategy,
                    'uuid' => $existing_data['uuid'],
                    'legacy_uuid' => $legacy_uuid,
                    'stable_device_id_v2' => $stable_id,
                    'number' => $existing_data['number'],
                    'name' => $existing_data['name'],
                ));
            }

            $random_string = uniqid(mt_rand(), true);
            $last_six_digits = substr($random_string, -6);
            $device_ip = self::device_ip_or_default($data_obj);

            $insert_data = array(
                'name' => $name,
                'state' => '使用',
                'number' => $last_six_digits,
                'department' => '默认',
                'purchase' => 0,
                'depreciation' => 0,
                'ip' => $device_ip,
                'uuid' => $legacy_uuid,
                'data' => $data_json,
            );

            $res = $wpdb->insert(
                self::$table_name,
                $insert_data,
                array('%s', '%s', '%s', '%s', '%f', '%f', '%s', '%s', '%s')
            );

            if (!$res) {
                return new WP_Error('insert_failed', 'v2 设备数据提交失败', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            self::clear_pc_cache();
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'v2 设备数据已提交',
                'mode' => 'insert',
                'match_strategy' => 'none',
                'uuid' => $legacy_uuid,
                'legacy_uuid' => $legacy_uuid,
                'stable_device_id_v2' => $stable_id,
                'number' => $last_six_digits,
                'name' => $name,
            ));
        }

        /**
         * 验证密码是否正确 是否允许传输数据
         * @param $input_Password
         * @return boolean
         */
        private static function password_verification($input_Password)
        {
            $setting_Password = self::get_seting('password'); // 获取设置的密码

            // 使用 wp_check_password 直接验证密码
            $valid_password = wp_check_password($input_Password, $setting_Password);

            return $valid_password; // 返回验证结果
        }

        /**
         * 从设备数据中提取有效 IP
         * 优先使用默认网卡的 IPv4，其次为其他非内网卡 IPv4，再退回 IPv6
         */
        private static function extract_valid_ip($data_obj)
        {
            $net = null;
            if (is_object($data_obj) && isset($data_obj->net)) {
                $net = $data_obj->net;
            } elseif (is_array($data_obj) && isset($data_obj['net'])) {
                $net = $data_obj['net'];
            }

            if (!is_array($net)) {
                return '';
            }

            $entries = array();
            foreach ($net as $item) {
                if (is_object($item)) {
                    $item = (array) $item;
                }
                if (!is_array($item)) {
                    continue;
                }
                $entries[] = array(
                    'ip4' => isset($item['ip4']) ? trim((string) $item['ip4']) : '',
                    'ip6' => isset($item['ip6']) ? trim((string) $item['ip6']) : '',
                    'default' => !empty($item['default']),
                    'internal' => !empty($item['internal']),
                    'operstate' => isset($item['operstate']) ? (string) $item['operstate'] : '',
                );
            }

            $ip = self::pick_ip_from_entries($entries, 'ip4', true);
            if ($ip !== '') {
                return $ip;
            }
            $ip = self::pick_ip_from_entries($entries, 'ip6', true);
            if ($ip !== '') {
                return $ip;
            }
            $ip = self::pick_ip_from_entries($entries, 'ip4', false);
            if ($ip !== '') {
                return $ip;
            }
            return self::pick_ip_from_entries($entries, 'ip6', false);
        }

        /**
         * 从网卡列表中挑选 IP
         */
        private static function pick_ip_from_entries($entries, $key, $exclude_internal)
        {
            if (!is_array($entries) || empty($entries)) {
                return '';
            }

            foreach ($entries as $entry) {
                if (empty($entry[$key]) || ($exclude_internal && !empty($entry['internal']))) {
                    continue;
                }
                if ($key === 'ip4' && !self::is_valid_ipv4($entry[$key])) {
                    continue;
                }
                if ($key === 'ip6' && !self::is_valid_ipv6($entry[$key])) {
                    continue;
                }
                if (!empty($entry['default'])) {
                    return $entry[$key];
                }
            }

            foreach ($entries as $entry) {
                if (empty($entry[$key]) || ($exclude_internal && !empty($entry['internal']))) {
                    continue;
                }
                if ($key === 'ip4' && !self::is_valid_ipv4($entry[$key])) {
                    continue;
                }
                if ($key === 'ip6' && !self::is_valid_ipv6($entry[$key])) {
                    continue;
                }
                if (isset($entry['operstate']) && $entry['operstate'] === 'up') {
                    return $entry[$key];
                }
            }

            foreach ($entries as $entry) {
                if (empty($entry[$key]) || ($exclude_internal && !empty($entry['internal']))) {
                    continue;
                }
                if ($key === 'ip4' && !self::is_valid_ipv4($entry[$key])) {
                    continue;
                }
                if ($key === 'ip6' && !self::is_valid_ipv6($entry[$key])) {
                    continue;
                }
                return $entry[$key];
            }

            return '';
        }

        /**
         * IPv4 校验（排除 loopback/无效段）
         */
        private static function is_valid_ipv4($ip)
        {
            if ($ip === '' || $ip === '0.0.0.0' || $ip === '127.0.0.1') {
                return false;
            }
            if (strpos($ip, '169.254.') === 0) {
                return false;
            }
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false;
        }

        /**
         * IPv6 校验（排除 loopback）
         */
        private static function is_valid_ipv6($ip)
        {
            if ($ip === '' || $ip === '::1') {
                return false;
            }
            return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false;
        }

        /**
         * 提取 v2 上传里的设备数据。兼容 data 字符串、data 对象、device_data 对象。
         */
        private static function extract_device_data_from_request($request)
        {
            $data = null;
            if ($request instanceof WP_REST_Request) {
                $json_params = $request->get_json_params();
                if (is_array($json_params)) {
                    if (array_key_exists('data', $json_params)) {
                        $data = $json_params['data'];
                    } elseif (array_key_exists('device_data', $json_params)) {
                        $data = $json_params['device_data'];
                    } elseif (isset($json_params['uuid']) || isset($json_params['collector'])) {
                        $data = $json_params;
                    }
                }

                if ($data === null) {
                    $data = $request->get_param('data');
                }
            } elseif (is_array($request)) {
                $data = isset($request['data']) ? $request['data'] : null;
            }

            if (is_string($data)) {
                $data = wp_unslash($data);
                $decoded = json_decode($data, true);
                return is_array($decoded) ? $decoded : array();
            }

            if (is_object($data)) {
                $data = json_decode(wp_json_encode($data), true);
            }

            return is_array($data) ? $data : array();
        }

        /**
         * 提取/生成 v2 稳定设备标识。第一阶段只作为辅助匹配，不替代 uuid 列。
         */
        private static function derive_stable_device_id_v2($data_obj, $request = null)
        {
            $candidates = array();
            if ($request instanceof WP_REST_Request) {
                $candidates[] = $request->get_param('stable_device_id_v2');
                $candidates[] = $request->get_param('device_fingerprint');
            }

            if (is_object($data_obj)) {
                $data_obj = (array) $data_obj;
            }

            if (is_array($data_obj)) {
                $candidates[] = isset($data_obj['stable_device_id_v2']) ? $data_obj['stable_device_id_v2'] : '';
                $candidates[] = isset($data_obj['device_fingerprint']) ? $data_obj['device_fingerprint'] : '';
                if (isset($data_obj['_magick_device']) && is_array($data_obj['_magick_device'])) {
                    $candidates[] = isset($data_obj['_magick_device']['stable_device_id_v2']) ? $data_obj['_magick_device']['stable_device_id_v2'] : '';
                }
            }

            foreach ($candidates as $candidate) {
                if (is_string($candidate) && trim($candidate) !== '') {
                    return sanitize_text_field($candidate);
                }
            }

            $source = self::build_device_fingerprint_source($data_obj);
            if (!self::has_device_fingerprint_source($source)) {
                return '';
            }

            return 'v2:' . hash('sha256', wp_json_encode($source));
        }

        /**
         * 构建 v2 fingerprint 的输入，不参与旧 uuid 列。
         */
        private static function build_device_fingerprint_source($data_obj)
        {
            if (is_object($data_obj)) {
                $data_obj = (array) $data_obj;
            }
            if (!is_array($data_obj)) {
                return array();
            }

            $uuid_data = isset($data_obj['uuid']) && is_array($data_obj['uuid']) ? $data_obj['uuid'] : array();
            $macs = isset($uuid_data['macs']) && is_array($uuid_data['macs']) ? $uuid_data['macs'] : array();
            $normalized_macs = array();
            foreach ($macs as $mac) {
                if (!is_string($mac)) {
                    continue;
                }
                $mac = strtolower(trim($mac));
                if ($mac === '' || $mac === '00:00:00:00:00:00') {
                    continue;
                }
                $normalized_macs[] = $mac;
            }
            sort($normalized_macs);

            return array(
                'hardware' => isset($uuid_data['hardware']) ? (string) $uuid_data['hardware'] : '',
                'system_uuid' => isset($data_obj['system']['uuid']) ? (string) $data_obj['system']['uuid'] : '',
                'system_serial' => isset($data_obj['system']['serial']) ? (string) $data_obj['system']['serial'] : '',
                'baseboard_serial' => isset($data_obj['baseboard']['serial']) ? (string) $data_obj['baseboard']['serial'] : '',
                'macs' => $normalized_macs,
            );
        }

        /**
         * 判断 fingerprint 输入是否至少包含一个有效硬件信号。
         */
        private static function has_device_fingerprint_source($source)
        {
            if (!is_array($source)) {
                return false;
            }
            foreach ($source as $value) {
                if (is_array($value) && !empty($value)) {
                    return true;
                }
                if (is_string($value) && trim($value) !== '') {
                    return true;
                }
            }
            return false;
        }

        /**
         * 提取采集器元数据。
         */
        private static function extract_collector_metadata($data_obj, $request = null)
        {
            $collector = array();
            if (is_object($data_obj)) {
                $data_obj = (array) $data_obj;
            }
            if (is_array($data_obj) && isset($data_obj['collector']) && is_array($data_obj['collector'])) {
                $collector = $data_obj['collector'];
            }
            if ($request instanceof WP_REST_Request) {
                $request_collector = $request->get_param('collector');
                if (is_array($request_collector)) {
                    $collector = array_merge($collector, $request_collector);
                }
            }

            $sanitized = array();
            foreach ($collector as $key => $value) {
                if (is_scalar($value)) {
                    $sanitized[sanitize_key($key)] = sanitize_text_field((string) $value);
                }
            }
            return $sanitized;
        }

        /**
         * 写入迁移元数据到 data JSON 内，避免第一阶段 ALTER 生产表。
         */
        private static function attach_device_migration_meta($data_obj, $legacy_uuid, $stable_id, $collector, $source)
        {
            if (is_object($data_obj)) {
                $data_obj = json_decode(wp_json_encode($data_obj), true);
            }
            if (!is_array($data_obj)) {
                $data_obj = array();
            }

            $existing = isset($data_obj['_magick_device']) && is_array($data_obj['_magick_device'])
                ? $data_obj['_magick_device']
                : array();

            $data_obj['_magick_device'] = array_merge($existing, array(
                'schema_version' => 2,
                'legacy_uuid' => sanitize_text_field($legacy_uuid),
                'stable_device_id_v2' => sanitize_text_field($stable_id),
                'collector' => $collector,
                'migration_source' => sanitize_text_field($source),
                'migration_updated_at' => current_time('mysql'),
            ));

            return $data_obj;
        }

        /**
         * 从设备数据中取 IP，失败时回退 127.0.0.1。
         */
        private static function device_ip_or_default($data_obj)
        {
            $device_ip = self::extract_valid_ip($data_obj);
            return $device_ip !== '' ? $device_ip : '127.0.0.1';
        }

        /**
         * 用 data JSON 内的 v2 stable id 查找设备。
         */
        private static function find_pc_by_stable_device_id($stable_id)
        {
            global $wpdb;
            $stable_id = sanitize_text_field((string) $stable_id);
            if ($stable_id === '') {
                return null;
            }

            $table = self::$table_name;
            $like = '%' . $wpdb->esc_like($stable_id) . '%';
            $rows = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table WHERE data LIKE %s LIMIT 20", $like),
                ARRAY_A
            );

            if (empty($rows)) {
                return null;
            }

            foreach ($rows as $row) {
                $data = self::decode_json_field(isset($row['data']) ? $row['data'] : null);
                $row_stable = isset($data['_magick_device']['stable_device_id_v2'])
                    ? (string) $data['_magick_device']['stable_device_id_v2']
                    : '';
                if ($row_stable === $stable_id) {
                    return $row;
                }
            }

            return null;
        }


        /**
         * 检查数据库中是否存在指定 UUID 的数据
         * @param string $uuid 要检查的 UUID
         * @return array|null 返回关联数组表示数据库中找到的数据行，如果未找到则返回 null
         */
        private static function check_data_repeat(string $uuid): ?array
        {
            global $wpdb;

            $table = self::$table_name;

            // 准备 SQL 查询语句
            $sql = $wpdb->prepare("SELECT * FROM $table WHERE uuid = %s", $uuid);

            // 执行查询
            $result = $wpdb->get_row($sql, ARRAY_A);

            // 检查是否查询成功
            if ($result === null) {
                // 查询失败或未找到匹配数据
                return null;
            }

            // 查询成功，返回结果
            return $result;
        }



        /**
         * 更新现有数据
         * @param $existingData 查出的数据
         * @param $data 设备JSON字符串数据
         * @param $name 用户名
         * @return bool
         */
        public static function check_Data_Change($existingData, $data, $name)
        {
            global $wpdb;
            //TODO: 如果名称或数据有变化，更新现有数据
            try {
                $result = $wpdb->update(
                    self::$table_name,
                    [
                        //'name' => $name,//不更新名字
                        'data' => $data,
                    ],
                    ['id' => $existingData['id']],
                    ['%s'],
                    ['%d']
                );

                if ($result !== false) {
                    self::clear_pc_cache();
                    //姓名
                    $user = $existingData['name'];
                    //编号
                    $number = $existingData['number'];
                    return wp_send_json_success(
                        [
                            'message' => "姓名：$user ，编号：$number ，更新成功",
                            'data' => $result,

                        ]
                    );
                } else {
                    throw new Exception('更新失败');
                }
            } catch (Exception $e) {
                return wp_send_json_error(['error' => $e->getMessage(), 'message' => $wpdb->last_error], 500);
            }


            wp_die();
        }

        /**
         * 管理端 REST 权限校验
         */
        public static function admin_permissions_check()
        {
            if (!current_user_can('manage_options')) {
                return new WP_Error('forbidden', '权限不足：需要管理员权限', array('status' => 403));
            }
            return true;
        }

        /**
         * 公共接口 - 读取密码（header 或参数）
         */
        private static function get_public_password($request)
        {
            $password = '';
            $source = 'none';
            $raw_body_len = 0;
            $content_type = '';
            $content_length = '';
            $route = '';
            if ($request instanceof WP_REST_Request) {
                $content_type = $request->get_header('content-type');
                $content_length = $request->get_header('content-length');
                $route = $request->get_route();
                $password = $request->get_header('x-npcink-password');
                if ($password === '' || $password === null) {
                    $password = $request->get_param('password');
                    if ($password !== '' && $password !== null) {
                        $source = 'param';
                    }
                } else {
                    $source = 'header';
                }
                if ($password === '' || $password === null) {
                    $json_params = $request->get_json_params();
                    if (is_array($json_params) && array_key_exists('password', $json_params)) {
                        $password = $json_params['password'];
                        $source = 'json';
                    }
                }
                if ($password === '' || $password === null) {
                    $body_params = $request->get_body_params();
                    if (is_array($body_params) && array_key_exists('password', $body_params)) {
                        $password = $body_params['password'];
                        $source = 'body';
                    }
                }
                if ($password === '' || $password === null) {
                    $raw_body = $request->get_body();
                    $raw_body_len = !empty($raw_body) ? strlen($raw_body) : 0;
                    if (!empty($raw_body)) {
                        $decoded = json_decode($raw_body, true);
                        if (is_array($decoded) && array_key_exists('password', $decoded)) {
                            $password = $decoded['password'];
                            $source = 'raw_json';
                        } else {
                            $parsed = array();
                            parse_str($raw_body, $parsed);
                            if (is_array($parsed) && array_key_exists('password', $parsed)) {
                                $password = $parsed['password'];
                                $source = 'raw_form';
                            }
                        }
                    }
                }
            } elseif (is_array($request)) {
                $password = isset($request['password']) ? $request['password'] : '';
                if ($password !== '') {
                    $source = 'array';
                }
            }

            if (($password === '' || $password === null) && isset($_REQUEST['password'])) {
                $password = $_REQUEST['password'];
                if ($password !== '') {
                    $source = 'request';
                }
            }

            if (is_array($password) || is_object($password)) {
                $password = '';
            } elseif (!is_string($password)) {
                $password = strval($password);
            } else {
                $password = (string) $password;
            }

            if (!is_string($password)) {
                $password = '';
            }

            $password = wp_unslash($password);
            return sanitize_text_field($password);
        }

        /**
         * 获取客户端 IP
         */
        private static function get_client_ip()
        {
            $ip = '';
            if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
                $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
                $ip = trim($parts[0]);
            } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
                $ip = trim($_SERVER['HTTP_CLIENT_IP']);
            } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
                $ip = trim($_SERVER['REMOTE_ADDR']);
            }

            if (!filter_var($ip, FILTER_VALIDATE_IP)) {
                return 'unknown';
            }

            return $ip;
        }

        /**
         * 从请求中提取 UUID（上传请求可解析 data）
         */
        private static function extract_uuid_from_request($request)
        {
            $uuid = '';
            $data = null;

            if ($request instanceof WP_REST_Request) {
                $uuid = $request->get_param('uuid');
                $data = $request->get_param('data');
            } elseif (is_array($request)) {
                $uuid = isset($request['uuid']) ? $request['uuid'] : '';
                $data = isset($request['data']) ? $request['data'] : null;
            }

            if (is_string($uuid) && $uuid !== '') {
                return sanitize_text_field($uuid);
            }

            if (is_string($data)) {
                $decoded = json_decode($data, true);
                if (is_array($decoded)) {
                    $uuid = self::derive_uuid_from_data($decoded);
                }
            } elseif (is_array($data) || is_object($data)) {
                $uuid = self::derive_uuid_from_data($data);
            }

            return $uuid ? sanitize_text_field((string) $uuid) : '';
        }

        /**
         * 从设备数据中计算 UUID
         */
        private static function derive_uuid_from_data($data_obj)
        {
            if (is_object($data_obj)) {
                $data_obj = (array) $data_obj;
            }
            if (!is_array($data_obj)) {
                return '';
            }

            if (!empty($data_obj['uuid']) && is_string($data_obj['uuid'])) {
                return $data_obj['uuid'];
            }

            $uuid_data = isset($data_obj['uuid']) && is_array($data_obj['uuid']) ? $data_obj['uuid'] : array();
            $hardware = isset($uuid_data['hardware']) ? (string) $uuid_data['hardware'] : '';
            $macs = isset($uuid_data['macs']) && is_array($uuid_data['macs']) ? $uuid_data['macs'] : array();
            $mac = !empty($macs[0]) ? (string) $macs[0] : '';

            if ($hardware !== '' && $mac !== '') {
                return md5($hardware . $mac);
            }

            return '';
        }

        /**
         * 公共接口限流配置
         */
        private static function get_rate_limit_settings()
        {
            return array(
                'max_attempts' => 8,
                'window' => 10 * MINUTE_IN_SECONDS,
            );
        }

        /**
         * 获取限流缓存键
         */
        private static function get_rate_limit_key($request)
        {
            $ip = self::get_client_ip();
            $uuid = self::extract_uuid_from_request($request);
            if ($uuid === '') {
                $uuid = 'no-uuid';
            }
            $route = $request instanceof WP_REST_Request ? $request->get_route() : '';
            return self::get_cache_key('public_rate_' . md5($ip . '|' . $uuid . '|' . $route));
        }

        /**
         * 获取限流状态
         */
        private static function get_rate_limit_state($request)
        {
            $settings = self::get_rate_limit_settings();
            $key = self::get_rate_limit_key($request);
            $state = get_transient($key);
            if (!is_array($state)) {
                return array('blocked' => false, 'retry_after' => 0);
            }

            $now = time();
            $start = isset($state['start']) ? intval($state['start']) : 0;
            $count = isset($state['count']) ? intval($state['count']) : 0;

            if ($start <= 0 || ($now - $start) > $settings['window']) {
                delete_transient($key);
                return array('blocked' => false, 'retry_after' => 0);
            }

            $blocked = $count >= $settings['max_attempts'];
            $retry_after = max(0, $settings['window'] - ($now - $start));

            return array(
                'blocked' => $blocked,
                'retry_after' => $retry_after,
            );
        }

        /**
         * 记录一次失败
         */
        private static function register_rate_limit_failure($request)
        {
            $settings = self::get_rate_limit_settings();
            $key = self::get_rate_limit_key($request);
            $state = get_transient($key);
            $now = time();

            if (!is_array($state) || !isset($state['start']) || ($now - intval($state['start'])) > $settings['window']) {
                $state = array(
                    'count' => 0,
                    'start' => $now,
                );
            }

            $state['count'] = intval($state['count']) + 1;
            set_transient($key, $state, $settings['window']);
        }

        /**
         * 清理限流状态
         */
        private static function clear_rate_limit($request)
        {
            $key = self::get_rate_limit_key($request);
            delete_transient($key);
        }

        /**
         * 公共接口 - 密码校验
         */
        public static function public_permissions_check($request)
        {
            $rate_state = self::get_rate_limit_state($request);
            if (!empty($rate_state['blocked'])) {
                return new WP_Error('rate_limited', '请求过于频繁，请稍后再试', array(
                    'status' => 429,
                    'retry_after' => $rate_state['retry_after'],
                ));
            }

            $password = self::get_public_password($request);
            if ($password === '') {
                self::register_rate_limit_failure($request);
                return new WP_Error('missing_password', '请填写客户端传输数据用的验证密码', array('status' => 403));
            }
            if (!self::password_verification($password)) {
                self::register_rate_limit_failure($request);
                return new WP_Error('invalid_password', '密码验证失败，请检查！', array('status' => 403));
            }

            self::clear_rate_limit($request);
            return true;
        }

        /**
         * 注册管理端 REST 接口
         */
        public static function create_admin_endpoints()
        {
            register_rest_route('npcink/v1', '/admin/pc', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_pc_list'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/pc/(?P<uuid>[A-Za-z0-9\\-]+)', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_pc'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::EDITABLE,
                    'callback' => array(__CLASS__, 'admin_update_pc'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::DELETABLE,
                    'callback' => array(__CLASS__, 'admin_delete_pc'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/pc-categories', array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array(__CLASS__, 'admin_get_pc_categories'),
                'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
            ));

            register_rest_route('npcink/v1', '/admin/style', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_style_list'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'admin_create_style'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/style/(?P<uuid>[A-Za-z0-9\\-]+)', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_style'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::EDITABLE,
                    'callback' => array(__CLASS__, 'admin_update_style'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::DELETABLE,
                    'callback' => array(__CLASS__, 'admin_delete_style'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/style-categories', array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array(__CLASS__, 'admin_get_style_categories'),
                'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
            ));

            register_rest_route('npcink/v1', '/admin/pc-summary', array(
                'methods' => WP_REST_Server::READABLE,
                'callback' => array(__CLASS__, 'admin_get_pc_summary'),
                'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
            ));

            register_rest_route('npcink/v1', '/admin/pc-migration/phase1', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_pc_migration_phase1_precheck'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'admin_pc_migration_phase1_apply'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/settings', array(
                array(
                    'methods' => WP_REST_Server::EDITABLE,
                    'callback' => array(__CLASS__, 'admin_update_settings'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/export', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_export_data'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/import', array(
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'admin_import_data'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/public-search-page', array(
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'admin_create_public_search_page'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/changes/manual', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_manual_changes'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
                array(
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => array(__CLASS__, 'admin_create_manual_change'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/changes/manual/(?P<id>\\d+)', array(
                array(
                    'methods' => WP_REST_Server::EDITABLE,
                    'callback' => array(__CLASS__, 'admin_update_manual_change'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));

            register_rest_route('npcink/v1', '/admin/changes/auto', array(
                array(
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => array(__CLASS__, 'admin_get_auto_changes'),
                    'permission_callback' => array(__CLASS__, 'admin_permissions_check'),
                ),
            ));
        }

        /**
         * 判断是否为 MAC 地址搜索
         */
        private static function is_mac_search($value)
        {
            return (bool) preg_match('/^([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})$/', $value);
        }

        /**
         * 安全解析 JSON 字段
         */
        private static function decode_json_field($raw)
        {
            if (empty($raw)) {
                return array();
            }
            if (is_array($raw)) {
                return $raw;
            }
            $decoded = json_decode($raw, true);
            return is_array($decoded) ? $decoded : array();
        }

        /**
         * 字节格式化
         */
        private static function format_bytes($bytes)
        {
            $size = floatval($bytes);
            if ($size <= 0) {
                return '0';
            }

            $units = array('B', 'KB', 'MB', 'GB', 'TB', 'PB');
            $unit_index = 0;
            while ($size >= 1024 && $unit_index < count($units) - 1) {
                $size /= 1024;
                $unit_index++;
            }

            if ($unit_index <= 1) {
                return strval(round($size)) . ' ' . $units[$unit_index];
            }

            $rounded = round($size, 1);
            if (intval($rounded) == $rounded) {
                $rounded = intval($rounded);
            }
            return strval($rounded) . ' ' . $units[$unit_index];
        }

        /**
         * MB 格式化
         */
        private static function format_mb($mb)
        {
            $size = floatval($mb);
            if ($size <= 0) {
                return '0';
            }

            $units = array('MB', 'GB', 'TB');
            $unit_index = 0;
            while ($size >= 1024 && $unit_index < count($units) - 1) {
                $size /= 1024;
                $unit_index++;
            }

            $rounded = round($size, 1);
            if (intval($rounded) == $rounded) {
                $rounded = intval($rounded);
            }
            return strval($rounded) . ' ' . $units[$unit_index];
        }

        /**
         * 求数组 size 字段总和并格式化
         */
        private static function sum_sizes($items)
        {
            if (!is_array($items)) {
                return self::format_bytes(0);
            }
            $total = 0;
            foreach ($items as $item) {
                if (is_array($item) && isset($item['size'])) {
                    $total += floatval($item['size']);
                }
            }
            return self::format_bytes($total);
        }

        /**
         * 简单字符串替换（按值包含匹配）
         */
        private static function replace_string($input, $pairs)
        {
            if (!is_string($input) || $input === '') {
                return '未收录';
            }

            $labels = array();
            foreach ($pairs as $pair) {
                if (isset($pair['value']) && strpos($input, $pair['value']) !== false) {
                    $labels[] = $pair['label'];
                }
            }

            if (empty($labels)) {
                return '未收录';
            }

            return implode(', ', $labels);
        }

        /**
         * 移除指定子串
         */
        private static function remove_substring($input, $patterns)
        {
            if (!is_string($input) || $input === '') {
                return $input;
            }
            if (empty($patterns)) {
                return trim($input);
            }
            $regex = '/' . implode('|', $patterns) . '/i';
            return trim(preg_replace($regex, '', $input));
        }

        /**
         * 处理显卡列表，按显存排序输出字符串数组
         */
        private static function handle_graphics($controllers, $exclude)
        {
            if (!is_array($controllers)) {
                return array();
            }

            $filtered = array_filter($controllers, function ($item) use ($exclude) {
                $model = is_array($item) && isset($item['model']) ? $item['model'] : '';
                if ($model === '') {
                    return false;
                }
                foreach ($exclude as $str) {
                    if (strpos($model, $str) !== false) {
                        return false;
                    }
                }
                return true;
            });

            usort($filtered, function ($a, $b) {
                $vram_a = isset($a['vram']) ? floatval($a['vram']) : 0;
                $vram_b = isset($b['vram']) ? floatval($b['vram']) : 0;
                if ($vram_a == $vram_b) {
                    return 0;
                }
                return ($vram_a < $vram_b) ? 1 : -1;
            });

            $values = array();
            foreach ($filtered as $item) {
                $model = isset($item['model']) ? $item['model'] : '';
                if ($model === '') {
                    continue;
                }
                $vram = isset($item['vram']) ? self::format_mb($item['vram']) : '';
                $values[] = trim($model . ' ' . $vram);
            }
            return $values;
        }

        /**
         * 生成电脑设备列表摘要
         */
        private static function build_pc_summary($data)
        {
            $os_replace = array(
                array('value' => 'Windows', 'label' => 'Windows'),
                array('value' => 'darwin', 'label' => 'Mac'),
                array('value' => 'linux', 'label' => 'linux'),
            );
            $os_type_replace = array(
                array('value' => 'Windows 11', 'label' => 'Windows 11'),
                array('value' => 'Windows 10', 'label' => 'Windows 10'),
                array('value' => 'macOS', 'label' => 'Apple'),
                array('value' => 'linux', 'label' => 'Linux'),
            );
            $exclude_graphics = array(
                'Parsec Virtual Display Adapter',
                'OrayIddDriver Device',
                'System Product Name',
                'OrayIddDriver Device',
                'Virtual Display Device',
            );
            $graphics_replace = array(
                'NVIDIA GeForce',
                'Intel\\(R\\)',
                '\\(MS-7D48\\)',
                '\\(MS-7D46\\)',
                'with Radeon Graphics',
            );

            $memory = self::sum_sizes(isset($data['memLayout']) ? $data['memLayout'] : array());
            $disk = self::sum_sizes(isset($data['diskLayout']) ? $data['diskLayout'] : array());

            $motherboard = isset($data['baseboard']['model']) && $data['baseboard']['model'] !== ''
                ? self::remove_substring($data['baseboard']['model'], $graphics_replace)
                : '暂无主板型号';

            $cpu_model = isset($data['cpu']['brand']) && $data['cpu']['brand'] !== ''
                ? self::remove_substring($data['cpu']['brand'], $graphics_replace)
                : '暂无 CPU 型号';

            $graphics_list = self::handle_graphics(
                isset($data['graphics']['controllers']) ? $data['graphics']['controllers'] : array(),
                $exclude_graphics
            );
            $graphics_value = !empty($graphics_list) ? $graphics_list[0] : '';
            $graphics = $graphics_value !== ''
                ? self::remove_substring($graphics_value, $graphics_replace)
                : '暂无显卡型号';

            $meat = array(
                'os' => self::replace_string(isset($data['os']['distro']) ? $data['os']['distro'] : '', $os_type_replace),
                'ostype' => self::replace_string(isset($data['os']['platform']) ? $data['os']['platform'] : '', $os_replace),
                'cpu' => isset($data['cpu']['manufacturer']) && $data['cpu']['manufacturer'] !== '' ? $data['cpu']['manufacturer'] : '暂无 CPU 品牌',
                'cpuModel' => $cpu_model,
                'motherboard' => $motherboard,
                'graphics' => $graphics,
                'memory' => $memory,
                'disk' => $disk,
            );

            $macs = array();
            if (isset($data['uuid']['macs']) && is_array($data['uuid']['macs'])) {
                $macs = $data['uuid']['macs'];
            }

            return array(
                'meat' => $meat,
                'mac' => $macs,
            );
        }

        /**
         * 管理端 - 查询电脑设备列表（分页/筛选/搜索）
         */
        public static function admin_get_pc_list($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            $page = max(1, intval($request->get_param('page') ?: 1));
            $per_page = intval($request->get_param('per_page') ?: 20);
            $per_page = max(1, min(100, $per_page));
            $offset = ($page - 1) * $per_page;

            $fields = sanitize_text_field((string) $request->get_param('fields'));
            $fields = ($fields === 'summary') ? 'summary' : 'full';

            $search = sanitize_text_field((string) $request->get_param('search'));
            $search = trim($search);
            $state = sanitize_text_field((string) $request->get_param('state'));
            $department = sanitize_text_field((string) $request->get_param('department'));

            $orderby = sanitize_text_field((string) $request->get_param('orderby'));
            $order = strtoupper((string) $request->get_param('order')) === 'ASC' ? 'ASC' : 'DESC';
            $allowed_orderby = array('id', 'created_at', 'updated_at', 'name', 'number');
            if (!in_array($orderby, $allowed_orderby, true)) {
                $orderby = 'id';
            }

            $where = array();
            $params = array();

            if (!empty($state) && $state !== 'all') {
                $where[] = 'state = %s';
                $params[] = $state;
            }

            if (!empty($department) && $department !== 'all') {
                $where[] = 'department = %s';
                $params[] = $department;
            }

            if ($search !== '') {
                $like = '%' . $wpdb->esc_like($search) . '%';
                $search_where = array(
                    'name LIKE %s',
                    'number LIKE %s',
                    'ip LIKE %s',
                );
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;

                if (self::is_mac_search($search)) {
                    $mac_colon = str_replace('-', ':', strtolower($search));
                    $mac_dash = str_replace(':', '-', strtolower($search));
                    $search_where[] = 'data LIKE %s';
                    $params[] = '%' . $wpdb->esc_like($mac_colon) . '%';
                    if ($mac_dash !== $mac_colon) {
                        $search_where[] = 'data LIKE %s';
                        $params[] = '%' . $wpdb->esc_like($mac_dash) . '%';
                    }
                }

                $where[] = '(' . implode(' OR ', $search_where) . ')';
            }

            $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $total_sql = "SELECT COUNT(*) FROM $table_name $where_sql";
            $total = $params ? $wpdb->get_var($wpdb->prepare($total_sql, $params)) : $wpdb->get_var($total_sql);

            $query_sql = "SELECT id, name, number, state, department, purchase, depreciation, ip, created_at, updated_at, uuid, data
                FROM $table_name
                $where_sql
                ORDER BY $orderby $order
                LIMIT %d OFFSET %d";

            $query_params = array_merge($params, array($per_page, $offset));
            $items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

            if (!empty($items)) {
                foreach ($items as &$item) {
                    $decoded = self::decode_json_field(isset($item['data']) ? $item['data'] : null);
                    if ($fields === 'summary') {
                        $summary = self::build_pc_summary($decoded);
                        $item['meat'] = $summary['meat'];
                        $item['mac'] = $summary['mac'];
                        unset($item['data']);
                    } else {
                        $item['data'] = $decoded;
                    }
                }
                unset($item);
            }

            $payload = array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
            );
            $last_modified = self::extract_latest_timestamp($items, array('updated_at', 'created_at'));
            return self::rest_response_with_cache($request, $payload, $last_modified);
        }

        /**
         * 管理端 - 查询单个电脑设备
         */
        public static function admin_get_pc($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;
            $uuid = sanitize_text_field((string) $request['uuid']);
            $fields = sanitize_text_field((string) $request->get_param('fields'));
            $fields = ($fields === 'summary') ? 'summary' : 'full';

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '获取设备失败：缺少设备UUID', array('status' => 400));
            }

            if ($fields === 'summary') {
                $row = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT id, name, number, state, department, purchase, depreciation, ip, created_at, updated_at, uuid
                         FROM $table_name WHERE uuid = %s",
                        $uuid
                    ),
                    ARRAY_A
                );
            } else {
                $row = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                    ARRAY_A
                );
            }

            if (empty($row)) {
                return new WP_Error('not_found', '获取设备失败：设备不存在或已删除', array('status' => 404));
            }

            if ($fields === 'full') {
                $row['data'] = self::decode_json_field(isset($row['data']) ? $row['data'] : null);
            }

            $last_modified = self::extract_latest_timestamp(array($row), array('updated_at', 'created_at'));
            return self::rest_response_with_cache($request, $row, $last_modified);
        }

        /**
         * 管理端 - 更新电脑设备信息
         */
        public static function admin_update_pc($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '保存设备失败：缺少设备UUID', array('status' => 400));
            }

            $device_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE uuid = %s",
                $uuid
            ));

            if ($device_exists == 0) {
                return new WP_Error('not_found', '保存设备失败：设备不存在或已删除', array('status' => 404));
            }

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '保存设备失败：提交数据为空', array('status' => 400));
            }

            $field_map = array(
                'name' => 'name',
                'number' => 'number',
                'state' => 'state',
                'department' => 'department',
                'purchase' => 'purchase',
                'depreciation' => 'depreciation',
                'ip' => 'ip',
            );

            $update_data = array();
            $update_format = array();

            foreach ($json_data as $key => $value) {
                if (!array_key_exists($key, $field_map)) {
                    continue;
                }

                if (in_array($key, array('purchase', 'depreciation'), true)) {
                    $update_data[$field_map[$key]] = floatval($value);
                    $update_format[] = '%f';
                } else {
                    $update_data[$field_map[$key]] = sanitize_text_field($value);
                    $update_format[] = '%s';
                }
            }

            if (empty($update_data)) {
                return new WP_Error('invalid_fields', '保存设备失败：没有可更新的字段', array('status' => 400));
            }

            if (isset($update_data['number'])) {
                $number_exists = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $table_name WHERE number = %s AND uuid != %s",
                    $update_data['number'],
                    $uuid
                ));
                if ($number_exists > 0) {
                    return new WP_Error('duplicate_number', '保存设备失败：设备编号已存在', array('status' => 409));
                }
            }

            $result = $wpdb->update(
                $table_name,
                $update_data,
                array('uuid' => $uuid),
                $update_format,
                array('%s')
            );

            if ($result === false) {
                return new WP_Error('update_failed', '保存设备失败：数据库更新失败', array('status' => 500));
            }

            self::clear_pc_cache();

            return rest_ensure_response(array(
                'success' => true,
                'message' => '设备信息已保存',
                'updated_fields' => array_keys($update_data),
            ));
        }

        /**
         * 管理端 - 删除电脑设备信息
         */
        public static function admin_delete_pc($request)
        {
            global $wpdb;
            $data_name = $wpdb->prefix . self::$table_pc_name;
            $change_name = $wpdb->prefix . self::$table_manual_name;
            $auto_name = $wpdb->prefix . self::$table_auto_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '删除设备失败：缺少设备UUID', array('status' => 400));
            }

            $wpdb->query('START TRANSACTION');

            try {
                $sql = $wpdb->prepare("DELETE FROM $data_name WHERE uuid = %s", $uuid);
                $sql_change = $wpdb->prepare("DELETE FROM $change_name WHERE record_uuid = %s", $uuid);
                $sql_auto = $wpdb->prepare("DELETE FROM $auto_name WHERE record_uuid = %s", $uuid);

                $result = $wpdb->query($sql);
                $result_change = $wpdb->query($sql_change);
                $result_auto = $wpdb->query($sql_auto);

                if ($result === false || $result_change === false || $result_auto === false) {
                    throw new Exception('删除数据时发生错误: ' . $wpdb->last_error);
                }

                $wpdb->query('COMMIT');
                self::clear_pc_cache();
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => '设备已删除',
                ));
            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                return new WP_Error('delete_failed', '删除设备失败：数据库操作失败', array(
                    'status' => 500,
                    'detail' => $e->getMessage(),
                ));
            }
        }

        /**
         * 管理端 - Rust/v2 迁移预检
         */
        public static function admin_pc_migration_phase1_precheck($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;
            $limit = max(1, min(500, intval($request->get_param('limit') ?: 500)));
            $offset = max(0, intval($request->get_param('offset') ?: 0));

            $total = intval($wpdb->get_var("SELECT COUNT(*) FROM $table_name"));
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT id, name, number, uuid, ip, updated_at, data FROM $table_name ORDER BY id ASC LIMIT %d OFFSET %d",
                    $limit,
                    $offset
                ),
                ARRAY_A
            );

            $items = array();
            $stable_counts = array();
            foreach ($rows as $row) {
                $item = self::build_pc_migration_phase1_item($row);
                if (!empty($item['stable_device_id_v2'])) {
                    if (!isset($stable_counts[$item['stable_device_id_v2']])) {
                        $stable_counts[$item['stable_device_id_v2']] = 0;
                    }
                    $stable_counts[$item['stable_device_id_v2']]++;
                }
                $items[] = $item;
            }

            foreach ($items as &$item) {
                if (!empty($item['stable_device_id_v2']) && $stable_counts[$item['stable_device_id_v2']] > 1) {
                    $item['status'] = 'needs_review';
                    $item['issues'][] = 'stable_device_id_v2 重复';
                }
            }
            unset($item);

            return rest_ensure_response(self::summarize_pc_migration_phase1($items, array(
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'mode' => 'precheck',
            )));
        }

        /**
         * 管理端 - Rust/v2 迁移执行
         */
        public static function admin_pc_migration_phase1_apply($request)
        {
            global $wpdb;
            $confirm = $request->get_param('confirm');
            if (!in_array(strtolower((string) $confirm), array('1', 'true', 'yes'), true)) {
                return new WP_Error('missing_confirm', '执行迁移需要 confirm=true', array('status' => 400));
            }

            $table_name = $wpdb->prefix . self::$table_pc_name;
            $limit = max(1, min(500, intval($request->get_param('limit') ?: 500)));
            $offset = max(0, intval($request->get_param('offset') ?: 0));
            $rows = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT id, name, number, uuid, ip, updated_at, data FROM $table_name ORDER BY id ASC LIMIT %d OFFSET %d",
                    $limit,
                    $offset
                ),
                ARRAY_A
            );

            $items = array();
            $updated = 0;
            $skipped = 0;
            $failed = 0;

            $wpdb->query('START TRANSACTION');
            try {
                foreach ($rows as $row) {
                    $item = self::build_pc_migration_phase1_item($row);
                    $data = self::decode_json_field(isset($row['data']) ? $row['data'] : null);

                    if (empty($data) || empty($item['legacy_uuid'])) {
                        $item['apply_status'] = 'skipped';
                        $item['issues'][] = '缺少可迁移数据';
                        $skipped++;
                        $items[] = $item;
                        continue;
                    }

                    $data = self::attach_device_migration_meta(
                        $data,
                        $item['legacy_uuid'],
                        $item['stable_device_id_v2'],
                        isset($data['collector']) && is_array($data['collector']) ? $data['collector'] : array(),
                        'admin_phase1_migration'
                    );
                    $data_json = wp_json_encode($data, JSON_UNESCAPED_UNICODE);
                    if ($data_json === false) {
                        $item['apply_status'] = 'failed';
                        $item['issues'][] = 'JSON 编码失败';
                        $failed++;
                        $items[] = $item;
                        continue;
                    }

                    $result = $wpdb->update(
                        $table_name,
                        array('data' => $data_json),
                        array('id' => intval($row['id'])),
                        array('%s'),
                        array('%d')
                    );

                    if ($result === false) {
                        $item['apply_status'] = 'failed';
                        $item['issues'][] = '数据库更新失败：' . $wpdb->last_error;
                        $failed++;
                    } else {
                        $item['apply_status'] = $result === 0 ? 'unchanged' : 'updated';
                        $updated += $result === 0 ? 0 : 1;
                    }

                    $items[] = $item;
                }

                if ($failed > 0) {
                    throw new Exception('迁移中存在数据库或编码失败记录');
                }

                $wpdb->query('COMMIT');
            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                return new WP_Error('migration_failed', '迁移执行失败，已回滚', array(
                    'status' => 500,
                    'detail' => $e->getMessage(),
                    'items' => $items,
                ));
            }

            self::clear_pc_cache();
            $payload = self::summarize_pc_migration_phase1($items, array(
                'mode' => 'apply',
                'limit' => $limit,
                'offset' => $offset,
                'updated' => $updated,
                'skipped' => $skipped,
                'failed' => $failed,
            ));
            $payload['message'] = 'v2 迁移元数据写入完成';
            return rest_ensure_response($payload);
        }

        /**
         * 构建单条电脑设备迁移报告。
         */
        private static function build_pc_migration_phase1_item($row)
        {
            $data = self::decode_json_field(isset($row['data']) ? $row['data'] : null);
            $legacy_uuid = self::derive_uuid_from_data($data);
            $stable_id = self::derive_stable_device_id_v2($data);
            $meta = isset($data['_magick_device']) && is_array($data['_magick_device'])
                ? $data['_magick_device']
                : array();
            $issues = array();
            $status = 'ready';

            if (empty($data)) {
                $issues[] = 'data 为空或不是合法 JSON';
                $status = 'blocked';
            }
            if ($legacy_uuid === '') {
                $issues[] = '无法从 data.uuid.hardware + data.uuid.macs[0] 计算 legacy uuid';
                $status = 'blocked';
            } elseif (!empty($row['uuid']) && $legacy_uuid !== $row['uuid']) {
                $issues[] = 'data 计算出的 legacy uuid 与数据库 uuid 不一致';
                $status = 'needs_review';
            }
            if ($stable_id === '') {
                $issues[] = '无法生成 stable_device_id_v2';
                if ($status === 'ready') {
                    $status = 'needs_review';
                }
            }
            if (!empty($meta['schema_version']) && intval($meta['schema_version']) >= 2) {
                $status = empty($issues) ? 'already_migrated' : $status;
            }

            return array(
                'id' => intval($row['id']),
                'name' => isset($row['name']) ? $row['name'] : '',
                'number' => isset($row['number']) ? $row['number'] : '',
                'uuid' => isset($row['uuid']) ? $row['uuid'] : '',
                'legacy_uuid' => $legacy_uuid,
                'stable_device_id_v2' => $stable_id,
                'migration_status' => $status,
                'status' => $status,
                'issues' => $issues,
                'has_v2_meta' => !empty($meta),
                'collector' => isset($data['collector']) && is_array($data['collector']) ? $data['collector'] : array(),
            );
        }

        /**
         * 汇总迁移报告。
         */
        private static function summarize_pc_migration_phase1($items, $extra = array())
        {
            $summary = array(
                'scanned' => count($items),
                'ready' => 0,
                'already_migrated' => 0,
                'needs_review' => 0,
                'blocked' => 0,
            );

            foreach ($items as $item) {
                $status = isset($item['status']) ? $item['status'] : 'needs_review';
                if (!isset($summary[$status])) {
                    $summary[$status] = 0;
                }
                $summary[$status]++;
            }

            return array_merge($extra, array(
                'success' => true,
                'summary' => $summary,
                'items' => $items,
            ));
        }

        /**
         * 管理端 - 获取电脑设备分类
         */
        public static function admin_get_pc_categories($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            $cache_key = self::get_cache_key('pc_categories');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return self::rest_response_with_cache($request, $cached);
            }

            $departments = $wpdb->get_results(
                "SELECT DISTINCT department FROM {$table_name} WHERE department IS NOT NULL AND department != ''"
            );
            $states = $wpdb->get_results(
                "SELECT DISTINCT state FROM {$table_name} WHERE state IS NOT NULL AND state != ''"
            );

            if ($wpdb->last_error) {
                return new WP_Error('db_error', '获取设备分类失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            $department_result = array_map(function ($item) {
                return array(
                    'value' => $item->department,
                    'label' => $item->department
                );
            }, $departments);

            $state_labels = array(
                '使用' => '使用',
                '闲置' => '闲置',
                '故障' => '故障',
                '维修' => '维修',
                '报废' => '报废'
            );

            $existing_states = array_column($states, 'state');

            $state_result = array();
            foreach ($state_labels as $value => $label) {
                $state_result[] = array(
                    'value' => $value,
                    'label' => $label
                );
            }

            foreach ($existing_states as $state) {
                if (!array_key_exists($state, $state_labels)) {
                    $state_result[] = array(
                        'value' => $state,
                        'label' => $state
                    );
                }
            }

            $response = array(
                'states' => array_values($state_result),
                'departments' => array_values($department_result),
            );

            set_transient($cache_key, $response, 5 * MINUTE_IN_SECONDS);

            return self::rest_response_with_cache($request, $response);
        }

        /**
         * 管理端 - 查询自定义设备列表（分页/筛选/搜索）
         */
        public static function admin_get_style_list($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            $page = max(1, intval($request->get_param('page') ?: 1));
            $per_page = intval($request->get_param('per_page') ?: 20);
            $per_page = max(1, min(100, $per_page));
            $offset = ($page - 1) * $per_page;

            $fields = sanitize_text_field((string) $request->get_param('fields'));
            $fields = ($fields === 'summary') ? 'summary' : 'full';

            $search = sanitize_text_field((string) $request->get_param('search'));
            $search = trim($search);
            $state = sanitize_text_field((string) $request->get_param('state'));
            $category = sanitize_text_field((string) $request->get_param('category'));
            $platform = sanitize_text_field((string) $request->get_param('platform'));
            $pay_method = sanitize_text_field((string) $request->get_param('pay_method'));

            $orderby = sanitize_text_field((string) $request->get_param('orderby'));
            $order = strtoupper((string) $request->get_param('order')) === 'ASC' ? 'ASC' : 'DESC';
            $allowed_orderby = array('id', 'created_at', 'name', 'number');
            if (!in_array($orderby, $allowed_orderby, true)) {
                $orderby = 'id';
            }

            $where = array();
            $params = array();

            if (!empty($state) && $state !== 'all') {
                $where[] = 'state = %s';
                $params[] = $state;
            }

            if (!empty($category) && $category !== 'all') {
                $where[] = 'category = %s';
                $params[] = $category;
            }

            $platform_column = self::column_exists($table_name, 'platform')
                ? 'platform'
                : "JSON_UNQUOTE(JSON_EXTRACT(data, '$.platform'))";
            $pay_method_column = self::column_exists($table_name, 'pay_method')
                ? 'pay_method'
                : "JSON_UNQUOTE(JSON_EXTRACT(data, '$.pay_method'))";

            if (!empty($platform) && $platform !== 'all') {
                $where[] = $platform_column . ' = %s';
                $params[] = $platform;
            }

            if (!empty($pay_method) && $pay_method !== 'all') {
                $where[] = $pay_method_column . ' = %s';
                $params[] = $pay_method;
            }

            if ($search !== '') {
                $like = '%' . $wpdb->esc_like($search) . '%';
                $search_where = array(
                    'name LIKE %s',
                    'number LIKE %s',
                    'purpose LIKE %s',
                    "JSON_UNQUOTE(JSON_EXTRACT(data, '$.title')) LIKE %s",
                    "JSON_UNQUOTE(JSON_EXTRACT(data, '$.order')) LIKE %s",
                    "JSON_UNQUOTE(JSON_EXTRACT(data, '$.purchaser')) LIKE %s",
                );
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $where[] = '(' . implode(' OR ', $search_where) . ')';
            }

            $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $total_sql = "SELECT COUNT(*) FROM $table_name $where_sql";
            $total = $params ? $wpdb->get_var($wpdb->prepare($total_sql, $params)) : $wpdb->get_var($total_sql);

            $query_sql = "SELECT id, name, number, state, category, purpose, created_at, uuid, data
                FROM $table_name
                $where_sql
                ORDER BY $orderby $order
                LIMIT %d OFFSET %d";

            $query_params = array_merge($params, array($per_page, $offset));
            $items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

            if (!empty($items)) {
                foreach ($items as &$item) {
                    $decoded = self::decode_json_field(isset($item['data']) ? $item['data'] : null);
                    if ($fields === 'summary') {
                        $item['data'] = array(
                            'title' => isset($decoded['title']) ? $decoded['title'] : '',
                            'total' => isset($decoded['total']) ? $decoded['total'] : 0,
                            'platform' => isset($decoded['platform']) ? $decoded['platform'] : '',
                            'pay_method' => isset($decoded['pay_method']) ? $decoded['pay_method'] : '',
                            'numbers' => isset($decoded['numbers']) ? $decoded['numbers'] : 0,
                        );
                    } else {
                        $item['data'] = $decoded;
                    }
                }
                unset($item);
            }

            $payload = array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
            );
            $last_modified = self::extract_latest_timestamp($items, array('updated_at'));
            return self::rest_response_with_cache($request, $payload, $last_modified);
        }

        /**
         * 管理端 - 查询单个自定义设备
         */
        public static function admin_get_style($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            $uuid = sanitize_text_field((string) $request['uuid']);
            $fields = sanitize_text_field((string) $request->get_param('fields'));
            $fields = ($fields === 'summary') ? 'summary' : 'full';

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '获取自定义设备失败：缺少设备UUID', array('status' => 400));
            }

            if ($fields === 'summary') {
                $row = $wpdb->get_row(
                    $wpdb->prepare(
                        "SELECT id, name, number, state, category, purpose, created_at, uuid
                         FROM $table_name WHERE uuid = %s",
                        $uuid
                    ),
                    ARRAY_A
                );
            } else {
                $row = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                    ARRAY_A
                );
            }

            if (empty($row)) {
                return new WP_Error('not_found', '获取自定义设备失败：设备不存在或已删除', array('status' => 404));
            }

            if ($fields === 'full') {
                $row['data'] = self::decode_json_field(isset($row['data']) ? $row['data'] : null);
            }

            $last_modified = self::extract_latest_timestamp(array($row), array('updated_at'));
            return self::rest_response_with_cache($request, $row, $last_modified);
        }

        /**
         * 管理端 - 新增自定义设备
         */
        public static function admin_create_style($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '添加自定义设备失败：请求数据为空', array('status' => 400));
            }

            $name = isset($json_data['name']) ? sanitize_text_field($json_data['name']) : null;
            $number = isset($json_data['number']) ? sanitize_text_field($json_data['number']) : null;
            $category = isset($json_data['category']) ? sanitize_text_field($json_data['category']) : null;
            $purpose = isset($json_data['purpose']) ? sanitize_text_field($json_data['purpose']) : null;
            $state = isset($json_data['state']) ? sanitize_text_field($json_data['state']) : null;
            $data = isset($json_data['data']) ? $json_data['data'] : null;

            if ($name === null || $number === null || $category === null || $purpose === null || $state === null || $data === null) {
                return new WP_Error('missing_params', '添加自定义设备失败：缺少必要参数', array('status' => 400));
            }

            if (!is_array($data)) {
                return new WP_Error('invalid_data', '添加自定义设备失败：data 参数格式错误', array('status' => 400));
            }

            $json = wp_json_encode($data, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                return new WP_Error('json_encode_failed', '添加自定义设备失败：data 编码失败', array('status' => 400));
            }

            $result = $wpdb->insert(
                $table_name,
                array(
                    'name' => $name,
                    'number' => $number,
                    'state' => $state,
                    'category' => $category,
                    'purpose' => $purpose,
                    'data' => $json
                ),
                array('%s', '%s', '%s', '%s', '%s', '%s')
            );

            if ($result === false) {
                return new WP_Error('insert_failed', '添加自定义设备失败：写入数据库失败', array('status' => 500));
            }

            $inserted_id = $wpdb->insert_id;
            $inserted_record = $wpdb->get_row($wpdb->prepare(
                "SELECT uuid, created_at FROM $table_name WHERE id = %d",
                $inserted_id
            ));

            if (!$inserted_record) {
                return new WP_Error('insert_failed', '添加自定义设备失败：无法获取新记录', array('status' => 500));
            }

            self::clear_style_cache();

            return rest_ensure_response(array(
                'success' => true,
                'message' => '自定义设备已添加',
                'id' => $inserted_id,
                'uuid' => $inserted_record->uuid,
                'created_at' => $inserted_record->created_at,
            ));
        }

        /**
         * 管理端 - 更新自定义设备
         */
        public static function admin_update_style($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '保存自定义设备失败：缺少设备UUID', array('status' => 400));
            }

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '保存自定义设备失败：请求数据为空', array('status' => 400));
            }

            $name = isset($json_data['name']) ? sanitize_text_field($json_data['name']) : null;
            $number = isset($json_data['number']) ? sanitize_text_field($json_data['number']) : null;
            $category = isset($json_data['category']) ? sanitize_text_field($json_data['category']) : null;
            $purpose = isset($json_data['purpose']) ? sanitize_text_field($json_data['purpose']) : null;
            $state = isset($json_data['state']) ? sanitize_text_field($json_data['state']) : null;
            $data = isset($json_data['data']) ? $json_data['data'] : null;

            if ($name === null || $number === null || $category === null || $purpose === null || $state === null || $data === null) {
                return new WP_Error('missing_params', '保存自定义设备失败：缺少必要参数', array('status' => 400));
            }

            if (!is_array($data)) {
                return new WP_Error('invalid_data', '保存自定义设备失败：data 参数格式错误', array('status' => 400));
            }

            $json = wp_json_encode($data, JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                return new WP_Error('json_encode_failed', '保存自定义设备失败：data 编码失败', array('status' => 400));
            }

            $result = $wpdb->update(
                $table_name,
                array(
                    'name' => $name,
                    'number' => $number,
                    'category' => $category,
                    'purpose' => $purpose,
                    'state' => $state,
                    'data' => $json
                ),
                array('uuid' => $uuid),
                array('%s', '%s', '%s', '%s', '%s', '%s'),
                array('%s')
            );

            if ($result === false) {
                return new WP_Error('update_failed', '保存自定义设备失败：数据库更新失败', array('status' => 500));
            }

            self::clear_style_cache();

            return rest_ensure_response(array(
                'success' => true,
                'message' => '自定义设备已保存',
            ));
        }

        /**
         * 管理端 - 删除自定义设备
         */
        public static function admin_delete_style($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            $table_auto = $wpdb->prefix . self::$table_auto_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '删除自定义设备失败：缺少设备UUID', array('status' => 400));
            }

            $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE uuid = %s", $uuid));
            if ($exists == 0) {
                return new WP_Error('not_found', '删除自定义设备失败：设备不存在或已删除', array('status' => 404));
            }

            $wpdb->query('START TRANSACTION');

            try {
                $result = $wpdb->delete(
                    $table_name,
                    array('uuid' => $uuid),
                    array('%s')
                );

                $result_auto = $wpdb->delete(
                    $table_auto,
                    array('record_uuid' => $uuid),
                    array('%s')
                );

                if ($result === false || $result_auto === false) {
                    throw new Exception('删除操作失败');
                }

                $wpdb->query('COMMIT');
                self::clear_style_cache();
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => '自定义设备已删除',
                ));
            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                return new WP_Error('delete_failed', '删除自定义设备失败：数据库操作失败', array(
                    'status' => 500,
                    'detail' => $e->getMessage(),
                ));
            }
        }

        /**
         * 管理端 - 获取自定义设备分类
         */
        public static function admin_get_style_categories($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            $cache_key = self::get_cache_key('style_categories');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return self::rest_response_with_cache($request, $cached);
            }

            $categories = $wpdb->get_results(
                "SELECT DISTINCT category FROM {$table_name} WHERE category IS NOT NULL AND category != ''"
            );
            $states = $wpdb->get_results(
                "SELECT DISTINCT state FROM {$table_name} WHERE state IS NOT NULL AND state != ''"
            );
            $platform_column = self::column_exists($table_name, 'platform')
                ? 'platform'
                : "JSON_UNQUOTE(JSON_EXTRACT(data, '$.platform'))";
            $pay_method_column = self::column_exists($table_name, 'pay_method')
                ? 'pay_method'
                : "JSON_UNQUOTE(JSON_EXTRACT(data, '$.pay_method'))";

            $platforms = $wpdb->get_results(
                "SELECT DISTINCT {$platform_column} as platform FROM {$table_name} WHERE {$platform_column} IS NOT NULL AND {$platform_column} != ''"
            );
            $pay_methods = $wpdb->get_results(
                "SELECT DISTINCT {$pay_method_column} as pay_method FROM {$table_name} WHERE {$pay_method_column} IS NOT NULL AND {$pay_method_column} != ''"
            );

            if ($wpdb->last_error) {
                return new WP_Error('db_error', '获取自定义设备分类失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            $category_result = array_map(function ($item) {
                return array(
                    'value' => $item->category,
                    'label' => $item->category
                );
            }, $categories);

            $state_labels = array(
                '使用' => '使用',
                '闲置' => '闲置',
                '故障' => '故障',
                '维修' => '维修',
                '报废' => '报废'
            );

            $existing_states = array_column($states, 'state');
            $state_result = array();
            foreach ($state_labels as $value => $label) {
                $state_result[] = array(
                    'value' => $value,
                    'label' => $label
                );
            }
            foreach ($existing_states as $state) {
                if (!array_key_exists($state, $state_labels)) {
                    $state_result[] = array(
                        'value' => $state,
                        'label' => $state
                    );
                }
            }

            $platform_labels = array(
                '京东' => '京东',
                '淘宝' => '淘宝',
                '拼多多' => '拼多多',
                '美团' => '美团',
                '闲鱼' => '闲鱼',
                '线下' => '线下',
            );
            $existing_platforms = array_column($platforms, 'platform');
            $platform_result = array();
            foreach ($platform_labels as $value => $label) {
                $platform_result[] = array(
                    'value' => $value,
                    'label' => $label
                );
            }
            foreach ($existing_platforms as $platform) {
                if (!array_key_exists($platform, $platform_labels)) {
                    $platform_result[] = array(
                        'value' => $platform,
                        'label' => $platform
                    );
                }
            }

            $pay_method_labels = array(
                '支付宝' => '支付宝',
                '微信' => '微信',
                '现金' => '现金',
            );
            $existing_pay_methods = array_column($pay_methods, 'pay_method');
            $pay_method_result = array();
            foreach ($pay_method_labels as $value => $label) {
                $pay_method_result[] = array(
                    'value' => $value,
                    'label' => $label
                );
            }
            foreach ($existing_pay_methods as $pay_method) {
                if (!array_key_exists($pay_method, $pay_method_labels)) {
                    $pay_method_result[] = array(
                        'value' => $pay_method,
                        'label' => $pay_method
                    );
                }
            }

            $response = array(
                'states' => array_values($state_result),
                'categories' => array_values($category_result),
                'platforms' => array_values($platform_result),
                'pay_methods' => array_values($pay_method_result),
            );

            set_transient($cache_key, $response, 5 * MINUTE_IN_SECONDS);

            return self::rest_response_with_cache($request, $response);
        }

        /**
         * 管理端 - 资产盘点汇总
         */
        public static function admin_get_pc_summary($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            $cache_key = self::get_cache_key('pc_summary');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return self::rest_response_with_cache($request, $cached);
            }

            $rows = $wpdb->get_results("SELECT purchase, depreciation, created_at, data, state FROM $table_name", ARRAY_A);

            $cpu_counts = array();
            $disk_counts = array();
            $memory_counts = array();
            $baseboard_counts = array();

            $total_purchase = 0;
            $total_depreciation = 0;
            $total_residual = 0;

            $option = get_option(self::$option);
            $salvage_rate = 0;
            $depreciation_months = 0;
            if (is_object($option)) {
                $salvage_rate = isset($option->residual_value_rate) ? floatval($option->residual_value_rate) * 0.01 : 0;
                $depreciation_months = isset($option->depreciation_year) ? intval($option->depreciation_year) : 0;
            } elseif (is_array($option)) {
                $salvage_rate = isset($option['residual_value_rate']) ? floatval($option['residual_value_rate']) * 0.01 : 0;
                $depreciation_months = isset($option['depreciation_year']) ? intval($option['depreciation_year']) : 0;
            }

            $disk_thresholds = array(
                '128G' => 128,
                '256G' => 256,
                '512G' => 512,
                '1T' => 1024,
                '2T' => 2048,
                '4T' => 4096,
            );

            $memory_thresholds = array(
                '2G' => 2,
                '4G' => 4,
                '8G' => 8,
                '16G' => 16,
                '32G' => 32,
                '64G' => 64,
                '128G' => 128,
            );

            $now = current_time('mysql');

            foreach ($rows as $row) {
                $state = isset($row['state']) ? trim($row['state']) : '';
                $is_scrapped = $state === '报废' || strtolower($state) === 'scrap';
                if ($is_scrapped) {
                    continue;
                }
                $purchase = floatval($row['purchase']);
                $total_purchase += $purchase;
                $total_depreciation += floatval($row['depreciation']);

                $months_used = self::months_diff($row['created_at'], $now);
                $total_residual += self::calculate_residual($purchase, $months_used, $salvage_rate, $depreciation_months);

                $data_obj = json_decode($row['data'], true);
                if (!is_array($data_obj)) {
                    continue;
                }

                $cpu_manufacturer = isset($data_obj['cpu']['manufacturer']) ? $data_obj['cpu']['manufacturer'] : null;
                if (!empty($cpu_manufacturer)) {
                    $cpu_counts[$cpu_manufacturer] = isset($cpu_counts[$cpu_manufacturer]) ? $cpu_counts[$cpu_manufacturer] + 1 : 1;
                }

                if (!empty($data_obj['diskLayout']) && is_array($data_obj['diskLayout'])) {
                    foreach ($data_obj['diskLayout'] as $disk) {
                        $bucket = self::bucket_size($disk, $disk_thresholds);
                        if ($bucket) {
                            $disk_counts[$bucket] = isset($disk_counts[$bucket]) ? $disk_counts[$bucket] + 1 : 1;
                        }
                    }
                }

                if (!empty($data_obj['memLayout']) && is_array($data_obj['memLayout'])) {
                    foreach ($data_obj['memLayout'] as $mem) {
                        $bucket = self::bucket_size($mem, $memory_thresholds);
                        if ($bucket) {
                            $memory_counts[$bucket] = isset($memory_counts[$bucket]) ? $memory_counts[$bucket] + 1 : 1;
                        }
                    }
                }

                $baseboard = isset($data_obj['baseboard']['manufacturer']) ? $data_obj['baseboard']['manufacturer'] : null;
                if (!empty($baseboard)) {
                    $baseboard_counts[$baseboard] = isset($baseboard_counts[$baseboard]) ? $baseboard_counts[$baseboard] + 1 : 1;
                }
            }

            $response = array(
                'cpu' => self::format_table_data($cpu_counts),
                'disk' => self::format_table_data($disk_counts, array_keys($disk_thresholds)),
                'memory' => self::format_table_data($memory_counts, array_keys($memory_thresholds)),
                'baseboard' => self::format_table_data($baseboard_counts),
                'totals' => array(
                    'purchase' => round($total_purchase, 2),
                    'depreciation' => round($total_depreciation, 2),
                    'residual' => round($total_residual, 2),
                ),
            );

            set_transient($cache_key, $response, 5 * MINUTE_IN_SECONDS);

            return self::rest_response_with_cache($request, $response);
        }

        /**
         * 管理端 - 保存设置
         */
        public static function admin_update_settings($request)
        {
            global $wpdb;

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '保存设置失败：提交数据为空', array('status' => 400));
            }

            $object = json_decode(wp_json_encode($json_data));
            if (!$object) {
                return new WP_Error('invalid_data', '保存设置失败：数据格式错误', array('status' => 400));
            }

            $validation_result = DEMA_Admin_Interface_Seting::validate_object($object);
            if ($validation_result !== true) {
                return new WP_Error('invalid_data', '保存设置失败：' . $validation_result, array('status' => 400));
            }

            $raw_password = $object->password;
            if ($raw_password !== '已设定') {
                $object->password = wp_hash_password($raw_password);
            } else {
                $random_string = uniqid(mt_rand(), true);
                $object->password = self::get_seting('password') ? self::get_seting('password') : wp_hash_password($random_string);
            }

            $result = update_option(self::$option, $object);
            if ($result === false) {
                if (empty($wpdb->last_error)) {
                    return rest_ensure_response(array(
                        'success' => true,
                        'message' => '设置未变化',
                    ));
                }
                return new WP_Error('update_failed', '保存设置失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            self::clear_pc_cache();

            return rest_ensure_response(array(
                'success' => true,
                'message' => '设置已保存',
            ));
        }

        /**
         * 管理端 - 导出数据
         */
        public static function admin_export_data($request)
        {
            global $wpdb;
            $name = sanitize_text_field((string) $request->get_param('name'));
            if (empty($name)) {
                return new WP_Error('missing_params', '导出失败：缺少表名', array('status' => 400));
            }

            $allowed_tables = array(
                self::$table_pc_name,
                self::$table_style_name,
                self::$table_manual_name,
                self::$table_auto_name,
            );
            if (!in_array($name, $allowed_tables, true)) {
                return new WP_Error('invalid_table', '导出失败：表名不合法', array('status' => 400));
            }

            $table_name = $wpdb->prefix . $name;
            $page = max(1, intval($request->get_param('page') ?: 1));
            $per_page = intval($request->get_param('per_page') ?: 500);
            $per_page = max(1, min(2000, $per_page));
            $offset = ($page - 1) * $per_page;

            $format = sanitize_text_field((string) $request->get_param('format'));
            $format = $format === 'csv' ? 'csv' : 'json';

            $total = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
            if ($wpdb->last_error) {
                return new WP_Error('db_error', '导出失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            $rows = $wpdb->get_results(
                $wpdb->prepare("SELECT * FROM $table_name LIMIT %d OFFSET %d", $per_page, $offset),
                ARRAY_A
            );

            if ($wpdb->last_error) {
                return new WP_Error('db_error', '导出失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            $payload = array(
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
            );

            if ($format === 'csv') {
                $include_header = $page === 1;
                $payload['csv'] = self::build_csv($rows ?: array(), $include_header);
                $payload['columns'] = !empty($rows) ? array_keys(reset($rows)) : array();
            } else {
                $payload['items'] = $rows ?: array();
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => '导出成功',
                'data' => $payload,
            ));
        }

        /**
         * CSV 构建
         */
        private static function build_csv($rows, $include_header)
        {
            if (!is_array($rows) || empty($rows)) {
                return '';
            }

            $columns = array_keys(reset($rows));
            $fp = fopen('php://temp', 'r+');
            if ($include_header) {
                fputcsv($fp, $columns);
            }

            foreach ($rows as $row) {
                $line = array();
                foreach ($columns as $col) {
                    $value = isset($row[$col]) ? $row[$col] : '';
                    if (is_array($value) || is_object($value)) {
                        $value = wp_json_encode($value);
                    }
                    $line[] = $value;
                }
                fputcsv($fp, $line);
            }

            rewind($fp);
            $csv = stream_get_contents($fp);
            fclose($fp);
            return $csv ? $csv : '';
        }

        /**
         * 管理端 - 导入数据
         */
        public static function admin_import_data($request)
        {
            global $wpdb;

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '导入失败：数据为空', array('status' => 400));
            }

            $name = isset($json_data['name']) ? sanitize_text_field($json_data['name']) : null;
            $data = isset($json_data['data']) ? $json_data['data'] : null;

            if (empty($name)) {
                return new WP_Error('missing_params', '导入失败：缺少表名', array('status' => 400));
            }
            if (!is_array($data)) {
                return new WP_Error('invalid_data', '导入失败：数据格式错误', array('status' => 400));
            }

            $allowed_tables = array(
                self::$table_pc_name,
                self::$table_style_name,
                self::$table_manual_name,
                self::$table_auto_name,
            );
            if (!in_array($name, $allowed_tables, true)) {
                return new WP_Error('invalid_table', '导入失败：表名不合法', array('status' => 400));
            }

            $total_records = is_array($data) ? count($data) : 0;
            $report = array(
                'total_records' => $total_records,
                'imported_records' => 0,
                'skipped_records' => 0,
                'failed_records' => 0,
                'errors' => array(),
            );

            if ($total_records === 0) {
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => '导入完成：没有可导入的数据',
                    'data' => $report,
                ));
            }

            $table_name = $wpdb->prefix . $name;
            $error_limit = 50;

            foreach ($data as $index => $item) {
                $row_index = $index + 1;
                if (!is_array($item)) {
                    $report['failed_records']++;
                    if (count($report['errors']) < $error_limit) {
                        $report['errors'][] = array(
                            'index' => $row_index,
                            'reason' => '数据结构错误',
                        );
                    }
                    continue;
                }

                if ($name == self::$table_pc_name) {
                    $uuid = isset($item['uuid']) ? sanitize_text_field($item['uuid']) : '';
                    $raw_data = isset($item['data']) ? $item['data'] : null;

                    if (empty($uuid) || empty($raw_data)) {
                        $report['failed_records']++;
                        if (count($report['errors']) < $error_limit) {
                            $report['errors'][] = array(
                                'index' => $row_index,
                                'id' => $uuid,
                                'reason' => '设备信息不完整（uuid/data 缺失）',
                            );
                        }
                        continue;
                    }

                    $exists = $wpdb->get_var(
                        $wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE uuid = %s", $uuid)
                    );
                    if ($exists) {
                        $report['skipped_records']++;
                        continue;
                    }

                    $insert_row = array(
                        'name' => sanitize_text_field(isset($item['name']) ? $item['name'] : ''),
                        'state' => sanitize_text_field(isset($item['state']) ? $item['state'] : 'apply'),
                        'number' => sanitize_text_field(isset($item['number']) ? $item['number'] : ''),
                        'department' => sanitize_text_field(isset($item['department']) ? $item['department'] : ''),
                        'purchase' => isset($item['purchase']) ? floatval($item['purchase']) : 0,
                        'depreciation' => isset($item['depreciation']) ? floatval($item['depreciation']) : 0,
                        'ip' => sanitize_text_field(isset($item['ip']) ? $item['ip'] : ''),
                        'uuid' => $uuid,
                        'data' => is_array($raw_data) || is_object($raw_data) ? wp_json_encode($raw_data) : $raw_data,
                    );

                    if (!empty($item['created_at'])) {
                        $insert_row['created_at'] = sanitize_text_field($item['created_at']);
                    }
                    if (!empty($item['updated_at'])) {
                        $insert_row['updated_at'] = sanitize_text_field($item['updated_at']);
                    }

                    $result = $wpdb->insert($table_name, $insert_row);
                } elseif ($name == self::$table_style_name) {
                    $uuid = isset($item['uuid']) ? sanitize_text_field($item['uuid']) : '';
                    if (empty($uuid)) {
                        $report['failed_records']++;
                        if (count($report['errors']) < $error_limit) {
                            $report['errors'][] = array(
                                'index' => $row_index,
                                'reason' => '设备信息不完整（uuid 缺失）',
                            );
                        }
                        continue;
                    }

                    $exists = $wpdb->get_var(
                        $wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE uuid = %s", $uuid)
                    );
                    if ($exists) {
                        $report['skipped_records']++;
                        continue;
                    }

                    $raw_data = isset($item['data']) ? $item['data'] : null;
                    $insert_row = array(
                        'name' => sanitize_text_field(isset($item['name']) ? $item['name'] : ''),
                        'number' => sanitize_text_field(isset($item['number']) ? $item['number'] : ''),
                        'state' => sanitize_text_field(isset($item['state']) ? $item['state'] : ''),
                        'category' => sanitize_text_field(isset($item['category']) ? $item['category'] : ''),
                        'purpose' => sanitize_text_field(isset($item['purpose']) ? $item['purpose'] : ''),
                        'uuid' => $uuid,
                    );

                    if (!empty($item['created_at'])) {
                        $insert_row['created_at'] = sanitize_text_field($item['created_at']);
                    }
                    if (!empty($raw_data)) {
                        $insert_row['data'] = is_array($raw_data) || is_object($raw_data) ? wp_json_encode($raw_data) : $raw_data;
                    }

                    $result = $wpdb->insert($table_name, $insert_row);
                } elseif ($name == self::$table_manual_name) {
                    $record_uuid = isset($item['record_uuid']) ? sanitize_text_field($item['record_uuid']) : '';
                    $created_at = isset($item['created_at']) ? sanitize_text_field($item['created_at']) : '';

                    if (empty($record_uuid) || empty($created_at)) {
                        $report['failed_records']++;
                        if (count($report['errors']) < $error_limit) {
                            $report['errors'][] = array(
                                'index' => $row_index,
                                'id' => $record_uuid,
                                'reason' => '记录信息不完整（record_uuid/created_at 缺失）',
                            );
                        }
                        continue;
                    }

                    $exists = $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM $table_name WHERE record_uuid = %s AND created_at = %s",
                            $record_uuid,
                            $created_at
                        )
                    );
                    if ($exists) {
                        $report['skipped_records']++;
                        continue;
                    }

                    $insert_row = array(
                        'record_uuid' => $record_uuid,
                        'created_at' => $created_at,
                        'user' => sanitize_text_field(isset($item['user']) ? $item['user'] : ''),
                        'type' => sanitize_text_field(isset($item['type']) ? $item['type'] : ''),
                        'data' => sanitize_text_field(isset($item['data']) ? $item['data'] : ''),
                    );

                    $result = $wpdb->insert($table_name, $insert_row);
                } else {
                    $record_uuid = isset($item['record_uuid']) ? sanitize_text_field($item['record_uuid']) : '';
                    $changed_at = isset($item['changed_at']) ? sanitize_text_field($item['changed_at']) : '';

                    if (empty($record_uuid) || empty($changed_at)) {
                        $report['failed_records']++;
                        if (count($report['errors']) < $error_limit) {
                            $report['errors'][] = array(
                                'index' => $row_index,
                                'id' => $record_uuid,
                                'reason' => '记录信息不完整（record_uuid/changed_at 缺失）',
                            );
                        }
                        continue;
                    }

                    $exists = $wpdb->get_var(
                        $wpdb->prepare(
                            "SELECT COUNT(*) FROM $table_name WHERE record_uuid = %s AND changed_at = %s",
                            $record_uuid,
                            $changed_at
                        )
                    );
                    if ($exists) {
                        $report['skipped_records']++;
                        continue;
                    }

                    $insert_row = array(
                        'table_name' => sanitize_text_field(isset($item['table_name']) ? $item['table_name'] : ''),
                        'column_name' => sanitize_text_field(isset($item['column_name']) ? $item['column_name'] : ''),
                        'old_value' => sanitize_text_field(isset($item['old_value']) ? $item['old_value'] : ''),
                        'new_value' => sanitize_text_field(isset($item['new_value']) ? $item['new_value'] : ''),
                        'changed_at' => $changed_at,
                        'record_uuid' => $record_uuid,
                    );

                    $result = $wpdb->insert($table_name, $insert_row);
                }

                if ($result === false) {
                    $report['failed_records']++;
                    if (count($report['errors']) < $error_limit) {
                        $report['errors'][] = array(
                            'index' => $row_index,
                            'reason' => '数据库写入失败',
                        );
                    }
                } else {
                    $report['imported_records']++;
                }
            }

            if ($report['imported_records'] > 0) {
                if ($name == self::$table_pc_name) {
                    self::clear_pc_cache();
                }
                if ($name == self::$table_style_name) {
                    self::clear_style_cache();
                }
            }

            $message = sprintf(
                '导入完成：成功 %d 条，跳过 %d 条，失败 %d 条',
                $report['imported_records'],
                $report['skipped_records'],
                $report['failed_records']
            );

            return rest_ensure_response(array(
                'success' => true,
                'message' => $message,
                'data' => $report,
            ));
        }

        /**
         * 管理端 - 创建公共查询页面
         */
        public static function admin_create_public_search_page($request)
        {
            $route = sanitize_text_field((string) $request->get_param('route'));
            if (empty($route)) {
                return new WP_Error('missing_params', '创建公共查询页失败：缺少路由参数', array('status' => 400));
            }
            if (ctype_digit($route)) {
                return new WP_Error('invalid_route', '创建公共查询页失败：路由不能是纯数字', array('status' => 400));
            }

            $state = get_page_by_path($route, OBJECT, array('page'));
            if ($state) {
                return new WP_Error('route_exists', '创建公共查询页失败：页面已存在', array(
                    'status' => 409,
                    'url' => $state->guid,
                ));
            }

            $insert_result = DEMA_Admin_Interface_Search_Page::add_page($route);
            if (!is_wp_error($insert_result) && $insert_result != 0) {
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => '公共查询页已创建',
                    'id' => $insert_result,
                ));
            }

            return new WP_Error('insert_failed', '创建公共查询页失败：插入页面失败', array('status' => 500));
        }

        /**
         * 管理端 - 手动变更记录列表（分页/筛选/搜索）
         */
        public static function admin_get_manual_changes($request)
        {
            global $wpdb;
            $table_manual = $wpdb->prefix . self::$table_manual_name;
            $table_pc = $wpdb->prefix . self::$table_pc_name;

            $page = max(1, intval($request->get_param('page') ?: 1));
            $per_page = intval($request->get_param('per_page') ?: 20);
            $per_page = max(1, min(100, $per_page));
            $offset = ($page - 1) * $per_page;

            $search = sanitize_text_field((string) $request->get_param('search'));
            $search = trim($search);
            $record_uuid = sanitize_text_field((string) $request->get_param('record_uuid'));
            $column_name = sanitize_text_field((string) $request->get_param('column_name'));
            $user = sanitize_text_field((string) $request->get_param('user'));
            $type = sanitize_text_field((string) $request->get_param('type'));

            $where = array();
            $params = array();

            if (!empty($record_uuid)) {
                $where[] = 'm.record_uuid = %s';
                $params[] = $record_uuid;
            }

            if (!empty($user)) {
                $where[] = 'm.user = %s';
                $params[] = $user;
            }

            if (!empty($type)) {
                $where[] = 'm.type = %s';
                $params[] = $type;
            }

            if (empty($type) && !empty($column_name)) {
                $where[] = 'm.type = %s';
                $params[] = $column_name;
            }

            if ($search !== '') {
                $like = '%' . $wpdb->esc_like($search) . '%';
                $where[] = '(m.user LIKE %s OR m.type LIKE %s OR m.data LIKE %s OR m.record_uuid LIKE %s OR p.name LIKE %s OR p.number LIKE %s OR p.department LIKE %s)';
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
            }

            $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
            $base_from = "FROM $table_manual m LEFT JOIN $table_pc p ON m.record_uuid = p.uuid";

            $total_sql = "SELECT COUNT(*) $base_from $where_sql";
            $total = $params ? $wpdb->get_var($wpdb->prepare($total_sql, $params)) : $wpdb->get_var($total_sql);

            $query_sql = "SELECT m.*, 
                CASE 
                    WHEN p.uuid IS NULL THEN NULL 
                    ELSE CONCAT(p.name, ' _ ', p.department, ' _ ', p.number) 
                END AS msg
                $base_from
                $where_sql
                ORDER BY m.id DESC
                LIMIT %d OFFSET %d";

            $query_params = array_merge($params, array($per_page, $offset));
            $items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

            $filters = array(
                'users' => $wpdb->get_col("SELECT DISTINCT user FROM $table_manual WHERE user IS NOT NULL AND user != ''"),
                'types' => $wpdb->get_col("SELECT DISTINCT type FROM $table_manual WHERE type IS NOT NULL AND type != ''"),
            );

            $payload = array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
                'filters' => $filters,
            );
            $last_modified = self::extract_latest_timestamp($items, array('created_at'));
            return self::rest_response_with_cache($request, $payload, $last_modified);
        }

        /**
         * 管理端 - 添加手动变更记录
         */
        public static function admin_create_manual_change($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_manual_name;

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '添加变更记录失败：提交数据为空', array('status' => 400));
            }

            $record_uuid = isset($json_data['record_uuid']) ? sanitize_text_field($json_data['record_uuid']) : null;
            $user = isset($json_data['user']) ? sanitize_text_field($json_data['user']) : null;
            $type = isset($json_data['type']) ? sanitize_text_field($json_data['type']) : null;
            $data = isset($json_data['data']) ? sanitize_text_field($json_data['data']) : null;

            if (empty($record_uuid) || empty($user) || empty($type) || empty($data)) {
                return new WP_Error('missing_params', '添加变更记录失败：缺少必要参数', array('status' => 400));
            }

            $result = $wpdb->insert(
                $table_name,
                array(
                    'record_uuid' => $record_uuid,
                    'user' => $user,
                    'type' => $type,
                    'data' => $data
                ),
                array('%s', '%s', '%s', '%s')
            );

            if ($result === false) {
                return new WP_Error('insert_failed', '添加变更记录失败：写入数据库失败', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => '变更记录已添加',
                'id' => $wpdb->insert_id,
            ));
        }

        /**
         * 管理端 - 更新手动变更记录
         */
        public static function admin_update_manual_change($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_manual_name;
            $id = intval($request['id']);

            if ($id <= 0) {
                return new WP_Error('missing_id', '更新变更记录失败：缺少记录ID', array('status' => 400));
            }

            $json_data = $request->get_json_params();
            if (empty($json_data) || !is_array($json_data)) {
                return new WP_Error('invalid_data', '更新变更记录失败：提交数据为空', array('status' => 400));
            }

            $field_map = array(
                'user' => 'user',
                'type' => 'type',
                'data' => 'data',
            );

            $update_data = array();
            $update_format = array();

            foreach ($json_data as $key => $value) {
                if (!array_key_exists($key, $field_map)) {
                    continue;
                }
                $update_data[$field_map[$key]] = sanitize_text_field($value);
                $update_format[] = '%s';
            }

            if (empty($update_data)) {
                return new WP_Error('invalid_fields', '更新变更记录失败：没有可更新字段', array('status' => 400));
            }

            $result = $wpdb->update(
                $table_name,
                $update_data,
                array('id' => $id),
                $update_format,
                array('%d')
            );

            if ($result === false) {
                return new WP_Error('update_failed', '更新变更记录失败：数据库更新失败', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => '变更记录已更新',
            ));
        }

        /**
         * 管理端 - 自动变更记录列表（分页/筛选/搜索）
         */
        public static function admin_get_auto_changes($request)
        {
            global $wpdb;
            $table_auto = $wpdb->prefix . self::$table_auto_name;
            $table_pc = $wpdb->prefix . self::$table_pc_name;
            $table_style = $wpdb->prefix . self::$table_style_name;

            $page = max(1, intval($request->get_param('page') ?: 1));
            $per_page = intval($request->get_param('per_page') ?: 20);
            $per_page = max(1, min(100, $per_page));
            $offset = ($page - 1) * $per_page;

            $search = sanitize_text_field((string) $request->get_param('search'));
            $search = trim($search);
            $record_uuid = sanitize_text_field((string) $request->get_param('record_uuid'));
            $table_name_filter = sanitize_text_field((string) $request->get_param('table_name'));
            $column_name = sanitize_text_field((string) $request->get_param('column_name'));

            $where = array();
            $params = array();

            if (!empty($record_uuid)) {
                $where[] = 'a.record_uuid = %s';
                $params[] = $record_uuid;
            }

            if (!empty($table_name_filter) && $table_name_filter !== 'all') {
                $where[] = 'a.table_name = %s';
                $params[] = $table_name_filter;
            }

            if (!empty($column_name) && $column_name !== 'all') {
                $where[] = 'a.column_name = %s';
                $params[] = $column_name;
            }

            if ($search !== '') {
                $like = '%' . $wpdb->esc_like($search) . '%';
                $where[] = '(a.table_name LIKE %s OR a.column_name LIKE %s OR a.old_value LIKE %s OR a.new_value LIKE %s OR a.record_uuid LIKE %s OR p.name LIKE %s OR p.number LIKE %s OR s.name LIKE %s OR s.number LIKE %s)';
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
            }

            $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $base_from = "FROM $table_auto a
                LEFT JOIN $table_pc p ON a.table_name = 'pc' AND a.record_uuid = p.uuid
                LEFT JOIN $table_style s ON a.table_name = 'style' AND a.record_uuid = s.uuid";

            $total_sql = "SELECT COUNT(*) $base_from $where_sql";
            $total = $params ? $wpdb->get_var($wpdb->prepare($total_sql, $params)) : $wpdb->get_var($total_sql);

            $query_sql = "SELECT a.*,
                CASE
                    WHEN a.table_name = 'pc' THEN CONCAT(COALESCE(p.name, ''), ' _ ', COALESCE(p.number, ''))
                    WHEN a.table_name = 'style' THEN CONCAT(COALESCE(s.name, ''), ' _ ', COALESCE(s.number, ''))
                    ELSE NULL
                END AS msg
                $base_from
                $where_sql
                ORDER BY a.id DESC
                LIMIT %d OFFSET %d";

            $query_params = array_merge($params, array($per_page, $offset));
            $items = $wpdb->get_results($wpdb->prepare($query_sql, $query_params), ARRAY_A);

            $filters = array(
                'tables' => $wpdb->get_col("SELECT DISTINCT table_name FROM $table_auto WHERE table_name IS NOT NULL AND table_name != ''"),
                'columns' => $wpdb->get_col("SELECT DISTINCT column_name FROM $table_auto WHERE column_name IS NOT NULL AND column_name != ''"),
            );

            $payload = array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
                'filters' => $filters,
            );
            $last_modified = self::extract_latest_timestamp($items, array('changed_at'));
            return self::rest_response_with_cache($request, $payload, $last_modified);
        }

        /**
         * 计算月份差
         */
        private static function months_diff($start, $end)
        {
            try {
                $start_date = new DateTime($start);
                $end_date = new DateTime($end);
            } catch (Exception $e) {
                return 0;
            }

            $diff = $start_date->diff($end_date);
            return abs($diff->y * 12 + $diff->m);
        }

        /**
         * 计算残值
         */
        private static function calculate_residual($purchase, $months_used, $salvage_rate, $depreciation_months)
        {
            if ($depreciation_months <= 0) {
                return $purchase;
            }
            return $purchase - (($purchase * (1 - $salvage_rate)) / $depreciation_months) * $months_used;
        }

        /**
         * 根据容量阈值划分区间
         */
        private static function bucket_size($item, $thresholds)
        {
            if (!is_array($item) || !isset($item['size'])) {
                return null;
            }
            $size = floatval($item['size']);
            if ($size <= 0) {
                return null;
            }

            $size_gb = $size / pow(1024, 3);
            foreach ($thresholds as $label => $limit) {
                if ($size_gb <= $limit) {
                    return $label;
                }
            }
            return null;
        }

        /**
         * 格式化统计数据
         */
        private static function format_table_data($map, $order = array())
        {
            $result = array();
            if (!empty($order)) {
                foreach ($order as $key) {
                    if (isset($map[$key])) {
                        $result[] = array(
                            'type' => $key,
                            'sum' => $map[$key],
                        );
                    }
                }
            } else {
                foreach ($map as $key => $value) {
                    $result[] = array(
                        'type' => $key,
                        'sum' => $value,
                    );
                }
            }

            return $result;
        }
    }
}
