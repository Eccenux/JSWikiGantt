<?php

class ecJSGantt
{
	var $strInlineOutputMarker;		// marker for the inline output of scripts (=$wgJSGanttInlineOutputMarker)
	var $strSelfDir;				// this extension directory
	
	var $isInline = false;
	var $isExternal = false;
	
	//
	// Basic setup
	//
	function __construct()
	{
		global $wgJSGanttConfig, $wgParser, $wgHooks, $wgScriptPath, $wgJSGanttInlineOutputMarker, $wgParserOutputHooks;
		
		// hook <jsgantt> tag for this extension
		$wgParser->setHook('jsgantt', array($this, 'render'));
		
		// to decode script content after "Tidy"
		$wgHooks['ParserAfterTidy'][] = array($this, 'inlineOutput');
		// this is a hook to add CSS and JS
		$wgParserOutputHooks['ecJSGantt'] = array($this, 'outputHook');
		
		// init variables/attributes
		$this->isHeadDone = false;
		$this->strInlineOutput = '';
		$this->config = $wgJSGanttConfig;
		$this->strInlineOutputMarker = $wgJSGanttInlineOutputMarker;
		$this->strSelfDir = "{$wgScriptPath}/extensions/JSWikiGantt";
	}

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
		$strRendered = '';
		
		// load from some other article
		if (!empty($args['loadxml']) && !empty($this->config['ExternalXMLEnabled']) && !$this->isInline && !$this->isExternal)
		{
			$this->isExternal = true;
			$strRendered = $this->renderXMLLoader($input, $args, $parser, $frame);
		}
		// build from content
		else if (!$this->isInline && !$this->isExternal)	// yes, currently only one per page
		{
			$this->isInline = true;
			$strRendered = $this->renderInnerXML($input, $args, $parser, $frame);
		}

		// add css and js
		//$this->setupHeaders();
		if (!$this->isHeadDone)
		{
			$parser->mOutput->addOutputHook( 'ecJSGantt' );	// defined in the JSWikiGantt.php as wgParserOutputHooks
			$this->isHeadDone = true;
		}
		
		// ret renedered HTML
		return $strRendered;
	}

	//
	// Render our tag for the purpouse of loading an external XML
	//
	function renderXMLLoader ($input, $args, $parser, $frame)
	{
		//$out = $parser->recursiveTagParse($input, $frame);
		$out = $parser->replaceInternalLinks($input, $frame);	// just parse links
		return ''
			.Html::linkedScript( $this->getCSSJSLink("jsgantt_loader.js") )
			.'<div id="GanttChartDIV">'
				.$out
			.'</div>'
		;
	}

	//
	// Escapes XML string from user for JS
	//
	function escapeXMLString4JS ($value)
	{
		// quite simple for now - might want to allow html inside tags...
		return htmlspecialchars($value);
	}
	
	//
	// Gets integer value from the task item
	// TODO: get content of the tag given by valName or an attribute with the same name
	function getXMLIntVal ($task, $valName, $defaultVal)
	{
		// quite simple for now - might want to allow html inside tags...
		$val = intval(@$task->getElementsByTagName($valName)->item(0)->nodeValue);
		if(empty($val))
		{
			return $defaultVal;
		}
		return $val;
	}
	//
	// Gets string value from the task item
	// TODO: get content of the tag given by valName or an attribute with the same name
	function getXMLStrVal ($task, $valName, $defaultVal)
	{
		// quite simple for now - might want to allow html inside tags...
		$val = $this->escapeXMLString4JS(@$task->getElementsByTagName($valName)->item(0)->nodeValue);
		if(empty($val))
		{
			return $defaultVal;
		}
		return $val;
	}

	//
	// Render contents of our tag to display the diagram more directly
	//
	function renderInnerXML ($input, $args, $parser, $frame)
	{
		$doc = new DOMDocument();
		/*
		// DEBUG
		echo "<pre style='position:absolute; top:2em; right:0; width:200px; overflow:scroll; z-index:100' onclick='this.style.display=\"none\"'>"
			.htmlspecialchars(var_export($args, true))
			.htmlspecialchars($input)
		."</pre>"
		;
		*/
		@$doc->loadXML('<root>'.$input.'</root>');

		$tasks = @$doc->documentElement->getElementsByTagName("task");
		
		if ($tasks->length==0)
		{
			// TODO error message
			return '';
		}
		
		// should we add links to details of tasks?
		$isAddAutoLinks = !isset($args['autolink']) ? '' : $args['autolink'];
		$isAddAutoLinks = strlen($isAddAutoLinks) ? intval($isAddAutoLinks) : $this->config['AutoLinks'];
		
		// prepare script contents
		$strScript = '';
		for ($i = 0; $i < $tasks->length; $i++)
		{
			// The ID is required!
			$pID = intval(@$tasks->item($i)->getElementsByTagName("pID")->item(0)->nodeValue);
			if(empty($pID))
			{
				// TODO some error message here?
				continue;
			}
			
			// check if auto link should be added
			$isAddAutoLink = @$tasks->item($i)->getAttribute('autolink');
			if ($isAddAutoLink=='')
			{
				$isAddAutoLink = $isAddAutoLinks;
			}
			else
			{
				$isAddAutoLink = !empty($isAddAutoLink) ? true : false;
			}
			
			// other values
			$pName = $this->getXMLStrVal($tasks->item($i), "pName", "No Task Name");	// TODO: Allow HTML/Wiki here?
			$pColor = $this->getXMLStrVal($tasks->item($i), "pColor", "0000ff");
			$pParent = $this->getXMLIntVal($tasks->item($i), "pParent", 0);
			$pStart = $this->getXMLStrVal($tasks->item($i), "pStart", "");
			$pEnd = $this->getXMLStrVal($tasks->item($i), "pEnd", "");
			$pLink = $this->getXMLStrVal($tasks->item($i), "pLink", "");
			$pMile = $this->getXMLIntVal($tasks->item($i), "pMile", 0);
			$pRes = $this->getXMLStrVal($tasks->item($i), "pRes", "");		// resource
			$pComp = $this->getXMLIntVal($tasks->item($i), "pComp", 0);
			$pGroup = $this->getXMLIntVal($tasks->item($i), "pGroup", 0);
			$pOpen = $this->getXMLIntVal($tasks->item($i), "pOpen", 1);
			$pDepend = $this->getXMLStrVal($tasks->item($i), "pDepend", '');
			$pCaption = $this->getXMLStrVal($tasks->item($i), "pCaption", '');
			
			// Add auto link
			if ($isAddAutoLink && empty($pLink))
			{
				$pLink = str_replace('%GANTT_TASK_ID%', $pID, $this->config['TasksAutoLink']);
			}
			
			// Finally add the task
			$strScript .= "\noJSGant.AddTaskItem(new JSGantt.TaskItem("
				."{$pID}, '{$pName}', "
				."'{$pStart}', '{$pEnd}', "
				."'{$pColor}', "
				."'{$pLink}', "
				."{$pMile}, "
				."'{$pRes}', "
				."{$pComp}, "
				."{$pGroup}, "
				."{$pParent}, "
				."{$pOpen}, "
				."'{$pDepend}', "
				."'{$pCaption}'"
			."))";
		}
		
		// prepare script header
		if (!empty($strScript))
		{
			$strScript = ''
				.'<script>'
					."\noJSGantInline.init()"
					."\n$strScript"
					."\noJSGantInline.draw();"
				."\n</script>"
			;
			$this->strInlineOutput = $strScript;
			return ''
				.Html::linkedScript( $this->getCSSJSLink("jsgantt_inline.js") )
				.'<div id="GanttChartInline"></div>'
				//.$strScript
				.$this->strInlineOutputMarker;
			;
		}
		// nothing to output
		else
		{
			return '';
		}
	}

	//
	// Gets "link" (URL path) for the given extension's script
	//
	function getCSSJSLink($strFileName)
	{
		global $wgJSGanttScriptVersion;
		
		return "{$this->strSelfDir}/{$strFileName}?{$wgJSGanttScriptVersion}";
	}

	//
	// "Decode" script content after "Tidy"...
	//
	function inlineOutput($parser, &$text)
	{
		$text = str_replace($this->strInlineOutputMarker, $this->strInlineOutput, $text);
		return true;
	}

	//
	// Setup our additional styles and scripts
	//
	function setupHeaders($outputPage)
	{
		global $wgJSGanttConfig;
		
		if ( $outputPage->hasHeadItem( 'jsganttCSS' ) && $outputPage->hasHeadItem( 'jsganttJS' )
			&& $outputPage->hasHeadItem( 'jsganttDateJS' ) )
		{
			return;
		}
		
		//echo "test:".$this->getCSSJSLink("test.js");
		
		$outputPage->addHeadItem('jsganttCSS' , Html::linkedStyle( $this->getCSSJSLink("jsgantt.css") ) );
		$outputPage->addHeadItem('jsganttJS' , Html::linkedScript( $this->getCSSJSLink("jsgantt.js") ) );
		$outputPage->addHeadItem('jsganttDateJS' , Html::linkedScript( $this->getCSSJSLink("date-functions.js") ) );
		
		/*
		// Only works out of cash => has to be moved to the output
		if ($this->isInline )
		{
			$outputPage->addHeadItem('jsganttInlineJS' , Html::linkedScript( "{$thisExtPath}/jsgantt_inline.js?$wgJSGanttScriptVersion" ) );
		}
		else if ($this->isExternal && !empty($wgJSGanttConfig['ExternalXMLEnabled']))
		{
			$outputPage->addHeadItem('jsganttLoaderJS' , Html::linkedScript( "{$thisExtPath}/jsgantt_loader.js?$wgJSGanttScriptVersion" ) );
		}
		*/
	}

	//
	// Output Hook as seen in OggHandler by Tim Starling :-)
	//
	function outputHook( $outputPage, $parserOutput, $data )
	{
		global $wgScriptPath;
		
		$this->setupHeaders($outputPage);
	}
}