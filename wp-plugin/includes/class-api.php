<?php
/**
 * REST API for Layout Management
 */

class CZ_Builder_API
{

    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes()
    {
        register_rest_route('cz-builder/v1', '/settings', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_settings'),
                'permission_callback' => array($this, 'check_permission'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'save_settings'),
                'permission_callback' => array($this, 'check_permission'),
            ),
        ));
    }

    public function check_permission()
    {
        return current_user_can('manage_options');
    }

    public function get_settings()
    {
        $settings = get_option('cz_visual_settings', array());
        return rest_ensure_response($settings);
    }

    public function save_settings($request)
    {
        $data = $request->get_json_params();

        if (empty($data)) {
            return new WP_Error('invalid_data', 'No data provided', array('status' => 400));
        }

        update_option('cz_visual_settings', $data);
        return rest_ensure_response(array('success' => true));
    }
}
