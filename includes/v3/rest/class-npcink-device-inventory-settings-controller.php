<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Settings_Controller
{
	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/settings',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_settings'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::EDITABLE,
					'callback' => array($this, 'update_settings'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/client-tokens',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'create_token'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/client-tokens/(?P<id>[a-z0-9]{12})',
			array(
				array(
					'methods' => WP_REST_Server::EDITABLE,
					'callback' => array($this, 'update_token'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::DELETABLE,
					'callback' => array($this, 'delete_token'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/settings/public-query-page',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'create_public_query_page'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);
	}

	public function admin_permissions_check()
	{
		if (!current_user_can('manage_options')) {
			return Npcink_Device_Inventory_V3_Response::error('forbidden', 'Administrator permission is required.', 403);
		}
		return true;
	}

	public function get_settings()
	{
		return rest_ensure_response(array('data' => $this->public_options(Npcink_Device_Inventory_V3_Tables::options())));
	}

	public function update_settings($request)
	{
		$params = $request->get_json_params();
		if (!is_array($params)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_json', 'Request body must be valid JSON.', 400);
		}

		$options = Npcink_Device_Inventory_V3_Tables::options();
		if (array_key_exists('clientUploadBaseUrl', $params)) {
			$options['client_upload_base_url'] = esc_url_raw((string) $params['clientUploadBaseUrl']);
		}
		if (array_key_exists('publicQueryEnabled', $params)) {
			$options['public_query_enabled'] = (bool) $params['publicQueryEnabled'];
		}
		if (array_key_exists('publicQueryPageSlug', $params)) {
			$slug = sanitize_title((string) $params['publicQueryPageSlug']);
			$options['public_query_page_slug'] = $slug ? $slug : 'public-search-page';
		}
		if (array_key_exists('publicQueryAccessCode', $params)) {
			$access_code = trim((string) $params['publicQueryAccessCode']);
			if ($access_code !== '') {
				$options['public_query_access_code_hash'] = wp_hash_password($access_code);
			}
		}
		if (!empty($options['public_query_enabled']) && empty($options['public_query_access_code_hash'])) {
			return Npcink_Device_Inventory_V3_Response::error('public_query_access_code_required', '启用公开查询前必须先设置访问码。', 400);
		}
		if (array_key_exists('observationRetentionDays', $params)) {
			$options['observation_retention_days'] = max(0, intval($params['observationRetentionDays']));
		}
		if (array_key_exists('assetNumberPrefix', $params)) {
			$options['asset_number_prefix'] = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $params['assetNumberPrefix']);
		}
		if (array_key_exists('depreciationPeriodMonths', $params)) {
			$options['depreciation_period_months'] = max(1, intval($params['depreciationPeriodMonths']));
		}
		if (array_key_exists('defaultResidualRate', $params)) {
			$options['default_residual_rate'] = min(100, max(0, floatval($params['defaultResidualRate'])));
		}
		if (array_key_exists('countAvailableAssetsOnly', $params)) {
			$options['count_available_assets_only'] = (bool) $params['countAvailableAssetsOnly'];
		}
		if (array_key_exists('departments', $params)) {
			$options['departments'] = Npcink_Device_Inventory_V3_Tables::normalize_departments_with_default($params['departments']);
		}
		if (array_key_exists('deleteDataOnUninstall', $params)) {
			$options['delete_data_on_uninstall'] = (bool) $params['deleteDataOnUninstall'];
		}

		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		return rest_ensure_response(array('data' => $this->public_options($options)));
	}

	public function create_public_query_page($request)
	{
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$params = $request instanceof WP_REST_Request ? $request->get_json_params() : array();
		if (is_array($params) && array_key_exists('publicQueryPageSlug', $params)) {
			$requested_slug = sanitize_title((string) $params['publicQueryPageSlug']);
			$options['public_query_page_slug'] = $requested_slug ? $requested_slug : 'public-search-page';
			update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		}

		$slug = !empty($options['public_query_page_slug']) ? sanitize_title((string) $options['public_query_page_slug']) : 'public-search-page';
		$content = '[npcink_device_inventory_public_search]';
		$page = get_page_by_path($slug, OBJECT, 'page');
		$data = array(
			'post_title' => '资产公开查询',
			'post_name' => $slug,
			'post_type' => 'page',
			'post_status' => 'publish',
			'post_content' => $content,
		);

		if ($page instanceof WP_Post) {
			$data['ID'] = $page->ID;
			$page_id = wp_update_post($data, true);
		} else {
			$page_id = wp_insert_post($data, true);
		}

		if (is_wp_error($page_id)) {
			return Npcink_Device_Inventory_V3_Response::error('page_create_failed', $page_id->get_error_message(), 500);
		}

		return rest_ensure_response(
			array(
				'data' => $this->public_query_page_state($options, intval($page_id)),
			)
		);
	}

	public function create_token($request)
	{
		$params = $request->get_json_params();
		$name = is_array($params) && !empty($params['name']) ? sanitize_text_field($params['name']) : 'Device token';
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$secret = $this->random_secret();
		$token = array(
			'id' => strtolower(substr(wp_generate_password(16, false, false), 0, 12)),
			'name' => $name,
			'secret' => $secret,
			'enabled' => true,
			'created_at' => current_time('mysql'),
		);
		$options['client_tokens'][] = $token;
		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);

		$public = $this->public_token($token);
		$public['secret'] = $secret;
		return rest_ensure_response(array('data' => $public));
	}

	public function delete_token($request)
	{
		$id = sanitize_key((string) $request['id']);
		$options = Npcink_Device_Inventory_V3_Tables::options();
		$tokens = array();
		foreach ($options['client_tokens'] as $token) {
			if (!is_array($token) || !isset($token['id']) || $token['id'] === $id) {
				continue;
			}
			$tokens[] = $token;
		}
		$options['client_tokens'] = $tokens;
		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		return rest_ensure_response(array('data' => array('success' => true)));
	}

	public function update_token($request)
	{
		$id = sanitize_key((string) $request['id']);
		$params = $request->get_json_params();
		if (!is_array($params) || !array_key_exists('enabled', $params)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_token_update', 'Token enabled state is required.', 400);
		}

		$options = Npcink_Device_Inventory_V3_Tables::options();
		$tokens = array();
		$updated = null;
		foreach ($options['client_tokens'] as $token) {
			if (!is_array($token)) {
				continue;
			}
			if (isset($token['id']) && $token['id'] === $id) {
				$token['enabled'] = (bool) $params['enabled'];
				$updated = $token;
			}
			$tokens[] = $token;
		}

		if (!$updated) {
			return Npcink_Device_Inventory_V3_Response::error('token_not_found', 'Client token not found.', 404);
		}

		$options['client_tokens'] = $tokens;
		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		return rest_ensure_response(array('data' => $this->public_token($updated)));
	}

	private function public_options($options)
	{
		$tokens = array();
		if (!empty($options['client_tokens']) && is_array($options['client_tokens'])) {
			foreach ($options['client_tokens'] as $token) {
				if (is_array($token)) {
					$tokens[] = $this->public_token($token);
				}
			}
		}

		return array(
			'clientUploadBaseUrl' => (string) $options['client_upload_base_url'],
			'publicQueryEnabled' => (bool) $options['public_query_enabled'],
			'publicQueryPageSlug' => (string) $options['public_query_page_slug'],
			'publicQueryAccessCodeSet' => !empty($options['public_query_access_code_hash']),
			'publicQueryPage' => $this->public_query_page_state($options),
			'observationRetentionDays' => intval($options['observation_retention_days']),
			'assetNumberPrefix' => (string) $options['asset_number_prefix'],
			'depreciationPeriodMonths' => intval($options['depreciation_period_months']),
			'defaultResidualRate' => floatval($options['default_residual_rate']),
			'countAvailableAssetsOnly' => !empty($options['count_available_assets_only']),
			'departments' => $this->settings_departments($options),
			'deleteDataOnUninstall' => !empty($options['delete_data_on_uninstall']),
			'clientTokens' => $tokens,
		);
	}

	private function settings_departments($options)
	{
		$raw_options = get_option(Npcink_Device_Inventory_V3_Tables::OPTION);
		if (is_array($raw_options) && array_key_exists('departments', $raw_options)) {
			return Npcink_Device_Inventory_V3_Tables::normalize_departments_with_default($raw_options['departments']);
		}
		return Npcink_Device_Inventory_V3_Tables::normalize_departments_with_default($this->asset_departments());
	}

	private function asset_departments()
	{
		global $wpdb;
		$table = Npcink_Device_Inventory_V3_Tables::assets();
		$rows = $wpdb->get_col(
			$wpdb->prepare('SELECT DISTINCT department FROM %i WHERE department <> %s ORDER BY department ASC', $table, '')
		);
		if (!is_array($rows)) {
			return array();
		}
		return Npcink_Device_Inventory_V3_Tables::normalize_departments($rows);
	}

	private function public_query_page_state($options, $known_page_id = 0)
	{
		$slug = !empty($options['public_query_page_slug']) ? sanitize_title((string) $options['public_query_page_slug']) : 'public-search-page';
		$page = null;
		if ($known_page_id > 0) {
			$post = get_post($known_page_id);
			if ($post instanceof WP_Post && $post->post_type === 'page') {
				$page = $post;
			}
		}
		if (!$page) {
			$found = get_page_by_path($slug, OBJECT, 'page');
			if ($found instanceof WP_Post) {
				$page = $found;
			}
		}

		if (!$page || $page->post_status === 'trash') {
			return array(
				'exists' => false,
				'id' => 0,
				'url' => '',
				'editUrl' => '',
				'slug' => $slug,
				'status' => '',
			);
		}

		return array(
			'exists' => true,
			'id' => intval($page->ID),
			'url' => get_permalink($page),
			'editUrl' => admin_url('post.php?post=' . intval($page->ID) . '&action=edit'),
			'slug' => $slug,
			'status' => (string) $page->post_status,
		);
	}

	private function public_token($token)
	{
		return array(
			'id' => isset($token['id']) ? (string) $token['id'] : '',
			'name' => isset($token['name']) ? (string) $token['name'] : '',
			'enabled' => !empty($token['enabled']),
			'createdAt' => isset($token['created_at']) ? (string) $token['created_at'] : '',
		);
	}

	private function random_secret()
	{
		if (function_exists('random_bytes')) {
			try {
				return bin2hex(random_bytes(32));
			} catch (Exception $e) {
				// Fall through.
			}
		}
		return wp_generate_password(64, false, false);
	}
}
