<?php
/**
 * Handles Admin UI and React Integration
 */

class CZ_Builder_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	public function register_menu() {
		add_menu_page(
			'Visual Builder',
			'Visual Builder',
			'manage_options',
			'cz-visual-builder',
			array( $this, 'render_admin_page' ),
			'dashicons-layout',
			30
		);
	}

	public function enqueue_assets( $hook ) {
		if ( 'toplevel_page_cz-visual-builder' !== $hook ) {
			return;
		}

		// Enqueue React Editor (Mocking the build file for now)
		wp_enqueue_script(
			'cz-builder-editor',
			CZ_BUILDER_URL . 'build/index.js',
			array( 'wp-element', 'wp-api-fetch' ),
			'1.0.0',
			true
		);

		// Pass Initial Data to React
		wp_localize_script( 'cz-builder-editor', 'czBuilderData', array(
			'apiUrl' => esc_url_raw( rest_url( 'cz-builder/v1' ) ),
			'nonce'  => wp_create_nonce( 'wp_rest' ),
		) );

		wp_enqueue_style(
			'cz-builder-styles',
			CZ_BUILDER_URL . 'assets/builder.css',
			array(),
			'1.0.0'
		);
	}

	public function render_admin_page() {
		echo '<div id="cz-visual-builder-root"></div>';
	}
}
