<?php
/**
 * Plugin Name: Console Zone Visual Builder
 * Plugin URI:  https://consolezone.com/
 * Description: A Photoshop-style, layer-based visual editor for WordPress.
 * Version:     1.0.0
 * Author:      DeepMind Antigravity
 * Text Domain: cz-visual-builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define Constants
define( 'CZ_BUILDER_PATH', plugin_dir_path( __FILE__ ) );
define( 'CZ_BUILDER_URL', plugin_dir_url( __FILE__ ) );

// Include Core Classes
require_once CZ_BUILDER_PATH . 'includes/class-api.php';
require_once CZ_BUILDER_PATH . 'includes/class-admin.php';
require_once CZ_BUILDER_PATH . 'includes/class-renderer.php';

// Initialize Plugin
function cz_builder_init() {
	new CZ_Builder_API();
	new CZ_Builder_Admin();
}
add_action( 'plugins_loaded', 'cz_builder_init' );

// Register Activation Hook
register_activation_hook( __FILE__, 'cz_builder_activate' );
function cz_builder_activate() {
	// Initialize default settings if needed
}
