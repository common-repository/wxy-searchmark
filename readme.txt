=== Plugin Name ===
Contributors: exoboy
Plugin Name: WXY Searchmark
Plugin URI: https://wxytools.com/
Author URI: https://wxytools.com/
Author: WXY Tools
Tags: search, admin tools, developer, bookmarking, organize
Donate link: http://www.wxytools.com/contribute
Requires at least: 5.0
Tested up to: 5.5.3
Requires PHP: 5.0
Stable tag: 1.0.9
Version: 1.0.9
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

An admin panel bookmarking tool that allows you to search your entire WordPress database and all of its data with advanced search then create, organize and use bookmarks to get to any area that has a URL, including page/post editing and previewing.

== Description ==
(See screenshots below)

BOOKMARKING — I think we are all familiar with the concept of bookmarking — it really helps when we browse the internet, but there really is no convenient way to do it from inside WordPress. Constantly looking for pages and posts with content that needs updates, can really slow down your development cycle. That's why Searchmark allows you to bookmark practically anything inside of the WordPress admin panel. If it has a URL, then it can be bookmarked. There is even a way to bookmark links from inside of pages and panels.

Once you have created some bookmarks, you can export them, share them, duplicate them, edit them, and manage them using a built-in quick-search function in the bookmarks tab, as well as adding bookmarks to folders, which can be nested for even more organization.

In addition to drag-and-drop organization tools for your bookmarks, you can color-code them and edit their titles using plain text or even by embedding HTML to style the labels any way you want.

SEARCH - Ever spend 20, 40, 60 moinutes looking for that one instance of a particular piece of content in your site that needs to be changed? I think most of us have. WXY Searchmark has deep search capabilities. Search in titles, slugs, content, meta data, by date, practically any data type. If it's in WordPress, it can be found with WXY Searchmark. Search criteria can also be saved and re-run with a single click.

HISTORY — Sometimes, when you are knee-deep in a huge website, you end up jumping from page-to-page when suddenly, you realize that you need to go back to a page that you were on ten jumps ago. Well, instead of trying to remember if it was a page or a post, and then searching for it, then paging to it, now you can simply look at the history tab and see the title and time of each page you visited. Now, just scroll to the entry you want and 'click', there you are!

MULTI-USER — Some WordPress sites have dozens of users that sign in to work on the site's content. That's why Searchmark allows each user to have their own bookmarks list. And sharing from one user to another is as easy as copy-pasting the bookmarks you want to share, or importing an entire batch into their bookmarks list.

MULTI-SITE — If you have a WordPress multi-site instance installed, then Searchmark allows you to search inside of all of the websites that your main admin panel manages.

Keyboard Shortcuts — Once you get used to Searchmark, increase your productivity even more using our built-in keyboard shortcuts.

== Installation ==
Automatic Plugin Installation

To add a WordPress Plugin using the built-in plugin installer:
1. Go to Plugins > Add New.

2. Type in the name of the WordPress Plugin or descriptive keyword, author, or tag in Search Plugins box or click a tag link below the screen.

3. Find the WordPress Plugin you wish to install.

4. Click Details for more information about the Plugin and instructions you may wish to print or save to help setup the Plugin.

5. Click Install Now to install the WordPress Plugin.

6. The resulting installation screen will list the installation as successful or note any problems during the install.

7. If successful, click Activate Plugin to activate it, or Return to Plugin Installer for further actions.

== Frequently Asked Questions ==

= Who needs this plugin? =

This plugin in most useful to developers, or anyone who has to work inside of large WordPress websites.

== Screenshots ==

1. WXY Searchmark Bookmarks Tab
2. WXY Searchmark Search Tab
3. WXY Searchmark History Tab

== Changelog ==

= 1.0.9 =
* Fixed dragging issue which prevented users from dragging bookmarks out of folders.

= 1.0.8 =
* Some PHP installations did not have the mb_ library installed which meant calling teh function mb_strimwidth would cause a fatal error (500). I switched it to a substr call for greater compatibility with standard PHP installations.

= 1.0.6 =
* Fixed infinite scroll feature in search tab that would sometimes stop functioning after the window lost focus and was brought back in to focus.
* Fixed sensitivity issue with some touchpads that was not allowing the bookmarks to be cliked like a link to edit its page.
* Namespaced form fields to prevent possible conflicts with other admin plugins that might try to use names like "page" or "limit".
* Fixed an issue where an advanved search form select menu would go blank by removing the selected flag from all options it contained, making the menu appear blank.

= 1.0.4 =
* Added ability to view any amount of search result url's in a alert in window as HTML links with descriptions.

= 1.0.3 =
* Fixed undefined variable error when deactivating this plugin.
* Tested compatibility with WordPress 5.0
* Fixed importing bookmarks - zip file type was not selectable in import form file selector, and imported HTML entities were not being escaped properly and were appearing as plain text
* Changed review button to take you directly to the WordPress plugin repository review page at https://wordpress.org/support/plugin/wxy-searchmark/reviews/#new-post
* Fixed drag-and-drop issue: when searching for keywords within the bookmarks themselves, then dragging a result and dropping anywhere but a valid drop target, would cause the red-highlighted original in the bookmarks browser window to disappear.
* Changing the page/post status in search results tab, sometimes mislabeled the status until the page was refreshed. Labels now update properly.

= 1.0.2 =
* Fixed minor UI issue
* Prevented plugin CSS from loading into client-side when viewing site outside of the admin area. 

== Upgrade Notice ==

= 1.0 =
Please contribute today and you will be helping to keep this and other great plugin development projects going! Also, by contributing, you will be the first to hear about upcoming bug fixes, compatibility updates, as well be able to ask us questions directly and make feature suggestions!

= 1.0.2 =
Fixed minor UI issue and prevented plugin CSS from loading into client-side when viewing site outside of the admin area.

== Copyright ==
WXY Searchmark is Copyright 2017 Clarence "exoboy" Bowman and Bowman Design Works.com
WXY Searchmark is distributed under the terms of the GNU GPL

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
