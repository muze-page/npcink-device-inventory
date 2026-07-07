<?php

define('ABSPATH', __DIR__ . '/');
define('ARRAY_A', 'ARRAY_A');

class WP_Error
{
	private $code;
	private $message;
	private $data;

	public function __construct($code, $message = '', $data = array())
	{
		$this->code = $code;
		$this->message = $message;
		$this->data = $data;
	}

	public function get_error_code()
	{
		return $this->code;
	}

	public function get_error_data()
	{
		return $this->data;
	}
}

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

class Npcink_Public_Query_Request
{
	private $params;

	public function __construct($params)
	{
		$this->params = $params;
	}

	public function get_param($key)
	{
		return isset($this->params[$key]) ? $this->params[$key] : null;
	}
}

class Npcink_Public_Query_Wpdb
{
	public $prefix = 'wp_';
	public $queries = array();
	private $last_args = array();

	public function esc_like($value)
	{
		return addcslashes((string) $value, '_%\\');
	}

	public function prepare($query, ...$args)
	{
		$this->queries[] = array('query' => $query, 'args' => $args);
		$this->last_args = $args;
		return $query;
	}

	public function get_results($query, $format = null)
	{
		$keyword = isset($this->last_args[3]) ? (string) $this->last_args[3] : '';
		if ($keyword !== 'ASSET-001') {
			return array();
		}

		return array(
			array(
				'asset_number' => 'ASSET-001',
				'name' => 'MacBook Pro',
				'department' => 'IT',
				'status' => 'active',
				'category' => 'computer',
				'updated_at' => '2026-07-07 10:00:00',
				'metadata_json' => '{}',
				'latest_summary_json' => '{}',
				'latest_hardware_json' => '{}',
			),
		);
	}
}

class Npcink_Device_Inventory_V3_Tables
{
	public static $options = array();

	public static function options()
	{
		return self::$options;
	}

	public static function assets()
	{
		return 'wp_npcink_assets';
	}

	public static function observations()
	{
		return 'wp_npcink_observations';
	}
}

$npcink_public_query_transients = array();

function npcink_public_query_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Public query fixture failed: {$message}\n");
		exit(1);
	}
}

function npcink_public_query_request($params)
{
	return new Npcink_Public_Query_Request($params);
}

function npcink_public_query_error($response)
{
	npcink_public_query_assert($response instanceof WP_Error, 'expected WP_Error response');
	return $response->get_error_code();
}

function npcink_public_query_options($enabled, $hash = '')
{
	Npcink_Device_Inventory_V3_Tables::$options = array(
		'public_query_enabled' => $enabled,
		'public_query_access_code_hash' => $hash,
	);
}

function is_wp_error($value)
{
	return $value instanceof WP_Error;
}

function rest_ensure_response($value)
{
	return $value instanceof WP_REST_Response ? $value : new WP_REST_Response($value);
}

function wp_check_password($password, $hash)
{
	return hash_equals((string) $hash, 'hash:' . (string) $password);
}

function get_transient($key)
{
	global $npcink_public_query_transients;
	return isset($npcink_public_query_transients[$key]) ? $npcink_public_query_transients[$key] : false;
}

function set_transient($key, $value, $expiration = 0)
{
	global $npcink_public_query_transients;
	$npcink_public_query_transients[$key] = $value;
	return true;
}

function sanitize_text_field($value)
{
	return trim((string) $value);
}

function wp_unslash($value)
{
	return $value;
}

function mysql2date($format, $date)
{
	return date($format, strtotime($date));
}

require_once __DIR__ . '/../includes/class-npcink-device-inventory-public.php';

$wpdb = new Npcink_Public_Query_Wpdb();
$controller = new Npcink_Device_Inventory_Public();
$_SERVER['REMOTE_ADDR'] = '203.0.113.10';

npcink_public_query_options(false, '');
npcink_public_query_assert(
	npcink_public_query_error($controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001')))) === 'public_query_disabled',
	'disabled public query must reject requests'
);

npcink_public_query_options(true, '');
npcink_public_query_assert(
	npcink_public_query_error($controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001')))) === 'public_query_access_code_required',
	'enabled public query without access code must reject requests'
);

npcink_public_query_options(true, 'hash:secret');
npcink_public_query_assert(
	npcink_public_query_error($controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001', 'accessCode' => 'wrong')))) === 'invalid_access_code',
	'invalid access code must reject requests'
);

for ($index = 0; $index < Npcink_Device_Inventory_Public::PUBLIC_QUERY_RATE_LIMIT; $index++) {
	$controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001', 'accessCode' => 'wrong')));
}
npcink_public_query_assert(
	npcink_public_query_error($controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001', 'accessCode' => 'wrong')))) === 'public_query_rate_limited',
	'public query must rate limit repeated attempts'
);

$npcink_public_query_transients = array();
$response = $controller->query_assets(npcink_public_query_request(array('keyword' => 'ASSET-001', 'accessCode' => 'secret')));
npcink_public_query_assert($response instanceof WP_REST_Response, 'valid access code should return REST response');
$data = $response->get_data();
npcink_public_query_assert(isset($data['data'][0]['assetNumber']) && $data['data'][0]['assetNumber'] === 'ASSET-001', 'valid query should return public asset payload');

echo "Public query fixture checks passed.\n";
