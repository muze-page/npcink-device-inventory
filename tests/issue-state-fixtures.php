<?php

define('ABSPATH', __DIR__ . '/');
define('ARRAY_A', 'ARRAY_A');

class WP_REST_Response
{
	private $data;

	public function __construct($data)
	{
		$this->data = $data;
	}

	public function get_data()
	{
		return $this->data;
	}
}

class WP_REST_Server
{
	const READABLE = 'GET';
}

class Npcink_Issue_State_Wpdb
{
	public $prefix = 'wp_';
	public $rows = array();
	public $last_query = '';

	public function prepare($query, ...$args)
	{
		$this->last_query = $query;
		return $query;
	}

	public function get_results($query, $format = null)
	{
		return $this->rows;
	}
}

function rest_ensure_response($value)
{
	return $value instanceof WP_REST_Response ? $value : new WP_REST_Response($value);
}

function sanitize_text_field($value)
{
	return trim((string) $value);
}

function sanitize_textarea_field($value)
{
	return trim((string) $value);
}

function sanitize_key($value)
{
	return strtolower(preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $value));
}

function wp_json_encode($value)
{
	return json_encode($value);
}

function wp_cache_get($key, $group = '')
{
	return false;
}

function wp_cache_set($key, $value, $group = '', $expiration = 0)
{
	return true;
}

function current_user_can($capability)
{
	return true;
}

function register_rest_route($namespace, $route, $args)
{
	return true;
}

function is_wp_error($value)
{
	return false;
}

require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-tables.php';
require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-response.php';
require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-sanitizer.php';
require_once __DIR__ . '/../includes/v3/repositories/class-npcink-device-inventory-asset-repository.php';
require_once __DIR__ . '/../includes/v3/repositories/class-npcink-device-inventory-identity-repository.php';
require_once __DIR__ . '/../includes/v3/repositories/class-npcink-device-inventory-observation-repository.php';
require_once __DIR__ . '/../includes/v3/repositories/class-npcink-device-inventory-event-repository.php';
require_once __DIR__ . '/../includes/v3/services/class-npcink-device-inventory-event-service.php';
require_once __DIR__ . '/../includes/v3/rest/class-npcink-device-inventory-assets-controller.php';

function npcink_issue_state_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Issue state fixture failed: {$message}\n");
		exit(1);
	}
}

function npcink_issue_event($id, $event_type, $issue_key, $created_at)
{
	return array(
		'id' => $id,
		'asset_id' => 10,
		'event_source' => 'manual',
		'event_type' => $event_type,
		'field_name' => '',
		'old_value' => '',
		'new_value' => '',
		'message' => $event_type === 'issue_reopened' ? '恢复未处理' : '已处理',
		'actor_user_id' => null,
		'actor_name' => 'Admin',
		'payload_json' => wp_json_encode(
			array(
				'issueKey' => $issue_key,
				'issueType' => '部门待分配',
				'issueMessage' => '需要分配到具体部门',
			)
		),
		'created_at' => $created_at,
		'asset_uuid' => 'asset-001',
		'asset_number' => 'A-001',
		'asset_name' => '测试资产',
		'asset_type' => 'pc',
		'status' => 'active',
		'department' => '未分配',
		'owner_name' => '',
	);
}

$wpdb = new Npcink_Issue_State_Wpdb();
$wpdb->rows = array(
	npcink_issue_event(3, 'issue_reopened', 'asset-001-missing-department', '2026-07-09 12:00:00'),
	npcink_issue_event(2, 'issue_handled', 'asset-002-missing-owner', '2026-07-09 11:00:00'),
	npcink_issue_event(1, 'issue_handled', 'asset-001-missing-department', '2026-07-09 10:00:00'),
);

$events = new Npcink_Device_Inventory_Event_Repository();
$controller = new Npcink_Device_Inventory_Assets_Controller(
	new Npcink_Device_Inventory_Asset_Repository(),
	new Npcink_Device_Inventory_Identity_Repository(),
	new Npcink_Device_Inventory_Observation_Repository(),
	$events,
	new Npcink_Device_Inventory_Event_Service($events)
);

$response = $controller->get_issue_states(null);
npcink_issue_state_assert($response instanceof WP_REST_Response, 'expected REST response');
$data = $response->get_data();
$payload = isset($data['data']) && is_array($data['data']) ? $data['data'] : array();

npcink_issue_state_assert(isset($payload['handledIssueKeys']) && is_array($payload['handledIssueKeys']), 'handled keys missing');
npcink_issue_state_assert(in_array('asset-002-missing-owner', $payload['handledIssueKeys'], true), 'handled issue should be included');
npcink_issue_state_assert(!in_array('asset-001-missing-department', $payload['handledIssueKeys'], true), 'reopened issue should not be handled');
npcink_issue_state_assert(isset($payload['items']) && count($payload['items']) === 2, 'latest state should collapse duplicate issue keys');
npcink_issue_state_assert(strpos($wpdb->last_query, 'NOT EXISTS') !== false, 'issue state query must select the latest event per issue key');
npcink_issue_state_assert(strpos($wpdb->last_query, 'LIMIT 5000') === false, 'issue state correctness must not depend on a history cap');

echo "Issue state fixture checks passed.\n";
