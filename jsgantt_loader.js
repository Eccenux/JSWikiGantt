//
// Global gant object (needed for jsgantt)
//
var oJSGant;

//
// Global gant loader object
//
var oJSGantLoader = {
	conf : {
		elGantDivID : 'GanttChartDIV',	// gant element (a link should be added to it)
		intNamesWidth : 300,			// names width
		strDefaultViewFormat : 'day',		// ("day","week","month","quarter")
		strDateInputFormat : 'Y-m-d',		// date format of the input
		strDateDisplayFormat : 'Y-m-d',		// basic date format
		oDateDisplayFormatCaptions : {		// headers date formats
			'day' : {
				'from' : 'd.m',
				'to' : ' - d.m.y'
			},
			'week' : {
				'upper' : 'Y',
				'lower' : 'm/d'
			},
			'month' : {
				'upper' : 'Y',
				'lower' : 'M'
			},
			'quarter' : {
				'upper' : 'Y',
				'lower' : '"Kw." q'
			}
		},
		'':''
	},
	lang : {
		'No XML Link Error' : 'Błąd! Brak linku do artkułu zawierającego dane haromonogramu. W elemencie z id "%el_id%" należy podać link do artykułu z danymi w formacie XML.',
		'Unexpected Error' : 'Niespodziewany błąd!',
		'':''
	}
};

//
// Standard error handling
//
oJSGantLoader.displayError = function(strMsg)
{
	var nel = document.createElement('p');
	nel.className = "gantt_error";
	nel.appendChild(document.createTextNode(strMsg));
	this.elGantDiv.appendChild(nel);
}

//
// Init gantt
//
oJSGantLoader.load = function()
{
	var elGantDiv = document.getElementById(this.conf.elGantDivID);
	if (!elGantDiv)
	{
		return;
	}
	this.elGantDiv = elGantDiv;
	
	var strXmlUrl = '';
	try
	{
		var strXmlUrl = elGantDiv.getElementsByTagName('a')[0].href;
		//strXmlUrl += '?action=raw';
		strXmlUrl = 'project.xml';
	}
	catch(e)
	{
		this.displayError(this.lang['No XML Link Error'].replace('%el_id%', this.conf.elGantDivID));
		return;
	}

	// setup
	oJSGant = new JSGantt.GanttChart('oJSGant', elGantDiv, this.conf.strDefaultViewFormat);
	oJSGant.setDateInputFormat (this.conf.strDateInputFormat);
	oJSGant.setDateDisplayFormat (this.conf.strDateDisplayFormat);
	oJSGant.setDateDisplayFormatCaptions (this.conf.oDateDisplayFormatCaptions);
	
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
		this.displayError(this.lang['Unexpected Error']);
	}
}


//
// Loader init
//
addOnloadHook(function() {oJSGantLoader.load()});