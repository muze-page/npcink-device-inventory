<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Device_Observations_Controller
{
	private $ingest;
	private $auth;

	public function __construct(
		Npcink_Device_Inventory_Observation_Ingest_Service $ingest,
		Npcink_Device_Inventory_Token_Auth_Service $auth
	) {
		$this->ingest = $ingest;
		$this->auth = $auth;
	}

	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/device-observations',
			array(
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array($this, 'create_item'),
				'permission_callback' => array($this, 'permissions_check'),
			)
		);
	}

	public function permissions_check($request)
	{
		if (current_user_can('manage_options')) {
			return true;
		}
		return $this->auth->verify_request($request);
	}

	public function create_item($request)
	{
		$params = $request->get_json_params();
		if (!is_array($params)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_json', 'Request body must be valid JSON.', 400);
		}
		return rest_ensure_response($this->ingest->ingest($params));
	}
}
