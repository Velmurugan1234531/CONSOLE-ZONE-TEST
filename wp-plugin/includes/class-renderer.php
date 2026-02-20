<?php
/**
 * Handles Frontend Rendering of Layouts
 */

class CZ_Builder_Renderer
{

    public function __construct()
    {
        // Use a shortcode or hook into 'the_content'
        add_shortcode('cz_builder_canvas', array($this, 'render_canvas'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
    }

    public function enqueue_frontend_assets()
    {
        // Only enqueue if we are on a page where the builder is needed
        wp_enqueue_style(
            'cz-builder-frontend',
            CZ_BUILDER_URL . 'assets/frontend.css',
            array(),
            '1.0.0'
        );

        // If we need animations/interactivity on frontend
        wp_enqueue_script(
            'framer-motion-mini',
            'https://unpkg.com/framer-motion@11.0.0/dist/framer-motion.js',
            array(),
            '11.0.0',
            true
        );
    }

    public function render_canvas($atts)
    {
        $atts = shortcode_atts(array(
            'page' => 'home',
        ), $atts);

        $settings = get_option('cz_visual_settings');

        if (!$settings || !isset($settings['layouts'][$atts['page']])) {
            return '<!-- No layout found for ' . esc_attr($atts['page']) . ' -->';
        }

        $layout = $settings['layouts'][$atts['page']];
        $globalDesign = isset($settings['globalDesign']) ? $settings['globalDesign'] : null;

        ob_start();
        ?>
        <div class="cz-builder-root" style="<?php echo $this->get_global_styles($globalDesign); ?>">
            <div class="cz-canvas-viewport">
                <?php echo $this->render_layers($layout['layers']); ?>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function get_global_styles($design)
    {
        if (!$design)
            return '';
        $colors = $design['colors'];
        $styles = "";
        foreach ($colors as $key => $val) {
            $styles .= "--brand-{$key}: {$val}; ";
        }
        // Map to legacy CZ vars
        $styles .= "--accent-color: {$colors['primary']}; ";
        $styles .= "--background: {$colors['background']}; ";
        return esc_attr($styles);
    }

    private function render_layers($layers)
    {
        $output = "";
        foreach ($layers as $el) {
            $output .= $this->render_element($el);
        }
        return $output;
    }

    private function render_element($el)
    {
        // Conversion logic from JSON to HTML
        $type = $el['type'];
        $styles = $this->parse_styles($el['styles']['desktop']); // Simplification

        switch ($type) {
            case 'text':
                $tag = isset($el['props']['tag']) ? $el['props']['tag'] : 'div';
                return "<{$tag} style='{$styles}'>" . esc_html($el['props']['content']) . "</{$tag}>";

            case 'image':
                $url = isset($el['props']['url']) ? $el['props']['url'] : '';
                return "<img src='" . esc_url($url) . "' style='{$styles}' />";

            case 'container':
            case 'section':
                $children = isset($el['children']) ? $this->render_layers($el['children']) : '';
                return "<div class='cz-{$type}' style='{$styles}'>{$children}</div>";

            default:
                return "<!-- Element type {$type} not implemented yet -->";
        }
    }

    private function parse_styles($styles)
    {
        $css = "";
        foreach ($styles as $prop => $val) {
            // CamelCase to kebab-case
            $prop_css = strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $prop));
            $css .= "{$prop_css}: {$val}; ";
        }
        return esc_attr($css);
    }
}
