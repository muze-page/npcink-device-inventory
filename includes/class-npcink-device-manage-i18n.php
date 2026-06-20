<?php

/**
 * Define the internationalization functionality
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @link       https://www.npc.ink
 * @since      1.0.0
 *
 * @package    Npcink_Device_Manage
 * @subpackage Npcink_Device_Manage/includes
 */

/**
 * Define the internationalization functionality.
 *
 * Loads and defines the internationalization files for this plugin
 * so that it is ready for translation.
 *
 * @since      1.0.0
 * @package    Npcink_Device_Manage
 * @subpackage Npcink_Device_Manage/includes
 * @author     Npcink <1355471563@qq.com>
 */
class Npcink_Device_Manage_I18n
{


	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain()
	{

		load_plugin_textdomain(
			'npcink-device-manage',
			false,
			dirname(dirname(plugin_basename(__FILE__))) . '/languages/'
		);
	}
}
