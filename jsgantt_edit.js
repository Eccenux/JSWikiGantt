/**
	Edit helpers
*/
oJSGanttEditHelper = {
	dateFormat : "Y-m-d"
	,
	dateFormatRe : /[0-9]{4}-[0-9]{2}-[0-9]{2}/g	// MUST match date and only date
	,
	textBox : 'wpTextbox1'
	,
	/**
	 * Move dates in text by given day distance.
	 *
	 * @param {String} text Text to parse.
	 * @param {String|Date} borderDate base String or Date.
	 * @param {int} days Distance in days for each date to be moved.
	 *
	 * @returns {String} Parsed string.
	 * @private
	 */
	moveDatesInText : function (text, borderDate, days) {
		var borderDateString, borderDateObject;
		if (typeof(borderDate)==="string") {
			borderDateObject = Date.parseDate(borderDate, this.dateFormat);
			borderDateString = borderDate;
		}
		else {
			borderDateObject = borderDate;
			borderDateString = borderDate.dateFormat(this.dateFormat);
		}
		var _this = this;
		text = text.replace(this.dateFormatRe, function(date) {
			var dateObject = Date.parseDate(date, _this.dateFormat);
			if (dateObject >= borderDateObject) {
				dateObject.setDate(dateObject.getDate() + days);
			}
			return dateObject.dateFormat(_this.dateFormat);
		});
		return text;
	}
	,
	moveDates : function (borderDate, days) {
		var el = document.getElementById(this.textBox);
		el.value = this.moveDatesInText(el.value, borderDate, days);
	}
};
/*
// usage:
oJSGanttEditHelper.moveDates("2013-06-13", 1)
oJSGanttEditHelper.moveDates("2013-06-15", 2)
oJSGanttUpdate.update()
*/