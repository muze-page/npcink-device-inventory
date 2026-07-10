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

function current_time($type)
{
	return $type === 'Y-m-d' ? '2026-07-10' : '2026-07-10 12:00:00';
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

class Npcink_Trend_Observation_Repository extends Npcink_Device_Inventory_Observation_Repository
{
	public function daily_counts_between($start_at, $end_at)
	{
		return array(
			array('day' => '2026-06-11', 'count' => 2),
			array('day' => '2026-07-09', 'count' => 5),
		);
	}
}

class Npcink_Trend_Event_Repository extends Npcink_Device_Inventory_Event_Repository
{
	public function daily_issue_state_counts_between($start_at, $end_at)
	{
		return array(
			array('day' => '2026-07-08', 'event_type' => 'issue_handled', 'count' => 3),
			array('day' => '2026-07-08', 'event_type' => 'issue_reopened', 'count' => 1),
			array('day' => '2026-07-09', 'event_type' => 'issue_reopened', 'count' => 2),
		);
	}
}

function npcink_analysis_trend_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Analysis trend fixture failed: {$message}\n");
		exit(1);
	}
}

$observations = new Npcink_Trend_Observation_Repository();
$events = new Npcink_Trend_Event_Repository();
$controller = new Npcink_Device_Inventory_Assets_Controller(
	new Npcink_Device_Inventory_Asset_Repository(),
	new Npcink_Device_Inventory_Identity_Repository(),
	$observations,
	$events,
	new Npcink_Device_Inventory_Event_Service($events)
);

$response = $controller->get_analysis_trends(null);
npcink_analysis_trend_assert($response instanceof WP_REST_Response, 'expected REST response');
$data = $response->get_data();
$payload = isset($data['data']) && is_array($data['data']) ? $data['data'] : array();

npcink_analysis_trend_assert(isset($payload['days']) && intval($payload['days']) === 30, 'expected a fixed 30-day window');
npcink_analysis_trend_assert(($payload['startDate'] ?? '') === '2026-06-11', 'unexpected trend start date');
npcink_analysis_trend_assert(($payload['endDate'] ?? '') === '2026-07-10', 'unexpected trend end date');
npcink_analysis_trend_assert(isset($payload['collection']) && count($payload['collection']) === 30, 'collection series must include empty days');
npcink_analysis_trend_assert(isset($payload['issueStates']) && count($payload['issueStates']) === 30, 'issue state series must include empty days');
npcink_analysis_trend_assert($payload['collection'][0]['count'] === 2, 'collection count should preserve the first day');
npcink_analysis_trend_assert($payload['collection'][28]['count'] === 5, 'collection count should preserve a later day');
npcink_analysis_trend_assert($payload['issueStates'][27]['handled'] === 3, 'handled count should be grouped by date');
npcink_analysis_trend_assert($payload['issueStates'][27]['net'] === 2, 'net state change should be handled minus reopened');
npcink_analysis_trend_assert($payload['issueStates'][28]['net'] === -2, 'reopened states should produce a negative net change');

echo "Analysis trend fixture checks passed.\n";
