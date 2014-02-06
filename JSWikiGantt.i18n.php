<?php
/**
 * Internationalisation file for extension JSWikiGantt.
 *
 * @file
 * @ingroup Extensions
 */

$messages = array();

/** English (English)
 * @author Maciej Jaros
 * @author Ewa Jaros
 */
$messages['en'] = array(
	'jswikigantt-desc' => ''
		." This extension adds a <tt><nowiki><jsgantt></nowiki></tt> tag in which you can define a Gantt diagram data to be drawn. Currently only one diagram per page."
		." Note! This extension is based on ''JSGantt'' project started by Shlomy Gantz and ''Xaprb JavaScript date formatting'' by Baron Schwartz."
		." See jsgantt.js and date-functions.js for licensing details of this modules."
	// display format
	,'jswikigantt-format-label'      => 'Format:'
	,'jswikigantt-format-quarter'    => 'Quarter'
	,'jswikigantt-format-month'      => 'Month'
	,'jswikigantt-format-week'       => 'Week'
	,'jswikigantt-format-day'        => 'Day'
	,'jswikigantt-format-hour'       => 'Hour'
	,'jswikigantt-format-minute'     => 'Minute'
	// quarters date format part
	,'jswikigantt-quarter-short'     => 'Qtr.'
	// headers
	,'jswikigantt-header-res'        => 'Resource'
	,'jswikigantt-header-dur'        => 'Duration'
	,'jswikigantt-header-comp'       => '% Comp.'
	,'jswikigantt-header-startdate'  => 'Start Date'
	,'jswikigantt-header-enddate'    => 'End Date'
	// loader and inline gantt stuff
	,'jswikigantt-no-xml-link-error' => 'Error! A link to an article containing the diagram data is missing. The link to an XML data article should be put inside the element with id="%el_id%".'
	,'jswikigantt-unexpected-error'  => 'Unexpected error!'
	,'jswikigantt-xml-parse-error'   => 'Parse error! The XML file is malformed or the URL is incorrect.'
);

/** Polish (Polski)
 * @author Maciej Jaros
 * @author Ewa Jaros
 */
$messages['pl'] = array(
	'jswikigantt-desc' => ''
		." To rozszerzenie pozwala tworzyć diagramy Gantta za pomocą tagu ''jsgantt''. Obecnie dozwolny jest tylko jeden diagram na stronie."
		." Uwaga! To rozszerzenie jest oparte na projekcie ''JSGantt'' utworzonym przez Shlomy Gantza oraz na projekcie ''Xaprb JavaScript date formatting'' stworzonym przez Barona Schwartza."
		." Licencje projektów znajdują się odpowiednio w plikach jsgantt.js i date-functions.js."
	// display format
	,'jswikigantt-format-label'      => 'Format:'
	,'jswikigantt-format-quarter'    => 'Kwartały'
	,'jswikigantt-format-month'      => 'Miesiące'
	,'jswikigantt-format-week'       => 'Tygodnie'
	,'jswikigantt-format-day'        => 'Dni'
	,'jswikigantt-format-hour'       => 'Godziny'
	,'jswikigantt-format-minute'     => 'Minuty'
	// quarters date format part
	,'jswikigantt-quarter-short'     => 'Kw.'
	// headers
	,'jswikigantt-header-res'        => 'Zasób'
	,'jswikigantt-header-dur'        => 'Czas trwania'
	,'jswikigantt-header-comp'       => '% Ukoń.'
	,'jswikigantt-header-startdate'  => 'Rozpoczęcie'
	,'jswikigantt-header-enddate'    => 'Zakończenie'
	// loader and inline gantt stuff
	,'jswikigantt-no-xml-link-error' => 'Błąd! Brak linku do artykułu zawierającego dane harmonogramu. W elemencie o id="%el_id%" należy podać link do artykułu z danymi w formacie XML.'
	,'jswikigantt-unexpected-error'  => 'Niespodziewany błąd!'
	,'jswikigantt-xml-parse-error'   => 'Błąd odczytu! Nieprawidłowy plik XML lub nieprawidłowy adres URL.'
);
