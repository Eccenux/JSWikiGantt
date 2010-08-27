// globalny element gantowy
var oJSGant;

// id elementu w którym wyœwietlany jest harmonogram
var elGantDivID = 'GanttChartDIV';

// funkcja wczytuj¹ca dane
addOnloadHook(function()
{
	var elGantDiv = document.getElementById(elGantDivID);
	if (!elGantDiv)
	{
		return;
	}
	
	var strXmlUrl = '';
	try
	{
		var strXmlUrl = elGantDiv.getElementsByTagName('a')[0].href;
		strXmlUrl += '?action=raw';
	}
	catch(e)
	{
		var strError = 'Dodaj link do artku³u zawieraj¹cego dane XML w elemencie z id "'+elGantDivID+'"';
		elGantDiv.appendChild(document.createTextNode(strError));
		return;
	}

	oJSGant = new JSGantt.GanttChart('oJSGant', elGantDiv, 'day');
	oJSGant.setDateInputFormat ();
	oJSGant.setDateDisplayFormat ();
	oJSGant.setShowRes(1); // Show/Hide Responsible (0/1)
	oJSGant.setShowDur(1); // Show/Hide Duration (0/1)
	oJSGant.setShowComp(1); // Show/Hide % Complete(0/1)
	oJSGant.setCaptionType('Resource');  // Set to Show Caption (None,Caption,Resource,Duration,Complete)
	
	if (oJSGant)
	{
		// Parameters (pID, pName, pStart, pEnd, pColor, pLink, pMile, pRes,  pComp, pGroup, pParent, pOpen)
		// use the XML file parser 
		JSGantt.parseXML(strXmlUrl,oJSGant)
		oJSGant.Draw();	
		oJSGant.DrawDependencies();
	}
	else
	{
		var strError = 'Niespodziewany b³¹d!';
		elGantDiv.appendChild(document.createTextNode(strError));
	}
});

