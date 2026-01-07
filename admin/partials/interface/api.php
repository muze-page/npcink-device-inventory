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
                'permission_callback' => '__return_true', // 无需验权（验证密码即可）
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
            $query_password = isset($request['password']) ? sanitize_text_field($request['password']) : null;

            /**
             * 安全检查 - 是否为空
             */
            if (empty($query_password)) {
                return wp_send_json_error(
                    [
                        'error' => '请填写客户端传输数据用的验证密码',
                    ],
                    400
                );
            }
            if (empty($query_data)) {
                return wp_send_json_error(
                    [
                        'error' => '请填写需要查询的值',
                    ],
                    400
                );
            }


            // 验证密码
            $is_valid_password = self::password_verification($query_password);
            if (!$is_valid_password) {
                // 密码验证失败
                return wp_send_json_error(
                    [
                        'error' => '密码验证失败，请检查！',
                    ],
                    403
                );
            }


            // 构造 SQL 查询语句
            $prepared_query = $wpdb->prepare("SELECT * FROM " . self::$table_name . " WHERE number = %s OR name = %s", $query_data, $query_data);

            // 执行查询
            $result = $wpdb->get_row($prepared_query);

            if ($result) {
                // 返回查询结果
                wp_send_json_success([
                    'message' => '查询成功',
                    'data' => $result,
                ]);
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
                'permission_callback' => '__return_true', // 无需验权（验证密码即可）
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

            //拿到传来的密码，检查密码
            $password = isset($request['password']) ? sanitize_text_field($request['password']) : null;

            //拿到传来的JSON对象字符串，检查字符串
            $data = isset($request['data']) ? sanitize_text_field($request['data']) : null;

            //姓名是否为空
            if (empty($name)) {
                return wp_send_json_error([
                    'error' => '姓名为空，请填写',
                ], 400);
            }

            //密码是否为空
            if (empty($password)) {
                return wp_send_json_error([
                    'error' => '密码为空，请填写',
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


            //验证密码
            $proving =  self::password_verification($password);
            if (!$proving) {
                return wp_send_json_error(
                    [
                        'error' => '密码验证失败，请检查密码！',
                    ],
                    400
                );
            }

            //为了防止硬件UUID重复，这里再加上第一张网卡的MAC地址以防万一
            $uuid_hardware = $data_obj->uuid->hardware; //唯一UUID
            $uuid_one_net = $data_obj->uuid->macs[0]; //第一个网口的MAC地址
            $uuid = md5($uuid_hardware . $uuid_one_net); //拼接，进行md5处理，短点更好看

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
                'state' => 'idie', // 默认状态为启用
                'number' =>  $last_six_digits, // 编号
                'department' => '默认', // 默认部门
                'purchase' => 0, //采购价'
                'depreciation' => 0, //二手价
                'ip' => '127.0.0.1', //默认IP地址
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

            return rest_ensure_response(array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
            ));
        }

        /**
         * 管理端 - 查询单个电脑设备
         */
        public static function admin_get_pc($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '获取设备失败：缺少设备UUID', array('status' => 400));
            }

            $row = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                ARRAY_A
            );

            if (empty($row)) {
                return new WP_Error('not_found', '获取设备失败：设备不存在或已删除', array('status' => 404));
            }

            return rest_ensure_response($row);
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
         * 管理端 - 获取电脑设备分类
         */
        public static function admin_get_pc_categories()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            $cache_key = self::get_cache_key('pc_categories');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return rest_ensure_response($cached);
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

            return rest_ensure_response($response);
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

            if (!empty($platform) && $platform !== 'all') {
                $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.platform')) = %s";
                $params[] = $platform;
            }

            if (!empty($pay_method) && $pay_method !== 'all') {
                $where[] = "JSON_UNQUOTE(JSON_EXTRACT(data, '$.pay_method')) = %s";
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

            return rest_ensure_response(array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
            ));
        }

        /**
         * 管理端 - 查询单个自定义设备
         */
        public static function admin_get_style($request)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;
            $uuid = sanitize_text_field((string) $request['uuid']);

            if (empty($uuid)) {
                return new WP_Error('missing_uuid', '获取自定义设备失败：缺少设备UUID', array('status' => 400));
            }

            $row = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $table_name WHERE uuid = %s", $uuid),
                ARRAY_A
            );

            if (empty($row)) {
                return new WP_Error('not_found', '获取自定义设备失败：设备不存在或已删除', array('status' => 404));
            }

            return rest_ensure_response($row);
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
        public static function admin_get_style_categories()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_style_name;

            $cache_key = self::get_cache_key('style_categories');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return rest_ensure_response($cached);
            }

            $categories = $wpdb->get_results(
                "SELECT DISTINCT category FROM {$table_name} WHERE category IS NOT NULL AND category != ''"
            );
            $states = $wpdb->get_results(
                "SELECT DISTINCT state FROM {$table_name} WHERE state IS NOT NULL AND state != ''"
            );
            $platforms = $wpdb->get_results(
                "SELECT DISTINCT JSON_EXTRACT(data, '$.platform') as platform FROM {$table_name} WHERE JSON_EXTRACT(data, '$.platform') IS NOT NULL AND JSON_EXTRACT(data, '$.platform') != ''"
            );
            $pay_methods = $wpdb->get_results(
                "SELECT DISTINCT JSON_EXTRACT(data, '$.pay_method') as pay_method FROM {$table_name} WHERE JSON_EXTRACT(data, '$.pay_method') IS NOT NULL AND JSON_EXTRACT(data, '$.pay_method') != ''"
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

            return rest_ensure_response($response);
        }

        /**
         * 管理端 - 资产盘点汇总
         */
        public static function admin_get_pc_summary()
        {
            global $wpdb;
            $table_name = $wpdb->prefix . self::$table_pc_name;

            $cache_key = self::get_cache_key('pc_summary');
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return rest_ensure_response($cached);
            }

            $rows = $wpdb->get_results("SELECT purchase, depreciation, created_at, data FROM $table_name", ARRAY_A);

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

            return rest_ensure_response($response);
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
            $rows = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);

            if ($wpdb->last_error) {
                return new WP_Error('db_error', '导出失败：数据库错误', array(
                    'status' => 500,
                    'detail' => $wpdb->last_error,
                ));
            }

            return rest_ensure_response(array(
                'success' => true,
                'message' => '导出成功',
                'data' => $rows ?: array(),
            ));
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

            if (empty($data)) {
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => '导入完成：没有可导入的数据',
                    'imported_records' => 0,
                    'total_records' => 0,
                ));
            }

            $insert_data = array();

            if ($name == self::$table_pc_name) {
                foreach ($data as $item) {
                    if (empty($item['data']) || empty($item['uuid'])) {
                        return new WP_Error('invalid_data', '导入失败：设备信息不完整', array('status' => 400));
                    }
                    $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                    $table_name = $wpdb->prefix . self::$table_pc_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE uuid = %s",
                            $uuid
                        ),
                        ARRAY_A
                    );

                    if (!$existingData) {
                        $insert_data[] = array(
                            'name' => isset($item['name']) ? $item['name'] : '',
                            'state' => isset($item['state']) ? $item['state'] : 'apply',
                            'number' => isset($item['number']) ? $item['number'] : 0,
                            'department' => isset($item['department']) ? $item['department'] : 0,
                            'purchase' => isset($item['purchase']) ? $item['purchase'] : 0,
                            'depreciation' => isset($item['depreciation']) ? $item['depreciation'] : 0,
                            'ip' => isset($item['ip']) ? $item['ip'] : '',
                            'created_at' => isset($item['created_at']) ? ($item['created_at']) : null,
                            'updated_at' => isset($item['updated_at']) ? ($item['updated_at']) : null,
                            'uuid' => isset($item['uuid']) ? $item['uuid'] : '',
                            'data' => isset($item['data']) ? ($item['data']) : null,
                        );
                    }
                }
            }

            if ($name == self::$table_style_name) {
                foreach ($data as $item) {
                    $uuid = isset($item['uuid']) ? $item['uuid'] : null;
                    $table_name = $wpdb->prefix . self::$table_style_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE uuid = %s",
                            $uuid
                        ),
                        ARRAY_A
                    );
                    if (!$existingData) {
                        $insert_data[] = array(
                            'name' => isset($item['name']) ? $item['name'] :  null,
                            'number' => isset($item['number']) ? $item['number'] :  null,
                            'state' => isset($item['state']) ? $item['state'] :  null,
                            'category' => isset($item['category']) ? $item['category'] :  null,
                            'purpose' => isset($item['purpose']) ? $item['purpose'] :  null,
                            'created_at' => isset($item['created_at']) ? $item['created_at'] :  null,
                            'uuid' => isset($item['uuid']) ? $item['uuid'] :  null,
                            'data' => isset($item['data']) ? $item['data'] :  null,
                        );
                    }
                }
            }

            if ($name == self::$table_manual_name) {
                foreach ($data as $item) {
                    $record_uuid = isset($item['record_uuid']) ? $item['record_uuid'] : null;
                    $created_at = isset($item['created_at']) ? $item['created_at'] : null;

                    if (!$record_uuid || !$created_at) {
                        continue;
                    }

                    $table_name = $wpdb->prefix . self::$table_manual_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE record_uuid = %s AND created_at = %s",
                            $record_uuid,
                            $created_at
                        ),
                        ARRAY_A
                    );

                    if (!$existingData) {
                        $insert_data[] = array(
                            'record_uuid' => isset($item['record_uuid']) ? $item['record_uuid'] :  null,
                            'created_at' => isset($item['created_at']) ? $item['created_at'] : null,
                            'user' => isset($item['user']) ? $item['user'] :  null,
                            'type' => isset($item['type']) ? $item['type'] :  null,
                            'data' => isset($item['data']) ? $item['data'] :  null,
                        );
                    }
                }
            }

            if ($name == self::$table_auto_name) {
                foreach ($data as $item) {
                    $record_uuid = isset($item['record_uuid']) ? $item['record_uuid'] : null;
                    $changed_at = isset($item['changed_at']) ? $item['changed_at'] : null;

                    if (!$record_uuid || !$changed_at) {
                        continue;
                    }

                    $table_name = $wpdb->prefix . self::$table_auto_name;
                    $existingData = $wpdb->get_row(
                        $wpdb->prepare(
                            "SELECT * FROM $table_name WHERE record_uuid = %s AND changed_at = %s",
                            $record_uuid,
                            $changed_at
                        ),
                        ARRAY_A
                    );

                    if (!$existingData) {
                        $insert_data[] = array(
                            'table_name' => isset($item['table_name']) ? $item['table_name'] :  null,
                            'column_name' => isset($item['column_name']) ? $item['column_name'] : null,
                            'old_value' => isset($item['old_value']) ? $item['old_value'] :  null,
                            'new_value' => isset($item['new_value']) ? $item['new_value'] :  null,
                            'changed_at' => isset($item['changed_at']) ? $item['changed_at'] :  null,
                            'record_uuid' => isset($item['record_uuid']) ? $item['record_uuid'] :  null,
                        );
                    }
                }
            }

            if (empty($insert_data)) {
                $total_records = is_array($data) ? count($data) : 0;
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => $total_records > 0 ? '导入完成：所有记录已存在' : '导入完成：没有可导入的数据',
                    'total_records' => $total_records,
                    'imported_records' => 0,
                ));
            }

            $table_name = $wpdb->prefix . $name;
            foreach ($insert_data as $item) {
                $result = $wpdb->insert($table_name, $item);
            }

            if ($result !== false) {
                $imported_count = count($insert_data);
                if ($name == self::$table_pc_name) {
                    self::clear_pc_cache();
                }
                if ($name == self::$table_style_name) {
                    self::clear_style_cache();
                }
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => sprintf('成功导入 %d 条记录，刷新页面后查看', $imported_count),
                    'imported_records' => $imported_count,
                    'total_records' => is_array($data) ? count($data) : 0
                ));
            }

            return new WP_Error('insert_failed', '导入失败：数据库写入错误', array(
                'status' => 500,
                'detail' => $wpdb->last_error,
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

            return rest_ensure_response(array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
                'filters' => $filters,
            ));
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

            return rest_ensure_response(array(
                'items' => $items ?: array(),
                'total' => intval($total),
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $per_page > 0 ? (int) ceil($total / $per_page) : 0,
                'filters' => $filters,
            ));
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
