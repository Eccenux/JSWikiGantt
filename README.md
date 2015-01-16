JSWikiGantt
===========

This is a MediaWiki extension that aims to allow adding Gantt charts (diagrams) to wiki pages without the need of exporting diagrams to PNG.

For more info please see:
https://www.mediawiki.org/wiki/Extension:JSWikiGantt

Options
------------

As of `0.6.0` you can set some extra Gantt options from MediaWiki code e.g.:
```xml
<jsgantt option-caption-type="Complete" option-show-resource="1" option-show-duration="1">
...
</jsgantt>
```

### Available options ###
* `option-show-responsible` - show responsible column (defaults to 0 - hidden)
* `option-show-duration` - show duration column (defaults to 0 - hidden)
* `option-show-precent-complete` - show precent complete column (defaults to 0 - hidden)
* `option-show-start-date` - show start date column (defaults to 0 - hidden)
* `option-show-end-date` - show end date column (defaults to 0 - hidden)
* `option-caption-type` - task caption (right side annotation) type. Avialbale types: None, Caption, Resource (default), Duration, Complete.

### MediaWiki 1.16 ###
*Note!* Those options will NOT work in MediaWiki 1.16 or lower. You need to patch `includes/Sanitizer.php` by changing:
```php
$attrib = '[A-Za-z0-9]';
```
to:
```php
$attrib = '[A-Za-z0-9\-]';
```

Installation
------------

1. Download the extension files and place them under <tt>extensions/JSWikiGantt</tt>
2. At the end of LocalSettings.php, add:
	`require_once("$IP/extensions/JSWikiGantt/JSWikiGantt.php");`
3. Installation can now be verified through <tt>Special:Version</tt> on your wiki
4. If you use apache's `mod_rewrite` to beautify your wiki's URLs you need to add a RewriteCond to apache's config to exclude the path to your JSWikiGantt installation from rewriting. Example: ```RewriteCond %{REQUEST_URI} !^/YOUR_WIKI_PATH/extensions/(JSWikiGantt|MORE_EXTENSIONS_THAT_NEED_TO_LOAD_JS-FILES_FROM_THEIR_PATH)/```
