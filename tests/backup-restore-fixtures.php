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

	public function get_error_message()
	{
		return $this->message;
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

class WP_REST_Request
{
	private $body = '';
	private $params = array();
	private $headers = array();

	public function set_body($body)
	{
		$this->body = $body;
		$this->params = json_decode($body, true);
	}

	public function get_body()
	{
		return $this->body;
	}

	public function get_json_params()
	{
		return $this->params;
	}

	public function set_header($key, $value)
	{
		$this->headers[strtolower($key)] = $value;
	}

	public function get_header($key)
	{
		return isset($this->headers[strtolower($key)]) ? $this->headers[strtolower($key)] : '';
	}
}

class WP_REST_Server
{
	const CREATABLE = 'POST';
}

class Npcink_Test_Wpdb
{
	public $prefix = 'wp_';
	public $insert_id = 1000;
	public $rows = array(
		'assets_by_uuid' => array(),
		'assets_by_number' => array(),
		'identities' => array(),
	);
	private $last_query = '';
	private $last_args = array();

	public function prepare($query, ...$args)
	{
		$this->last_query = $query;
		$this->last_args = $args;
		return $query;
	}

	public function get_row($query, $format = null)
	{
		$key = isset($this->last_args[1]) ? (string) $this->last_args[1] : '';
		if (strpos($query, 'uuid =') !== false && isset($this->rows['assets_by_uuid'][$key])) {
			return $this->rows['assets_by_uuid'][$key];
		}
		if (strpos($query, 'asset_number =') !== false && isset($this->rows['assets_by_number'][$key])) {
			return $this->rows['assets_by_number'][$key];
		}
		return null;
	}

	public function get_var($query)
	{
		if (strpos($query, 'identity_type') !== false) {
			$key = (isset($this->last_args[1]) ? $this->last_args[1] : '') . "\0" . (isset($this->last_args[2]) ? $this->last_args[2] : '');
			return isset($this->rows['identities'][$key]) ? $this->rows['identities'][$key] : null;
		}
		return null;
	}

	public function insert($table, $data, $formats = array())
	{
		$this->insert_id++;
		return 1;
	}

	public function update($table, $data, $where, $formats = array(), $where_formats = array())
	{
		return 1;
	}

	public function query($query)
	{
		return true;
	}
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

function sanitize_title($value)
{
	return sanitize_key(str_replace(' ', '-', (string) $value));
}

function wp_json_encode($value)
{
	return json_encode($value);
}

function current_time($type)
{
	return '2026-07-06 00:00:00';
}

function wp_generate_uuid4()
{
	static $index = 0;
	$index++;
	return sprintf('00000000-0000-4000-8000-%012d', $index);
}

function is_wp_error($value)
{
	return $value instanceof WP_Error;
}

function rest_ensure_response($value)
{
	return $value instanceof WP_REST_Response ? $value : new WP_REST_Response($value);
}

function get_option($name, $fallback = false)
{
	return $fallback;
}

function update_option($name, $value)
{
	return true;
}

function wp_cache_get($key, $group = '')
{
	return 0;
}

function wp_cache_set($key, $value, $group = '')
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

require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-tables.php';
require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-response.php';
require_once __DIR__ . '/../includes/v3/class-npcink-device-inventory-v3-sanitizer.php';
require_once __DIR__ . '/../includes/v3/rest/class-npcink-device-inventory-backup-restore-controller.php';

$wpdb = new Npcink_Test_Wpdb();

function npcink_request($backup, $dry_run)
{
	$request = new WP_REST_Request();
	$body = wp_json_encode(array('backup' => $backup, 'dryRun' => $dry_run));
	$request->set_body($body);
	$request->set_header('content-length', strlen($body));
	return $request;
}

function npcink_restore($backup, $dry_run = true)
{
	$controller = new Npcink_Device_Inventory_Backup_Restore_Controller();
	return $controller->restore_backup(npcink_request($backup, $dry_run));
}

function npcink_assert($condition, $message)
{
	if (!$condition) {
		fwrite(STDERR, "Backup restore fixture failed: {$message}\n");
		exit(1);
	}
}

function npcink_data($response)
{
	npcink_assert($response instanceof WP_REST_Response, 'expected REST response');
	return $response->get_data();
}

$base_backup = array(
	'schema' => 'npcink-device-inventory/v3-admin-export',
	'exportedAt' => '2026-07-06T00:00:00+00:00',
	'assets' => array(
		array(
			'id' => 10,
			'uuid' => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			'assetNumber' => 'RESTORE-FIXTURE-001',
			'name' => 'Restore Fixture Asset',
		),
	),
);

$duplicate_asset = $base_backup;
$duplicate_asset['assets'][] = array(
	'id' => 11,
	'uuid' => 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	'assetNumber' => 'RESTORE-FIXTURE-001',
	'name' => 'Duplicate Number',
);
$response = npcink_restore($duplicate_asset, true);
$summary = npcink_data($response)['data']['summary'];
npcink_assert(!empty($summary['conflicts']), 'dry-run should return conflict details without failing');

$response = npcink_restore($duplicate_asset, false);
npcink_assert($response instanceof WP_Error, 'real import with preview conflict should fail');
npcink_assert($response->get_error_code() === 'backup_conflicts', 'real import conflict should use backup_conflicts');
npcink_assert(isset($response->get_error_data()['status']) && $response->get_error_data()['status'] === 409, 'real import conflict should return 409');

$oversized_identities = $base_backup;
$oversized_identities['identities'] = array(
	array(
		'assetNumber' => 'RESTORE-FIXTURE-001',
		'identities' => array_fill(0, 10001, array('identityType' => 'serial', 'identityValue' => 'SERIAL')),
	),
);
$response = npcink_restore($oversized_identities, true);
npcink_assert($response instanceof WP_Error, 'oversized nested identities should fail validation');
npcink_assert(isset($response->get_error_data()['status']) && $response->get_error_data()['status'] === 413, 'oversized nested identities should return 413');

$duplicate_identity = $base_backup;
$duplicate_identity['identities'] = array(
	array(
		'assetNumber' => 'RESTORE-FIXTURE-001',
		'identities' => array(
			array('identityType' => 'serial', 'identityValue' => 'DUPLICATE-SERIAL'),
			array('identityType' => 'serial', 'identityValue' => 'DUPLICATE-SERIAL'),
		),
	),
);
$response = npcink_restore($duplicate_identity, true);
$summary = npcink_data($response)['data']['summary'];
npcink_assert($summary['planned']['identitiesCreated'] === 1, 'duplicate identity should only plan one insert');
npcink_assert($summary['skipped']['identities'] === 1, 'duplicate identity should skip duplicate row');

$missing_uuid = $base_backup;
unset($missing_uuid['assets'][0]['uuid']);
$missing_uuid['identities'] = array(
	array(
		'assetNumber' => 'RESTORE-FIXTURE-001',
		'identities' => array(
			array('identityType' => 'serial', 'identityValue' => 'MISSING-UUID-SERIAL'),
		),
	),
);
$response = npcink_restore($missing_uuid, true);
$summary = npcink_data($response)['data']['summary'];
npcink_assert($summary['planned']['assetsCreated'] === 1, 'missing UUID asset should still be planned for creation');
npcink_assert($summary['planned']['identitiesCreated'] === 1, 'identity should attach to missing-UUID asset by asset number during dry-run');
npcink_assert(!empty($summary['warnings']), 'missing UUID should produce a warning');

$bad_schema = $base_backup;
$bad_schema['schema'] = 'wrong';
$response = npcink_restore($bad_schema, true);
npcink_assert($response instanceof WP_Error, 'bad schema should fail validation');
npcink_assert(isset($response->get_error_data()['status']) && $response->get_error_data()['status'] === 422, 'bad schema should return 422');

echo "Backup restore fixture checks passed.\n";
