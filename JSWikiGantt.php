<?php
/**
	JSWikiGantt - Gantt diagrams drawing extension based on:
	* JSGantt code by Shlomy Gantz BlueBrick Inc
	* Xaprb JavaScript date formatting by Baron Schwartz
 
	To activate this extension, add the following into your LocalSettings.php file:
	require_once('$IP/extensions/JSWikiGantt/JSWikiGantt.php');
	
	@ingroup Extensions
	@author Maciej Jaros <egil@wp.pl> and others (see description)
	@version 0.0.1
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
	'path'         => __FILE__,
	'name'         => 'JSWikiGantt',
	'version'      => '0.0.1',
	'author'       => 'Maciej Jaros and others (see description)', 
	'url'          => 'http://www.mediawiki.org/wiki/Extension:JSWikiGantt',
	'description'  => ''
		+'This extension adds a <jsgantt> tag in which you can define a Gantt diagram data to be drawn. Currently only one diagram per page.'
		+'\nNote! This extension is based on JSGantt project started by Shlomy Gantz and Xaprb JavaScript date formatting by Baron Schwartz.'
		+'\nSee jsgantt.js and date-functions.js for licensing details of this modules.'
);

//
// Class setup
//
$wgJSGanttDir = dirname(__FILE__);
$wgAutoloadClasses['ecJSGantt'] = "{$wgJSGanttDir}/JSGantt.body.php";

//
// add hook setup and hook <jsgantt> tag for this extension
//
$wgHooks['ParserFirstCallInit'][] = 'efJSGanttSetup';
function efJSGanttSetup( &$parser )
{
	efJSGanttSetupHead();
	$parser->setHook( 'jsgantt', array('ecJSGantt', 'render') );
	return true;
}

//
// Functions
//
require_once("$IP/extensions/JSWikiGantt/JSWikiGantt.body.php");
