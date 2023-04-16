/**
	Flyspray to Wiki Gantt Updater extension - add task
	
	Useses:
		* oLoader
		* oJSGantInline.redraw
		* cJSGanttUpdate
		* oJobSchEd.createForm
	
	@author Maciej Jaros
	
	@todo
		- sub obj instead of adding functions to cJSGanttUpdate
		- i18n
		- ASSERT this.conf undefined!
*/

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *\
	Extension Object
\* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
var oJSGanttUpdateTaskExt = null;

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *\
	The class extension
\* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
jQuery (function()
{
	/**
		Show/build add task window

		@access public
	*/
	cJSGanttUpdate.prototype.taskextInit = function(objName)
	{
		// task form
		var msg = new sftJSmsg();
		msg.repositionMsgCenter();
		msg.styleWidth = 500;
		msg.styleZbase += 30;
		msg.showCancel = true;
		msg.autoOKClose = false;
		msg.createRegularForm = false;
		this.taskextOMsg = msg;
		
		this.objName = objName;
		
		// ASSERT this.conf undefined!
		this.conf = {'':''
			,strFormatJQ : 'yy-mm-dd'	// date format for JQuery date-picker
			,strFormat : 'Y-m-d'		// date format for date-functions
		};
	}

	/**
		Show/build add task window

		@access public
	*/
	cJSGanttUpdate.prototype.taskextShowAdd = function()
	{
		// get/build activities and persons lables
		var now = new Date();
		// new task
		this.taskextONewTask = new Object();
		this.taskextONewTask.start = this.taskextONewTask.end = now.dateFormat(this.conf.strFormat);
		// get html form
		var strHTML = oJobSchEd.createForm(
			[
				{type:'text', lbl: 'ID', name:'task_id', value:''
				, jsUpdate:this.objName+'.taskextONewTask.ID = this.value'},
				{type:'date', lbl: 'start', name:'task_start', value:this.taskextONewTask.start
				, jsUpdate:this.objName+'.taskextONewTask.start = this.value'},
				{type:'date', lbl: 'end', name:'task_end', value:this.taskextONewTask.end
				, jsUpdate:this.objName+'.taskextONewTask.end = this.value'},
			]
			, "Dodaj zadanie"
		);

		// show form
		var msg = this.taskextOMsg;
		msg.show(strHTML, this.objName+'.taskextAddSubmit()');
		msg.repositionMsgCenter();

		jQuery( ".datepicker" ).datepicker({ dateFormat: this.conf.strFormatJQ });
	}

	/**
		Gets submited data and adds the task

		@access public
	*/
	cJSGanttUpdate.prototype.taskextAddSubmit = function()
	{
		var oTask = {
			pID : this.taskextONewTask.ID,
			pStart : this.taskextONewTask.start,
			pEnd : this.taskextONewTask.end,
		}
		
		// add and update
		try
		{
			this.taskextAddAndUpdate(oTask);
		}
		catch(e){}

		// close dialog
		this.taskextOMsg.close();
	};

	/**
		Adds \a oTask and updates textarea and chart from flyspary

		@param oTask = {pID:'123', pStart:'2011-01-01', pEnd:'2011-01-01'}
		
		@access private
	*/
	cJSGanttUpdate.prototype.taskextAddAndUpdate = function(oTask)
	{
		// Get current data (from textarea).
		this.loadTasks();
		
		// Add
		//var oTask = {pID:'123', pStart:'2011-01-01', pEnd:'2011-01-01'};
		this.taskextAddSimpleTask(oTask);

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

	/**
		Dodanie zadania do wewnętrznej struktury
		
		@param oTask = {pID:'123', pStart:'2011-01-01', pEnd:'2011-01-01'}
		
		@access private
	*/
	cJSGanttUpdate.prototype.taskextAddSimpleTask = function(oTask)
	{
		var docTasks = this.docLocalTasks;
		
		// setup
		var arrEmptyEls = ['pName', 'pColor', 'pRes', 'pOpen', 'pDepend', 'pComp'];
		var arrInitEls = ['pID', 'pStart', 'pEnd'];
		
		// new task
		var elTask = docTasks.createElement('task');
		var nel;
		
		// "attributes"
		for (var i=0; i<arrInitEls.length; i++)
		{
			var strElName = arrInitEls[i];
			nel = docTasks.createElement(strElName);
			nel.appendChild(document.createTextNode(oTask[strElName]));
			elTask.appendChild(document.createTextNode("\n\t\t"));
			elTask.appendChild(nel);
		}
		// other as empty
		for (var i=0; i<arrEmptyEls.length; i++)
		{
			var strElName = arrEmptyEls[i];
			elTask.appendChild(docTasks.createElement(strElName));
			elTask.appendChild(document.createTextNode("\n\t\t"));
			elTask.appendChild(nel);
		}
		
		// format pre end tag
		elTask.appendChild(document.createTextNode("\n\t"));
		
		// append task
		var elRoot = docTasks.getElementsByTagName('jsgantt')[0];
		//elRoot.appendChild(document.createTextNode("\n\t"));
		elRoot.appendChild(document.createTextNode("\t"));
		elRoot.appendChild(elTask);
		elRoot.appendChild(document.createTextNode("\n"));
	};

});

/* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *\
	Object init + button
\* -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- */
jQuery (function()
{
	oJSGanttUpdateTaskExt = new cJSGanttUpdate('wpTextbox1');
	if (oJSGanttUpdateTaskExt.isOKForGanttUpdate())
	{
		oJSGanttUpdateTaskExt.setFSBaseLink();
		//oJSGanttUpdate.update();
		var elTB = document.getElementById('toolbar');
		if (!elTB)
		{
			return;
		}
		
		// init extension
		oJSGanttUpdateTaskExt.taskextInit('oJSGanttUpdateTaskExt');

		// add new task button
		var nel = document.createElement('a');
		nel.href = "javascript:oJSGanttUpdateTaskExt.taskextShowAdd()";
		nel.style.cssText = "float:right; padding:0 .2em 0 .4em;";
		nel.appendChild(document.createTextNode('Dodaj zadanie'));
		nel.title = 'Dodaje zadanie i aktualizuje diagram z Flyspray (pomija daty)';
		elTB.appendChild(nel);
	}
});