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
	private $identity_audit;
	private $identity_reconciliation;

	public function __construct(
		Npcink_Device_Inventory_Asset_Repository $assets,
		Npcink_Device_Inventory_Identity_Repository $identities,
		Npcink_Device_Inventory_Observation_Repository $observations,
		Npcink_Device_Inventory_Event_Repository $events,
		Npcink_Device_Inventory_Event_Service $event_service,
		?Npcink_Device_Inventory_Identity_Audit_Service $identity_audit = null,
		?Npcink_Device_Inventory_Device_Identity_Reconciliation_Service $identity_reconciliation = null
	) {
		$this->assets = $assets;
		$this->identities = $identities;
		$this->observations = $observations;
		$this->events = $events;
		$this->event_service = $event_service;
		$this->identity_audit = $identity_audit;
		$this->identity_reconciliation = $identity_reconciliation;
	}

	public function register_routes()
	{
		register_rest_route(
			'npcink-device-inventory/v1',
			'/analysis/identity-audit',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_identity_audit'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/analysis/device-identity-reconciliation',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_device_identity_reconciliation'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'apply_device_identity_reconciliation'),
					'permission_callback' => array($this, 'admin_permissions_check'),
				),
			)
		);

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
			'/analysis/issue-states',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_issue_states'),
				'permission_callback' => array($this, 'admin_permissions_check'),
			)
		);

		register_rest_route(
			'npcink-device-inventory/v1',
			'/analysis/trends',
			array(
				'methods' => WP_REST_Server::READABLE,
				'callback' => array($this, 'get_analysis_trends'),
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
		$department = isset($params['department']) ? $params['department'] : '';
		$department_check = $this->validate_department($department);
		if (is_wp_error($department_check)) {
			return $department_check;
		}

		$asset = $this->assets->create(
			array(
				'uuid' => isset($params['uuid']) ? $params['uuid'] : '',
				'asset_type' => isset($params['assetType']) ? $params['assetType'] : 'custom',
				'asset_number' => isset($params['assetNumber']) ? $params['assetNumber'] : '',
				'name' => isset($params['name']) ? $params['name'] : '',
				'owner_name' => isset($params['ownerName']) ? $params['ownerName'] : '',
				'department' => $department,
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
		if (array_key_exists('department', $params)) {
			$department_check = $this->validate_department($params['department']);
			if (is_wp_error($department_check)) {
				return $department_check;
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

	public function get_issue_states($request)
	{
		$rows = $this->events->list_issue_state_events();
		$items_by_key = array();
		foreach ($rows as $row) {
			$event = $this->format_event($row);
			$payload = isset($event['payload']) && is_array($event['payload']) ? $event['payload'] : array();
			$issue_key = isset($payload['issueKey']) ? sanitize_text_field((string) $payload['issueKey']) : '';
			if ($issue_key === '' || isset($items_by_key[$issue_key])) {
				continue;
			}
			$event_type = isset($event['eventType']) ? (string) $event['eventType'] : '';
			$items_by_key[$issue_key] = array(
				'issueKey' => $issue_key,
				'state' => $event_type === 'issue_handled' ? 'handled' : 'open',
				'eventType' => $event_type,
				'message' => isset($event['message']) ? (string) $event['message'] : '',
				'createdAt' => isset($event['createdAt']) ? (string) $event['createdAt'] : '',
				'asset' => isset($event['asset']) ? $event['asset'] : null,
			);
		}

		$items = array_values($items_by_key);
		$handled_issue_keys = array_values(
			array_map(
				function ($item) {
					return $item['issueKey'];
				},
				array_filter(
					$items,
					function ($item) {
						return isset($item['state']) && $item['state'] === 'handled';
					}
				)
			)
		);

		return rest_ensure_response(
			array(
				'data' => array(
					'handledIssueKeys' => $handled_issue_keys,
					'items' => $items,
				),
			)
		);
	}

	public function get_analysis_trends($request)
	{
		$days = 30;
		$today = current_time('Y-m-d');
		$start_date = date('Y-m-d', strtotime($today . ' -' . ($days - 1) . ' days'));
		$end_date = date('Y-m-d', strtotime($today . ' +1 day'));
		$start_at = $start_date . ' 00:00:00';
		$end_at = $end_date . ' 00:00:00';
		$collection_by_day = array();
		foreach ($this->observations->daily_counts_between($start_at, $end_at) as $row) {
			$day = isset($row['day']) ? sanitize_text_field((string) $row['day']) : '';
			if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day)) {
				continue;
			}
			$collection_by_day[$day] = intval(isset($row['count']) ? $row['count'] : 0);
		}

		$issue_states_by_day = array();
		foreach ($this->events->daily_issue_state_counts_between($start_at, $end_at) as $row) {
			$day = isset($row['day']) ? sanitize_text_field((string) $row['day']) : '';
			$event_type = isset($row['event_type']) ? sanitize_key((string) $row['event_type']) : '';
			if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || !in_array($event_type, array('issue_handled', 'issue_reopened'), true)) {
				continue;
			}
			if (!isset($issue_states_by_day[$day])) {
				$issue_states_by_day[$day] = array('handled' => 0, 'reopened' => 0);
			}
			$issue_states_by_day[$day][$event_type === 'issue_handled' ? 'handled' : 'reopened'] += intval(isset($row['count']) ? $row['count'] : 0);
		}

		$collection = array();
		$issue_states = array();
		for ($offset = 0; $offset < $days; $offset++) {
			$day = date('Y-m-d', strtotime($start_date . ' +' . $offset . ' days'));
			$handled = isset($issue_states_by_day[$day]['handled']) ? intval($issue_states_by_day[$day]['handled']) : 0;
			$reopened = isset($issue_states_by_day[$day]['reopened']) ? intval($issue_states_by_day[$day]['reopened']) : 0;
			$collection[] = array(
				'date' => $day,
				'count' => isset($collection_by_day[$day]) ? intval($collection_by_day[$day]) : 0,
			);
			$issue_states[] = array(
				'date' => $day,
				'handled' => $handled,
				'reopened' => $reopened,
				'net' => $handled - $reopened,
			);
		}

		return rest_ensure_response(
			array(
				'data' => array(
					'days' => $days,
					'startDate' => $start_date,
					'endDate' => date('Y-m-d', strtotime($end_date . ' -1 day')),
					'collection' => $collection,
					'issueStates' => $issue_states,
				),
			)
		);
	}

	public function get_identity_audit($request)
	{
		if (!$this->identity_audit) {
			return Npcink_Device_Inventory_V3_Response::error('identity_audit_unavailable', 'Identity audit is unavailable.', 503);
		}
		$result = $this->identity_audit->report($request->get_param('page') ?: 1, $request->get_param('pageSize') ?: 20);
		return rest_ensure_response(
			array(
				'data' => array(
					'summary' => $result['summary'],
					'groups' => $result['groups'],
				),
				'pagination' => array(
					'page' => $result['page'],
					'pageSize' => $result['pageSize'],
					'totalItems' => $result['total'],
					'totalPages' => max(1, intval(ceil($result['total'] / $result['pageSize']))),
				),
			)
		);
	}

	public function get_device_identity_reconciliation($request)
	{
		if (!$this->identity_reconciliation) {
			return Npcink_Device_Inventory_V3_Response::error('identity_reconciliation_unavailable', 'Device identity reconciliation is unavailable.', 503);
		}
		$result = $this->identity_reconciliation->preview($request->get_param('page') ?: 1, $request->get_param('pageSize') ?: 50);
		return rest_ensure_response(
			array(
				'data' => array('summary' => $result['summary'], 'items' => $result['items']),
				'pagination' => array(
					'page' => $result['page'],
					'pageSize' => $result['pageSize'],
					'totalItems' => $result['total'],
					'totalPages' => max(1, intval(ceil($result['total'] / $result['pageSize']))),
				),
			)
		);
	}

	public function apply_device_identity_reconciliation($request)
	{
		if (!$this->identity_reconciliation) {
			return Npcink_Device_Inventory_V3_Response::error('identity_reconciliation_unavailable', 'Device identity reconciliation is unavailable.', 503);
		}
		$params = $request->get_json_params();
		if (!is_array($params) || empty($params['confirm'])) {
			return Npcink_Device_Inventory_V3_Response::error('confirmation_required', 'Explicit confirmation is required before writing device identities.', 422);
		}
		return rest_ensure_response(array('data' => $this->identity_reconciliation->apply()));
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

	private function validate_department($department)
	{
		$department = trim(sanitize_text_field((string) $department));
		if ($department === '') {
			return true;
		}
		if (in_array($department, $this->configured_departments(), true)) {
			return true;
		}
		return Npcink_Device_Inventory_V3_Response::error(
			'invalid_department',
			'请选择设置中已有的部门。',
			422
		);
	}

	private function configured_departments()
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
