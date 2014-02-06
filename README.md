JSWikiGantt
===========

This is a MediaWiki extension that aims to allow adding Gantt charts (diagrams) to wiki pages without the need of exporting diagrams to PNG.

For more info please see:
https://www.mediawiki.org/wiki/Extension:JSWikiGantt

Installation
------------

1. Download the extension files and place them under <tt>extensions/JSWikiGantt</tt>
2. At the end of LocalSettings.php, add:
	`require_once("$IP/extensions/JSWikiGantt/JSWikiGantt.php");`
3. Installation can now be verified through <tt>Special:Version</tt> on your wiki
4. If you use apache's `mod_rewrite` to beautify your wiki's URLs you need to add a RewriteCond to apache's config to exclude the path to your JSWikiGantt installation from rewriting. Example: ```RewriteCond %{REQUEST_URI} !^/YOUR_WIKI_PATH/extensions/(JSWikiGantt|MORE_EXTENSIONS_THAT_NEED_TO_LOAD_JS-FILES_FROM_THEIR_PATH)/```
