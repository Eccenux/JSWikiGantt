<?php

class ecJSGantt
{
	//
	// Parse <jsgantt> content and arguments
	//
	/*
	$input - Input between the <jsgantt> and </jsgantt> tags, or null if the tag is "closed", i.e. <jsgantt />
	$args - associative array of attrs of the tag (indexed by lower cased attribute name).
	$parser - not needed
	$frame - not needed
	*/
	function render ($input, $args, $parser, $frame)
	{
		// not working outside preview :-(
		//efJSGanttSetupHead();
		$this->setupHeaders();
		
		// load from article
		if (!empty($args['loadxml']))
		{
			//$out = $parser->recursiveTagParse($input, $frame);
			$out = $parser->replaceInternalLinks($input, $frame);
			//die ($out);
			return ''
				.'<div class="gantt" id="GanttChartDIV">'
					.$out
				.'</div>'
			;
		}
		
		// change input from X to javascript and surround with tags: <scripit></scripit>
		return '<p class="gantt">test</p>';
		// test
		//return '<script type="text/javascript">alert("abc")</script>';// our output here (as a "string")
	}

	//
	// Setup additional styles and scripts
	//
	function setupHeaders()
	{
		global $wgOut, $wgScriptPath;
		$wgOut->addExtensionStyle("{$wgScriptPath}/extensions/JSWikiGantt/jsgantt.css");
		$wgOut->addScript("<script src='{$wgScriptPath}/extensions/JSWikiGantt/date-functions.js'></script>");
		$wgOut->addScript("<script src='{$wgScriptPath}/extensions/JSWikiGantt/jsgantt.js'></script>");
		$wgOut->addScript("<script src='{$wgScriptPath}/extensions/JSWikiGantt/jsgantt_loader.js'></script>");
		
		// change input from X to javascript and add sourround with tags: <scripit></scripit>
		// test
		//return '<script type="text/javascript">alert("abc")</script>';// our output here (as a "string")
	}
}