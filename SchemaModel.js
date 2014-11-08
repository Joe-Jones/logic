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
		var template = this.template_manager.getTemplate(object.schema_id);
		object.template_instance = this.logic_system.addTemplate(template);
		object.project = this.project;
		this.template_manager.templateAdded(object.schema_id, this.id);
	} else {
		object.logic_id = this.logic_system.addGate(object.type);
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
				if (i.number == this.logic_id) {
					info = i;
				}
			}, this);
			return info.name;
		}
	}
	
	if (object.DisplaysState) {
		this.logic_system.registerCallback(object.logic_id,
			function (new_state) {
				object.setState(new_state);
				if (that.drawer) {
					that.drawer.invalidateRectangle(object.boundingBox());
				}
			});
	}
	if (object.type == "SWITCH") {
		object.stateChanged = function (new_state) {
			that.logic_system.setOutput(object.logic_id, new_state);
		};
	}
	this.invalidate();
};

SchemaModel.prototype.removeLastGate = function() {
	this.next_item_number--;
	this.remove(this.next_item_number);
}

SchemaModel.prototype.remove = function(object) {
	if (!_.isObject(object)) {
		object = this.objects[object];
	}
	delete this.objects[object.number];
	if (object.DisplaysState) {
		this.logic_system.dropCallback(object.logic_id);
	}
	if (object.type == "SUBCIRCIT") {
		_.each(object.template_instance.gates, function(gate) {
			this.logic_system.removeGate(gate);
		}, this);
		this.template_manager.templateRemoved(object.schema_id, this.id);
	} else {
		this.logic_system.removeGate(object.logic_id);
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
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var inputs = item.inputs();
		for (var j = 0; j < inputs.length; j++) {
			var input = inputs[j];
			if (point.distance(input) < 0.2) {
				return { item: item, type: 'INPUT', number: j, position: input };
			}
		}
		var outputs = item.outputs();
		for (var j = 0; j < outputs.length; j++) {
			var output = outputs[j];
			if (point.distance(output) < 0.2) {
				return { item: item, type: 'OUTPUT', number: j, position: output };
			}
		}
	}
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
	
	// Add to the LogicSystem
	this.makeConnection(connection);
	
	this.invalidate();
};

/*
	This adds an already existing connection into the LogicSystem.
*/

SchemaModel.prototype.makeConnection = function(connection) {
	var output_item = connection.output_item;
	var input_item = connection.input_item;
	var input_num = connection.input_num;
	var output_num = connection.output_num;
	var logic_output;
	if (output_item.type == "SUBCIRCIT") {
		var n = this.project.getSchemaInfo(output_item.schema_id)["outputs"][output_num]["number"];
		logic_output = this.logic_system.gateNumber(output_item.template_instance, n);
		if (_.isNull(logic_output)) {
			var schema_model = this;
			this.logic_system.addConectionMaker(output_item.template_instance, n, function() {
				schema_model.makeConnection(connection);
			});
		}
	} else {
		logic_output = output_item.logic_id;
	}
	
	if (!_.isNull(logic_output)) {
		if (input_item.type == "SUBCIRCIT") {
			this.logic_system.connectToTemplateInstance(logic_output, input_item.template_instance,
														this.project.getSchemaInfo(input_item.schema_id)["inputs"][input_num]["number"]);
		} else {
			this.logic_system.makeConnection(logic_output, connection.input_item.logic_id, connection.input_num);
		}
	}
};

SchemaModel.prototype.removeConnection = function(input_item_num, input_num, output_item_num, output_num) {
	var input_item = this.objects[input_item_num];
	var output_item = this.objects[output_item_num];
	
	var connection = input_item.getInput(input_num);
	
	input_item.removeInput(input_num);
	output_item.removeOutput(output_num, connection);
	if (input_item.type == "SUBCIRCIT") {
		_.each(input_item.template_instance.inputs[input_num + 1], function(pair) {
			this.logic_system.removeConnection(pair[0], pair[1]);
		}, this);
	} else {
		this.logic_system.removeConnection(input_item.logic_id, input_num);
	}
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
	this.subcomponent_invalid = false;
};

SchemaModel.prototype.rebuildLogicSystem = function() {
	var model = this;
	this.logic_system = new LogicSystem();
	_.each(this.objects, function(object) {
		if (object.type == "SUBCIRCIT") {
			var template = this.template_manager.getTemplate(object.schema_id);
			object.template_instance = this.logic_system.addTemplate(template);
		} else {
			object.logic_id = this.logic_system.addGate(object.type);
			if (object.DisplaysState) {
				this.logic_system.registerCallback(object.logic_id, function (new_state) {
					object.setState(new_state);
					if (model.drawer) {
						model.drawer.invalidateRectangle(object.boundingBox());
					}
				});
			}
			if (object.type == "SWITCH") {
				this.logic_system.setOutput(object.logic_id, object.getState());
			}
		}
	}, this);
	_.each(this.objects, function(object) {
		_.each(object.getConnections("OUTPUT", 0), function(connection) {
			this.makeConnection(connection);
		}, this);
	}, this);
	this.subcomponent_invalid = false;
	this.logic_system.runCallbacks();
};

SchemaModel.prototype.saveAsTemplate = function() {
	this.checkAndRebuild();
	return this.logic_system.saveAsTemplate();
};

SchemaModel.prototype.invalidate = function() {
	this.template_manager.templateInvalid(this.id);
};

SchemaModel.prototype.subcomponentInvalid = function() {
	this.subcomponent_invalid = true;
};

SchemaModel.prototype.checkAndRebuild = function() {
	if (this.subcomponent_invalid) {
		this.rebuildLogicSystem();
	}
};
