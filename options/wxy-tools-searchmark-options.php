<?php

	/*
		options and documentation for WXY Tools Searchmark Plugin
		(c)2016-Present Clarence "exoboy" Bowman and Bowman Design Works.
		WXY Tools™ at http://www.wxytools.com
	*/
	
	// display admin errors in message bars
	settings_errors();
?>

<style type="txt/css">
.wxy-searchmark-content-spacer { width:100%;height:20px;position:relative;display:block;float:none;clear:both; }


</style>

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:5px;"></div>

<div class="wrap">

	<div style="width:430px;height:auto;position:relative;display:block;text-align:left;margin:20px 0px 10px 0px;"><img src="<?php echo plugins_url( "/images/wxy-tools-searchmark-options-logo.png", __FILE__ ) ?>" width="217px" height="60px" style="position:relative;display:block;margin-left:10px;" /></div>



<!-- ********************************************************************************************** -->
<!-- BEGIN NEW SECTION **************************************************************************** -->
<!-- ********************************************************************************************** -->
    
	<?php
	
		$active_tab = isset( $_GET[ 'tab' ] ) ? $_GET[ 'tab' ] : 'wxy-searchmark-tab-1';
	?>

	<h2 class="nav-tab-wrapper">
		<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-1" class="nav-tab <?php echo $active_tab == 'wxy-searchmark-tab-1' ? 'nav-tab-active' : ''; ?>">Usage Instructions</a>
		<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-2" class="nav-tab <?php echo $active_tab == 'wxy-searchmark-tab-2' ? 'nav-tab-active' : ''; ?>">Keyboard Shortcuts</a>
		<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3" class="nav-tab <?php echo $active_tab == 'wxy-searchmark-tab-3' ? 'nav-tab-active' : ''; ?>">Contribute</a>
	</h2>

<!-- ********************************************************************************************** -->
<!-- BEGIN NEW SECTION **************************************************************************** -->
<!-- ********************************************************************************************** -->

<!-- ================== -->
<!-- TAB 1 content OPEN --><div id="wxy-searchmark-tab-1" class="" style="<?php echo $active_tab == 'wxy-searchmark-tab-1' ? 'display:block;' : 'display:none;'; ?>">

<!-- section title OPEN --><div style="width:80%;height:auto;position:relative;margin:20px 0px;">

	<div style="width:100%;height:auto;line-height:20px;font-size:16px;color:#F00;box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:10px;position:relative;display:block;background-color:#0073AA;color:#FFF;text-align:center;">WXY Tools Searchmark Usage Instructions</div>

	<!-- contribute plea OPEN --><div style="width:250px;height:auto;background-color:#FFF;border:solid 1px #666;display:block;position:absolute;top:85px;right:0px;">
	
		<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-sad-cat.jpg", __FILE__ ) ?>" width="100%" height="auto" />
		<h2 style="margin:10px auto;display:block;position:relative;width:100%;text-align:center;color:#0073AA;">PLEASE CONTRIBUTE!</h2>
		<p style="display:block;position:relative;width:88%;margin:0px auto;font-size:12px;text-align:center;">Let's be honest, life is not free.<br />We need your help to continue developing great WordPress tools! Don't wait for the other person, be them! Why am I yelling? Well, because we are excited about this great utility and we think you are, too!</p>
		<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3" style="z-index:10;width:100%;height:auto;position:relative;display:block;"><div style="margin:15px auto;width:80%;height:auto;padding:9px 0px;text-align:center;color:#FFF;background-color:#0073AA;-moz-border-radius: 50px; -webkit-border-radius: 50px; -khtml-border-radius: 50px; border-radius: 50px; ">Read More / Contribute&hellip;</div></a>
	<!-- contribute plea CLOSE --></div>
<!-- section title CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:10px;"></div>
<!-- subsection title --><h2 style="color:#F00;">Table of Contents</h2>

<div style="width:320px;height:auto;position:relative;display:block;line-height:2em;left:30px;font-style:italic;">
	<a href="#wxy-searchmark-helpful-hints" style="line-height:inherit;font-style:inherit;">Helpful Hints / Chrome Users&hellip;</a><br />
	<a href="#wxy-searchmark-info-mobile" style="line-height:inherit;font-style:inherit;">Mobile/Tablet Support</a><br />
	<a href="#wxy-searchmark-info-opening" style="line-height:inherit;font-style:inherit;">Opening/Closing Searchmark</a><br />
	<a href="#wxy-searchmark-info-adminbar" style="line-height:inherit;font-style:inherit;">Searchmark Admin Bar Buttons</a><br />
	<a href="#wxy-searchmark-info-saving" style="line-height:inherit;font-style:inherit;">Saving Bookmarks</a><br />
	<a href="#wxy-searchmark-info-controls" style="line-height:inherit;font-style:inherit;">Searchmark Controls</a><br />
	<a href="#wxy-searchmark-info-bookmarking" style="line-height:inherit;font-style:inherit;">Adding Bookmarks</a><br />
	<a href="#wxy-searchmark-info-folders" style="line-height:inherit;font-style:inherit;">Folders</a><br />
	<a href="#wxy-searchmark-info-search-bookmarks" style="line-height:inherit;font-style:inherit;">Searching in Bookmarks</a><br />
	<a href="#wxy-searchmark-info-search-site" style="line-height:inherit;font-style:inherit;">Searching Your WordPress Site</a><br />
	<a href="#wxy-searchmark-info-history" style="line-height:inherit;font-style:inherit;">Searchmark History</a><br />
	<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-2" style="line-height:inherit;font-style:inherit;">Searchmark Keyboard Shortcuts</a><br />
	<a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-3" style="line-height:inherit;color:#F00;">Contribute to help maintain future improvements</a>
</div>


<!-- *************************************************************** -->

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:35px;"></div>

<!-- *************************************************************** -->

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:10px;"></div>
<!-- subsection title --><h2 style="color:#F00;">Searchmark Feature Overview</h2>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searching —</span> This utility is designed to make it easy to find any content that is stored in your WordPress website. You can do a simple search in all titles, posts, pages, slugs, and meta fields, or you can do advanced searches based on creation dates or when a post/page was last edited. You can also search by year, by status (draft, pending review, published, private), by category, by author, by tag values, and even by which theme template a page/post uses. You can also mix-and-match any of these search facets to drill down to the exact location of the content that you are looking for.</p>

	<p>Another great search function is the ability to save your search settings. If you have a search that you know you will need again-and-again, simply bookmark the search settings, and re-run them with just a click, any time!</p>

<!-- instruction block CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Bookmarking —</span> I think we are all familiar with the concept of bookmarking — it really helps when we browse the internet, but there really is no convenient way to do it from inside WordPress. Constantly looking for pages and posts with content that needs updates, can really slow down your development cycle. That's why Searchmark allows you to bookmark practically anything inside of the WordPress admin panel. If it has a URL, then it can be bookmarked. There is even a way to bookmark links from inside of pages and panels.</p>
	
	<p>Once you have created some bookmarks, you can export them, share them, duplicate them, edit them, and mange them using a built-in quick-search function in the bookmarks tab, as well as adding bookmarks to folders, which can be nested for even more organiztion.</p>
	
	<p>In addition to drag-and-drop organization tools for your bookmarks, you can color-code them and edit their titles using plain text or even by embedding HTML to style the labels any way you want.</p>

<!-- instruction block CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">History —</span> Sometimes, when you are knee-deep in a huge website, you end up jumping from page-to-page when suddenly, you realize that you need to go back to a page that you were on ten jumps ago. Well, instead of trying to remember if it was a page or a post, and then searching for it, then paging to it, now you can simply look at the history tab and see the title and time of each page you visited. Now, just scroll to the entry you want and 'click', there you are!</p>

<!-- instruction block CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Multi-User —</span> Some WordPress sites have dozens of users that sign in to work on the site's content. That's why Searchmark allows each user to have their own bookmarks list. And sharing from one user to another is as easy as copy-pasting the bookmarks you want to share, or importing an entire batch into their bookmarks list.</p>

<!-- instruction block CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Multi-Site —</span> If you have a WordPress multi-site instance installed, then Searchmark allows you to search inside of all of the website that your main admin panel manages.</p>

<!-- instruction block CLOSE --></div>

<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Keyboard Shortcuts —</span> Once you get used to Searchmark, increase your productivity even more using our built-in keyboard shortcuts. <a href="?page=wxy_searchmark_options_page&tab=wxy-searchmark-tab-2">A complete listing and explanations are on this page.</a></p>

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- subsection title --><h2 id="wxy-searchmark-info-opening" style="color:#F00;">Searchmark Usage</h2>

	<!-- = = = = = = = = = = = = = = = = = = = = = = = = = = = -->

	<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
		<p><span style="font-weight:bold;font-size:15px;">Opening/Closing Searchmark —</span> There are several ways to open and close Searchmark. Searchmark is loaded only when you are in the admin panel, so no visitors to your site will ever see this utlity, unless they are signed in to teh WordPress admin panel.</p>
	
		<p>Take a look at the diagram below for the various ways to open Searchmark.</p>
	
		<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-1.jpg", __FILE__ ) ?>" width="637px" height="507px" />

	<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-adminbar" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searchmark Admin Bar Buttons —</span> there are four components to the Searchmark admin bar button holder. The first is the open-close button labeled "Searchmark". The second is the bookmark button. When you are on a page or post that you want to bookmark, simply click the bookmark icon and it will be added to your bookmarks list.</p>
	<p>The third item is an input field that contains the current post ID (if any) of the page or post you are on. To jump to a post of a specific number, simply type it in this field and hit the return key.</p>
	<p>The last item is the pencil icon. This allows you to simply click when on a page or post in preview mode and go to its edit page.</p>
	<p>See the diagrams below for further detail on these buttons.</p>

	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-3.jpg", __FILE__ ) ?>" width="637px" height="338px" />
	
<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-saving" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Saving Bookmarks —</span> There are two different ways to save your bookmarks. The first is to manually click the "save changes" button, which will turn blue when there have been changes that are not saved yet. However, even if the button is greyed back and labeled "changes saved", you can still click it to force a manual save, just to be sure.</p>
	<p>The second way to save changes is to turn on the auto save button. This will save any changes made after a second or two of inactivity. That way, you are noy saving again-and-again-and-again unecessarilly. This button is labeled "auto save is OFF" and is deep red when inactive, but when it is on, it turns green and is labeled "auto save is ON".</p>
	
	<p>See the diagrams below for further detail on saving your bookmarks.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-2.jpg", __FILE__ ) ?>" width="637px" height="695px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-controls" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searchmark Controls —</span> Here is a handy overview of what each icon does in the Searchmark window. There is a bookmakr button, a listing of all users with bookmarking cpability, a settings menu, an autosave on/off button, a changes saved and save changes button, and a close box.</p>
	<p>See the diagrams below for further details on the locations of these controls.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-7.jpg", __FILE__ ) ?>" width="637px" height="338px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-bookmarking" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Adding Bookmarks —</span> The simplest way to add bookmarks is to click the bookmark icon when you are on a page that you want to bookmark. Once a bookmark is added, it will appear either at the top of your bookmarks list, or in the active folder. Hover over the bookmarks or folder to access its tools.</p>
	<p>Bookmarks and folders can be dragged-and-dropped, one-by-one, or in groups. So, you can change the order of your bookarks and folders simply by dragging, while you can also place bookmarks and folders inside of other folders.</p>
	<p>See the diagrams below for further detail on adding bookmarking.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-4.jpg", __FILE__ ) ?>" width="637px" height="507px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-folders" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Folders —</span> Folders, are a convenient way for site with large numbers of bookmarks to be organized. Let's say you have a bunch of pages on a single topic, like program descriptions for an online school. Well, place all those related page bookmarks into a single folder and never again have to play hide-and-seek with them by having them all mxed amongst your other bookmarks.</p>
	<p>You can also nest folders inside of other folders, as well as give them unique titles and color-code them.</p>
	<p>See the diagrams below for further detail on folders.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-5.jpg", __FILE__ ) ?>" width="637px" height="507px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-search-bookmarks" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searching in Bookmarks —</span> Some WordPress sites can be enourmous in size. So, you may end up with a lot of bookmakrs. Hopefully, you have them well-rganized, but if not, you can do a search that is limited to the bookmarks themselves. Just enter some keywords and the results will pop up in a small window. The found bookmarks will also be highlighted in red in the bookmarks tab.</p>
	<p>See the diagrams below for further details on searching your bookmarks.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-6.jpg", __FILE__ ) ?>" width="637px" height="521px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-search-site" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searching Your WordPress Site —</span> One of the greatest features of Searchmark is the ability to search in practically every dark corner and closet that is in the WordPress database for your site. There is a basic search that looks in the titles, page/post content, slugs and any associated meta data. If you need more power, then click the "advanced" button and here you can set search facets like how many keywords to match, or to look for an exact phrase, as well as looking for pages with a specific category, tag, author, date range, and much more. Searches are saved in your current session, however, to make them a permanent for bookmark, just click the "bookmark form" button, save, and it is now permanent! You can re-run the search simply by clicking its bookmark. There is also a handy form rest button that will clear out all custom settings and let you start freash.</p>
	<p>Search results are listing in ascending, alphabetical order by default, but you can change that as well. Sort by title, slug, type, creation date, modification date, status, author, category, template, or post tag.</p>
	<p>Once you have some results, hover over them to perform actions like editing the result's post, viewing its preview, changing its status, putting it in the trash, adding it as a bookmark, or selecting it, so you can perform actions on an entire group of search result post/pages.</p>
	<p>If your search returns a ton of results and you realy only need a single page of them, then simply click the bookmakr button on that set of result's page and it will save the search form using that as the starting page.</p>
	<p>See the diagrams below for further details on searching.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-8.jpg", __FILE__ ) ?>" width="637px" height="695px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div id="wxy-searchmark-info-history" class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<!-- *************************************************************** -->

<!-- instruction block OPEN --><div style="width:80%;height:auto;position:relative;margin-left:30px;display:block;">
	<p><span style="font-weight:bold;font-size:15px;">Searchmark History —</span> For those of us who need to know where we have been as much as we want to know where we are going, we have added a history of locations visited in the WordPress admin panel. Each entry can be converted into a bookmark easily, or you can click the entry be taken to that entriy's url. Very handy when you are a few pages away from somewhere you have just visited and wanted to bookmark it!</p>
	<p>See the diagrams below for further details on history entries.</p>
	
	<img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-9.jpg", __FILE__ ) ?>" width="637px" height="443px" />

<!-- instruction block CLOSE --></div>

<!-- *************************************************************** -->

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:65px;"></div>

<!-- *************************************************************** -->

<!-- section title --><div style="width:80%;height:auto;position:relative;margin:20px 0px;"><div style="width:100%;height:auto;line-height:20px;font-size:16px;color:#F00;box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:10px;position:relative;display:block;background-color:#0073AA;color:#FFF;text-align:center;">Helpful Hints</div></div>

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:10px;"></div>
<!-- subsection title --><h2 id="wxy-searchmark-helpful-hints" style="color:#F00;">Chrome Users&hellip;</h2>

<!-- instruction block BEGIN -->
<ul style="list-style-type:circle;position:relative;display:block;width:80%;margin-left:30px;">
	<li>To allow WXY Searchmark to open new tabs and windows when trying to select multiple items and edit them, you will need to change some Chrome settings.
		
		<div style="width:100%;height:15;position:relative;display:block;">&nbsp;</div>
	
		<ol>
			<li>Go to "chrome://settings/"</li>
			<li>Scroll down to and open "Advanced" settings.</li>
			<li>Click on the "Content Settings" option.</li>
			<li>Then open the "Popups" options.</li>
			<li>Under the "Allow" option you can add the URL for the website domain name you are using WXY Searchmark on.</li>
			<li>You should now be able to select multiple bookmarks and open them all at once.</li>
		</ol>
	</li>
</ul>
<!-- instruction block END -->

<!-- content spacer --><div style="width:100%;height:30;position:relative;display:block;">&nbsp;</div>
<!-- subsection title --><h2 id="wxy-searchmark-helpful-hints" style="color:#F00;">Searchmark Tips</h2>

<!-- instruction block BEGIN -->
<ul style="list-style-type:circle;position:relative;display:block;width:80%;margin-left:30px;">
		<li>Moving your mouse over to the far right of the window will make a tall bar appear. Click this to open the Searchmark panel. You can also open and close the panel using the Searchmark button in the admin toolbar.</li>
		<li>Selecting more than one Searchmark item in a tab and then clicking an action button like delete, copy, view, or settings, will perform that action on all selected items.</li>
		<li>When a folder has a colored highlight on the left side of it, it means that this is the currently active folder. Anything you add will appear here instead of in the main bookmark area.</li>
		<li>When duplicating more than one item, it is placed in a folder at the top of your bookmarks list, or at the top of the list in the currently active folder.</li>
		<li>Searches in the search tab are saved in the current session and are cleared after you sign out. A bookmark icon appears on the right side of each search result page-bar so you can bookmark just that page, or you can bookmark the entire search by using the bookmark icon that is in the actual search form.</li>
	</ul>
<!-- instruction block END -->


<!-- content spacer --><div style="width:100%;height:30;position:relative;display:block;">&nbsp;</div>
<!-- subsection title --><h2 id="wxy-searchmark-info-mobile" style="color:#F00;">Mobile/Tablet Support</h2>

<!-- instruction block BEGIN -->
<ul style="list-style-type:circle;position:relative;display:block;width:80%;margin-left:30px;">
		<li>Most of the main functions of Searchmark are available via mobile and tablet</li>
		<li>However, due to the limited number of mobile users right now, these devices are not yet fully supported</li>
		<li>For full functionality, use it on a desktop or laptop</li>
	</ul>
<!-- instruction block END -->

<!-- TAB 1 content CLOSE --></div>

<!-- ********************************************************************************************** -->
<!-- BEGIN NEW SECTION **************************************************************************** -->
<!-- ********************************************************************************************** -->

<!-- ================== -->
<!-- TAB 2 content OPEN --><div id="wxy-searchmark-tab-2" class="" style="<?php echo $active_tab == 'wxy-searchmark-tab-2' ? 'display:block;' : 'display:none;'; ?>">

<div style="width:80%;height:auto;position:relative;margin:20px 0px;"><div style="width:100%;height:auto;line-height:20px;font-size:16px;color:#F00;box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:10px;position:relative;display:block;background-color:#0073AA;color:#FFF;text-align:center;">Searchmark Keyboard Shortcuts &amp; Tips</div>
	
	<div style="width:100%;height:30;position:relative;display:block;">&nbsp;</div>
			
		<ul style="list-style-type:circle;position:relative;display:block;width:80%;margin:0px auto;">

		<h3 style="color:#F00;">Mac Shortcuts</h3>
		<li>SHIFT + CMD + A &nbsp; [Select/unselect all items in tab or folder]</li>
		<li>CMD + click &nbsp; [Select/unselect one item in tab or folder]</li>
		<li>OPTION + clicking folder open/close buttons &nbsp; [This will open or close all folders in the bookmarks tab]</li>
		<li>CMD + C [Copies Searchmark items that have been selected]</li>
		<li>CMD + V [Pastes copied Searchmark items into the currently active group or bookmarks tab]</li>
		<li>CMD + B [Opens/closes Searchmark\'s panel]</li>
		<li>OPTION + CMD + (click) [Turns any link, anywhere, into a bookmark entry]</li>
	
		<div style="width:100%;height:30;position:relative;display:block;">&nbsp;</div>
			
		<h3 style="color:#F00;">PC Shortcuts</h3>
		<li>SHIFT + CTRL + A  [Select/unselect all items in tab or folder]</li>
		<li>CTRL + click &nbsp; [Select/unselect one item in tab or folder]</li>
		<li>CTRL + C [Copies Searchmark items that have been selected]</li>
		<li>CTRL + V [Pastes copied Searchmark items into the currently active group or bookmarks tab]</li>
		<li>CTRL + B [Opens/closes Searchmark\'s panel]</li>
		<li>???? + ??? + (click) [Turns any link, anywhere, into a bookmark entry]</li>
			
		<div style="width:100%;height:30;position:relative;display:block;">&nbsp;</div>
			
		<h3 style="color:#F00;">Searchmark Tips</h3>
		<li>Moving your mouse over to the far right of the window will make a tall bar appear. Click this to open the Searchmark panel. You can also open and close the panel using the Searchmark button in the admin toolbar.</li>
		<li>Selecting more than one Searchmark item in a tab and then clicking an action button like delete, copy, view, or settings, will perform that action on all selected items.</li>
		<li>When a folder has a colored highlight on the left side of it, it means that this is the currently active folder. Anything you add will appear here instead of in the main bookmark area.</li>
		<li>When duplicating more than one item, it is placed in a folder at the top of your bookmarks list, or at the top of the list in the currently active folder.</li>
		<li>Searches in the search tab are saved in the current session and are cleared after you sign out. A bookmark icon appears on the right side of each search result page-bar so you can bookmark just that page, or you can bookmark the entire search by using the bookmark icon that is in the actual search form.</li>

	</ul>
	
	
	</div>
	
<!-- TAB 2 content CLOSE --></div>

<!-- ********************************************************************************************** -->
<!-- BEGIN NEW SECTION **************************************************************************** -->
<!-- ********************************************************************************************** -->

<!-- ================== -->
<!-- TAB 3 content OPEN --><div id="wxy-searchmark-tab-3" class="nau-content-central-report-tab programs_explorer" style="<?php echo $active_tab == 'wxy-searchmark-tab-3' ? 'display:block;' : 'display:none;'; ?>">

<!-- section title OPEN --><div style="width:80%;height:auto;position:relative;margin:20px 0px;"><div style="width:100%;height:auto;line-height:20px;font-size:16px;color:#F00;box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:10px;position:relative;display:block;background-color:#0073AA;color:#FFF;text-align:center;">Contribute for the Future</div></div>

<!-- happy cat --><div style="width:80%;height:190px;text-align:center;background-color:#FFF;display:block;position:relative;"><img src="<?php echo plugins_url( "/images/instructions/searchmark-instructions-happy-cat.jpg", __FILE__ ) ?>" width="354px" height="190px" style="display:block;position:relative;margin:0px auto;" /></div>

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:10px;"></div>

<div style="width:80%;height:auto;text-align:left;display:block;position:relative;">

<div style="width:280px;height:auto;text-align:center;display:block;position:relative;float:right;background-color:#FFF;border:solid 1px #666;padding:20px;margin-left:30px;font-style:italic;color:#0073AA;">

Click the donate button and you will be taken to PayPal.com — your contribution will appear on your statement as payable to Bowman Design Works (our parents). You will also be asked to specify an amount. Please contribute whatever you feel this plugin is worth to you —  whether it is a dollar, five dollars, or whatever. Thanks!

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:15px;"></div>

<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="9UKP9PGDGGM98">
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
</form>
Item Number: BDW-WXY-SEARCHMARK

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:20px;"></div>

<span style="width:80%;display:block;position:relative;margin:0px auto;color:#F00;">After you contribute, you will receive a registration code via the email<br />you paid with. Enter it here<br />and you are registered!</span>

<!-- content spacer --><div class="wxy-searchmark-content-spacer" style="height:10px;"></div>

<?php

	// ---------------------------------------------------------
	// REGISTERED: see if the user is registered and the code is valid...
	// ---------------------------------------------------------	
	$registration_option = esc_attr( get_option( 'wxy_searchmark_registration_code' ) );
	$registration_input = isset( $_GET[ "wxy-searchmark-registration-code" ] ) ? $_GET[ "wxy-searchmark-registration-code" ] : NULL;
	$registration_input = sanitize_text_field( $registration_input );
	
	$form_start = '<form action="" type="GET"><input type="hidden" name="page" value="wxy_searchmark_options_page" /><input type="hidden" name="tab" value="wxy-searchmark-tab-3" /><input id="wxy-searchmark-registration-code" name="wxy-searchmark-registration-code" type="text" class="wxy-searchmark-registration-code" style="display:block;position:relative;width:100%;height:auto;padding:5px 8px;margin:0px auto;" value="';
	$form_end = '" /><input type="submit" name="submit_btn" value="validate code" style="margin:7px auto;" /></form>';

	// check to see if there is something saved and if it is valid
	switch (true)
	{
		case ( !isset( $registration_option ) || strlen( $registration_option ) <= 0 ) && isset( $registration_input ):
		
			// they entered a new code, validate it and if it is okay, show it, otherwise show a message
			$form = $form_start . $registration_input . $form_end;
		
			$registration_option = $registration_input;
			
			// CREATE: set up our initial autosave for this user!
			if( !add_option( 'wxy_searchmark_registration_code', $registration_option ) )
			{
				update_option( 'wxy_searchmark_registration_code', $registration_option );
			}
			
			break;
		
		case isset( $registration_option ) && isset( $registration_input ) && $registration_option != $registration_input:
		
			// they entered a new code, validate it and if it is okay, show it, otherwise show a message
			$form = $form_start . $registration_input . $form_end;
		
			$registration_option = $registration_input;
			
			// CREATE: set up our initial autosave for this user!
			if( !add_option( 'wxy_searchmark_registration_code', $registration_option ) )
			{
				update_option( 'wxy_searchmark_registration_code', $registration_option );
			}			
			break;
		
		case isset( $registration_option ) && strlen( $registration_option ) > 0:
		
			// a code is saved, but not displayed, so show it!
			$form = $form_start . $registration_option . $form_end;
			break;
		
		default:
		
			$form = $form_start . $form_end;
		
	}
	
	// show the form...
	echo $form;
	
	// now, take the saved option and see if it is valid!
	$code = base64_decode( $registration_option );

	//echo var_dump( preg_match( "/^[A-Z0-9._%\+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,4}$/", $code, $matches ) );
	$valid = preg_match( "/^[A-Z0-9\._%\+\-]+@[A-Z0-9\.\-]+\.[A-Z]{2,4}$/i", $code );

	if( $valid )
	{
		echo "<br />You are registered!";
	} else {
		echo "Please enter a valid code.";
	}

?>
</div>


<h2>Thanks to Contributors!</h2>

<p>For those who contribute, you are the ones helping to make sure that future improvements and updates are posssible.</p>
<p>New features, bug fixes, and new products all help to create a better WordPress development experience. And as a way of thanking those that contribute, we offer the following benefits&hellip;</p>

<p><a href="https://www.wxytools.com">To contact us, visit us online at wxytools.com</a></p>
<div style="height:15px;"></div>

<h3>Benefits for Contributors</h3>
<ul style="list-style-type:circle;position:relative;display:block;width:500px;margin:0px 0px 0px 30px;">
	<li>Immediate notification of any critical bug reports, or fixes</li>
	<li>Direct email support for technical issues instead of using the WordPress plugin forum and praying that you hear from us before your deadline</li>
	<li>Knowledge that you are not one of those people who uses something for free, then complains when it's no longer updated due to lack of user support</li>
	<li>A unicorn! Sorry, not really&hellip;</li>
	<li>An easy way to contact us with suggestions for improvements</li>
	<li>Special offers and discounts on any future products</li>
	<li>We'll notify you when a new version of WordPress is released and we have tested Searchmark to assure compatibility</li>
	<li>Access to a library of legacy versions of Searchmark, just in case you need them</li>
	<li>And finally&hellip; our gratitude!</li>
</ul>
</div>
<!-- TAB 3 content CLOSE --></div>

<!-- ********************************************************************************************** -->
<!-- BEGIN NEW SECTION **************************************************************************** -->
<!-- ********************************************************************************************** -->

<!-- WP wrap CLOSE --></div>
