<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_Assets_Controller
{
	private $assets;
	private $identities;
	private $observations;
	private $events;
	private $event_service;

	public function __construct(
		Npcink_Device_Inventory_Asset_Repository $assets,
		Npcink_Device_Inventory_Identity_Repository $identities,
		Npcink_Device_Inventory_Observation_Repository $observations,
		Npcink_Device_Inventory_Event_Repository $events,
		Npcink_Device_Inventory_Event_Service $event_service
	) {
		$this->assets = $assets;
		$this->identities = $identities;
		$this->observations = $observations;
		$this->events = $events;
		$this->event_service = $event_service;
	}

	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/assets',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_items'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'create_item'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/assets/(?P<uuid>[A-Za-z0-9_-]+)',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_item'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::EDITABLE,
					'callback' => array($this, 'update_item'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::DELETABLE,
					'callback' => array($this, 'delete_item'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/assets/(?P<uuid>[A-Za-z0-9_-]+)/identities',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_identities'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'create_identity'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/assets/(?P<uuid>[A-Za-z0-9_-]+)/observations',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_observations'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/assets/(?P<uuid>[A-Za-z0-9_-]+)/events',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_events'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'create_event'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/events',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_all_events'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/observations',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_all_observations'),
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

	public function get_items($request)
	{
		$result = $this->assets->list_assets(
			array(
				'page' => $request->get_param('page') ?: 1,
				'pageSize' => $request->get_param('pageSize') ?: 20,
				'search' => $request->get_param('search'),
				'asset_type' => $request->get_param('assetType'),
				'asset_scope' => $request->get_param('assetScope'),
				'status' => $request->get_param('status'),
				'department' => $request->get_param('department'),
				'category' => $request->get_param('category'),
				'purchase_platform' => $request->get_param('purchasePlatform'),
				'sort_by' => $request->get_param('sortBy'),
				'include_deleted' => $request->get_param('includeDeleted'),
			)
		);
		$items = array_map(array($this, 'format_asset'), $result['items']);
		return rest_ensure_response(
			Npcink_Device_Inventory_V3_Response::paginated($items, $result['page'], $result['pageSize'], $result['total'])
		);
	}

	public function create_item($request)
	{
		$params = $request->get_json_params();
		if (!is_array($params)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_json', 'Request body must be valid JSON.', 400);
		}

		$asset = $this->assets->create(
			array(
				'uuid' => isset($params['uuid']) ? $params['uuid'] : '',
				'asset_type' => isset($params['assetType']) ? $params['assetType'] : 'custom',
				'asset_number' => isset($params['assetNumber']) ? $params['assetNumber'] : '',
				'name' => isset($params['name']) ? $params['name'] : '',
				'owner_name' => isset($params['ownerName']) ? $params['ownerName'] : '',
				'department' => isset($params['department']) ? $params['department'] : '',
				'status' => isset($params['status']) ? $params['status'] : 'active',
				'category' => isset($params['category']) ? $params['category'] : '',
				'purchase_price' => isset($params['purchasePrice']) ? $params['purchasePrice'] : 0,
				'residual_value' => isset($params['residualValue']) ? $params['residualValue'] : 0,
				'metadata' => isset($params['metadata']) && is_array($params['metadata']) ? $params['metadata'] : array(),
			)
		);
		if (!$asset) {
			return Npcink_Device_Inventory_V3_Response::error('asset_create_failed', 'Failed to create asset.', 500);
		}
		$this->event_service->record(intval($asset['id']), 'manual', 'created', 'Asset created in admin.');
		return rest_ensure_response(array('data' => $this->format_asset($asset)));
	}

	public function get_item($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		return rest_ensure_response(array('data' => $this->format_asset($asset)));
	}

	public function update_item($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$params = $request->get_json_params();
		if (!is_array($params)) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_json', 'Request body must be valid JSON.', 400);
		}

		$update_data = array();
		$field_map = array(
			'assetType' => 'asset_type',
			'assetNumber' => 'asset_number',
			'name' => 'name',
			'ownerName' => 'owner_name',
			'department' => 'department',
			'status' => 'status',
			'category' => 'category',
			'purchasePrice' => 'purchase_price',
			'residualValue' => 'residual_value',
			'metadata' => 'metadata_json',
		);
		foreach ($field_map as $input_field => $storage_field) {
			if (array_key_exists($input_field, $params)) {
				$update_data[$storage_field] = $params[$input_field];
			}
		}

		$updated = $this->assets->update($asset['uuid'], $update_data);
		if (!$updated) {
			return Npcink_Device_Inventory_V3_Response::error('asset_update_failed', 'Failed to update asset.', 500);
		}
		$this->event_service->record(intval($asset['id']), 'manual', 'updated', 'Asset updated in admin.');
		return rest_ensure_response(array('data' => $this->format_asset($updated)));
	}

	public function delete_item($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$updated = $this->assets->update($asset['uuid'], array('status' => 'deleted'));
		$this->event_service->record(intval($asset['id']), 'manual', 'deleted', 'Asset marked as deleted.');
		return rest_ensure_response(array('data' => $this->format_asset($updated)));
	}

	public function get_identities($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$items = $this->identities->list_for_asset(intval($asset['id']));
		return rest_ensure_response(array('data' => array_map(array($this, 'format_identity'), $items)));
	}

	public function create_identity($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$params = $request->get_json_params();
		if (!is_array($params) || empty($params['type']) || empty($params['value'])) {
			return Npcink_Device_Inventory_V3_Response::error('invalid_identity', 'Identity type and value are required.', 422);
		}
		$this->identities->add(
			intval($asset['id']),
			array(
				'type' => $params['type'],
				'value' => $params['value'],
				'confidence' => isset($params['confidence']) ? $params['confidence'] : 100,
				'source' => 'manual',
			),
			!empty($params['isPrimary'])
		);
		$this->event_service->record(intval($asset['id']), 'manual', 'identity_added', 'Asset identity added in admin.');
		$items = $this->identities->list_for_asset(intval($asset['id']));
		return rest_ensure_response(array('data' => array_map(array($this, 'format_identity'), $items)));
	}

	public function get_observations($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$result = $this->observations->list_for_asset(intval($asset['id']), $request->get_param('page') ?: 1, $request->get_param('pageSize') ?: 20);
		$items = array_map(array($this, 'format_observation'), $result['items']);
		return rest_ensure_response(
			Npcink_Device_Inventory_V3_Response::paginated($items, $result['page'], $result['pageSize'], $result['total'])
		);
	}

	public function get_events($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$result = $this->events->list_for_asset(intval($asset['id']), $request->get_param('page') ?: 1, $request->get_param('pageSize') ?: 20);
		$items = array_map(array($this, 'format_event'), $result['items']);
		return rest_ensure_response(
			Npcink_Device_Inventory_V3_Response::paginated($items, $result['page'], $result['pageSize'], $result['total'])
		);
	}

	public function get_all_events($request)
	{
		$result = $this->events->list_all(
			array(
				'page' => $request->get_param('page') ?: 1,
				'pageSize' => $request->get_param('pageSize') ?: 20,
				'event_mode' => $request->get_param('eventMode'),
				'event_source' => $request->get_param('eventSource'),
				'event_type' => $request->get_param('eventType'),
				'search' => $request->get_param('search'),
			)
		);
		$items = array_map(array($this, 'format_event'), $result['items']);
		return rest_ensure_response(
			Npcink_Device_Inventory_V3_Response::paginated($items, $result['page'], $result['pageSize'], $result['total'])
		);
	}

	public function get_all_observations($request)
	{
		$result = $this->observations->list_all(
			array(
				'page' => $request->get_param('page') ?: 1,
				'pageSize' => $request->get_param('pageSize') ?: 20,
				'source' => $request->get_param('source'),
				'search' => $request->get_param('search'),
			)
		);
		$items = array_map(array($this, 'format_observation'), $result['items']);
		return rest_ensure_response(
			Npcink_Device_Inventory_V3_Response::paginated($items, $result['page'], $result['pageSize'], $result['total'])
		);
	}

	public function create_event($request)
	{
		$asset = $this->asset_from_request($request);
		if (is_wp_error($asset)) {
			return $asset;
		}
		$params = $request->get_json_params();
		if (!is_array($params) || !isset($params['message']) || !is_scalar($params['message']) || trim((string) $params['message']) === '') {
			return Npcink_Device_Inventory_V3_Response::error('invalid_event', 'Event message is required.', 422);
		}
		$this->event_service->record(
			intval($asset['id']),
			'manual',
			isset($params['eventType']) ? sanitize_key($params['eventType']) : 'note',
			sanitize_textarea_field((string) $params['message']),
			isset($params['payload']) && is_array($params['payload']) ? $params['payload'] : array()
		);
		return rest_ensure_response(array('data' => array('success' => true)));
	}

	private function asset_from_request($request)
	{
		$uuid = sanitize_text_field((string) $request['uuid']);
		$asset = $this->assets->find_by_uuid($uuid);
		if (!$asset) {
			return Npcink_Device_Inventory_V3_Response::error('asset_not_found', 'Asset not found.', 404);
		}
		return $asset;
	}

	public function format_asset($row)
	{
		if (!$row) {
			return null;
		}

		$item = array(
			'id' => intval($row['id']),
			'uuid' => (string) $row['uuid'],
			'assetType' => (string) $row['asset_type'],
			'assetNumber' => (string) $row['asset_number'],
			'name' => (string) $row['name'],
			'ownerName' => (string) $row['owner_name'],
			'department' => (string) $row['department'],
			'status' => (string) $row['status'],
			'category' => (string) $row['category'],
			'purchasePrice' => floatval($row['purchase_price']),
			'residualValue' => floatval($row['residual_value']),
			'metadata' => $this->decode_json(isset($row['metadata_json']) ? $row['metadata_json'] : '', array()),
			'createdAt' => (string) $row['created_at'],
			'updatedAt' => (string) $row['updated_at'],
		);
		if (array_key_exists('latest_summary_json', $row)) {
			$item['latestObservation'] = array(
				'summary' => $this->decode_json(isset($row['latest_summary_json']) ? $row['latest_summary_json'] : '', array()),
				'hardware' => $this->decode_json(isset($row['latest_hardware_json']) ? $row['latest_hardware_json'] : '', array()),
				'observedAt' => $this->format_utc_datetime(isset($row['latest_observed_at']) ? $row['latest_observed_at'] : ''),
				'source' => isset($row['latest_observation_source']) ? (string) $row['latest_observation_source'] : '',
			);
		}
		return $item;
	}

	private function format_identity($row)
	{
		return array(
			'id' => intval($row['id']),
			'assetId' => intval($row['asset_id']),
			'identityType' => (string) $row['identity_type'],
			'identityValue' => (string) $row['identity_value'],
			'confidence' => floatval($row['confidence']),
			'isPrimary' => intval($row['is_primary']) === 1,
			'source' => (string) $row['source'],
			'createdAt' => (string) $row['created_at'],
		);
	}

	private function format_observation($row)
	{
		$item = array(
			'id' => intval($row['id']),
			'assetId' => intval($row['asset_id']),
			'source' => (string) $row['source'],
			'schemaVersion' => intval($row['schema_version']),
			'observedAt' => $this->format_utc_datetime(isset($row['observed_at']) ? $row['observed_at'] : ''),
			'receivedAt' => (string) $row['received_at'],
			'summary' => $this->decode_json(isset($row['summary_json']) ? $row['summary_json'] : '', array()),
			'hardware' => $this->decode_json(isset($row['hardware_json']) ? $row['hardware_json'] : '', array()),
			'raw' => $this->decode_json(isset($row['raw_json']) ? $row['raw_json'] : '', array()),
		);
		if (isset($row['asset_uuid'])) {
			$item['asset'] = $this->format_asset_reference($row);
		}
		return $item;
	}

	private function format_event($row)
	{
		$item = array(
			'id' => intval($row['id']),
			'assetId' => isset($row['asset_id']) ? intval($row['asset_id']) : null,
			'eventSource' => (string) $row['event_source'],
			'eventType' => (string) $row['event_type'],
			'fieldName' => isset($row['field_name']) ? (string) $row['field_name'] : '',
			'oldValue' => isset($row['old_value']) ? (string) $row['old_value'] : '',
			'newValue' => isset($row['new_value']) ? (string) $row['new_value'] : '',
			'message' => isset($row['message']) ? (string) $row['message'] : '',
			'actorUserId' => isset($row['actor_user_id']) ? intval($row['actor_user_id']) : null,
			'actorName' => isset($row['actor_name']) ? (string) $row['actor_name'] : '',
			'payload' => $this->decode_json(isset($row['payload_json']) ? $row['payload_json'] : '', array()),
			'createdAt' => (string) $row['created_at'],
		);
		if (isset($row['asset_uuid'])) {
			$item['asset'] = $this->format_asset_reference($row);
		}
		return $item;
	}

	private function format_utc_datetime($value)
	{
		$value = trim((string) $value);
		if ($value === '') {
			return '';
		}
		return str_replace(' ', 'T', $value) . 'Z';
	}

	private function format_asset_reference($row)
	{
		return array(
			'uuid' => isset($row['asset_uuid']) ? (string) $row['asset_uuid'] : '',
			'assetNumber' => isset($row['asset_number']) ? (string) $row['asset_number'] : '',
			'name' => isset($row['asset_name']) ? (string) $row['asset_name'] : '',
			'assetType' => isset($row['asset_type']) ? (string) $row['asset_type'] : '',
			'status' => isset($row['status']) ? (string) $row['status'] : '',
			'department' => isset($row['department']) ? (string) $row['department'] : '',
			'ownerName' => isset($row['owner_name']) ? (string) $row['owner_name'] : '',
		);
	}

	private function decode_json($value, $fallback)
	{
		if (!is_string($value) || $value === '') {
			return $fallback;
		}

		$decoded = json_decode($value, true);
		if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
			return $fallback;
		}

		return $decoded;
	}
}
