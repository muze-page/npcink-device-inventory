<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://www.npc.ink
 * @since      1.0.0
 *
 * @package    Dema
 * @subpackage Dema/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Dema
 * @subpackage Dema/admin
 * @author     Npcink <1355471563@qq.com>
 */
class Dema_Admin
{

	/**
	 * The ID of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $plugin_name    The ID of this plugin.
	 */
	private $plugin_name;

	/**
	 * The version of this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 * @var      string    $version    The current version of this plugin.
	 */
	private $version;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since    1.0.0
	 * @param      string    $plugin_name       The name of this plugin.
	 * @param      string    $version    The version of this plugin.
	 */
	public function __construct($plugin_name, $version)
	{

		$this->plugin_name = $plugin_name;
		$this->version = $version;
		$this->load(); //加载所需文件
		$this->run(); //运行
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles()
	{

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Dema_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Dema_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/dema-admin.css', array(), $this->version, 'all');
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts()
	{

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Dema_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Dema_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/dema-admin.js', array('jquery'), $this->version, false);
	}
	/**
	 * 载入文件
	 */
	public static function load()
	{
		//接口文件
		require_once plugin_dir_path(__FILE__) . 'partials/dema-admin-interface.php';
		
		//菜单
		require_once plugin_dir_path(__FILE__) . 'partials/dema-admin-menu.php';

		//自定义页面
		require_once plugin_dir_path(__FILE__) . 'partials/dema-admin-add-page.php';
	}
	public  function run()
	{
		//添加接口
		DEMA_Admin_Interface::run();

		//添加菜单
		DEMA_Admin_Menu::run($this->plugin_name, $this->version);

		//添加自定义页面
		DEMA_Admin_Add_Page::runs();
	}
}
