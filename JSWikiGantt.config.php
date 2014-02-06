<?php

$wgJSGanttConfig = array(
	// You might want to disable this (set to 0) due to possible security issues with the external XML loader.
	'ExternalXMLEnabled' => 1,
	
	//
	// Configuration for inline mode
	//
	
	// Automaticaly add links
	// might be overrriden from XML with <jsgantt autolinks="1"> or <task autolink="1">)
	'AutoLinks' => 1,
	// The link format for above. It needs to be 'something.something/script?my_task_id_param=%GANTT_TASK_ID% something else might follow'
	'TasksAutoLink' => 'http://prl.mol.com.pl/bugz/index.php?do=details&task_id=%GANTT_TASK_ID%',
);

// change this to bypass cash and in effect refresh CSS and JS
$wgJSGanttScriptVersion = "1";

// marker - this should not be changed unless there is a clash whith other extenesions
$wgJSGanttInlineOutputMarker = '<!--##GanttChartInlineOutput##-->';