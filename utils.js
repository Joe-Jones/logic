"use strict";

/*
	Some little bits and pieces to help with testing and thing that aren't to be included in the release version.
*/

function actions(id) {
	var database = getDatabase("logic", true);
	var project_data = database.loadProjectData(id, true);
	var position = 0;
	var actions = [];
	var action;
	while(action = project_data.getItem("history/" + position)) {
		actions.push(action);
		position++;
	}
	return actions;
}