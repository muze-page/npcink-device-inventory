<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Settings_Controller
{
	public function register_routes()
	{
		register_rest_route(
			'npcink/v1',
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
			'npcink/v1',
			'/client-tokens',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'create_token'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink/v1',
			'/client-tokens/(?P<id>[a-z0-9]{12})',
			array(
				'methods' => WP_REST_Server::DELETABLE,
				'callback' => array($this, 'delete_token'),
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
		if (array_key_exists('publicQueryEnabled', $params)) {
			$options['public_query_enabled'] = (bool) $params['publicQueryEnabled'];
		}
		if (array_key_exists('observationRetentionDays', $params)) {
			$options['observation_retention_days'] = max(0, intval($params['observationRetentionDays']));
		}
		if (array_key_exists('assetNumberPrefix', $params)) {
			$options['asset_number_prefix'] = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $params['assetNumberPrefix']);
		}

		update_option(Npcink_Device_Inventory_V3_Tables::OPTION, $options);
		return rest_ensure_response(array('data' => $this->public_options($options)));
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
			'publicQueryEnabled' => (bool) $options['public_query_enabled'],
			'observationRetentionDays' => intval($options['observation_retention_days']),
			'assetNumberPrefix' => (string) $options['asset_number_prefix'],
			'clientTokens' => $tokens,
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
