<?php

if (!defined('ABSPATH')) {
	exit;
}

class Npcink_Device_Inventory_V3_Rest
{
	public static function load()
	{
		$base = plugin_dir_path(dirname(dirname(__FILE__))) . 'includes/v3/';
		require_once $base . 'class-npcink-device-inventory-v3-tables.php';
		require_once $base . 'class-npcink-device-inventory-v3-response.php';
		require_once $base . 'class-npcink-device-inventory-v3-sanitizer.php';
		require_once $base . 'repositories/class-npcink-device-inventory-asset-repository.php';
		require_once $base . 'repositories/class-npcink-device-inventory-identity-repository.php';
		require_once $base . 'repositories/class-npcink-device-inventory-observation-repository.php';
		require_once $base . 'repositories/class-npcink-device-inventory-event-repository.php';
		require_once $base . 'services/class-npcink-device-inventory-identity-extractor.php';
		require_once $base . 'services/class-npcink-device-inventory-event-service.php';
		require_once $base . 'services/class-npcink-device-inventory-observation-ingest-service.php';
		require_once $base . 'services/class-npcink-device-inventory-token-auth-service.php';
		require_once $base . 'rest/class-npcink-device-inventory-assets-controller.php';
		require_once $base . 'rest/class-npcink-device-inventory-device-observations-controller.php';
		require_once $base . 'rest/class-npcink-device-inventory-settings-controller.php';
		require_once $base . 'rest/class-npcink-device-inventory-backup-restore-controller.php';
	}

	public static function run()
	{
		self::load();
		add_action('rest_api_init', array(__CLASS__, 'register_routes'));
	}

	public static function register_routes()
	{
		$assets = new Npcink_Device_Inventory_Asset_Repository();
		$identities = new Npcink_Device_Inventory_Identity_Repository();
		$observations = new Npcink_Device_Inventory_Observation_Repository();
		$events = new Npcink_Device_Inventory_Event_Repository();
		$event_service = new Npcink_Device_Inventory_Event_Service($events);
		$extractor = new Npcink_Device_Inventory_Identity_Extractor();
		$auth = new Npcink_Device_Inventory_Token_Auth_Service();
		$ingest = new Npcink_Device_Inventory_Observation_Ingest_Service($assets, $identities, $observations, $event_service, $extractor);

		$assets_controller = new Npcink_Device_Inventory_Assets_Controller($assets, $identities, $observations, $events, $event_service);
		$device_observations_controller = new Npcink_Device_Inventory_Device_Observations_Controller($ingest, $auth);
		$settings_controller = new Npcink_Device_Inventory_Settings_Controller();
		$backup_restore_controller = new Npcink_Device_Inventory_Backup_Restore_Controller();

		$assets_controller->register_routes();
		$device_observations_controller->register_routes();
		$settings_controller->register_routes();
		$backup_restore_controller->register_routes();
	}
}
