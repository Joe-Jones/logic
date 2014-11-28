"use strict";

/********************************************************************************************/
function SchemaModel(id, project_id, data, template_manager, project)
/********************************************************************************************/
{
	this.id = id;
	this.project_id = project_id;
	this.data = data;
	this.template_manager = template_manager;
	this.loaded = false;
	this.project = project;
}

_.extend(SchemaModel.prototype, Backbone.Events);

SchemaModel.prototype.nextItemId = function() {
	return this.next_item_number++;
}

SchemaModel.prototype.add = function(object) {
	var that = this;
	
	// Number the object
	if (object.number) {
		if (object.number >= this.next_item_number) {
			this.next_item_number = object.number + 1;
		}
	} else {
		object.number = this.nextItemId();
	}
	
	object.setModel(this);
	this.objects[object.number] = object;
	
	//Add it to the LogicSystem
	if (object.type == "SUBCIRCIT") {
		object.project = this.project;
		this.template_manager.templateAdded(object.schema_id, this.id);
	}
	
	if (_.contains(["INPUT", "OUTPUT"], object.type)) {
		object.name = function() {
			var list;
			if (object.type == "INPUT") {
				list = that.project.schema_infos[that.id].inputs;
			} else {
				list = that.project.schema_infos[that.id].outputs;
			}
			var info;
			_.each(list, function(i) {
				if (i.number == this.number) {
					info = i;
				}
			}, this);
			return info.name;
		}
	}
	
	this.invalidate();
};

SchemaModel.prototype.removeLastGate = function() {
	this.next_item_number--;
	this.remove(this.next_item_number);
	this.invalidate();
}

SchemaModel.prototype.remove = function(object) {
	if (!_.isObject(object)) {
		object = this.objects[object];
	}
	delete this.objects[object.number];
	if (object.type == "SUBCIRCIT") {
		this.template_manager.templateRemoved(object.schema_id, this.id);
	}
	this.invalidate();
};

SchemaModel.prototype.getObjectByNumber = function(number) {
	return this.objects[number];
}

SchemaModel.prototype.allObjectsTouchingBox = function(box, include_connections, get_all) { // need to get rid of get_all
	var results = [];
	var connection_numbers = [];
	_.each(this.objects, function(object) {
		if (get_all || object.boundingBox().intersects(box)) {
			results.push(object);
		}
		if (include_connections) {
			var connections = object.allConnections();
			for (var j = 0; j < connections.length; j++) {
				var connection = connections[j];
				if ((true || connection.boundingBox().intersects(box)) && !connection_numbers[connection.number]) {
					results.push(connection);
					connection_numbers[connection.number] = true;
				}
			}
		}
	});
	return results;
};

SchemaModel.prototype.hitTest = function(point) {
	var results = [];
	_.each(this.objects, function(object) {
		if (object.boundingBox().pointIn(point)) {
			results.push(object);
		}
	});
	return results;
};

SchemaModel.prototype.hotPoint = function(point) {
	var items = this.hitTest(point);
	var hot_point;
	outer_loop:
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var inputs = item.inputs();
		for (var j = 0; j < inputs.length; j++) {
			var input = inputs[j];
			if (point.distance(input) < 0.2) {
				hot_point = { item: item, type: 'INPUT', number: j, position: input };
			}
		}
		var outputs = item.outputs();
		for (var j = 0; j < outputs.length; j++) {
			var output = outputs[j];
			if (point.distance(output) < 0.2) {
				hot_point = { item: item, type: 'OUTPUT', number: j, position: output };
			}
		}
	}
	if (hot_point && hot_point.item.type == "SUBCIRCIT") {
		hot_point.number = this.project.getSchemaInfo(item.schema_id)[hot_point.type == 'INPUT' ? 'inputs' : 'outputs'][hot_point.number].number;
	}
	return hot_point;
}

function hotPointsEqual(a, b) {
	return a.item === b.item && a.type === b.type && a.number === b.number;
}

/*
	This adds a connection to the model then calls makeConnection to actually wire it up.
*/

SchemaModel.prototype.addConnection = function(input_item_num, input_num, output_item_num, output_num) {
	var input_item = this.objects[input_item_num];
	var output_item = this.objects[output_item_num];
	
	var connection = new Connection(input_item, input_num, output_item, output_num);
	
	connection.input_item.addConnection(connection);
	connection.output_item.addConnection(connection);
	connection.number = this.next_connection_number;
	this.next_connection_number ++;
	
	this.invalidate();
};

SchemaModel.prototype.removeConnection = function(input_item_num, input_num, output_item_num, output_num) {
	var input_item = this.objects[input_item_num];
	var output_item = this.objects[output_item_num];
	
	var connection = input_item.getInput(input_num);
	
	input_item.removeInput(input_num);
	output_item.removeOutput(output_num, connection);

	this.invalidate();
};

SchemaModel.prototype.save = function() {
	var saved = {};
	var items = [];
	var connections = [];
	_.each(this.objects, function(item) {
		var saved_item = [item.number, item.type, item.top_left];
		if (item.HasState) {
			saved_item.push(item.getState());
		}
		items.push(saved_item);
		var conns = item.allConnections(true);
		for (var j = 0; j < conns.length; j++) {
			var connection = conns[j];
			connections.push([connection.input_item.number, connection.input_num, connection.output_item.number, connection.output_num]);
		}
	});
	saved["items"] = items;
	saved["connections"] = connections;
	return saved;
};

SchemaModel.prototype.load = function() {
	this.objects = {};
	this.next_item_number = 1;
	this.next_connection_number = 0;
	this.logic_system = new LogicSystem();
	if(this.data) {
		for (var i = 0; i < this.data["items"].length; i++) {
			var saved_item = this.data["items"][i];
			var restored_item = makeGate(saved_item[1]);
			var number = saved_item[0];
			restored_item.number = number;
			restored_item.setPosition(new Point(saved_item[2]));
			this.add(restored_item);
			if (restored_item.HasState) {
				restored_item.setState(saved_item[3]);
			}
		}
		for (var i = 0; i < this.data["connections"].length; i++) {
			var saved_connection = this.data["connections"][i];
			this.addConnection(saved_connection[0], saved_connection[1], saved_connection[2], saved_connection[3]);
		}
	}
	delete this.data;
	this.loaded = true;
	this.needs_build = false;
};

SchemaModel.prototype.invalidate = function() {
	this.template_manager.templateInvalid(this.id);
	this.needs_build = true;
};

SchemaModel.prototype.subcomponentInvalid = function() {
	this.needs_build = true;
};

SchemaModel.prototype.checkAndRebuild = function() {
	if (this.needs_build) {
		this.logic_system = buildLogicSystem(this.template_manager.getTemplate(this.id), this);
	}
	this.needs_build = false;
};

SchemaModel.prototype.saveAsTemplate = function() {
	return replaceAllSubCircuits(this.asGraph(), this.project);
}

SchemaModel.prototype.asGraph = function() {
	var graph = new jsnx.DiGraph();
	
	_.each(this.objects, function(object) {
		// Add object to the graph.
		var attrs = { type: object.type };
		if (object.type == "SUBCIRCIT") {
			attrs.schema_id = object.schema_id;
		}
		graph.add_node(object.number, attrs);
		
		// Add the connections.
		_.each(object.output_connections, function(output) {
			var connection_node = _.uniqueId();
			_.each(output, function(connection) {
				// Gather the information we need to create the connection.  
				var source_node = object.number;
				var source_label = connection.output_num;
				var dest_node = connection.input_item.number;
				var dest_label = connection.input_num;
				
				// Add the connection.
				graph.add_edge(source_node, connection_node, { connect_to: source_label });
				graph.add_edge(connection_node, dest_node, { connect_to: dest_label });
			}, this);
		}, this);
	}, this);
	
	return graph;
};
