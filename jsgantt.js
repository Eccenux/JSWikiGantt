﻿/* 
   _        ___            _   _     _   ____  
  (_)___   / _ \__ _ _ __ | |_| |_  / | |___ \ 
  | / __| / /_\/ _` | '_ \| __| __| | |   __) |
  | \__ \/ /_\\ (_| | | | | |_| |_  | |_ / __/ 
 _/ |___/\____/\__,_|_| |_|\__|\__| |_(_)_____|
|__/ 

Copyright (c) 2009, Shlomy Gantz BlueBrick Inc. All rights reserved.
 
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*     * Redistributions of source code must retain the above copyright
*       notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above copyright
*       notice, this list of conditions and the following disclaimer in the
*       documentation and/or other materials provided with the distribution.
*     * Neither the name of Shlomy Gantz or BlueBrick Inc. nor the
*       names of its contributors may be used to endorse or promote products
*       derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY SHLOMY GANTZ/BLUEBRICK INC. ''AS IS'' AND ANY
* EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL SHLOMY GANTZ/BLUEBRICK INC. BE LIABLE FOR ANY
* DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
* LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
* ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
* SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
	@note This file was modified from original version to better fit using with Wiki and preferences of JSWikiGantt developer :-)
	 - for easier change of date format => must use with date-functions.js!
	 - more or less xhtml compatible (lower case element names mostly - not that it really matters, but...)
	 - i18n

	@todo rewrite this.Draw into DOoM ;-) - so that we can attach events and skip oJSGant madness
	@todo loader and inline gantt i18n stuff - should be here or move it back to jsgantt_inline.js/jsgantt_loader.js?
*/

var JSGantt; if (!JSGantt) JSGantt = {};

// i18n
JSGantt.lang = {'':''
	// display format
	,'format-label' : 'Format:'
	,'format-quarter' : 'Quarter'
	,'format-month' : 'Month'
	,'format-week' : 'Week'
	,'format-day' : 'Day'
	,'format-hour' : 'Hour'
	,'format-minute' : 'Minute'
	// headers
	,'header-res':      'Zasób'
	,'header-dur':      'Czas trwania'
	,'header-comp':     '% Ukoń'
	,'header-startdate':'Rozpoczęcie'
	,'header-enddate':  'Zakończenie'
	// quarters date format part
	,'quarter-short' : 'Qtr.'
	// loader and inline gantt stuff
	,'no-xml-link-error' : 'Error! A link to an article containing the diagram data is missing. The link to an XML data article is to be put inside an element with id \"%el_id%\".'
	,'xml-parse-error' : 'Parse error! The XML file is badly formed or the URL is incorrect.'
	,'unexpected-error' : 'Unexpected error!'
}

// jsgantt options to functions mapping
JSGantt.attributeMapping = {
	'option-show-responsible' : function (value) {
		this.setShowRes(JSGantt.AttributeParser.toBoolInt(value));
	},
	'option-show-duration' : function (value) {
		this.setShowDur(JSGantt.AttributeParser.toBoolInt(value));
	},
	'option-show-precent-complete' : function (value) {
		this.setShowComp(JSGantt.AttributeParser.toBoolInt(value));
	},
	'option-show-start-date' : function (value) {
		this.setShowStartDate(JSGantt.AttributeParser.toBoolInt(value));
	},
	'option-show-end-date' : function (value) {
		this.setShowEndDate(JSGantt.AttributeParser.toBoolInt(value));
	},
	// Set to Show Caption (None,Caption,Resource,Duration,Complete)
	'option-caption-type' : function (value) {
		value = JSGantt.AttributeParser.toStringFromArray(value, 
			['None','Caption','Resource','Duration','Complete'],
			'Resource'
		);
		this.setCaptionType(value);
	},
}

// Attribute parser helper singleton
JSGantt.AttributeParser = new function() {
	// transforms string value into 0/1 "boolean"
	this.toBoolInt = function(value) {
		var option = 0;
		if (value.search(/^\s*(y|yes|true|on|1)\s*$/i) >= 0) {
			option = 1;
		}
		return option;
	};
	this.toStringFromArray = function(value, possibleValues, fallbackValue) {
		var option = fallbackValue;
		for (var i = 0; i < possibleValues.length; i++) {
			if (possibleValues[i] === value) {
				option = value;
				break;
			}
		}
		return option;
	};
	this.setOptions = function(sourceElement, ganttObject, prefix) {
		var mapping = JSGantt.attributeMapping;
		for (var option in mapping) {
			var setter = mapping[option];
			if (sourceElement.hasAttribute(prefix + option)) {
				setter.call(ganttObject, sourceElement.getAttribute('data-'+option));
			} else {
				setter.call(ganttObject, '');
			}
		}
	};
};

var vTimeout = 0;
var vBenchTime = new Date().getTime();

JSGantt.isIE = function () {
	
	if(typeof document.all != 'undefined')
		return true;
	else
		return false;
}


JSGantt.TaskItem = function(pID, pName, pStart, pEnd, pColor, pLink, pMile, pRes, pComp, pGroup, pParent, pOpen, pDepend, pCaption)
{
	var vID    = pID;
	var vName  = pName;
	var vStart = new Date();	
	var vEnd   = new Date();
	var vColor = pColor;
	var vLink  = pLink;
	var vMile  = pMile;
	var vRes   = pRes;
	var vComp  = pComp;
	var vGroup = pGroup;
	var vParent = pParent;
	var vOpen   = pOpen;
	var vDepend = pDepend;
	var vCaption = pCaption;
	var vDuration = '';
	var vLevel = 0;
	var vNumKid = 0;
	var vVisible  = 1;
	var x1, y1, x2, y2;

	if (vGroup != 1)
	{  
		vStart = JSGantt.parseDateStr(pStart,oJSGant.getDateInputFormat());
		vEnd   = JSGantt.parseDateStr(pEnd,oJSGant.getDateInputFormat());
	}

	this.getID       = function(){ return vID };
	this.getName     = function(){ return vName };
	this.getShortName     = function(pNameWidth){
		var vNameMaxLen = pNameWidth / 7;	// assuming one char is about 6px width
		if (vName.length > vNameMaxLen)
		{
			vName = vName.substr(0,vNameMaxLen-2) + '...';
		}
		return vName
	};
	this.getStart    = function(){ return vStart};
	this.getEnd      = function(){ return vEnd  };
	this.getColor    = function(){ return vColor};
	this.getLink     = function(){ return vLink };
	this.getMile     = function(){ return vMile };
	this.getDepend   = function(){ if(vDepend) return vDepend; else return null };
	this.getCaption  = function(){ if(vCaption) return vCaption; else return ''; };
	this.getResource = function(){ if(vRes) return vRes; else return '&nbsp';  };
	this.getCompVal  = function(){ if(vComp) return vComp; else return 0; };
	this.getCompStr  = function(){ if(vComp) return vComp+'%'; else return ''; };

	this.getDuration = function(vFormat)
	{ 
		if (vMile) 
		{
			vDuration = '-';
		}
		else if (vFormat=='hour')
		{
			tmpPer =  Math.ceil((this.getEnd() - this.getStart()) /  ( 60 * 60 * 1000) );
			if(tmpPer == 1)  
				vDuration = '1 godzina';
			else if (tmpPer%10!=1 && tmpPer%10 < 5)
				vDuration = tmpPer + ' godziny';
			else
				vDuration = tmpPer + ' godzin';
		}
		else if (vFormat=='minute')
		{
			tmpPer =  Math.ceil((this.getEnd() - this.getStart()) /  ( 60 * 1000) );
			if(tmpPer == 1) 
				vDuration = '1 minuta';
			else if (tmpPer%10!=1 && tmpPer%10 < 5)
				vDuration = tmpPer + ' minuty';
			else
				vDuration = tmpPer + ' minut';
		}
		else //if(vFormat == 'day')
		{
			tmpPer =  Math.ceil((this.getEnd() - this.getStart()) /  (24 * 60 * 60 * 1000) + 1);
			if(tmpPer == 1) 
				vDuration = '1 dzień';
			else if (tmpPer%10!=1 && tmpPer%10 < 5)
				vDuration = tmpPer + ' dni';
			else
				vDuration = tmpPer + ' dni';
		}

		//else if(vFormat == 'week') {
		//   tmpPer =  ((this.getEnd() - this.getStart()) /  (24 * 60 * 60 * 1000) + 1)/7;
		//   if(tmpPer == 1)  vDuration = '1 Week';
		//   else             vDuration = tmpPer + ' Weeks'; 
		//}

		//else if(vFormat == 'month') {
		//   tmpPer =  ((this.getEnd() - this.getStart()) /  (24 * 60 * 60 * 1000) + 1)/30;
		//   if(tmpPer == 1) vDuration = '1 Month';
		//   else            vDuration = tmpPer + ' Months'; 
		//}

		//else if(vFormat == 'quater') {
		//   tmpPer =  ((this.getEnd() - this.getStart()) /  (24 * 60 * 60 * 1000) + 1)/120;
		//   if(tmpPer == 1) vDuration = '1 Qtr';
		//   else            vDuration = tmpPer + ' Qtrs'; 
		//}
		return( vDuration )
	};

	this.getParent   = function(){ return vParent };
	this.getGroup    = function(){ return vGroup };
	this.getOpen     = function(){ return vOpen };
	this.getLevel    = function(){ return vLevel };
	this.getNumKids  = function(){ return vNumKid };
	this.getStartX   = function(){ return x1 };
	this.getStartY   = function(){ return y1 };
	this.getEndX     = function(){ return x2 };
	this.getEndY     = function(){ return y2 };
	this.getVisible  = function(){ return vVisible };
	this.setDepend   = function(pDepend){ vDepend = pDepend;};
	this.setStart    = function(pStart){ vStart = pStart;};
	this.setEnd      = function(pEnd)  { vEnd   = pEnd;  };
	this.setLevel    = function(pLevel){ vLevel = pLevel;};
	this.setNumKid   = function(pNumKid){ vNumKid = pNumKid;};
	this.setCompVal  = function(pCompVal){ vComp = pCompVal;};
	this.setStartX   = function(pX) {x1 = pX; };
	this.setStartY   = function(pY) {y1 = pY; };
	this.setEndX     = function(pX) {x2 = pX; };
	this.setEndY     = function(pY) {y2 = pY; };
	this.setOpen     = function(pOpen) {vOpen = pOpen; };
	this.setVisible  = function(pVisible) {vVisible = pVisible; };

}

	
// function that loads the main gantt chart properties and functions
// pDiv: (required) this is a DIV object created in HTML
// pStart: UNUSED - future use to force minimum chart date
// pEnd: UNUSED - future use to force maximum chart date
// pWidth: UNUSED - future use to force chart width and cause objects to scale to fit within that width
// pShowRes: UNUSED - future use to turn on/off display of resource names
// pShowDur: UNUSED - future use to turn on/off display of task durations
// pFormat: (required) - used to indicate whether chart should be drawn in "day", "week", "month", or "quarter" format
// pCationType - what type of Caption to show:  Caption, Resource, Duration, Complete
JSGantt.GanttChart =  function(pGanttVar, pDiv, pFormat)
{

	var vGanttVar = pGanttVar;
	var vDiv      = pDiv;
	var vFormat   = pFormat;
	var vShowRes  = 1;
	var vShowDur  = 1;
	var vShowComp = 1;
	var vShowStartDate = 1;
	var vShowEndDate = 1;
	var vDateInputFormat = "m/d/Y";
	var vDateDisplayFormat = "m/d/y";
	// date format in formats captions
	var vDateDisplayFormatCaptions = {
		'day' : {
			'from' : 'm/d - ',
			'to' : 'm/d/y'
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
			'lower' : '"'+JSGantt.lang['quarter-short']+'" q'
		}
	};
	
	var vNumUnits  = 0;
	var vCaptionType;
	var vDepId = 1;
	var vTaskList     = new Array();	
	var vFormatArr	= new Array("day","week","month","quarter");	// formats to display
	var vMonthDaysArr = new Array(31,28,31,30,31,30,31,31,30,31,30,31);
	this.setFormatArr = function()
	{
		vFormatArr = new Array();
		for(var i = 0; i < arguments.length; i++) {vFormatArr[i] = arguments[i];}
		if(vFormatArr.length>4){vFormatArr.length=4;}
	};
	this.setShowRes  = function(val) { vShowRes  = val; };
	this.setShowDur  = function(val) { vShowDur  = val; };
	this.setShowComp = function(val) { vShowComp = val; };
	this.setShowStartDate = function(val) { vShowStartDate = val; };
	this.setShowEndDate = function(val) { vShowEndDate = val; };
	this.setDateInputFormat = function(val) { vDateInputFormat = val; };
	this.setDateDisplayFormat = function(val) { vDateDisplayFormat = val; };
	this.setDateDisplayFormatCaptions = function(val) { vDateDisplayFormatCaptions = val; };
	this.setCaptionType = function(pType) { vCaptionType = pType };
	this.setFormat = function(pFormat)
	{
		vFormat = pFormat; 
		this.Draw(); 
	};

	this.getShowRes  = function(){ return vShowRes };
	this.getShowDur  = function(){ return vShowDur };
	this.getShowComp = function(){ return vShowComp };
	this.getShowStartDate = function(){ return vShowStartDate };
	this.getShowEndDate = function(){ return vShowEndDate };
	this.getDateInputFormat = function() { return vDateInputFormat };
	this.getDateDisplayFormat = function() { return vDateDisplayFormat };
	this.getCaptionType = function() { return vCaptionType };
	this.CalcTaskXY = function () 
	{
		var vList = this.getList();
		var vTaskDiv;
		var vParDiv;
		var vLeft, vTop, vHeight, vWidth;

		for(i = 0; i < vList.length; i++)
		{
			vID = vList[i].getID();
			vTaskDiv = document.getElementById("taskbar_"+vID);
			vBarDiv  = document.getElementById("bardiv_"+vID);
			vParDiv  = document.getElementById("childgrid_"+vID);

			if(vBarDiv) 
			{
				vList[i].setStartX( vBarDiv.offsetLeft );
				vList[i].setStartY( vParDiv.offsetTop+vBarDiv.offsetTop+6 );
				vList[i].setEndX( vBarDiv.offsetLeft + vBarDiv.offsetWidth );
				vList[i].setEndY( vParDiv.offsetTop+vBarDiv.offsetTop+6 );
			}
		}
	}

	this.AddTaskItem = function(value)
	{
		vTaskList.push(value);
	}

	this.getList   = function() { return vTaskList };

	this.clearDependencies = function()
	{
		var parent = document.getElementById('rightside');
		var depLine;
		var vMaxId = vDepId;
		for ( i=1; i<vMaxId; i++ )
		{
			depLine = document.getElementById("line"+i);
			if (depLine) { parent.removeChild(depLine); }
		}
		vDepId = 1;
	}


	// sLine: Draw a straight line (colored one-pixel wide DIV), need to parameterize doc item
	this.sLine = function(x1,y1,x2,y2)
	{
		vLeft = Math.min(x1,x2);
		vTop  = Math.min(y1,y2);
		vWid  = Math.abs(x2-x1) + 1;
		vHgt  = Math.abs(y2-y1) + 1;

		vDoc = document.getElementById('rightside');

		// retrieve DIV
		var oDiv = document.createElement('div');

		oDiv.id = "line"+vDepId++;
		oDiv.style.position = "absolute";
		oDiv.style.margin = "0px";
		oDiv.style.padding = "0px";
		oDiv.style.overflow = "hidden";
		oDiv.style.border = "0px";

		// set attributes
		oDiv.style.zIndex = 0;
		oDiv.style.backgroundColor = "red";

		oDiv.style.left = vLeft + "px";
		oDiv.style.top = vTop + "px";
		oDiv.style.width = vWid + "px";
		oDiv.style.height = vHgt + "px";

		oDiv.style.visibility = "visible";

		vDoc.appendChild(oDiv);
	}


	// dLine: Draw a diaganol line (calc line x,y paisrs and draw multiple one-by-one sLines)
	this.dLine = function(x1,y1,x2,y2)
	{
		var dx = x2 - x1;
		var dy = y2 - y1;
		var x = x1;
		var y = y1;

		var n = Math.max(Math.abs(dx),Math.abs(dy));
		dx = dx / n;
		dy = dy / n;
		for ( i = 0; i <= n; i++ )
		{
			vx = Math.round(x); 
			vy = Math.round(y);
			this.sLine(vx,vy,vx,vy);
			x += dx;
			y += dy;
		}
	}

	this.drawDependency =function(x1,y1,x2,y2)
	{
		if(x1 + 10 < x2)
		{ 
			this.sLine(x1,y1,x1+4,y1);
			this.sLine(x1+4,y1,x1+4,y2);
			this.sLine(x1+4,y2,x2,y2);
			this.dLine(x2,y2,x2-3,y2-3);
			this.dLine(x2,y2,x2-3,y2+3);
			this.dLine(x2-1,y2,x2-3,y2-2);
			this.dLine(x2-1,y2,x2-3,y2+2);
		}
		else
		{
			this.sLine(x1,y1,x1+4,y1);
			this.sLine(x1+4,y1,x1+4,y2-10);
			this.sLine(x1+4,y2-10,x2-8,y2-10);
			this.sLine(x2-8,y2-10,x2-8,y2);
			this.sLine(x2-8,y2,x2,y2);
			this.dLine(x2,y2,x2-3,y2-3);
			this.dLine(x2,y2,x2-3,y2+3);
			this.dLine(x2-1,y2,x2-3,y2-2);
			this.dLine(x2-1,y2,x2-3,y2+2);
		}
	}

	this.DrawDependencies = function ()
	{
		//First recalculate the x,y
		this.CalcTaskXY();

		this.clearDependencies();

		var vList = this.getList();
		for(var i = 0; i < vList.length; i++)
		{
			vDepend = vList[i].getDepend();
			if(vDepend)
			{
				var vDependStr = vDepend + '';
				var vDepList = vDependStr.split(',');
				var n = vDepList.length;

				for(var k=0;k<n;k++)
				{
					var vTask = this.getArrayLocationByID(vDepList[k]);
					
					if(vList[vTask].getVisible()==1)
						this.drawDependency(vList[vTask].getEndX(),vList[vTask].getEndY(),vList[i].getStartX()-1,vList[i].getStartY())
				}
			}
		}
	}


	this.getArrayLocationByID = function(pId)
	{
		var vList = this.getList();
		for(var i = 0; i < vList.length; i++)
		{
			if(vList[i].getID()==pId)
				return i;
		}
	}

	this.Draw = function(pNameWidth)
	{
		var vMaxDate = new Date();
		var vMinDate = new Date();	
		var vTmpDate = new Date();
		var vNxtDate = new Date();
		var vCurrDate = new Date();
		var vTaskLeft = 0;
		var vTaskRight = 0;
		var vNumCols = 0;
		var vID = 0;
		var vMainTable = "";
		var vLeftTable = "";
		var vRightTable = "";
		var vDateRowStr = "";
		var vItemRowStr = "";
		var vColWidth = 0;
		var vColUnit = 0;
		var vChartWidth = 0;
		var vNumDays = 0;
		var vDayWidth = 0;
		var vStr = "";
		var vNameWidth = 300;
		if (pNameWidth)
		{
			vNameWidth = pNameWidth;
		}
		var vStatusWidth = 70;
		// moved below
		//var vLeftWidth = 15 + vNameWidth + 70 + 70 + 70 + 70 + 70;

		if(vTaskList.length > 0)
		{

			// Process all tasks preset parent date and completion %
			JSGantt.processRows(vTaskList, 0, -1, 1, 1);

			// get overall min/max dates plus padding
			vMinDate = JSGantt.getMinDate(vTaskList, vFormat);
			vMaxDate = JSGantt.getMaxDate(vTaskList, vFormat);

			// Calculate chart width variables.  vColWidth can be altered manually to change each column width
			// May be smart to make this a parameter of GanttChart or set it based on existing pWidth parameter
			if(vFormat == 'day')
			{
				vColWidth = 18;
				vColUnit = 1;
			}
			else if(vFormat == 'week')
			{
				vColWidth = 37;
				vColUnit = 7;
			}
			else if(vFormat == 'month')
			{
				vColWidth = 37;
				vColUnit = 30;
			}
			else if(vFormat == 'quarter')
			{
				vColWidth = 60;
				vColUnit = 90;
			}
			
			else if(vFormat=='hour')
			{
				vColWidth = 18;
				vColUnit = 1;
			}

			else if(vFormat=='minute')
			{
				vColWidth = 18;
				vColUnit = 1;
			}

			vNumDays = (Date.parse(vMaxDate) - Date.parse(vMinDate)) / ( 24 * 60 * 60 * 1000);
			vNumUnits = vNumDays / vColUnit;

			vChartWidth = vNumUnits * vColWidth + 1;
			vDayWidth = (vColWidth / vColUnit) + (1/vColUnit);

			vMainTable =
				'<div class="ganttchart">'
				+ '<table class="ganttchartmaintable"><tbody><tr>'
			;
			
			// DRAW the Left-side of the chart (names, resources, comp%)
			var extracolsnum = 0;
			if(vShowRes ==1) extracolsnum++;
			if(vShowDur ==1) extracolsnum++;
			if(vShowComp==1) extracolsnum++;
			if(vShowStartDate==1) extracolsnum++;
			if(vShowEndDate==1) extracolsnum++;
			
			vNameWidth+=vStatusWidth*extracolsnum;
			
			var vLeftWidth = vNameWidth;
			
			vLeftTable =
				'<td style="width:' + vLeftWidth + 'px">'
				+'<div class="tasksarea"><table><tbody>'
				+'<tr>'
				+'  <td colspan="'+(extracolsnum+1)+'">&nbsp;</td>'; 


			vLeftTable +=
				'<tr>'
				//+'  <td style="width: ' + vNameWidth + 'px;">&nbsp;</td>'
				+'  <td>&nbsp;</td>'
			;

			// TODO: temporary function - should simply be done in a loop over headers desc array/object
			function tmpfunTaskDescHeaderAdd (pColWidth, pDesc)
			{
				return '  <th style="width: ' + pColWidth + 'px;">'+pDesc+'</th>';
			}
			if(vShowRes ==1)      vLeftTable += tmpfunTaskDescHeaderAdd (vStatusWidth, JSGantt.lang['header-res']);
			if(vShowDur ==1)      vLeftTable += tmpfunTaskDescHeaderAdd (vStatusWidth, JSGantt.lang['header-dur']);
			if(vShowComp==1)      vLeftTable += tmpfunTaskDescHeaderAdd (vStatusWidth, JSGantt.lang['header-comp']);
			if(vShowStartDate==1) vLeftTable += tmpfunTaskDescHeaderAdd (vStatusWidth, JSGantt.lang['header-startdate']);
			if(vShowEndDate==1)   vLeftTable += tmpfunTaskDescHeaderAdd (vStatusWidth, JSGantt.lang['header-enddate']);
			
			vLeftTable += '</tr>';

			//
			// TASKS
			//
			for(i = 0; i < vTaskList.length; i++)
			{
				if( vTaskList[i].getGroup())
				{
					vBGColor = "f3f3f3";
					vRowType = "group";
				}
				else
				{
					vBGColor  = "ffffff";
					vRowType  = "row";
				}

				vID = vTaskList[i].getID();

				var isDuplicateTaskToBeMovedUp = false;
				if (vLeftTable.indexOf(' id=child_' + vID + ' ')==-1)	// to allow more bars on one row
				{
					vLeftTable += '<tr id=child_' + vID + ' bgcolor="#' + vBGColor + '" ' + (vTaskList[i].getVisible()==0 ? 'style="display:none"' : '') + ' onmouseover="oJSGant.mouseOver(this,' + vID + ',\'left\',\'' + vRowType + '\')" onmouseout="oJSGant.mouseOut(this,' + vID + ',\'left\',\'' + vRowType + '\')">' ;
				}
				else
				{
					isDuplicateTaskToBeMovedUp = true;
					vLeftTable += '<tr style="display:none;">' ;
				}


				vLeftTable += 
					'  <td class="gname"><nobr><span style="color: #aaaaaa">';

				for(j=1; j<vTaskList[i].getLevel(); j++)
				{
					vLeftTable += '&nbsp&nbsp&nbsp&nbsp';
				}

				vLeftTable += '</span>';

				if( vTaskList[i].getGroup())
				{
					if( vTaskList[i].getOpen() == 1) 
						vLeftTable += '<span id="group_' + vID + '" style="color:#000000; cursor:pointer; font-weight:bold;" onclick="JSGantt.folder(' + vID + ','+vGanttVar+');'+vGanttVar+'.DrawDependencies();">&ndash;</span><span style="color:#000000">&nbsp</span>' ;
					else
						vLeftTable += '<span id="group_' + vID + '" style="color:#000000; cursor:pointer; font-weight:bold;" onclick="JSGantt.folder(' + vID + ','+vGanttVar+');'+vGanttVar+'.DrawDependencies();">+</span><span style="color:#000000">&nbsp</span>' ;
				}
				else
				{
					vLeftTable += '<span style="color: #000000; font-weight:bold;">&nbsp&nbsp&nbsp</span>';
				}

				if (vTaskList[i].getLink().length>0)
				{
					//vLeftTable += '<span title="'+ vTaskList[i].getName() +'" onclick=JSGantt.taskLink("' + vTaskList[i].getLink() + '",300,200); style="cursor:pointer"> ' + vTaskList[i].getName() + '</span></NOBR></TD>' ;
					vLeftTable += ' <span title="'+ vTaskList[i].getName() +'" class="linked_task"><a onclick="JSGantt.taskLink(\'' + vTaskList[i].getLink() + '\',700,600); return false;" href="'+ vTaskList[i].getLink() +'" target="_blank">' + vTaskList[i].getShortName(pNameWidth) + '</a></span></nobr></td>' ;
				}
				else
				{
					vLeftTable += ' <span title="'+ vTaskList[i].getName() +'">' + vTaskList[i].getShortName(pNameWidth) + '</span></nobr></td>' ;
				}

				if(vShowRes ==1) vLeftTable += '  <td class="gtaskdesc"><nobr>' + vTaskList[i].getResource() + '</nobr></td>' ;
				if(vShowDur ==1) vLeftTable += '  <td class="gtaskdesc"><nobr>' + vTaskList[i].getDuration(vFormat) + '</nobr></td>' ;
				if(vShowComp==1) vLeftTable += '  <td class="gtaskdesc"><nobr>' + vTaskList[i].getCompStr()  + '</nobr></td>' ;
				if(vShowStartDate==1) vLeftTable += '  <td class="gtaskdesc"><nobr>' + JSGantt.formatDateStr( vTaskList[i].getStart(), vDateDisplayFormat) + '</nobr></td>' ;
				if(vShowEndDate==1) vLeftTable += '  <td class="gtaskdesc"><nobr>' + JSGantt.formatDateStr( vTaskList[i].getEnd(), vDateDisplayFormat) + '</nobr></td>' ;

				vLeftTable += '</TR>';
			}

			// DRAW the date format selector at bottom left.  Another potential GanttChart parameter to hide/show this selector
			vLeftTable += '</td></tr>' +
				'<tr><td colspan="5" class="format_chooser">'+JSGantt.lang['format-label'];

			if (vFormatArr.join().indexOf("minute")!=-1)
			{
				if (vFormat=='minute') vLeftTable += '<input type=radio name="radFormat" value="minute" checked />'+JSGantt.lang['format-minute'];
				else                vLeftTable += '<input type=radio name="radFormat" onclick=JSGantt.changeFormat("minute",'+vGanttVar+'); value="minute" />'+JSGantt.lang['format-minute'];
			}
			
			// TODO: temporary function - should simply be done in a loop over formats array/object
			function tmpfunFormatAdd (currentFormatId, formatId, formatName)
			{
				return '<input type=radio id="radFormat_'+formatId+'" name="radFormat" value="'+formatId+'" '
					+(currentFormatId==formatId? 'checked' : 'onclick=JSGantt.changeFormat("'+formatId+'",'+vGanttVar+');')
					+'>'
					+'<label for="radFormat_'+formatId+'">'+formatName+'</label>';
			}
			if (vFormatArr.join().indexOf("hour")!=-1)
			{
				vLeftTable += tmpfunFormatAdd(vFormat, 'hour', JSGantt.lang['format-hour']);
			}
			if (vFormatArr.join().indexOf("day")!=-1)
			{
				vLeftTable += tmpfunFormatAdd(vFormat, 'day', JSGantt.lang['format-day']);
			}
			if (vFormatArr.join().indexOf("week")!=-1)
			{
				vLeftTable += tmpfunFormatAdd(vFormat, 'week', JSGantt.lang['format-week']);
			}
			if (vFormatArr.join().indexOf("month")!=-1)
			{ 
				vLeftTable += tmpfunFormatAdd(vFormat, 'month', JSGantt.lang['format-month']);
			}
			if (vFormatArr.join().indexOf("quarter")!=-1)
			{
				vLeftTable += tmpfunFormatAdd(vFormat, 'quarter', JSGantt.lang['format-quarter']);
			}
			
			// vLeftTable += '<INPUT TYPE=RADIO NAME="other" VALUE="other" style="display:none"> .';

			vLeftTable += '</td></tr></tbody></table></td>';

			vMainTable += vLeftTable;

			// Draw the Chart Rows
			vRightTable = 
			'<td>' +
			'<div class="chartarea" id="rightside">' +
			'<table>' +
			'<tbody><tr>';

			vTmpDate.setFullYear(vMinDate.getFullYear(), vMinDate.getMonth(), vMinDate.getDate());
			vTmpDate.setHours(0);
			vTmpDate.setMinutes(0);

			// Major Date Header
			while(Date.parse(vTmpDate) <= Date.parse(vMaxDate))
			{	
				vStr = vTmpDate.getFullYear() + '';
				vStr = vStr.substring(2,4);
				
				
				if(vFormat == 'minute')
				{
					vRightTable += '<td class=gdatehead align=center colspan=60>' ;
					vRightTable += JSGantt.formatDateStr(vTmpDate, vDateDisplayFormat) + ' ' + vTmpDate.getHours() + ':00 -' + vTmpDate.getHours() + ':59 </td>';
					vTmpDate.setHours(vTmpDate.getHours()+1);
				}
				
				if(vFormat == 'hour')
				{
					vRightTable += '<td class=gdatehead align=center colspan=24>' ;
					vRightTable += JSGantt.formatDateStr(vTmpDate, vDateDisplayFormat) + '</td>';
					vTmpDate.setDate(vTmpDate.getDate()+1);
				}
				
				if(vFormat == 'day')
				{
					vRightTable += '<td class=gdatehead align=center colspan=7>'
						+ JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].from)
						//+ JSGantt.formatDateStr(vTmpDate,vDateDisplayFormat.substring(0,5)) + ' - '
						//+ "FIXME" + ' - '
					;
					vTmpDate.setDate(vTmpDate.getDate()+6);
					vRightTable += JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].to) + '</td>';
					vTmpDate.setDate(vTmpDate.getDate()+1);
				}
				else if(vFormat == 'week')
				{
					//vRightTable += '<td class=gdatehead align=center width='+vColWidth+'px>`'+ vStr + '</td>';
					vRightTable += '<td class=gdatehead align=center width='+vColWidth+'px>'
						+ JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].upper)
						+ '</td>';
					vTmpDate.setDate(vTmpDate.getDate()+7);
				}
				else if(vFormat == 'month')
				{
					vRightTable += '<td class=gdatehead align=center width='+vColWidth+'px>' 
						+ JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].upper)
						+ '</td>';
					vTmpDate.setDate(vTmpDate.getDate() + 1);
					while(vTmpDate.getDate() > 1)
					{
						vTmpDate.setDate(vTmpDate.getDate() + 1);
					}
				}
				else if(vFormat == 'quarter')
				{
					vRightTable += '<td class=gdatehead align=center width='+vColWidth+'px>'
						+ JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].upper)
						+ '</td>';
					vTmpDate.setDate(vTmpDate.getDate() + 81);
					while(vTmpDate.getDate() > 1)
					{
						vTmpDate.setDate(vTmpDate.getDate() + 1);
					}
				}

			}

			vRightTable += '</tr><tr>';

			// Minor Date header and Cell Rows
			vTmpDate.setFullYear(vMinDate.getFullYear(), vMinDate.getMonth(), vMinDate.getDate());
			vNxtDate.setFullYear(vMinDate.getFullYear(), vMinDate.getMonth(), vMinDate.getDate());
			vNumCols = 0;
 
			while(Date.parse(vTmpDate) <= Date.parse(vMaxDate))
			{	
				if (vFormat == 'minute')
				{
			
					if( vTmpDate.getMinutes() ==0 ) 
						vWeekdayColor = "ccccff";
					else
						vWeekdayColor = "ffffff";
			
					vDateRowStr += '<td class="ghead"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">' + vTmpDate.getMinutes() + '</div></td>';
					vItemRowStr += '<td class="ghead" style="cursor: default;"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					vTmpDate.setMinutes(vTmpDate.getMinutes() + 1);
				}
				else if (vFormat == 'hour')
				{
					if(  vTmpDate.getHours() ==0  )
						vWeekdayColor = "ccccff";
					else
						vWeekdayColor = "ffffff";

					vDateRowStr += '<td class="ghead"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">' + vTmpDate.getHours() + '</div></td>';
					vItemRowStr += '<td class="ghead" style="cursor: default;"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					vTmpDate.setHours(vTmpDate.getHours() + 1);
				}

				else if(vFormat == 'day' )
				{
					// is it today?
					if( JSGantt.formatDateStr(vCurrDate,'yyyy-mm-dd') == JSGantt.formatDateStr(vTmpDate,'yyyy-mm-dd'))
					{
						vWeekdayColor  = "ccccff";
						vWeekendColor  = "9999ff";
						vWeekdayGColor  = "bbbbff";
						vWeekendGColor = "8888ff";
					}
					else
					{
						vWeekdayColor = "ffffff";
						vWeekendColor = "cfcfcf";
						vWeekdayGColor = "f3f3f3";
						vWeekendGColor = "c3c3c3";
					}
					
					if(vTmpDate.getDay() % 6 == 0)
					{
						vDateRowStr  += '<td class="gheadwkend" bgcolor=#' + vWeekendColor + ' align=center><div style="width: '+vColWidth+'px">' + vTmpDate.getDate() + '</div></td>';
						vItemRowStr  += '<td class="gheadwkend" style="cursor: default;"  bgcolor=#' + vWeekendColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp</div></td>';
					}
					else
					{
						vDateRowStr += '<td class="ghead"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">' + vTmpDate.getDate() + '</div></td>';
						// is it today?
						if( JSGantt.formatDateStr(vCurrDate,'yyyy-mm-dd') == JSGantt.formatDateStr(vTmpDate,'yyyy-mm-dd'))
							vItemRowStr += '<td class="ghead" style="cursor: default;"  bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" style="cursor: default;"  align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					}

					vTmpDate.setDate(vTmpDate.getDate() + 1);
				}
				else if(vFormat == 'week')
				{
					vNxtDate.setDate(vNxtDate.getDate() + 7);

					if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
						vWeekdayColor = "ccccff";
					else
						vWeekdayColor = "ffffff";

					if(vNxtDate <= vMaxDate) 
					{
						vDateRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center width:'+vColWidth+'px>'
							+'<div style="width: '+vColWidth+'px">' + JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower) + '</div></td>'
						;
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor="#' + vWeekdayColor + '" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';

					}
					else
					{
						vDateRowStr += '<td class="ghead" bgcolor="#' + vWeekdayColor + '" align=center width:'+vColWidth+'px>'
							+'<div style="width: '+vColWidth+'px">' + JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower) + '</div></td>';
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';

					}

					vTmpDate.setDate(vTmpDate.getDate() + 7);

				}
				else if(vFormat == 'month')
				{
					vNxtDate.setFullYear(vTmpDate.getFullYear(), vTmpDate.getMonth(), vMonthDaysArr[vTmpDate.getMonth()]);
					if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate )
						vWeekdayColor = "ccccff";
					else
						vWeekdayColor = "ffffff";

					if(vNxtDate <= vMaxDate)
					{
						vDateRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center width:'+vColWidth+'px><div style="width: '+vColWidth+'px">' 
							+ JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower)  + '</div></td>';
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					}
					else
					{
						vDateRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center width:'+vColWidth+'px><div style="width: '+vColWidth+'px">' + 
							JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower) + '</div></td>';
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					}

					vTmpDate.setDate(vTmpDate.getDate() + 1);

					while(vTmpDate.getDate() > 1) 
					{
						vTmpDate.setDate(vTmpDate.getDate() + 1);
					}

				}
				else if(vFormat == 'quarter')
				{

					vNxtDate.setDate(vNxtDate.getDate() + 122);
					if( vTmpDate.getMonth()==0 || vTmpDate.getMonth()==1 || vTmpDate.getMonth()==2 )
						vNxtDate.setFullYear(vTmpDate.getFullYear(), 2, 31);
					else if( vTmpDate.getMonth()==3 || vTmpDate.getMonth()==4 || vTmpDate.getMonth()==5 )
						vNxtDate.setFullYear(vTmpDate.getFullYear(), 5, 30);
					else if( vTmpDate.getMonth()==6 || vTmpDate.getMonth()==7 || vTmpDate.getMonth()==8 )
						vNxtDate.setFullYear(vTmpDate.getFullYear(), 8, 30);
					else if( vTmpDate.getMonth()==9 || vTmpDate.getMonth()==10 || vTmpDate.getMonth()==11 )
						vNxtDate.setFullYear(vTmpDate.getFullYear(), 11, 31);

					if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
						vWeekdayColor = "ccccff";
					else
						vWeekdayColor = "ffffff";

					if(vNxtDate <= vMaxDate) 
					{
						vDateRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center width:'+vColWidth+'px>'
							+'<div style="width: '+vColWidth+'px">' + JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower)  + '</div></td>';
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					}
					else
					{
						vDateRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center width:'+vColWidth+'px>'
							+'<div style="width: '+vColWidth+'px">' + JSGantt.formatDateStr(vTmpDate, vDateDisplayFormatCaptions[vFormat].lower)  + '</div></td>';
						if( vCurrDate >= vTmpDate && vCurrDate < vNxtDate ) 
							vItemRowStr += '<td class="ghead" bgcolor=#' + vWeekdayColor + ' align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
						else 
							vItemRowStr += '<td class="ghead" align=center><div style="width: '+vColWidth+'px">&nbsp&nbsp</div></td>';
					}

					vTmpDate.setDate(vTmpDate.getDate() + 81);

					while(vTmpDate.getDate() > 1) 
					{
						vTmpDate.setDate(vTmpDate.getDate() + 1);
					}

				}
			}

			vRightTable += vDateRowStr + '</tr>';
			vRightTable += '</tbody></table>';

			// Draw each row

			for(i = 0; i < vTaskList.length; i++)
			{

				vTmpDate.setFullYear(vMinDate.getFullYear(), vMinDate.getMonth(), vMinDate.getDate());
				vTaskStart = vTaskList[i].getStart();
				vTaskEnd   = vTaskList[i].getEnd();

				vNumCols = 0;
				vID = vTaskList[i].getID();

				// vNumUnits = Math.ceil((vTaskList[i].getEnd() - vTaskList[i].getStart()) / (24 * 60 * 60 * 1000)) + 1;
				vNumUnits = (vTaskList[i].getEnd() - vTaskList[i].getStart()) / (24 * 60 * 60 * 1000) + 1;
				if (vFormat=='hour')
				{
					vNumUnits = (vTaskList[i].getEnd() - vTaskList[i].getStart()) / (  60 * 1000) + 1;
				}
				else if (vFormat=='minute')
				{
					vNumUnits = (vTaskList[i].getEnd() - vTaskList[i].getStart()) / (  60 * 1000) + 1;
				}

				var isDuplicateTaskToBeMovedUp = false;
				if (vRightTable.indexOf(' id=childgrid_' + vID + ' ')==-1)	// to allow more bars on one row
				{
					if(vTaskList[i].getVisible() == 0)
						vRightTable += '<div id=childgrid_' + vID + ' style="position:relative; display:none;">';
					else
						vRightTable += '<div id=childgrid_' + vID + ' style="position:relative">';
				}
				else
				{
					isDuplicateTaskToBeMovedUp = true;
					vRightTable += '<div style="position:relative; top:-20px;">';
				}
				
				if( vTaskList[i].getMile())
				{
					vRightTable += '<div><table style="position:relative; top:0px; width: ' + vChartWidth + 'px;">' +
						'<tr id=childrow_' + vID + ' class=yesdisplay onmouseover="oJSGant.mouseOver(this,' + vID + ',\'right\',\'mile\')" onmouseout="oJSGant.mouseOut(this,' + vID + ',\'right\',\'mile\')">' + vItemRowStr + '</tr></table></div>';

					// Build date string for Title
					vDateRowStr = JSGantt.formatDateStr(vTaskStart,vDateDisplayFormat);

					vTaskLeft = (Date.parse(vTaskList[i].getStart()) - Date.parse(vMinDate)) / (24 * 60 * 60 * 1000);
					vTaskRight = 1

					vRightTable +=
						'<div id=bardiv_' + vID + ' style="position:absolute; top:0px; left:' + Math.ceil((vTaskLeft * (vDayWidth) - 2)) + 'px; height: 18px; width:15px; overflow:hidden;">' +
						'  <div id=taskbar_' + vID + ' title="' + vTaskList[i].getName() + ': ' + vDateRowStr + '" style="position:relative;left:3px; height: 16px; width:12px; overflow:hidden; cursor: pointer;" onclick=JSGantt.taskLink("' + vTaskList[i].getLink() + '",300,200);>';

					if(vTaskList[i].getCompVal() < 100)
						vRightTable += '&loz;</div>' ;
					else
						vRightTable += '&diams;</div>' ;

					if( oJSGant.getCaptionType() )
					{
						vCaptionStr = '';
						switch( oJSGant.getCaptionType() )
						{       
							case 'Caption':    vCaptionStr = vTaskList[i].getCaption();  break;
							case 'Resource':   vCaptionStr = vTaskList[i].getResource();  break;
							case 'Duration':   vCaptionStr = vTaskList[i].getDuration(vFormat);  break;
							case 'Complete':   vCaptionStr = vTaskList[i].getCompStr();  break;
						}
						//vRightTable += '<div style="position:absolute; left: 6px; top:1px;">' + vCaptionStr + '</div>';
						vRightTable += '<div style="position:absolute; top:2px; width:120px; left:12px">' + vCaptionStr + '</div>';
					}

					vRightTable += '</div>';
				}
				else
				{
					// Build date string for Title
					vDateRowStr = JSGantt.formatDateStr(vTaskStart,vDateDisplayFormat) + ' - ' + JSGantt.formatDateStr(vTaskEnd,vDateDisplayFormat)

					if (vFormat=='minute')
					{
						vTaskRight = (Date.parse(vTaskList[i].getEnd()) - Date.parse(vTaskList[i].getStart())) / ( 60 * 1000) + 1/vColUnit;
						vTaskLeft = Math.ceil((Date.parse(vTaskList[i].getStart()) - Date.parse(vMinDate)) / ( 60 * 1000));
					}
					else if (vFormat=='hour')
					{
						vTaskRight = (Date.parse(vTaskList[i].getEnd()) - Date.parse(vTaskList[i].getStart())) / ( 60 * 60 * 1000) + 1/vColUnit;
						vTaskLeft = (Date.parse(vTaskList[i].getStart()) - Date.parse(vMinDate)) / ( 60 * 60 * 1000);
					}
					else
					{
						vTaskRight = (Date.parse(vTaskList[i].getEnd()) - Date.parse(vTaskList[i].getStart())) / (24 * 60 * 60 * 1000) + 1/vColUnit;
						vTaskLeft = Math.ceil((Date.parse(vTaskList[i].getStart()) - Date.parse(vMinDate)) / (24 * 60 * 60 * 1000));
						if (vFormat='day')
						{
							var tTime=new Date();
							tTime.setTime(Date.parse(vTaskList[i].getStart()));
							if (tTime.getMinutes() > 29)
								vTaskLeft+=.5
						}
					}

					// Draw Group Bar  which has outer div with inner group div and several small divs to left and right to create angled-end indicators
					if( vTaskList[i].getGroup())
					{
						vRightTable += '<DIV><TABLE style="position:relative; top:0px; width: ' + vChartWidth + 'px;">' +
							'<TR id=childrow_' + vID + ' class=yesdisplay bgColor=#f3f3f3 onMouseover="oJSGant.mouseOver(this,' + vID + ',\'right\',\'group\')" onMouseout="oJSGant.mouseOut(this,' + vID + ',\'right\',\'group\')">' + vItemRowStr + '</TR></TABLE></DIV>';
						vRightTable +=
							'<div id=bardiv_' + vID + ' style="position:absolute; top:5px; left:' + Math.ceil(vTaskLeft * (vDayWidth) + 1) + 'px; height: 7px; width:' + Math.ceil((vTaskRight) * (vDayWidth) - 1) + 'px">' +
								'<div id=taskbar_' + vID + ' title="' + vTaskList[i].getName() + ': ' + vDateRowStr + '" class=gtask style="background-color:#000000; height: 7px; width:' + Math.ceil((vTaskRight) * (vDayWidth) -1) + 'px;  cursor: pointer;opacity:0.9;">' +
									'<div style="Z-INDEX: -4; float:left; background-color:#666666; height:3px; overflow: hidden; margin-top:1px; ' +
										'margin-left:1px; margin-right:1px; filter: alpha(opacity=80); opacity:0.8; width:' + vTaskList[i].getCompStr() + '; ' + 
										'cursor: pointer;" onclick=JSGantt.taskLink("' + vTaskList[i].getLink() + '",300,200);>' +
									'</div>' +
								'</div>' +
								'<div style="Z-INDEX: -4; float:left; background-color:#000000; height:4px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:right; background-color:#000000; height:4px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:left; background-color:#000000; height:3px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:right; background-color:#000000; height:3px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:left; background-color:#000000; height:2px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:right; background-color:#000000; height:2px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:left; background-color:#000000; height:1px; overflow: hidden; width:1px;"></div>' +
								'<div style="Z-INDEX: -4; float:right; background-color:#000000; height:1px; overflow: hidden; width:1px;"></div>'
						;

						if( oJSGant.getCaptionType() )
						{
							vCaptionStr = '';
							switch( oJSGant.getCaptionType() )
							{
								case 'Caption':    vCaptionStr = vTaskList[i].getCaption();  break;
								case 'Resource':   vCaptionStr = vTaskList[i].getResource();  break;
								case 'Duration':   vCaptionStr = vTaskList[i].getDuration(vFormat);  break;
								case 'Complete':   vCaptionStr = vTaskList[i].getCompStr();  break;
							}
							//vRightTable += '<div style="position:absolute; left: 6px; top:1px;">' + vCaptionStr + '</div>';
							vRightTable += '<div style="position:absolute; top:-3px; width:120px; left:' + (Math.ceil((vTaskRight) * (vDayWidth) - 1) + 6) + 'px">' + vCaptionStr + '</div>';
						}

						vRightTable += '</div>' ;
					}
					else
					{
						if (!isDuplicateTaskToBeMovedUp)
						{
							vDivStr = '<DIV><TABLE style="position:relative; top:0px; width: ' + vChartWidth + 'px;">' +
								'<TR id=childrow_' + vID + ' class=yesdisplay bgColor=#ffffff onMouseover="oJSGant.mouseOver(this,' + vID + ',\'right\',\'row\')" onMouseout="oJSGant.mouseOut(this,' + vID + ',\'right\',\'row\')">' + vItemRowStr + '</TR></TABLE></DIV>';
							vRightTable += vDivStr;
						}
						
						// Draw Task Bar  which has outer DIV with enclosed colored bar div, and opaque completion div
						vRightTable +=
							'<div id=bardiv_' + vID + ' style="position:absolute; top:4px; left:' + Math.ceil(vTaskLeft * (vDayWidth) + 1) + 'px; width:' + Math.ceil((vTaskRight) * (vDayWidth) - 1) + 'px">' +
								'<div id=taskbar_' + vID + ' title="' + vTaskList[i].getName() + ': ' + vDateRowStr + '" class=gtask style="background-color:#' + vTaskList[i].getColor() +'; height: 13px; width:' + Math.ceil((vTaskRight) * (vDayWidth) - 1) + 'px; cursor: pointer;opacity:0.9;" ' +
									'onclick=JSGantt.taskLink("' + vTaskList[i].getLink() + '",300,200); >' +
									'<div class=gcomplete style="Z-INDEX: -4; float:left; background-color:black; height:5px; overflow: auto; margin-top:4px; filter: alpha(opacity=40); opacity:0.4; width:' + vTaskList[i].getCompStr() + '; overflow:hidden">' +
									'</div>' +
								'</div>'
						;

						if( oJSGant.getCaptionType() ) 
						{
							vCaptionStr = '';
							switch( oJSGant.getCaptionType() ) {           
								case 'Caption':    vCaptionStr = vTaskList[i].getCaption();  break;
								case 'Resource':   vCaptionStr = vTaskList[i].getResource();  break;
								case 'Duration':   vCaptionStr = vTaskList[i].getDuration(vFormat);  break;
								case 'Complete':   vCaptionStr = vTaskList[i].getCompStr();  break;
							}
							//vRightTable += '<div style="position:absolute; left: 6px; top:-3px;">' + vCaptionStr + '</div>';
							vRightTable += '<div style="position:absolute; top:-3px; width:120px; left:' + (Math.ceil((vTaskRight) * (vDayWidth) - 1) + 6) + 'px">' + vCaptionStr + '</div>';
						}
						vRightTable += '</div>' ;
					}
				}
				vRightTable += '</DIV>';
			}

			vMainTable += vRightTable + '</DIV></TD></TR></TBODY></TABLE></div>';

			vDiv.innerHTML = vMainTable;

			// Chart window at full available size
			try
			{
				document.getElementById('rightside').style.width=(vDiv.clientWidth - vNameWidth - 20)+'px';// -20 <= some startup width bug (in Vector only?)
			} catch(e) {}
			if (typeof (this.isResizeAlreadyAdded)=='undefined')
			{
				this.isResizeAlreadyAdded = true;
				smpAddEvent(
					window, 'resize'
					, function()
					{
						try
						{
							document.getElementById('rightside').style.width=(vDiv.clientWidth - vNameWidth)+'px';
						} catch(e) {}
					}
				);
			}
			//
		}

	} //this.draw

	this.mouseOver = function( pObj, pID, pPos, pType )
	{
		if( pPos == 'right' )  vID = 'child_' + pID;
		else vID = 'childrow_' + pID;
	  
		pObj.bgColor = "#ffffaa";
		vRowObj = JSGantt.findObj(vID);
		if (vRowObj) vRowObj.bgColor = "#ffffaa";
	}

	this.mouseOut = function( pObj, pID, pPos, pType )
	{
		if( pPos == 'right' )  vID = 'child_' + pID;
		else vID = 'childrow_' + pID;
		
		pObj.bgColor = "#ffffff";
		vRowObj = JSGantt.findObj(vID);
		if (vRowObj)
		{
			if( pType == "group")
			{
				pObj.bgColor = "#f3f3f3";
				vRowObj.bgColor = "#f3f3f3";
			}
			else
			{
				pObj.bgColor = "#ffffff";
				vRowObj.bgColor = "#ffffff";
			}
		}
	}

} //GanttChart		

// Recursively process task tree ... set min, max dates of parent tasks and identfy task level.
JSGantt.processRows = function(pList, pID, pRow, pLevel, pOpen)
{

	var vMinDate = new Date();
	var vMaxDate = new Date();
	var vMinSet  = 0;
	var vMaxSet  = 0;
	var vList    = pList;
	var vLevel   = pLevel;
	var i        = 0;
	var vNumKid  = 0;
	var vCompSum = 0;
	var vVisible = pOpen;

	for(i = 0; i < pList.length; i++)
	{
		if(pList[i].getParent() == pID)
		{
			vVisible = pOpen;
			pList[i].setVisible(vVisible);
			if(vVisible==1 && pList[i].getOpen() == 0) 
				vVisible = 0;
				
			pList[i].setLevel(vLevel);
			vNumKid++;

			if(pList[i].getGroup() == 1)
			{
				JSGantt.processRows(vList, pList[i].getID(), i, vLevel+1, vVisible);
			}

			if( vMinSet==0 || pList[i].getStart() < vMinDate)
			{
				vMinDate = pList[i].getStart();
				vMinSet = 1;
			}

			if( vMaxSet==0 || pList[i].getEnd() > vMaxDate)
			{
				vMaxDate = pList[i].getEnd();
				vMaxSet = 1;
			}

			vCompSum += pList[i].getCompVal();
		}
	}

	if(pRow >= 0)
	{
		pList[pRow].setStart(vMinDate);
		pList[pRow].setEnd(vMaxDate);
		pList[pRow].setNumKid(vNumKid);
		pList[pRow].setCompVal(Math.ceil(vCompSum/vNumKid));
	}
}


// Used to determine the minimum date of all tasks and set lower bound based on format
JSGantt.getMinDate = function getMinDate(pList, pFormat)  
{

	var vDate = new Date();

	vDate.setFullYear(pList[0].getStart().getFullYear(), pList[0].getStart().getMonth(), pList[0].getStart().getDate());

	// Parse all Task End dates to find min
	for(i = 0; i < pList.length; i++)
	{
		if(Date.parse(pList[i].getStart()) < Date.parse(vDate))
			vDate.setFullYear(pList[i].getStart().getFullYear(), pList[i].getStart().getMonth(), pList[i].getStart().getDate());
	}

	if ( pFormat== 'minute')
	{
		vDate.setHours(0);
		vDate.setMinutes(0);
	}
	else if (pFormat == 'hour' )
	{
		vDate.setHours(0);
		vDate.setMinutes(0);
	}
	// Adjust min date to specific format boundaries (first of week or first of month)
	else if (pFormat=='day')
	{
		vDate.setDate(vDate.getDate() - 1);
		while(vDate.getDay() % 7 > 0)
		{
			vDate.setDate(vDate.getDate() - 1);
		}

	}

	else if (pFormat=='week')
	{
		vDate.setDate(vDate.getDate() - 7);
		while(vDate.getDay() % 7 > 0)
		{
			vDate.setDate(vDate.getDate() - 1);
		}
	}

	else if (pFormat=='month')
	{
		while(vDate.getDate() > 1)
		{
			vDate.setDate(vDate.getDate() - 1);
		}
	}

	else if (pFormat=='quarter')
	{
		if( vDate.getMonth()==0 || vDate.getMonth()==1 || vDate.getMonth()==2 )
			vDate.setFullYear(vDate.getFullYear(), 0, 1);
		else if( vDate.getMonth()==3 || vDate.getMonth()==4 || vDate.getMonth()==5 )
			vDate.setFullYear(vDate.getFullYear(), 3, 1);
		else if( vDate.getMonth()==6 || vDate.getMonth()==7 || vDate.getMonth()==8 )
			vDate.setFullYear(vDate.getFullYear(), 6, 1);
		else if( vDate.getMonth()==9 || vDate.getMonth()==10 || vDate.getMonth()==11 )
			vDate.setFullYear(vDate.getFullYear(), 9, 1);
	}

	return(vDate);

}

// Used to determine the minimum date of all tasks and set lower bound based on format

JSGantt.getMaxDate = function (pList, pFormat)
{
	var vDate = new Date();

	vDate.setFullYear(pList[0].getEnd().getFullYear(), pList[0].getEnd().getMonth(), pList[0].getEnd().getDate());
	
	// Parse all Task End dates to find max
	for(i = 0; i < pList.length; i++)
	{
		if(Date.parse(pList[i].getEnd()) > Date.parse(vDate))
		{
			//vDate.setFullYear(pList[0].getEnd().getFullYear(), pList[0].getEnd().getMonth(), pList[0].getEnd().getDate());
			vDate.setTime(Date.parse(pList[i].getEnd()));
		}	
	}
	
	if (pFormat == 'minute')
	{
		vDate.setHours(vDate.getHours() + 1);
		vDate.setMinutes(59);
	}
	
	if (pFormat == 'hour')
	{
		vDate.setHours(vDate.getHours() + 2);
	}				
		
	// Adjust max date to specific format boundaries (end of week or end of month)
	if (pFormat=='day')
	{
		vDate.setDate(vDate.getDate() + 1);

		while(vDate.getDay() % 6 > 0)
		{
			vDate.setDate(vDate.getDate() + 1);
		}

	}

	if (pFormat=='week')
	{
		//For weeks, what is the last logical boundary?
		vDate.setDate(vDate.getDate() + 11);

		while(vDate.getDay() % 6 > 0)
		{
			vDate.setDate(vDate.getDate() + 1);
		}

	}

	// Set to last day of current Month
	if (pFormat=='month')
	{
		while(vDate.getDay() > 1)
		{
			vDate.setDate(vDate.getDate() + 1);
		}

		vDate.setDate(vDate.getDate() - 1);
	}

	// Set to last day of current Quarter
	if (pFormat=='quarter')
	{
		if( vDate.getMonth()==0 || vDate.getMonth()==1 || vDate.getMonth()==2 )
			vDate.setFullYear(vDate.getFullYear(), 2, 31);
		else if( vDate.getMonth()==3 || vDate.getMonth()==4 || vDate.getMonth()==5 )
			vDate.setFullYear(vDate.getFullYear(), 5, 30);
		else if( vDate.getMonth()==6 || vDate.getMonth()==7 || vDate.getMonth()==8 )
			vDate.setFullYear(vDate.getFullYear(), 8, 30);
		else if( vDate.getMonth()==9 || vDate.getMonth()==10 || vDate.getMonth()==11 )
			vDate.setFullYear(vDate.getFullYear(), 11, 31);

	}

	return(vDate);

}

// This function finds the document id of the specified object
JSGantt.findObj = function (theObj, theDoc)
{
	var p, i, foundObj;

	if(!theDoc) theDoc = document;

	if( (p = theObj.indexOf("?")) > 0 && parent.frames.length)
	{
		theDoc = parent.frames[theObj.substring(p+1)].document;
		theObj = theObj.substring(0,p);
	}

	if(!(foundObj = theDoc[theObj]) && theDoc.all) 
		foundObj = theDoc.all[theObj];

	for (i=0; !foundObj && i < theDoc.forms.length; i++) 
		foundObj = theDoc.forms[i][theObj];

	for(i=0; !foundObj && theDoc.layers && i < theDoc.layers.length; i++)
		foundObj = JSGantt.findObj(theObj,theDoc.layers[i].document);

	if(!foundObj && document.getElementById)
		foundObj = document.getElementById(theObj);

	return foundObj;
}

JSGantt.changeFormat = function(pFormat,ganttObj)
{
	if(ganttObj) 
	{
		ganttObj.setFormat(pFormat);
		ganttObj.DrawDependencies();
	}
	else
		alert('Chart undefined');
}





// Function to open/close and hide/show children of specified task
JSGantt.folder= function (pID,ganttObj)
{
	var vList = ganttObj.getList();

	for(i = 0; i < vList.length; i++)
	{
		if(vList[i].getID() == pID)
		{
			if( vList[i].getOpen() == 1 )
			{
				vList[i].setOpen(0);
				JSGantt.hide(pID,ganttObj);

				if (JSGantt.isIE()) 
					JSGantt.findObj('group_'+pID).innerText = '+';
				else
					JSGantt.findObj('group_'+pID).textContent = '+';
				
			}
			else
			{
				vList[i].setOpen(1);

				JSGantt.show(pID, 1, ganttObj);

					if (JSGantt.isIE()) 
						JSGantt.findObj('group_'+pID).innerText = '–';
					else
						JSGantt.findObj('group_'+pID).textContent = '–';
			}
		}
	}
}

JSGantt.hide = function (pID,ganttObj)
{
	var vList = ganttObj.getList();
	var vID   = 0;

	for(var i = 0; i < vList.length; i++)
	{
		if(vList[i].getParent() == pID)
		{
			vID = vList[i].getID();
			JSGantt.findObj('child_' + vID).style.display = "none";
			JSGantt.findObj('childgrid_' + vID).style.display = "none";
			vList[i].setVisible(0);
			if(vList[i].getGroup() == 1) 
				JSGantt.hide(vID,ganttObj);
		}
	}
}

// Function to show children of specified task
JSGantt.show =  function (pID, pTop, ganttObj)
{
	var vList = ganttObj.getList();
	var vID   = 0;

	for(var i = 0; i < vList.length; i++)
	{
		if(vList[i].getParent() == pID)
		{
			vID = vList[i].getID();
			if(pTop == 1)
			{
				if (JSGantt.isIE()) { // IE;
					if( JSGantt.findObj('group_'+pID).innerText == '+')
					{
						JSGantt.findObj('child_'+vID).style.display = "";
						JSGantt.findObj('childgrid_'+vID).style.display = "";
						vList[i].setVisible(1);
					}
				}
				else
				{
					if( JSGantt.findObj('group_'+pID).textContent == '+')
					{
						JSGantt.findObj('child_'+vID).style.display = "";
						JSGantt.findObj('childgrid_'+vID).style.display = "";
						vList[i].setVisible(1);
					}
				}
			}
			else
			{
				if (JSGantt.isIE()) // IE;
				{
					if( JSGantt.findObj('group_'+pID).innerText == '–') 
					{
						JSGantt.findObj('child_'+vID).style.display = "";
						JSGantt.findObj('childgrid_'+vID).style.display = "";
						vList[i].setVisible(1);
					}
				}
				else
				{
					if( JSGantt.findObj('group_'+pID).textContent == '–')
					{
						JSGantt.findObj('child_'+vID).style.display = "";
						JSGantt.findObj('childgrid_'+vID).style.display = "";
						vList[i].setVisible(1);
					}
				}
			}

			if(vList[i].getGroup() == 1) 
				JSGantt.show(vID, 0,ganttObj);
		}
	}
}


  


// function to open window to display task link

JSGantt.taskLink = function(pRef,pWidth,pHeight) 
{
	if(pWidth)  vWidth =pWidth;  else vWidth =400;
	if(pHeight) vHeight=pHeight; else vHeight=400;

	var OpenWindow=window.open(pRef, "newwin", "height="+vHeight+",width="+vWidth);
}

JSGantt.parseDateStr = function(pDateStr,pFormatStr)
{
	var vDate = Date.parseDate(pDateStr, pFormatStr);
	return(vDate);
}

JSGantt.formatDateStr = function(pDate,pFormatStr)
{
	var vDateStr = pDate.dateFormat(pFormatStr);
	return(vDateStr);
}

JSGantt.parseXML = function(ThisFile,pGanttVar)
{
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;   // Is this Chrome 
	
	try { //Internet Explorer  
		xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
	}
	catch(e)
	{
		try { //Firefox, Mozilla, Opera, Chrome etc. 
			if (is_chrome==false) {  xmlDoc=document.implementation.createDocument("","",null); }
		}
		catch(e) {
			alert(e.message);
			return;
		}
	}

	if (is_chrome==false)	// can't use xmlDoc.load in chrome at the moment
	{
		xmlDoc.async=false;
		xmlDoc.load(ThisFile);		// we can use  loadxml
		JSGantt.AddXMLTask(pGanttVar)
		xmlDoc=null;			// a little tidying
		Task = null;
	}
	else
	{
		JSGantt.ChromeLoadXML(ThisFile,pGanttVar);	
		ta=null;	// a little tidying	
	}
}

JSGantt.AddXMLTask = function(pGanttVar)
{
	Task=xmlDoc.getElementsByTagName("task");
	
	//var n = xmlDoc.documentElement.childNodes.length;	// the number of tasks. IE gets this right, but mozilla add extra ones (Whitespace)
	
	//for(var i=0;i<n;i++)
	for(var i=0;i<Task.length;i++)
	{
		// optional parameters may not have an entry (Whitespace from mozilla also returns an error )
		// Task ID must NOT be zero other wise it will be skipped
		try { pID = Task[i].getElementsByTagName("pID")[0].childNodes[0].nodeValue;
		} catch (error) {pID =0;}
		pID *= 1;	// make sure that these are numbers rather than strings in order to make jsgantt.js behave as expected.

		if(pID!=0)
		{
	 		try { pName = Task[i].getElementsByTagName("pName")[0].childNodes[0].nodeValue;
			} catch (error) {pName ="No Task Name";}			// If there is no corresponding entry in the XML file the set a default.
		
			try { pColor = Task[i].getElementsByTagName("pColor")[0].childNodes[0].nodeValue;
			} catch (error) {pColor ="0000ff";}
			
			try { pParent = Task[i].getElementsByTagName("pParent")[0].childNodes[0].nodeValue;
			} catch (error) {pParent =0;}
			pParent *= 1;
	
			try { pStart = Task[i].getElementsByTagName("pStart")[0].childNodes[0].nodeValue;
			} catch (error) {pStart ="";}

			try { pEnd = Task[i].getElementsByTagName("pEnd")[0].childNodes[0].nodeValue;
			} catch (error) { pEnd ="";}

			try { pLink = Task[i].getElementsByTagName("pLink")[0].childNodes[0].nodeValue;
			} catch (error) { pLink ="";}
	
			try { pMile = Task[i].getElementsByTagName("pMile")[0].childNodes[0].nodeValue;
			} catch (error) { pMile=0;}
			pMile *= 1;

			try { pRes = Task[i].getElementsByTagName("pRes")[0].childNodes[0].nodeValue;
			} catch (error) { pRes ="";}

			try { pComp = Task[i].getElementsByTagName("pComp")[0].childNodes[0].nodeValue;
			} catch (error) {pComp =0;}
			pComp *= 1;

			try { pGroup = Task[i].getElementsByTagName("pGroup")[0].childNodes[0].nodeValue;
			} catch (error) {pGroup =0;}
			pGroup *= 1;

			try { pOpen = Task[i].getElementsByTagName("pOpen")[0].childNodes[0].nodeValue;
			} catch (error) { pOpen =1;}
			pOpen *= 1;

			try { pDepend = Task[i].getElementsByTagName("pDepend")[0].childNodes[0].nodeValue;
			} catch (error) { pDepend =0;}
			//pDepend *= 1;
			if (pDepend.length==0){pDepend=''} // need this to draw the dependency lines
			
			try { pCaption = Task[i].getElementsByTagName("pCaption")[0].childNodes[0].nodeValue;
			} catch (error) { pCaption ="";}
			
			
			// Finally add the task
			pGanttVar.AddTaskItem(new JSGantt.TaskItem(pID , pName, pStart, pEnd, pColor,  pLink, pMile, pRes,  pComp, pGroup, pParent, pOpen, pDepend,pCaption));
		}
	}
}

JSGantt.ChromeLoadXML = function(ThisFile,pGanttVar)
{
	// Thanks to vodobas at mindlence,com for the initial pointers here.
	XMLLoader = new XMLHttpRequest();
	XMLLoader.onreadystatechange= function()
	{
		JSGantt.ChromeXMLParse(pGanttVar);
	};
	XMLLoader.open("GET", ThisFile, false);
	XMLLoader.send(null);
}

JSGantt.ChromeXMLParse = function (pGanttVar)
{
	// Manually parse the file as it is loads quicker
	if (XMLLoader.readyState == 4)
	{
		var ta=XMLLoader.responseText.split(/<task>/gi);

		var n = ta.length;	// the number of tasks. 
		for(var i=1;i<n;i++) {
			Task = ta[i].replace(/<[/]p/g, '<p');	
			var te = Task.split(/<pid>/i)
	
			if(te.length> 2){var pID=te[1];} else {var pID = 0;}
			pID *= 1;
	
			var te = Task.split(/<pName>/i)
			if(te.length> 2){var pName=te[1];} else {var pName = "No Task Name";}
	
			var te = Task.split(/<pstart>/i)
			if(te.length> 2){var pStart=te[1];} else {var pStart = "";}
	
			var te = Task.split(/<pEnd>/i)
			if(te.length> 2){var pEnd=te[1];} else {var pEnd = "";}
	
			var te = Task.split(/<pColor>/i)
			if(te.length> 2){var pColor=te[1];} else {var pColor = '0000ff';}

			var te = Task.split(/<pLink>/i)
			if(te.length> 2){var pLink=te[1];} else {var pLink = "";}
	
			var te = Task.split(/<pMile>/i)
			if(te.length> 2){var pMile=te[1];} else {var pMile = 0;}
			pMile  *= 1;
	
			var te = Task.split(/<pRes>/i)
			if(te.length> 2){var pRes=te[1];} else {var pRes = "";}	
	
			var te = Task.split(/<pComp>/i)
			if(te.length> 2){var pComp=te[1];} else {var pComp = 0;}	
			pComp  *= 1;
	
			var te = Task.split(/<pGroup>/i)
			if(te.length> 2){var pGroup=te[1];} else {var pGroup = 0;}	
			pGroup *= 1;

			var te = Task.split(/<pParent>/i)
			if(te.length> 2){var pParent=te[1];} else {var pParent = 0;}	
			pParent *= 1;
	
			var te = Task.split(/<pOpen>/i)
			if(te.length> 2){var pOpen=te[1];} else {var pOpen = 1;}
			pOpen *= 1;
	
			var te = Task.split(/<pDepend>/i)
			if(te.length> 2){var pDepend=te[1];} else {var pDepend = "";}	
			//pDepend *= 1;
			if (pDepend.length==0){pDepend=''} // need this to draw the dependency lines
			
			var te = Task.split(/<pCaption>/i)
			if(te.length> 2){var pCaption=te[1];} else {var pCaption = "";}
			
			// Finally add the task
			pGanttVar.AddTaskItem(new JSGantt.TaskItem(pID , pName, pStart, pEnd, pColor,  pLink, pMile, pRes,  pComp, pGroup, pParent, pOpen, pDepend,pCaption 	));
		}
	}
}

JSGantt.benchMark = function(pItem)
{
   var vEndTime=new Date().getTime();
   alert(pItem + ': Elapsed time: '+((vEndTime-vBenchTime)/1000)+' seconds.');
   vBenchTime=new Date().getTime();
}

// simple event adder
if (typeof smpAddEvent != 'function')
{
	function smpAddEvent(obj, onwhat, fun)
	{
		if (obj.addEventListener)
		{
			obj.addEventListener(onwhat, fun, false);
		}
		else if (obj.attachEvent)
		{
			obj.attachEvent('on'+onwhat, fun);
		}
		else
		{
			// error
		}
	}
}