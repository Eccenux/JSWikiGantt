<?php
/**
	Main JSWikiGantt extension class
*/
class ecJSGantt {
	public $strSelfURLBase;                           //<! this extension base URL (virtual path)
	public $strSelfDir;                               //<! this extension directory (physical path)
	public $strJSi18nFile = 'jsgantt_i18n_%lang%.js'; //<! js lang file save path (cache)
	                                                  //<! @note should be this extension based

	private $strInlineOutputMarker;                   //<! marker for the inline output of scripts (=$wgJSGanttInlineOutputMarker)
	private $isInline = false;                        //<! is in inline Gantt data mode (XML in article)
	private $isExternal = false;                      //<! is in external Gantt data mode (XML on an external page)
	private $isHeadDone = false;                      //<! if head is already added (might be important when more then one diagram per page would be possible)
	private $strInlineOutput = '';                    //<! this holds parsed JS scripts to be put after tidy
	private $config;                                  //<! copy of $wgJSGanttConfig
	
	/**
		Basic setup
	*/
	public function __construct() {
		global $wgParser, $wgHooks, $wgScriptPath, $wgParserOutputHooks, $wgLang
			, $wgJSGanttConfig, $wgJSGanttInlineOutputMarker, $wgJSGanttDir;
		
		// hook <jsgantt> tag for this extension
		$wgParser->setHook( 'jsgantt', array( $this, 'render' ) );
		
		// to decode script content after "Tidy"
		$wgHooks['ParserAfterTidy'][] = array( $this, 'inlineOutput' );
		// this is a hook to add CSS and JS
		$wgParserOutputHooks['ecJSGantt'] = array( $this, 'outputHook' );
		
		// init variables/attributes
		$this->config                = $wgJSGanttConfig;
		$this->strInlineOutputMarker = $wgJSGanttInlineOutputMarker;
		$this->strSelfURLBase        = "{$wgScriptPath}/extensions/JSWikiGantt";
		$this->strSelfDir            = $wgJSGanttDir;
		
		$this->strJSi18nFile         = str_replace( '%lang%', $wgLang->getCode(), $this->strJSi18nFile );
	}

	/**
		Parse <jsgantt> content and arguments
		
		@param $input - Input between the <jsgantt> and </jsgantt> tags, or null if the tag is "closed", i.e. <jsgantt />
		@param $args - associative array of attrs of the tag (indexed by lower cased attribute name).
		@param $parser - not needed
		@param $frame - not needed
	*/
	public function render( $input, $args, $parser, $frame ) {
		$strRendered = '';
		
		// load from some other article
		if ( !empty( $args['loadxml'] ) && !empty( $this->config['ExternalXMLEnabled'] ) && !$this->isInline && !$this->isExternal ) {
			$this->isExternal = true;
			$strRendered = $this->renderXMLLoader( $input, $args, $parser, $frame );
		// build from content
		} elseif ( !$this->isInline && !$this->isExternal ) { // yes, currently only one per page
			$this->isInline = true;
			$strRendered = $this->renderInnerXML( $input, $args, $parser, $frame );
		}

		// add css and js
		//$this->setupHeaders();
		if ( !$this->isHeadDone ) {
			$parser->mOutput->addOutputHook( 'ecJSGantt' );	// defined in the JSWikiGantt.php as wgParserOutputHooks
			$this->isHeadDone = true;
		}
		
		// ret renedered HTML
		return $strRendered;
	}
	
	/**
		Render arguments to HTML element attributes.
		
		To conform with HTML5 `data-` prefixed attributes are produced.
	*/
	private static function argsToAttributes( $args ) {
		$attrs = '';
		foreach ( $args as $key => $value ) {
			$attrs .= " data-{$key}='" . htmlspecialchars($value) . "'";
		}
		return $attrs;
	}

	/**
		Render our tag for the purpouse of loading an external XML
		
		@sa ecJSGantt::render()
	*/
	private function renderXMLLoader( $input, $args, $parser, $frame ) {
		//$out = $parser->recursiveTagParse( $input, $frame );
		$out = $parser->replaceInternalLinks( $input, $frame );	// just parse links
		return ''
			.Html::linkedScript( $this->getCSSJSLink( "jsgantt_loader.js" ) )
			.'<div id="GanttChartDIV" '.self::argsToAttributes( $args ).'>'
				.$out
			.'</div>'
		;
	}

	/**
		Escapes XML string from user for JS
	*/
	private function escapeXMLString4JS( $value ) {
		// quite simple for now - might want to allow html inside tags...
		return htmlspecialchars( $value );
	}
	
	/**
		Gets integer value from the task item
		
		@todo get content of the tag given by valName or an attribute with the same name
	*/
	private function getXMLIntVal( $task, $valName, $defaultVal ) {
		$val = '';
		wfSuppressWarnings();
		$val = $task->getElementsByTagName( $valName )->item( 0 )->nodeValue;
		wfRestoreWarnings();
		if( strlen( $val ) <= 0 ) {
			return intval( $defaultVal );
		}
		return intval( $val );
	}
	/**
		Gets string value from the task item
		
		@todo get content of the tag given by valName or an attribute with the same name
	*/
	private function getXMLStrVal( $task, $valName, $defaultVal ) {
		// quite simple for now - might want to allow html inside tags...
		wfSuppressWarnings();
		$val = $this->escapeXMLString4JS( $task->getElementsByTagName( $valName )->item( 0 )->nodeValue );
		wfRestoreWarnings();
		if( empty( $val ) ) {
			return $defaultVal;
		}
		return $val;
	}

	/**
		Render contents of our tag to display the diagram more directly

		@sa ecJSGantt::render()
	*/
	private function renderInnerXML( $input, $args, $parser, $frame ) {
		$doc = new DOMDocument();
		/*
		// DEBUG
		echo "<pre style='position:absolute; top:2em; right:0; width:200px; overflow:scroll; z-index:100' onclick='this.style.display=\"none\"'>"
			.htmlspecialchars( var_export( $args, true ) )
			.htmlspecialchars( $input )
		."</pre>"
		;
		*/
		// get task elements
		wfSuppressWarnings();
		$doc->loadXML( '<root>'.$input.'</root>' );
		$tasks = $doc->documentElement->getElementsByTagName( "task" );
		wfRestoreWarnings();
		
		if ( $tasks->length==0 ) {
			// TODO error message
			return '';
		}
		
		// should we add links to details of tasks?
		$isAddAutoLinks = !isset( $args['autolink'] ) ? '' : $args['autolink'];
		$isAddAutoLinks = strlen( $isAddAutoLinks ) ? intval( $isAddAutoLinks ) : $this->config['AutoLinks'];
		
		// prepare script contents
		$strScript = '';
		for ( $i = 0; $i < $tasks->length; $i++ ) {
			// The ID is required!
			wfSuppressWarnings();
			$pID = intval( $tasks->item( $i )->getElementsByTagName( "pID" )->item( 0 )->nodeValue );
			wfRestoreWarnings();
			if( empty( $pID ) ) {
				//! @todo some error message here?
				continue;
			}
			
			// check if auto link should be added
			wfSuppressWarnings();
			$isAddAutoLink = $tasks->item( $i )->getAttribute( 'autolink' );
			wfRestoreWarnings();
			if ( $isAddAutoLink=='' ) {
				$isAddAutoLink = $isAddAutoLinks;
			} else {
				$isAddAutoLink = !empty( $isAddAutoLink ) ? true : false;
			}
			
			// other values
			$pName    = $this->getXMLStrVal( $tasks->item( $i ), "pName"   , "No Task Name" );	//! @todo Allow HTML/Wiki here?
			$pColor   = $this->getXMLStrVal( $tasks->item( $i ), "pColor"  , "0000ff" );
			$pParent  = $this->getXMLIntVal( $tasks->item( $i ), "pParent" , 0 );
			$pStart   = $this->getXMLStrVal( $tasks->item( $i ), "pStart"  , "" );
			$pEnd     = $this->getXMLStrVal( $tasks->item( $i ), "pEnd"    , "" );
			$pLink    = $this->getXMLStrVal( $tasks->item( $i ), "pLink"   , "" );
			$pMile    = $this->getXMLIntVal( $tasks->item( $i ), "pMile"   , 0 );
			$pRes     = $this->getXMLStrVal( $tasks->item( $i ), "pRes"    , "" );		// resource
			$pComp    = $this->getXMLIntVal( $tasks->item( $i ), "pComp"   , 0 );
			$pGroup   = $this->getXMLIntVal( $tasks->item( $i ), "pGroup"  , 0 );
			$pOpen    = $this->getXMLIntVal( $tasks->item( $i ), "pOpen"   , 1 );
			$pDepend  = $this->getXMLStrVal( $tasks->item( $i ), "pDepend" , '' );
			$pCaption = $this->getXMLStrVal( $tasks->item( $i ), "pCaption", '' );
			
			// Add auto link
			if ( $isAddAutoLink && empty( $pLink ) ) {
				$pLink = str_replace( '%GANTT_TASK_ID%', $pID, $this->config['TasksAutoLink'] );
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
		if ( !empty( $strScript ) ) {
			$strScript = ''
				."<script>"
			//		."\n".$this->getJSi18nMsgs()
					."\noJSGantInline.init()"
					."\n$strScript"
					."\noJSGantInline.draw();"
				."\n</script>"
			;
			
			$this->strInlineOutput = $strScript;
			return ''
				.Html::linkedScript( $this->getCSSJSLink( "jsgantt_inline.js" ) )
				.'<div id="GanttChartInline" '.self::argsToAttributes( $args ).'></div>'
				//.$strScript
				.$this->strInlineOutputMarker;
			;
		// nothing to output
		} else {
			return '';
		}
	}

	/**
		Gets "link" (URL path) for the given extension's script
	*/
	private function getJSi18nMsgs() {
		return "
		/* gantt core */
		JSGantt.lang['format-label']      = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-label' ) )."';
		JSGantt.lang['format-quarter']    = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-quarter' ) )."';
		JSGantt.lang['format-month']      = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-month' ) )."';
		JSGantt.lang['format-week']       = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-week' ) )."';
		JSGantt.lang['format-day']        = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-day' ) )."';
		JSGantt.lang['format-hour']       = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-hour' ) )."';
		JSGantt.lang['format-minute']     = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-format-minute' ) )."';
		JSGantt.lang['header-res']        = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-header-res' ) )."';
		JSGantt.lang['header-dur']        = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-header-dur' ) )."';
		JSGantt.lang['header-comp']       = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-header-comp' ) )."';
		JSGantt.lang['header-startdate']  = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-header-startdate' ) )."';
		JSGantt.lang['header-enddate']    = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-header-enddate' ) )."';
		/* gantt inline/loader */
		JSGantt.lang['no-xml-link-error'] = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-no-xml-link-error' ) )."';
		JSGantt.lang['unexpected-error']  = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-unexpected-error' ) )."';
		JSGantt.lang['xml-parse-error']   = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-xml-parse-error' ) )."';
		JSGantt.lang['quarter-short']     = '".Xml::escapeJsString( wfMsgNoTrans( 'jswikigantt-quarter-short' ) )."';
		/* date-functions */
		Date.monthNames =
		   ['".Xml::escapeJsString( wfMsgNoTrans( 'january' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'february' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'march' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'april' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'may_long' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'june' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'july' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'august' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'september' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'october' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'november' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'december' ) )."'];
		Date.monthShortNames =
		   ['".Xml::escapeJsString( wfMsgNoTrans( 'jan' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'feb' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'mar' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'apr' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'may' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'jun' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'jul' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'aug' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'sep' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'oct' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'nov' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'dec' ) )."'];
		Date.dayNames =
		   ['".Xml::escapeJsString( wfMsgNoTrans( 'sunday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'monday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'tuesday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'wednesday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'thursday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'friday' ) )."',
			'".Xml::escapeJsString( wfMsgNoTrans( 'saturday' ) )."'];
		";
	}

	/**
		Create JS i18n file
		
		Generates the i18n file for JS and returns it's name.
		If the file is ready it checks if there is need to refresh it.
		
		@note blindly assuming that JSWikiGantt.i18n.php will change more often then other i18n files
	*/
	private function createJSi18nFile() {
		$strOutputPath = "{$this->strSelfDir}/{$this->strJSi18nFile}";
		$strSrcPath = "{$this->strSelfDir}/JSWikiGantt.i18n.php";
		
		// check if we need to change anything
		$isChanged = $this->isSrcChanged( $strSrcPath, $strOutputPath );
		
		// generate & create file
		if ( $isChanged ) {
			$hFile = fopen ( $strOutputPath, 'w' );
			fwrite ( $hFile, $this->getJSi18nMsgs() );
			fclose ( $hFile );
		}
		
		return $this->getCSSJSLink( $this->strJSi18nFile );
	}

	/**
		Checks if a source file were changed after dest path
	*/
	private function isSrcChanged( $strSrcPath, $strDestPath ) {
		if ( !file_exists( $strDestPath ) ) {
			return true;
		}
		
		$intMaxTime = filemtime( $strSrcPath );
		$intFileTime = filemtime( $strDestPath );
		
		return ( $intFileTime < $intMaxTime );
	}

	/**
		Gets "link" (URL path) for the given extension's script
	*/
	private function getCSSJSLink( $strFileName ) {
		global $wgJSGanttScriptVersion;
		
		return "{$this->strSelfURLBase}/{$strFileName}?{$wgJSGanttScriptVersion}";
	}

	/**
		"Decode" script content after "Tidy"...
	*/
	public function inlineOutput( $parser, &$text ) {
		$text = str_replace( $this->strInlineOutputMarker, $this->strInlineOutput, $text );
		return true;
	}

	/**
		Setup our additional styles and scripts
	*/
	private function setupHeaders( $outputPage ) {
		if ( $outputPage->hasHeadItem( 'jsganttCSS' ) && $outputPage->hasHeadItem( 'jsganttJS' )
			&& $outputPage->hasHeadItem( 'jsganttDateJS' ) )
		{
			return;
		}
		
		//echo "test:".$this->getCSSJSLink( "test.js" );
		
		$outputPage->addHeadItem( 'jsganttCSS'   , Html::linkedStyle( $this->getCSSJSLink( "jsgantt.css" ) ) );
		$outputPage->addHeadItem( 'jsganttJS'    , Html::linkedScript( $this->getCSSJSLink( "jsgantt.js" ) ) );
		$outputPage->addHeadItem( 'jsganttDateJS', Html::linkedScript( $this->getCSSJSLink( "date-functions.js" ) ) );

		// generate i18n messages and append
		$outputPage->addHeadItem( 'jsganttLangJS', Html::linkedScript( $this->createJSi18nFile() ) );
		
		/*
		// Only works out of cache => has to be moved to the output
		if ( $this->isInline ) {
			$outputPage->addHeadItem('jsganttInlineJS' , Html::linkedScript( "{$thisExtPath}/jsgantt_inline.js?$wgJSGanttScriptVersion" ) );
		} elseif ( $this->isExternal && !empty( $wgJSGanttConfig['ExternalXMLEnabled'] ) ) {
			$outputPage->addHeadItem('jsganttLoaderJS' , Html::linkedScript( "{$thisExtPath}/jsgantt_loader.js?$wgJSGanttScriptVersion" ) );
		}
		*/
	}

	/**
		Output Hook to setup extra headers
	*/
	public function outputHook( $outputPage, $parserOutput, $data ) {
		$this->setupHeaders( $outputPage );
	}
}