// global gant object (needed for jsgantt)
var oJSGant;

// global gant loader object
var oJSGantLoader = {
	conf : {
		elGantDivID : 'GanttChartDIV',	// gant element (a link should be added to it)
		intNamesWidth : 300,			// names width
		strDateDisplayFormat : 'Y-m-d',		// basic date format
		/*
		strDateDisplayFormat : 'Y-m-d',		// headers date formats
		
		}
		*/
		'':''
	}
	/*
	FIXME
	lang : {
		months : 
	}
	*/
};

// Init gantt
oJSGantLoader.load = function()
{
	var elGantDiv = document.getElementById(this.conf.elGantDivID);
	if (!elGantDiv)
	{
		return;
	}
	
	var strXmlUrl = '';
	try
	{
		var strXmlUrl = elGantDiv.getElementsByTagName('a')[0].href;
		//strXmlUrl += '?action=raw';
		strXmlUrl = 'project.xml';
	}
	catch(e)
	{
		var strError = 'Dodaj link do artkułu zawierającego dane XML w elemencie z id "'+elGantDivID+'"';
		elGantDiv.appendChild(document.createTextNode(strError));
		return;
	}

	oJSGant = new JSGantt.GanttChart('oJSGant', elGantDiv, 'day');
	/*
	oJSGant.setDateInputFormat ('yyyy-mm-dd');
	oJSGant.setDateDisplayFormat ('yyyy-mm-dd');
	*/
	/*
	// defaults
	var vDateInputFormat = "mm/dd/yyyy";
	var vDateDisplayFormat = "mm/dd/yy";
	var vFormatArr	= new Array("day","week","month","quarter");
	var vMonthArr     = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
	*/
	oJSGant.setMonthArr("Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień");
	oJSGant.setDateDisplayFormat (this.conf.strDateDisplayFormat);
	
	oJSGant.setShowRes(0); // Show/Hide Responsible (0/1)
	oJSGant.setShowDur(0); // Show/Hide Duration (0/1)
	oJSGant.setShowComp(0); // Show/Hide % Complete(0/1)
	oJSGant.setShowStartDate(0);
	oJSGant.setShowEndDate(0);
	oJSGant.setCaptionType('Resource');  // Set to Show Caption (None,Caption,Resource,Duration,Complete)
	
	if (oJSGant)
	{
		// Parameters (pID, pName, pStart, pEnd, pColor, pLink, pMile, pRes,  pComp, pGroup, pParent, pOpen)
		// use the XML file parser 
		JSGantt.parseXML(strXmlUrl,oJSGant)
		oJSGant.Draw(this.conf.intNamesWidth);	
		oJSGant.DrawDependencies();
	}
	else
	{
		var strError = 'Niespodziewany błąd!';
		elGantDiv.appendChild(document.createTextNode(strError));
	}
}


//
// Loader
//
addOnloadHook(function() {oJSGantLoader.load()});