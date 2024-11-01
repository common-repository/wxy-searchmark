<?php 
/*
	Plugin Name: WXY Searchmark
	Plugin URI: http://wxytools.com/wxy-searchmark/
	Description: WXY Tools, hardcore tools for WordPress, brings you a plugin to quickly find page, post and custom content, save custom searches, as well as create and organize bookmarked locations and content.
	Version: 1.0.9
	Author: Clarence "exoboy" Bowman
	Author URI: http://www.wxytools.com
	License: GPL
	
	WXY Searchmark Plugin – WXY Tools, hardcore tools for WordPress, brings you a plugin to quickly find page, post and custom content, save custom searches, as well as create and organize bookmarked locations and content.

	Copyright (c) 2018, Clarence "exoboy" Bowman and Bowman Design Works.

	WXY Searchmark Plugin is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License or (at your option) any later version.

	This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License along with this program. If not, see http://www.gnu.org/licenses/

	You can contact us at info@wxytools.com
 
*/

// ***********************************************************************
// plugin version
// ***********************************************************************
$wxy_searchmark_jal_db_version = '1.0.9';

// ***********************************************************************
// force ssl in admin?
// ***********************************************************************
if( is_admin() )
{
	force_ssl_admin();
}

// ***********************************************************************
// CONSTANTS
// ***********************************************************************
define( "WXY_SEARCHMARK_SESSION_NONCE", "wxy_searchmark_noncey_data" );
define( "WXY_SEARCHMARK_SESSION_ID", "wxy_searchmark_session_id" );
define( "WXY_SEARCHMARK_SESSION_TYPE_LAST", "wxy_searchmark_session_type_last" );
define( "WXY_SEARCHMARK_JSON_HEADER", "^^^^JSON-START^^^^" );
define( "WXY_SEARCHMARK_JSON_FOOTER", "^^^^JSON-END^^^^" );

// ***********************************************************************
// NONCE: create this once per session
// ***********************************************************************
if( is_admin() )
{
	add_action('init', 'wxy_searchmark_start_session', 1);


	function wxy_searchmark_start_session()
	{	
	    if( !session_id() )
		{
			session_start();
    	}
	
		$_SESSION[ WXY_SEARCHMARK_SESSION_ID ] = session_id();
	}
}



// ***********************************************************************
// block access of this code to outsiders
// ***********************************************************************
defined( 'ABSPATH' ) or die( 'No script kiddies please!' );


// ***********************************************************************
// PHP VERSION CHECKER: throw an error if their PHP is too old...
// ***********************************************************************
add_action( 'admin_notices', 'wxy_searchmark_notice_error' );

function wxy_searchmark_notice_error()
{
	// check to see if we have a new enough version of PHP
	$php_okay = wxy_searchmark_php_check();

	if( $php_okay !== true )
	{
		$classes = 'notice notice-error';
	
		// get the text in whatever domain(language) they are from
		$message = __( '<span style="color:#F00;font-weight:800;">WXY Bookmarks requires PHP 5.x or higher to function properly!<br />Please upgrade your PHP, or use an older version of this plugin.</span>' );

		printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $classes ), $message );//esc_html() 
	}
}

// ***********************************************************************
// PHP VERSION: check to see if we have 5 or newer installed
// ***********************************************************************
function wxy_searchmark_php_check()
{
	$ver = phpversion();
	$val =  floatval( $ver );
	$okay = true;
	
	if( $val < 5 )
	{
		// we need a newer version of PHP!
		$okay = false;	
	}

	return $okay;
}

// ***********************************************************************
// ACTIVATION: check for compatibility issues and create a table for our data
// ***********************************************************************
register_activation_hook( __FILE__, 'wxy_wp_admin_searchmark_activation');

function wxy_wp_admin_searchmark_activation()
{
	// ------------------------------------------------------
	// get our wp database global
	// ------------------------------------------------------
	global $wpdb, $wxy_searchmark_jal_db_version;
	
	// ------------------------------------------------------
	// check to see if we have a new enough version of PHP
	// ------------------------------------------------------
	$php_okay = wxy_searchmark_php_check();

	if( $php_okay !== true )
	{
		$classes = 'notice notice-error';
	
		// get the text in whatever domain(language) they are from
		$message = __( '<span style="color:#F00;font-weight:800;">WXY Bookmarks requires PHP 5.x or higher to function properly!<br />Please upgrade your PHP, or use an older version of this plugin.</span>' );

		printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $classes ), $message );//esc_html()
		
		exit();
	}
	
	// ------------------------------------------------------
	// create a database table
	// ------------------------------------------------------
	$table_name = $wpdb->prefix . 'wxy_searchmark_data';
	$db_name = $wpdb->dbname;
	
	$charset_collate = $wpdb->get_charset_collate();
	
	$sql = "CREATE TABLE IF NOT EXISTS `" . $db_name . "`.`" . $table_name . "` (
		id mediumint(9) NOT NULL AUTO_INCREMENT,
		user TINYTEXT NOT NULL,
		date TINYTEXT NOT NULL,
		data LONGTEXT NOT NULL,
		settings LONGTEXT NOT NULL,
		UNIQUE KEY id (id)
	) $charset_collate; )";
	
	require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
	dbDelta( $sql );

	// save our version information
	add_option( 'wxy_searchmark_jal_db_version', $wxy_searchmark_jal_db_version );
	
	// contribution messagin options
	$date = time();
	
	add_option( 'wxy_searchmark_registration_code', "");
	add_option( 'wxy_searchmark_registration_date', $date);
	add_option( 'wxy_searchmark_registration_count', 0);
}

// ***********************************************************************
// DEACTIVATED: do nothing for now
// ***********************************************************************
register_deactivation_hook( __FILE__, 'wxy_wp_admin_searchmark_deactivation');

function wxy_wp_admin_searchmark_deactivation()
{
	// ------------------------------------------------------
	// do nothing for now on DEACTIVATION
	// ------------------------------------------------------
	delete_option( 'wxy_searchmark_registration_code', "");
	delete_option( 'wxy_searchmark_registration_date', "");
	delete_option( 'wxy_searchmark_registration_count', 0);
}


// ***********************************************************************
// UNINSTALLED: remove our table, options (if any), and downloads folder
// ***********************************************************************
register_uninstall_hook ( __FILE__, 'wxy_wp_admin_searchmark_uninstall' );

function wxy_wp_admin_searchmark_uninstall()
{
	// ------------------------------------------------------
	// get our wp database global
	// ------------------------------------------------------
	global $wpdb;

	// ------------------------------------------------------------------------
	// OPTIONS: now, capture ALL of our valid usernames, so we can remove our old options
	// ------------------------------------------------------------------------
	$all_users = wxy_searchmark_get_all_users();	
	
	foreach( $all_users as $user )
	{		
		$option_suffix = sanitize_text_field( $user );
		
		// OPTIONS: autosave on/off and time interval before save
		$autosave = 'wxy_searchmark_autosave_' . $option_suffix;
		$interval = 'wxy_searchmark_interval_' . $option_suffix;
		
		// now remove them!
		delete_option( $autosave );
		delete_option( $interval );
	}
	
	// ------------------------------------------------------
	// CONTRIBUTION MESSAGING OPTIONS
	// ------------------------------------------------------
	delete_option( 'wxy_searchmark_registration_code' );
	delete_option( 'wxy_searchmark_registration_date' );
	delete_option( 'wxy_searchmark_registration_count' );
	
	// ------------------------------------------------------
	// remove our table if it exists
	// ------------------------------------------------------
	$table_name = $wpdb->prefix . 'wxy_searchmark_data';
	$wpdb->query( "DROP TABLE IF EXISTS $table_name" );

	delete_option("wxy_searchmark_jal_db_version");

	// -------------------------------------------------------
	// delete our downloads directory (if any)
	// --------------------------------------------------------------------
	$uploads_dir = wp_upload_dir();
	$uploads_path = $uploads_dir[ "basedir" ] . '/';
	$dir = $uploads_path . 'wxy-searchmark-data';

	// make sure we even have a folder to delete
	if( file_exists( $dir ) === true && strlen( $dir ) > 21 && strpos( $dir, 'wxy-searchmark-data') !== false )
	{
		// empty out our wxy searchmark data directory
		foreach( scandir( $dir ) as $file)
		{
			if ('.' === $file || '..' === $file)
			{
				continue;
			}
			
			if( is_dir("$dir/$file") )
			{
				@rmdir_recursive("$dir/$file");

			} else {
				@unlink("$dir/$file");
			}
		}
		
		// remove the empty directory
		@rmdir($dir);
	}
}


// ***********************************************************************
// load our external CSS - ONLY if in admin or preview...
// ***********************************************************************
add_action('admin_enqueue_scripts', 'wxy_searchmark_styles', 999);
add_action('wp_enqueue_scripts', 'wxy_searchmark_styles', 999);

function wxy_searchmark_styles()
{
	if( is_admin() || is_admin_bar_showing() )
	{
		wp_register_style('wxy_searchmark_css', plugins_url('css/wxy-searchmark.css', __FILE__ ), array(), true, 'all');
		wp_enqueue_style('wxy_searchmark_css');
	}
}


// ***********************************************************************
// ADMIN TOOLBAR: add ADMIN MENU page
// ***********************************************************************
add_action('admin_bar_menu', 'create_wxy_searchmark_menu', 2000);

function create_wxy_searchmark_menu()
{
	if( is_admin() || is_admin_bar_showing() )
	{
		global $wp_admin_bar;

		// this attaches to all the HTML that WP generates for our menu item
		$menu_id = 'WXY_BOOKMARKS';
	
		$my_id = get_the_id();
		
		$title_html = '<div class="wxy-searchmark-menubar-menu-btn wxy-searchmark-menubar-item" title="show/hide searchmark">Searchmark</div><div class="wxy-searchmark-menubar-add-btn wxy-searchmark-bookmark-image wxy-searchmark-menubar-item" title="bookmark this page">&nbsp;</div><input class="wxy-searchmark-menubar-post-input wxy-searchmark-menubar-item" value="' . $my_id . '"  title="enter post id, return to jump" /><div class="wxy-searchmark-menubar-edit-btn wxy-bookarks-edit-image wxy-searchmark-menubar-item" title="edit">&nbsp;</div>';
	
		$wp_admin_bar->add_menu(array('id' => $menu_id, 'title' => __( $title_html )));
	}
}

// ***********************************************************************
// REQUEST FOR CONTRIBUTION MESSAGES
// ***********************************************************************
if( isset( $_SESSION[ "wxy-searchmark-show-message" ] ) )
{
	add_action( 'admin_notices', 'wxy_searchmark_contribution_please' );
}

function wxy_searchmark_contribution_please() {
	
	$msg = $_SESSION[ "wxy-searchmark-show-message" ];

	switch (true)
	{
		case $msg == "1":
		
			?><div class="notice notice-success is-dismissible"><p><?php _e( 'WXY Searchmark: I noticed you have been using Searchmark for a few days, please consider contributing, so we can continue developing great tools for you! <a href="options-general.php?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3">Contribute here.</a>', 'my_plugin_textdomain' ); ?></p></div><?php
			
			break;
			
		case $msg == "2":
		
			?><div class="notice notice-success is-dismissible"><p><?php _e( 'WXY Searchmark: Hi, just me again. It has been a couple of weeks. Hope you are getting a lot of use out of our plugin. Please consider contributing, so we can continue developing great tools for you! <a href="options-general.php?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3">Contribute here.</a>', 'my_plugin_textdomain' ); ?></p></div><?php
			
			break;
			
		case $msg == "3":
		
			?><div class="notice notice-success is-dismissible"><p><?php _e( 'WXY Searchmark: I noticed you have been using our plugin for a few weeks. Hope it saves you as much time as it does us. Please consider contributing, so we can continue developing great tools for you! <a href="options-general.php?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3">Contribute here.</a> This is the last time we will ask, so please help out today!', 'my_plugin_textdomain' ); ?></p></div><?php
			
			break;
	}
	
	
	// reset our message, so it does not keep showing
	$_SESSION[ "wxy-searchmark-show-message" ] = -1;

}

// ***********************************************************************
// JAVASCRIPT DATA: pass values to javascript - ONLY in admin or preview
// ***********************************************************************
add_action( 'admin_enqueue_scripts', 'wxy_searchmark_send_vars_to_javscript', 10 );
add_action( 'wp_enqueue_scripts', 'wxy_searchmark_send_vars_to_javscript', 10 );

function wxy_searchmark_send_vars_to_javscript()
{
	if( is_admin() || is_admin_bar_showing() )
	{
		global $wxy_tools_initial_signin, $wpdb, $wxy_searchmark_jal_db_version;

		// ---------------------------------------------------------
		// REGISTERED: see if the user is registered and if so, stop showing them contribution messages
		// ---------------------------------------------------------
		$code = get_option( 'wxy_searchmark_registration_code' );
		$date = get_option( 'wxy_searchmark_registration_date' );
		$count = get_option( 'wxy_searchmark_registration_count' );
		$date_now = time();
		$valid = false;

		if( isset( $code ) )
		{
			// there is a value here, validate it
			$code = base64_decode( $code );

			//echo var_dump( preg_match( "/^[A-Z0-9._%\+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/", $code, $matches ) );
			$valid = preg_match( "/^[A-Z0-9\._%\+\-]+@[A-Z0-9\.\-]+\.[A-Z]{2,4}$/i", $code );
		}


		// do this section ONLY if they are not registered
		if( !$valid || $code > 3 )
		{
			// no date set, so add one for future use, also add a counter
			if( !isset( $date ) || strlen( $date ) <= 0 )
			{
				$date = $date_now;
				if( !add_option( 'wxy_searchmark_registration_date', $date ) )
				{
					update_option( 'wxy_searchmark_registration_date', $date );
				}
			}

			if( !isset( $count ) || strlen( $count ) <= 0 )
			{
				$count = 0;			
				if( !add_option( 'wxy_searchmark_registration_count', $count ) )
				{
					update_option( 'wxy_searchmark_registration_count', $count );
				}
			}

			// make sure our timestamps are numbers
			if( is_nan( $date ) )
			{
				$date = $date_now;
			}

			// now compare the saved timestamp to the current one and see if we need to show any messages...
			// 86400 = 1 day
			switch (true)
			{
				case $date_now - $date > 345600 && $count <= 0:

					// show our first plea (4 days)
					$count++;
					$_SESSION[ "wxy-searchmark-show-message" ] = $count;


					break;

				case $date_now - $date > 1209600 && $count <= 1:

					// show our second plea (2 weeks)
					$count++;
					$_SESSION[ "wxy-searchmark-show-message" ] = $count;
					break;

				case $date_now - $date > 2419200 && $count <= 2:

					// show our final plea (1 month)
					$count++;
					$_SESSION[ "wxy-searchmark-show-message" ] = $count;
					break;
			}

			// save the current count
			update_option( 'wxy_searchmark_registration_count', $count );

		}

		// -------------------------------------------------------
		// get info about our current SCREEN
		// -------------------------------------------------------
		if( function_exists( 'get_current_screen' ) )
		{
			$this_screen = get_current_screen();

		} else {
			$this_screen = array();
		}

		// now convert our result object into JSON
		$data["admin_panel_info"] = json_encode( $this_screen );


		// --------------------------------------------------------------------------
		// now get our session id
		// --------------------------------------------------------------------------
		$data["session_id"] = isset( $_SESSION[ WXY_SEARCHMARK_SESSION_ID ] ) ?  $_SESSION[ WXY_SEARCHMARK_SESSION_ID ] : NULL;

		// --------------------------------------------------------------------------
		// now get our site url to use as a cookie suffix
		// --------------------------------------------------------------------------
		$site_name = get_bloginfo( 'url', 'raw' );

		// do it twice, in case they are in a secure session
		$site_name = str_replace( "http://", "", $site_name );
		$site_name = str_replace( "https://", "", $site_name );

		$site_name = preg_replace( "/[^a-zA-Z0-9]/", " ", $site_name);
		$site_name = str_replace( " ", "_", $site_name );

		$data["site_name"] = $site_name;

		// ------------------------------------------------------------------------
		// FORMS: Generate a WORDPRESS NONCE for the form and the SESSION
		// ------------------------------------------------------------------------
		$data["wp_nonce"] = wp_create_nonce( "wxy-searchmark-nonce" );

		$_SESSION[ WXY_SEARCHMARK_SESSION_NONCE ] = $data[ "wp_nonce" ];

		// ------------------------------------------------------------------------
		// FORMS: Generate a WXY NONCE for the form and the SESSION
		// ------------------------------------------------------------------------
		$data["form_nonce"] = $data["wp_nonce"];

		// ------------------------------------------------------------------------
		// WXY Version Number
		// ------------------------------------------------------------------------
		$data["version_number"] = $wxy_searchmark_jal_db_version;

		// ------------------------------------------------------------------------
		// SIGNED IN USER: this is the name of the user who is currently signed in to wp-admin
		// ------------------------------------------------------------------------
		$current_user = wp_get_current_user();
		$current_user = $current_user->data;
		$data["active_user_login"] = $current_user->user_login;

		if( function_exists( "is_user_logged_in" ) )
		{
			$data[ "logged_in" ] = is_user_logged_in();
		} else {
			$data[ "logged_in" ] = 0;
		}

		if( $data[ "logged_in" ] )
		{
			$data[ "logged_in" ] = 1;
		} else {
			$data[ "logged_in" ] = 0;
		}

		// ------------------------------------------------------------------------
		// USERNAMES: now, capture ALL of our valid usernames
		// ------------------------------------------------------------------------
		$all_users = wxy_searchmark_get_all_users();
		$data["all_user_logins"] = $all_users;

		// ------------------------------------------------------------------------------------
		// INITIAL LOGIN? See if they are just signing in, or if this is the continuation of the same session
		// ------------------------------------------------------------------------------------
		$initial_login = get_user_meta( $current_user->ID , '_initial_login', true);

		$data["initial_login"] = $initial_login;

		if( $initial_login == 1 )
		{
			// reset our flag!
			update_user_meta( $current_user->ID, '_initial_login', 0 );
		}

		// ---------------------------------------------------------
		// KEYBOARD SHORTCUTS: we have to use a different set for Windows!
		// ---------------------------------------------------------

		// default to mac setup
		$data[ "meta_key" ] = "metaKey";
		$data[ "ctrl_key" ] = "ctrlKey";
		$data[ "alt_key" ] = "altKey";
		$data[ "shift_key" ] = "shiftKey";

		// get our user agent so we can see if we need to switch any keyboard shortcut values
		$user_agent = isset( $_SERVER[ "HTTP_USER_AGENT" ] ) ? $_SERVER[ "HTTP_USER_AGENT" ] : "--Mac--";

		if( strpos( $user_agent, "Mac") === false )
		{
			// PC Setup
			$data[ "meta_key" ] = "ctrlKey";
			$data[ "ctrl_key" ] = "ctrlKey";
			$data[ "alt_key" ] = "altKey";
			$data[ "shift_key" ] = "shiftKey";
		}	

		// ---------------------------------------------------------
		// AUTOSAVE: Autosave and other user-defined options
		// ---------------------------------------------------------
		$option_suffix = sanitize_text_field( $data["active_user_login"] );

		$autosave = esc_attr( get_option('wxy_searchmark_autosave_' . $option_suffix ) );
		$interval = esc_attr( get_option('wxy_searchmark_interval_' . $option_suffix ) );

		if( !isset( $autosave ) )
		{
			// DEFAULT VALUES
			$autosave = 1;
			$interval = 1.5;

			// CREATE: set up our initial autosave for this user!
			add_option( 'wxy_searchmark_autosave_' . $option_suffix, $autosave );
			add_option( 'wxy_searchmark_interval_' . $option_suffix, $interval );
		}

		$data["autosave"] = $autosave;
		$data["interval"] = $interval;

		// --------------------------------------------------------------------------
		// get our current post id (if any )
		// --------------------------------------------------------------------------
		$data["post_id"] = get_the_ID();

		// --------------------------------------------------------------------------
		// get our current post TITLE (if any )
		// --------------------------------------------------------------------------
		$data["post_title"] = get_the_Title( $data["post_id"] );

		if( strlen( $data["post_title"] ) <= 0 )
		{
			$data["post_title"] = false;
		}

		// --------------------------------------------------------------------------
		// SESSION TYPE: track this to let people know when they have crossed the http-https fence
		// --------------------------------------------------------------------------

		// see what kind of sessionw we have firt
		if( isset( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] == 'on' )
		{
			$this_session = "https";
		} else {
			$this_session = "http";
		}

		// now, restore the last session type, or set it to the current one, if no past value exists
		$data[ "session_type_last" ] = isset( $_SESSION[ WXY_SEARCHMARK_SESSION_TYPE_LAST ] ) ? $_SESSION[ WXY_SEARCHMARK_SESSION_TYPE_LAST ] : $this_session;

		$data[ "session_type_this" ] = $this_session;

		// now save the current session type for comparison the next time
		$_SESSION[ WXY_SEARCHMARK_SESSION_TYPE_LAST ] = $this_session;


		// -------------------------------------------------------------------------
		// FORMS: this is the URL to send all forms to!
		// -------------------------------------------------------------------------
		$data["form_submission_path"] = admin_url( 'admin-ajax.php' );//esc_url( )

		$data["plugin_path"] = plugins_url('', __FILE__ );

		// replace our http/https portion
		$data["form_submission_path"] = preg_replace( "/http[s]:/", $this_session . ":", $data["form_submission_path"] );
		$data["plugin_path"] = preg_replace( "/http[s]:/", $this_session . ":", $data["plugin_path"] );

		// --------------------------------------------------------------------------
		// PERMALINK: get the current permalink (if any)
		// --------------------------------------------------------------------------
		$data[ "permalink" ] = get_permalink( $data["post_id"] );
		$data[ "permalink" ] = isset( $data[ "permalink" ] ) ? $data[ "permalink" ] : false;

		// ---------------------------------------------------------
		// get the base url for this site
		// ---------------------------------------------------------
		$data["wp_site_url"] = get_home_url();

		// ---------------------------------------------------------
		// ADMIN BAR SHOWING?
		// ---------------------------------------------------------
		$data[ "admin_bar_visible"] = is_admin_bar_showing();

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): Get all types of POSTS
		// ---------------------------------------------------------
		$post_types = get_post_types();

		// set up our search form object
		$search_form = array();
		$search_form[ "searchmark_form_type" ] = "";
		$search_form[ "all-types" ] = array();

		// this is what we send back to the client side
		$data["wp_sitesearch_data"] = array();

		// this will hold all the valid post/page types we can edit, so later, we can pull together all the dates that content was published for them
		$date_post_types = array();

		if( isset( $post_types ) && count( $post_types ) > 0 )
		{	
			foreach( $post_types as $key => $type )
			{
				// see if this post type is editable
				$can_edit = post_type_supports( $type, "editor" );

				// see if the current user can author
				$can_author = post_type_supports( $type, "author" );

				if( $can_edit && $can_author )
				{
					// get the counts for each type...
					$count_obj = wp_count_posts( $type ); 
					$count_total = $count_obj->publish + $count_obj->private;

					// english notation (default) 1,264,200
					$count_total = number_format( $count_total );

					// add it to our list of possible select menu options...
					$search_form[ "searchmark_form_type" ] .= '<option value="' . $type . '"> in type: ' . $type . '&nbsp;&nbsp;(' . $count_total . ')</option>';			

					// collect all post types to use in searches
					array_push( $search_form[ "all-types" ], $type );
				}
			}

			// put our select option for ALL into the top of the select menu
			$search_form[ "all-types" ] = implode( ",", $search_form[ "all-types" ] );

			$search_form[ "searchmark_form_type" ] = '<option value="' . $search_form[ "all-types" ] . '" selected>using these post types (all)</option>' . $search_form[ "searchmark_form_type" ];
		}

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): Get all TAGS!
		// ---------------------------------------------------------
		$tags = get_tags( array( 'hide_empty' => false ) );

		// now create some option elements
		$search_form[ "searchmark_form_tag" ] = "";

		foreach( $tags as $tag )
		{
			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_tag" ] .= '<option value="' . $tag->term_taxonomy_id . '">and has tag value: ' . $tag->name . '</option>';
		}

		// put our select option for ALL into the top of the select menu
		$search_form[ "searchmark_form_tag" ] = '<option value="all-tags" selected>and has tag value (any)</option>' . $search_form[ "searchmark_form_tag" ];

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): Get all categories
		// ---------------------------------------------------------
		$terms = get_terms( array(
			"hide_empty" => false,
			"order_by" => "name",
			"order" => "ASC",
			"number" => 0
		) );

		$categories = array();

		foreach( $terms as $term )
		{
			if( $term->taxonomy == "category" )
			{
				// only save the categories
				array_push( $categories, array( "name" => $term->name, "category" => $term->term_id ) );
			}
		}

		// now create some option elements
		$search_form[ "searchmark_form_category" ] = "";

		foreach( $categories as $category )
		{		
			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_category" ] .= '<option value="' . $category[ "category" ] . '">with category of: ' . $category[ "name" ] . '</option>';
		}

		// put our select option for ALL into the top of the select menu
		$search_form[ "searchmark_form_category" ] = '<option value="all categories" selected>with category of (any)</option>' . $search_form[ "searchmark_form_category" ];	

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): Get all post TEMPLATES
		// ---------------------------------------------------------
		$templates = wp_get_theme()->get_page_templates();

		// now create some option elements
		$search_form[ "searchmark_form_template" ] = "";

		foreach( $templates as $slug => $label )
		{
			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_template" ] .= '<option value="' . $slug . '">using template: ' . $label . '</option>';
		}

		// put our select option for ALL into the top of the select menu
		$search_form[ "searchmark_form_template" ] = '<option value="all-templates" selected>using template (any)</option>' . $search_form[ "searchmark_form_template" ];

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): Get all post status types
		// ---------------------------------------------------------
		$statuses = get_post_statuses();

		// now create some option elements
		$search_form[ "searchmark_form_status" ] = "";
		$search_form[ "all-statuses" ] = array();

		foreach( $statuses as $index => $status )
		{
			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_status" ] .= '<option value="' . $index . '">with status of: ' . $status . '</option>';

			// save all of our status for our all value...
			array_push( $search_form[ "all-statuses" ], $index );
		}

		// put our select option for ALL into the top of the select menu
		$search_form[ "all-statuses" ] = implode( ",", $search_form[ "all-statuses" ] );

		$search_form[ "searchmark_form_status" ] = '<option value="' . $search_form[ "all-statuses" ] . '" selected>with status of (any)</option>' . $search_form[ "searchmark_form_status" ];


		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): list all of the current authors for this site 
		// ---------------------------------------------------------
		$search_form[ "searchmark_form_author" ] = "";

		$authors = get_users();

		foreach( $authors as $author)
		{
			$first_name = get_user_meta( $author->ID, 'first_name', true);
			$last_name = get_user_meta( $author->ID, 'last_name', true);

			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_author" ] .= '<option value="' . $author->ID . '">authored by: ' . $first_name . ' ' . $last_name . '</option>';			

		}

		// put our select option for ALL into the top of the select menu
		$search_form[ "searchmark_form_author" ] = '<option value="all authors" selected>authored by (any)</option>' . $search_form[ "searchmark_form_author" ];	

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): get a list of all available META KEYS and set up with LOCATIONS we can search in....
		// ---------------------------------------------------------
		$search_form[ "searchmark_form_location" ] = '<option value="everywhere">in all titles, content, slugs, &amp; meta fields</option>
							<option value="title">only in: titles</option>
							<option value="content">only in: site content</option>
							<option value="slug">only in: slugs</option>
							<option value="" disabled>------ META FIELDS BELOW ------</option>';

		$meta_keys = wxy_searchmark_get_metakeys();

		foreach( $meta_keys as $key )
		{
			// add it to our list of possible select menu options...
			$search_form[ "searchmark_form_location" ] .= '<option value="' . $key->meta_key . '">only in: ' . $key->meta_key . '</option>';

		}

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): get a list of all available BLOGS and end their path and blog ID
		// ---------------------------------------------------------	
		$search_form[ "searchmark_form_sites" ] = "";

		// if the get_sites function exists.. then this is multisite!
		if( function_exists( "get_sites" ) )
		{
			$all_sites = get_sites();
			$count = 0;

			foreach( $all_sites as $site )
			{
				if( $count == 0 )
				{
					// remove the www.
					$name = preg_replace( '/^www\./', '', $site->domain );

					$count += 1;
				} else {
					$name = $site->path;
					$name = ltrim( $name, "/" );
					$name = rtrim( $name, "/" );
				}

				// add it to our list of possible select menu options...
				$search_form[ "searchmark_form_sites" ] .= '<option value="' . $site->blog_id . '">search: ' . $name . '</option>';
			}

		} else {

			// this is the only site....
			// add it to our list of possible select menu options...
			$name = $_SERVER[ "SERVER_NAME" ];


			$search_form[ "searchmark_form_sites" ] .= '<option value="1">search: ' . $name . '</option>';
		}

		// ---------------------------------------------------------
		// SITESEARCH (SEARCH): finally, add it to our outgoing data
		// ---------------------------------------------------------
		$data[ "wp_sitesearch_data" ] = $search_form;	


		// ---------------------------------------------------------
		// register our widget's javascript so it loads and passes our vars
		// ---------------------------------------------------------
		$javascript = plugins_url('', __FILE__ ) . '/js/wxy-searchmark-scripts.js';

		// register our script, localize it, then enqueue it
		wp_register_script( 'wxy-searchmark-ajax-js', $javascript, array( 'jquery' ), '', false );		
		wp_localize_script( 'wxy-searchmark-ajax-js', 'wxy_searchmark_admin_vars', $data );
		wp_enqueue_script( 'wxy-searchmark-ajax-js' );
	
	}
}

// ***********************************************************************
// take our post/page responses and create HTML for our sitesearch
// ***********************************************************************
function wxy_searchmark_private_post_page_html( $posts, $vars, $home_url )
{
	global $wpdb;

	// ------------------------------------------------------------------------
	// get our home url if none is supplied
	// ------------------------------------------------------------------------
	if( strlen( $home_url ) <= 0 )
	{
		$home_url = get_home_url();
	}
		
	// use the post type from our args to populate this label
	$vars[ "searchmark_form_post_type" ] = explode( ",", $vars[ "searchmark_form_post_type" ] );
	
	if( count( $vars ) <= 1 )
	{
		$label = $label = $vars[ "searchmark_form_post_type" ][0];

	} else {
		$label = "all post types";
	}

	$label = trim( $label );

 	// create some counts of items found, page number and total rows possible
	$page_num = intval( $vars[ "search_vars" ][ "searchmark_form_page" ] );
	$use_page_num = isset( $vars[ "search_vars" ][ "searchmark_form_use_page" ] ) ? intval( $vars[ "search_vars" ][ "searchmark_form_use_page" ] ) : NULL;

	if( $use_page_num )
	{
		$page_num = $use_page_num;
	}

	$range_min = ( intval( $vars[ "search_vars" ][ "searchmark_form_limit" ] ) * ( $page_num -1 ) ) + 1;
	$range_min_desc = number_format( $range_min );

	$range_max = $range_min + count( $posts ) - 1;
	$range_max_desc = number_format( $range_max );

	$max_results = $vars[ "searchmark_form_max_results" ];
	$max_results_desc = number_format( $max_results );

	// total page count
	$total_pages = ceil( $max_results / intval( $vars[ "search_vars" ][ "searchmark_form_limit" ] ) );

	// add our marker to be replaced with a count at the end
	$label .= "&nbsp;&nbsp;( " . $range_min_desc . " - " . $range_max_desc . "&nbsp;&nbsp;of&nbsp;&nbsp;" . $max_results_desc . " results )&nbsp;&nbsp;&mdash;&nbsp;page " . $page_num . " of " . $total_pages;
	$li_count = 0;

	// start off with our new category open/close button and a container to hold our content
	$private_html = '<div class="wxy-searchmark-sitesearch-section-wrapper" data-max-pages="' . $total_pages . '"><ul class="pagenav"><div class="wxy-searchmark-sitesearch-section-btn">' . $label . '</div><div class="wxy-searchmark-sitesearch-pagebar-bookmark-btn wxy-searchmark-bookmark-image"></div><div class="wxy-searchmark-sitesearch-section-content">';

	// -----------------------------------------------------------
	// STATUSES: Get a list of all post statuses
	// -----------------------------------------------------------
	$statuses = get_post_statuses();
		
	// now create some option elements
	$status_select_options = "";
	
	foreach( $statuses as $index => $status )
	{
		// add it to our list of possible select menu options...
		$status_select_options .= '<option value="' . $index . '">' . $status . '</option>';
	}

	// collect some info about the posts to use in our URL's
	if( isset( $posts ) )
	{		
		$posts = array_map( function( $post )
		{
			$ID = $post->ID;
			$post_type = $post->post_type;
			
			$category = get_the_category( $ID );
			$category = isset( $category[0]->name ) ? $category[0]->name : "";
			
			if( strlen( $category ) <= 0 )
			{
				$category = '<span class="wxy-searchmark-result-prefix-grey">( ' . $post_type . ')</span> ';
			}
			
			$template = get_post_meta( $ID, '_wp_page_template', true );
			
			if( strlen( $template ) <= 0 )
			{
				$template = '<span class="wxy-searchmark-result-prefix-grey">( ' . $post_type . ')</span> ';
			}
			
			$tag = get_the_tags( $ID );
			
			if( is_array( $tag ) && count( $tag ) > 0 )
			{
				// implode our array of tags!
				$new_tags = array();
				
				foreach( $tag as $next )
				{
					array_push( $new_tags, $next->name );
				}
				
				$tag = implode( ", ", $new_tags );
			} else if ( strlen( $tag ) <= 0 )
			{
				$tag = '<span class="wxy-searchmark-result-prefix-grey">( ' . $post_type . ')</span> ';
			}

			return array(
				'post_title' => $post->post_title,
				'post_id' => $ID,
				'post_status' => $post->post_status,
				'post_name' => $post->post_name,// this is the slug
				'post_author' => $post->post_author,// post author numbers
				'post_date' => $post->post_date_gmt, // date it was posted
				'post_date_epoch' => strtotime( $post->post_date_gmt ),
				'post_modified' => $post->post_modified_gmt, // date it was updated
				'post_modified_epoch' => strtotime( $post->post_modified_gmt ),
				'post_type' => $post_type,
				'post_category' => $category,
				'post_template' => $template,
				'post_tag' => $tag
		);
			
		}, $posts );
		
		// ------------------------------------------------------------------------
		// RESULT SORT: see if we need to sort by anything....
		// ------------------------------------------------------------------------
		$sort_by = $vars[ "search_vars" ][ "searchmark_form_sort" ];
		
		switch (true)
		{
			case $sort_by == "title":
				
				$sort_by = "post_title";
				break;
				
			case $sort_by == "slug":
				
				$sort_by = "post_slug";
				break;
				
			case $sort_by == "type":
				
				$sort_by = "post_type";
				break;
				
			case $sort_by == "modified":
				
				$sort_by = "post_modified_epoch";
				
				break;
				
			case $sort_by == "date":
				
				$sort_by = "post_date_epoch";
				break;
				
			case $sort_by == "status":
				
				$sort_by = "post_status";
				break;
				
			case $sort_by == "author":
				
				$sort_by = "post_author";
				break;
				
			case $sort_by == "category":
				
				$sort_by = "post_category";
				break;
				
			case $sort_by == "template":
				
				$sort_by = "post_template";
				break;
			
			case $sort_by == "tag":
				
				$sort_by = "post_tag";
				break;
				
			case $sort_by == "meta":
				
				$sort_by = "post_meta";
				break;
				
			default:
			
				// default sort if title
				$sort_by = "post_title";
				
				
		}
		
		// see if we are scending or descending
		$sort_order = $vars[ "search_vars" ][ "searchmark_form_order" ];
		
		if( $sort_order == "ASC")
		{
			$sort_order = SORT_ASC;
		} else {
			$sort_order = SORT_DESC;
		}
		
		// see if this is a string or numberic sort type
		if( $sort_by == "post_date_epoch" || $sort_by == "post_modified_epoch" || $sort_by == "post_id" )
		{
			$sort_type = SORT_NUMERIC;
		} else {
			$sort_type = SORT_STRING;
		}
		
		// get a list of sort columns and their data to pass to array_multisort
		$sort = array();

		foreach( $posts as $k=>$v) {
			$sort[ $sort_by ][$k] = $v[ $sort_by ];
		}
		# sort by event_type desc and then title asc
		if( $sort_type == SORT_NUMERIC )
		{
			array_multisort( $sort[ $sort_by ], $sort_order, $sort_type, $posts);
		} else {
			// STRING SEARCH
			array_multisort( $sort[ $sort_by ], $sort_order, $sort_type | SORT_FLAG_CASE, $posts);
		}

		unset( $entry );
		foreach( $posts as &$entry )
		{
			// sort through and build some links!
			$id = $entry[ "post_id" ];
			$title = isset( $entry[ "post_title" ] ) ? $entry[ "post_title" ] : "";
			$status = isset( $entry[ "post_status" ] ) ? $entry[ "post_status" ] : false;
	
			// trim our whitespace from the name
			$title = trim( $title );
			
			// alter our status message that gets appended on to the link description in the results list
			if( $status )
			{		
				$status_btn_label = $status;

				// Now, add on our options, with this status marked as selectd
				$status_dropdown = '<select class="wxy-searchmark-sitesearch-entry-status-select-menu">';
				
				// now search for our value and replace it with the addition of "selected" to make the menu show it as the default
				$next_options = $status_select_options;
				
				// CHOOSE WHICH SELECT OPTION SHOULD BE SELECTED
				// only replace if there is a status, otherwise, select public by default
				if( strlen( $status ) > 0 )
				{
					switch (true )
					{
						case $status == "publish":
							
							$next_options = str_replace( 'value="' . strtolower( $status ) . '">', 'value="public" selected>', $next_options );
							
							// for the publish status, do not list it, it is assumed that the default is published (publish)
							$status = '<span class="wxy-searchmark-post-status-label"></span>';
							
							break;
						
						case $status == "private":
						
							$next_options = str_replace( 'value="' . strtolower( $status ) . '">', 'value="'.$status.'" selected>', $next_options );
							
							$status = '<span class="wxy-searchmark-post-status-label"> [ private ] </span>';
							break;
							
						default:
						
							// all other status get a grey label
							$next_options = str_replace( 'value="' . strtolower( $status ) . '">', 'value="'.$status.'"', $next_options );
							
							$status = '<span class="wxy-searchmark-post-status-label" style="color:#666;"> [ ' . $status . ' ] </span>';
					}

				}
				
				$status_dropdown .= $next_options;
				
				//close the select menu
				$status_dropdown .= '</select>';
		
			}

			// this is the url user go to in order to view this post type
			$url = get_permalink( $id );
			
			$link = '<li class="page_item page-item-{{post-id}} wxy-searchmark-sitesearch-entry">
						
						<div class="wxy-searchmark-sitesearch-controls-holder">
							<div class="wxy-searchmark-sitesearch-edit-marker"></div>
							<div class="wxy-searchmark-sitesearch-edit-btn"><a href="{{edit-url}}" class="wxy-searchmark-sitesearch-edit-link-alt" unselectable="on">edit</a></div>
							<div class="wxy-searchmark-sitesearch-view-btn"><a href="{{view-link}}" class="wxy-searchmark-sitesearch-view-link" unselectable="on">view</a></div>
							<div class="wxy-searchmark-sitesearch-select-btn">select</div>
							<div class="wxy-searchmark-sitesearch-trash-btn"><a href="{{view-url}}" class="wxy-searchmark-sitesearch-view-url" unselectable="on">trash</a></div>
							<div class="wxy-searchmark-sitesearch-status-btn">' . $status_dropdown . '</div>
							
							<div class="wxy-searchmark-sitesearch-bookmark-btn">bookmark this</div>
						</div>
						
						<a href="{{edit-url}}" unselectable="on" style="color:#2c75ab;" class="wxy-searchmark-sitesearch-edit-link" data-postid="{{post-id}}">{{post-name}}</a>

					</li>';
		
			// -------------------------------------------------------------
			// MULTISITE: If a different site is passed, use that instead... 
			// -------------------------------------------------------------
			$edit_url = $home_url . "/wp-admin/post.php?post=" . $id . "&action=edit";
			
			// if our NAME is blank, use the url instead (perma link)
			if( strlen( $title ) <= 0 || $title == "undefined" || $title == "" )
			{
				$title = $edit_url;
			}
			
			// now search and replace in our new html li entry
			$link = str_replace( "{{post-id}}", $id, $link );
			$link = str_replace( "{{view-link}}", $url, $link );
			$link = str_replace( "{{edit-url}}", $edit_url, $link );
		
			// see if there is anything we need to add to the title....
			$prepend = "";
			$sort_field = isset( $vars[ "search_vars" ][ "searchmark_form_sort" ] ) ? $vars[ "search_vars" ][ "searchmark_form_sort" ] : "";

			switch (true)
			{
				case $sort_field == "author":
	
					$author_id = $entry[ "post_author" ];

					$author_first = get_the_author_meta( 'first_name', $author_id );
					$author_last = get_the_author_meta( 'last_name', $author_id );
					
					$author_name = $author_first . " " . $author_last;
					
					// sorted by AUTHOR
					if( strlen( $author_name ) <= 1 )
					{
						$author_name = '<span class="wxy-searchmark-result-prefix-grey">( none )</span> ';
					}
					
					$prepend = $author_name . "&nbsp;&mdash;&nbsp;";

					break;
					
				case $sort_field == "slug":
		
					// sorted by SLUG
					$prepend = $entry[ "post_name" ] . "<br />";
					break;
			
				case $sort_field == "searchmark_form_type":
		
					// sorted by TYPE 
					$prepend = $entry[ "searchmark_form_post_type" ] . "&nbsp;&mdash;&nbsp;";
					break;
					
				case $sort_field == "date":
		
					// sorted by DATE
					$prepend = $entry[ "post_date" ] . "&nbsp;&mdash;&nbsp;";
					break;
					
				case $sort_field == "modified":
		
					// sorted by MODIFICATION DATE
					$prepend = $entry[ "post_modified" ] . "&nbsp;&mdash;&nbsp;";
					break;
			
				case $sort_field == "status":
				
					// sorted by STATUS
					$prepend = $entry[ "post_status" ] . "&nbsp;&mdash;&nbsp;";
			
					break;
			
				case $sort_field == "category":
		
					// sorted by CATEGORY
					$prepend = $entry[ "post_category" ] . "&nbsp;&mdash;&nbsp;";
					break;
			
				case $sort_field == "template":
		
					// sorted by TEMPLATE
					$prepend = $entry[ "post_template" ] . "&nbsp;&mdash;&nbsp;";
					break;
					
				case $sort_field == "tag":
		
					// sorted by TAG
					$prepend = $entry[ "post_tag" ] . "&nbsp;&mdash;&nbsp;";

					break;	
					
			}
			
			// see if there is anything we are sorting by that needs to be prepended to the title description
			if( strlen( $prepend ) > 0 )
			{
				$title = $prepend . '<span class="wxy-searchmark-result-title">' . $title . '</span>';
			}
			
			// now, inject the data from the field we are sorting by! Insert it just before the title
			$link = str_replace( "{{post-name}}", $title . $status, $link );
			
			// add them all together into on HTML chunk
			$private_html .= $link;
			
			// increment our content li count
			$li_count++;

		}

		// add our closing tags
		$private_html .= "</div></ul></div>";		
		
	} else {
		// no private pages
		$private_html = "";
	}
		
	return $private_html;

}



// ***********************************************************************
// USERS: get a list of all currently valid usernames
// ***********************************************************************
function wxy_searchmark_get_all_users()
{
	$all_users = array();
	
	// get a list of all users and super admins!
	$raw_users = get_users( array( 'fields' => array( 'user_login' ) ) );
	$super_admins = get_super_admins();
	
	unset( $entry );
	foreach( $super_admins as &$entry )
	{
		$login = $entry;
		$entry = new stdClass;
		$entry->user_login = $login;
	}

	// add the two arrays together
	$raw_users = array_merge( $raw_users, $super_admins );

	// Array of stdClass objects.
	foreach ( $raw_users as $user ) {
		array_push( $all_users, esc_html( $user->user_login ) );
	}
	
	return $all_users;
}

// ***********************************************************************
// WordPress - Store timestamp of a user's last login as user meta
// ***********************************************************************
add_action( 'wp_login', 'wxy_searchmark_user_last_login', 10, 2 );

function wxy_searchmark_user_last_login( $user_login, $user )
{
	// this is to help keep track of whether or not we should reset the user select menu value between page loads or initial sign in's (user changes)
	update_user_meta( $user->ID, '_initial_login', 1 );
}

// ----------------------------------------------------------------------------------
// OPTIONS: register our options to save so the system can filter out extraneous data if sent to the server on POST's
// ------------------------------------------------------------------------------------
function register_wxy_searchmark_settings()
{
	//register our settings
	register_setting( 'wxy-searchmark-settings-group', 'wxy_searchmark_autosave' );
}



// ***********************************************************************
// SETTINGS: handle our settings and help page...
// ***********************************************************************
// create custom plugin settings menu
if( is_admin() )
{
	add_action('admin_menu', 'wxy_searchmark_plugin_create_menu');

	function wxy_searchmark_plugin_create_menu()
	{
		//create new top-level menu
		add_options_page('WXY Searchmark > Settings', 'WXY Searchmark', 'administrator', 'wxy_searchmark_options_page' , 'wxy_searchmark_options_page' );

		//call register settings function
		add_action( 'admin_init', 'register_wxy_searchmark_settings' );
	}

	// OPTIONS-CONTROL PANE: this is where all the user-facing controls are...
	function wxy_searchmark_options_page()
	{	
		if( !current_user_can( 'manage_options' ) )
		{
			wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
		} else {
			
			// include our external file of HTML
			include( "options/wxy-tools-searchmark-options.php" );
		}
	}
}


// ************************************************************************************
// UPLOAD FILE: used for UPLOADS...
// ************************************************************************************
if( !function_exists( 'wp_handle_upload' ) && is_admin() )
{
	include_once( ABSPATH . 'wp-load.php' );
	include_once( ABSPATH . 'wp-admin/includes/file.php' );

	global $wpdb;
}

// ************************************************************************************
// FORM SUBMISSIONS!
// ************************************************************************************
if( is_admin() )
{
	add_action( 'admin_init', 'wxy_searchmark_add_ajax_actions' );
	add_action( 'wp_loaded', 'wxy_searchmark_add_ajax_actions' );
}

function wxy_searchmark_add_ajax_actions()
{
	add_action( 'wp_ajax_wxy_searchmark_request', 'wxy_searchmark_post_handler' );
	add_action( 'wp_ajax_nopriv_wxy_searchmark_request', 'wxy_searchmark_post_handler' );
}
	

function wxy_searchmark_post_handler()
{
	// ------------------------------------------------------------------
	// RESULT: create a result object
	// ------------------------------------------------------------------
	$result = array();
	$result[ "status" ] = "fail";
	$result[ "data" ] = array();
	$result[ "message" ] = "fail";

	// ------------------------------------------------------------------
	// VARS: check ONLY these fields
	// ------------------------------------------------------------------

	// We should filter the file field because we will get it from the $_FILES global
	$vars = array( "action", "wxy-searchmark-nonce", "wxy-searchmark-action", "wxy-searchmark-user", "wxy-searchmark-file", "wxy-searchmark-retries" );
	
	foreach( $vars as $key )
	{
		// sanitize the original, client-passed value
		$value = isset( $_POST[ $key ] ) ? $_POST[ $key ] : "";
		$value = sanitize_text_field( $value );
		
		// make sure it is no longer than 512 characters in length
		if( strlen( $value ) > 512 )
		{
			$value = substr( $value, 0, 512 );
		}
		
		// save it to back to our array our result object!
		$vars[ $key ] = $value;
	}

	// ------------------------------------------------------------------
	// VARS: pass along our file and blank fields - TODO: filter for scripts, php and sql injection (must be JUST HTML!)
	// ------------------------------------------------------------------
	$value = isset( $_POST[ "wxy-searchmark-blank" ] ) ? $_POST[ "wxy-searchmark-blank" ] : "";
	$vars[ "wxy-searchmark-blank" ] = esc_html( $value );

	// ------------------------------------------------------------------
	// USERNAME: dont trust the name they send! get a list of users and verify that they are valid!
	// ------------------------------------------------------------------
	$test_user = $vars[ "wxy-searchmark-user" ];
	$all_users = wxy_searchmark_get_all_users();
	$vars[ "wxy-searchmark-user" ] = false;

	foreach( $all_users as $wp_user )
	{
		if( $test_user == $wp_user )
		{
			$vars[ "wxy-searchmark-user" ] = $wp_user;
		}
	}
	
	if( !$vars[ "wxy-searchmark-user" ] )
	{
		// there is no such user... fail silently...???
		$result[ "status" ] = "fail";
		$result[ "message" ] = "Username error.";
		$result[ "data" ] = array();
		
		echo WXY_SEARCHMARK_JSON_HEADER . json_encode( $result ) . WXY_SEARCHMARK_JSON_FOOTER;
		exit();
	}

	// ------------------------------------------------------------------
	// don't filter the data! We will base64 it as needed!
	// ------------------------------------------------------------------
	$vars[ "wxy-searchmark-data" ] = isset( $_POST[ "wxy-searchmark-data" ] ) ? $_POST[ "wxy-searchmark-data" ] : "";
	
	// ------------------------------------------------------------------
	// ACTION: be sure to pass this back in the result object
	// ------------------------------------------------------------------
	$result[ "action" ] = $vars[ "wxy-searchmark-action" ];
	
	// ------------------------------------------------------------------
	// USER STILL SIGNED IN?
	// ------------------------------------------------------------------
	if( function_exists( "is_user_logged_in" ) )
	{
		$vars[ "logged_in" ] = is_user_logged_in();

		if( $vars[ "logged_in" ] )
		{
			$vars[ "logged_in" ] = 1;
		} else {
			$vars[ "logged_in" ] = 0;
		}
	} else {
		$vars[ "logged_in" ] = 0;
	}

	if( $vars[ "logged_in" ] == 0 )
	{
		$result[ "status" ] = "fail";
		$result[ "message" ] = "";//You do not appear to be signed in anymore. Please log into the Wordpress admin panel to use this utility.";
		$result[ "data" ] = array();
		$result[ "data" ][ "vars" ] = $vars;

		echo WXY_SEARCHMARK_JSON_HEADER . json_encode( $result ) . WXY_SEARCHMARK_JSON_FOOTER;
		exit();
	}

	// ------------------------------------------------------------------
	// CHECK OUR FORM'S NONCE
	// ------------------------------------------------------------------
	$form_nonce = $vars[ "wxy-searchmark-nonce" ];
	$nonces_match = wp_verify_nonce( $form_nonce, "wxy-searchmark-nonce" );
	
	if( $nonces_match === false )
	{
		// the FORM nonce and the session nonce do not match!
		$result[ "status" ] = "fail";
		$result[ "message" ] = "Data submission to server aborted, nonces do not match. Reload this page and try again. If the problem persists, check your internet connection. " . $show;
		$result[ "data" ] = array();
		$result[ "data" ][ "vars" ] = $vars;
		$result[ "error" ] = "not_signed_in";
		
		echo WXY_SEARCHMARK_JSON_HEADER . json_encode( $result ) . WXY_SEARCHMARK_JSON_FOOTER;
		exit();
	}

	// ------------------------------------------------------------------
	// Perform Action
	// ------------------------------------------------------------------
	switch (true)
	{
		case $vars[ "wxy-searchmark-action" ] == "search-pages-posts" || $vars[ "wxy-searchmark-action" ] == "search-pages-posts-silently":
			$result[ "status" ] = "fail";
			$result[ "message" ] = "Search returned no results.";
			
			// this function performs the action and returns a result object
			$result[ "data" ] = wxy_searchmark_search_pages_posts( $vars );
			
			// be sure to send back our original vars object as well
			$result[ "data" ][ "vars" ] = $vars;
			
			// reassign our result props to reflect last function process
			$result[ "status" ] = $result[ "data" ][ "status" ];
			$result[ "message" ] = $result[ "data" ][ "message" ];

			break;
		
		case $vars[ "wxy-searchmark-action" ] == "change-post-status":
			$result[ "status" ] = "success";
			$result[ "message" ] = "STATUS: Your posts/page status have been updated.";
			$result[ "data" ] = wxy_searchmark_posts_status_change( $vars );
			$result[ "data" ][ "vars" ] = $vars;
			
			// reassign our result props to reflect last function process
			$result[ "status" ] = $result[ "data" ][ "status" ];
			$result[ "message" ] = $result[ "data" ][ "message" ];

			break;
			
		case $vars[ "wxy-searchmark-action" ] == "move-posts-to-trash":
			$result[ "status" ] = "success";
			$result[ "message" ] = "MOVED: Your posts/pages have been moved to the trash.";
			$result[ "data" ] = wxy_searchmark_posts_to_trash( $vars );
			$result[ "data" ][ "vars" ] = $vars;
			
			// reassign our result props to reflect last function process
			$result[ "status" ] = $result[ "data" ][ "status" ];
			$result[ "message" ] = $result[ "data" ][ "message" ];

			break;
		 
		case $vars[ "wxy-searchmark-action" ] == "save-groups-to-server" || $vars[ "wxy-searchmark-action" ] == "save-groups-to-server-silently":
			$result[ "status" ] = "success";
			$result[ "message" ] = "SAVED: Your folders and searchmark have been permanently saved to the database.";
			$result[ "data" ] = wxy_searchmark_save( $vars );
			
			break;
			
		case $vars[ "wxy-searchmark-action" ] == "load-groups-from-server" || $vars[ "wxy-searchmark-action" ] == "load-groups-from-server-silently":
			$result[ "status" ] = "success";
			$result[ "message" ] = "LOADED: Your folders and searchmark have been retrieved from the database.";
			$result[ "data" ] = wxy_searchmark_load( $vars );
			break;
		
		case $vars[ "wxy-searchmark-action" ] == "clear-groups-from-server":
			$result[ "status" ] = "success";
			$result[ "message" ] = "ERASED: All of your folders and searchmark have been cleared from the browser and permanently removed from the database.";
			
			// blank out our vars to save an empty field
			$vars[ "wxy-searchmark-data" ] = "";
			
			// now save a blank recvord!
			$result[ "data" ] = wxy_searchmark_save( $vars );
			break;
			
		case $vars[ "wxy-searchmark-action" ] == "update-groups-options-on-server":
			$result[ "status" ] = "success";
			$result[ "message" ] = "OPTIONS: User options for WXY Bookmarks have been updated.";
			$result[ "data" ][ "vars" ] = $vars;

			// make it an associative object so we can read our settings!
			$vars[ "wxy-searchmark-data" ] = stripslashes( $vars[ "wxy-searchmark-data" ] );
			$options = json_decode( $vars[ "wxy-searchmark-data" ], true );

			// see if we are turning autosave off or on
			if( $options[ "autosave" ] == "0" || $options[ "autosave" ] === false )
			{
				$autosave = 0;
				
			} else {
				$autosave = 1;
			}
			
			// ---------------------------------------------------------
			// save our options to Wordpress
			// ---------------------------------------------------------
			$current_user = wp_get_current_user();	
			$current_user = $current_user->data;
			$option_suffix = sanitize_text_field( $current_user->user_login );

			// set up our initial autosave for this user!
			update_option( 'wxy_searchmark_autosave_' . $option_suffix, $autosave );
			update_option( 'wxy_searchmark_interval_' . $option_suffix, "1" );
		
			break;
		
		case $vars[ "wxy-searchmark-action" ] == "download-groups-from-server":
			
			$result[ "status" ] = "success";
			$result[ "message" ] = "DOWNLOAD: save groups to desktop @ ";
			
			// load our existing searchmark
			$result[ "data" ] = wxy_searchmark_load( $vars );

			// now download them!
			if( $result[ "data" ][ "status" ] == "success" )
			{
				// go ahead and download!
				$data = isset( $result[ "data" ][ "result" ][ "data" ] ) ? $result[ "data" ][ "result" ][ "data" ] : false;		
				
				// clear out the result object from the load request
				$result[ "data" ][ "result" ] = "";
				
				// add it to our vars
				$vars[ "wxy-searchmark-data" ] = $data;
				
				// data is just the HTML of the bookmarks
				if( $data )
				{
					// data found... download!
					$result[ "data" ][ "vars" ] = $vars;
					
					// send the result object, and get the added ZIP info
					$result[ "data" ][ "result" ] = wxy_searchmark_download( $result );

					if( $result[ "data" ][ "result" ][ "status" ] == "fail" )
					{
						$result[ "message" ] = $result[ "data" ][ "result" ][ "message" ];
						
						echo WXY_SEARCHMARK_JSON_HEADER . json_encode( $result ) . WXY_SEARCHMARK_JSON_FOOTER;
						exit();
					}

				} else {
					
					$result[ "status" ] = "fail";
					$result[ "message" ] = "DOWNLOAD: no groups found to download.";

				}
				
			} else {
				// there an error!
				$result[ "status" ] = "fail";
				$result[ "message" ] = "DOWNLOAD: I saw a problem";
			
			}// close if data
			
			break;
			
		case $vars[ "wxy-searchmark-action" ] == "upload-groups-to-server":

			$result[ "data" ] = wxy_searchmark_upload( $vars );
			$result[ "status" ] = $result[ "data" ][ "status" ];
			$result[ "message" ] = $result[ "data" ][ "message" ];

			break;		
			
		default:
			// do nothing for now
			$result[ "status" ] = "fail";
			$result[ "message" ] = "No form action was found.";
	}
	
		
	// send back a result object
	echo WXY_SEARCHMARK_JSON_HEADER . json_encode( $result ) . WXY_SEARCHMARK_JSON_FOOTER;
	die();

}


// ***********************************************************************
// SEARCH PAGES-POSTS: user wants to find pages/posts by their title and URL... eventually add option to search in content as well?
// ***********************************************************************
function wxy_searchmark_search_pages_posts( $vars )
{
	global $wpdb;

	$result[ "status" ] = "fail";
	$result[ "message" ] = "Sorry, your search had an error. Please try again, or check your internet connection.";
	$result[ "result" ] = array();

	// this is the array of posts to delete
	$raw = $vars[ "wxy-searchmark-data" ];
	$raw = stripslashes( $raw );
	
	// turn it into an array
	$search_vars = json_decode( $raw, true );
	
	// ----------------------------------------------------------------
	// sanitize our vars
	// ----------------------------------------------------------------
	foreach( $vars as $key => $val )
	{
		// sanitize the original, client-passed value
		$value = sanitize_text_field( $val );
		
		// make sure it is no longer than 512 characters in length
		if( strlen( $value ) > 512 )
		{
			$value = substr( $value, 0, 512 );
		}

		// save it to back to our array our result object!
		$vars[ $key ] = $value;
	}

	// ----------------------------------------------------------------
	// preprocess any vars that could also be arrays....
	// ----------------------------------------------------------------
	foreach( $search_vars as $key=>$val )
	{
		$val_arr = explode( ",", $val );
		
		// DO NOT SPLIT THE KEYWORDS! User might want to do an exact search and it will fail if we manipulate the string!
		if( count( $val_arr ) > 1 && $key != "searchmark_form_keywords" )
		{
			$search_vars[ $key ] = $val_arr;
		}
	}

	// ----------------------------------------------------------
	// create a search query
	// ----------------------------------------------------------
	$limit = isset( $search_vars[ "searchmark_form_limit" ] ) ? $search_vars[ "searchmark_form_limit" ] : 100;
	$page = isset( $search_vars[ "searchmark_form_page" ] ) ? $search_vars[ "searchmark_form_page" ] : 0;
	$use_page = isset( $search_vars[ "searchmark_form_use_page" ] ) ? $search_vars[ "searchmark_form_use_page" ] : NULL;
	
	if( $use_page )
	{
		$page = $use_page;
	}
	
	// increment our page by one, since the user will see it as starting at one in their search form input field
	$page -= 1;

	// now calculate the total number of records to skip based on the starting page and total results per page
	$offset = $limit * $page;

	// ----------------------------------------------------------
	// get all of the different types of posts and pages
	// ----------------------------------------------------------
	$post_type = $search_vars[ "searchmark_form_type" ];
	
	// create a type string to use in our query string, but only if it is an array
	if( is_array( $post_type ) )
	{
		$post_type = implode( "', '", $post_type );
	} else {	
		// just escape
		$post_type = esc_sql( $post_type );
	}

	// be sure to add our opening and closing apostrophes
	$post_type = "'" . $post_type . "'";
	
	// add it to our vars for use later...
	$vars[ "searchmark_form_post_type" ] = $post_type;
	
	// ----------------------------------------------------------
	// TEMPLATES
	// ----------------------------------------------------------
	$post_template = isset( $search_vars[ "searchmark_form_template" ] ) ? $search_vars[ "searchmark_form_template" ] : "{{ignore-template-type}}";
	
	// don't add anything to the searh query of we want to search for any template
	if( $post_template == "all-templates" )
	{
		$post_template = "{{ignore-template-type}}";
	}
	
	
	// ----------------------------------------------------------
	// SEARCH RESULTS SORTING: see which field we want to sort by....
	// ----------------------------------------------------------
	$sort_field = isset( $search_vars[ "searchmark_form_sort" ] ) ? $search_vars[ "searchmark_form_sort" ] : "title";
		
	// ----------------------------------------------------------
	// SEARCH RESULTS SORTING: see which direction we want to sort in...
	// ----------------------------------------------------------	
	$sort_order = isset( $search_vars[ "searchmark_form_order" ] ) ? $search_vars[ "searchmark_form_order" ] : "ASC";
	
	if( $sort_order != "ASC" && $sort_order != "DESC" )
	{
		$sort_order = "ASC";
	}				
	
	// ----------------------------------------------------------
	// TAGS
	// ----------------------------------------------------------
	$post_tag = isset( $search_vars[ "searchmark_form_tag" ] ) ? $search_vars[ "searchmark_form_tag" ] : "{{ignore-tag-type}}";
	
	// don't add anything to the searh query of we want to search for any template
	if( $post_tag == "all-tags" )
	{
		$post_tag = "{{ignore-tag-type}}";
	}	
	
	// ----------------------------------------------------------
	// STATUS: (expects an array of status types)
	// ----------------------------------------------------------
	$post_status = isset( $search_vars[ "searchmark_form_status" ] ) ? $search_vars[ "searchmark_form_status" ] : "publish";
	
	// create a type string to use in our query string, but only if it is an array
	if( is_array( $post_status ) )
	{
		$post_status = implode( "', '", $post_status );
	} else {	
		// just escape
		$post_status = esc_sql( $post_status );
	}

	// be sure to add our opening and closing apostrophes
	$post_status = "'" . $post_status . "'";
	
	// add it to our vars for use later...
	$vars[ "searchmark_form_post_status" ] = $post_status;
	
	// ----------------------------------------------------------
	// category__in (expects an array of id's)
	// ----------------------------------------------------------
	$category =  isset( $search_vars[ "searchmark_form_category" ] ) ? $search_vars[ "searchmark_form_category" ] : "";
	
	// make sure our categories is empty if we want them all...
	switch (true)
	{
		case $category == "all categories":
			$category = NULL;
			break;
			
		case is_array( $category ):
			$category = implode( "', '", $category );
	
			// be sure to add our opening and closing apostrophes
			$category = "'" . $category . "'";	
			break;
			
		default:
			// just enclose the category in quotes
			$category = "'" . esc_sql( $category ) . "'";
	}
	
	
	// ----------------------------------------------------------
	// get a date to limit our search in (if any)
	// ----------------------------------------------------------
	$month = isset( $search_vars[ "searchmark_form_month" ] ) ? $search_vars[ "searchmark_form_month" ] : "";
	$year = isset( $search_vars[ "searchmark_form_year" ] ) ? $search_vars[ "searchmark_form_year" ] : date( "Y" );

	// handle the month and year separately, so we can search by a select month OR by a full year
	if( $month == "all months" )
	{
		$month = "";

	} else {

		// process our date string into a number for the year, and a number for the month (1-12)
		$calendar = array(
			"january" => array( "number" => 1, "days" => "31" ),
			"february" => array( "number" => 2, "days" => "28" ),
			"march" => array( "number" => 3, "days" => "31" ),
			"april" => array( "number" => 4, "days" => "30" ),
			"may" => array( "number" => 5, "days" => "31" ),
			"june" => array( "number" => 6, "days" => "30" ),
			"july" => array( "number" => 7, "days" => "31" ),
			"august" => array( "number" => 8, "days" => "31" ),
			"september" => array( "number" => 9, "days" => "30" ),
			"october" => array( "number" => 10, "days" => "31" ),
			"november" => array( "number" => 11, "days" => "30" ),
			"december" => array( "number" => 12, "days" => "31" )
		);

		// now split our string into the month/year
		$month = $calendar[ $month ][ "number" ];
		
		// pad our month to make sure it is 2 digits...
		$month = str_pad( $month, 2, "0", STR_PAD_LEFT );// options are: STR_PAD_LEFT, STR_PAD_BOTH, STR_PAD_RIGHT
	}
	
	if( strlen( $year ) <= 0 )
	{
		$year = "";

	}
	
	
	// ----------------------------------------------------------
	// get our author (if any)
	// ----------------------------------------------------------
	$author = isset( $search_vars[ "searchmark_form_author" ] ) ? $search_vars[ "searchmark_form_author" ] : "";
	
	// make sure our categories is empty if we want them all...
	if( $author == "all authors" )
	{
		$author = NULL;
	}
	
	$author = esc_sql( $author );

	// ----------------------------------------------------------
	// keywords - see if we have any keywords to filter by
	// ----------------------------------------------------------
	$keywords =  isset( $search_vars[ "searchmark_form_keywords" ] ) ? $search_vars[ "searchmark_form_keywords" ] : NULL;

	if( $keywords )
	{
		// escape our keywords string
		$keywords = addslashes( $keywords );
		
		// save our raw keywords string for later, in case this is an exact search
		$original_keywords = $keywords;

		// now create an array
		$keywords = explode( " ", $keywords );
	}
	
	if( count( $keywords ) <= 0 )
	{
		$keywords = NULL;
	}


	// ----------------------------------------------------------
	// search location: what should we search in?
	// ----------------------------------------------------------
	$location = isset( $search_vars[ "searchmark_form_location" ] ) ? $search_vars[ "searchmark_form_location" ] : NULL;
	$location = esc_sql( $location );
	
	// --------------------------------------------------
	// BUILD AN ARRAY TO HOLD OUR DIFFERENT DB TABLES: this is for multisite support
	// --------------------------------------------------
	$db = array();
	
	// this changes depending on which user tables are being used
	$db[ "prefix" ] = $wpdb->prefix;
	
	// this should be the prefice of the main wp set of tables, not user tables
	$db[ "base_prefix" ] = $wpdb->base_prefix;
	
	// --------------------------------------------------
	// see if this is a multisite search or an admin main search
	// --------------------------------------------------
	$home_url = "";

	if( function_exists( "get_sites" ) )
	{
		// only alter our DB prefix if this is NOT the main blog!
		if( $search_vars[ "searchmark_form_sites" ] != 1 )
		{
			$prefix = $db[ "prefix" ];
			$db[ "prefix" ] = $db[ "base_prefix" ] . $search_vars[ "searchmark_form_sites" ] . "_";
			//$db[ "base_prefix" ] = $prefix . $search_vars[ "searchmark_form_sites" ] . "_";
		}
		
		// we also need the new home url for this site...
		$sites = get_sites();
		$blog_id = $search_vars[ "searchmark_form_sites" ];
		
		foreach( $sites as $site )
		{
			if( $blog_id == $site->blog_id )
			{
				$home_url = "https:" . $site->domain . $site->path;
				break;
			}
		}
	}

	// the posts should be based on the user's tables (multisite)
	$db[ "posts" ] = $db[ "prefix" ] . "posts";
	
	// all other fields should be based on the multisite tables
	$db[ "postmeta" ] = $db[ "base_prefix" ] . "postmeta";
	$db[ "term_relationships" ] = $db[ "base_prefix" ] . "term_relationships";
	$db[ "term_taxonomy" ] = $db[ "base_prefix" ] . "term_taxonomy";
	$db[ "terms" ] = $db[ "base_prefix" ] . "terms";

	// --------------------------------------------------
	// now build our arguments array for the actual search
	// --------------------------------------------------
	
	// REMEMBER: post meta tables must be joined twice to search for more than one meta key!
	$query_str = "SELECT DISTINCT SQL_CALC_FOUND_ROWS " . $db[ "posts" ] . ".* FROM " . $db[ "posts" ] . "			
		LEFT JOIN " . $db[ "postmeta" ] . " ON( " . $db[ "posts" ] . ".ID = " . $db[ "postmeta" ] . ".post_id )
		";
				
				
	// see if we need to join the meta data multiple times to do multiple meta_key searches
	if( $location != "everywhere" && $location != "title" && $location != "content" && $location != "slug" )
	{
		$query_str .= "LEFT JOIN " . $db[ "postmeta" ] . " AS " . $db[ "postmeta" ] . "_2 ON( " . $db[ "posts" ] . ".ID = " . $db[ "postmeta" ] . "_2.post_id )
		";
	}

	// now complete the header of our query string			
	$query_str .= "LEFT JOIN " . $db[ "term_relationships" ] . " ON( " . $db[ "posts" ] . ".ID = " . $db[ "term_relationships" ] . ".object_id )
		LEFT JOIN " . $db[ "term_taxonomy" ] . " ON( " . $db[ "term_relationships" ] . ".term_taxonomy_id = " . $db[ "term_taxonomy" ] . ".term_taxonomy_id )
		LEFT JOIN " . $db[ "terms" ] . " ON( " . $db[ "term_taxonomy" ] . ".term_id = " . $db[ "terms" ] . ".term_id )
	";
	
	// see if we need to join more tables to search for tags or categories
	if( $category )
	{
		$query_str .= "LEFT JOIN " . $db[ "term_relationships" ] . " AS " . $db[ "term_relationships" ] . "_2 ON( " . $db[ "posts" ] . ".ID = " . $db[ "term_relationships" ] . "_2.object_id )
			LEFT JOIN " . $db[ "term_taxonomy" ] . " AS " . $db[ "term_taxonomy" ] . "_2 ON( " . $db[ "term_relationships" ] . "_2.term_taxonomy_id = " . $db[ "term_taxonomy" ] . "_2.term_taxonomy_id )
		";
	}


	// ---------------------------------------------------------
	// TYPES: add our post types (page, post, etc...)
	// ---------------------------------------------------------
	$query_str .= 	"WHERE " . $db[ "posts" ] . ".post_type IN( " . $post_type . " )
	";
	
	// ---------------------------------------------------------
	// STATUS: whether it is publish, private, etc.
	// ---------------------------------------------------------
	$query_str .= 	"AND " . $db[ "posts" ] . ".post_status IN( " . $post_status . " )
	";
	
	// ---------------------------------------------------------
	// TEMPLATE: whether it has a certain template
	// ---------------------------------------------------------
	if( $post_template != "{{ignore-template-type}}" )
	{
		$query_str .= 	"AND " . $db[ "postmeta" ] . ".meta_key = '_wp_page_template'
						AND " . $db[ "postmeta" ] . ".meta_value = '" . $post_template . "'
		";
	}

	// ---------------------------------------------------------
	// TAG: whether it has a certain tag
	// ---------------------------------------------------------
	if( $post_tag != "{{ignore-tag-type}}" )
	{
		$query_str .= 	"AND " . $db[ "term_taxonomy" ] . ".term_taxonomy_id = '" . $post_tag . "'
		";
	}
	
	// ---------------------------------------------------------
	// KEYWORDS: add our keywords to look for in the post_title
	// ---------------------------------------------------------
	if( $keywords )
	{
		$search = array();
		$search[ "in_title" ] = array();
		$search[ "in_content" ] = array();
		$search[ "in_name" ] = array();
		$search[ "in_meta" ] = array();

		// since this comes from the client-side and goes in a query, we cannot trust the value passed!
		$glue = isset( $search_vars[ "searchmark_form_glue" ] ) ? $search_vars[ "searchmark_form_glue" ] : "OR";

		// see what kind of match to perform...
		switch (true)
		{
			case $glue != "AND" && $glue != "OR" && $glue != "EXACT":
			
				$glue = "OR";
				break;
				
			case $glue == "EXACT":
		
				// we want to match our seatch string exactly	
				$glue = "AND";
				
				// swap our original string back as a single entry in our keywords array
				$keywords = array( $original_keywords );
				
				break;
				
			default:
				// nothing by default
		}
 		
		$prefix = "OR";
		
		foreach( $keywords as $index => $word )
		{
			// be sure to escape it
			$word = esc_sql( $word );
			
			switch (true)
			{
				case $location == "everywhere":
				
					// look in EVERYWHERE
					array_push( $search[ "in_title" ], "" . $db[ "posts" ] . ".post_title LIKE '%" . $word . "%'" );
					
					array_push( $search[ "in_name" ], "" . $db[ "posts" ] . ".post_name LIKE '%" . $word . "%'" );
					
					array_push( $search[ "in_content" ], "" . $db[ "posts" ] . ".post_content LIKE '%" . $word . "%'" );

					array_push( $search[ "in_meta" ], "CAST( " . $db[ "postmeta" ] . ".meta_value AS CHAR ) LIKE '%" . $word . "%'" );

					break;
					
				case $location == "title":
					
					// look in JUST the title
					array_push( $search[ "in_title" ], "" . $db[ "posts" ] . ".post_title LIKE '%" . $word . "%'" );
					
					break;
					
				case $location == "content":
				
					// look in JUST the content
					array_push( $search[ "in_content" ], "" . $db[ "posts" ] . ".post_content LIKE '%" . $word . "%'" );
					
					break;
					
				case $location == "slug":
				
					// look in JUST the slugs
					array_push( $search[ "in_name" ], "" . $db[ "posts" ] . ".post_name LIKE '%" . $word . "%'" );
					
					break;
				
				default:

					// only add this to the search if there is a value for location
					if( isset( $location ) && strlen( $location ) > 0 )
					{
						// they can only select one of the above, otherwise it MUST be a single meta_key they want to search in...
						array_push( $search[ "in_meta" ], $db[ "postmeta" ] . "_2.meta_key = '" . $location . "' AND " . $db[ "postmeta" ] . "_2.meta_value LIKE '%" . $word . "%'" );
					}
									
					break;
			}
			
		}
		
		// now that we have arrays of search statements (from above), glue them together!
		$sql = "";
		$tick = 0;
		
		foreach( $search as $id => $this_search )
		{
			if( count( $this_search ) > 0 )
			{
				if( $tick != 0 )
				{
					$sql .= $prefix . " ";
				}
				
				$sql .= implode( " $glue ", $this_search );
				$tick++;
			}
		}
		
		$sql = "AND ( " . $sql . " )
		";
	}
	
	// now add the above to the main query string
	$query_str .= $sql;


	// ---------------------------------------------------------
	// AUTHOR: add our post author to look for
	// ---------------------------------------------------------
	if( $author )
	{
		$query_str .= "AND " . $db[ "posts" ] . ".post_author IN ( " . $author . " )
		";
	}

	
	// ---------------------------------------------------------
	// CATEGORY: add our category to look for
	// ---------------------------------------------------------
	if( $category )
	{
		$query_str .= "AND " . $db[ "term_taxonomy" ] . "_2.term_id = " . $category . "
		";	
	}

	// ---------------------------------------------------------
	// DATE: add a date (date range) - date should always have the month and year
	// ---------------------------------------------------------
	if( $month || $year )
	{
		$date_pref = "";
		
		$count_month = strlen( $month );
		$count_year = strlen( $year );
		
		// year/month
		switch (true)
		{
			case $count_year > 0 && $count_month > 0:

				$date_pref .= $year . "-" . $month . "-";
				break;
				
			case $count_year > 0 && $count_month <= 0:

				$date_pref .= $year . "-";
				break;
				
			case $count_year <= 0 && $count_month > 0:

				$date_pref .= "-" . $month . "-";
				break;
		}
			
			$query_str .= "AND " . $db[ "posts" ] . ".post_date_gmt LIKE '%$date_pref%' 
			";
	}
	
	// ---------------------------------------------------------
	// finish off by adding our limit, offset, sort direction and which field to sort results by
	// ---------------------------------------------------------
	switch (true)
	{
		case $sort_field == "title":
		
			// sort by TITLE
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_title " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "slug":
		
			// sort by SLUG
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_name " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "searchmark_form_type":
		
			// sort by TYPE 
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_type " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "date":
		
			// sort by DATE
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_date_gmt " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "modified":
		
			// sort by post_midified_gmt
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_modified_gmt " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "status":
		
			// sort by STATUS
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_status " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "author":
		
			// sort by AUTHOR
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_author " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "category":
		
			// sort by CATEGORY
			$query_str .= "ORDER BY " . $db[ "term_taxonomy" ] . ".term_id " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "template":
		
			// sort by TEMPLATE
			$query_str .= "ORDER BY " . $db[ "postmeta" ] . ".meta_value " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "tag":
		
			// sort by TAG
			$query_str .= "ORDER BY " . $db[ "term_taxonomy" ] . ".term_taxonomy_id " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		case $sort_field == "meta":

			// sort by META
			$query_str .= "ORDER BY " . $db[ "postmeta" ] . "_2.meta_value " . $sort_order . " LIMIT " . $offset . "," . $limit;

			break;
			
		default:
			// sort by TITLE by default		
			$query_str .= "ORDER BY " . $db[ "posts" ] . ".post_title " . $sort_order . " LIMIT " . $offset . "," . $limit;
	}

	// --------------------------------------------------
	// now, EXECUTE our query
	// --------------------------------------------------
	$posts = $wpdb->get_results( $query_str, OBJECT );

	// --------------------------------------------------
	// get the TOTAL number of results if we were not limiting the page size...
	// --------------------------------------------------
	$row_count = $wpdb->get_results( "SELECT FOUND_ROWS()" );
	$vars[ "searchmark_form_max_results" ] = isset( $row_count[0]->{ 'FOUND_ROWS()' } ) ? $row_count[0]->{ 'FOUND_ROWS()' } : "unknown";
	$vars[ "searchmark_form_max_results" ] = intval( $vars[ "searchmark_form_max_results" ] );

	// -----------------------------------------------------
	// build a result object
	// -----------------------------------------------------
	$result[ "status" ] = "success";
	
	// if there are posts found, build our html, otherwise, show an error
	if( count( $posts ) > 0 )
	{
		// be sure to add our search vars tp the vars object for use in the next fn
		$vars[ "search_vars" ] = $search_vars;
		
		// call a function instead...
		$result[ "result" ] = wxy_searchmark_private_post_page_html( $posts, $vars, $home_url );
		$result[ "message" ] = "search process complete";

	} else {
		
		// no results? Check for an error....
		if( $wpdb->last_error )
		{
			$result[ "result" ] = '<div class="wxy-searchmark-sitesearch-tab-no-results-msg">WP Reported an error: ' . $wpdb->last_error . '</div>';
			$result[ "message" ] = "WP mysq reported an error: " . $wpdb->last_error;

		} else {
			
			$timestamp = date("m-d-Y h:i:s");
			
			$result[ "result" ] = '<div class="wxy-searchmark-sitesearch-tab-no-results-msg">0 results found @ ' . $timestamp . '</div>';
			$result[ "message" ] = "No results found.";
		}
	}
		
	// -------------------------------------------------------------------
	// finally, send back a result object
	// -------------------------------------------------------------------
	return $result;
}

// ***********************************************************************
// META KEYS: collect and return an ordered list of ALL meta keys in the WP database!
// ***********************************************************************
function wxy_searchmark_get_metakeys()
{
	global $wpdb;

	// --------------------------------------------------
	// SELECT meta_key FROM wp_postmeta WHERE post_id = POST_ID
	// --------------------------------------------------
	$table_name = $wpdb->prefix . 'postmeta';
	$db_name = $wpdb->dbname;

	$query_str = "SELECT DISTINCT `meta_key` FROM `" . $table_name . "` WHERE 1 ORDER BY `meta_key` ASC;";

	// --------------------------------------------------
	// now, EXECUTE our query
	// --------------------------------------------------
	$keys = $wpdb->get_results( $query_str, OBJECT );

	
	// -------------------------------------------------------------------
	// SORT: process and sort all keys to be used in our menus
	// -------------------------------------------------------------------
	$result = $keys;
	
	
	// -------------------------------------------------------------------
	// restore our original query (if any)
	// -------------------------------------------------------------------
	wp_reset_query();
		
	// -------------------------------------------------------------------
	// finally, send back a result object
	// -------------------------------------------------------------------
	return $result;
	
}



// ***********************************************************************
// POST STATUS UPDATES: user wants to change the status of one or more posts
// ***********************************************************************
function wxy_searchmark_posts_status_change( $vars )
{
	$result[ "status" ] = "fail";
	$result[ "message" ] = "Sorry, the status change request failed.";
	$result[ "result" ] = array();

	// this is the array of posts to delete
	$raw = $vars[ "wxy-searchmark-data" ];
	$raw = stripslashes( $raw );
	
	// turn it into an array
	$data = json_decode( $raw, true );

	// enumerate through all entries and execute the update!
	if( function_exists( "wp_update_post" ) )
	{		
		// function exists... trash the posts
		$result[ "status" ] = "success";
		$result[ "message" ] = "The stautus of your requested posts/pages has been changed.\r\n\r\nThe current page will now reload to refresh the sitesearch.";
	
		$success = array();
		$failed = array();

		foreach( $data[ "post_ids" ] as $key => $val)
		{	
			if( $val != -1 )
			{
				// get the post content then change the status value
				$change_post = get_post( $val );
   
				// now save it to the DB
				$status = wp_update_post(
					array(
						'ID' => $val,
						'post_status' => $data[ "post_status" ]
					)
				);

			}
			
			if( $status != $val )
			{
				// there was a problem with this entry
				array_push( $failed, $val );
			} else {
				// it was a success!
				array_push( $success, $val );
			}
		}

	} else {
		$success = array();
		$failed = $remove_posts;
		
		$result[ "status" ] = "fail";
		$result[ "message" ] = "Sorry, the status change request failed.";
	}
	
	// alter our success message to reflect partial move success
	if( count( $success ) > 0 && count( $failed ) > 0 )
	{
		$result[ "message" ] = count( $success ) . " posts/pages had their status change and " . count( $failed ) . " were unable to be changed.";
	}
	
	// be sure to add the resuls arrays back into the resul object to pass back to the client side
	$result[ "result" ] = array( "success" => $success, "fail" => $failed );

	// now send back our result!
	return $result;
}


// ***********************************************************************
// MOVE POSTS TO TRASH: Take one or more posts and move them to the trash
// ***********************************************************************
function wxy_searchmark_posts_to_trash( $vars )
{
	$result[ "status" ] = "fail";
	$result[ "message" ] = "SORRY: the selected posts/pages could not be put in the trash.";
	$result[ "result" ] = array();

	// this is the array of posts to delete
	$raw = $vars[ "wxy-searchmark-data" ];
	
	// turn it into an array
	$remove_posts = json_decode( $raw, true );
	
	// make sure they have high enough privileges to remove pages/posts
	if( !current_user_can( "delete_others_pages" ) || !current_user_can( "delete_others_posts" ) )
	{
		// ooops! they do not have enough privileges
		$result[ "status" ] = "fail";
		$result[ "message" ] = "Sorry, your user account does not allow you to delete posts and pages.";
		
		$success = array();
		$failed = $remove_posts;
		
		$result[ "result" ] = array( "success" => $success, "fail" => $failed );

		return $result;
	}

	// enumerate through all entries and execute the removal!
	if( function_exists( "wp_trash_post" ) )
	{
		// function exists... trash the posts
		$result[ "status" ] = "success";
		$result[ "message" ] = "The requested posts/pages were placed in the trash.\r\n\r\nThe current page will now reload to refresh the sitesearch.";
	
		$success = array();
		$failed = array();

		foreach( $remove_posts as $key => $val)
		{
			if( $val != -1 )
			{
				// go ahead and remove it
				$status = wp_trash_post( $val );
			}
			
			if( $status->post_status != "trash" )
			{
				// thre was a problem with this entry
				array_push( $failed, $val );
			} else {
				// it was a success!
				array_push( $success, $val );
			}
			
		}

	} else {
		$success = array();
		$failed = $remove_posts;
		
		$result[ "status" ] = "fail";
		$result[ "message" ] = "None of your posts were able to be moved to the trash.";
	}
	
	// alter our success message to reflect partial move success
	if( count( $success ) > 0 && count( $failed ) > 0 )
	{
		$result[ "message" ] = count( $success ) . " posts/pages were moved to the trash and " . count( $failed ) . " were unable to be moved.";
	}
	
	// be sure to add the resuls arrays back into the resul object to pass back to the client side
	$result[ "result" ] = array( "success" => $success, "fail" => $failed );

	// now send back our result!
	return $result;
}



// ***********************************************************************
// IMPORT via upload, some plugin data and add it to our database!
// ***********************************************************************
function wxy_searchmark_upload( $vars )
{
	// make wordpress save our file to the uploads directory
	$file = wp_upload_bits( $_FILES['wxy-searchmark-file']['name'], null, @file_get_contents( $_FILES['wxy-searchmark-file']['tmp_name'] ) );

	// FILENAME: this is the new filename
	$filename = basename( $file[ "url" ] );
	
	// figure out the actual path to the file
	$dir_array = wp_upload_dir();
	$path = $dir_array[ "path" ] . "/";
	$url = $path . $filename;
	
	// replace the .zip extension with our .txt extension
	$unzipped_file = preg_replace( "/\.zip/", ".txt", $filename);
	$unzipped_file = $path . $unzipped_file;
	$zipped_file = $url;
	
	// ---------------------------------------------------------
	// create a result object
	// ---------------------------------------------------------
	$result = array();
	
	// ---------------------------------------------------------
	// now UNZIP the file!
	// ---------------------------------------------------------
	$zip = new ZipArchive;

	$res = $zip->open( $zipped_file );

	if($res === TRUE)
	{
		$zip->extractTo( $path );
		$zip->close();
  
  		// success!!
		$result[ "status" ] = "success";
		$result[ "message" ] = "The file was unzipped.";
		
	} else {
		// unzipping failed!
		$result[ "status" ] = "fail";
		$result[ "message" ] = "The file was not able to be unzipped.";
	}

	// now, delete the ZIP version
	unlink( $zipped_file );
	
	// ---------------------------------------------------------
	// proceed only if we succeeded in unzipping our file
	// ---------------------------------------------------------
	if( $result[ "status" ] == "success" )
	{
		// read the contents of the unzipped text file!
		if( $content = file_get_contents( $unzipped_file ) )
		{
			$result[ "status" ] = "success";
			$result[ "message" ] = "File contents read";

		} else {
			$result[ "status" ] = "fail";
			$result[ "message" ] = "File contents could not be read";
			$result[ "result" ][ "data" ] = "";
		}
		
		// now get our database contents, combine them, and save it all back into the DB, but only if the above was a success
		if( $result[ "status" ] == "success" )
		{	
			// get our old content from the DB
			$db_record = wxy_searchmark_load( $vars );

			// our result is actually our vars in this case
			$db_result = $db_record[ "result" ];
			
			// this is the html stored in the database
			$db_html = $db_result[ "data" ];

			
			// --------------------------------------------------------------
			// combine! - wrap new items in a group
			// --------------------------------------------------------------
	
			// pass the group html from the widget's html
			$new_group = isset( $vars[ "wxy-searchmark-blank" ] ) ? $vars[ "wxy-searchmark-blank" ] : false;
			
			// strup out escaping slashes
			$new_group = stripslashes( $new_group );
			
			// convert html code back into html entities		
			$new_group = html_entity_decode( $new_group );

			// only wrap in a group if there is a blank group AND there is some saved content
			if( $new_group && strlen( $db_html ) > 0 )
			{
				// replace our group title with a date (d/m/y
				$date = date('m/d/Y \@ h:i:s a', time());
				$datetime = "[ Bookmarks Imported on " . $date . " ]";
				$new_group = str_replace( "{{group-title}}", $datetime, $new_group );
				
				// now add in our new content!
				$new_group = str_replace( "{{searchmark-holder}}", $content, $new_group );
				
				// finally, combine them both
				$combined_html = $new_group . $db_html;

			} else {
				// default to a single chunk instead of wrapping new items in a group
				$combined_html = $db_html . $content;	
				
			}
			
			// --------------------------------------------------------------
			// put our html back in the vars
			// --------------------------------------------------------------
			$vars[ "wxy-searchmark-data" ] = $combined_html;

			// now store it back in the db!
			$db_save = wxy_searchmark_save( $vars );
			
			
			// see if we had a success or failure
			if( $db_save[ "status" ] == "success" )
			{
				$result[ "status" ] = "success";
				$result[ "message" ] = "Uploaded searchmark were combined with searchmark stored in the database.";
				$result[ "result" ] = array();
				
				$db_save[ "result" ] = array();
				$db_save[ "result" ][ "data" ] = $combined_html;
				$result[ "result" ] = $db_save[ "result" ];
				
				$result[ "vars" ] = $vars;
				$result[ "vars" ][ "wxy-searchmark-data" ] = "";

			} else {
				$result[ "status" ] = "fail";
				$result[ "message" ] = "SORRY: uploaded searchmark could not be combined with searchmark stored in the database.";
				$result[ "result" ] = array();
			}// if saved
		}// if unzipped content loaded
	}// if file unzipped

	// unlink the text file from the server
	unlink( $unzipped_file );

	// send back our result object
	return $result;
	
}

	
// ***********************************************************************
// SAVE some plugin data to the table in the WP database
// ***********************************************************************
function wxy_searchmark_save( $vars )
{
	// ------------------------------------------------------
	// get our wp database global
	// ------------------------------------------------------
	global $wpdb, $wxy_searchmark_jal_db_version;
	
	// ------------------------------------------------------
	// see if our destination table exists... if not, create it
	// ------------------------------------------------------	
	$table_name = $wpdb->prefix . 'wxy_searchmark_data';
	$db_name = $wpdb->dbname;

	if( $wpdb->get_var( "SHOW TABLES LIKE '" . $table_name . "'" ) != $table_name )
	{	
		//table not in database. Create new table 
		$charset_collate = $wpdb->get_charset_collate();
	
		$sql = "CREATE TABLE IF NOT EXISTS `" . $db_name . "`.`" . $table_name . "` (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			user TINYTEXT NOT NULL,
			date TINYTEXT NOT NULL,
			data LONGTEXT NOT NULL,
			settings LONGTEXT NOT NULL,
			UNIQUE KEY id (id)
		) $charset_collate; )";
	
		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );
		
	}

	// these are auto generated values...
	$id = NULL;
	$user = isset( $vars[ "wxy-searchmark-user" ] ) ? $vars[ "wxy-searchmark-user" ] : false;
	$date = microtime( true );
	$raw_data = isset( $vars[ "wxy-searchmark-data" ] ) ? $vars[ "wxy-searchmark-data" ] : false;
	$settings = "";
	
	// encode our data!
	$data = base64_encode( $raw_data );
	
	// assign the name of our DB
	$table_name = $wpdb->prefix . 'wxy_searchmark_data';
	$db_name = $wpdb->dbname;
	
	$charset_collate = $wpdb->get_charset_collate();

	// --------------------------------------------------------------------
	// get our user's id number (if this is multisite then get it from the root users table)
	// --------------------------------------------------------------------
	/*
			in multisite, we have different prefixes for the different user incarnations of the site... like wp_2_, etc.
			BUT, all of the user accounts are stored in the main base site (wp_) and the table is wp_users	
			This gives us something like wp_users instead of a single site installation in a multisite mode like wp_wp_2_users
	*/
	$alt_db_name = $wpdb->base_prefix . "users";	
	$query = "SELECT id FROM `" . $alt_db_name . "` WHERE `user_login`='" . $user . "';";
	
	// now get our data to see what the user's id number is...
	$record = $wpdb->get_results( $query );
	$result = wxy_searchmark_object_to_array( $record );
	
	if( count( $result ) > 0 )
	{
		$id = $result[0]["id"];
	} else {
		$id = NULL;
	}
	
	// see if this is a super admin... if so, only save their items to the MAIN database!
	$super_admin = is_super_admin( $id );
	
	if( $super_admin == 1 )
	{
		// point our table back at the MAIN table instead of an individual multisite site
		$table_name = $wpdb->base_prefix . 'wxy_searchmark_data';
	}

	// be sure to pass our VARS back!
	$response[ "vars" ] = $vars;
		
	// only execute if there is some data to save and a valid user
	if( $user )
	{
		$result = $wpdb->replace(
		
			$table_name, 
			
			array(
				'id' => $id,
				'user' => $user,
				'date' => $date,
				'data' => $data,
				'settings' => $settings
			), 
		
			array( 
					'%d',	// value1
					'%s',	// value2
					'%s',	// value3
					'%s',	// value4
					'%s'	// value5
				)
		);

		if( $result )
		{
			// add some messaging
			$response["status"] = "success";
			$response["message"] = "Your Groups and their searchmark have been saved to the server.";
	
			// now wrap it all up...
			$response["result"] = $result;
		
		} else {
			// FAIL!
			$response["status"] = "fail";
			$response["message"] = "There was an error saving to the database.";
			$response["result"] = array();
		}
	}
	
	// now send back our result object
	return $response;
}
	
	
// ***********************************************************************
// LOAD some plugin data to the table in the WP database
// ***********************************************************************
function wxy_searchmark_load( $vars )
{
	global $wpdb;
	
	$user = $vars[ "wxy-searchmark-user" ];
	
	// --------------------------------------------------------------------
	// get our user's id number (if this is multisite then get it from the root users table)
	// --------------------------------------------------------------------
	$alt_db_name = $wpdb->base_prefix . "users";	
	$query = "SELECT id FROM `". $alt_db_name . "` WHERE `user_login`='" . $user . "';";
	
	// now get our data to see what the user's id number is...
	$record = $wpdb->get_results( $query );
	$result = wxy_searchmark_object_to_array( $record );
	
	if( count( $result ) > 0 )
	{
		$id = $result[0]["id"];
	} else {
		$id = NULL;
	}
	
	// get our table name and database name
	$table_name = $wpdb->prefix . 'wxy_searchmark_data';

	// see if this is a super admin... if so, only save their items to the MAIN database!
	$super_admin = is_super_admin( $id );
	
	if( $super_admin == 1 )
	{
		// point our table back at the MAIN table instead of an individual multisite site
		$table_name = $wpdb->base_prefix . 'wxy_searchmark_data';
	}

	$db_name = $wpdb->dbname;
	$charset_collate = $wpdb->get_charset_collate();
	
	
	// our LOAD query
	$query = "SELECT * FROM `" . $db_name . "`.`" . $table_name ."` WHERE `user`='". $user . "' LIMIT 1;";
	
	// now get all columns to use client-side...
	$result = $wpdb->get_results( $query, OBJECT );
	
	// if no result, then create a blank result and create a new entry in the database
	$response[ "status" ] = "fail";
	$response[ "message" ] = "There was a problem.";
	$response[ "result" ] = array();
	
	// be sure to pass our VARS!
	$response["vars"] = $vars;

	// now wrap it all up...
	if( !$result )
	{
		// error! - NOTHING CAME BACK FROM THE DATABASE
		$response["message"] = "No bookmarks loaded for that user... " . $vars["wxy-searchmark-user"];
	
	} else {	
		// SUCCESS
		$response["result"] = wxy_searchmark_object_to_array( $result[0] );
		
		// now get our data property and unencode it
		$raw_data = $response["result"][ "data" ];
		$data = base64_decode( $raw_data );
		$response["result"][ "data" ] = $data;
		$response["result"][ "data" ] = stripslashes( $response["result"][ "data" ] );

		// add some messaging
		$response["status"] = "success";
		$response["message"] = "Bookmarks LOADED from server.";

	}
	
	return $response;
}

// ***********************************************************************
// CONVERT: stdClass object to array
// ***********************************************************************
function wxy_searchmark_object_to_array( $data )
{
    if( is_object( $data ) )
	{
        $data = get_object_vars( $data );
    }

	if( is_array( $data ) )
	{
		return array_map(__FUNCTION__, $data);
    }
    else {
        return $data;
    }
}

// ***********************************************************************
// DOWNLOAD: collect our searchmark data and downbload it!
// ***********************************************************************
function wxy_searchmark_download( $result )
{
	// create a response object
	$result["status"] = "fail";
	$result["message"] = "Unable to download bookmarks from server.";

	// ---------------------------------------------------------------------
	// this should be our original vars
	// ---------------------------------------------------------------------
	$vars = $result[ "data" ][ "vars" ];
	
	// ---------------------------------------------------------------------
	// username to donwload for
	// ---------------------------------------------------------------------
	$user = isset( $vars[ "wxy-searchmark-user" ] ) ? $vars[ "wxy-searchmark-user" ] : false;
	
	// ---------------------------------------------------------------------
	// get the data to save
	// ---------------------------------------------------------------------
	$data = isset( $vars[ "wxy-searchmark-data" ] ) ? $vars[ "wxy-searchmark-data" ] : false;
	
	// clear our result object's data property - there is no need to send the searchmark back with the result
	$result[ "data" ][ "vars" ][ "wxy-searchmark-data" ] = "";

	// ---------------------------------------------------------------------
	// assign the proper downloded file prefix
	// ---------------------------------------------------------------------
	$file_prefix = 'wxy_searchmark_groups-' . $user;
	
	// --------------------------------------------------------------------
	// create the zip file and download it
	// --------------------------------------------------------------------
	$uploads_dir = wp_upload_dir();
	
	$download_path = $uploads_dir[ "basedir" ] . '/';
	$download_url = $uploads_dir[ "baseurl" ] . '/';

	// --------------------------------------------------------------------
	// see if this a secure session and change the URL
	// --------------------------------------------------------------------
	if( isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == "on") {
		$download_url = preg_replace( "/http[s]:/", "https:", $download_url );
	}

	// --------------------------------------------------------------------
	// create a directory just for our downloads!
	// --------------------------------------------------------------------
	$dir = $download_path . 'wxy-searchmark-data';//$download_path . 'wxy-searchmark-data';
	
	$permissions = 0777;
	$oldmask = umask(0);

	// check to see if the directory already exists... create it if it does not
	if( file_exists( $dir ) === false )
	{		
		if( wp_mkdir_p( $dir ) )
		{
			// must be 0777 so we can upload to it later!
			$success = true;
			$umask = umask( $oldmask );
			$chmod = chmod( $dir, $permissions );
		
		} else {

			// could not make a folder
			$result["status"] = "fail";
			$result["message"] = "WXY Searchmark was unable to create a downloads folder. Please check your 'uploads' folder premissions on the ftp server.";
		
			return $result;
		}
	}

	// create a new zip archive object
	$zip = new ZipArchive();
	
	// when unzipped, this will become the filename of the folder
	$filename = $file_prefix . ".txt";
	
	// this will be the name of the file on the server, waiting to be downloaded
	$zip_file = $dir . '/' . $file_prefix . ".zip";
	
	// this is the name of the file that we want to redirect to using the location header
	$download_file = $download_url . "wxy-searchmark-data/" . $file_prefix . ".zip";
	
	try {
		
		if( $zip->open( $zip_file, ZIPARCHIVE::CREATE ) == true)
		{
			// success!
			try {
				
				$zip->addFromString( $filename, $data );
						
			} catch (Exception $e) {
				
				$result["status"] = "fail";
				$result["message"] = "Zip file could not be created on the server. Error: " . $e;

				return $result;
			}
		
			// now close the archive
			$zip->close();
		} else {
			
			// creation of zip file failed
			$result["status"] = "fail";
			$result["message"] = "Zip file created in temporary folder...";
			
			return $result;
		}

		// be sure to set its permissions!
		chmod( $zip_file, 0777);// octal; correct value of mode (was 0755 )
	
		// for now, let's just return a success or faiul result along with the URl to link to....
		$result[ "status" ] = "success";
		
		// send back the file to link to what we want to download...
		$result[ "result" ] = $download_file;
		$result[ "message" ] = "A zip file was created on the server.";

		return $result;
	
	
	} catch (Exception $e) {
		// failed!
		
		$result[ "status" ] = "fail";
		$result[ "message" ] = "Creating a ZIP file of your bookmarks failed.";
		
		return $result;
		
		// be sure to unlink the file, just in case!
		unlink( $zip_file );
	}

	return $result;

}

?>