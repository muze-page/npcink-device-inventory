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
 * @since             1.0.0
 * @package           Dema
 *
 * @wordpress-plugin
 * Plugin Name:       魔法电脑设备管理
 * Plugin URI:        https://www.npc.ink
 * Description:       用于硬件设备管理用
 * Version:           1.0.6
 * Author:            Npcink
 * Author URI:        https://www.npc.ink
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       dema
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
define('DEMA_VERSION', '1.0.6');

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-dema-activator.php
 */
function activate_dema()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-dema-activator.php';
	Dema_Activator::run();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-dema-deactivator.php
 */
function deactivate_dema()
{
	require_once plugin_dir_path(__FILE__) . 'includes/class-dema-deactivator.php';
	Dema_Deactivator::deactivate();
}

register_activation_hook(__FILE__, 'activate_dema');
register_deactivation_hook(__FILE__, 'deactivate_dema');

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require plugin_dir_path(__FILE__) . 'includes/class-dema.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_dema()
{

	$plugin = new Dema();
	$plugin->run();
}
run_dema();


//设置按钮
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
	$links[] = '<a href="' . get_admin_url(null, 'plugins.php?page=dema_seting') . '">' . __('设置', 'n') . '</a>';
	return $links;
});

/**开发用 */
require plugin_dir_path(__FILE__) . 'index.php';
