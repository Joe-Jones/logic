"use strict";

/*
	Some little bits and pieces to help with testing and thing that aren't to be included in the release version.
*/

function _actions(id) {
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

function _get_project() {
	return body.child.project;
}

function _get_database() {
	return body.child.database;
}

function _crash() {
	_get_project().dispatchAction(new Action({type: "CRASH"}));
}

function _get_schema() {
	var project = _get_project();
	return project.schemas[project.selected_tab];
}

function _draw_graph(graph) {
	document.write('<div id="graph" style="height:100%;"></div>');
	jsnx.draw(graph, { 
		element: "#graph",
		with_labels: true,
		labels: function(data) {
			var node_data = data.G.node.get(data.node);
			var type = node_data.type;
			if (type == "SUBCIRCIT") {
				return node_data.schema_id;
			} else if (_.contains(["INPUT", "OUTPUT"], type)) {
				return type + "[" + node_data.connection_number + "]";
			} else {
				return type;
			}
		},
		with_edge_labels: true,
		edge_labels: function(data) {
			return data.G.get_edge_data.apply(data.G, data.edge).connect_to;
		},
			'layout_attr': {
			'charge': -120,
			'linkDistance': 40
		}
	});
}
