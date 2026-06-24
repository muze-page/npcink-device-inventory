<?php

class Npcink_Device_Inventory_Admin
{
	private $plugin_name;
	private $version;

	public function __construct($plugin_name, $version)
	{
		$this->plugin_name = $plugin_name;
		$this->version = $version;
		$this->load();
		$this->run();
	}

	public static function load()
	{
		require_once plugin_dir_path(__FILE__) . 'partials/npcink-device-inventory-admin-interface.php';
		require_once plugin_dir_path(__FILE__) . 'partials/npcink-device-inventory-admin-menu.php';
	}

	public function run()
	{
		Npcink_Device_Inventory_Admin_Interface::run();
		Npcink_Device_Inventory_Admin_Menu::run_menu($this->plugin_name, $this->version);
	}
}
