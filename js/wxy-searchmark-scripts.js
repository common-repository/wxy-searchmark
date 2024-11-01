/*
	Copyright (c) 2018-Present, Clarence "exoboy" Bowman and Bowman Design Works.
	WXY Searchmark Plugin – WXY Tools, hardcore tools for WordPress, brings you a plugin to quickly find page, post and custom content, save custom searches, as well as create and organize bookmarked locations and content.
	WXY Searchmark Plugin is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 2 of the License or (at your option) any later version.
	This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
	You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>
	You can contact us at info@wxytools.com
*/

// create a global flag...
var wxy_searchmark_inited = false;

// begin encapsulation
(function($){

	// ********************************************************************
	// because we are altering the DOM, it will fire multiple times!
	// be sure to refer to jQuery as jQuery instead of $ ?
	// ********************************************************************
	jQuery( document ).on("DOMContentLoaded", function()
	{
		if( wxy_searchmark_inited )
		{
			return;
			
		} else {
			
			wxy_searchmark_inited = true;
			
			wxy_searchmark_startup();
		}
	});
	
	// ********************************************************************
	// ADDED VARS
	// ********************************************************************
	var WXY_BOOKMARKS_WIDGET = ".wxy-searchmark-widget";
	var WXY_PANEL_ANIMATION_SPEED = 150;
	var WXY_HISTORY_MAX = 500;
	var SESSION_DATA = {};
	var _USERS = {};
	var _AUTOSAVE = {};
	var _AUTOSAVE_MAX_ATTEMPTS = 120;
	var _SEARCHBAR_TIMER;
	
	var _MINIMUM_JQUERY_REQUIRED = [ 1, 9, 0 ];
	var _MINIMUM_PHP_REQUIRED = "5.0";
	
	var TIMEOUT, WXY_HISTORY_COOKIE, WXY_WINDOWS_COOKIE, WXY_SEARCH_COOKIE, WXY_SETTINGS_COOKIE, WXY_TAB_SETTINGS_COOKIE, WXY_BOOKMARKS_FORM_PATH, WP_SITE_URL, WXY_ACTIVE_USER_COOKIE, WXY_SHOW_BOOKMARKS_SHORTCUT, WXY_BOOKMARKS_INSTANCE_ID, HOVER_TIMEOUT, WXY_BOOKMARKS_WIDGET_Z, INFINITE_SCROLL_TIMEOUT, SCROLL_TIMEOUT;
	
	// the time it takes a folder to open when dragging bookmarks over it
	var HOVER_TIMEOUT_INTERVAL = 400;
	
	// this is the minimum number of items per page for search results.
	var WXY_BOOKMARKS_LIMIT_MINIMUM = 50;

	// ********************************************************************
	// FUNCTION GLOBALS
	// ********************************************************************
	var _VERSION = {};
	
	var ADMIN_PANEL_INFO, POST_ACTIONS_FORM_PATH, WP_PLUGINS_PATH, WP_HOME_PATH;
	var BLANK_SELECT_MENU_OPTION = "<option id='' value=''></option>";
	var DEFAULT_GROUPS_SELECT_OPTION = "#wxy-tools-wp-searchmark-default-select-option";
	
	// ********************************************************************
	// KEYBOARD SHORTCUT GLOBALS: so we can switch for PC! Blech!
	// ********************************************************************
	var WXY_META_KEY, WXY_CTRL_KEY, WXY_ALT_KEY, WXY_SHIFT_KEY;
	
	// ********************************************************************
	// PAGE ONREADY (STARTUP)
	// ********************************************************************
	function wxy_searchmark_startup()
	{
		// ********************************************************************
		// INSTANCE ID: give this instance a unique ID for us in postMessages
		// ********************************************************************
		WXY_BOOKMARKS_INSTANCE_ID = "wxy-searchmark-instance-" + Date.now() + "-" + Math.floor(Math.random() * 32767);
		$( window ).data({ "wxy-searchmark-instance-id":WXY_BOOKMARKS_INSTANCE_ID });

		// ********************************************************************
		// capture our vars from wordpress
		// ********************************************************************
		var wp_admin_vars = wxy_searchmark_admin_vars;

		try {
			// LATEST: VARS....
			ADMIN_PANEL_INFO = JSON.parse( wp_admin_vars["admin_panel_info"] );
			WXY_BOOKMARKS_FORM_PATH = String( wp_admin_vars["form_submission_path"] );
			WXY_BOOKMARKS_PLUGIN_PATH = String( wp_admin_vars["plugin_path"] );

			// use this to jump to other posts and edit
			WP_SITE_URL =  String( wp_admin_vars[ "wp_site_url" ] );
		
			// session info
			SESSION_DATA[ "session_id" ] = wp_admin_vars[ "session_id" ] || "";
			SESSION_DATA[ "form_nonce" ] = wp_admin_vars[ "form_nonce" ] || "";
			SESSION_DATA[ "wp_nonce" ] = wp_admin_vars[ "wp_nonce" ] || {};
			SESSION_DATA[ "post_id" ] = wp_admin_vars[ "post_id" ] || false;
			SESSION_DATA[ "post_title" ] = wp_admin_vars[ "post_title" ] || false;
			SESSION_DATA[ "alert_triggered" ] = false;
			
			// keep track of when they switch from http to https sessions!
			SESSION_DATA[ "session_type_this" ] = wp_admin_vars[ "session_type_this" ];
			SESSION_DATA[ "session_type_last" ] = wp_admin_vars[ "session_type_last" ];
			
			// get the permalink for the current page...
			SESSION_DATA[ "permalink" ] = wp_admin_vars[ "permalink" ] || false;
			
			SESSION_DATA[ "admin_panel_info" ] = JSON.parse( wp_admin_vars[ "admin_panel_info" ] ) || {};

			// get our sitesearch (if any)
			SESSION_DATA[ "wp_sitesearch_data" ] = wp_admin_vars[ "wp_sitesearch_data" ] || {};		
			
			// is there an admin bar?
			SESSION_DATA["admin_bar_visible"] = wp_admin_vars["admin_bar_visible"] || false;
	
			// attach our session id to our cookie prefix, so we always have a unique cookie for each session
			// this way, they can have multiple sites open using the same bookmark widget and they should not collide
			WXY_HISTORY_COOKIE = "wxy_searchmark_history_" + String( SESSION_DATA[ "session_id" ] );
			WXY_WINDOWS_COOKIE = "wxy_searchmark_windows_" + String( SESSION_DATA[ "session_id" ] );
			WXY_SEARCH_COOKIE = "wxy_searchmark_search_" + String( SESSION_DATA[ "session_id" ] );
			WXY_TAB_SETTINGS_COOKIE = "wxy_searchmark_tabs_" + String( SESSION_DATA[ "session_id" ] );			
			
			// use this to track which user's searchmark we are really looking at!
			WXY_ACTIVE_USER_COOKIE = "wxy_searchmark_active_user_" + String( SESSION_DATA[ "session_id" ] );
		
			// get our current user and a list of all other users...
			_USERS[ "active_user" ] = wp_admin_vars[ "active_user_login" ] || "site-wide-searchmark";
			_USERS[ "all_user_logins" ] = wp_admin_vars[ "all_user_logins" ] || [];
			_USERS[ "signed_in_user" ] = _USERS[ "active_user" ];
			_USERS[ "logged_in" ] = wp_admin_vars[ "logged_in" ] || 0;
			
			// KEYBOARD SHORTCUT keys to use (we need to change between mac and pc!) - default to mac
			WXY_META_KEY = wp_admin_vars[ "meta_key" ] || "metaKey";
			WXY_CTRL_KEY = wp_admin_vars[ "ctrl_key" ] || "ctrlKey";
			WXY_ALT_KEY = wp_admin_vars[ "alt_key" ] || "altKey";
			WXY_SHIFT_KEY = wp_admin_vars[ "shift_key" ] || "shiftKey";

			// set the current owner as the currently logged in owner by default, lower down, we check the options cookie to see who is really being viewed		
			_USERS[ "initial_login" ] = wp_admin_vars[ "initial_login" ] || 0;

			// set it to the active user for now
			_USERS[ "searchmark_owner" ] = _USERS[ "active_user" ];

			// autosave vars
			_AUTOSAVE["on"] = wp_admin_vars["autosave"] || 0;
			_AUTOSAVE[ "unsaved_changes" ] = false;
			
			// convert our interval to milliseconds
			_AUTOSAVE[ "interval" ] = wp_admin_vars[ "interval" ] || 0;

			// SET AUTOSAVE TO 1 SECOND
			_AUTOSAVE[ "interval" ] = 1000;

			// store the timer object here, to avoid garbage collection
			_AUTOSAVE[ "timer" ] = {};
			
			// this is the number of times the widget has tried to auto save but could not...
			_AUTOSAVE[ "save_attempts" ] = 0;
			
			// set up our version number..
			_VERSION[ "version" ] = wp_admin_vars[ "version_number" ];
			_VERSION[ "compatibility_url" ] = "http://www.WXYtools.com/compatibilty";
			
			// keyboard shortcut to show/hide searchmark
			WXY_SHOW_BOOKMARKS_SHORTCUT = wp_admin_vars[ "keyboard_shortcut_show_hide" ] || 12;
			
		} catch(e){
			
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			alert( "ERROR: " + e + " --- please check your internet connection and reload the page." );
			
			// now stop the autosave function (if it is on);
			if( _AUTOSAVE[ "on" ] == 1 )
			{
				changes_tracker( "force-autosave-off" );
			}
			
		}
	
		// --------------------------------------------------------------------------
		// setup page elements
		// --------------------------------------------------------------------------
		setup_page_elements();
	};

	// ********************************************************************
	// POST HTML CONTENT LOADED
	// ********************************************************************
	function wxy_searchmark_loaded()
	{
		// ------------------------------------------------------------------------------------------------
		// REMOVE our initial load wrapper!
		// ------------------------------------------------------------------------------------------------
		$( ".wxy-searchmark-load-wrapper" ).remove();
				
		// move our mobile button to the mobile menu
		$( ".wxy-searchmark-mobile-menu-btn" ).appendTo( $( "#wp-toolbar" ) );
		
		
		// append our wp nonce element to our form
		$( SESSION_DATA["wp_nonce"] ).appendTo( $( ".wxy-searchmark-data-form" ) );

		// -------------------------------------------------------------------------- 
		// USER SELECT MENU: set up our list of avialble users...
		// -------------------------------------------------------------------------- 
		username_select_menu( "initialize" );
		
		// ------------------------------------------------------------------------------------------------
		// GET OUR CURRENT USER (if any)
		// ------------------------------------------------------------------------------------------------
		var data = active_user( "load" );

		// ------------------------------------------------------------------------------------------------
		// GET GROUPS/BOOKMARKS ON STARTUP from the database
		
		// NEXT: be sure that they cannot cross sessions???
		// ------------------------------------------------------------------------------------------------
		initialize_groups();
		
		// --------------------------------------------------------------------------
		// INITIAL HISTORY/SITESEARCH (search) LOADING - must do these first, so the event listeners get added properly!
		// --------------------------------------------------------------------------
		initialize_history();
		initialize_sitesearch();
		
		initialize_tabview();

		// get our dialogue location settings
		groups_entry( "load-cookie" );
		
		// --------------------------------------------------------------------------
		// WIDGET WRAPPER HOIST TO TOP OF Z INDEX ON PAGE LOAD
		// --------------------------------------------------------------------------
		$( WXY_BOOKMARKS_WIDGET ).topZindex();
		
		// use this as the base for all other z-indexes!
		WXY_BOOKMARKS_WIDGET_Z = $( WXY_BOOKMARKS_WIDGET ).css( "z-index" );

		// --------------------------------------------------------------------------
		// MAIN MENU: show/hide menu via the close bar button
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-close-bar, .wxy-searchmark-close-handle-btn" ).on( "click", function()
		{
			open_close_widget();
			
		});
		
		// --------------------------------------------------------------------------
		// CONTEXT MEMU: prevent dragging if viewing the context menu
		// --------------------------------------------------------------------------
		$( window ).on("contextmenu", function(){
			
			$( ".wxy-searchmark-is-being-moved" ).removeClass( "wxy-searchmark-is-being-moved" );
			
			$( window ).trigger("mouseup");
			
		});


		// --------------------------------------------------------------------------
		// KEYBOARD SHORTCUT: COPY-PASTE listen for control and option keys to add URL's... manually add links
		// --------------------------------------------------------------------------
		$( window ).on( "keydown", function( evt )
		{
			var pastebox, selected, clone, destination, folder;
			
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			
			// be sure to subtract our search results from the count of open dialogues
			if( $( ".wxy-searchmark-search-results-dialogue" ).is(":visible" ) )
			{
				open_dialogues -= 1;
			}
			
			open_dialogues < 0 ? open_dialogues = 0 : open_dialogues;
			
			if( open_dialogues == 0 && evt[ WXY_META_KEY ] == true && ( evt[ "keyCode" ] == 67 || evt[ "keyCode" ] == 86 ) )
			{	
				switch (true)
				{
					
					case evt[ "keyCode" ] == 67:
					
						// CMD+C = see if they want to COPY whatever is selected
						pastebox = $( "#wxy-searchmark-pastebox" );
						selected = $( ".wxy-searchmark-item-selected" );
						
						if( $( selected ).length > 0 )
						{
							// don't forget that groups use the button for the higlight and selection classes!
							clone = $( selected ).clone( true,true);
				
							// make a copy of any selected items!
							$( pastebox ).empty();
							$( clone ).appendTo( $( pastebox ) );
							
							// be sure to remove the selected class!
							$( pastebox ).find( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
							
							// just in case, our copied data might have some search function data, scrub it!
							bookmarks_searchbar( "clear-result-settings", clone );
							
							// flash the selected items to let the user know they were copied to the plugin paste-board
							flash_element( selected, 1, 300 );

						} else {
							
							// no items are selected, just clear the pastebox?
							$( pastebox ).empty();
						}
						
						break;
			
					case evt[ "keyCode" ] == 86:
				
						// CMD+V = Paste!	
						pastebox = $( "#wxy-searchmark-pastebox" );
						selected = $( pastebox ).children();
				
						if( $( selected ).length > 0 )
						{
							// don't forget that groups use the button for the higlight and selection classes!
							clone = $( selected ).clone( true,true);
				
							// make a copy of any selected items!
						
							// see if we have another active container and paste the there
							destination = $( ".wxy-searchmark-entry-group-container:first" );
						
							if( $( ".wxy-searchmark-group-is-active" ).length > 0 )
							{
								folder = $( ".wxy-searchmark-group-is-active" ).closest( ".wxy-searchmark-group-wrapper");
								destination = $( folder ).find( ".wxy-searchmark-entry-group-container:first" );
							}
							$( clone ).prependTo( $( destination ) );
						
							// now flash our clone....
							$( clone ).each( function()
							{
								var self = this;
								flash_element( self, 3, 300, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); } );
							});
						
							// clear out our copied items?
							//$( pastebox ).empty();
						
							// unselect everything selected
							$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
							$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
						
						break;

					}
				}
			
				// don't stop bubbling! these are the same shortcut keys as copy-paste
			}

		});
		
			
		// --------------------------------------------------------------------------
		// KEYBOARD: listener for control and option keys to add URL's... manually add links
		// --------------------------------------------------------------------------
		$( window ).on( "click", function( evt )
		{
			// only check for a url if the modifier keys are being held down (alt+cmd)
			if( evt[ WXY_META_KEY ] == true && evt[ WXY_ALT_KEY ] == true )
			{
				// listen for a return in the post id input in the admin menu bar... then jump to the page and edit it!
				var key_code = evt[ "keyCode" ];
				var target = evt[ "target" ];
				var self = $( target );
			
				// is this a link? Does it have a href?
				var href = $( self ).attr( "href" ) || false;
				
				if( !href )
				{
					href = $( self ).closest( "a" ).attr( "href" ) || false;
				}
				
				// now assign this new bookmark a defaut lable value
				var label = $( self ).text() || "untitled bookmark";
				
				// finally, only create a new bookmark if an href was found
				if( href )
				{
					// ADD some special class handlers that gets the label from different places, depending on where the url is taken from
					if( $( self ).hasClass( "wxy-searchmark-sitesearch-view-link" ) )
					{
						var parent = $( self ).closest( ".wxy-searchmark-sitesearch-entry" );
				 
						if( $( parent ).length > 0 )
						{
							label = $( parent ).find( ".wxy-searchmark-sitesearch-edit-link" ).text();
						
							label = label + " &mdash; [VIEW]";
						}
					}
				
					// create a cloned object to pass, in case we want to manipulate it
					var new_self = $( self ).clone( true, true );
					$( new_self ).appendTo( $( "body" ) );
					
					// be sure to assign an href attr self object!
					$( new_self ).attr({ "href":href });
					
					// see if this is an editable post id
					var post_id = "";
					
					switch (true)
					{
						case $( new_self ).attr("id") == "editable-post-name":
							$( new_self ).text( href );
							 post_id = SESSION_DATA[ "post_id" ];
							
							break;
							
						case String( href ).indexOf( "post=" ) > -1:
						
							// we have a post id in our url!
							var matches = String( href ).match( /post=([0-9]*)/i );
							
							try {
								post_id = matches[ 1 ];
							} catch (e) {
								post_id = "";
							}

							break;	

					}
					
					// passing our post id to the new entry
					$( new_self ).attr({ "post-id": post_id });
					
					// we have a link!  save it as a bookmark!
					groups_entry( "add-link-bookmark", new_self );
			
				}
			
				// prevent going to that link!
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				return false;
			}
			
		});
		
		$( window ).on( "keyup", function( evt )
		{
			// make sure to revert back to a default cursor		
			$( "body" ).css({ "cursor":"auto" });

		});	


		// --------------------------------------------------------------------------
		//  MOVING: Enabled - drag an item around the screen with no cloning: was body
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-widget-inner-wrapper, body" ).on( "mousedown", ".wxy-searchmark-is-moveable", function( evt )
		{
			// prevent using native browser dragging
			prevent_dragging( this );
		
			// wait a short delay before enabling the move!
			clearTimeout( TIMEOUT );
			
			// find the target parent content container from our event
			var self = evt[ "target" ];
			self = $( self ).closest( ".wxy-searchmark-content-item" );//wxy-searchmark-entry" );
			
			TIMEOUT = setTimeout( function()
				{
					// look for a reference to an item to move (in the data) or use the self object itself as the move item
					var move_item = self;
				
					// see if we want to move the parent of the drag button
					if( move_item == "parent" )
					{
				//		move_item = $( self ).parent();
					}

					// if this is NOT a dialogue window, then try to add any other selected items
					if( !$( move_item ).hasClass( "wxy-searchmark-settings-dialogue" ) )
					{
						// add highlighted items
						move_item = $( move_item ).add( ".wxy-searchmark-item-selected" );
					}
		
					// save our index's for later
					$( move_item ).each( function() {
						var me = this;
						
						$( me ).data({ "wxy-searchmark-old-index-pos": $( me ).index() });
						
						// set its width for the move
						$( me ).width( $( me ).width() );
					});

					// now calculate some offsets!
					var page_x = evt["pageX"];
					var page_y = evt["pageY"] + $( window ).scrollTop();
					
					
					// if this IS a dialogue window, use an alternate offset value
					var offset = $( move_item ).offset();
					
					var item_x = offset[ "left" ];
					var item_y = offset[ "top" ] + $( window ).scrollTop();
					
					var offset_x = page_x - item_x;
					var offset_y = page_y - item_y;
					
					// now save it in the item being moved!
					var data = {};
					data[ "wxy-searchmark-move-offset-x" ] = offset_x;
					data[ "wxy-searchmark-move-offset-y" ] = offset_y;
					
					// also save it original position value
					data[ "wxy-searchmark-move-position" ] = $( move_item ).css("position");
					
					// our originol left, right values as well as this item's parent
					data[ "wxy-searchmark-move-left" ] = $( move_item ).css("left");
					data[ "wxy-searchmark-move-top" ] = $( move_item ).css("top");
					
					data[ "wxy-searchmark-move-left-start" ] = $( move_item ).offset().left;
					data[ "wxy-searchmark-move-top-start" ] = $( move_item ).offset().top;
					
					data[ "wxy-searchmark-move-parent" ] = $( move_item ).parent();
					data[ "wxy-searchmark-move-index" ] = $( move_item ).index();
					
					data[ "wxy-searchmark-move-item" ] = $( move_item );

					
					// this flag will tell our move function if this item is just starting to move or is already moving!
					data[ "wxy-searchmark-move-started" ] = false;
					
					// now save the object to our element's data
					$( move_item ).data({ "wxy-searchmark-move-settings":data });

					// add our class to make it move!
					if( !$( move_item ).hasClass( "wxy-searchmark-is-being-moved" ) )
					{
						$( move_item ).addClass( "wxy-searchmark-is-being-moved" );
					}
					
					// clear any accidentally selected content
					clear_selections();
						
				}, 500 );// 250
			
		});
		
		// --------------------------------------------------------------------------
		// FOLDERS: auto open groups when dragging items over closed folders (groups)
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-groups-inner-holder" ).on( "mouseenter", ".wxy-searchmark-group-button", function()
		{
			var button = this;//$( this ).find( ".wxy-searchmark-group-button:first" );
			var move_items = $( ".wxy-searchmark-is-being-moved" );	
			var is_open = $( button ).hasClass( "wxy-searchmark-group-content-button-open" );

			clearTimeout( HOVER_TIMEOUT );

			// only open closed groups if we are dragging something that triggers drop targets
			if( $( move_items ).length > 0 && ( $( move_items ).hasClass( "wxy-searchmark-entry" ) || $( move_items ).hasClass( "wxy-searchmark-group-wrapper" ) || $( move_items ).hasClass( "wxy-searchmark-search" ) ) && !is_open )
			{		
				HOVER_TIMEOUT = setTimeout( function() {
					clearTimeout( HOVER_TIMEOUT );
					groups_entry( "open-close-groups", button );

				}, HOVER_TIMEOUT_INTERVAL );
			}
							
			
		});
		

		$( ".wxy-searchmark-groups-inner-holder" ).on( "mouseleave", ".wxy-searchmark-group-button", function()
		{
			clearTimeout( HOVER_TIMEOUT );
		});
		

		// --------------------------------------------------------------------------
		// BOOKMARKS ENTRY: select/deselect by cmd+clicking
		// --------------------------------------------------------------------------
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry, .wxy-searchmark-search", function( evt )
		{
			var self = this;
			var parents, target;
			
			// this uses command + click!
			var meta_key = evt[ WXY_META_KEY ];
			var alt_key = evt[ WXY_ALT_KEY ];
			
			// be sure to close any open dialogues (but NOT if it is the search results window)!
			var target = evt[ "delegateTarget" ];
		
			if( $( target ).attr( "id" ) != "wxy-bookmarks-search-results-wrapper" )
			{
				close_all_dialogues();
			}
			
			if( meta_key )
			{
				if( !alt_key )
				{
					// when selecting multiple searchmark, be sure to NOT select their parent folders... causes issues when re-establishing their position in the searchmark tab!
					parents = $( self ).parents( ".wxy-searchmark-group-wrapper" );

					$( parents ).each( function()
					{
						var groups = $( this ).find( ".wxy-searchmark-group-inner-wrapper" );
						var buttons = $( this ).find( ".wxy-searchmark-group-button" );
						var kids = $( this ).not( ".wxy-searchmark-entry" );

						$( groups ).filter( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
						$( groups ).filter( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
								
						$( buttons ).filter( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
						$( buttons ).filter( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
				
						$( kids ).filter( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
						$( kids ).filter( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							
					});
			
					switch (true)
					{
						case $( self ).hasClass( "wxy-searchmark-item-selected" ):
						
							// un select a bookmark
							$( self ).removeClass( "wxy-searchmark-item-selected" );
							$( self ).removeClass( "wxy-searchmark-selection-color" );
							
							break;
					
						case !$( self ).hasClass( "wxy-searchmark-item-selected" ):
						
							// select a bookmark
							$( self ).addClass( "wxy-searchmark-item-selected" );
							$( self ).addClass( "wxy-searchmark-selection-color" );
							
							break;
					}
					
				} else if ( alt_key )
				{
					// close all dialogues and unselect all selected elements
					close_all_dialogues( "unselect-all-selected-items" );
				}
			
				// stop our event from bubbling!
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				return false;
			}
		});
		
		// --------------------------------------------------------------------------
		// BOOKMARK ENTRY CONTROLS: EDIT this bookmark(s)
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry-link", function( evt )
		{	
			// close ALL settings dialogues!
			close_all_dialogues();
		
			// these are the currently selected searchmark (there may be one ore none)
			var selected = $( ".wxy-searchmark-item-selected" );

			// if there is only one let it go, otherwise, we need to create new windows and open them all at once
			if( $( selected ).length > 1 && ( evt[ WXY_META_KEY ] == false && evt[ WXY_ALT_KEY ] == false ) )
			{
				// stop our event from bubbling
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();

				// open a new window for each item selected
				var title = 0;
				
				$( selected ).each( function()
				{
					var href = $( this ).find( ".wxy-searchmark-entry-link" ).attr( "href" );
					
					title += 1;
					
					// create a new window! window.open(URL, name, specs, replace)
					window.open( href, "new-window-" + title, "", false );
				});

				// unselect our items...
				$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
				$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
				
				return false;
			} else {
				
				// just let it go, man!
			}
		});

					
		// --------------------------------------------------------------------------
		//  MOVING: Update - drag an item around the screen with no cloning
		// --------------------------------------------------------------------------
		$( "body" ).on( "mousemove", function(evt)
		{
			// see if there are any move items!
			var move_items = $( ".wxy-searchmark-is-being-moved" );
			var hover_target = evt[ "target" ];
			var targets;
			
			if( $( move_items ).length > 0 )
			{
				// clear any HTML items that are trying to be selected
				clear_selections();
				
				// deselect any selected groups (set to active, not manually selected - highligihted)
				// they clicked the flag of an active group... turn off ALL indicators
				$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
				$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );

				$( move_items ).each( function()
				{
					var self = this;
					var targets = [];
					var page_x, page_y, offset_x, offset_y, button, element, content, data, scroll_top, holder, offset, holder_x, holder_y, holder_width, holder_height, win_x, win_y, new_scrolltop, self_height;
					var trigger_targets = true;
					
					// see if there is a mouse offset for its position
					data = $( self ).data( "wxy-searchmark-move-settings" ) || {};

					// see if our dragging item should trigger actions. like opening folders and activating targets
					if( !$( self ).hasClass( "wxy-searchmark-group-wrapper" ) && !$( self ).hasClass( "wxy-searchmark-entry" ) )
					{
						trigger_targets = false;
										
						// calculate the mouse offset relative to the object being moved
						offset_x = data[ "wxy-searchmark-move-offset-x" ] || 0;
						offset_y = data[ "wxy-searchmark-move-offset-y" ] || 0;		
					} else {
						offset_x = 0;
						offset_y = 0;
					}

					// append our item to the body, but only at the start of the move
					if( data[ "wxy-searchmark-move-started" ] === false )
					{
						// append it to the widget wrapper
						$( self ).appendTo( $( WXY_BOOKMARKS_WIDGET ) );
						
						// change its z-index
						$( self ).data({ "wxy-original-z-index": $( self ).css( "z-index" ) });
						$( self ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 32767 });

						data[ "wxy-searchmark-move-started" ] = true;
					}

					// update their postion, relative to the mouse
					scroll_top = $( window ).scrollTop();
					page_x = evt["pageX"] - offset_x;
					page_y = Math.abs( evt["pageY"] - offset_y ) - scroll_top;
			
					// assign our new values
					$( self ).css({ "left":page_x, "top":page_y, "position":"fixed" });
					
					// see if we are dragging out of range of the list and scroll if needed....
					if( trigger_targets )
					{
						holder = $( WXY_BOOKMARKS_WIDGET ).find( ".wxy-searchmark-groups-tab-entries" );
						offset = $( holder ).offset();
						holder_x = offset.left;
						holder_y = offset.top;
						holder_width = $( holder ).width();
						holder_height = $( holder ).height();
					
						win_x = evt["pageX"];
						win_y = evt["pageY"];
					
						self_height = $( self ).height();
					
						// see if we are within the right and left boundaries of our searchmark list, in case we need to scroll up or down
						if( win_x > holder_x && win_x < holder_x + holder_width )
						{
							// see if we are at the top...
							switch (true)
							{
							 	case win_y < holder_y + 40 && !$( holder ).is(":animated"):	
									// animate scrolling up a bit!
									new_scrolltop = $( holder ).scrollTop() - 200;
							
									new_scrolltop < 0 ? new_scrolltop = 0 : new_scrolltop;
									$( holder ).stop( true,true ).animate({ "scrollTop": new_scrolltop },300);
									break;
									
								
								case ( win_y > holder_y + holder_height - 40 || win_y > ( holder_y + holder_height - self_height ) ) && !$( holder ).is(":animated"):
									// animate scrolling down a bit!
									new_scrolltop = $( holder ).scrollTop() + 200;
							
									//new_scrolltop > 0 ? new_scrolltop = 0 : new_scrolltop;
									$( holder ).stop( true,true ).animate({ "scrollTop": new_scrolltop },300);
							
									break;
								
								default:
									// do nothing by default for now
							}
						
						}
					}

				});
			}

		});	
			
		// --------------------------------------------------------------------------
		// MOVING: handle turning valid drop targets on or off...
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-widget-inner-wrapper" ).on( "mouseover", ".wxy-searchmark-drop-target", function( evt )
		{
			// see if there are any move items!
			var move_items = $( ".wxy-searchmark-is-being-moved" );
			var self = this;
			var halo_target, drop_target;
			var data = $( self ).data( "wxy-searchmark-move-settings" ) || {};
			var target_array = [];
			var content = $( self ).find( ".wxy-searchmark-group-content" );
			
			// drop target selection special cases
			switch (true) 
			{
				case $( self ).hasClass( "wxy-searchmark-group-wrapper" ) && $( content ).is( ":visible" ):
					halo_target = $( self ).find( ".wxy-searchmark-drop-target" );
					drop_target = $( content ).find( ".wxy-searchmark-drop-target" );
					break;

				default:
					halo_target = self;
					drop_target = self;
			}

			// remove our classes from ALL elements
			$( ".wxy-searchmark-target-halo-active" ).removeClass( "wxy-searchmark-target-halo-active" );
			$( ".wxy-searchmark-target-active" ).removeClass( "wxy-searchmark-target-active" );
			$( ".wxy-searchmark-padding-top" ).removeClass( "wxy-searchmark-padding-top" );

			// hide any highlight objects
			$( ".wxy-searchmark-target-halo-highlight" ).hide();
			$( ".wxy-searchmark-target-halo-highlight-bottom" ).hide();
			
			// if we have move items	
			if( $( move_items ).length > 0 && !$( drop_target ).hasClass( "wxy-searchmark-item-selected" ) )
			{
				if( $( move_items ).filter(":first" ).hasClass( "wxy-searchmark-entry" ) || $( move_items ).filter(":first" ).hasClass( "wxy-searchmark-group-wrapper" ) || $( move_items ).filter(":first" ).hasClass( "wxy-searchmark-search" ))
				{
					// add our halo and active classes to our target and halo dom element (in case they are different)
					$( halo_target ).addClass( "wxy-searchmark-target-halo-active" );
					$( drop_target ).addClass( "wxy-searchmark-target-active" );
				
					// show our highlight object
					$( drop_target ).children( ".wxy-searchmark-target-halo-highlight" ).show();
					$( drop_target ).children( ".wxy-searchmark-target-halo-highlight-bottom" ).show();
				
					// save the current drop target
					data[ "wxy-searchmark-move-drop-targets-current" ] = drop_target;
				
					// if the drop target is a bottom drop target, add padding to the TOP of it...
					if( $( drop_target ).hasClass( "wxy-searchmark-bottom-drop-target" ) )
					{		
						$( drop_target ).addClass( "wxy-searchmark-padding-top" );
						$( drop_target ).css({ "margin-bottom":"0px" });
					}
				}
	
			}
			
			// save our current valid drop target as our LAST
			if( $( drop_target ).length > 0 )
			{
				data[ "wxy-searchmark-move-drop-targets-last" ] = drop_target;
			}

			// be sure to save our data back
			$( drop_target ).data({ "wxy-searchmark-move-settings":data });
			
		});

		// --------------------------------------------------------------------------
		//  MOVING: user triggered a mouseup event, but they are still dragging something
		// --------------------------------------------------------------------------
		$( window ).on( "click", function( evt )
		{
			// see if we are still dragging and trigger a mouseup event...
			var move_items = $( ".wxy-searchmark-is-being-moved" );
			
			if( $( move_items ).length > 0 )
			{
				$( window ).trigger( "mouseup" );
			}
			
		});
	
		// --------------------------------------------------------------------------
		//  MOVING: STOPPED - drag an item around the screen with no cloning
		// --------------------------------------------------------------------------
		$( window ).on( "mouseup", function( evt )
		{
			// wait a short delay before enabling the move!
			clearTimeout( TIMEOUT );
			
			// clear the timer that is waiting to open folders when hovered over
			clearTimeout( HOVER_TIMEOUT );

			// turn on our pointer-events mask
			pointer_events_mask( "off" );
						
			// if any elements are being moved, clear the class that enables current movement
			var move_items = $( ".wxy-searchmark-is-being-moved" );
			
			if( $( move_items ).length > 0 )
			{

				// first sort them by index?
				move_items.sort( function(a,b)
				{
					// they are the same (0) as default
					var flag = 0;
					var a_val = $( a ).data( "wxy-searchmark-old-index-pos" );
					var b_val = $( b ).data( "wxy-searchmark-old-index-pos" );
			
					if( a_val > b_val )
					{
						flag = -1;
					}
			
					if( a_val < b_val )
					{
						flag = 1;
					}
			
					return flag;
				});
				
				var page_x = evt["pageX"] || 0;
				var page_y = evt["pageY"] || 0;
			
				// now enumerate and put back
				$( move_items ).each( function()
				{	
					var self = this;
					
					var data = $( self ).data( "wxy-searchmark-move-settings" ) || {};
					
					// get its original position value and restore it
					var position = data[ "wxy-searchmark-move-position" ] || $( self ).css( "position" );
					var parent =  data[ "wxy-searchmark-move-parent" ] || $( "body" );
					var top = data[ "wxy-searchmark-move-top" ];
					var left = data[ "wxy-searchmark-move-left" ];
					var index = data[ "wxy-searchmark-move-index" ] || 0;
					var start_left = data[ "wxy-searchmark-move-left-start" ];
					var start_top = data[ "wxy-searchmark-move-top-start" ];
					var holder, offset, tab;
					var flash_okay = true;
					var width;
					
					// restore our original widths from the class' blank - these are set in the html blank for each, as data
					var group_width = $( ".wxy-searchmark-group-blank" ).data( "wxy-default-width" ) || "100%";
					var bookmark_width = $( ".wxy-searchmark-entry-blank" ).data( "wxy-default-width" ) || "98%";
				
					switch (true)
					{
						case $( self ).hasClass( "wxy-searchmark-group-wrapper" ):
							width = group_width;
							break;
							
						case $( self ).hasClass( "wxy-searchmark-entry" ):
							width = bookmark_width;
							break;
							
						case $( self ).hasClass( "wxy-searchmark-search" ):
							width = bookmark_width;
							break;
					}
					
					// make sure the item being dragged is not flagged as active
					$( self ).removeClass( "wxy-searchmark-group-is-active" );
					$( self ).find( ".wxy-searchmark-group-is-active" ).removeClass( "wxy-searchmark-group-is-active" );

					// now see if it is over a valid drop target!
					var drop_target = $(".wxy-searchmark-target-active");
					var last_target = data[ "wxy-searchmark-move-drop-targets-last" ] || false;
					
					// reset this move item's z-index
					var z = $( self ).data( "wxy-original-z-index" ) || 1;
					$( self ).css({ "z-index": z });

					// see if we are dropping a drag item, and see if we need to append this to its original location or a new one...
					switch (true)
					{
						case $( self ).hasClass( "wxy-searchmark-settings-dialogue" ):
							
							// -----------------------------------
							// drop a dialogue
							// -----------------------------------
							flash_okay = false;

							// make sure this menu stays in bounds...
							dialogue_snap( $( self ) );
							
							break;
							
						case $( self ).hasClass( "wxy-searchmark-entry" ) || $( self ).hasClass( "wxy-searchmark-search" ):

							// -----------------------------------
							// dropping a bookmark OR search entry!
							// -----------------------------------
							// they want to drop it at the TOP of the list!
							holder = $( drop_target ).parent().find( ".wxy-searchmark-entry-group-container:first" );
										
							switch (true)
							{
								case $( drop_target ).length > 0:

									switch (true)
									{
											
										case $( drop_target ).hasClass( "wxy-searchmark-group-outside-bottom-target" ):
											// add our entry to the bottom of the holder
											holder = $( drop_target ).parent();
											$( self ).insertAfter( $( holder ) );

											break;
											
										case $( drop_target ).hasClass( "wxy-searchmark-top-drop-target" ):
											// add our entry to the TOP of the holder
											$( self ).prependTo( $( holder ) );
											
											break;
											
										case $( drop_target ).hasClass( "wxy-searchmark-bottom-drop-target" ):
											// add our entry to the bottom of the holder
											$( self ).appendTo( $( holder ) );

											break;
											
										default:

											// insert it after the target
											$( self ).insertAfter( $( drop_target ) );
									}
									
									break;
									
								case $( drop_target ).length <= 0 && index == 0:

									// no drop target, append it back to its parent
									
									// place it at the top of the list!
									$( self ).prependTo( $( parent ) );
									
									break;

								default:

									// no drop target, so put it back where it came from...							
									offset = $( self ).offset();
									
									if( Math.abs( start_left - offset.left ) > 0 && Math.abs( start_top - offset.top ) > 0 )
									{
										// get the child just BEFORE where we want to drop this item!	
										$( parent ).children().eq( (index - 1 ) ).after( $( self ) );

									} else {
										// the group did not move, must have been a click...
									}
							}

							// only assign a width if needed
							if( width )
							{
								$( self ).css({ "position":position, "top":"auto", "left":"auto", "width":width });
							} else {
							
								$( self ).css({ "position":position, "top":"auto", "left":"auto" });
							}
							
							break;
							
						case $( self ).hasClass( "wxy-searchmark-group-wrapper" ):
							
							// --------------------------------------
							// dropping a group
							// --------------------------------------
							holder = $( drop_target ).parent().find( ".wxy-searchmark-entry-group-container:first" );
						
							switch (true)
							{
								case $( drop_target ).length > 0:
								
									switch (true)
									{	
										case $( drop_target ).hasClass( "wxy-searchmark-group-outside-bottom-target" ):

											holder = $( drop_target ).parent();
											$( self ).insertAfter( $( holder ) );
											
											break;
											
										case $( drop_target ).hasClass( "wxy-searchmark-top-drop-target" ):
											// add our entry to the TOP of the holder
											$( self ).prependTo( $( holder ) );
											
											break;
											
										case $( drop_target ).hasClass( "wxy-searchmark-bottom-drop-target" ):

											$( self ).appendTo( $( holder ) );
											break;
											
										default:
											// insert it after the target
											$( self ).insertAfter( $( drop_target ) );
									}
									
									break;
									
								case $( drop_target ).length <= 0 && index == 0:	
									// no drop target and the index is the zero (topmost) position
									// place it at the top of the list!
									$( self ).prependTo( $( parent ) );
									
									break;
									
								default:
									
									// no dro target, so put it back where it came from!
									offset = $( self ).offset();
									
									if( Math.abs( start_left - offset.left ) > 0 && Math.abs( start_top - offset.top ) > 0 )
									{
										// get the child just BEFORE where we want to drop this item!	
										$( parent ).children().eq( (index - 1 ) ).after( $( self ) );

									} else {
										// the group did not move, must have been a click...
									}
							}
					
							// only assign a width if needed
							if( width )
							{
								$( self ).css({ "position":position, "top":"auto", "left":"auto", "width":width });
							} else {
							
								$( self ).css({ "position":position, "top":"auto", "left":"auto" });
							}
							
							break;
					}
					
					// indicate which item was acted upon by flashing
					if( flash_okay )
					{	
						// set all selected item's z-index back to 1
						$( ".wxy-searchmark-item-selected" ).css({ "z-index":1 });
						
						// remove any selected object classes and the class to show the blue highlight
						$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
						$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
						
						flash_element( self, 2, 100, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); } );
						
						// -------------------------------------------------------------
						// if it has the clone class, then it is  SEARCH RESULT (copy), so remove it's parent and replace it with this one!
						// -------------------------------------------------------------
						holder = $( drop_target ).parent();
						
						if( $( holder ).hasClass( "wxy-bookmarks-search-results-wrapper" ) )
						{
							holder = null;
						}

						switch (true)
						{
							case $( self ).hasClass( "wxy-searchmark-search-result-entry-clone" ) && $( holder ).length > 0:
							
								// a bookmark was dragged from the search results window into the bookmarks browser									
	
								// remove the original and keep the clone - but ONLY if it was dropped on a valid drop target!
								bookmarks_searchbar( "remove-original-items", self );

								// let the site know we have unsaved changes
								changes_tracker( "changes-not-saved" );

								break;
									
							case $( self ).hasClass( "wxy-searchmark-search-result-entry-original" ) && $( holder ).length > 0:

								// remove the clone and keep the original
								bookmarks_searchbar( "remove-clone-items", self );
								
								// let the site know we have unsaved changes
								changes_tracker( "changes-not-saved" );
								break;
						}
						
						
					} else {
						// save GROUP cookie
						groups_entry( "save-cookie" );
					}
					
					// clear our data object
					$( self ).removeData( "wxy-searchmark-move-settings" );

				});	
						
				// let the site know no items are moving anymore
				var all_moving = $( ".wxy-searchmark-is-being-moved" );
				$( all_moving ).removeClass( "wxy-searchmark-is-being-moved" );
				
				// turn our target halos OFF
				$( ".wxy-searchmark-target-active" ).removeClass( "wxy-searchmark-target-active" );
				$( ".wxy-searchmark-target-halo-active" ).removeClass( "wxy-searchmark-target-halo-active" );
				$( ".wxy-searchmark-padding-top" ).removeClass( "wxy-searchmark-padding-top" );
				
				// hide any highlight elements
				$( ".wxy-searchmark-target-halo-highlight" ).hide();
				$( ".wxy-searchmark-target-halo-highlight-bottom" ).hide();
				
				// make sure nothing is selected on our page
				clear_selections();
			}
		});


		// --------------------------------------------------------------------------
		// FOCUS EVENT: user feels like the page has stalled and wants to retry loading.
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-force-refresh-btn" ).on( "click", function()
		{
			// now load from the server instead
			groups_entry( "load-groups-from-server-silently" );
		});


		// --------------------------------------------------------------------------
		// WINDOW: LISTEN FOR WHEN THE PAGE WAS HIDDEN, SO WE CAN FORCE AN UPDATE OF OUR CONTENT!
		// --------------------------------------------------------------------------	
		$( window ).on("blur", function()
		{
			// just to make sure our window is flagged when it loses focus, so we can refresh the content when it is focused again
			if( SESSION_DATA[ "alert_triggered" ] !== true )
			{
				$( window ).data({ "wxy-tools-focus-event-triggered": true });
				
				// stop listening for scroll events!
				scroll_event_handler( "scroll_listener_off" );
			}
		});

		// --------------------------------------------------------------------------
		// WINDOW: LISTEN FOR WHEN THE PAGE WAS REFOCUSED, SO WE CAN FORCE AN UPDATE OF OUR CONTENT!
		// --------------------------------------------------------------------------	
		$( window ).on( "focus", function()
		{
			// get the current position of the searchmark holder (if it is negative, then it is showing! )
			var left = $( ".wxy-searchmark-widget-inner-wrapper" ).position().left;

			// clear our marker that indicates a focus event was recieved
			$( window ).data({ "wxy-tools-focus-event-triggered": false });
				
			// ALERTS: ignore focus event generated by showing alerts
			if( SESSION_DATA[ "alert_triggered" ] == true )
			{
				// clear our alert triggered flag
				SESSION_DATA[ "alert_triggered" ] = false;

			} else {
				
				// Clear out any pre-existing elements (in case we have originals and clones)
				groups_entry( "empty-groups-wrapper" );
				
				// close all dialogues and unselect all selected elements
				close_all_dialogues( "close-search-results-dialogue" );

				// mark our window as having recieved a focus event
				$( window ).data({ "wxy-tools-focus-event-triggered": true });
				
				// if the searchmark are showing, then force an immediate update...
				groups_entry( "load-groups-after-focus-event" );
				
				// add our scroll event listener back on the results window!
				search_tab( "activate-infinite-scrolling" );
			}
		});
		
		// --------------------------------------------------------------------------
		// AUTO CLOSE WIDGET - click anywhere outside the menu and if it is open, it will go away
		// --------------------------------------------------------------------------
		$( "body" ).on( "click", function( evt )
		{
			var mouse_x = evt[ "pageX" ];
			var offset = $( ".wxy-searchmark-widget-inner-wrapper" ).offset();
			var menu_x = offset[ "left" ];
			
			//  wxy-searchmark-menubar-item
			var target = evt[ "target" ];
			var srcElement = evt[ "sourceElement" ];

			// special case: ignore this if they are option+clicking a link to add it
			if( evt[ WXY_META_KEY ] != true && evt[ WXY_ALT_KEY ] != true && !$( ".wxy-searchmark-settings-dialogue" ).is(":visible") && !$( target ).hasClass( "wxy-searchmark-menubar-item" ) && !$( target ).hasClass( "wxy-searchmark-select-input" ) )
			{
				if( mouse_x < menu_x && menu_x > 0 )
				{	
					$( ".wxy-searchmark-widget-inner-wrapper" ).css({ "left":0 });
				}
			}
		});
			
		// --------------------------------------------------------------------------
		// SHOW BOOKMARKS BUTTON: show/hide BOOKMARKS/GROUPS/HISTORY
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-menu-btn, .wxy-searchmark-menubar-menu-btn, .wxy-searchmark-options-menu-close-box, .wxy-searchmark-mobile-menu-btn" ).on( "click", function()
		{
			open_close_widget();
		});
		
	
		// --------------------------------------------------------------------------
		// SEARCH BOOKMARKING: user clicked the bookmark icon in search form itself - new search bookmark
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-bookmark-this-form-btn" ).on( "click", function()
		{	
			// close all dialogues and unselect ALL items selected
			close_all_dialogues( "unselect-all-selected-items" );
			
			// add a new bookmark entry into our currently active group, or the main bookmark list
			groups_entry( "new-search-bookmark-from-form" );
	
		});
		
		// --------------------------------------------------------------------------
		// SEARCH BOOKMARKING: user clicked the bookmark icon in the RESULTS PAGE - new search bookmark
		// --------------------------------------------------------------------------
		$( "#wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-pagebar-bookmark-btn", function()
		{
			var self = this;
			
			// close all dialogues and unselect ALL items selected
			close_all_dialogues( "unselect-all-selected-items" );
	
			// add a new bookmark entry into our currently active group, or the main bookmark list
			groups_entry( "new-search-bookmark-from-results", $( self ) );

		});
		
		// --------------------------------------------------------------------------
		// SEARCH BOOKMARKING: RUN SEARCH FROM BOOKMARK
		// --------------------------------------------------------------------------
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-search-button-label", function( evt )
		{
			// make sure the meta keys to select this item are NOT pressed!
			var parent, element;		
			var self = this;
			var meta_key = evt[ WXY_META_KEY ];
			var alt_key = evt[ WXY_ALT_KEY ];
							
			if( !meta_key && !alt_key )
			{
				parent = $( this ).closest( ".wxy-searchmark-search" );
				element = $( parent ).find( ".wxy-searchmark-search-form-data" );

				// be sure to close any open dialogues!
				close_all_dialogues();

				// add a new bookmark entry into our currently active group, or the main bookmark list
				groups_entry( "run-search-bookmark", element );	
			}

		});
	
		// --------------------------------------------------------------------------
		// BOOKMARKING: user clicked the bookmark icon in the menu - add new bookmark
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-add-icon-btn, .wxy-searchmark-menubar-add-btn, .wxy-searchmark-menu-add-bookmark-btn" ).on( "click", function()
		{
			// close all dialogues and unselect ALL items selected
			close_all_dialogues( "unselect-all-selected-items" );
			
			// add a new bookmark entry into our currently active group, or the main bookmark list
			groups_entry( "new-bookmark" );

		});
	
	
		// -------------------------------------------------------------------------- 
		// SEARCH TAB SEARCHBAR: hide/show search label and mark it if it has input of any length
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-clear-btn" ).on( "click", function()
		{
			var parent = $( this ).closest( ".wxy-searchmark-search-wrapper" );
			var input = $( parent ).find( ".wxy-searchmark-keywords-input" );
			
			// clear our current search and focus the searchbar input
			$( input ).val( "" );
			
			// see which one we want to alter
			switch (true)
			{
				case $( input ).hasClass( "wxy-searchmark-sitesearch-bar-searchbar-input" ):
			
					// this is the SEARCH TAB keyword input field
					$( input ).removeClass( "wxy-searchmark-sitesearch-bar-searchbar-has-input" );
					$( input ).removeClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
					
					break;
					
				case $( input ).hasClass( "wxy-bookmarks-tab-searchbar-input" ):
			
					// this is the BOOKMARKS SEARCH keyword input field	
					$( input ).removeClass( "wxy-bookmarks-searchbar-has-input" );
					
					break;
			
			}

		});

		// -------------------------------------------------------------------------- 
		// SEARCH TAB SEARCHBAR: hide/show search label and mark it if it has input of any length
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-keywords-input" ).on( "focus", function()
		{
			var self = this;
			
			// see which one we want to alter
			switch (true)
			{
				case $( self ).hasClass( "wxy-searchmark-sitesearch-bar-searchbar-input" ):
			
					// this is the SEARCH TAB keyword input field		
					if( !$( self ).hasClass( "wxy-searchmark-sitesearch-bar-searchbar-has-input" ) )
					{		
						$( this ).addClass( "wxy-searchmark-sitesearch-bar-searchbar-has-input" );
					}
					
					break;
					
				case $( self ).hasClass( "wxy-bookmarks-tab-searchbar-input" ):
			
					// this is the BOOKMARKS SEARCH keyword input field	
					if( !$( self ).hasClass( "wxy-bookmarks-searchbar-has-input" ) )
					{		
						$( self ).addClass( "wxy-bookmarks-searchbar-has-input" );
					}
					
					break;
			}
			
		});

		$( ".wxy-searchmark-keywords-input" ).on( "blur", function()
		{	
			var self = this;
			var val = $( self ).val();
			
			if( String( val ).length <= 0 || String( val ) == "undefined" )
			{				
				$( self ).removeClass( "wxy-bookmarks-searchbar-has-input" );
			}
			
		});
		
		
		// -------------------------------------------------------------------------- 
		// SEARCH TAB SEARCHBAR: execute a search in the bookmarks
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-searchbar-go-btn" ).on( "click", function()
		{		
			bookmarks_searchbar( "bookmarks-search-new" );
		});
		
		
		// --------------------------------------------------------------------------
		// SEARCH TAB SEARCHBAR: user can submit search form by hitting return
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-keywords-input" ).on( "keydown", function( evt )
		{
			// listen for a return in the post id input in the admin menu bar... then jump to the page and edit it!
			var key_code = evt[ "keyCode" ];
			var val = $(this ).val();
			var btn, self;
			
			// see if we need to force a search...
			if( key_code == 13 )
			{
				// force a search!
				self = this;
				
				// see which one we want to alter
				switch (true)
				{
					case $( self ).hasClass( "wxy-searchmark-sitesearch-bar-searchbar-input" ):
			
						// this is the SEARCH TAB keyword input field
						btn = $( "#wxy-searchmark-search-tab-form" ).find( ".wxy-searchmark-sitesearch-tab-find-btn" );
				
						$( btn ).trigger( "click" );
					
						break;
					
					case $( self ).hasClass( "wxy-bookmarks-tab-searchbar-input" ):

						// user has hit return in the BOOKMARKS SEARCH BAR input field - perform a search ONLY in our bookmarks tab
						bookmarks_searchbar( "bookmarks-search-new" );
						
						break;
				}
			
			}

		});
		
		// --------------------------------------------------------------------------
		// SEARCH TAB SEARCHBAR: if user TAB's out of text input, it throws window lose focus event...
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-widget" ).on( "keydown", "input", function( evt )
		{
			var key_code = evt[ "keyCode" ];
			
			// if we don't prevent tabbing in our search form, the page loses focus and reloads!
			if( key_code == 9 )
			{
				// this prevents the window from reloading our saved cookies when it gets focus back
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault;

				return false;				
			}
		
		});
		
	
		// --------------------------------------------------------------------------
		// SEARCHBAR: hide/show search form...
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-advanced-btn" ).on( "click", function( evt )
		{
			var advanced = $( ".wxy-searchmark-advanced-search-wrapper" );

			if( $( advanced ).is( ":visible" ) )
			{
				$( advanced ).hide();
				
				// snap heights!
				snap_bookmark_tab_heights();
			}
			else {
				$( advanced ).show();
				
				// snap heights!
				snap_bookmark_tab_heights();
			}
			
		});

		// --------------------------------------------------------------------------
		// EDIT POST NOW: user has clicked the admi bar edit post button
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-menubar-edit-btn" ).on( "click", function()
		{
			var input = $( ".wxy-searchmark-menubar-post-input" );
			var val = $( input ).val();
			
			if( val > 0 )
			{
				var url = WP_SITE_URL + "/wp-admin/post.php?post=" + val + "&action=edit";
				window.location = url;
					
			} else {
					
				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
					
				alert("To edit a Page/Post, please enter a valid ID number.");
			}
		});
		
		
		// --------------------------------------------------------------------------
		// POST JUMP INPUT: RETURN KEY HIT
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-post-jump-input, .wxy-searchmark-menubar-post-input" ).on("keydown", function( evt )
		{
			// listen for a return in the post id input in the admin menu bar... then jump to the page and edit it!
			var key_code = evt[ "keyCode" ];
			var val = $(this ).val();
			
			if( key_code == 13 )
			{
				// they hit return, so jump, but only if there is apost number to jump to!
				if( val > 0 )
				{
					var url = WP_SITE_URL + "/wp-admin/post.php?post=" + val + "&action=edit";
					window.location = url;
					
				} else {
					
					// this prevents the window from reloading our saved cookies when it gets focus back
					SESSION_DATA[ "alert_triggered" ] = true;
					
					alert("To edit a Page/Post, please enter a valid ID number.");
				}					
			}

		});
		
		
		// --------------------------------------------------------------------------
		// KEYBOARD SHORTCUTS: CMD+B keyboard-triggered shortcut to open/close searchmark
		// --------------------------------------------------------------------------
		$( window ).on("keydown", function( evt )
		{
			var key_code = evt[ "keyCode" ];
			var modifier = WXY_SHOW_BOOKMARKS_SHORTCUT[ "modifier" ] || WXY_META_KEY;
			var key = WXY_SHOW_BOOKMARKS_SHORTCUT[ "key" ] || 66;
			
			switch (true)
			{
				case key_code == key && evt[ modifier ]:
				
					open_close_widget();
					break;
			}

		});
		
		
		// --------------------------------------------------------------------------
		// WINDOW: resize events
		// --------------------------------------------------------------------------
		$( window ).on("resize", function()
		{
			snap_bookmark_tab_heights();
		});
	
		// --------------------------------------------------------------------------
		// TABS: user wants to switch tab views
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-tab-btn" ).on( "click", function()
		{
			var btn = this;
			groups_entry( "change-tab-view", btn );
			
		});
		
		
		// --------------------------------------------------------------------------
		// OPTIONS MENU: gear menu button - user wants to view the options menu
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-options-btn" ).on( "click", function( evt )
		{	
			var menu = $( ".wxy-searchmark-options-menu" );
			var is_visible = $( menu ).is(":visible" );
			
			// hide any other open menus
			close_all_dialogues();
				
			if( !is_visible )
			{
				$( menu ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
				$( menu ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
				$( menu ).fadeIn(100);
			}
		});
		

		// --------------------------------------------------------------------------
		// DIALOGUES CLOSE BUTTONS: close search results and options dialogues
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-options-close-bar, .wxy-searchmark-dialogue-menubar-close-btn, .wxy-searchmark-search-results-close-bar" ).on( "click", function( evt )
		{
			// stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			
			var target = evt[ "target" ];
			
			if( $( target ).hasClass( "wxy-searchmark-search-results-close-button" ) )
			{	
				// they clicked the search results close buttons
				// clear out our search results ( if any )
				bookmarks_searchbar( "clear-search-results" );
				
				// manually close our search results dialogue
				close_all_dialogues( "close-search-results-dialogue" );
			
			} else {
				
				// hide any other open menus
				close_all_dialogues();
			}
			
			return false;
		});
		
		
		// --------------------------------------------------------------------------
		// SEARCH RESULTS HOLDER: user is trying to use the controls.... tell them to move the item out of the search results
		// --------------------------------------------------------------------------
		$( ".wxy-bookmarks-search-results-wrapper" ).on( "click", ".wxy-searchmark-group-is-active-flag, .wxy-searchmark-entry-control-duplicate-btn, .wxy-searchmark-entry-control-settings-btn, .wxy-searchmark-entry-control-trash-btn, .wxy-searchmark-group-control-duplicate-btn, .wxy-searchmark-group-control-settings-btn, .wxy-searchmark-group-control-trash-btn, .wxy-searchmark-search-control-duplicate-btn, .wxy-searchmark-search-control-settings-btn, .wxy-searchmark-search-control-trash-btn", function( evt )
		{
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			alert( "Please move items out of the search results window to edit, remove, or reorganize them." );
			
			// stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			
			return false;
		});

		// --------------------------------------------------------------------------
		// GROUPS: switch active group without opening it by using the active flag as a button
		// -------------------------------------------------------------------------- 
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-is-active-flag", function()
		{
			var flag = this;
			var group = $( flag ).closest( ".wxy-searchmark-group-wrapper" );
			var button;
			
			// see if we are turning our active group OFF or ON
			if( $( flag ).hasClass( "wxy-searchmark-group-is-active" ) || $( flag ).hasClass( "wxy-searchmark-group-is-active-parent" ) )
			{
				// they clicked the flag of an active group... turn off ALL indicators
				$( group ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
				$( group ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );
				
				// if we are not opening the group, then we need to also save the cookie!
				groups_entry( "save-cookie" );

			} else {

				// when groups are closed then activated, open them!
				button = $( group ).find( ".wxy-searchmark-group-button:first" );
			
				// set this flag so that if the group is already open, it will change status but not close!
				$( button ).addClass( "wxy-searchmark-close-override" );

				// send a click event!
				$( button ).trigger( "click" );
			}
			
			// let the site know there are unsaved changes
			changes_tracker( "changes-not-saved" );

		});
		
		// --------------------------------------------------------------------------
		// GROUPS FOLDER: select/deselect by cmd+clicking
		// --------------------------------------------------------------------------
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-button", function( evt )
		{
			var self = this;
			var group = $( self ).closest( ".wxy-searchmark-group-wrapper" );
			var meta_key = evt[ WXY_META_KEY ];
			var alt_key = evt[ WXY_ALT_KEY ];
			
			if( meta_key )
			{
				if( !alt_key )
				{
					switch (true)
					{
						case $( group ).hasClass( "wxy-searchmark-item-selected" ):
						
							$( group ).removeClass( "wxy-searchmark-item-selected" );
						
							// remove the selected class from the group button
							$( self ).removeClass( "wxy-searchmark-selection-color" );
							$( self ).closest( ".wxy-searchmark-group-inner-wrapper" ).removeClass( "wxy-searchmark-selection-color" );
							
							// make sure all children are NOT selected
							$( group ).find( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
							$( group ).find( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							
							// remove higlights from any parents
							$( group ).parents( ".wxy-searchmark-group-wrapper" ).each( function()
							{
								$( this ).find( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( this ).find( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							});
							
							break;
					
						case !$( group ).hasClass( "wxy-searchmark-item-selected" ):
					
							// remove higlights from any parents
							$( group ).parents( ".wxy-searchmark-group-wrapper" ).each( function()
							{
								$( this ).find( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( this ).find( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							});
							
							
							$( group ).addClass( "wxy-searchmark-item-selected" );
						
							// ADD the selected class from the group button
							$( self ).addClass( "wxy-searchmark-selection-color" );
							
							// also add the higlight to the inner wrapper!
							$( self ).closest( ".wxy-searchmark-group-inner-wrapper" ).addClass( "wxy-searchmark-selection-color" );
							
							
							// make sure all children are NOT selected
							$( group ).find( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
							$( group ).find( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							
							
							break;
					}
				} else if ( alt_key )
				{
					// close all dialogues and unselect all selected elements
					close_all_dialogues( "unselect-all-selected-items" );
				}
			
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				
				return false;
			}
		});
		
		// --------------------------------------------------------------------------
		// GROUPS: OPEN GROUP, CLOSE GROUP - show/hide contents of groups
		// -------------------------------------------------------------------------- 
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-button", function( evt )
		{
			var button = this;
			var is_open = $( button ).hasClass( "wxy-searchmark-group-content-button-open" );

			// only check for a url if the modifier keys are being held down (alt+cmd)
			switch (true)
			{
				case evt[ WXY_ALT_KEY ] == true && !is_open:
					
					// they want to OPEN ALL groups
					groups_entry( "open-all-groups", button );
					
					break;

				case evt[ WXY_ALT_KEY ] == true && is_open:
					// they want to CLOSE ALL groups
					groups_entry( "close-all-groups", button );
					
					break;
				
				default:
					// now open the folder if it is closed and close it if it is open
					groups_entry( "open-close-groups", button );
			}

			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
			
		});

		
		// -------------------------------------------------------------------------- 
		// GROUP: CLEAR - CLEARS ALL DATA FROM BROWSER AND SERVER!
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-clear-all" ).on( "click", function()
		{
			groups_entry( "remove-all" );
		});
		
		// -------------------------------------------------------------------------- 
		// GROUP: ADD a new GROUP to the main browser or the currently active group
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-tab-btn-add-group" ).on( "click", function()
		{
			// add an new group to either the currently active group, or to the main bookmark list
			groups_entry( "new-group" );
			
			// prevent the event from opening the entry itself
			return false;
		});
		
		// -------------------------------------------------------------------------- 
		// GROUP CONTROLS: duplicate this group
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-control-duplicate-btn", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();

			// close ALL settings dialogues!
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			var btn = this;
			
			// make sure all dialogues are closed
			close_all_dialogues();
			
			// make sure no dialogues are open
			if( open_dialogues <= 0 )
			{
				// just send the btn that was clicked
				groups_entry( "duplicate-group-bookmark-items", btn );
			} else {
				close_all_dialogues( "unselect-wxy-bookmark-items" );
			}
			
			// prevent the event from opening the entry itself
			return false;
		});
		
		// -------------------------------------------------------------------------- 
		// GROUP CONTROLS: remove this group (trash)
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-control-trash-btn", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();

			// close ALL settings dialogues!
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			var btn = this;
			
			// make sure all dialogues are closed
			close_all_dialogues();
			
			// make sure no dialogues are open
			if( open_dialogues <= 0 )
			{
				// now delete this bookmark 
				groups_entry( "remove-group-bookmark-items", btn );
			
			} else {
				close_all_dialogues( "unselect-wxy-bookmark-items" );
			}
			
			// prevent the event from opening the entry itself
			return false;
			
		});


		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY CONTROLS: VIEW this entry's post/page
		// -------------------------------------------------------------------------- 
		$( ".wxy-bookmarks-search-results-wrapper, .wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry-control-view-btn", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();

			// close ALL settings dialogues!
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			var btn = this;
			
			// make sure all dialogues are closed
			close_all_dialogues();
			
			// make sure no dialogues are open
			if( open_dialogues <= 0 )
			{
				// get all history entries with our selected class
				var entries = $( ".wxy-searchmark-item-selected" );

				// there are no highlighted entries, use the currently clicked on entry
				if( $( entries ).length <= 0 )
				{
					// get the parent of this history entry....
					entries = $( this ).closest( ".wxy-searchmark-entry" );
				}
			
				// open one or more bookmark previews in new windows
				groups_entry( "view-pages-posts", entries );
			
			} else {
				close_all_dialogues( "unselect-wxy-bookmark-items" );
			}
			
			// prevent the event from opening the entry itself
			return false;
				
		});
			
		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY CONTROLS: duplicate this entry
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry-control-duplicate-btn, .wxy-searchmark-search-control-duplicate-btn", function( evt )
		{		
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();

			// close ALL settings dialogues!
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			var btn = this;
			
			// make sure all dialogues are closed
			close_all_dialogues();
			
			// make sure no dialogues are open
			if( open_dialogues <= 0 )
			{
				// just send the btn that was clicked
				groups_entry( "duplicate-group-bookmark-items", btn );
			
			} else {
				close_all_dialogues( "unselect-wxy-bookmark-items" );
			}
			
			// prevent the event from opening the entry itself
			return false;

		});
		
		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY CONTROLS: remove this entry (trash)
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry-control-trash-btn, .wxy-searchmark-search-control-trash-btn", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();

			// close ALL settings dialogues!
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			var btn = this;
			
			// make sure all dialogues are closed
			close_all_dialogues();
			
			// make sure no dialogues are open
			if( open_dialogues <= 0 )
			{
				// now delete the selected items 
				groups_entry( "remove-group-bookmark-items", btn );
			
			} else {
				close_all_dialogues( "unselect-wxy-bookmark-items" );
			}
			
			// prevent the event from opening the entry itself
			return false;

		});
		
		// -------------------------------------------------------------------------- 
		// SEARCH BOOKMARK ENTRY CONTROLS: show/hide settings menu
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-search-control-settings-btn", function( evt )
		{	
			var self = this;
			var settings = $( "#wxy-searchmark-search-settings" );
			var text_swatches = $( ".wxy-searchmark-search-text-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var base_swatches = $( ".wxy-searchmark-search-base-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var sample_class = $( ".wxy-searchmark-search-sample" ).data("base-class") || "wxy-searchmark-search-sample";
		
			// see if there is one ore more items selected
			var this_search, searches;
			
			// get all search entries with our selected class, filter out the groups that might be selected
			var entries = $( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" );

			// now get the currently clicked on bookmark, in case no items are highlighted
			var this_search = $( self ).closest( ".wxy-searchmark-search" );
			
			// make sure the entries and searches clicked are not the same...
			if( $( entries ).length == 1 && $( this_search ).html() == $( entries ).html() && $( this_search ).index() == $( entries ).index() )
			{
				entries = null;
			}
			
			// if the currently clicked search is not selected and does not have the this class, then it is a new item!
			// unselect all other old ones and select just this one...
			var show_all_fields = false;
			
			// if are settings are already visible, then close them...
			if( $( settings ).is( ":visible" ) )
			{
				// close all dialogues, but don't de-select anything selected!
				close_all_dialogues();
				
				// same as a cancel...
				return false;
				
			} else {
				// but if they are not visible close all others, but show them instead!
				close_all_dialogues();
			
				$( settings ).show();
			}
		
			switch (true)
			{
				case $( entries ).length > 0 && !$( this_search ).hasClass( "wxy-searchmark-item-selected" ):
					
					// ADDITONAL ITEMS are SELECTED, item clicked on was NOT SELECTED - make it the only selected item
					$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
					$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
					
					$( this_search ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );					
					
					searches = this_search;
					
					show_all_fields = true;

					break;
					
				case $( entries ).length <= 0 && $( this_search ).length == 1:
					
					// NO additonal items selected, and the one clicked on was not selected either, so use it
					if( !$( this_search ).hasClass( "wxy-searchmark-item-selected" ) )
					{
						$( this_search ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
					}
					
					searches = this_search;

					show_all_fields = true;
					
					break;
					
				default:
				
					// ADDITIONAL ITEMS selected, including the one clicked on
					$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).hide();
				
					searches = entries;
				
					show_all_fields = false;

			}
			
			// turn on all fields or just show the colors adjusters?
			if( show_all_fields )
			{
				// be sure we can edit all info fields for this single item!
				$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).show();
			}

			// process JUST THE FIRST bookmark
			var this_search = $( searches ).filter(":first" );
			var label = $( this_search ).find( ".wxy-searchmark-search-button-label" );
			var title, url, base_color, text_color;
			
			// set up our dislaogue's values
			title = $( label ).html();
			
			// assign our values in the settings dialogue
			$( settings ).find( ".wxy-searchmark-search-title-textarea" ).val( title );
					
			// see what our colors are, but first, reset the base class on the sample bookmark
			$( "." + sample_class ).attr({ "class":sample_class });
				
			// remove any previously selected swatches
			$( ".wxy-searchmark-color-swatch-selected" ).removeClass( "wxy-searchmark-color-swatch-selected" );
				
			// select which TEXT swatch we are currently using
			$( text_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark entry
				var self = this;
				var color = $( self ).attr("id");
					
				if( $( this_search ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					text_color = color;
				}
					
			});
				
			// select which BASE swatch we are currently using
			$( base_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark entry
				var self = this;
				var color = $( self ).attr("id");
				
				if( $( this_search ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					base_color = color;
				}
					
			});
				
			// now make sure the swatches are set up!
			update_settings_samples( $( settings ) );
					
			// now hoist it to the top of the zindex and show it
			$( settings ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
			$( settings ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( settings ).fadeIn(100);

			// prevent the event from opening the entry itself
			return false;
		});
		
		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY CONTROLS: show/hide settings menu
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-entry-control-settings-btn", function( evt )
		{	
			var self = this;
			var settings = $( "#wxy-searchmark-entry-settings" );
			var text_swatches = $( ".wxy-searchmark-entry-text-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var base_swatches = $( ".wxy-searchmark-entry-base-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var sample_class = $( ".wxy-searchmark-entry-sample" ).data("base-class") || "wxy-searchmark-entry-sample";
		
			// see if there is one ore more items selected
			var this_bookmark, searchmark;
			
			// get all searchmark entries with our selected class, filter out the groups that might be selected
			var entries = $( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" );//.not( ".wxy-searchmark-group" );

			// now get the currently clicked on bookmark, in case no items are highlighted
			var this_bookmark = $( self ).closest( ".wxy-searchmark-entry" );
			
			// make sure the entries and bookmark clicked are not the same...
			if( $( entries ).length == 1 && $( this_bookmark ).html() == $( entries ).html() && $( this_bookmark ).index() == $( entries ).index() )
			{
				entries = null;
			}
			
			// if the currently clicked searchmark is not selected and does not have the this class, then it is a new item!
			// unselect all other old ones and select just this one...
			var show_all_fields = false;
			
			// if are settings are already visible, then close them...
			if( $( settings ).is( ":visible" ) )
			{
				// close all dialogues, but don't de-select anything selected!
				close_all_dialogues();
				
				// same as a cancel...
				return false;
				
			} else {
				// but if they are not visible close all others, but show them instead!
				close_all_dialogues();
			
				$( settings ).show();
			}
		
			switch (true)
			{
				case $( entries ).length > 0 && !$( this_bookmark ).hasClass( "wxy-searchmark-item-selected" ):
					
					// ADDITONAL ITEMS are SELECTED, item clicked on was NOT SELECTED - make it the only selected item
					$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
					$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
					
					$( this_bookmark ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );					
					
					searchmark = this_bookmark;
					
					show_all_fields = true;

					break;
					
				case $( entries ).length <= 0 && $( this_bookmark ).length == 1:
					
					// NO additonal items selected, and the one clicked on was not selected either, so use it
					if( !$( this_bookmark ).hasClass( "wxy-searchmark-item-selected" ) )
					{
						$( this_bookmark ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
					}
					
					searchmark = this_bookmark;

					show_all_fields = true;
					
					break;
					
				default:
				
					// ADDITIONAL ITEMS selected, including the one clicked on
					$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).hide();
				
					searchmark = entries;
				
					show_all_fields = false;

			}
			
			// turn on all fields or just show the colors adjusters?
			if( show_all_fields )
			{
				// be sure we can edit all info fields for this single item!
				$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).show();
			}

			// process JUST THE FIRST bookmark
			var bookmark = $( searchmark ).filter(":first" );			
			var a_link = $( bookmark ).find( ".wxy-searchmark-entry-link" );
			var permalink = $( bookmark ).find( ".wxy-searchmark-post-permalink" );
			var title, url, target, post_id, base_color, text_color, view_url;
			
			// set up our dialogue's values
			title = $( a_link ).html();
			url = $( a_link ).attr( "href" );
			view_url = $( permalink ).html(); 

			target = $( a_link ).prop( "target" );
			post_id = $( bookmark ).find( ".wxy-searchmark-post-id" ).html();
					
			// assign our values in the settings dialogue
			$( settings ).find( ".wxy-searchmark-entry-title-textarea" ).val( title );
			$( settings ).find( ".wxy-searchmark-entry-url-textarea" ).val( url );
			
			$( settings ).find( ".wxy-searchmark-entry-view-url-textarea" ).val( view_url );
			
			$( settings ).find( ".wxy-searchmark-entry-target-select" ).val( target );
			$( settings ).find( ".wxy-searchmark-entry-post-id-textarea" ).val( post_id );
					
			// see what our colors are, but first, reset the base class on the sample bookmark
			$( "." + sample_class ).attr({ "class":sample_class });
				
			// remove any previouslt selected swatches
			$( ".wxy-searchmark-color-swatch-selected" ).removeClass( "wxy-searchmark-color-swatch-selected" );
				
			// select which TEXT swatch we are currently using
			$( text_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark entry
				var self = this;
				var color = $( self ).attr("id");
					
				if( $( bookmark ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					text_color = color;
				}
					
			});
				
			// select which BASE swatch we are currently using
			$( base_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark entry
				var self = this;
				var color = $( self ).attr("id");
				
				if( $( bookmark ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					base_color = color;
				}
					
			});
				
			// now make sure the swatches are set up!
			update_settings_samples( $( settings ) );
					
			// now hoist it to the top of the zindex and show it
			$( settings ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
			$( settings ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( settings ).fadeIn(100);

			// prevent the event from opening the entry itself
			return false;
		});
	
		
		// -------------------------------------------------------------------------- 
		// COLOR SWATCHES: SETTINGS - change text and base colors for BOTH groups and entries
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-color-swatch" ).on( "click", function( evt )
		{
			var self = this;
			var parent = $( self ).parent();
			var selected = $( parent ).find( ".wxy-searchmark-color-swatch-selected" );
			var settings = $( self ).closest( ".wxy-searchmark-settings-dialogue" );

			// clear all selected colors
			$( selected ).removeClass( "wxy-searchmark-color-swatch-selected" );
			
			// highlight only the one last clicked
			$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
			
			// now force a refresh update of all colors by sending the swatch's parent
			update_settings_samples( settings );

		});
		
		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY: SETTINGS - SAVE our new bookmark's settings
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-entry-settings-okay-btn" ).on( "click", function( evt )
		{	
			// get the settings dialogue to retrieve our new values from (our source)
			var settings = $( "#wxy-searchmark-entry-settings" );

			// send the source for our colors...
			color_selected_items( settings );

			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
			
		});
		
		// -------------------------------------------------------------------------- 
		// BOOKMARK ENTRY: SETTINGS - close our settings dialogue
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-entry-settings-cancel-btn" ).on( "click", function( evt )
		{
			// close all dialogues as well
			close_all_dialogues( "unselect-wxy-bookmark-items" );
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		
		
		// -------------------------------------------------------------------------- 
		// SEARCH BOOKMARK ENTRY: SETTINGS - SAVE our new search's settings
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-search-settings-okay-btn" ).on( "click", function( evt )
		{
			// get the settings dialogue to retrieve our new values from (our source)
			var settings = $( "#wxy-searchmark-search-settings" );

			// send the source for our colors...
			color_selected_items( settings );

			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		
		// -------------------------------------------------------------------------- 
		// SEARCH BOOKMARK ENTRY: SETTINGS - close our settings dialogue
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-search-settings-cancel-btn" ).on( "click", function( evt )
		{
			// close all dialogues as well
			close_all_dialogues( "unselect-wxy-bookmark-items" );
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		

		// -------------------------------------------------------------------------- 
		// GROUP ENTRY CONTROLS: show/hide settings menu
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-groups-inner-holder" ).on( "click", ".wxy-searchmark-group-control-settings-btn", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			
			var self = this;
			var settings = $( "#wxy-searchmark-group-settings" );
			var text_swatches = $( ".wxy-searchmark-group-text-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var base_swatches = $( ".wxy-searchmark-group-base-color-holder" ).find( ".wxy-searchmark-color-swatch" );
			var sample_class = $( ".wxy-searchmark-group-sample" ).data("base-class") || "wxy-searchmark-group-sample";

			// see if there is one ore more items selected
			var this_group, groups, title, url, target, base_color, text_color;
			
			// get all bookmark groups with our selected class, filter out the bookmark entries that might be selected
			var groups = $( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" ).not( ".wxy-searchmark-entry" );

			// now get the currently clicked on group, in case no items are highlighted
			var this_group = $( self ).closest( ".wxy-searchmark-group-wrapper" );
			
			// make sure the entries and bookmark clicked are not the same...
			if( $( groups ).length == 1 && $( this_group ).html() == $( groups ).html() && $( this_group ).index() == $( groups ).index() )
			{
				groups = null;
			}
			
			// if the currently clicked searchmark is not selected and does not have the this class, then it is a new item!
			// unselect all other old ones and select just this one...
			var show_all_fields = false;
			
			// if are settings are already visible, then close them...
			if( $( settings ).is( ":visible" ) )
			{
				// close all dialogues, but don't de-select anything selected!
				close_all_dialogues();
				
				// deselct all selected items since the used the icon to close
				$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
				$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
				
				// same as a cancel...
				return false;
				
			} else {
				// but if they are not visible close all others, but show them instead!
				close_all_dialogues();
			
				$( settings ).show();
			}
			
			switch (true)
			{
				case $( groups ).length > 0 && !$( this_group ).hasClass( "wxy-searchmark-item-selected" ):
					
					// ADDITONAL ITEMS are SELECTED, item clicked on was NOT SELECTED - make it the only selected item
					$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
					$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
					
					// add our highlight to the button AND the inner wrapper!
					$( this_group ).find( ".wxy-searchmark-group-button:first" ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
					
					groups = this_group;
					
					show_all_fields = true;

					break;
					
				case $( groups ).length <= 0 && $( this_group ).length == 1:
					
					// NO additonal items selected, and the one clicked on was not selected either, so use it
					if( !$( this_group ).hasClass( "wxy-searchmark-item-selected" ) )
					{
						// add our highlight to the button, not the parent group
						$( this_group ).find( ".wxy-searchmark-group-button:first" ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
					}
					
					groups = this_group;

					show_all_fields = true;
					
					break;
					
				default:
				
					// ADDITIONAL ITEMS selected, including the one clicked on
					$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).hide();
				
					show_all_fields = false;

			}

			// turn on all fields or just show the colors adjusters?
			if( show_all_fields )
			{
				// be sure we can edit all info fields for this single item!
				$( settings ).find( ".wxy-searchmark-single-entry-edit-fields-wrapper" ).show();
			}

			// ----------------------------------------------------
			// USE ONLY THE FIRST SELECTED GROUP'S VALUES
			// ----------------------------------------------------
			var group = $( groups ).filter(":first" );
			
			// set up our dialogue's values			
			var title = $( group ).find( ".wxy-searchmark-group-button-label" ).html();

			// assign our values in the settings dialogue
			$( settings ).find( ".wxy-searchmark-group-title-textarea" ).val( title );
				
			// reset the base class on the color sample buttons
			$( "." + sample_class ).attr({ "class":sample_class });

			// remove any previously selected swatches
			$( ".wxy-searchmark-color-swatch-selected" ).removeClass( "wxy-searchmark-color-swatch-selected" );
				
			// select which TEXT swatch we are currently using
			$( text_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark group
				var self = this;
				var color = $( self ).attr("id");
			
				if( $( group ).find( ".wxy-searchmark-group-inner-wrapper:first" ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					text_color = color;
				}
					
			});
				
			// select which BASE swatch we are currently using
			$( base_swatches ).each( function()
			{
				// see if this swatch color matches the one assigned to our bookmark group
				var self = this;
				var color = $( self ).attr("id");
					
				if( $( group ).find( ".wxy-searchmark-group-inner-wrapper:first" ).hasClass( color ) )
				{
					$( self ).addClass( "wxy-searchmark-color-swatch-selected" );
					base_color = color;
				}
					
			});

			// now hoist it to the top of the zindex and show it
			$( settings ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
			$( settings ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( settings ).fadeIn(100);
		
			// now make sure the swatches are set up!
			update_settings_samples( $( settings ) );
			
			return false;
			
		});
	
		// -------------------------------------------------------------------------- 
		// GROUP: SETTINGS - SAVE our new bookmark settings
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-group-settings-okay-btn" ).on( "click", function( evt )
		{	
			// get the settings dialogue to retrieve our new values from (our source)
			var settings = $( "#wxy-searchmark-group-settings" );

			// send the source for our colors...
			color_selected_items( settings );
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
			
		});
		
		// -------------------------------------------------------------------------- 
		// GROUP: SETTINGS - close our settings dialogue
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-group-settings-cancel-btn" ).on( "click", function( evt )
		{
			// close all dialogues as well
			close_all_dialogues( "unselect-wxy-bookmark-items" );
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		
		// --------------------------------------------------------------------------
		// HISTORY: user clicks on an entry using CMD key to highlight it
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-history-tab-entries" ).on( "click", ".wxy-searchmark-history", function( evt )
		{
			var self = this;
			var meta_key = evt[ WXY_META_KEY ];
			var alt_key = evt[ WXY_ALT_KEY ];
			
			// be sure to close any open dialogues!
			close_all_dialogues();
			
			if( meta_key )
			{
				if( !alt_key )
				{
					switch (true)
					{
						case $( self ).hasClass( "wxy-searchmark-history-item-selected" ):
							$( self ).removeClass( "wxy-searchmark-history-item-selected" );
							$( self ).removeClass( "wxy-searchmark-selection-color" );
							break;
					
						case !$( self ).hasClass( "wxy-searchmark-history-item-selected" ):
							$( self ).addClass( "wxy-searchmark-history-item-selected" );
							$( self ).addClass( "wxy-searchmark-selection-color" );
							break;
					}
				
				} else if ( alt_key )
				{
					// close all dialogues and unselect all selected elements
					close_all_dialogues( "unselect-all-selected-items" );
				}
				
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				
				return false;
			}

		});
		
		// -------------------------------------------------------------------------- 
		// HISTORY: CLEAR - clear all entries in our current history
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-tab-btn-clear-history, .wxy-searchmark-main-menu-option-clear-history" ).on( "click", function()
		{		
				// now call for removal...
				history_entry( "remove-all" );
		});
		
		// -------------------------------------------------------------------------- 
		// HISTORY ENTRY CONTROLS: REMOVE this entry (trash)
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-history-tab-entries").on( "click", ".wxy-searchmark-history-control-trash-btn", function( evt )
		{
			// close ALL settings dialogues!
			close_all_dialogues();
			
			// get all history entries with our selected class
			var entries = $( ".wxy-searchmark-history-item-selected" );
			
			// there are no highlighted entries, use the currently clicked on entry
			if( $( entries ).length <= 0 )
			{
				// get the parent of this history entry....
				entries = $( this ).closest( ".wxy-searchmark-history" );
			}
			
			// now remove them
			history_entry( "remove", entries );

			// prevent the event from opening the entry itself
			return false;
		});
		
		// -------------------------------------------------------------------------- 
		// HISTORY ENTRY CONTROLS: MOVE this entry to groups (folders)
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-history-tab-entries" ).on( "click", ".wxy-searchmark-history-control-move-btn", function( evt )
		{
			// close ALL settings dialogues!
			close_all_dialogues();
			
			// get all history entries with our selected class
			var entries = $( ".wxy-searchmark-history-item-selected" );
			
			// there are no highlighted entries, use the currently clicked on entry
			if( $( entries ).length <= 0 )
			{
				// get the parent of this history entry....
				entries = $( this ).closest( ".wxy-searchmark-history" );
			}
			
			// now move them to the groups folder
			history_entry( "move-to-groups", entries );

			// prevent the event from opening the entry itself
			return false;

		});
		 
		 
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Preferences - open the preferences pane in the admin panel!
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-preferences" ).on( "click", function( evt )
		{
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			// jump to our preferences/help pane
			window.location = "options-general.php?page=wxy_searchmark_options_page";

			//alert( "Currently, no preferences are changeable by the user. To turn off/on autosave, you can simply use the 'Autosave is off' and 'Autosave is on' button." );

		});
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Bug Report - report an issue via email
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-bug-report" ).on( "click", function( evt )
		{
			window.location = "mailto:info@wxytools.com?subject=WXY%20Tools%20Book%20Marks%20Bug%20Report&body=Please%20describe%20the%20issue%20clearly%20and%20in%20as%20much%20detail%20as%20you%20can.%20Also,%20attaching%20screenshots%20of%20the%20problem%20can%20help%20immensely.%0A%0APast%20solutions%20are%20at:%0Ahttp%3A%2F%2Fwww.wxytools%2Fsupport%2F";
		});
		
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: View HTML - See and edit the raw HTML for the groups/searchmark
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-view-html" ).on( "click", function( evt )
		{
			close_all_dialogues();
			
			var menu =$( ".wxy-searchmark-view-html-dialogue" );
			
			if( !$( menu ).parent().is( "body" ) )
			{		
				$( menu ).appendTo( $( "body" ) );
			}
			
			// get our raw html....
			var html = $( ".wxy-searchmark-groups-inner-holder" ).html();
			
			// put it in our text area...
			$( ".wxy-searchmark-view-html-textarea" ).val( html );
			
			// now show the menu....
			$( menu ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
			$( menu ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( menu ).fadeIn(100);
			
		});
		
		// -------------------------------------------------------------------------- 
		// VIEW HTML DIALOGUE: Okay button
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-view-html-okay-btn" ).on( "click", function( evt )
		{
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
					
			// ask if they are sure they want to replace the current groups/searchmark with this altered version?
			var okay;
			
			okay = confirm( "Are you sure you want to keep these changes to the HTML of your folders and searchmark?" );
			
			if( okay )
			{
				// replace our current HTML with this edited version
				var html = $( ".wxy-searchmark-view-html-textarea" ).val();
				$( ".wxy-searchmark-groups-inner-holder" ).html( html );
				
				// save group COOKIE
				groups_entry( "save-cookie" );
				
			} else {
				// they hit cancel...
			}	

			// now fade the settings dialogue out!
			$( ".wxy-searchmark-settings-dialogue" ).fadeOut(200, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" ); });
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
			
		});
		
		// -------------------------------------------------------------------------- 
		// VIEW HTML DIALOGUE: Cancel button
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-view-html-cancel-btn" ).on( "click", function()
		{
			$( this ).parent().fadeOut(200);
		});
		
		
		// -------------------------------------------------------------------------- 
		// UPLOAD DIALOGUE: CHOOSE FILE button
		// -------------------------------------------------------------------------- 	
		$( "input[type='file']" ).on("mousedown", function()
		{
			// we need to set this flag as the button is pressed DOWN, to prevent the searchmark from reloading...
			
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;

		});
			
		// -------------------------------------------------------------------------- 
		// UPLOAD DIALOGUE: Okay button
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-upload-okay-btn" ).on( "click", function( evt )
		{
			// make sure we have a file to download... then do it!
			var val = $( "#wxy-searchmark-file" ).val();
			
			if( !val )
			{
				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
					
				alert( "Please select a file to upload before submitting the form." );
			} else {
				// upload!
				
				close_all_dialogues();

				groups_entry( "upload-groups-to-server" );
				
			}
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
			
		});
		
		// -------------------------------------------------------------------------- 
		// UPLOAD DIALOGUE: Cancel button
		// -------------------------------------------------------------------------- 	
		$( ".wxy-searchmark-upload-cancel-btn" ).on( "click", function()
		{
			$( this ).parent().fadeOut(200);
		});
		

		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Upgrade (contribute)
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-contribute" ).on( "click", function( evt )
		{
			// user is interested in contributing!
			window.location = "options-general.php?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3";
		});
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Download - download groups and searchmark ot the desktop
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-download" ).on( "click", function( evt )
		{
			// upload a html/text/zip file of groups and searchmark for injection into the database
			groups_entry( "download-groups-from-server" );
		});
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Upload - insert groups and searchmark from the desktop into wordpress
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-upload" ).on( "click", function( evt )
		{
			// upload a html/text/zip file of groups and searchmark for injection into the database
			groups_entry( "select-groups-to-upload" );
		});
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: RELOAD - reload groups and searchmark from the server
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-refresh" ).on( "click", function( evt )
		{
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			var okay;
			
			okay = confirm( "Reloading will replace all of the folders and searchmark currently in the folder tab.\r\n\r\nAre you sure you want to replace them with what is stored in the database?");
			
			if( okay )
			{
				// get our server-saved groups and searchmark
				groups_entry( "load-groups-from-server" );
			} else {
				// cancel
			}

		});
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: Review - give us a review on the Wordpress Plugin Site
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-review" ).on( "click", function( evt )
		{
			window.location = "https://wordpress.org/support/plugin/wxy-searchmark/reviews/#new-post";
		});
		

		// -------------------------------------------------------------------------- 
		// SERVER-SIDE SAVE BUTTON: User clicked the save button to make changes permanent to the server 
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-save-btn" ).on( "click", function( evt )
		{
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			
			var self = this;
			
			// it is active
			changes_tracker( "check-if-okay-to-save-manually" );
			
			return false;
		});
		
		
		// -------------------------------------------------------------------------- 
		// MAIN OPTIONS MENU: RESET dialogue positions
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-main-menu-option-reset-menus" ).on( "click", function()
		{
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			var okay;
			
			okay = confirm( "Set all WXY Bookmarks menus and dialoges to their default locations?\r\n\r\nDoing this will reload the page.");
			
			if( okay )
			{	
				groups_entry( "save-cookie-reset-dialogues" );
				
				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
					
				//alert( "Please refresh the page, to see the changes.");
				
				// now reload the page....
				window.location = window.location.href;
				
			} else {
				// cancel
			}
		});
		
		
		// -------------------------------------------------------------------------- 
		// POST ID/JUMP INPUT setup (in the admin bar menu)
		// -------------------------------------------------------------------------- 
		if( SESSION_DATA[ "post_id" ] )
		{
			// see if we need to hide the post_id
			if( SESSION_DATA["admin_panel_info"][ "id" ] == "edit-post" )
			{
				SESSION_DATA["post_id"] = "";
			}
			
			$( ".wxy-searchmark-post-jump-input" ).val( SESSION_DATA[ "post_id" ] );
		}
		
		
		// --------------------------------------------------------------------------
		// SETTINGS: BOOKMARKS - delete button - user wants to delete one ore more items!
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-entry-settings-delete-btn" ).on(" click", function( evt )
		{
			var self = this;
			var parent = $( self ).closest( ".wxy-searchmark-settings-dialogue" );
			var entry = $( ".wxy-searchmark-item-selected:first" );
			var delete_btn;
			
			// get the bookmark delete button
			delete_btn = $( entry ).find( ".wxy-searchmark-entry-control-trash-btn:first" );
			
			// get the group delete button
			if( $( delete_btn ).length <= 0 )
			{
				delete_btn = $( entry ).find( ".wxy-searchmark-group-control-trash-btn:first" );
			}

			if( $( delete_btn ).length > 0 )
			{
				// close all dialogues, but don't de-select anything selected!
				close_all_dialogues();
				
				// now, click the delete button!
				TIMEOUT = setTimeout( function() { $( delete_btn ).trigger("click") }, 100 );
			}
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		
		// --------------------------------------------------------------------------
		// SETTINGS: SEARCH BOOKMARK - delete button - user wants to delete one ore more items!
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-search-settings-delete-btn" ).on(" click", function( evt )
		{
			var self = this;
			var parent = $( self ).closest( ".wxy-searchmark-settings-dialogue" );
			var entry = $( ".wxy-searchmark-item-selected:first" );
			var delete_btn;
			
			// get the search delete button
			delete_btn = $( entry ).find( ".wxy-searchmark-search-control-trash-btn:first" );

			// get the group delete button
			if( $( delete_btn ).length <= 0 )
			{
				delete_btn = $( entry ).find( ".wxy-searchmark-group-control-trash-btn:first" );
			}

			if( $( delete_btn ).length > 0 )
			{
				// close all dialogues, but don't de-select anything selected!
				close_all_dialogues();
				
				// now, click the delete button!
				TIMEOUT = setTimeout( function() { $( delete_btn ).trigger("click") }, 100 );
			}
			
			// be sure to stop our event from bubbling!
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			return false;
		});
		
		
		// -------------------------------------------------------------------------- 
		// SITESEARCH: EDIT the preview for one ore more search results
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-edit-btn", function( evt )
		{
			var selected = $( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// if there is only one let it go, otherwise, we need to create new windows and open them all at once
			if( $( selected ).length > 1 )
			{
				// stop our event from bubbling
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();

				// open a new window for each item selected
				var title = 0;
				
				$( selected ).each( function()
				{
					var href = $( this ).attr( "href" );
					
					title += 1;
					
					// create a new window! window.open(URL, name, specs, replace)
					window.open( href, "new-window-" + title, "", false );
				});
				
				// unselect our items...
				$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );
				
				return false;
			} else {
				// just let it go, man!
			}
		});
		
		
		// -------------------------------------------------------------------------- 
		// SITESEARCH: VIEW one ore more search results
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-view-link", function( evt )
		{
			var selected = $( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// if there is only one let it go, otherwise, we need to create new windows and open them all at once
			if( $( selected ).length > 1 )
			{
				// stop our event from bubbling
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();

				// open a new window for each item selected
				var title = 0;
				
				$( selected ).each( function()
				{
					var self = this;
					var parent = $( self ).closest( ".wxy-searchmark-sitesearch-entry" );
					var a_link = $( parent ).find( ".wxy-searchmark-sitesearch-view-link" );
					var href = $( a_link ).attr( "href" );
					
					title += 1;
					
					// create a new window! window.open(URL, name, specs, replace)
					window.open( href, "new-window-" + title, "", false );
				});
				
				// unselect our items...
				$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );
				
				return false;
			} else {
				// just let it go, man!
			}
		});
		
		
		// -------------------------------------------------------------------------- 
		// SITESEARCH: show search results as plain text url's in an alert
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-view-urls-btn" ).on( "click", function()
		{
			// get ONLY the result children
			var link_wrappers = $( "#wxy-searchmark-sitesearch-tab-links" ).find( ".wxy-searchmark-sitesearch-view-btn" );
			var entries = $( ".wxy-searchmark-sitesearch-entry" ) 
			var title, href;
			var link_text = "";
			var menu = "#wxy-searchmark-view-links-dialogue";
			
			$( entries ).each( function()
			{
				var self = this;
				
				// wxy-searchmark-sitesearch-view-link - this holds the view link (href)
				href = $( self ).find( ".wxy-searchmark-sitesearch-view-link" ).attr( "href" );
				
				// wxy-searchmark-sitesearch-edit-link = this is what holds the text description
				title = $( self ).find( ".wxy-searchmark-sitesearch-edit-link" ).text();
				
				// add to our result as HTML as link
				link_text += '<a href="' + href + '">' + title + '</a>\r\n';
			});
			
			if( String( link_text ).length <= 0 )
			{
				link_text = "Please perform a search first, then you can display their urls.";
			}
			
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
		
			// add window to DOM and display links in html
			$( menu ).find( ".wxy-searchmark-view-links-textarea" ).text( link_text );
			
			// now show the menu....
			$( menu ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
			$( menu ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( menu ).fadeIn(100);

		});
		
		
		// -------------------------------------------------------------------------- 
		// SITESEARCH: infinite scroll handling on sitesearch (search) tab
		// --------------------------------------------------------------------------
		$( "#wxy-searchmark-sitesearch-tab-links" ).on( "scroll", function()
		{
			infinite_scroll_handler( this );
		});
		
		
		// -------------------------------------------------------------------------- 
		// SITESEARCH: hide/show content in sitesearch lists
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-section-btn", function()
		{
			var content = $( this ).parent().find( ".wxy-searchmark-sitesearch-section-content" );
			
			$( content ).slideToggle(300);
		});

		// -------------------------------------------------------------------------- 
		// USER SELECT MENU: a different user has been selected
		// -------------------------------------------------------------------------- 
		$( ".wxy-searchmark-owners-select" ).on( "change", function()
		{
			username_select_menu( "change-user" );
		});
		
		// -------------------------------------------------------------------------- 
		// VERSION NUMBER SETUP
		// -------------------------------------------------------------------------- 
		var ver = String( "WXY Searchmark, ver " + _VERSION["version"] + "<br /><a href='" + _VERSION["compatibility_url"] + "' style='color:#666;'>Compatibility information at WXY Tools.com</a>" );
		$( ".wxy-searchmark-version-info" ).html( ver );
		
		// -------------------------------------------------------------------------- 
		// AUTOSAVE STATUS: updtate on startup and listen for changes
		// --------------------------------------------------------------------------
		changes_tracker( "update-autosave-status" );
		
		$( ".wxy-searchmark-autosave-btn" ).on( "click", function()
		{
			// switch between autosave being on or off...
			changes_tracker( "toggle-autosave-status" );
			
		});
		
		// -------------------------------------------------------------------------- 
		// READY STATUS: bookmark is ready to use, let the user know!
		// --------------------------------------------------------------------------
		flash_element( $( ".wxy-searchmark-menubar-menu-btn" ).parent(), 2,100 );
		
		// -------------------------------------------------------------------------- 
		// TABS HOLDER: make sure our widget is the right height after load...
		// --------------------------------------------------------------------------
		snap_bookmark_tab_heights();


		// --------------------------------------------------------------------------
		// SITESEARCH: user has clicked the FIND PAGES/POSTS form submit button
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-find-btn" ).on( "click", function( evt )
		{
			// set up our form data for the sitesearch (search) tab!
			var form = $( this ).closest( "form" );
			
			// reset our use page value to null
			$( "#searchmark_form_use_page" ).val( "" );
			
			// send an action and what to perform the action on
			search_tab( "search-pages-posts", form );

		});


		// --------------------------------------------------------------------------
		// SITESEARCH: user is COMMAND+CLICKING a post/page to highlight it
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-entry", function( evt )
		{		
			var self = this;
			var edit_link = $( self ).find( ".wxy-searchmark-sitesearch-edit-link" );
			var meta_key = evt[ WXY_META_KEY ];
			var alt_key = evt[ WXY_ALT_KEY ];
			
			// be sure to close any open dialogues!
			close_all_dialogues();
			
			if( meta_key )
			{
				if( !alt_key )
				{
					switch (true)
					{
						case $( edit_link ).hasClass( "wxy-searchmark-sitesearch-edit-link-selected" ):
							$( edit_link ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );
							break;
					
						case !$( edit_link ).hasClass( "wxy-searchmark-sitesearch-edit-link-selected" ):
							$( edit_link ).addClass( "wxy-searchmark-sitesearch-edit-link-selected" );
							break;
					}
				
				} else if ( alt_key )
				{
					// close all dialogues and unselect all selected elements
					close_all_dialogues( "unselect-all-selected-items" );
				}
								
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				
				return false;
			}
		});
		
		
		// --------------------------------------------------------------------------
		// SITESEARCH FORM: user wants to reset search form back to original (default) values
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-reset-btn" ).on( "click", function( evt )
		{
			var form = $( this ).closest( "form" );
			
			search_tab( "reset-form", form );

		});
		
		// --------------------------------------------------------------------------
		// SITESEARCH FORM: user has changed a select or input field from its default value, add a highlight!
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-highlight-input" ).on( "change", function( evt )
		{
			// see if it matches any defaults... if it does, then turn OFF the highlight
			var self = this;
			var def = $( self ).data( "wxy-form-default" );
			var inde, val;

			$( self ).removeClass( "wxy-searchmark-sitesearch-searchbar-inactive-input" );
			$( self ).removeClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
					
			if( $( self ).is( "select" ) )
			{
				index = $( self ).find("option:selected").index();
			
				if( String( def ) != "undefined" && def != index )
				{
					$( self ).addClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
				} else {
					$( self ).addClass( "wxy-searchmark-sitesearch-searchbar-inactive-input" );
				}
				
			} else {
				
				val = $( self ).val();
				
				// check if this is a numbers only input and filter the value
				if( $( self ).hasClass( "wxy-input-numbers-only" ) )
				{
					val = Math.abs( to_float( val ) );
					
					if( isNaN( val ) )
					{
						val = def;
					}
					
					$( self ).val( val );
				}
				
				// must be text input
				if( String( def ) != "undefined" && def != val )
				{
					$( self ).addClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
				} else {
					$( self ).addClass( "wxy-searchmark-sitesearch-searchbar-inactive-input" );
				}
				
			}

		});
		
			
		// --------------------------------------------------------------------------
		// SITESEARCH: user wants to change the status of a post/page
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "change", ".wxy-searchmark-sitesearch-entry-status-select-menu", function( evt )
		{
			var self = this;
			var val = $( self ).val();
			var text = $( self ).find("option:selected").text();
			var okay, li;
			var post_items = $( WXY_BOOKMARKS_WIDGET ).find( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// if there are no items currently selected, default to the parent
			if( $( post_items ).length <= 0 )
			{
				li = $( self ).closest( "li" );
				
				post_items = $( li ).find( ".wxy-searchmark-sitesearch-edit-link" );

				$( post_items ).addClass( "wxy-searchmark-sitesearch-edit-link-selected" );
			}

			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			okay = confirm( "Make   [ " + $( post_items ).length + " ]   post items   [ " + text + " ] ?" );
			
			if( okay )
			{
				// go ahead and change their status!
				var post_data = {};
				post_data[ "post_ids" ] = [];
				
				$( post_items ).each( function()
				{
					var id = $( this ).data( "postid" ) || -1;
					
					post_data[ "post_ids" ].push( id );
				});
				
				// be sue to send the new status for these post
				post_data[ "post_status" ] = val;
				
				// now, set up our form data
				var data = {};
				data[ "bookmark_action" ] = "change-post-status";
					
				// make sure it is a json string
				data[ "html" ] = JSON.stringify( post_data );
				
				// replace the [private] with [public] values with new ones....
				$( post_items ).each( function()
				{	
					var self = this;
					var label = $( self ).find( ".wxy-searchmark-post-status-label" );
					var html = $( label ).html();
					
					// normalize our label
					text = String( text ).toLowerCase();
					
					// create an html span to use for our new label
					switch (true)
					{
						case text == "private":
							html = '<span class="wxy-searchmark-post-status-label"> [ ' + text + ' ] </span>';

							break;
							
						case text != "published" && String( text ).length > 0:
							html = '<span class="wxy-searchmark-post-status-label" style="color:#666;"> [ ' + text + ' ] </span>';

							break;
							
						default:
							// default is empty
							html = '<span class="wxy-searchmark-post-status-label"></span>';
					}
					
					// assign our new, updated label
					$( label ).html( html );

				});
	
				// SAVE our search cookie!
				search_tab( "save-search-cookie" );
	
				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );

			} else {
				
				// they hit cancel, so reset he menu back to its original value
				var selected = $( self ).data( "default-selected" ) || false;

				if( selected )
				{
					$( self ).val( selected );	
				}
			}

		});
		
		// --------------------------------------------------------------------------
		// SITESEARCH: add search results as searchmark
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-bookmark-btn", function( evt )
		{
			// close ALL settings dialogues!
			close_all_dialogues();
			
			// get all search entries with our selected class
			var entries = $( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// there are no highlighted entries, use the currently clicked on entry
			if( $( entries ).length <= 0 )
			{
				// get the parent of this history entry....
				entries = $( this ).closest( ".wxy-searchmark-sitesearch-entry" ).find( ".wxy-searchmark-sitesearch-edit-link" );
			}
			
			// now move them to the groups folder
			search_tab( "move-to-groups", entries );

			// prevent the event from opening the entry itself
			return false;

		});
		
		
		
		// --------------------------------------------------------------------------
		// SITESEARCH: select/unselect sitesearch entries for group actions
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-select-btn", function( evt )
		{	
			var li = $( this ).closest( "li" );
			var edit_link = $( li ).find( ".wxy-searchmark-sitesearch-edit-link" );
			var has_class = $( edit_link ).hasClass( "wxy-searchmark-sitesearch-edit-link-selected" );
			var all_links = $( WXY_BOOKMARKS_WIDGET ).find( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// be sure to close any open dialogues!
			close_all_dialogues();
				
			// get our modifier key to see if the user really wants to select ALL posts/pages or deselect ALL
			if( has_class )
			{
				$( edit_link ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );	
			} else {
				$( edit_link ).addClass( "wxy-searchmark-sitesearch-edit-link-selected" );
			}

		});
		
		
		// --------------------------------------------------------------------------
		// SITESEARCH: send sitesearch pages and posts to the trash (not delete permanently)
		// --------------------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab-links" ).on( "click", ".wxy-searchmark-sitesearch-trash-btn", function( evt )
		{
			// stop our bubbling of this event
			evt.stopImmediatePropagation();
			evt.stopPropagation();
			evt.preventDefault();
			
			var widget = $( this ).closest( WXY_BOOKMARKS_WIDGET );
			var trash_items = $( widget ).find( ".wxy-searchmark-sitesearch-edit-link-selected" );
			
			// if there are no items currently selected when clicking the trash button, default to the parent of this trash button!
			if( $( trash_items ).length <= 0 )
			{
				var li = $( this ).closest( "li" );
				trash_items = $( li ).find( ".wxy-searchmark-sitesearch-edit-link" );

				$( trash_items ).addClass( "wxy-searchmark-sitesearch-edit-link-selected" );
			}		
			
			// this prevents the window from reloading our saved cookies when it gets focus back
			SESSION_DATA[ "alert_triggered" ] = true;
			
			var okay = confirm( "Move [ " + $( trash_items ).length + " ] items to the trash?" );

			if( okay )
			{
				// go ahead and move these posts/pages to the trash
				var post_id_r = [];
				SESSION_DATA[ "edit_urls" ] = [];
				
				$( trash_items ).each( function()
				{
					var self = this;
					var id = $( self ).data( "postid" ) || -1;
					var url = $( self ).attr( "href" );
		
					post_id_r.push( id );
					
					// be sure to collect all of our edit links to flag any current searchmark that are affected by removing these pages
					SESSION_DATA[ "edit_urls" ].push(  url );
				
				});
				
				// now, set up our form data
				var data = {};
				data[ "bookmark_action" ] = "move-posts-to-trash";
					
				// make sure it is a json string
				data[ "html" ] = JSON.stringify( post_id_r );
	
				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );
				
			}

		});
		
		// -------------------------------------------------------------------------- 
		// KEYBOARD SHORTCUTS: user wants to select all items in a container!
		// -------------------------------------------------------------------------- 
		$( window ).on( "keydown", function( evt )
		{
			var open_dialogues = close_all_dialogues( "open-dialogue-count" );
			
			if( $( "#wxy-searchmark-search-results-title" ).is(":visible") && open_dialogues == 1 )
			{
				open_dialogues = 0;
			}

			if( open_dialogues == 0 )
			{
			
				// SHIFT + COMMAND + A to select all... again to unselect all
				if( $( ".wxy-searchmark-widget-inner-wrapper" ).position().left < 0 && ( evt[ "keyCode" ] == 65 && evt[ "shiftKey" ] === true && evt[ WXY_META_KEY ] === true ) )
				{
					
					groups_entry( "select-all-shortcut" );
					
					evt.stopImmediatePropagation();
					evt.stopPropagation();
					evt.preventDefault();
					return false;
				}
			}
			
		});
		
		
		// -------------------------------------------------------------------------- 
		// Make sure all of our dialogues are closed at startup and all selections are OFF!
		// -------------------------------------------------------------------------- 
		close_all_dialogues( "unselect-all-selected-items" );

	};
 
 	// ****************************************************************************************************************************************
	// ****************************************************************************************************************************************
	// ****************************************************************************************************************************************
	// FUNCTION DEFS BELOW
	// ****************************************************************************************************************************************
	// ****************************************************************************************************************************************
	// ****************************************************************************************************************************************	
	
	// ************************************************************************
	// WIDGET: open and close the main widget in WP admin panel
	// ************************************************************************
	function open_close_widget()
	{
		var left = $( ".wxy-searchmark-widget-inner-wrapper" ).position().left;
		var widget_width = $( WXY_BOOKMARKS_WIDGET ).width();
		var win_width = $( window ).width();
		var padding = 20;
		var focus_triggered = $( window ).data( "wxy-tools-focus-event-triggered" ) || false;

		// be sure to close all open dialogues
		close_all_dialogues();
			
		// if the screen width is less than 700 make the padding 0
		if( $(window).width() < 700 )
		{
			padding = 0;
		}
			
		var left_shift = ( widget_width + padding ) * -1;
			
		if( left >= win_width || left == 0 )
		{
			// searchmark are HIDDEN: show them!

			// be sure our tabs holder is the correct height as well (in case they have resized the screen)
			snap_bookmark_tab_heights();
				
			$( ".wxy-searchmark-widget-inner-wrapper" ).stop().animate({"left":left_shift}, WXY_PANEL_ANIMATION_SPEED );

		} else {
				
			// searchmark are VISIBLE: hide them!
			$( ".wxy-searchmark-widget-inner-wrapper" ).stop().animate({"left":0}, WXY_PANEL_ANIMATION_SPEED );
		}

		// make sure any selections are unselected		
		clear_selections();
	};
	
	// ************************************************************************
	// ON SCROLL EVENT HANDLER: saves scroll positions when needed and turns off/on SCROLL event listener
	// ************************************************************************
	function scroll_event_handler( action )
	{
		var action = action || "scroll_listener_on";

		switch (true)
		{
			case action == "scroll_listener_on":
			 
				$( ".wxy-searchmark-groups-tab-entries, .wxy-searchmark-history-tab-entries, .wxy-searchmark-sitesearch-tab-links" ).on( "scroll", function()
				{
					scroll_event_handler( "scroll_timeout" );
				});
				
				break;
				
			case action == "scroll_listener_off":
			
				// turn OFF our scroll listener to prevent overwriting older data
				$( ".wxy-searchmark-groups-tab-entries, .wxy-searchmark-history-tab-entries, .wxy-searchmark-sitesearch-tab-links" ).off( "scroll" );
			
				break;
				
			case action == "scroll_timeout":
			
				// ONLY save our  scroll event if enough time passes
				clearTimeout( SCROLL_TIMEOUT );
			
					SCROLL_TIMEOUT = setTimeout( function() {
						groups_entry( "save-settings" );
					}, 300);
					
					break;
					
					
			default:
				// do nothing by default for now
					
		}
	};
		
		
	// ************************************************************************
	// SEARCHBAR: filter our entries's visibility based on keywords
	// ************************************************************************
	function bookmarks_searchbar( action, elements )
	{
		var action = action || "search";
		var entries = entries || {};
		var menu = $( "#wxy-searchmark-bookmarks-search-results" );
		var search_in = $( "#wxy-searchmark-bookmarks-search" ).val() || "all";
		var raw_keywords = $( "#wxy-bookmarks-tab-searchbar-input" ).val() || "";
		var regExp, keywords_str, next_str, val, results, result_set, keywords, search_parents, elements, temp, entries, bookmarks_wrapper, epoch, placeholder;

		// -------------------------------------------------------------------
		// determine which action to take
		// -------------------------------------------------------------------
		switch (true)
		{
			case action == "hide-clone-items" || action == "hide-original-items" || action == "show-clone-items" || action == "show-original-items":
			
				// go through our move items and hide their counterparts				
				$( elements ).each( function()
				{
					var self = this;
					var id = $( self ).data( "wxy-bookmarks-search-result-id" );
					var original = "#wxy-search-result-original-" + id;
					var clone =  "#wxy-search-result-clone-" + id;

					switch (true)
					{
						case action == "hide-clone-items":
							// HIDE our clone
							if( $( clone ).css( "display" ) == "block" )
							{
								$( clone ).hide();
							}
							break;
							
						case action == "hide-original-items":
							// HIDE our original
							if( $( original ).css( "display" ) == "block" )
							{
								$( original ).hide();
								
								// now, append a placeholder where this item is located....
								placeholder = $( ".wxy-searchmark-search-placeholder-blank" ).clone();
								$( placeholder ).addClass( "wxy-searchmark-search-placeholder" );
								$( placeholder ).removeClass( "wxy-searchmark-search-placeholder-blank" );
								
								var text = $( original ).find( ".wxy-searchmark-entry-link" ).text() || $( original ).find( ".wxy-searchmark-search-button-label" ).text();
								
								// create a unique id, assoiciated with the original
								id = $( original ).data( "wxy-bookmarks-search-result-id" );
								id =  "wxy-search-result-placeholder-" + id;
								$( placeholder ).attr({ "id":id });
								
								$( placeholder ).html( text );
								$( placeholder ).show();

								$( placeholder ).insertBefore( $( original ) );
							}

							break;
							
						case action == "show-clone-items":
							// SHOW our clone
							if( $( clone ).css( "display" ) != "block" )
							{
								$( clone ).show();
							}
							break;
							
						case action == "show-original-items":
							// SHOW our original						
							if( $( original ).css( "display" ) != "block" )
							{
								$( original ).show();

								// create a unique id, assoiciated with the original
								id = $( original ).data( "wxy-bookmarks-search-result-id" );
								id =  "#wxy-search-result-placeholder-" + id;
								placeholder = $( id );
								
								$( placeholder ).remove();
							}
							break;
							
					}
				});
				
				break;
						
			case action == "remove-original-items":

				// we have to sift through ALL elements and their children, WITHOUT moving them!
				$( elements ).each( function()
				{
					var id = $( this ).data( "wxy-bookmarks-search-result-id" );
					var original = "#wxy-search-result-original-" + id;
					var clone =  "#wxy-search-result-clone-" + id;
					var placeholder = "#wxy-search-result-placeholder-" + id;
					
					// go through any children this item might have
					$( self ).find( ".wxy-searchmark-content-item" ).each( function()
					{
						var child_id = $( this ).data( "wxy-bookmarks-search-result-id" );
						var child_original = "#wxy-search-result-original-" + id;
						var child_clone =  "#wxy-search-result-clone-" + id;
						var child_placeholder = "#wxy-search-result-placeholder-" + id;
						
						// remove the clone class!
						$( child_clone ).removeClass( "wxy-searchmark-search-result-entry-clone" ); 
					
						// also reset the id and data!
						$( child_clone ).data({ "wxy-bookmarks-search-result-id":"" });
					
						//also remove its ID
						//$( child_clone ).removeAttr( "id" );
						$( child_clone ).attr({ "id":"" });
					
						// now remove the original
						$( child_original ).remove();
						
						// remove the placeholder
						$( child_placeholder ).remove(); 
					});
					
					// remove the clone class!
					$( clone ).removeClass( "wxy-searchmark-search-result-entry-clone" ); 
					
					// also reset the id and data!
					$( clone ).data({ "wxy-bookmarks-search-result-id":"" });
					
					//also remove its ID
					$( clone ).attr({ "id":"" });//.removeAttr( "id" );
					
					// now remove the original
					$( original ).remove();
					
					// remove the placeholder
					$( placeholder ).remove();
					
				});
				
				return;
				
			case action == "remove-clone-items":
	
				// we have to sift through ALL elements and their children, WITHOUT moving them!
				$( elements ).each( function()
				{
					var id = $( this ).data( "wxy-bookmarks-search-result-id" );
					var original = "#wxy-search-result-original-" + id;
					var clone =  "#wxy-search-result-clone-" + id;
					var placeholder = "#wxy-search-result-placeholder-" + id;

					// go through any children this item might have
					$( self ).find( ".wxy-searchmark-content-item" ).each( function()
					{
						var child_id = $( this ).data( "wxy-bookmarks-search-result-id" );
						var child_original = "#wxy-search-result-original-" + id;
						var child_clone =  "#wxy-search-result-clone-" + id;
						var child_placeholder = "#wxy-search-result-placeholder-" + id;
						
						// remove the clone class!
						$( child_original ).removeClass( "wxy-searchmark-search-result-entry-original" ); 
					
						// also reset the id and data!
						$( child_original ).data({ "wxy-bookmarks-search-result-id":"" });
					
						//also remove its ID
						$( child_original ).attr({ "id":"" });//.removeAttr( "id" );
					
						// now remove the original
						$( child_clone ).remove();
						
						// remove the placeholder
						$( child_placeholder ).remove();	
					});
					
					// remove the clone class!
					$( original ).removeClass( "wxy-searchmark-search-result-entry-original" ); 
					
					// also reset the id and data!
					$( original ).data({ "wxy-bookmarks-search-result-id":"" });
					
					//also remove its ID
					$( original ).attr({ "id":"" });//.removeAttr( "id" );
					
					// now remove the clone
					$( clone ).remove();
					
					// remove the placeholder
					$( placeholder ).remove();
					
				});
				
				return;
			
			case action == "clear-search-results":
			
				// clear any search results and close the window...
				$( "#wxy-bookmarks-search-results-wrapper" ).empty();
				$( "#wxy-searchmark-bookmarks-search-results" ).hide();
				
				// show our original items
				original = $( ".wxy-searchmark-search-result-entry-original" );
				bookmarks_searchbar( "show-original-items", original );
				
				// now, get ALL of our content items and remove their search settings data
				elements = $( ".wxy-searchmark-content-item" );
				bookmarks_searchbar( "clear-result-settings", elements );

				// unselect all selected folders
				$( ".wxy-searchmark-group-inner-wrapper" ).removeClass( "wxy-searchmark-group-inner-wrapper-selected" );

				return;
				
				break;
			
			case action == "clear-result-settings":
	
				// if there are any past search results, be sure to clear them out... BOTH parent and CLONE settings!
				if( $( elements ).children() > 0 )
				{				
					// we have to sift through ALL elements and their children, WITHOUT moving them!
					$( elements ).each( function()
					{
						var self = this;

						// go through any children this item might have
						$( self ).find( ".wxy-searchmark-content-item" ).each( function()
						{
							var child = this;
						
							// remove our search data
							$( child ).attr({ "id":"" });//.removeAttr( "id" );
							$( child ).data({ "wxy-bookmarks-search-result-id":"" });
						
							$( child ).removeClass( "wxy-searchmark-search-result-entry-original" );
							$( child ).removeClass( "wxy-searchmark-search-result-entry-clone" );
						
						});
						
						// remove our search data
						$( self ).attr({ "id":"" });//.removeAttr( "id" );
						$( self ).data({ "wxy-bookmarks-search-result-id":"" });
							
						$( self ).removeClass( "wxy-searchmark-search-result-entry-original" );
						$( self ).removeClass( "wxy-searchmark-search-result-entry-clone" );
					
					});

				}
				
				return;
		
				break;
			
			case action == "bookmarks-search-new":
			
				// start a new search here.... clear out any previous results
				bookmarks_searchbar( "clear-search-results" );

				// get an epoch value to use as and id base
				epoch = get_epoch();
				

				// be sure to save our input and select element values before every new search
				groups_entry( "save-settings" );
					
				// make sure nothing is animating - this should interrupt it and complete it right away
				$( ".wxy-is-animating" ).stop(true,true);
				$( ".wxy-is-animating" ).removeClass( "wxy-is-animating" );
		
				// make sure we have keywords to search for
				if( String( raw_keywords ).length <= 0 || String( "keywords" ) == "undefined" )
				{
					SESSION_DATA[ "alert_triggered" ] = true;
					alert( "Please enter some keywords to search for in the bookmarks tab." );
			
					return;
				}

				// just in case, searches have already been performed, be sure to clear out the bookmarks tab's entries data...
				bookmarks_searchbar( "clear-search-results" );
		
				// -------------------------------------------------------------------
				// get all the children of our bookmarks tab wrapper
				// -------------------------------------------------------------------
				bookmarks_wrapper = $( WXY_BOOKMARKS_WIDGET ).find( "#wxy-searchmark-groups-inner-holder" );
				entries = $( bookmarks_wrapper ).find( ".wxy-searchmark-content-item" );
				
				// NORMALIZE OUR KEYWORDS... filter our any commas and periods
				raw_keywords = String( raw_keywords ).replace( /[\,|\.]/gi, " ");
		
				// replace any multiple spaces with single
				raw_keywords = String( raw_keywords ).replace( /\s{1,}/gi, " ");
		
				// make all lowercase
				keywords = String( raw_keywords ).toLowerCase();
		
				// now split our keywords into an array to search for
				keywords = String( keywords ).split( " " );

				// enumerate through all and build a result array of element to show!
				// (?=.*search)(?=.*1).*
				keywords_str = "";
				
				for(var i=0,j=keywords.length;i<j;i++)
				{
					// escape our keywords
					next_str = String( keywords[ i ] ).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
			
					// create our regexp rule as a string
					keywords_str += "(?=.*" + next_str + ")";
				}
				
				// add look-ahead dot assertion to find ALL
				keywords_str += ".*";

				// create a regular expression our of our keywords string
				regExp = new RegExp( keywords_str );
		
				// ----------------------------------------------------------------------------------
				// SEARCH BOOKMARKS: see if there are any bookmarks that match our search criteria
				// ----------------------------------------------------------------------------------
				results = $( entries ).filter( function()
				{
					var result = search_filter( this, regExp );
				
					if( result )
					{
		
						if( result[ "type" ] == "group" )
						{	
							// add a higlight to this folder
							$( this ).find( ".wxy-searchmark-group-inner-wrapper:first" ).addClass( "wxy-searchmark-group-inner-wrapper-selected" );
							
						} else {
					
							// only return the object found if it is NOT a folder!
							return result[ "result" ];
						}
						
					} else {

						return;
					}
				});


				// ------------------------------------------------------------------
				// EMPTY OUR RESULT WINDOW
				// ------------------------------------------------------------------
				$( "#wxy-bookmarks-search-results-wrapper" ).empty();
				
				
				// ----------------------------------------------------------------------------------
				// FOLDERS FOUND:
				// ----------------------------------------------------------------------------------
				var groups_found = $( ".wxy-searchmark-group-inner-wrapper-selected" ).length;
			
				if( groups_found > 0 )
				{
					var groups_found_msg = $( "#wxy-searchmark-search-folders-found-msg" ).clone( true,true) ;
					$( groups_found_msg ).html( "( " + groups_found + " )&nbsp;&nbsp;Folders Found and highlighted in red." );
					
					$( groups_found_msg ).appendTo( $( "#wxy-bookmarks-search-results-wrapper" ) );
				}
				
				// ----------------------------------------------------------------------------------
				// NOTHING FOUND: show message in results window
				// ----------------------------------------------------------------------------------
				var result_count = $( results ).length;
				
				if( $( results ).length <= 0 )
				{
					result_set = $( "#wxy-searchmark-no-result-msg" ).clone( true,true) ;
					$( result_set ).html( "No bookmarks or searches found for:<br />" + raw_keywords );
					
				} else {

					// -----------------------------------------------
					// WE FOUND SOME SEARCH RESULTS...
					// -----------------------------------------------
					
					// assign matching ID's (classes) based on two different roots
					var original = "wxy-search-result-original-";
					var clone =  "wxy-search-result-clone-";
					var count = 0;
					var temp, id;
					
					// now clone our results and change the id to clone id's...
					result_set = $( results ).clone( true,true );
					
					// this has to not only set up our result object, but any child element with the content item class
					$( results ).each( function()
					{
						count++;

						var self = this;
						var id = original + epoch + "-" + count;
						var id_data = epoch + "-" + count;
						
						// reassign id
						$( self ).attr({ "id":id });
						
						// save id count as data
						$( self ).data({ "wxy-bookmarks-search-result-id":id_data });
						
						// add parent class
						$( self ).addClass( "wxy-searchmark-search-result-entry-original" );
						
						// now go through any of its children
						$( self ).find( ".wxy-searchmark-content-item" ).each( function()
						{
							count++;
						
							var child = this;
							var id = original + epoch + "-" + count;
							var id_data = epoch + "-" + count;
							
							// reassign id
							$( child ).attr({ "id":id });
						
							// save id count as data
							$( child ).data({ "wxy-bookmarks-search-result-id":id_data });
						
							// add parent class
							$( child ).addClass( "wxy-searchmark-search-result-entry-original" );
							
						});
						
					});
					
					// now go through our clones and set them up
					count = 0;

					$( result_set ).each( function()
					{
						count++;
						
						var self = this;
						var id = clone + epoch + "-" + count;
						var id_data = epoch + "-" + count;
						
						// reassign id
						$( self ).attr({ "id":id });
						
						// save id count as data
						$( self ).data({ "wxy-bookmarks-search-result-id":id_data });
						
						// add clone class
						$( self ).addClass( "wxy-searchmark-search-result-entry-clone" );
					
						// now go through any of its children
						$( self ).find( ".wxy-searchmark-content-item" ).each( function()
						{
							count++;
						
							var child = this;
							var id = clone + epoch + "-" + count;
							var id_data = epoch + "-" + count;
						
							// reassign id
							$( child ).attr({ "id":id });
						
							// save id count as data
							$( child ).data({ "wxy-bookmarks-search-result-id":id_data });
						
							// add clone class
							$( child ).addClass( "wxy-searchmark-search-result-entry-clone" );

						});
						
					});
					
					// make sure all groups are closed....
				//	groups_entry( "close-groups",  result_set );
				
					// make sure no groups are selected
					groups_entry( "unselect-all-groups" );
				}
				
				// ------------------------------------------------------------------
				// RESULT COUNT TITLE
				// ------------------------------------------------------------------
				$( ".wxy-searchmark-search-result-count-label" ).html( "BOOKMARKS SEARCH RESULTS (" + result_count + ")" );	
				
				// ------------------------------------------------------------------
				// ADD RESULTS TO OUR RESULT WINDOW
				// ------------------------------------------------------------------
				$( result_set ).appendTo( $( "#wxy-bookmarks-search-results-wrapper" ) );
		
				// ------------------------------------------------------------------
				// DEACTIVATE OUR ORIGINALS!
				// ------------------------------------------------------------------
				bookmarks_searchbar( "hide-original-items", results );
	
				// ------------------------------------------------------------------
				// now show the results!
				// ------------------------------------------------------------------
				bookmarks_searchbar( "bookmarks-search-show-results" );
				
				break;
				
			case action == "bookmarks-search-show-results":

				// new earch results have been added, so show the window that holds them
				close_all_dialogues();
			
				if( !$( menu ).parent().is( "body" ) )
				{		
					$( menu ).appendTo( $( "body" ) );
				}
			
				// now show the menu....
				$( menu ).width( $( "#wxy-searchmark-groups-inner-holder" ).width() );
				$( menu ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
				$( menu ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 90 });//was 100, but this should keep the dialogue behind all others...
				$( menu ).fadeIn(100);
				
				break;
				
				
				default:
				
					// do nothing by default
		}

		return;

	};
	
	// ************************************************************************
	// BOOKMARKS SEARCH FUNCTION: use this to filter out elements in the bookmarks tab
	// ************************************************************************
	function search_filter( self, regExp )
	{
		var self = self;
		var haystack, regExp;
		var desc = "";
		var type = "";
		
		// determine where in each item to search based on their main class
		switch ( true )
		{
			case $( self ).hasClass( "wxy-searchmark-entry" ):
				// BOOKMARK
				desc += $( self ).find( ".wxy-searchmark-entry-link" ).html() || "";
				//edit_url = $( self ).find( ".wxy-searchmark-entry-link" ).attr( "href" ) || "";
				//view_url = $( self ).find( ".wxy-searchmark-post-permalink" ).html() || "";
				
				type = "bookmark";
					
				break;
										
			case $( self ).hasClass( "wxy-searchmark-search" ):
				// SEARCH FN
				desc += $( self ).find( ".wxy-searchmark-search-button-label" ).html() || "";
				//edit_url = "";
				//view_url = edit_url;
				
				type = "search";
							
				break;
				
			case $( self ).hasClass( "wxy-searchmark-group-wrapper" ):
				// GROUP (folder)
				desc += $( self ).find( ".wxy-searchmark-group-button-label" ).html() || "";

			//	edit_url = "";
			//	view_url = edit_url;
				type = "group";

				break;
	
		}
					
		// normalize our entries
		haystack = String( desc ).toLowerCase();			
					
		// search in the text title AND the url!
		if( regExp.test( haystack ) )
		{
			// If there is a match, return it, otherwise, ignore it!
			return { "result":self, "type":type };
		}
	};
	
	
	
	// ************************************************************************
	// INFINITE SCROLL: SITESEARCH TAB (SEARCH) - handle loading content above or below scrolling conten
	// ************************************************************************
	function infinite_scroll_handler( self )
	{	
		var self = self || {};
		var scroll_top = $( self ).scrollTop();
		var scrolltop_max = $( self )[0].scrollHeight - scroll_top;
		var page, page_input, use_page, max_pages, page_wrapper;

		// get our search form...
		var form = $( "#wxy-searchmark-search-tab-form" );
			
		// see if we should just ignore this action altogether (like after a form reset)
		var ignore = $( form ).data( "wxy-searchmark-ignore-submit" ) || false;

		// be sure to always reset this flag
		$( form ).data({ "wxy-searchmark-ignore-submit":"" });
		
		// now see if we should ignore it!
		if( ignore )
		{
			return;
		}

		switch (true)
		{
			case scroll_top <= 0:

				// if we set this input, it should override the page in the form
				use_page = $( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" );
				
				// get the next page number based on what is at the top of the list, not the input field			
				page = Math.abs( to_float( $( "#wxy-searchmark-sitesearch-tab-links" ).children( ":first" ).attr("id") ) );
				
				page -= 1;
				
				if( page <= 0 )
				{
					page = 1;
				
				} else {
				
					// GOING UP.... turn off our scroll listener, so we can load content without firing multiple load requests
					$( "#wxy-searchmark-sitesearch-tab-links" ).off( "scroll" );
				
					// only execute a search of they are not trying to load a page less than 1
					$( use_page ).val( page );
				
					// submit our form.... silently! then, re-establish the scroll event listener!
					search_tab( "search-pages-posts-silently" );

				}
			
				break;
					
			case scrolltop_max == $( self ).outerHeight():

				// GOING DOWN.... turn off our scroll listener, so we can load content without firing multiple load requests
				$( "#wxy-searchmark-sitesearch-tab-links" ).off( "scroll" );
				
				// if we set this input, it should override the page in the form
				use_page = $( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" );			
				
				// get the Next page number based on what is at the end of the list, not the input field
				page_wrapper = $( "#wxy-searchmark-sitesearch-tab-links" ).children( ":last" );
				
				page = Math.abs( to_float( $( page_wrapper ).attr("id") ) );
				
				page += 1;
				
				// make sure it is not more than our current max...
				max_pages = $( page_wrapper ).data( "max-pages" ) || 1;
				
				if( page > max_pages )
				{
					// DON'T search if we are trying to go past max pages!
					$( use_page ).val( max_pages );
					
					// add our scroll event listener back on the results window!
					search_tab( "activate-infinite-scrolling" );
					
				} else {
					
					$( use_page ).val( page );

					// submit our form.... silently! then, re-establish the scroll event listener!
					search_tab( "search-pages-posts-silently" );
				}

				break;
		}
			
	};
		
	
	// ************************************************************************
	// SEARCH TAB FUNCTIONS: set the colors of folders and groups
	// ************************************************************************
	function search_tab( action, element, data )
	{
		var action = action || "";
		var data = {};
		var inputs, form_data, vals, label, clone, wrapper, container, folder, tab;
		var form = $( "#wxy-searchmark-search-tab-form" );

		switch (true)
		{
			case action == "run-search-bookmark":

				// now assign our select menu and input values!		
				try {

					// get our raw, escaped string from the dom element
					var html = $( element ).text();
					html = String( html ).replace( /\\"/g, '"' );
					data = JSON.parse( html );
					
				} catch (e) {
					data = {};
					
					// set our flag to avoid refrshing the page's bookmark content
					SESSION_DATA[ "alert_triggered" ] = true;	
					
					alert( "WXY: Sorry, a search error occured. Please try again." );
				}

				// see if there is a use_page value and swap it out for the page value
				if( String( data[ "use_page" ] ) != "undefined" && String( data[ "use_page" ] ).length > 0 )
				{
					data[ "page" ] = data[ "use_page" ];
					data[ "use_page" ] = "";
				}

				// do nothing if there is no form data!
				if( data )
				{
					inputs = $( form ).find( "select, input" );

					// now add any values or select options sent from the server
					$( inputs ).each( function()
					{
						// see if this item has a corresponding property and assign its value
						var input = this;
						var id = $( input ).attr( "id" );
						var def = $( input ).data( "wxy-form-default" ) || false;
						var val;
						
						// we need to handle select menu options and input field values/labels
						switch (true)
						{
							case data[ id ] && ( $( input ).is( "input[type='text']") || $( input ).is( "input[type='hidden']") ):
					
								// this is a standard input field
								$( input ).val( data[ id ] );
								
								val = data[ id ];
								break;
					
							case data[ id ] && $( input ).is( "select" ):
					
								// this is a SELECT MENU
								$( input ).val( data[ id ] );

								// we have saved the index of the default, so get the option value with that index as our default
								def = $( input ).children().eq( def ).val();
								
								val = $( input ).val();
								break;
						}

						// if this is not the default value, assign a highlight
						if( def && def != val )
						{
							$( input ).addClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
						} else {
							$( input ).removeClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
						}
					
					});

				}
				
				// now run the search!
				$( form ).find( ".wxy-searchmark-sitesearch-tab-find-btn" ).trigger( "click" );
				
				break;
				
			case action == "reset-form":
		
				inputs = $( form ).find( "select, input" )
				
				// see if this is a non-persistent field value
				$( inputs ).each( function()
				{
					var input = this;
					var def = $( input ).data( "wxy-form-default" );
					
					String( def ) == "undefined" ? def = -1 : def;

					switch (true)
					{
						case $( input ).is("input[type='text']"):
					
							if( def != -1 )
							{
								$( input ).val( def );
								
							} else {
								$( input ).val( "" );
							}
							
							break;
							
						case def != -1 && $( input ).is("select"):

							// if it is a select, just choose the first option (as long as there is a default value)
							$( input ).find( "option" ).eq( def ).prop({ "selected":"selected" });

							break;
					}

					// be sure to remove any selected borders (highlights)
					$( input ).removeClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
					
				});
				
				// clear out our search results
				$( "#wxy-searchmark-sitesearch-tab-links" ).empty();
				
				// reset our scrolltop, but set our ignore event flag so it does not perform a search when the scrolltop value chages
				$( form ).data({ "wxy-searchmark-ignore-submit":true });
				$( "#wxy-searchmark-sitesearch-tab-links" ).scrollTop( 0 );
				
				// save our scrolltop position after reset to avoid seeting an erroenous value later
				groups_entry( "save-settings" );

				// save our cookie
				search_tab( "save-search-cookie" );

				// clear our animation ( just in case )
				$( ".wxy-searchmark-sitesearch-tab-links" ).removeClass( "wxy-searchmark-sitesearch-tab-links-timer" );

				break;
				
			case action == "initialize-sitesearch":

				// now assign our select menu and input values!
				data = SESSION_DATA[ "wp_sitesearch_data" ];
				
				inputs = $( form ).find( "select, input" );
				
				// now add any values or select options sent from the server
				$( inputs ).each( function()
				{
					// see if this item has a corresponding property and assign its value
					var input = this;
					var id = $( input ).attr( "id" );
					var def_val = $( input ).data( "wxy-form-default" ) || null;

					// we need to handle select menu options and input field values/labels
					switch (true)
					{
						case $( input ).is( "input[type='text']") || $( input ).is( "input[type='hidden']"):

							// this is a standard input field
							switch (true)
							{
								case String( data[ id ] ) == "undefined" && def_val != null:
								
									// no data and there is a default value						
									$( input ).val( def_val );
									
									break;

								case String( data[ id ] ) != "undefined":
								
									$( input ).attr({ "id": data[ id ][ "name" ] });
									$( input ).val( data[ id ][ "value" ] );
									
									break;
									
								default:
									// do nothing by default
							}
							
							break;
					
						case $( input ).is( "select" ):
 
							// this is a SELECT MENU
							if( data[ id ] )
							{
								$( input ).html( data[ id ] );
							}
										
							break;
					}
					
				});
				
				// see if there is stored cookie data
				search_tab( "load-search-cookie", form );
				
				// see if this is a non-persistent field value
				var form_inputs = $( form ).find( ".wxy-searchmark-reset-input" );			
				$( form_inputs ).each( function()
				{
					var input = this;
					var def = $( input ).data( "wxy-form-default" ) || false;
					
					if( def )
					{
						$( input ).val( def );
					} else {
						$( input ).val( "" );
					}
				});

				// see if we should show the advanced settings form or leave it hidden after page load
				if( $( ".wxy-searchmark-sitesearch-searchbar-selected-input" ).length > 0 )
				{
					var advanced = $( ".wxy-searchmark-sitesearch-searchbar-selected-input" ).not( ".wxy-searchmark-keywords-input" );
					
					if( $( advanced ).length > 0 )
					{
						//show our form!
						$( ".wxy-searchmark-advanced-search-wrapper" ).show();
					}
					
				}

				break;

			case action == "collect-search-data":
			
				// now, collect our form fields and place them in a data object for server-side use
	
				// collect our input fields and create a json object
				inputs = $( form ).find( "select, input" );
				
				form_data = {};
				
				$( inputs ).each( function()
				{
					var self = this;
					var val = $( self ).val();
					var title = $( self ).attr( "id" );
					
					form_data[ title ] = val;
				});

				// make sure it is a json string
				data[ "html" ] = JSON.stringify( form_data );
					
				return data;
			
				break;
			
			case action == "setup-search-form":
				
				// collect our input fields and create a json object
				inputs = $( form ).find( "select, input" );
				
				form_data = element;
				
				$( inputs ).each( function()
				{
					var self = this;
					var id = $( self ).attr( "id" );
					var val = form_data[ id ];
					var def = $( self ).data( "wxy-form-default" );
					
					// if it is a select get the value of the default index
					if( $( self ).is( "select" ) )
					{
						def = $( self ).eq( def ).val();
					}
					
					$( self ).val( val );
					
					// see if it has a default value and it they are different, highlight it!
					if( val != def )
					{
						$( self ).addClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
					}
					
					// make sure the field is not empty if it has a default and no current value...
					if( String( val ).length <= 0 && def != null )
					{
						$( self ).val( def );
						$( self ).removeClass( "wxy-searchmark-sitesearch-searchbar-selected-input" );
					}
					
				});

				break;
				
			case action == "save-search-cookie":
			
				// save our current search page's form settings!
				data[ "form-settings" ] = search_tab( "collect-search-data" ); 

				// save our current search form's results (if any)
				data[ "search-results" ] = $( "#wxy-searchmark-sitesearch-tab-links" ).html();
	
				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_SEARCH_COOKIE, data );
			
				break;
				
			case action == "load-search-cookie":
			
				// LOAD our current search page's form settings!
				data = cookie( "load", WXY_SEARCH_COOKIE );
				
				if( data )
				{
					// reset the form to match our saved data!
					vals  = JSON.parse( data[ "form-settings" ][ "html" ] );
					
					search_tab( "setup-search-form", vals );
					
					// now replace the contents of our search results with the cookie results
					// if there is html data, replace the contents of our search results container with it!
					if( data[ "search-results" ] && String( data[ "search-results" ] ).length > 0 )
					{
						// reset our scrolltop, but set our ignore event flag so it does not perform a search when the scrolltop value chages
						$( form ).data({ "wxy-searchmark-ignore-submit":true });
						
						$( "#wxy-searchmark-sitesearch-tab-links" ).html( data[ "search-results" ] );
					}
						
				} else {
					// do nothing by default
				}

				break;
				
			
			case action == "search-pages-posts" || action == "search-pages-posts-silently":
			
				// make sure our pages and other values stay in range
				if( $( form ).find( "#page" ).val() <= 0 )
				{
					$( form ).find( "#page" ).val( 1 );
				}
			
				if( $( form ).find( "#limit" ).val() <= WXY_BOOKMARKS_LIMIT_MINIMUM )
				{
					$( form ).find( "#limit" ).val( WXY_BOOKMARKS_LIMIT_MINIMUM );
					
					// this should force an update of the highlights
					$( form ).find( "#limit" ).trigger( "change" );
				}
				
				// get our form values and move then to our data object used for form submission
				data = search_tab( "collect-search-data", element );
				
				// make sure our action is set correctly
				if( action == "search-pages-posts-silently" )
				{
					data[ "bookmark_action" ] = "search-pages-posts-silently";
				
				} else {
					// now, collect our form fields and place them in a data object for server-side use
					data[ "bookmark_action" ] = "search-pages-posts";
					
					// be sure to clear this input value, or the search will use it instead of the page value
					$( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" ).val("");
				}
				
				// clear our animation ( just in case )
				$( ".wxy-searchmark-sitesearch-tab-links" ).addClass( "wxy-searchmark-sitesearch-tab-links-timer" );
				
				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side search!
				form_submit( data );

				// don't forget to save our latest search facets!
				search_tab( "save-search-cookie" );
				
				break;
				
			case action == "move-to-groups":

				// USER WANTS TO TURN ONE OR OR MORE ITEMS INTO BOOKMARKS! 

				// we want to add our searchmark to a new folder if there are more than one....
				if( $( element ).length > 1 )
				{
					// we have multiple items! wrap them in a new group!
					folder = $( ".wxy-searchmark-group-blank:first" ).clone( true,true);
						
					label = "WXY: ( " + $( element ).length + " ) search results";
					$( folder ).find( ".wxy-searchmark-group-button-label:first" ).html( label );
						
					// make sure our wrapper's class is changed from a blank to a wrapper and is visible
					$( folder ).addClass( "wxy-searchmark-group-wrapper");
					$( folder ).removeClass( "wxy-searchmark-group-blank");
					$( folder ).show();
						
					// now insert our new folder into the searchmark tab
					tab = $( ".wxy-searchmark-groups-inner-holder" );
					
					// clear our any contents
					wrapper = $( folder ).find( ".wxy-searchmark-entry-group-container" );
					$( wrapper ).html( "" );
					
					// add our new folder to the searchmark tab
					$( folder ).prependTo( $( tab ) );
					$( folder ).show();
					
					// now swap our folder for the wrapper where we need to add new items
					folder = wrapper;
					
				} else {
					
					folder = false;
				}
				
				// now add all of our new searchmark!
				$( element ).each( function()
				{
					// move to active folders tab
					var self = $( this );//.find( ".wxy-searchmark-sitesearch-edit-link" );
					var title = $( self ).text();
					var url = $( self ).attr( "href" );
					var target = $( self ).prop( "target" ) || "_self";

					var view_link = $( self ).closest( ".wxy-searchmark-sitesearch-entry" ).find( ".wxy-searchmark-sitesearch-view-btn" );
					var view_url = $( view_link ).find( "a" ).attr( "href" );			
			
					// now clone a blank BOOKMARK entry and switch the classes on it
					var bookmark = $( ".wxy-searchmark-entry-blank" ).clone( true, true);
					$( bookmark ).addClass( "wxy-searchmark-entry" );
					$( bookmark ).removeClass( "wxy-searchmark-entry-blank" );
			
					// now update the new bookmark with values from our search entry
					var a_link = $( bookmark ).find( ".wxy-searchmark-entry-link" );
					$( a_link ).html( title );
					$( a_link ).attr({ "href":url });
					$( a_link ).prop({ "target":target });
					
					// add our view URL
					$( bookmark ).find( ".wxy-searchmark-post-permalink" ).html( view_url );
			
					// assign a post id ONLY if it is not false
					var post_id = $( self ).data( "postid" ) || false;
					
					if( post_id )
					{
						$( bookmark ).find( ".wxy-searchmark-post-id" ).html( post_id );
					}
					
					// add it to the currently active folder (if any) or the main wrapper (if none)
					var active = $( ".wxy-searchmark-group-is-active" );
					var container = $( ".wxy-searchmark-groups-inner-holder" );

					if( $( active ).length > 0 )
					{
						container = $( active ).parent().find(".wxy-searchmark-entry-group-container");
					}
			
					// now add our new bookmark!
					if( folder )
					{
						// there are multiple items, so we will place them in a folder
						$( bookmark ).appendTo( $( folder ) );
						
					} else {
						// there is only one item, just place it out in the main area
						$( bookmark ).prependTo( $( container ) );
					}

					// now, fade it into our bookmark panel
					$( bookmark ).fadeIn(100);
			
					// and flash the groups tab...
					flash_item = $(".wxy-searchmark-groups-tab").find(".wxy-searchmark-tab-btn-holder");

				});
				
				// flash or new item
				flash_element( flash_item, 3, 150 );
					
				// let the site know there are unsaved changes
				changes_tracker( "changes-not-saved" );
				
				// be sure to deselect our selected items!
				$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );

				break;
				
				
			case action == "activate-infinite-scrolling":
			
				// adds a listener to make sure infinite scrolling is turned on for the search tab
				clearTimeout( INFINITE_SCROLL_TIMEOUT );
						
				INFINITE_SCROLL_TIMEOUT = setTimeout( function() {
	
					$( WXY_BOOKMARKS_WIDGET ).find( "#wxy-searchmark-sitesearch-tab-links" ).on( "scroll", function()
					{
						console.log( "infinite scroll activated: " + Math.random() * 100 );
						infinite_scroll_handler( this );
					});
					
				}, 300 );
				
				break;
				
				
			default:
				// do nothing by default
				
		}
		
	};

	// ************************************************************************
	// COLORIZE: set the colors of folders and groups
	// ************************************************************************
	function color_selected_items( settings )
	{
		// get all searchmark entries with our selected class, filter out the groups that might be selected
		var selected_items = $( ".wxy-searchmark-entry-group-container" ).find( ".wxy-searchmark-item-selected" );
		var count = $( selected_items ).length;
		
		// now enumerate through them all!
		$( selected_items ).each( function()
		{
			var entry = this;
			var a_link, title, url, target, post_id, base_class, text_color, base_color, wrapper, view_url;
			
			// first, get our base and text colors from the settings source (group or bookmark)
			switch (true)
			{
				case $( settings ).hasClass( "wxy-searchmark-entry-settings" ):
			
					// BOOKMARK
				
					// get the colors from the searchmark color selector
					text_color = $( ".wxy-searchmark-entry-text-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
					base_color = $( ".wxy-searchmark-entry-base-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
				
					break;
			
				case $( settings ).hasClass( "wxy-searchmark-group-settings" ):
					// get the colors from the groups color selector
					text_color = $( ".wxy-searchmark-group-text-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
					base_color = $( ".wxy-searchmark-group-base-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
					
					break;
					
				case $( settings ).hasClass( "wxy-searchmark-search-settings" ):
					// get the colors from the groups color selector
					text_color = $( ".wxy-searchmark-search-text-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
					base_color = $( ".wxy-searchmark-search-base-color-holder" ).find( ".wxy-searchmark-color-swatch-selected" ).attr("id");
					
					break;
					
			}
			
			// ----------------------------------------------------------------
			// two processes: 1 for searchmark and one for groups
			// ----------------------------------------------------------------
			switch (true)
			{
				case $( entry ).hasClass( "wxy-searchmark-entry" ):
				
					// do these ONLY if there is only ONE bookmark!
					if( count  == 1 )
					{
						a_link = $( entry ).find( ".wxy-searchmark-entry-link" );
		
						// set up our dialogue's values
						title = $( settings ).find( ".wxy-searchmark-entry-title-textarea" ).val();
						url = $( settings ).find( ".wxy-searchmark-entry-url-textarea" ).val();
						view_url = $( settings ).find( ".wxy-searchmark-entry-view-url-textarea" ).val();
						target = $( settings ).find( ".wxy-searchmark-entry-target-select" ).val();
						post_id = $( settings ).find( ".wxy-searchmark-entry-post-id-textarea" ).val();

						// assign a post id
						$( entry ).find( ".wxy-searchmark-post-id" ).html( post_id );
		
						// set our values in the actual bookmark entry
						$( a_link ).html( title );
						$( a_link ).attr({ "href": url });
						$( a_link ).prop({ "target": target });
						
						// assign our view url
						$( entry ).find( ".wxy-searchmark-post-permalink" ).html( view_url );
					}
					
					// Now, get our colors...
					base_class = $( ".wxy-searchmark-entry-blank" ).data( "base-class" ) || "wxy-searchmark-entry wxy-searchmark-is-moveable wxy-searchmark-drop-target";
			
					// reset the base class of our entry
					$( entry ).attr({ "class": base_class });
			
					// now assign our new color scheme!
					$( entry ).addClass( base_color );
					$( entry ).addClass( text_color );
					
					break;
					
				case $( entry ).hasClass( "wxy-searchmark-search" ):
				
					// do these ONLY if there is only ONE search!
					if( count  == 1 )
					{
						a_link = $( entry ).find( ".wxy-searchmark-search-button-label" );
		
						// set up our dialogue's values
						title = $( settings ).find( ".wxy-searchmark-search-title-textarea" ).val();
	
						// set our values in the actual search entry
						$( a_link ).html( title );
					}
					
					// Now, get our colors...
					base_class = $( ".wxy-searchmark-search-blank" ).data( "base-class" ) || "wxy-searchmark-search wxy-searchmark-is-moveable wxy-searchmark-drop-target";
			
					// reset the base class of our entry
					$( entry ).attr({ "class": base_class });
			
					// now assign our new color scheme!
					$( entry ).addClass( base_color );
					$( entry ).addClass( text_color );
								
					break;
					
				case $( entry ).hasClass( "wxy-searchmark-group-button" ) || $( entry ).hasClass( "wxy-searchmark-group-wrapper" ):
				
					// the inner wrapper is where we actually assign our color classes
					if( $( entry ).hasClass( "wxy-searchmark-group-button" ) )
					{
						wrapper = $( entry ).closest( ".wxy-searchmark-group-inner-wrapper" );

					} else {
						wrapper = $( entry ).find( ".wxy-searchmark-group-inner-wrapper" );
					}
					
					// do these ONLY if there is only ONE bookmark!
					if( count == 1 )
					{
						// set up our dialogue's values
						title = $( settings ).find( ".wxy-searchmark-group-title-textarea:first" ).val();
					
						// set our values in the actual bookmark group
						$( wrapper ).find( ".wxy-searchmark-group-button-label:first" ).html( title );
					}
				
					// get our colors...
					base_class = $( wrapper ).data( "base-class" ) || "wxy-searchmark-group-inner-wrapper";

					// reset the base class of our bookmark group
					$( wrapper ).attr({ "class": base_class });
			
					// now assign our new color scheme!
					$( wrapper ).addClass( base_color );
					$( wrapper ).addClass( text_color );
				
					break;
					
			}

		});

		// close all dialogues as well
		close_all_dialogues( "unselect-wxy-bookmark-items" );
			
		groups_entry( "save-cookie" );
		changes_tracker( "changes-not-saved" );
		
	};


	// ************************************************************************
	// AUTOSAVE: notify autosave that it is okay to save once everything is done animating
	// ************************************************************************
	function is_done_animating( element )
	{
		// remove our animated class
		$( element ).removeClass( "wxy-is-animating" );
		
		// we may want to do more later... that is why this is a function	
	}

	// ************************************************************************
	// GROUPS: turn highlights on or off on groups that are active
	// ************************************************************************
	function highlight_active_groups( group )
	{
		var group = group || {};
		var parents, first, last;
		var content = $( group ).find(".wxy-searchmark-group-content:first");
		var button = $( group ).find( ".wxy-searchmark-group-button:first" );
		
		// make sure no dom elements are selected
		clear_selections();
		
		// this is the FIRST active flag
		var flag = $( group ).find( ".wxy-searchmark-group-is-active-flag:first" );

		// ALL parents of this group (if any)
		parents = $( button ).parents( ".wxy-searchmark-group-wrapper" );
		
		// turn off ALL indicators
		$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
		$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );
		
		// if the group is already OPEN...
		if( $( button ).hasClass( "wxy-searchmark-group-content-button-open" ) )
		{
			// turn on the indicator for the currently opened group and its main parent group (if any)
			if( $( parents ).length >= 1 )
			{
				first = $( parents ).filter(":first").find( ".wxy-searchmark-group-is-active-flag:first" );
				$( first ).addClass( "wxy-searchmark-group-is-active" );
				
				last = $( parents ).filter(":last").find( ".wxy-searchmark-group-is-active-flag:first" );
				$( last ).addClass( "wxy-searchmark-group-is-active" );
					
				// add additional class to make it fade back more...
				$( last ).addClass( "wxy-searchmark-group-is-active-parent" );
				
			} else {

				// there is only one....
			//	$( flag ).addClass( "wxy-searchmark-group-is-active" );
			}

		} else {

			// the group is already CLOSED, so turn on the indicator for this group and its main parent group (if any)
			if( $( parents ).length >= 1 )
			{
				last = $( parents ).filter(":last").find( ".wxy-searchmark-group-is-active-flag:first" );
				$( last ).addClass( "wxy-searchmark-group-is-active" );
			}
		}

	};
	

	// ************************************************************************
	// ACTIVE USER: this is the user whose searchmark we should be loading on page reload...
	// ************************************************************************
	function active_user( action )
	{
		var action = action || "load";
		var data = {};
		var menu = $( ".wxy-searchmark-owners-select" );
		var val = $( menu ).val();
		
		switch (true)
		{
			case action == "save":
				
				// save our currently selected user!
				data[ "active" ] = val;
				
				// also save our current autosave status
				data[ "unsaved_changes" ] = _AUTOSAVE[ "unsaved_changes" ];

				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_ACTIVE_USER_COOKIE, data );
				
				break;

			case action == "load":
				// load our currently selected user!
				data = cookie( "load", WXY_ACTIVE_USER_COOKIE ) || {};

				// if there is a value in the cookie, then use it! Otherwise, use the one from wp-admin
				if( data[ "active" ] && _USERS[ "initial_login" ] != 1 )
				{
					// just use what is saved in cookie
					_USERS[ "searchmark_owner" ] = data[ "active" ];
				} else {

					// falll back to our actual, signed in user
					_USERS[ "searchmark_owner" ] = _USERS[ "active_user" ];
					
					// be sure to save after our switch...
					active_user( "save" ); 
				}

				// now get it back from the menu to make sure it worked
				$( menu ).val( _USERS[ "searchmark_owner" ] );
				
				// set this to pass back in our result
				data[ "active" ] = _USERS[ "searchmark_owner" ];
				
				// also load our current autosave status
				_AUTOSAVE[ "unsaved_changes" ] = data[ "unsaved_changes" ];
				
				// be sure and update the autosave button status
				changes_tracker( "unsaved-changes-check" );

				// now return a result
				return data;
				
				break;
				
			case action == "clear-cookie":

				// erase our active user cookie
				cookie( "clear", WXY_ACTIVE_USER_COOKIE );
				
				break;
				
		}
	};
	
	// ************************************************************************
	// DIALOGUE WINDOWS: make sure all of our settings dialogues are in-bounds!
	// ************************************************************************			
	function dialogue_snap( menus )
	{
		var menus = menus || $( ".wxy-searchmark-settings-dialogue" );
		
		$( menus ).each( function()
		{
			var self = this;
			var offset = $( self ).position();
			var top = offset.top;
			var left = offset.left;
			
			var win_width = $( window ).width();
			var win_height = $( window ).height();
			
			var menu_width = $( self ).width();
			var menu_height = $( self ).height();
			
			left < (menu_width * .9) * -1 ? left = 20 : left = left;
			left + 50 > win_width ? left = (win_width - (menu_width * .25) ) : left = left;
			
			top < 0 ? top = 20 : top = top;
			top + 65 > win_height ? top = win_height - 65 : top = top;
				
			$( self ).css({ "top":top, "left":left });

		});

	};
	

	// ************************************************************************
	// FORM SUBMISSION: SAVE/LOAD our searchmark to the server....
	// ************************************************************************			
	function form_submit( data )
	{
		var bookmark_action = data[ "bookmark_action" ] || "save-groups-to-server-silently";
		var html = data[ "html" ] || "";
		var blank_html = data[ "blank-html" ] || "";
		var formData, fileSelect, file, files, retries;
		
		// ---------------------------------------------------
		// wxy-searchmark-data-form
		// ---------------------------------------------------
		var form = $( ".wxy-searchmark-data-form" );

		// send the currently active user
		$( "#wxy-searchmark-user" ).val( _USERS[ "searchmark_owner" ] );
		
		// this holds any blank html we need
		$( "#wxy-searchmark-blank" ).val( blank_html );
		
		// add our data we want to save
		$( "#wxy-searchmark-data" ).val( html );

		// assign the WP ADMIN form action...
		$( form ).prop({"action":WXY_BOOKMARKS_FORM_PATH });
		
		// assign the MAIN form action...
		$( form ).find( "#wxy-searchmark-action" ).val( bookmark_action );
		
		// add our form nonce
		$( "#wxy-searchmark-nonce" ).val( SESSION_DATA[ "form_nonce" ] );
		
		// keep track of how many times we try an action
		retries = $( form ).find( "#wxy-searchmark-retries" ).val();
		
		if( String( retries ) == "undefined" )
		{
			retries = 0;
		}
		
		retries++;
		$( form ).find( "#wxy-searchmark-retries" ).val( retries );

		// ---------------------------------------------------
		// pass form variables in a json object
		// ---------------------------------------------------
		vars = {};
		
		// Create a new FormData object.
		formData = new FormData();
		
		// collect our key-value pairs to json encode
		$( form ).children().each( function()
		{
			var self = this;
			var id = $( self ).attr( "id" ) || false;
			var val = $( self ).val();
			
			if( id )
			{
				formData.append( id, val );
			}
		});
		
		// add our form action for WP
		formData[ 'action' ] = "wxy_searchmark_request";
		
		// ---------------------------------------------------
		// now get our files and add them to our data
		// ---------------------------------------------------
		fileSelect = $( "#wxy-searchmark-file" ).get(0) || null;
		files = fileSelect.files;
		
		// Loop through each of the selected files (if we have any)
		if( files.length > 0 )
		{
			for(var i=0,j=files.length;i<j;i++)
			{
				var file = files[i];
		
				// Check the file type: application/zip
				if (!file.type.match('zip.*'))
				{
					// this prevents the window from reloading our saved cookies when it gets focus back
					SESSION_DATA[ "alert_triggered" ] = true;
					
					alert("SORRY: you can only upload searchmark that are ZIP file.");
				
					return;
				}

				// Add the file to the request.
				formData.append('wxy-searchmark-file', file, file.name);
			}
		}

		// ---------------------------------------------------
		// quietly send our request in the background
		// ---------------------------------------------------
		jQuery.ajax({
 			"url": WXY_BOOKMARKS_FORM_PATH,
			"type":"POST",
			"action":"wxy_searchmark_request",
			"method":"POST",
			"data": formData,
			"processData": false,
			"contentType": false,

			"success": function( responseText, statusText, jqXHR, form )
				{
					// show our result
					// process the result from the server
					process_response_text( responseText );
				},
				
			"fail": function(){
				
				// this prevents the window from reloading our saved cookies when it gets focus back
				//SESSION_DATA[ "alert_triggered" ] = true;
					
				//alert("failed");
				
				},
			
			"error": function(xhr, textStatus, errorThrown) {

					var error_count = $( window ).data( "wxy-searchmark-ajax-errors" ) || 0;
				
					if( String( error_count ) == "undefined" )
					{
						error_count = 0;
					}
				
					error_count++;

					// see if the site was just brought back into focus...
					var focusing = $( window ).data( "wxy-tools-focus-event-triggered" ) || false;
				
					// count ajax errors... BUT also make sure the window has not been blurred and is coming back into focus
					if( error_count >= 3 && focusing === false )
					{
						// set our flag to avoid refreshing the page's bookmark content
						error_count = 89;
					}
										
					$( window ).data({ "wxy-searchmark-ajax-errors":error_count });
					
					if( error_count <= 3 )
					{
						// try this again!
						 $.ajax(this);
                		return;
					}
    			}
		});

	};
	
	
	// ************************************************************************
	// AJAX: process our server response here...
	// ************************************************************************
	function process_response_text( raw_response )
	{
		var parse_error = false, error_count = 0;

		// -------------------------------------------
		// parse our response object here and extract any other data sent from the server that is not part of our json result object
		// -------------------------------------------
		var response;
		var matches = String( raw_response ).match( /(\^\^\^\^JSON-START\^\^\^\^)(.*)*(\^\^\^\^JSON-END\^\^\^\^)/ );
		var console_msg = String( raw_response ).replace( /\^\^\^\^JSON-START\^\^\^\^(.*)*\^\^\^\^JSON-END\^\^\^\^/, "" );

		// DEBUGGING: if there is an error from WP, show it in the developer console
		if( String( console_msg ).length > 0 )
		{
			console.log( "CONSOLE MESSAGE: " );
			console.log( console_msg );
		}

		try {

			// try to parse the json result object
			response = JSON.parse( matches[2] );
			
			parse_error = false;
			
			// save an error count in our window object
			$( window ).data({ "wxy-searchmark-parse-errors":0 });
			
		} catch (e) {
			response = {};
			parse_error = true;
			error_count = $( window ).data( "wxy-searchmark-parse-errors" ) || 0;
			error_count++;
			
			// save an error count in our window object
			$( window ).data({ "wxy-searchmark-parse-errors":error_count });
		}
		
		// -------------------------------------------
		// see if the action was a success and read the server message
		// -------------------------------------------
		var this_page, use_page, sitesearch_links, this_id, affected, next_set, url, errors, search_parents, link_wrappers;
		var status = response[ "status" ] || "fail";
		var message = response[ "message" ] || "";
		
		// get the actual result object, this holds our data and settings!
		var data = response[ "data" ] || {};
		var result = data[ "result" ] || {};
		var html = result[ "data" ] || {};
		var vars = data[ "vars" ] || {};
		var action = vars[ "wxy-searchmark-action" ] || false;

		// see if there was an error, then show the server's message as the response to the user
		var msg = "";
		var update_save_btn = false;
		
		// ----------------------------------------------------
		// LOGGED IN?: make sure they are logged in...
		// ----------------------------------------------------
		if( _USERS[ "logged_in" ] != 1 )
		{
			// not logged in! throw an error
			status = "fail";
			retries = 4;
			message = "";//You need to be signed in to use this utility. Please sign in to the Wordpress Admin area to continue.";
			
			// be sure to close anything that might be open
			close_all_dialogues();
			
			// now make sure our menu is closed
			$( ".wxy-searchmark-widget-inner-wrapper" ).css({ "left":0 });
		}
		
		// ----------------------------------------------------
		// see how to handle our results!
		// ----------------------------------------------------
		if( status == "fail" || parse_error )
		{
			// keep track of our retries
			var retries = vars[ "wxy-searchmark-retries" ];
			
			if( retries > 3 )
			{
				// silently turn off autosave...
				if( _AUTOSAVE[ "on" ] == 1 )
				{
					changes_tracker( "force-autosave-off-silently" );
				}
				
				// if there is a message, show it, or show an alternate message
				if( String( message ).length > 0 )
				{
					// there was an error, show the server's message as the response to the user
					SESSION_DATA[ "alert_triggered" ] = true;
					
					alert( message );
					
				} else {

					// does this window have focus? False = it has focus and has not just been focused
					if( $( window ).data( "wxy-tools-focus-event-triggered" ) == false )
					{ 
						// let the user know there was a problem loading bookmark data from the site
						$( ".wxy-searchmark-force-refresh-btn" ).html( "Failed to load bookmarks.<br />Click to try loading again<br />or simply reload the page." );
						
					}
				}

			} else {

				// show our error for now
				if( String( message ).length > 0 )
				{
					SESSION_DATA[ "alert_triggered" ] = true;
					alert("WXY Bookmarks Message: " + message );
				}
				
				// this lets the system know to stop trying to load our data...
				_USERS[ "logged_in" ] = false;
	
			}

		} else {
			
			// reset ALL retries counter
			$( "#wxy-searchmark-retries" ).each( function(){
				$( this ).val( 0 );
			});
			
			// now see how to handle our requests and whether or not they should be silent!
			switch (true)
			{
				case action == "search-pages-posts-silently":
					
					// user has performed a silent search on the sitesearch (search) tab
					
					// clear our animation ( just in case )
					$( ".wxy-searchmark-sitesearch-tab-links" ).removeClass( "wxy-searchmark-sitesearch-tab-links-timer" );
				
					// see if there is an error message and do not add to the results, if there are no results to add!
					if( String( result ).indexOf( "0 results found" ) > -1 )
					{
						// we got no results, so ignore this result!
						return;
					}

					// get the page number from our use_page field, since this could differ from the page they started searching at
					page = to_float( $( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" ).val() );
					 
					// be sure to clear this input value, or the search will use it instead of the page value
					$( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" ).val("");
					
					( $( "#wxy-searchmark-search-tab-form" ).find( "#page" ).val() );
					sitesearch_links = $( WXY_BOOKMARKS_WIDGET ).find( "#wxy-searchmark-sitesearch-tab-links" );
					
					// get the page number of the first child so we can see if this is an up or down scroll
					var first_page = Math.abs( to_float( $( sitesearch_links ).find(":first").attr("id") ) );
					
					// see if this page has already been loaded
					this_id = "wxy-searchmark-search-page-" + page;
					var old_page = $( sitesearch_links ).find( "#" + this_id );
					
					if( $( old_page ).length > 0 )
					{
						// replace an existing page
						$( old_page ).remove();
					}
					
					// parse our html and add it to the container
					result = parseHTML( result );
					$( result ).attr({ "id": this_id });
					$( result ).prependTo( $( sitesearch_links ) );
					
					// add our search forms facets to the page's header bar
					$( result ).find( ".wxy-searchmark-sitesearch-pagebar-bookmark-btn" ).html( vars[ "wxy-searchmark-data" ] );

					// collect all result pages
					link_wrappers = $( sitesearch_links ).find( ".wxy-searchmark-sitesearch-section-wrapper" );
					
					// sort all of our search result wrapper elements by ID (not the actual search results!)
					if( $( link_wrappers ).length > 0 )
					{
						// sort all search page results by id...
						link_wrappers.sort( function(a,b)
						{
							// they are the same (0) as default
							var flag = 0;
							var a_val = Math.abs( to_float( $( a ).attr( "id" ) ) );
							var b_val = Math.abs( to_float( $( b ).attr( "id" ) ) );

							if( a_val > b_val )
							{
								flag = 1;
							}
			
							if( a_val < b_val )
							{
								flag = -1;
							}
			
							return flag;
						});
					}
					
					// put the sorted results back....
					$( link_wrappers ).appendTo( $( sitesearch_links ) );
					
					// make sure scroll top spring down a bit, but only if they added to the bottom of the list
					if( page > first_page )
					{
						$( sitesearch_links ).animate( { "scrollTop": $( sitesearch_links ).scrollTop() + 100 }, 300 );
					}
					
					// don't forget to save our latest search results!
					search_tab( "save-search-cookie" );
					
					// add our scroll event listener back on the results window!
					search_tab( "activate-infinite-scrolling" );
					
					break;
					
				case action == "search-pages-posts":
				
					// clear our animation ( just in case )
					$( ".wxy-searchmark-sitesearch-tab-links" ).removeClass( "wxy-searchmark-sitesearch-tab-links-timer" );
				
					// be sure to clear this input value, or the search will use it instead of the page value
					$( "#wxy-searchmark-search-tab-form" ).find( "#searchmark_form_use_page" ).val("");
					
					// get the page we just loaded and the last page number before that....
					page = parseInt( $( "#wxy-searchmark-search-tab-form" ).find( "#page" ).val() ) || 1;
					sitesearch_links = $( WXY_BOOKMARKS_WIDGET ).find( "#wxy-searchmark-sitesearch-tab-links" );
					
					// USER HAS INITIATED A new SEARCH BY CLICKING THE SEARCH BUTTON!
					this_id = "#wxy-searchmark-search-page-" + page;
					
					// parse our html
					result = parseHTML( result );

					// give it a new id based on its page number
					$( result ).attr({ "id": this_id });
					
					// clear out its parent
					$( sitesearch_links ).empty();
					
					// now add it to the container
					$( result ).appendTo( $( sitesearch_links ) );

					// make sure it is visible and assigned an ID
					$( result ).show();
					$( result ).data({ "wxy-searchmark-page-num": page });

					// add our search forms facets to the page's header bar
					$( result ).find( ".wxy-searchmark-sitesearch-pagebar-bookmark-btn" ).html( vars[ "wxy-searchmark-data" ] );
					
					// if it is a new search, reset the scrolltop value!
					$( sitesearch_links ).scrollTop( 0 );
					
					// be sure to save our cookie!
					search_tab( "save-search-cookie" );

					break;
				
				
				case action == "load-groups-from-server" || action == "load-groups-from-server-silently":
				
					// HIDE our pointer events mask!
					$( ".wxy-searchmark-loading-mask" ).hide();
		
					// it could be either a message, error code, or a JSON object with groups, searchmark, and dialogue info!
					$( ".wxy-searchmark-groups-inner-holder" ).html( html );
			
					// this was a loading or saving event, be sure to update the save button status and save a cookie
					update_save_btn = true;
					
					// snap the height of our tabs
					snap_bookmark_tab_heights();
					
					if( action == "load-groups-from-server")
					{
						// just in case, searches have already been performed, be sure to clear out the bookmarks tab's entries data...
						search_parents = $( "#wxy-bookmarks-search-results-wrapper" ).find( ".wxy-searchmark-search-result-entry-original" );
						bookmarks_searchbar( "clear-result-settings", search_parents );
		
						// flash this element to show something was completed
						flash_element( $( ".wxy-searchmark-groups-tab-btn-holder" ), 3, 100 );
					}
					
					// now restore any saved settings
					groups_entry( "load-settings" );
					
					break;
					
				case action == "save-groups-to-server" || action == "save-groups-to-server-silently":
	
					// this was a loading or saving event, be sure to update the save button status and save a cookie
					update_save_btn = true;
					
					// flash this element to show something was completed
					flash_element( $( ".wxy-searchmark-groups-tab-btn-holder" ), 1, 100);
					flash_element( $( ".wxy-searchmark-save-btn" ), 1, 100);
					
					// now save any general settings
					groups_entry( "save-settings" );
					
					groups_entry( "save-cookie" );
					
					break;
					
					
				case action == "clear-groups-from-server":
				
					// this was a loading or saving event, be sure to update the save button status and save a cookie
					update_save_btn = true;
					
					// snap the height of our tabs
					snap_bookmark_tab_heights();
					
					groups_entry( "save-cookie" );
					
					break;
					
					
				case action == "update-groups-options-on-server":
				
					groups_entry( "save-cookie" );
					
					break;
					
				case action == "move-posts-to-trash":
				
					// search through our existing bookmarks for matching edit urls and flag them as affected!
					errors = 0;

					for(var i=0,j=SESSION_DATA[ "edit_urls" ].length;i<j;i++)
					{
						url = SESSION_DATA[ "edit_urls" ][ i ];
						
						next_set = $( ".wxy-searchmark-entry-link[href='" + url + "']" );
						
						if( $( next_set ).length > 0 )
						{
							errors += 1;
							
							// turn on our red warning icon
							$( next_set ).closest( ".wxy-searchmark-entry" ).addClass( "wxy-searchmark-broken-link-icon" );
					
							affected = $( affected ).add( next_set );
						}
					}
				
					// check to see if there were errors, if there were, alert them to save and keep them on this page....
					okay = false;
					
					if( errors > 0 )
					{
						// this prevents the window from reloading our saved cookies when it gets focus back
						SESSION_DATA[ "alert_triggered" ] = true;
				
						okay = confirm( "Bookmarks affected by moving items to the trash have been marked with a red indicator. Click cancel to stay on this page so you can save your searchmark, or OKAY to refresh and continue without saving." );
						
						// override our server message for now
						msg = "";
					}

					// FIND ALL SELECTED SEARCH ITEMS AND FADE THEM BAC OR REMOVE THEM??????
					selected = $( ".wxy-searchmark-sitesearch-edit-link-selected" ).closest( ".wxy-searchmark-sitesearch-entry" );
					$( selected ).slideUp(300, function(){ $( this ).remove(); });
					
					posts = posts.join( "|" );
					posts = "|" + posts + "|";
						
					if( okay )
					{
						// now, see if we need to stay on this page with a refresh or go the main admin page
						var posts = vars[ "wxy-searchmark-data" ] || "[]";

						try {
							posts = JSON.parse( posts );
						} catch (e) {
							posts = [];	
						}
					
						// see if our post is in this array
						if( String( posts ).indexOf( "|" + String( SESSION_DATA[ "post_id" ] ) + "|" ) > -1 )
						{
							// they are on a page they just moved to the trash, so go the main admin panel
							window.location = "/wp-dev/wp-admin/";					
						} else {
							// they are fine, they deleted other pages, not the one they are currently on
							TIMEOUT = setTimeout( function(){
								window.location = window.location;
							}, 300 );
						}
					} else {
						// they clicked CANCEL
						
					}

					break;
					
				
				case action == "change-post-status":

					msg = "Status change request successful.";
					break;
					
				case action == "download-groups-from-server":
									
					// now, silently download the actual file!
					
					// put html (the url to use) into our form for resubmission!
					$( "#wxy-searchmark-data" ).val( result[ "result" ] );
				
					// now request the actual download!
					groups_entry( "download-zip-from-server" );
					
					break;
					
					
				case action == "upload-groups-to-server":
				
					msg = message;

					// the html that comes back should be the combined HTML searchmark that are now inthe database
					$( ".wxy-searchmark-groups-inner-holder" ).html( html );
			
					// this was a loading or saving event, be sure to update the save button status and save a cookie
					update_save_btn = true;
					
					// snap the height of our tabs
					snap_bookmark_tab_heights();

					break;
					
				
				default:
					// do nothing by default
					

			}// close switch


			// after loading and resetting the save button, be sure to save the new data in our current cookie!
			if( update_save_btn )
			{
				changes_tracker( "changes-saved" );
			}
			
			// close ALL dialogues....
			close_all_dialogues();
					
			// see if we have a message to display!
			if( String( msg ).length > 0 )
			{
				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
					
				alert( msg );
			}
			
		}// close else
		
	};
	
	// ************************************************************************
	// CHANGES: track whether there are server-side unsaved changes or if we are up to date
	// ************************************************************************			
	function changes_tracker( action )
	{
		// handle turning the svae button on or off, depending on the state of our server-side unsaved changes
		var action = action || "changes-not-saved";
		var saved_label = $( ".wxy-searchmark-save-btn" ).data("saved-label") || "Changes Saved...";
		var unsaved_label = $( ".wxy-searchmark-save-btn" ).data("unsaved-label") || "Save Changes Now";
		var old_val, server_save;
		var data = {};
		
		// see what action to perform
		switch (true)
		{
			case action == "unsaved-changes-check":
				
				if( String( _AUTOSAVE[ "unsaved_changes" ] ) == "1" || String( _AUTOSAVE[ "unsaved_changes" ] ) == "true" )
				{
					// we have unsaved changes!
					changes_tracker( "changes-not-saved" );
	
				} else {
					// all changes are saved
					changes_tracker( "changes-saved" );
				}
				
				break;
			

			case action == "changes-not-saved":

				// an action has occured that will require saving to make permanent!

				// reset our autosave timer
				clearTimeout( _AUTOSAVE["timer"] );
		
				// turn our save button ON
				$( ".wxy-searchmark-save-btn" ).removeClass( "wxy-searchmark-save-btn-disabled" );
				$( ".wxy-searchmark-save-btn" ).html( unsaved_label );
				
				_AUTOSAVE[ "unsaved_changes" ] = true;
				
				// only start our timer if autosave is turned on!
				if( _AUTOSAVE["on"] == 1 )
				{
					// reset our timer delay...
					_AUTOSAVE["timer"] = setTimeout( function(){ changes_tracker( "check-if-okay-to-save" ) }, _AUTOSAVE["interval"] );
				}
				
				// be sure to save our status in a cookie
				active_user( "save" );
				
				break;
				
			case action == "changes-saved":
				// changes have been SAVED
				
				// reset our autosave timer
				clearTimeout( _AUTOSAVE["timer"] );

				// turn our save button OFF
				if( !$( ".wxy-searchmark-save-btn" ).hasClass( "wxy-searchmark-save-btn-disabled" ) )
				{
					$( ".wxy-searchmark-save-btn" ).addClass( "wxy-searchmark-save-btn-disabled" );
				}
				
				$( ".wxy-searchmark-save-btn" ).html( saved_label );
				
				_AUTOSAVE[ "unsaved_changes" ] = false;
				
				// be sure to save our status in a cookie
				active_user( "save" );
				
				break;
				
			case action == "check-if-okay-to-save" || action == "check-if-okay-to-save-manually":
			
				// reset our autosave timer
				clearTimeout( _AUTOSAVE["timer"] );

				var save_okay = true;
				
				// this is a count of all elements that are still animating...
				var animated = $( ".wxy-is-animating" ).length;

				// if autosave is on AND they have unsaved changes, AND nothing is being animated -- make sure they are alerted if we cannot save for too long a period
				if( ( ( _AUTOSAVE["on"] == 1 && _AUTOSAVE[ "unsaved_changes" ] == true ) || action == "check-if-okay-to-save-manually" ) && animated == 0 )
				{
					// if any dialogues are open or they are dragging something, do NOT autosave
					if( $( ".wxy-searchmark-settings-dialogue:visible" ).length > 0 || $( ".wxy-searchmark-is-being-moved" ).length > 0 )
					{	
						// something is open and so the user may be editing....
					
						// increse our count of save attempts...
						_AUTOSAVE[ "save_attempts" ] = _AUTOSAVE[ "save_attempts" ] + 1;
					
						// now start the waiting all over again
						changes_tracker( "changes-not-saved" );
					
						// once they have hit the max retries to save, alert them!
						switch (true)
						{
							case _AUTOSAVE[ "save_attempts" ] > _AUTOSAVE_MAX_ATTEMPTS:
							
								// this prevents the window from reloading our saved cookies when it gets focus back
								SESSION_DATA[ "alert_triggered" ] = true;
					
								alert("Autosave is unable to save changes until all Searchmark menus are closed.");
						
								_AUTOSAVE[ "save_attempts" ] = 0;
								
								break;
								
								
							case action == "check-if-okay-to-save-manually":
								// this prevents the window from reloading our saved cookies when it gets focus back
								SESSION_DATA[ "alert_triggered" ] = true;
					
								alert("Changes cannot be saved until all Searchmark menus are closed.");				
						}
				
						save_okay = false;
				
					}// close if length > 0
					
					// we are good to save, so SAVE!
					if( save_okay )
					{
						// we are OKAY to save!
						$( ".wxy-searchmark-save-btn" ).html( unsaved_label );
						$( ".wxy-searchmark-save-btn" ).removeClass( "wxy-searchmark-save-btn-disabled" );
						
						// clear out any search settings data
						bookmarks_searchbar( "clear-search-results" );

						// save our groups to the server...
						if( action == "check-if-okay-to-save-manually" )
						{
							// MANUALLY save
							groups_entry( "save-groups-to-server" );
							
						} else {
							// AUTOSAVE	
							groups_entry( "save-groups-to-server-silently" );
						}

						// in the result handler for the save, make sure to reset our save counter! _AUTOSAVE[ "save_attempts" ]
						changes_tracker( "changes-saved" );

					}
					
				}
				
				break;
				
			case action == "autosave-abort":
				
				// we want to stop the timer and turn off the button
				changes_tracker( "changes-saved" );
				
				break;
			
			case action == "update-autosave-status":
		
				// update the HTML label for our autosave button
				if( _AUTOSAVE["on"] == 1 )
				{
					// autosave is on...
					$( ".wxy-searchmark-autosave-btn" ).html( "auto&nbsp;save&nbsp;is&nbsp;ON" );
					$( ".wxy-searchmark-autosave-btn" ).removeClass( "wxy-searchmark-autosave-inactive" );
		
				} else {
					// autosave is OFF
					$( ".wxy-searchmark-autosave-btn" ).html( "auto&nbsp;save&nbsp;is&nbsp;OFF" );
					$( ".wxy-searchmark-autosave-btn" ).addClass( "wxy-searchmark-autosave-inactive" );
				}
				
				break;
				
			case action == "toggle-autosave-status":
				
				// ---------------------------------------------------------------------
				// save the current value for use below
				// ---------------------------------------------------------------------
				old_val = _AUTOSAVE["on"];
				
				// ---------------------------------------------------------------------
				// a flag to see if we need to finish with a save to the server or not
				// ---------------------------------------------------------------------
				server_save = false;
				
				// ---------------------------------------------------------------------
				// options are 1 = on, 0 = off, or -1 which is turn off but do not save to server...
				// ---------------------------------------------------------------------
				switch (true)
				{
					case old_val == 1:
						// turn autosave OFF...
						_AUTOSAVE["on"] = 0;
					
						server_save = true;
						
						// shut down any impending autosaves...
						changes_tracker( "autosave-abort" );
						
						break;
						
					case old_val == 0:
						// turn autosave ON...
						_AUTOSAVE["on"] = 1;
					
						server_save = true;
						
						// check to see if we need to start our autosave timer...
						changes_tracker( "unsaved-changes-check" );	
						
						break;
						
					case old_val == -1:
					
						// turn autosave OFF, but with NO server save...
						_AUTOSAVE["on"] = 0;
					
						// be sure NOT to save to the server
						server_save = false;
						
						// make sure we do not allow a timer to end in a save
						changes_tracker( "autosave-abort" );
						
						break;
				}
				
				// ---------------------------------------------------------------------
				// now update the button's status!
				// ---------------------------------------------------------------------
				changes_tracker( "update-autosave-status" );
				
				// ---------------------------------------------------------------------
				// check to see if we need to save the change in autosave status
				// ---------------------------------------------------------------------
				if( server_save )
				{
					// wxy-searchmark-data-form
					data[ "bookmark_action" ] = "update-groups-options-on-server";
					
					var option = {};
					option[ "autosave" ] = _AUTOSAVE["on"];
					
					// make sure it is a json string
					data[ "html" ] = JSON.stringify( option );
					
					// reset our form retry counter
					$( window ).data({ "wxy-searchmark-ajax-errors":0 });
				
					// now execute the server-side save!
					form_submit( data );
				}
				
				break;
				
			case action == "force-autosave-off" || action == "force-autosave-off-silently":
				
				var last_autosave = _AUTOSAVE["on"];
				
				// make sure there is no changes timer running...
				changes_tracker( "autosave-abort" );
				
				// set the autosave to -1, so it gets set to OFF when toggling its status (above)	
				_AUTOSAVE["on"] = -1;
				
				// now toggle the button and send a form to the server to save the shut off...
				changes_tracker( "toggle-autosave-status" );

				// show a message (if needed)
				if( last_autosave == 1 )
				{
					// this prevents the window from reloading our saved cookies when it gets focus back
					SESSION_DATA[ "alert_triggered" ] = true;
					
					alert("An error occured with your searchmark. It could be a loss of connection with the server or garbled searchmark data. Autosave has been turned off to prevent saving of corrupted data. Please reload the page. If that does not fix the problem, please check your internet connection, clear your cache, quit your browser, and restart your session.");
				}
				
				break;
		}
		
	};
	
	// ************************************************************************
	// USERNAME SELECT MENU HANDLER
	// ************************************************************************
	function username_select_menu( action )
	{
		var action = action || "initialize";
		var menu = $( ".wxy-searchmark-owners-select" );
		var option, okay;
		var val = $( menu ).val();
		var user = $( menu ).data( "wxy-searchmark-active-user" ) || "";
		
		// these are ALL of the valid users available
		var users = _USERS[ "all_user_logins" ] || [];
		
		switch (true)
		{
			case action == "initialize":
			
				// set up our select menu with available usernames
				for(var i=0,j=users.length;i<j;i++)
				{
					// if this is the first option, make it our default
					i == 0 ? is_default = "default " : is_default = "";
					
					option = '<option ' + is_default + 'value="' + users[ i ] + '">' + users[ i ] + '</option>';
					$( option ).appendTo( $( menu ) );
					
				}
		
				// check to see if there is a cookie with the current username?
				active_user( "load" );
				var new_val = _USERS[ "active_user" ];
				
				// if the active user is not the same AND this is this NOT their initial sign-in, then use the saved username to get their searchmark
				if( _USERS[ "searchmark_owner" ] != _USERS[ "active_user" ] && _USERS[ "initial_login" ] != 1 )
				{
					// now tell the menu which username to show
					new_val = _USERS[ "searchmark_owner" ];
				}
				
				// now tell the menu which username to show
				$( menu ).val( new_val );

				username_select_menu( "change-user" );
				
				break;
				
			case action == "change-user":
				okay = true;
				
				var new_user = $( menu ).val();
				
				// see if we have unsaved changes and if they should be asked to save...
				if( _AUTOSAVE[ "unsaved_changes" ] == true && _USERS[ "searchmark_owner" ] != new_user )
				{
					// this prevents the window from reloading our saved cookies when it gets focus back
					SESSION_DATA[ "alert_triggered" ] = true;
			
					okay = confirm( "the current searchmark user [ " + _USERS[ "searchmark_owner" ] + " ] appears to have unsaved changes. Click okay to discard any changes, and switch to user [ " + val + " ] ?" );
				
					if( !okay )
					{
						// set the menu back to this user....
						$( menu ).val( _USERS[ "searchmark_owner" ] );
						
					} else {
						okay = true;
					}
				
				}
				
				if( okay )
				{
					// it is OKAY to switch users....
					_USERS[ "searchmark_owner" ] = new_user;
					
					// now make sure the autosave gets stopped
					changes_tracker( "autosave-abort" );
					
					// remove our current USER cookie
					active_user("clear-cookie" );

					// clear our current goups content!
					$( ".wxy-searchmark-groups-inner-holder" ).empty();
					$( ".wxy-searchmark-groups-inner-holder" ).html( "Loading...");
					
					// save our active users cookie
					active_user( "save" );
					
					// close any open menus
					close_all_dialogues();
					
					// now retrieve the current user's searchmark!
					groups_entry( "load-groups-from-server" );
					
					// now make the groups tab the active tab
					$( ".wxy-searchmark-groups-tab-btn-holder" ).find( ".wxy-searchmark-tab-btn" ).trigger("click");
				}
				
				break;		
		}

	};
	
	
	// ************************************************************************
	// DIALOGUES: closes all and remove the class that indicates the last selected (opened) dialogue
	// ************************************************************************
	function close_all_dialogues( action )
	{
		var action = action || "";
		
		// capture the status of ourbookmarks search results window
		var show_dialogue = $( "#wxy-searchmark-bookmarks-search-results" ).is(":visible" );
		
		// use additional actions to clear, or not clear classes
		switch (true)
		{
			case action == "unselect-wxy-bookmark-items":
				$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
				$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
				break;
				
			case action == "unselect-sitesearch-items":
				$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-selection-color" );
				$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-item-selected" );
				break;
				
			case action == "unselect-history-items":
				$( ".wxy-searchmark-history-item-selected" ).removeClass( "wxy-searchmark-history-item-selected" );
				$( ".wxy-searchmark-history-item-selected" ).removeClass( "wxy-searchmark-selection-color" );
				break;
				
			case action == "unselect-all-selected-items":
				close_all_dialogues( "unselect-wxy-bookmark-items" );
				close_all_dialogues( "unselect-sitesearch-items" );
				close_all_dialogues( "unselect-history-items" );
				
			case action == "close-search-results-dialogue":	

				show_dialogue = false;
				
				break;
				
			case action == "open-dialogue-count":

				// just return a count of open dialogues
				return $( ".wxy-searchmark-settings-dialogue" ).filter( ":visible" ).length;
				
				break;
		}
		
		// close ALL settings dialogues!
		$( ".wxy-searchmark-settings-dialogue" ).hide();
		
		if( show_dialogue )
		{
			$( "#wxy-searchmark-bookmarks-search-results" ).show();
		}
	};
	
			
	// ************************************************************************
	// POINTER-EVENTS MASK: try to shield the rest of the page from interacting with our searchmark content!
	// ************************************************************************
	function pointer_events_mask( action )
	{
		var action = action || "off";
		var visible = $( ".wxy-searchmark-pointer-events-mask" ).is(":visible" );
		
		switch (true)
		{
			case action == "on":

				// show/hide our pointer events mask
				$( ".wxy-searchmark-pointer-events-mask" ).appendTo( $( "body" ) );
				$( ".wxy-searchmark-pointer-events-mask" ).show();
						
				// put out mask just below the widget		
				$( ".wxy-searchmark-pointer-events-mask" ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z - 1 });
				
				break;
				
			case action == "off":
				$( ".wxy-searchmark-pointer-events-mask" ).hide();
				break;
				
			case action == "is-visible":
				return visible;
				break;
		}
		
	};
			
	// ************************************************************************
	// GROUPS: handle group and bookmark entry maintenance
	// ************************************************************************
	function groups_entry( action, entry )
	{
		var action = action || "new";
		var entry = entry || false;
		
		// this is the MAIN tab container
		var container = $( ".wxy-searchmark-groups-tab" ).find( ".wxy-searchmark-groups-inner-holder" );
		var groups_tab_content = $( ".wxy-searchmark-groups-tab" ).find( ".wxy-searchmark-groups-inner-holder:first" );

		var url, bookmark, active, container, a_link, title, target, flash_item, okay, wrapper,clone, styles, id, form, button, parents, group, first, last, parent, content, override, post_id, permalink, view_btn, count, count_max, selected_items, closest_bookmark, closest_group, closest_search, holder, groups, searchmark, active_group, searches, tab, btn;
		
		var data = {};
		
		// set to true as a default
		var success = true;
		
		// use the currently active folder (if any) or the main wrapper (if none)
		active = $( ".wxy-searchmark-group-is-active" );
		
		if( $( active ).length > 0 )
		{
			if( $( active ).length > 1 )
			{
				active = $( active ).filter( ":last" );
			}
			
			// if we have an active group, then we need to switch the target container
			wrapper = $( active ).closest( ".wxy-searchmark-group-wrapper" );
			
			// this is where the actual content will be added
			container = $( wrapper ).find( ".wxy-searchmark-entry-group-container:first" );
		}
		
		// ---------------------------------------------------------------
		// SELECT_ITEMS: collect all elements with the class: wxy-searchmark-item-selected
		// ---------------------------------------------------------------
		selected_items = $( ".wxy-searchmark-item-selected" );
		
		closest_bookmark = $( entry ).closest( ".wxy-searchmark-entry" );
		closest_group = $( entry ).closest( ".wxy-searchmark-group-wrapper" );
		closest_search = $( entry ).closest( ".wxy-searchmark-search" );

		// there are no highlighted entries, use the currently clicked on entry
		switch (true)
		{
			case ( $( entry ).hasClass( "wxy-searchmark-entry-control-trash-btn" ) || $( entry ).hasClass( "wxy-searchmark-entry-control-duplicate-btn" ) ) && $( selected_items ).length <= 0 && $( closest_bookmark ).length > 0:
				
				// it is a bookmark
				selected_items = closest_bookmark;
				break;
			
			case ( $( entry ).hasClass( "wxy-searchmark-group-control-trash-btn" )  || $( entry ).hasClass( "wxy-searchmark-group-control-duplicate-btn" ) ) && $( selected_items ).length <= 0 && $( closest_group ).length > 0:
				
				// it is a GROUP
				selected_items = closest_group;

				break;
			
			case ( $( entry ).hasClass( "wxy-searchmark-search-control-trash-btn" )  || $( entry ).hasClass( "wxy-searchmark-search-control-duplicate-btn" ) ) && $( selected_items ).length <= 0 && $( closest_search ).length > 0:
				
				// it is a SEARCH
				selected_items = closest_search;
				
				break;
		}
		
	
		switch (true)
		{
			case action == "empty-groups-wrapper":
			
				// erase all content from our groups tab
				$( "#wxy-searchmark-groups-inner-holder" ).empty();
				
				break;
				
			case action == "unselect-all-groups":
				
				// UNSELECT ALL GROUPS - we want to make sure no groups or sub-groups are set to being active (focused)
				$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
				$( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );

				break;
			
			case action == "change-tab-view":
			
				// change from one tab view to another			
				close_all_dialogues();
			
				// swap tab content into view
				var tab = $( entry ).closest( ".wxy-searchmark-tab" );
			
				var inactive_tabs = $( ".wxy-searchmark-tab-inactive" );
			
				// remove our inactive class from all of them
				$( inactive_tabs ).removeClass( "wxy-searchmark-tab-inactive" );
			
				// hide all tab content
				$( ".wxy-searchmark-tab" ).find( ".wxy-searchmark-tab-content" ).hide();
			
				// get ALL tabs and assign the inactive class
				$( ".wxy-searchmark-tab" ).addClass( "wxy-searchmark-tab-inactive" );
			
				// be sure to hide any tab controls
				$( ".wxy-searchmark-tab" ).find(".wxy-searchmark-tab-controls").hide();
			
				// remove the class from the newly activated one...
				$( tab ).removeClass( "wxy-searchmark-tab-inactive" );
			
				// show our controls
				$( tab ).find(".wxy-searchmark-tab-controls").show();
			
				// show our content
				$( tab ).find( ".wxy-searchmark-tab-content" ).show();
			
				// load our settings (scrolltops)
				groups_entry( "load-settings" );
			
				// be sure to save our currently viewed tab and any other settings we want to stay persistent across page loads
				groups_entry( "save-tab-settings" );
			
				break;
			
			case action == "load-tab-settings":

				// LOAD TAB SETTINGS - see which tab is acurrently being viewed and save its id for restoring after page loads
				data = cookie( "load", WXY_TAB_SETTINGS_COOKIE );
		
				if( data )
				{
					// this can be an id or class - it is ready to go as-is
					btn = data[ "active_tab" ];
				
					// now manually switch the tab that is active to our saved one!
					groups_entry( "change-tab-view", $( btn ) );
				}

				break;
			
			case action == "save-tab-settings":
			
				// SAVE TAB SETTINGS - see which tab is acurrently being viewed and save its id for restoring after page loads
				data = {};
						
				// this should only get the tab WITHOUT our inactive class....
				tab = $( ".wxy-searchmark-tab" ).not( ".wxy-searchmark-tab-inactive" );
				btn = $( tab ).find( ".wxy-searchmark-tab-btn:first" );
				
				// go ahead and add the ID hash, since we may want to store a class here in the future, and so we can use whatever is stored as the selector without worrying about it being a class or an id
				data[ "active_tab" ] = "#" + $( btn ).attr( "id" );

				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_TAB_SETTINGS_COOKIE, data );
				
			
				break;
			
			case action == "close-groups":

				// close all content holders
				$( entry ).find(".wxy-searchmark-group-content").hide();
			
				// be sure to remove our override class!
				$( entry ).find( ".wxy-searchmark-close-override" ).removeClass( "wxy-searchmark-close-override" );

				// remove the open class from our group buttons
				$( entry ).find( ".wxy-searchmark-group-content-button-open" ).removeClass( "wxy-searchmark-group-content-button-open" );
				
				// remove our highlight from the group
				$( entry ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
				$( entry ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );
				
				return;
				
				break;
							
			case action == "open-close-groups":
			
				// silently open or close a folder (group)
				button = entry;
				parent = $( button ).parent();
				content = $( parent ).find(".wxy-searchmark-group-content:first");

				// be sure to remove our override class!
				override = $( ".wxy-searchmark-close-override" ).hasClass( "wxy-searchmark-close-override" );
				$( ".wxy-searchmark-close-override" ).removeClass( "wxy-searchmark-close-override" );

				// switch open/close button arrows
				switch (true)
				{
					case $( button ).hasClass( "wxy-searchmark-group-content-button-open" ) && !override:
			
						// CLOSING: remove our class
						$( button ).removeClass( "wxy-searchmark-group-content-button-open" );
					
						// remove our highlight from the group
						$( parent ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active" );
						$( parent ).find( ".wxy-searchmark-group-is-active-flag" ).removeClass( "wxy-searchmark-group-is-active-parent" );
					
						// add an wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
						$( content ).addClass( "wxy-is-animating" );
					
						// now close the group
						$( content ).slideUp("fast", function(){ snap_bookmark_tab_heights();groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );is_done_animating( this ); });

						break;
	
					default:
						// OPENING: add our class
						$( button ).addClass( "wxy-searchmark-group-content-button-open" );

						// add a wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
						$( content ).addClass( "wxy-is-animating" );
				
						$( content ).slideDown("fast", function(){ snap_bookmark_tab_heights();groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );is_done_animating( this ); });
					
						// be sure to remove our override class!
						$( ".wxy-searchmark-close-override" ).removeClass( "wxy-searchmark-close-override" );

						// now update the active group's highlights
						highlight_active_groups( parent );
				}

				break;
				
			case action == "open-all-groups" || action == "close-all-groups":

				// open/close ALL groups
				button = entry;
				parent = $( button ).closest( ".wxy-searchmark-group-wrapper" );
				holder = $( parent ).closest(".wxy-searchmark-entry-group-container");
	
				// now get all the group either the tab, or the folder			
				groups = $( holder ).children( ".wxy-searchmark-group-wrapper" );
			
				// be sure to remove our override class!
				$( ".wxy-searchmark-close-override" ).removeClass( "wxy-searchmark-close-override" );

				// switch open/close button arrows
				count_max = $( groups ).length;
				count = 0;
				
				$( groups ).each( function()
				{
					var self = this;
					var content = $( self ).find(".wxy-searchmark-group-content:first");
					var button = $( self ).find( ".wxy-searchmark-group-button:first" );
					var is_open = $( button ).hasClass( "wxy-searchmark-group-content-button-open" );
					
					count++;
					
					switch (true)
					{
						case action == "open-all-groups":
							
							// only open it if it is NOT already open
							if( !is_open )
							{
								// OPENING: add our class
								$( button ).addClass( "wxy-searchmark-group-content-button-open" );
					
								// add an wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
								$( content ).addClass( "wxy-is-animating" );
				
								if( count >= count_max )
								{
									$( content ).slideDown("fast", function(){ snap_bookmark_tab_heights();groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );is_done_animating( this ); });
								} else {
									$( content ).slideDown("fast", function(){ changes_tracker( "changes-not-saved" );is_done_animating( this ); });
								}
							}
							
							// highlight ONLY the group we clicked on
							highlight_active_groups( parent );
				
							break;
					
						case action == "close-all-groups":
							
							// only close if it is NOT already closed
							if( is_open )
							{
								// CLOSING: remove our class
								$( button ).removeClass( "wxy-searchmark-group-content-button-open" );
					
								// remove our highlight from the group
								$( self ).find( ".wxy-searchmark-group-is-active-flag:first" ).removeClass( "wxy-searchmark-group-is-active" );
								$( self ).find( ".wxy-searchmark-group-is-active-flag:first" ).removeClass( "wxy-searchmark-group-is-active-parent" );
					
								// add an wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
								$( content ).addClass( "wxy-is-animating" );
					
								// now close the group
								if( count >= count_max )
								{
									$( content ).slideUp("fast", function(){ snap_bookmark_tab_heights();groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );is_done_animating( this ); });
								} else {
									$( content ).slideUp("fast", function(){ changes_tracker( "changes-not-saved" );is_done_animating( this ); });
								}
							}
							
							break;
						
					}

				});
			
				break;

			case action == "new-group":
				
				// create a single GROUP
				
				blank = $( ".wxy-searchmark-group-blank:first" );
				group = $( blank ).clone( true,true );
			
				// close all dialogues and unselect ALL items selected
				close_all_dialogues();// "unselect-all-selected-items" 
			
				// switch out our inactive class with a live one
				$( group ).addClass( "wxy-searchmark-group-wrapper" );
				$( group ).removeClass( "wxy-searchmark-group-blank" );
			
				// give it a default name/clear our markers
				$( group ).find( ".wxy-searchmark-group-button-label" ).html( "untitled folder" );
				$( group ).find( ".wxy-searchmark-only" ).empty();
				
				// now add our new group!
				$( group ).prependTo( $( container ) );

				// now check to see if there are any selected items and make them children of this new group!
				var selected = $( ".wxy-searchmark-item-selected" );
				
				if( $( selected ).length > 0 )
				{
					var holder = $( group ).find( ".wxy-searchmark-entry-group-container:first" );
				
					// exapnd our selected items to be sure and include the outer wrapper for groups
					$( selected ).each( function()
					{
						var self = this;
						var next_item = self;
						
						// we use the group button to show the higlight, so get the actual outer wrapper to move it
						if( $( self ).hasClass( "wxy-searchmark-group-button" ) )
						{
							next_item = $( self ).closest( ".wxy-searchmark-group-wrapper" );
							
							if( $( next_item ).length <= 0 )
							{
								next_item = false;
							}
						}

						// only move it if an element exists
						if( next_item )
						{
							$( next_item ).appendTo( $( holder ) );	
						}
						
					});
					
					// remove the parent if this is the clone... and the clone if this is the parent...
					bookmarks_searchbar( "remove-original-items", selected );
					
				}

				// now fade it in - don't show settings for now, just add the new group (folder)
				$( group ).fadeIn(300, function(){ close_all_dialogues( "unselect-all-selected-items" );groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); });

				break;
				
			case action == "remove-all":

				// remove ALL groups and searchmark
				
				// close all dialogues and unselect ALL items selected
				close_all_dialogues( "unselect-all-selected-items" );

				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
			
				okay = confirm( "WARNING: This cannot be undone.\r\n\r\nALL folders and searchmark will be permanently removed from the database.\r\n\r\nErase now?");
			
				if( okay )
				{
					// remove all...
					$( ".wxy-searchmark-groups-inner-holder" ).empty();
					
					// adjust the height of our tabs
					snap_bookmark_tab_heights();
				
					// we want to stop the timer and turn off the button
					changes_tracker( "changes-saved" );
				
					// NOW erase from the server!
					groups_entry( "clear-groups-from-server" );

				} else {
					// cancel 
				}
				
				break;
				
			case action == "remove-group-bookmark-items":
				
				// remove a GROUP, BOOKMARK, OR SEARCH BOOKMARK - "verify" or "no-verify" to ask for user verification
				remove_groups_and_entries( selected_items, "verify" );
				
				break;
			
			
			case action == "duplicate-group-bookmark-items":

				// DUPLICATE all selected groups and searchmark

				okay = true;//confirm( "Duplicate this group and all of its contents?\r\n\r\n" + title );
			
				if( okay )
				{
					// close all dialogues and unselect ALL items selected
					close_all_dialogues( "unselect-all-selected-items" );
				
					// clone our selected items!
					clone = $( selected_items ).clone( true, true );
					
					// be sure to remove the group select classes
					$( clone ).find( ".wxy-searchmark-group-is-active" ).removeClass( "wxy-searchmark-group-is-active" );
					$( clone ).find( ".wxy-searchmark-group-is-active-parent" ).removeClass( "wxy-searchmark-group-is-active-parent" );
				
					// just in case, our copied data might have some search function data, scrub it!
					bookmarks_searchbar( "clear-result-settings", clone );
										
					// do these only if there is ONE item being copied!
					if( $( selected_items ).length == 1 )
					{
						// if there is no group label, then it must be a bookmark
						label = $( selected_items ).find( ".wxy-searchmark-group-button-label:first" );
						
						if( $( label ).length <= 0 )
						{
							// get our bookmark label!
							label = $( selected_items ).find( ".wxy-searchmark-entry-link:first" );
						}
						
						title = $( label ).text();
						
						// update the label in the copy
						$( clone ).find( ".wxy-searchmark-group-button-label:first" ).html( $( label ).html() + " &mdash; copy" );
				
					} else {
						
						// we have multiple items! wrap them in a new group!
						var wrapper = $( ".wxy-searchmark-group-blank:first" ).clone( true,true);
						
						label = "WXY: copy of ( " + $( clone ).length + " ) items";
						$( wrapper ).find( ".wxy-searchmark-group-button-label:first" ).html( label );
						
						// make sure our wrapper's class is changed from a blank to a wrapper and is visible
						$( wrapper ).addClass( "wxy-searchmark-group-wrapper");
						$( wrapper ).removeClass( "wxy-searchmark-group-blank");
						$( wrapper ).show();
						
						// now insert the cloned items into the folder container
						container = $( wrapper ).find( ".wxy-searchmark-entry-group-container" );
						$( container ).html( "" );
						$( clone ).appendTo( $( container ) );
						
						// now make the filled wrapper our cloned item!
						clone = wrapper;
					}

					// insert our new item(s) just below the LAST selected item
					$( clone ).insertBefore( $( selected_items ).filter(":first") );
					
					// now flash each new item	
					count_max = $( clone ).length;
					count = 0;
					
					$( clone ).each( function()
					{
						count++;
						
						if( count < count_max )
						{ 
							// now flash the new copies!
							flash_element( clone, 3, 200, function(){changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); } );
						} else {
							flash_element( clone, 3, 200, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); } );
						}
					});

				}
			
				break;

			case action == "run-search-bookmark":
			
				// user wants to re-run a saved search form!
				
				// show the search tab
				$( "#wxy-searchmark-search-tab-button" ).trigger( "click" );
				
				// load our search form settings and run the search!
				search_tab( action, entry );
				
				break;
			
			
			case action == "new-search-bookmark-from-form" || action == "new-search-bookmark-from-results":
				
				// create new SEARCH BOOKMARK entry
				
				// get our search form settings as a json string
				var form = $( ".wxy-searchmark-search-tab-form" );
				var data = search_tab( "collect-search-data", form );
				var html = data[ "html" ];

				data = html;

				// see if this is being added from the page-bar, or the search form....
				if( action == "new-search-bookmark-from-results" )
				{
					// get the form settings from the pagebar (bookmarking icon button)
					data = $( entry ).html();
				}
				
				// add a new search bookmark item to our searchmark tab (or active group)
				var search_bookmark = $( ".wxy-searchmark-search-blank" ).clone(true,true);
				$( search_bookmark ).addClass( "wxy-searchmark-search" );
				$( search_bookmark ).removeClass( "wxy-searchmark-search-blank" );
				$( search_bookmark ).show();
				$( search_bookmark ).prependTo( $( container ) );
				
				// now, save our form settings as a json string in our new bookmark
				$( search_bookmark ).find( ".wxy-searchmark-search-form-data" ).html( data );			
				
				// and flash the groups tab...
				flash_item = $(".wxy-searchmark-groups-tab").find(".wxy-searchmark-tab-btn-holder");
				flash_element( flash_item, 3, 150, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); } );

				// let the user edit the name of this group and change its color?
				//$( search_bookmark ).find(  ".wxy-searchmark-search-control-settings-btn" ).trigger( "click" );
				
				break;
				
			case action == "new-bookmark":
				// create new BOOKMARK entry
				
				// get the current page URL
				url = window.location.href;

				// get the title and filter it (if needed)
				if( SESSION_DATA[ "post_title" ] )
				{
					title = SESSION_DATA[ "post_title" ];
				} else {
					title = $( document ).find("title").text() || "untitled";
				}
				
				// see if this current page has a permalink
				permalink = SESSION_DATA[ "permalink" ];
				
				// make sure neither our permalink or url is blank...
				if( String( permalink ).length <= 0 || String( permalink ) == "undefined" )
				{	
					permalink = url;
				}

				// create a new entry
				bookmark = $( ".wxy-searchmark-entry-blank" ).clone( true, true );
			
				// swap out the blank class for an active class
				$( bookmark ).addClass( "wxy-searchmark-entry" );
				$( bookmark ).removeClass( "wxy-searchmark-entry-blank" );
			
				// now add our new bookmark!
				$( bookmark ).prependTo( $( container ) );
			
				// add the post ID to the title (if any)
				if( SESSION_DATA["post_id"] )
				{
					title = title + " [" + SESSION_DATA["post_id"] + "]";
					
					// assign a post id ONLY if it is not false
					$( bookmark ).find( ".wxy-searchmark-post-id" ).html( SESSION_DATA["post_id"] );
				}
				
				// get our link element
				a_link = $( bookmark ).find( ".wxy-searchmark-entry-link" );
			
				// prevent the link being draggable
				prevent_dragging( a_link );
			
				// now set its new values!
				$( a_link ).html( title );
				$( a_link ).attr({ "href":url });
				$( a_link ).prop({ "target":"_self" });
				
				// if there is no permalink, hide the view button!
				view_btn = $( bookmark ).find( ".wxy-searchmark-entry-control-view-btn" );
				
				// if there is no permalink, there might be a post id...
				switch (true)
				{
					case !permalink && SESSION_DATA["post_id"]:
						
						// there is no actual permalink, but there IS a post number...
						$( view_btn ).show();
						permalink = "/?page_id=" + SESSION_DATA["post_id"];
						
						alert( "no permalink" );
						
						break;

					case !permalink && !SESSION_DATA["post_id"]:
						// there is no permalink and no post number
						$( view_btn ).hide();
						
						break;
						
					case permalink:
						// we have a permalink!
						$( view_btn ).show();
				}
				
				$( bookmark ).find( ".wxy-searchmark-post-permalink" ).html( permalink );
				
				// assign a post id ONLY if it is not false
				if( SESSION_DATA["post_id"] )
				{
					$( bookmark ).find( ".wxy-searchmark-post-id" ).html( SESSION_DATA["post_id"] );
				}
	
				// then fade it in
				// for now, do NOT show the settings alert by default: $( bookmark ).find(".wxy-searchmark-entry-control-settings-btn").trigger("click");
				$( bookmark ).fadeIn(300, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); });
				
				break;
				
			case action == "add-link-bookmark":
				// Add a bookmark via keyboard option+command + click key combination

				// manually create a new entry
				bookmark = $( ".wxy-searchmark-entry-blank" ).clone( true, true );
			
				// swap out the blank class for an active class
				$( bookmark ).addClass( "wxy-searchmark-entry" );
				$( bookmark ).removeClass( "wxy-searchmark-entry-blank" );
			
				// now add our new bookmark!
				$( bookmark ).prependTo( $( container ) );

				// add our title and url for the bookmark from the entry object
				title = $( entry ).text();
				url = $( entry ).attr( "href" );
			
				// get our link element
				a_link = $( bookmark ).find( ".wxy-searchmark-entry-link" );
			
				// prevent the link being draggable
				prevent_dragging( a_link );
				
				// add our post id (id any) if any
				post_id = $( entry ).attr( "post-id" ) || "";
				$( bookmark ).find( ".wxy-searchmark-post-id" ).html( post_id );
				
				// if there is a post id, be sure to add it to the label
				if( String( post_id ) != "undefined" && String( post_id ).length > 0 )
				{
					title = title + " [" + post_id + "]";
				}
				
				// now set its new values!
				$( a_link ).html( title );
				$( a_link ).attr({ "href":url });
				$( a_link ).prop({ "target":"_self" });

				// assign the main href to the view button as well...
				view_btn = $( bookmark ).find( ".wxy-searchmark-entry-control-view-btn" );
				$( view_btn ).show();
				
				// add our permalink so the view button will work
				$( bookmark ).find( ".wxy-searchmark-post-permalink" ).html( url );
				
				// Finally, then fade it in
				// for now, do NOT show the settings alert by default: $( bookmark ).find(".wxy-searchmark-entry-control-settings-btn").trigger("click");
				$( bookmark ).fadeIn(300, function(){ groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights(); });
				
				// flash the bookmark icons?
				flash_item = $( ".wxy-searchmark-bookmark-image" );
				flash_element( flash_item, 3, 150, function(){ history_entry( "save-cookie" );groups_entry( "save-cookie" );snap_bookmark_tab_heights(); } );
				
				break;
				
			
			case action == "view-pages-posts":
				// VIEW PERMALINKS for one or more boomkarks (pages/posts)
				title = 0;

				$( entry ).each( function()
				{
					var url = $( this ).find( ".wxy-searchmark-post-permalink" ).html() || false;

					if( url )
					{
						title += 1;
					
						// create a new window! window.open(URL, name, specs, replace)
						window.open( url, "new-window-" + title, "", false );
					}
				});
			
				break;
			
			case action == "save-settings":

				// see if there are any stored values
				data = cookie( "load", WXY_SETTINGS_COOKIE, data );

				if( !data )
				{
					data = {};
				}

				// now save our container's scrolltop (but only if it is ACTIVE) - this is because scrollTop gets reset when the element is hidden!!!!
				if( !$( ".wxy-searchmark-groups-tab-entries" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
				{
					data[ "groups-scrolltop" ] = $( ".wxy-searchmark-groups-tab-entries" ).scrollTop();
				
				}
				
				if( !$( ".wxy-searchmark-history-tab-entries" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
				{

					data[ "history-scrolltop" ] = $( ".wxy-searchmark-history-tab-entries" ).scrollTop();
				}

				if( !$( ".wxy-searchmark-sitesearch-tab-links" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
				{

					data[ "search-scrolltop" ] = $( ".wxy-searchmark-sitesearch-tab-links" ).scrollTop();
				}
			
				// save our searchbar input field value (if any)
				data[ "searchbar-select" ] = $( "#wxy-searchmark-bookmarks-search" ).val()
				data[ "searchbar-input" ] = $( "#wxy-bookmarks-tab-searchbar-input" ).val()
				
				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_SETTINGS_COOKIE, data );
				
				break;
				
			case action == "load-settings":

				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				data = cookie( "load", WXY_SETTINGS_COOKIE, data );
				
				if( data )
				{
					// now restore our container's scrolltop (but only if it does NOT have an inactive class)
					if( !$( ".wxy-searchmark-groups-tab-entries" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
					{
						$( ".wxy-searchmark-groups-tab-entries" ).scrollTop( data[ "groups-scrolltop" ] );
					}
				
					if( !$( ".wxy-searchmark-history-tab-entries" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
					{
						$( ".wxy-searchmark-history-tab-entries" ).scrollTop( data[ "history-scrolltop" ] );
					}

					if( !$( ".wxy-searchmark-sitesearch-tab-links" ).closest( ".wxy-searchmark-tab" ).hasClass( "wxy-searchmark-tab-inactive" ) )
					{
						$( ".wxy-searchmark-sitesearch-tab-links" ).scrollTop( data[ "search-scrolltop" ] );
					}	
				}
				
				// save our searchbar input field value (if any)
				data[ "searchbar-select" ] = data[ "searchbar-select" ] || 0;
				data[ "searchbar-input" ] = data[ "searchbar-input" ] || "";

				// move our inputy field label out of the way of there is a previous value to restore
				if( String( data[ "searchbar-input" ] ).length > 0 )
				{
					$( "#wxy-bookmarks-tab-searchbar-input" ).addClass( "wxy-bookmarks-searchbar-has-input" );
				}
				
				$( "#wxy-searchmark-bookmarks-search" ).val( data[ "searchbar-select" ] )
				$( "#wxy-bookmarks-tab-searchbar-input" ).val( data[ "searchbar-input" ] )


				// finally, turn our scroll event listener back on
				scroll_event_handler( "scroll_listener_on" );
					
				break;
				
			case action == "save-cookie":
				// save our current list of GROUPS/BOOKMARKS to a cookie
				
				// get our groups/searchmark HTML
				data[ "html" ] = $( groups_tab_content ).html();
				
				// get our dialogues positions
				var dialogues = [];
				$( ".wxy-searchmark-settings-dialogue" ).each( function()
				{
					styles = get_css_styles( this );
					dialogues.push( styles );
				});

				data[ "dialogues" ] = dialogues;
				
				// get our current save status
				data[ "unsaved_changes" ] = _AUTOSAVE[ "unsaved_changes" ];
				
				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_WINDOWS_COOKIE, data );
				
				break;
				
			case action == "save-cookie-reset-dialogues":
				// save our current list of GROUPS/BOOKMARKS to a cookie
				
				// get our dialogues positions
				data[ "dialogues" ] = false;
				
				// ( action {load/save/clear}, cookie name to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_WINDOWS_COOKIE, data );
								
				break;
				
				
			case action == "load-cookie":

				// get whatever is in our GROUPS saved cookie
				
				// send an action (load/save/clear), the name of the cookie to use (wxy-searchmark-history) and our data object
				data = cookie( "load", WXY_WINDOWS_COOKIE );
				
				// get our dialogue positions
				if( data[ "dialogues" ] )
				{
					dialogues = data[ "dialogues" ];
					
					if( dialogues.length > 0 )
					{
						for(i=0,j=dialogues.length;i<j;i++)
						{
							id = dialogues[ i ][ "id" ] || "";
							
							if( id )
							{
								id = "#" + id;
								styles = dialogues[ i ][ "styles" ] || {};
								
								$( id ).css( styles );
								
								$( id ).hide();
							}
						}
					}
				}	

				// return false so we ALWAYS load server data instead
				success = false;
					
				// now load from the server instead
				groups_entry( "load-groups-from-server-silently" );

				break;
				
			case action == "clear-cookie":
				// simply get rid of all entries!
				cookie( "clear", WXY_WINDOWS_COOKIE );

				break;
				
			case action == "save-groups-to-server" || action == "save-groups-to-server-silently":
				// SERVER-SIDE: SAVE GROUPS AND BOOKMARKS to server
				
				// wxy-searchmark-data-form
				data[ "bookmark_action" ] = action;
				data[ "html" ] = $( ".wxy-searchmark-groups-inner-holder" ).html();
				
				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );
				
				break;
				
				
			case action == "load-groups-from-server" || action == "load-groups-from-server-silently":
				// SERVER-SIDE: load GROUPS and BOOKMARKS from server
				
				// wxy-searchmark-data-form
				data[ "bookmark_action" ] = action;

				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );

				break;
				
			case action == "download-groups-from-server":
				// SERVER-SIDE: create a ZIP archive file of our searchmark for downloading
				
				// wxy-searchmark-data-form
				data[ "bookmark_action" ] = action;

				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );

				break;
				
			case action == "download-zip-from-server":
				// SERVER-SIDE: download a ZIP file of all GROUPS and BOOKMARKS from server

				// instead... trigger a load into an iframe?
				var url = $( "#wxy-searchmark-data" ).val();
	
				// this should trigger the download...?
				$( "#wxy-searchmark-download-iframe" ).attr({ "src":url });
				
				break;
				
			case action == "select-groups-to-upload":
				// let use select file to upload, then check the type and filesize to make sure it is within limits...
				
				// close all dialogues and unselect ALL items selected
				close_all_dialogues( "unselect-all-selected-items" );
				
				// show our uploads dialogue
				var menu = $( "#wxy-searchmark-upload-dialogue" );
				
				// show our dialogue
				// now show the menu....
				$( menu ).appendTo( $( ".wxy-searchmark-widget-inner-wrapper" ) );
				$( menu ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
				$( menu ).fadeIn(200);

				break;
			
			case action == "upload-groups-to-server":
				// SERVER-SIDE: UPLOAD a ZIP file of all GROUPS and BOOKMARKS from server
				
				// wxy-searchmark-data-form (we have to use submit instead of ajax to get the file to upload!
				data[ "bookmark_action" ] = action;
				
				// also pass along a blank group to wrap uploads into
				var group = $( ".wxy-searchmark-group-blank:first" ).clone(true,true);
				
				// switch their classes
				$( group ).addClass( "wxy-searchmark-group-wrapper" );
				$( group ).removeClass( "wxy-searchmark-group-blank" );
				
				$( group ).appendTo( $("body" ) );
				$( group ).show();
				
				var inner_wrapper = $( group ).find( ".wxy-searchmark-group-inner-wrapper" );
				var base_class = $( inner_wrapper ).data( "base-class" );
				
				base_class += " wxy-searchmark-group-text-choice-3 wxy-searchmark-group-base-choice-2";
					
				$( inner_wrapper ).attr({ "class":base_class });
				
				// be sure to get the OUTER html!
				html = $( group ).get(0).outerHTML;
				
				// store the group html in our form
				data[ "blank-html" ] = html;

				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );

				break;
				
			case action == "clear-groups-from-server":
				// SERVER-SIDE: ERASE all GROUPS and BOOKMARKS from server
				
				// wxy-searchmark-data-form
				data[ "bookmark_action" ] = action;

				// reset our form retry counter
				$( window ).data({ "wxy-searchmark-ajax-errors":0 });
					
				// now execute the server-side save!
				form_submit( data );

				break;
				
				
				
			case action == "load-groups-after-focus-event":
				// there was a focus event and we need to refresh the content from the server
				
				// be sure to close any open dialogues!
				close_all_dialogues();
			
				// now get any cookies if they exist
				history_entry( "load-cookie" );
				active_user( "load-cookie" );
				
				// show our pointer events mask!
				$( ".wxy-searchmark-loading-mask" ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
				$( ".wxy-searchmark-loading-mask" ).show();
	
				// give the display time to redraw!
				var timer = setTimeout( function() { groups_entry( "load-groups-from-server-silently" ) }, 200);

				// let the site know that we have updated data from the server
				$( window ).data({ "wxy-tools-focus-event-triggered": false });
				
				break;
				
				
			case action == "select-all-shortcut":

				// SHIFT + COMMAND + A to select all... again to unselect all
			
				// add a switch case to select items from the searchmark tab OR the history tab, or the search tab.....
				switch (true)
				{
					
					case !$( ".wxy-searchmark-sitesearch-tab" ).hasClass( "wxy-searchmark-tab-inactive" ):
						
						// SELECT ALL SEARCH ENTRIES
						switch (true)
						{
							case $( ".wxy-searchmark-sitesearch-edit-link-selected" ).length > 0:
				
								$( ".wxy-searchmark-sitesearch-edit-link-selected" ).removeClass( "wxy-searchmark-sitesearch-edit-link-selected" );
								
								break;
						
							case $( ".wxy-searchmark-sitesearch-edit-link-selected" ).length <= 0:
							
								$( ".wxy-searchmark-sitesearch-edit-link" ).addClass( "wxy-searchmark-sitesearch-edit-link-selected" );

								break;
						}
					
						break;
					
					
					case !$( ".wxy-searchmark-history-tab" ).hasClass( "wxy-searchmark-tab-inactive" ):
						
						// SELECT ALL HISTORY ENTRIES
						
						// see if we are SELECTING or UNSELECTING AND the searchmark tab is showing!
						switch (true)
						{
							case $( ".wxy-searchmark-history-item-selected" ).length > 0:
				
								// UNSELECTING searchmark and groups
								$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
								
								// UNSELECTING history entries
								$( ".wxy-searchmark-history-item-selected" ).removeClass( "wxy-searchmark-history-item-selected" );
								$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
								
								break;
						
							case $( ".wxy-searchmark-history-item-selected" ).length <= 0:
							
								// make sure you unselect everything that could be in any tab
								$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							
								// SELECTING! - remember: the selection cass is different for history entries
								$( ".wxy-searchmark-history-tab-entries" ).find( ".wxy-searchmark-history" ).addClass( "wxy-searchmark-history-item-selected wxy-searchmark-selection-color" );

								break;
						}
					
						break;
						
					case !$( ".wxy-searchmark-groups-tab" ).hasClass( "wxy-searchmark-tab-inactive" ):
					
						// SELECT ALL GROUPS AND BOOKMARKS
					
					
						// see if there is an active group (but just the parent group)
						active_group = $( ".wxy-searchmark-groups-inner-holder" ).find( ".wxy-searchmark-group-is-active-flag" ).filter(  ".wxy-searchmark-group-is-active" );
				
						// if there is more than one possible active_group, select the LAST one (nested)
						if( $( active_group ).length > 1 )
						{
							active_group = $( active_group ).filter( ":last" );
						}

						// if there are no groups selected, then use the main content wrapper for this tab!
						if( $( active_group ).length > 0 )
						{	
							// we have an actve group, so use this as the holder
							wrapper = $( active_group ).closest( ".wxy-searchmark-group-wrapper" );
					
							holder = $( wrapper ).find( ".wxy-searchmark-entry-group-container:first" );
										
						} else {
					
							holder = $( ".wxy-searchmark-groups-inner-holder" );
						}

						groups = $( holder ).children( ".wxy-searchmark-group-wrapper" );
						searchmark = $( holder ).children( ".wxy-searchmark-entry" );
						searches = $( holder ).children( ".wxy-searchmark-search" );
						
						// see if we are SELECTING or UNSELECTING AND the searchmark tab is showing!
						switch (true)
						{
							case $( ".wxy-searchmark-item-selected" ).length > 0:
				
								// UNSELECTING!
								$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
		
								break;
						
							case $( ".wxy-searchmark-item-selected" ).length <= 0:
							
								// make sure you unselect everything that could be in any tab
								$( ".wxy-searchmark-item-selected" ).removeClass( "wxy-searchmark-item-selected" );
								$( ".wxy-searchmark-selection-color" ).removeClass( "wxy-searchmark-selection-color" );
							
								// SELECTING!
								$( groups ).find( ".wxy-searchmark-group-button:first" ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
						
								$( searchmark ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
								
								$( searches ).addClass( "wxy-searchmark-item-selected wxy-searchmark-selection-color" );
		
								break;
						}
				}
			
			break;
				
		}
		
		// return to true to let anyone who cares know that data was loaded...
		return success;
		
	};
	
		
	// ************************************************************************
	// HISTORY: handle history entry maintenance
	// ************************************************************************
	function history_entry( action, entry )
	{
		var action = action || "new";
		var entry = entry || false;
		var container = $( ".wxy-searchmark-history-tab-entries" );
		var url, bookmark, active, container, a_link, title, target, flash_item, entry_num, timestamp, last_entry, count, count_max;
		var data = {};
		var entry_count = $( ".wxy-searchmark-history" ).length || 0;
		
		switch (true)
		{
			case action == "new":
				// CREATE NEW HISTORY ENTRY
				url = window.location.href;

				// get the title and filter it (if needed)
				if( SESSION_DATA[ "post_title" ] && SESSION_DATA["admin_panel_info"][ "id" ] != "edit-post" )
				{
					title = SESSION_DATA[ "post_title" ];
				} else {
					title = $( document ).find("title").text() || "untitled";
				}
		
			
				// add the post ID to the title (if any)
				if( SESSION_DATA["post_id"] )
				{
					title = title + " [" + SESSION_DATA["post_id"] + "]";
				}
				
				// check to see if this enrtry is the same as the last one...
				last_entry = $( ".wxy-searchmark-history-tab-entries" ).children( ":first" );
			
				if( $( last_entry ).find( ".wxy-searchmark-history-link" ).html() != title )
				{
			
					// create a new entry
					bookmark = $( ".wxy-searchmark-history-blank" ).clone( true, true );
			
					// swap out the blank class for an active class
					$( bookmark ).addClass( "wxy-searchmark-history" );
					$( bookmark ).removeClass( "wxy-searchmark-history-blank" );
			
					// now add our new bookmark!
					$( bookmark ).prependTo( $( container ) );
				
					// get our link element
					a_link = $( bookmark ).find( ".wxy-searchmark-history-link" );
			
					// now assign our ne entry a timestamp!
					timestamp = current_date( "hours-mins-secs" );
					entry_num = $( bookmark ).find( ".wxy-searchmark-history-timestamp" ).html( timestamp );

					// prevent the link being draggable
					prevent_dragging( a_link );
			
					// now set its new values!
					$( a_link ).html( title );
					$( a_link ).attr({ "href":url });
					$( a_link ).prop({ "target":"_self" });

					// assign a post id
					$( bookmark ).find( ".wxy-searchmark-post-id" ).html( SESSION_DATA["post_id"] );
				
					// then show the new entry
					$( bookmark ).show();

					// SAVE in a cookie
					history_entry( "save-cookie" );
				
					// now check to see if there are too many entries
					history_entry( "max-check" );
				}
				
				break;
			
			case action == "max-check":
				// check to see if we have too many history entries and trim them if we do
				
				// trim off any excess entries (above our max number)
				if( entry_count > WXY_HISTORY_MAX )
				{
					// slice out the entries above our max!
					bookmark = $( container ).children().slice(0, ( WXY_HISTORY_MAX + 1 ));
			
					// append them to body for now...
					$( bookmark ).appendTo( $( "body" ) );
					
					// clear out any excess history entries
					history_entry( "remove-all" );
					
					// now put back the new set!
					$( bookmark ).appendTo( $( container ) );
					
					// SAVE in a cookie
					history_entry( "save-cookie" );
				}
				

				break;
			
			case action == "remove":
				// remove this parent entry - "verify" or "no-verify" to ask for user verification
				remove_groups_and_entries( entry, "verify" );

				break;
				
			case action == "remove-silently":

				// remove this parent entry  - "verify" or "no-verify" to ask for user verification
				remove_groups_and_entries( entry, "no-verify" );

				break;
				
			case action == "remove-all":
				// remove ALL history entries!

				// this prevents the window from reloading our saved cookies when it gets focus back
				SESSION_DATA[ "alert_triggered" ] = true;
			
				okay = confirm( "Are you sure you want to delete ALL of your history entries?" );
			
				if( okay )
				{
					// remove all...
					$( container ).empty();
				
					// SAVE in a cookie
					history_entry( "save-cookie" );
					
					close_all_dialogues();

				} else {
					// keep it!
				}
				
				break;
				
			case action == "move-to-groups":

				$( entry ).each( function()
				{
					// move to active folders tab
					a_link = $( this ).find( ".wxy-searchmark-history-link" );
					title = $( a_link ).html();
					url = $( a_link ).attr("href");
					target = $( a_link ).prop("target") || "_self";
			
					// now clone a blank BOOKMARK entry and switch the classes on it
					bookmark = $( ".wxy-searchmark-entry-blank" ).clone( true, true);
					$( bookmark ).addClass( "wxy-searchmark-entry" );
					$( bookmark ).removeClass( "wxy-searchmark-entry-blank" );
			
					// now update the new bookmark with values from our history entry
					a_link = $( bookmark ).find( ".wxy-searchmark-entry-link" );
					$( a_link ).html( title );
					$( a_link ).attr({ "href":url });
					$( a_link ).prop({ "target":target });
			
					// assign a post id ONLY if it is not false
					if( SESSION_DATA["post_id"] )
					{
						$( bookmark ).find( ".wxy-searchmark-post-id" ).html( SESSION_DATA["post_id"] );
					}
					
					// add it to the currently active folder (if any) or the main wrapper (if none)
					active = $( ".wxy-searchmark-group-is-active" );
					container = $( ".wxy-searchmark-groups-inner-holder" );

					if( $( active ).length > 0 )
					{
						container = $( active ).parent().find(".wxy-searchmark-entry-group-container");
					}
			
					// now add our new bookmark!
					$( bookmark ).prependTo( $( container ) );

					// now, fade it in and delete the history entry...
					$( bookmark ).fadeIn(100, function(){ history_entry( "remove-silently", entry ); });
			
					// and flash the groups tab...
					flash_item = $(".wxy-searchmark-groups-tab").find(".wxy-searchmark-tab-btn-holder");
					
				});
				
				// only save after the last item
				flash_element( flash_item, 3, 150, function(){ history_entry( "save-cookie" );groups_entry( "save-cookie" );snap_bookmark_tab_heights(); } );
					
				// let the site know there are unsaved changes
				changes_tracker( "changes-not-saved" );

				break;
				
				
			case action == "save-cookie":
				// save our current list of current history entries to a cookie
				data[ "history_html" ] = $( container ).html();
				
				// send an action (load/save/clear), the name of the cookie to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_HISTORY_COOKIE, data );
				
				break;
				
				
			case action == "load-cookie":
				
				// get whatever is in our saved cookie
				data = cookie( "load", WXY_HISTORY_COOKIE );
				
				// clear our container first
				$( container ).empty();
				
				// replace our current history contents with what is saved
				$( container ).html( data[ "history_html" ] ); 
				
				// send an action (load/save/clear), the name of the cookie to use (wxy-searchmark-history) and our data object
				cookie( "save", WXY_HISTORY_COOKIE, data );
				
				break;
				
			case action == "clear-cookie":
				// simply get rid of all entries!
				cookie( "clear", WXY_HISTORY_COOKIE );
				
				break;
		}
		
	};
	
	// ************************************************************************
	// REMOVE/DELETE: remove one or more groups and searchmark from our content holder
	// ************************************************************************
	function remove_groups_and_entries( entry, verify )
	{
		var count_max = $( entry ).length;
		var count = 1;
		var verify = verify || "no-verify";

		// this prevents the window from reloading our saved cookies when it gets focus back
		SESSION_DATA[ "alert_triggered" ] = true;
		
		if( verify == "verify" )
		{
			okay = confirm( "Are you sure you want to delete [ " + count_max + " ] items?" );
		} else {
			okay = true;
		}

		if( okay )
		{
			// just in case, our copied data might have some search function data, scrub it!
			bookmarks_searchbar( "clear-result-settings", entry );
			
			// now animate them being removed...		
			$( entry ).each( function()
			{
				// add an wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
				$( entry ).addClass( "wxy-is-animating" );
			
				if( count < count_max )
				{
					$( entry ).slideUp( 300, function() { $( entry ).remove();is_done_animating( this ); });
				} else {
					$( entry ).slideUp( 300, function() { $( entry ).remove();history_entry( "save-cookie" );groups_entry( "save-cookie" );changes_tracker( "changes-not-saved" );snap_bookmark_tab_heights();is_done_animating( this ); });
				}
			
				// incremenet our counter
				count++;
			});
		}
		
	};
				
	// ************************************************************************
	// collect all CSS styles in a list of styles and return them as an object
	// ************************************************************************
	function get_css_styles( element )
	{
		var element = element || {};
		
		var styles = [ "top", "left", "display", "position" ];//"opacity", 
		var result = {};
		var css = [];
		
		result[ "styles" ] = {};
		
		for(var i=0, j=styles.length;i<j;i++)
		{
			result[ "styles" ][ styles[ i ] ] = $( element ).css( styles[ i ] );
		}
		
		// see if ther is an ID to capture...
		result[ "id" ] = $( element ).attr("id") ||"";
		
		return result;
	};
	
	// ************************************************************************
	// WIDGET STARTUP: load GROUPS cookie when page is first loaded and initialized
	// ************************************************************************
	function initialize_groups()
	{
		// check to see if we have any GROUPS data stored in a cookie
		var result = false;

		if( !result )
		{
			// there is no cookie, so load contents from the server!
			
			// show our pointer events mask!
			$( ".wxy-searchmark-loading-mask" ).css({ "z-index": WXY_BOOKMARKS_WIDGET_Z + 100 });
			$( ".wxy-searchmark-loading-mask" ).show();
	
			// clear out any default content from our groups holder
			$( ".wxy-searchmark-groups-inner-holder" ).empty();
		
			// give the display time to redraw!
			var timer = setTimeout( function() { groups_entry( "load-groups-from-server" ) }, 200);
			
		} else {

			// there is a cookie! So, start our save timer...
			changes_tracker( "unsaved-changes-check" );
		}
	
	};
		
	// ************************************************************************
	// WIDGET STARTUP: load HISTORY cookie when page is first loaded and initialized
	// ************************************************************************
	function initialize_history()
	{
		// check to see if we have any HISTORY data stored in a cookie
		history_entry( "load-cookie" );

		// now, get our current URL and create a history entry...
		history_entry( "new" );
		
		// be sure to save our current data to preserve the new history entry
		history_entry( "save-cookie" );
	};
	
	// ************************************************************************
	// WIDGET STARTUP: insert our updated sitesearch
	// ************************************************************************
	function initialize_sitesearch()
	{
		// here, we take the data and set up our search forms, also load, any results...		
		var form = $( "#wxy-searchmark-search-tab-form" );

		search_tab( "initialize-sitesearch", form );
	};
	
	// ************************************************************************
	// WIDGET STARTUP: load our saved cookie for tab views and other saved-state settings for this session
	// ************************************************************************
	function initialize_tabview()
	{
		// retrieve our saved cookie data and decide which tab to show when the menu is opened...
		groups_entry( "load-tab-settings" );
		
	};



	// ************************************************************************
	// PREVENT ELEMENT FROM BEING DRAGGED OR SELECTED
	// ************************************************************************
	function prevent_dragging( self )
	{
		$( self ).each( function()
		{
			$( self ).attr({ 'unselectable':'on', 'draggable':false });
			
			$( self ).css('-moz-user-select', 'none')
			
			$( self ).each( function()
			{
				this.onselectstart = function(evt) { evt.preventDefault();return false; };
				this.ondragstart = function(evt) { evt.preventDefault();return false; };
			});
		});
	};
	
	
	// ************************************************************************
	// COLOR SWATCHES: update samples in settings dialogues
	// ************************************************************************
	function update_settings_samples( settings )
	{
		// settings is the settings dialogue...
		
		// get the base and text colors for assigning to our samples!
		var base_color = $( settings ).find(".wxy-searchmark-base-color-holder").find(".wxy-searchmark-color-swatch-selected").css("background-color");
		
		// remember: we use the background color of the swatch to become the text COLOR!
		var text_color = $( settings ).find(".wxy-searchmark-text-color-holder").find(".wxy-searchmark-color-swatch-selected").css("background-color");
		
		// see which sample to alter
		switch (true)
		{
			case $( settings ).hasClass( "wxy-searchmark-group-settings" ):
				
				// assign our colors to our GROUPS sample...
				$( ".wxy-searchmark-group-sample" ).css({ "color":text_color, "background-color":base_color });
				break;
					
			case $( settings ).hasClass( "wxy-searchmark-entry-settings" ):

				// assign our colors to our ENTRY sample...
				$( ".wxy-searchmark-entry-sample" ).css({ "color":text_color, "background-color":base_color });
				break;
				
			case $( settings ).hasClass( "wxy-searchmark-search-settings" ):

				// assign our colors to our ENTRY sample...
				$( ".wxy-searchmark-search-sample" ).css({ "color":text_color, "background-color":base_color });
				break;
		}
	};
		
	// ************************************************************************
	// flash ANY element X number of times..... defaut to 3
	// ************************************************************************
	function flash_element( elem, flashes, speed, callback_fn )
	{	
		// see if it already has a counter
		var data = $( elem ).data("flash_fn_data") || {};
		flashes = flashes || data['flashes'];
		speed = speed || data['speed'];
		var display = data['display'];
		var start_opacity = data["start_opacity"];
		var callback_fn = callback_fn || data["callback_fn"];

		// see if we need to save the original visibility
		if( !display )
		{
			display = $(elem).css('display') || "block";
			start_opacity = $(elem).css('opacity') || 1;

			// now show it now matter what...
			$(elem).show();
		}

		// make sure there are flashes
		if( isNaN(flashes) )
		{
			flashes = 3;
		}

		// decrement our counter
		flashes -= 1;
	
		// save it to our element's data object
		$(elem).data({ "flash_fn_data": { "flashes":flashes, "speed":speed, "display":display, "opacity":start_opacity, "callback_fn":callback_fn } });

		// now initiate our next flash!
		if( flashes > -1 )
		{
			// add an wxy-is-animating class to check for autosave ability, to prevent it from saving partially transformed content
			$( elem ).addClass( "wxy-is-animating" );
				
			// fade OUT, then fade IN, rinse and repeat...
			$(elem).stop().animate({"opacity":.3},speed,function(){ $(elem).stop().animate({"opacity":1},speed,function(){ flash_element( this ) }) });
		} else {
			
			// our animation is all done, clean up!
			data = $(elem).data("flash_fn_data");

			// now see if we need to hide or show the element when it is done flashing
			$( elem ).css({'display':data["display"], "opacity":data["start_opacity"] });
		
			// be sure to remove our class that let's autosave know the item is done flashing
			is_done_animating( elem );
		
			// execute our anonymously wrapped function, if it exists
			callback_fn = data["callback_fn"];
		
			// remove the property!
			$(elem).removeData("flash_fn_data");
				
			if( ({}).toString.call( callback_fn ) === '[object Function]' )
			{
				TIMEOUT = setTimeout( function() { callback_fn() }, 300 );
			}
		

		}
	
	};

		
	// ************************************************************************
	// BOOK MARK TABS: make sure they stay the proper height at all times!
	// ************************************************************************
	function snap_bookmark_tab_heights()
	{
		// be sure our tabs holder is the correct height as well (in case they have resized the screen)
		
		// this is the height of the window, minus a buffer of space along the bottom
		var offset = $( ".wxy-searchmark-widget-inner-wrapper" ).position().top + 35;
		var widget_height = $( window ).height() - offset;

		var border_thickness = to_float( $( ".wxy-searchmark-widget-inner-wrapper" ).css("border-top-width") ) + to_float( $( ".wxy-searchmark-widget-inner-wrapper" ).css("border-bottom-width") );

		// resize our inner wrapper to assign the overall height of the widget
		$( ".wxy-searchmark-widget-inner-wrapper" ).css({ "height":widget_height });

		// now get take the widget's height and deduct our header and close bar - what is left is how tall our tabs holder should be
		var header_height = $( ".wxy-searchmark-tab-header" ).outerHeight( true );
		var holder_height = widget_height - header_height - border_thickness;
		
		// --------------------------------------------------------------
		// HISTORY TAB HEIGHT
		// --------------------------------------------------------------
		$( ".wxy-searchmark-history-tab" ).height( holder_height - 2 );
		
		// --------------------------------------------------------------
		// GROUPS TAB HEIGHT
		// --------------------------------------------------------------
		var bookmark_searchbar = $( ".wxy-bookmarks-tab-searchbar" ).outerHeight( true );
		var bookmarks_height = holder_height - bookmark_searchbar;
		
		$( ".wxy-searchmark-groups-tab" ).height( bookmarks_height - 2 );
		
		// --------------------------------------------------------------
		// SEARCH TAB HEIGHT
		// --------------------------------------------------------------
		$( ".wxy-searchmark-sitesearch-tab" ).height( holder_height -2 );
		
		var padding = to_float( $( ".wxy-searchmark-sitesearch-tab-links" ).css( "padding-bottom" ) );
		var results_height = holder_height - $( ".wxy-searchmark-sitesearch-tab-controls" ).outerHeight( true ) - padding;
		
		$( ".wxy-searchmark-sitesearch-tab-links" ).height( results_height - 2 );
		
	};

	// *****************************************************************************
	// a replacement function to convert any string to floating-point numbers (with +- sign)
	// *****************************************************************************
	function to_float( str )
	{	
		// get only one continuous number from the string
		var myRegExp = /([\-]?[0-9\.]+)/gi;
	
		// now filter the string and remove ANY non-digit characters, except for the decimal and minus..
		var matches = String( str ).match( myRegExp );
		
		var raw_str ="";
	
		try
		{
			raw_str = matches[0];
		} catch(e){}
	
		var sign = 1;
	
		// see if this should be a negative or positive number
		if( /\-/.test( raw_str ) )
		{
			sign = -1;
		
			// remove the minus sign from our string
			raw_str = String( raw_str ).replace("-","");
		}
	
		// now parse it to a floating-point number!
		var num = parseFloat( raw_str );
		
		// see if it is negative or positive
		num = num * sign;
	
		// now return the newly parsed number
		return Number( num );
	};

	// ************************************************************************
	// SELECTIONS: clears any selections of HTML in the browser
	// ************************************************************************
	function clear_selections()
	{
		// clear any HTML items that are trying to be selected
		if ( document.selection )
		{
			document.selection.empty();
		} else if ( window.getSelection ) {
			window.getSelection().removeAllRanges();
		}
	};

	// ************************************************************************
	// add backward compatibility for parseHTML fn that is only in jQuery 1.8 and up
	// ************************************************************************
	function parseHTML( str )
	{
		if( !jQuery.parseHTML )
		{
			return str;
		} else {
			return $.parseHTML( str );
		}
	};
		
	// ************************************************************************
	// get our epoch timestamp with backward compatibility
	// ************************************************************************
	function get_epoch()
	{
		var mills;
				
		if( !Date.now )
		{
			mills = new Date().getTime();
		} else {
			mills = Date.now();
		}
		
		return mills;
	};

	
	// ****************************************************************************
	// create a long or short string of the current date
	// ****************************************************************************
	function current_date( action )
	{
		var action = action || "date-time";
		var dateString, m_names, d_names, d, curr_date, curr_month, curr_year, curr_day, curr_hour, curr_min, curr_sec, amp_pm;
		
		//long names
		m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
		d_names = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
		
		//short names
		if( action == "short" )
		{
			m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec");
			d_names = new Array("Sun","Mon","Tue","Wed","Thur","Fri","Sat");
		}
	
		d = new Date();
		
		curr_date = d.getDate();
		curr_date = pad_string( curr_date, 2, "0" );
		
		curr_month = d.getMonth();
		curr_month = pad_string( curr_month, 2, "0" );
		
		curr_year = d.getFullYear();
		curr_year = pad_string( curr_year, 2, "0" );
		
		curr_day = d.getDay();
		curr_day = pad_string( curr_day, 2, "0" );
		
		curr_hour = d.getHours();
		
		curr_min = d.getMinutes();
		curr_min = pad_string( curr_min, 2, "0" );
		
		curr_sec = d.getSeconds();
		curr_sec = pad_string( curr_sec, 2, "0" );
		
		am_pm = " a.m.";
		
		if( curr_hour > 12 )
		{
			curr_hour -= 12;
			am_pm = " p.m.";
		}
		
		// check for hours string length only after seeing if it should be 24 hour or 12 hour time
		curr_hour = pad_string( curr_hour, 2, "0" );
		
		
		// now see what kiund of string to send back
		switch (true)
		{
			case action == "date-time":
				// full date-time string
				dateString = String( d_names[curr_day] + ", " + m_names[curr_month]+" "+curr_date+", "+curr_year + " @ " + curr_hour + ":" + curr_min +":"+curr_sec + am_pm ); 
				break;

			case action == "hours-mins-secs":
				// only the hours, minutes, second and am/pm
				dateString = String( curr_hour + ":" + curr_min +":"+curr_sec + am_pm ); 
				break;
		}
		
		return dateString;
	};
	
	// ****************************************************************************
	// STRING: pad a string of one length to another with a padding string
	// ****************************************************************************
	function pad_string( source, length, pad )
	{
		
		while( String( source ).length < length )
		{
			source = pad + source;
		}
		
		return source;
	};
	

	// ****************************************************************************
	// COOKIE HANDLER: read and write cookies
	// ****************************************************************************
	function cookie( action, cookie_name, data )
	{
		var action;
		var cookie_name = cookie_name || "shortbread_cookie";
		var data = data || {};
		var currentTime = new Date().getTime();
		var maxTime = 4320000;
		var time, date, cookie_data;
	
		// ------------------------------
		// SAVE our cookie content
		// ------------------------------
		if( action == "save" )
		{
			// be sure to clean out the old cookie value
			window.localStorage.removeItem( cookie_name );
		
			// add a timstamp to our cookie data object
			time = String( parseFloat( currentTime ) + maxTime );
			data["time_created"] = String( time );
			
			// convert our object to a string and the save it to the cookie_data
			cookie_data = JSON.stringify( data );
			
			// now save it!
			window.localStorage.setItem(cookie_name,cookie_data);
		}
	
		// ------------------------------
		// LOAD our cookie content
		// ------------------------------
		if( action == 'load' )
		{
			cookie_data = window.localStorage.getItem( cookie_name );
			
			// see if there is any data stored..
			if( cookie_data )
			{
				// if there is data, try to format it back into a JS object
				data = {};
				
				try {
					data = JSON.parse( cookie_data );
				} catch (e) {
					// if there is an error, just send back a blank object	
					data = { "time_created":"0" };
				}
				
			} else {
				// if not, return a blank cookie
				//data = {"time_created":"0" };
				data = false;
			}
			
			// send back our contents
			return data;
		}
	
		// ------------------------------
		// CLEAR our saved data
		// ------------------------------
		if( action == "clear" )
		{
			// just wipe out the entire cookie
			window.localStorage.removeItem( cookie_name );
		}

	};
	
	// *************************************************************************
	// PAGE READY: initial widget setup at pageready event
	// *************************************************************************
	function setup_page_elements()
	{
		// add a temporary DIV element to load our widget's html into
		var str = "<div class='wxy-searchmark-load-wrapper'></div>";
  		var html = parseHTML( str );
		
		// attach it to the main body element
		$( "body" ).append( html );

		// now load our external HTML
		$( ".wxy-searchmark-load-wrapper" ).load( WXY_BOOKMARKS_PLUGIN_PATH + "/html/wxy-searchmark.html", function()
		{
			// do this AFTER content is loaded...
			var html = $( this ).html();

			// add all of our content to body, removing it from the temporary load DIV
			var this_body = document.body;
			$( html ).appendTo( $( this_body ) );

			// finally, set up all of our UI/functionality handlers and event listeners
			wxy_searchmark_loaded();
		});

	};



/*
    http://www.JSON.org/json2.js
    2011-10-19

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

// *********************************************************************************************************
// get the max z-index of any elements so we can always stay above them!
// *********************************************************************************************************
/*	
	TopZIndex plugin for jQuery
	Version: 1.2

	http://topzindex.googlecode.com/
	
	Copyright (c) 2009-2011 Todd Northrop
	http://www.speednet.biz/
	
	October 21, 2010
	
	Calculates the highest CSS z-index value in the current document
	or specified set of elements.  Provides ability to push one or more
	elements to the top of the z-index.  Useful for dynamic HTML
	popup windows/panels.
	
	Based on original idea by Rick Strahl
	http://west-wind.com/weblog/posts/876332.aspx

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.
	
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
------------------------------------------------------*/

(function ($) {

$.topZindex = function (selector) {
	/// <summary>
	/// 	Returns the highest (top-most) zIndex in the document
	/// 	(minimum value returned: 0).
	/// </summary>	
	/// <param name="selector" type="String" optional="true">
	/// 	(optional, default = "*") jQuery selector specifying
	/// 	the elements to use for calculating the highest zIndex.
	/// </param>
	/// <returns type="Number">
	/// 	The minimum number returned is 0 (zero).
	/// </returns>
	
	return Math.max(0, Math.max.apply(null, $.map(((selector || "*") === "*")? $.makeArray(document.getElementsByTagName("*")) : $(selector),
		function (v) {
			return parseFloat($(v).css("z-index")) || null;
		}
	)));
};

$.fn.topZindex = function (opt) {
	/// <summary>
	/// 	Increments the CSS z-index of each element in the matched set
	/// 	to a value larger than the highest current zIndex in the document.
	/// 	(i.e., brings all elements in the matched set to the top of the
	/// 	z-index order.)
	/// </summary>	
	/// <param name="opt" type="Object" optional="true">
	/// 	(optional) Options, with the following possible values:
	/// 	increment: (Number, default = 1) increment value added to the
	/// 		highest z-index number to bring an element to the top.
	/// 	selector: (String, default = "*") jQuery selector specifying
	/// 		the elements to use for calculating the highest zIndex.
	/// </param>
	/// <returns type="jQuery" />
	
	// Do nothing if matched set is empty
	if (this.length === 0) {
		return this;
	}
	
	opt = $.extend({increment: 1}, opt);

	// Get the highest current z-index value
	var zmax = $.topZindex(opt.selector),
		inc = opt.increment;

	// Increment the z-index of each element in the matched set to the next highest number
	return this.each(function () {
		this.style.zIndex = (zmax += inc);
	});
};

})(jQuery);

// end encapsulation
})(jQuery);