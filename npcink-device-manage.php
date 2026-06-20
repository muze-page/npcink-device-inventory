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
 * Description:       Npcink 设备资产管理插件，用于小型公司电脑资产管理，支持数据录入、设备编号、变更记录、部门分组、前后端搜索查询和数据大盘。
 * Version:           2601083
 * Author:            Npcink
 * Author URI:        https://www.npc.ink
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
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
define('NPCINK_DEVICE_MANAGE_VERSION', '2601083');

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-npcink-device-manage-activator.php
 */
function activate_npcink_device_manage()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-npcink-device-manage-activator.php';
	Npcink_Device_Manage_Activator::run();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-npcink-device-manage-deactivator.php
 */
function deactivate_npcink_device_manage()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-npcink-device-manage-deactivator.php';
	Npcink_Device_Manage_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_npcink_device_manage');
register_deactivation_hook(__FILE__, 'deactivate_npcink_device_manage');

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
function run_npcink_device_manage()
{

	$plugin = new Npcink_Device_Manage();
	$plugin->run();
}
run_npcink_device_manage();


//设置按钮
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
	$links[] = '<a href="' . get_admin_url(null, 'plugins.php?page=npcink_device_manage_settings') . '">' . __('设置', 'npcink-device-manage') . '</a>';
	return $links;
});

/**开发用 */
//require plugin_dir_path(__FILE__) . 'index.php';
