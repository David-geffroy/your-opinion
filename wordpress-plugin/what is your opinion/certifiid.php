<?php
/*
Plugin Name: Certif-IID Plugin
Plugin URI: http://what-is-your-opinion.com/wordpress-plugin
Description: Certif-IID plugin for WordPress
Version: 0.1
Author: Romain Fournereau
Author URI: http://what-is-your-opinion.com
License: GPL2
*/

class Certifiid_Plugin {
	public function __construct()
	{
		add_action('admin_menu', array($this, 'add_admin_menu'));
		add_filter( 'comments_template', function() {
			return dirname(__FILE__) . '/comments-template.php';
		}, 1000);
	}

	public function add_admin_menu()
	{
		add_menu_page('Configuration Certif-IID', 'Certif-IID', 'manage_options', 'certifiid', array($this, 'menu_html'));
		add_action('admin_init', array($this, 'register_mysettings'));
	}
	public function register_mysettings() {
		register_setting( 'certifiid-options', 'token' );
	}

	public function menu_html()
	{
		?>
			<div class="wrap">
				<h2>Configuration Certif-IID</h2>
				<p>To use the plugin, you need to put your application token, available on your admin page, once you created an application on our website.</p>
				<p>Afin d'utiliser le plugin Certif-IID il vous faut renseigner le token disponible sur la page administrateur de votre application.</p>
			    <form method="post" action="options.php">
			        <?php settings_fields( 'certifiid-options' ); ?>
			        <label>Token : </label>
			        <input type="text" name="token" size="120" value="<?php echo get_option('token'); ?>">
			        <p class="submit">
			        	<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>">
			        </p>
			    </form>
			</div>
			<div id="ciid-div"></div>
			<script type="text/javascript">
				var ciid_token = '<?php echo get_option("token"); ?>';
				var ciid_mode = 'admin';
				(function() {
					var dsl = document.createElement('script');
					dsl.type = 'text/javascript';
					dsl.async = true;
					dsl.src = '//what-is-your-opinion.com/api/javascripts/apiLoader.js';
					(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsl);
				})();
			</script>
		<?php
	}
}

new Certifiid_Plugin();

