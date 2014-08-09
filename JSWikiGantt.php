<?php
/**
	JSWikiGantt - Gantt diagrams drawing extension based on:
	* JSGantt code by Shlomy Gantz BlueBrick Inc
	* Xaprb JavaScript date formatting by Baron Schwartz
 
	To activate this extension, add the following into your LocalSettings.php file:
	require_once("$IP/extensions/JSWikiGantt/JSWikiGantt.php");
	
	Note!
		PHP 5.1 or higher is required for this extension (needed for the XML/DOM functions and some class specifc stuff).
	
	@ingroup Extensions
	@author Maciej Jaros <egil@wp.pl> and others (see description)
	@link http://www.mediawiki.org/wiki/Extension:JSWikiGantt
	@license http://www.gnu.org/copyleft/gpl.html GNU General Public License 2.0 or later
*/
 
/**
 * Protect against register_globals vulnerabilities.
 * This line must be present before any global variable is referenced.
 */
if( !defined( 'MEDIAWIKI' ) ) {
	echo( "This is an extension to the MediaWiki package and cannot be run standalone.\n" );
	die( -1 );
}

//
// Extension credits that will show up on Special:Version
//
$wgExtensionCredits['parserhook'][] = array(
	'path'           => __FILE__,
	'name'           => 'JSWikiGantt',
	'version'        => '0.5.7',
	'author'         => 'Maciej Jaros and others (see description)', 
	'url'            => 'http://www.mediawiki.org/wiki/Extension:JSWikiGantt',
	'descriptionmsg' => 'jswikigantt-desc',	// in i18n
);

//
// Absolute path
//
$wgJSGanttDir = rtrim( dirname( __FILE__ ), "/\ " );

//
// Configuration file
//
require_once ( "{$wgJSGanttDir}/JSWikiGantt.config.php" );

//
// Class setup
//
$wgAutoloadClasses['ecJSGantt'] = "{$wgJSGanttDir}/JSWikiGantt.body.php";
$wgExtensionMessagesFiles['JSWikiGantt'] = "{$wgJSGanttDir}/JSWikiGantt.i18n.php";

//
// add hook setup and init class/object
//
$wgHooks['ParserFirstCallInit'][] = 'efJSGanttSetup';
function efJSGanttSetup( &$parser ) {
	// other hooks are added upon construct
	new ecJSGantt;
	
	//wfLoadExtensionMessages( 'JSWikiGantt' );
	//$wgExtensionMessagesFiles['JSWikiGantt'] = dirname( __FILE__ ) . '/JSWikiGantt.i18n.php';
	
	return true;
}