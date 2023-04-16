/**
	Flyspray to Wiki Gantt Updater
	
	Useses:
		* oLoader
		* oJSGantInline.redraw
	
	@author Maciej Jaros
	
	@todo
		- get FS base link from real links (a.href of tasks?) = don't assume any base links
*/

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *\
	The class
\* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */

/**
	Constructor
*/
function cJSGanttUpdate(strInputId)
{
	//! input element for gantt code
	//! @access private
	this.elInput = null;
	
	//! tasks XMLDocument
	//! @access private
	this.docLocalTasks = null;

	//! flyspray base
	//! @access private
	//this.strFSBaseLink = null;
	this.strFSBaseLink = 'http://prl.mol.com.pl/bugz/';	// this is assumed to be a default link base
	//this.strFSBaseLink = 'http://prl.mol.com.pl/rejsz/';

	//! flyspray edit link
	//! @access private
	this.strFSEditLink = '';
	
	//
	// Init variables
	try
	{
		this.elInput = document.getElementById(strInputId);
	}
	catch (e)
	{
		//throw(e.message);
		alert(e.message);
	}
}

/**
	Set flyspray base link
	
	Attemps to get baselink from textarea

	@access public
	
	@param strFSBaseLink [optional] Explicit Flyspray baselink string
	@return true upon success
*/
cJSGanttUpdate.prototype.setFSBaseLink = function(strFSBaseLink)
{
	if (typeof(strFSBaseLink) == 'undefined')
	{
		var strTasksXML = this.elInput.value;
		strTasksXML.replace(/<jsgantt[^>]*\sbaselink="([^"]+)"[\s>]/, function(a, strGanttBaselink)
		{
			strFSBaseLink = strGanttBaselink;//.replace(/\/index\.php.+/, '/');
		});
	}
	if (typeof(strFSBaseLink) === 'string') {
		strFSBaseLink = strFSBaseLink.replace(/\/index\.php.+/, '/');
		this.strFSBaseLink = strFSBaseLink;
		return true;
	}
	return false;
};

/**
	Set flyspray edit link
	
	Attemps to get edit (source) link from textarea

	@access public
	
	@param strFSEditLink [optional] Explicit Flyspray edit link string
*/
cJSGanttUpdate.prototype.setFSEditLink = function(strFSEditLink)
{
	if (typeof(strFSEditLink) == 'undefined')
	{
		var strTasksXML = this.elInput.value;
		strTasksXML.replace(/<jsgantt[^>]*>\s+<!--\s[^\-]*?(https?:\/\/.+\S)\s+-->/, function(a, strSourcelink)
		{
			strFSEditLink = strSourcelink.replace(/&amp;/g, '&');
		});
	}
	this.strFSEditLink = (typeof(strFSEditLink) == 'undefined') ? '' : strFSEditLink;
};

/**
	Get gantt update link
	
	Gets gantt update link based on a CSV list or an array of task's IDs (\a csvTasksIds)

	@access private
*/
cJSGanttUpdate.prototype.getGanttUpdateLink = function(vTasksIds)
{
	if (typeof(vTasksIds) == 'object')
	{
		vTasksIds = vTasksIds.join(',');
	}
	return this.strFSBaseLink + 'index.php?do=gantt_export&mode=text&ids=' + vTasksIds;
};

/**
	Get local XML string code of tasks

	@access private
	@return XML string prepared for parsing
*/
cJSGanttUpdate.prototype.getLocalGanttXmlString = function()
{
	var strTasksXML = this.elInput.value;
	// remove any non-gantt code
	strTasksXML = strTasksXML.replace(/[\s\S]*(<jsgantt[^>]*>[\s\S]*?<\/jsgantt>)/, '$1');
	strTasksXML = strTasksXML.replace(/(<jsgantt[^>]*>[\s\S]*?<\/jsgantt>)[\s\S]*/, '$1');
	// fix amps
	strTasksXML = strTasksXML.replace(/&(?![a-z]+;)/g, '&amp;');

	return strTasksXML;
}

/**
	Get local data of tasks

	@access private
	@return false upon error
*/
cJSGanttUpdate.prototype.loadTasks = function()
{
	var strTasksXML = this.getLocalGanttXmlString();

	// load as XML doc.
	this.docLocalTasks = oLoader.loadXMLDocFromStr(strTasksXML);

	// error handling
	strTasksXML = oLoader.convertXMLDocToStr(this.docLocalTasks);
	if (strTasksXML.search(/<jsgantt[^>]*>[\s\S]*?<\/jsgantt>/)<0)
	{
		this.log (strTasksXML);
		return false;
	}
	return true;
};

/**
	Logging to console

	@access private
*/
cJSGanttUpdate.prototype.log = function(strMsg)
{
	if (typeof(console) != 'undefined' && typeof(console.log) == 'function')
	{
		console.log(strMsg)
	}
};

/**
	Standard error handling

	@access private
*/
cJSGanttUpdate.prototype.displayError = function(strMsg)
{
	alert(strMsg);
};


/**
	Update tasks in textarea

	@access private
*/
cJSGanttUpdate.prototype.updateTasksInput = function()
{
	// get new gantt code and replace old
	var strTasksXML = oLoader.convertXMLDocToStr(this.docLocalTasks);
	strTasksXML = strTasksXML.replace(/<\?xml.+?\?>/, '');	// remove XML header
	strTasksXML = this.elInput.value.replace(/(<jsgantt[^>]*>[\s\S]*?<\/jsgantt>)/, strTasksXML);
	// update
	this.elInput.value = strTasksXML;
};

/**
	Update chart from textarea

	@access private
*/
cJSGanttUpdate.prototype.chartUpdate = function()
{
	var strTasksXML = this.getLocalGanttXmlString();
	// redraw
	oJSGantInline.redraw(strTasksXML);
};

/**
	Get real task id from XML pID element or string.
	
	@access private

	@return The task id
*/
cJSGanttUpdate.prototype.getTaskId = function(pId)
{
	if (typeof(pId) != 'string')
	{
		pId = pId.textContent;
	}
	return pId.replace(/^\s*([0-9]+).*$/, '$1');
};

/**
	Get current tasks ids from document
	
	@access private

	@return An array of ids
*/
cJSGanttUpdate.prototype.getTaskIds = function()
{
	var docTasks = this.docLocalTasks;
	
	var elIds = docTasks.getElementsByTagName('pID');
	var arrIds = [];
	for (var i = 0; i < elIds.length; i++)
	{
		arrIds.push(this.getTaskId(elIds[i]));
	}
	
	return arrIds;
};

/**
	Update internal tasks data from given xml task data
	
	This is supposed to update tasks data in the following tags:
	* pName
	* pRes
	* pOpen
	* pDepend
	* pComp
	* pColor
	
	Tasks are identified by pID contents.
	
	@access private
	
	@param docFreshTasks An XML document containing fresh data of tasks
*/
cJSGanttUpdate.prototype.updateInternalTasks = function(docFreshTasks)
{
	var docTasks = this.docLocalTasks;
	
	// get id based array of local tasks
	var elIds = docTasks.getElementsByTagName('pID');
	var vTaskIdToI = {};
	var vGanttIdToI = {};
	for (var i = 0; i < elIds.length; i++)
	{
		vGanttIdToI[elIds[i]] = i;
		vTaskIdToI[this.getTaskId(elIds[i])] = i;
	}
	
	// update
	var elLocalTasks = docTasks.getElementsByTagName('task');
	var elFreshTasks = docFreshTasks.getElementsByTagName('task');
	for (var i = 0; i < elFreshTasks.length; i++)
	{
		var elLocalTask = null;
		var isExactMatch = false;
		var oFresh = {
			'pID'     : elFreshTasks[i].getElementsByTagName('pID')[0]    .textContent
			,'taskID' : this.getTaskId(elFreshTasks[i].getElementsByTagName('pID')[0])
			,'pName'  : elFreshTasks[i].getElementsByTagName('pName')[0]  .textContent
			,'pRes'   : elFreshTasks[i].getElementsByTagName('pRes')[0]   .textContent
			,'pOpen'  : elFreshTasks[i].getElementsByTagName('pOpen')[0]  .textContent
			,'pDepend': elFreshTasks[i].getElementsByTagName('pDepend')[0].textContent
			,'pComp'  : elFreshTasks[i].getElementsByTagName('pComp')[0]  .textContent
			,'pColor' : elFreshTasks[i].getElementsByTagName('pColor')[0]  .textContent
		};
		// exact match (with resource id)
		if (oFresh.pID in vGanttIdToI)
		{
			isExactMatch = true;
			elLocalTask = elLocalTasks[vGanttIdToI[oFresh.pID]];
		}
		// non-exact match (with task id only)
		else if (oFresh.taskID in vTaskIdToI)
		{
			elLocalTask = elLocalTasks[vTaskIdToI[oFresh.taskID]];
		}
		if (elLocalTask !== null)
		{
			elLocalTask.getElementsByTagName('pName')[0]  .textContent  = oFresh['pName']  ;
			if (isExactMatch)
			{
				elLocalTask.getElementsByTagName('pRes')[0]   .textContent  = oFresh['pRes']   ;
			}
			elLocalTask.getElementsByTagName('pOpen')[0]  .textContent  = oFresh['pOpen']  ;
			elLocalTask.getElementsByTagName('pDepend')[0].textContent  = oFresh['pDepend'];
			elLocalTask.getElementsByTagName('pComp')[0]  .textContent  = oFresh['pComp']  ;
			elLocalTask.getElementsByTagName('pColor')[0]  .textContent = oFresh['pColor']  ;
		}
	}
};

/**
	Checks if input contains tasks that could be updated
	
	Checks if:
	- there are any tasks in the textarea
	- there is an autolink attribute and it's non-zero
	
	@access public
*/
cJSGanttUpdate.prototype.isOKForGanttUpdate = function()
{
	// is input set?
	if (!this.elInput)
	{
		return false;
	}
	
	// is there an autolink attribute? (if there is none then this is probably not a flyspray gantt)
	if (this.elInput.value.search(/<jsgantt[^>]*\sautolink="([^0"]+)"[\s>]/) == -1)
	{
		return false;
	}

	// are there any tasks available?
	if (this.elInput.value.search(/<jsgantt[^>]*>[\s\S]*?<task>[\s\S]*?<\/jsgantt>/) == -1)
	{
		return false;
	}
	/*
	this.loadTasks();
	try
	{
		if (this.docLocalTasks.getElementsByTagName('pID').length > 0)
		{
			return true;
		}
		return false;
	}
	catch (e)
	{
		return false;
	}
	*/

	// at this point all should be fine
	return true;
};

/**
	Update textarea and chart from flyspary
	
	@access public
*/
cJSGanttUpdate.prototype.update = function()
{
	// Get current data (from textarea).
	if (!this.loadTasks())
	{
		this.displayError('Error while loading local task data');
		return;
	}

	// Create a list of ids of tasks and get external data.
	var arrTasksIds = this.getTaskIds();
	var docFreshTasks = oLoader.loadXMLDocFromURL(this.getGanttUpdateLink(arrTasksIds));
	
	// Update internal data.
	this.updateInternalTasks(docFreshTasks);
	
	// Update data (to textarea).
	this.updateTasksInput();
	
	// Update chart from textarea.
	this.chartUpdate();
};

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *\
	Object init + button
\* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var oJSGanttUpdate = null;
jQuery (function()
{
	oJSGanttUpdate = new cJSGanttUpdate('wpTextbox1');
	if (oJSGanttUpdate.isOKForGanttUpdate())
	{
		oJSGanttUpdate.setFSBaseLink();
		oJSGanttUpdate.setFSEditLink();
		//oJSGanttUpdate.update();
		var elTB = document.getElementById('toolbar');
		if (!elTB)
		{
			return;
		}
		var nel = document.createElement('a');
		nel.href = "javascript:oJSGanttUpdate.update()";
		nel.style.cssText = "float:right; padding:0 .2em 0 .4em;";
		nel.appendChild(document.createTextNode('Aktualizuj Gantta'));
		nel.title = 'Aktualizuje diagram z Flyspray (pomija daty)';
		elTB.appendChild(nel);

		if (oJSGanttUpdate.strFSEditLink.length)
		{
			nel = document.createElement('a');
			nel.href = oJSGanttUpdate.strFSEditLink;
			nel.setAttribute('target', '_blank');
			nel.style.cssText = "float:right; padding:0 .2em 0 .4em; background-image:none";	// img none for https
			nel.appendChild(document.createTextNode('Edytuj Gantta'));
			nel.title = 'Przejście do źródłowego linka';
			elTB.appendChild(nel);
		}
	}
});