<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://www.npc.ink
 * @since             2.0.0
 * @package    Npcink_Device_Manage
 *
 * @wordpress-plugin
 * Plugin Name:       Npcink Device Manage
 * Plugin URI:        https://www.npc.ink/277900.html
 * Description:       设备资产管理插件，提供设备录入、客户端上报、后台台账、变更记录和授权查询。
 * Version:           2.6.1083
 * Requires at least: 6.5
 * Tested up to:      7.0
 * Requires PHP:      7.4
 * Author:            Npcink
 * Author URI:        https://www.npc.ink
 * License:           GPL-2.0+
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       npcink-device-manage
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define('NPCINK_DEVICE_MANAGE_VERSION', '2.6.1083');

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-npcink-device-manage-activator.php
 */
function npcink_device_manage_activate()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-npcink-device-manage-activator.php';
	Npcink_Device_Manage_Activator::run();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-npcink-device-manage-deactivator.php
 */
function npcink_device_manage_deactivate()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-npcink-device-manage-deactivator.php';
	Npcink_Device_Manage_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'npcink_device_manage_activate');
register_deactivation_hook(__FILE__, 'npcink_device_manage_deactivate');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'includes/class-npcink-device-manage.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function npcink_device_manage_run()
{

	$plugin = new Npcink_Device_Manage();
	$plugin->run();
}
npcink_device_manage_run();


//设置按钮
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
	$links[] = '<a href="' . get_admin_url(null, 'plugins.php?page=npcink_device_manage_settings') . '">' . __('Settings', 'npcink-device-manage') . '</a>';
	return $links;
});

/**开发用 */
//require plugin_dir_path(__FILE__) . 'index.php';
