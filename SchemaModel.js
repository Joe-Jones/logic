"use strict";

/********************************************************************************************/
function SchemaModel(template_manager)
/********************************************************************************************/
{
	this.objects = {};
	this.next_item_number = 1;
	this.next_connection_number = 0;
	this.logic_system = new LogicSystem();
	this.template_manager = template_manager;
}

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
		var template = template_manager.getTemplate(object.schema_id);
		object.logic_data = this.logic_system.addTemplate(template);
	} else {
		object.logic_id = this.logic_system.addGate(object.type);
	}
	
	if (object.DisplaysState) {
		this.logic_system.registerCallback(object.logic_id,
			function (new_state) {
				object.setState(new_state);
				that.drawer.invalidateRectangle(object.boundingBox());
			});
	}
	if (object.type == "SWITCH") {
		object.stateChanged = function (new_state) {
			that.logic_system.setOutput(object.logic_id, new_state);
			that.logic_system.run(); //Todo, should this be here
		};
	}
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
	this.logic_system.removeGate(object.logic_id);
};

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

SchemaModel.prototype.addConnection = function(input_item_num, input_num, output_item_num, output_num) {
	var input_item = this.objects[input_item_num];
	var output_item = this.objects[output_item_num];
	
	var connection = new Connection(input_item, input_num, output_item, output_num);
	
	connection.input_item.addConnection(connection);
	connection.output_item.addConnection(connection);
	connection.number = this.next_connection_number;
	this.next_connection_number ++;
	
	// Add to the LogicSystem
	this.logic_system.makeConnection(connection.output_item.logic_id, connection.input_item.logic_id, connection.input_num);
	this.logic_system.injectTransient(connection.input_item.logic_id);
	this.logic_system.run();
};

SchemaModel.prototype.removeConnection = function(input_item_num, input_num, output_item_num, output_num) {
	var input_item = this.objects[input_item_num];
	var output_item = this.objects[output_item_num];
	
	var connection = input_item.getInput(input_num);
	
	input_item.removeInput(input_num);
	output_item.removeOutput(output_num, connection);
	this.logic_system.removeConnection(input_item.logic_id, input_num);
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

SchemaModel.prototype.load = function(saved) {
	for (var i = 0; i < saved["items"].length; i++) {
		var saved_item = saved["items"][i];
		var restored_item = makeGate(saved_item[1]);
		var number = saved_item[0];
		restored_item.number = number;
		restored_item.setPosition(new Point(saved_item[2]));
		this.add(restored_item);
		if (restored_item.HasState) {
			restored_item.setState(saved_item[3]);
		}
	}
	for (var i = 0; i < saved["connections"].length; i++) {
		var saved_connection = saved["connections"][i];
		this.addConnection(saved_connection[0], saved_connection[1], saved_connection[2], saved_connection[3]);
	}
};

SchemaModel.prototype.rebuildLogicSystem = function() {
	var model = this;
	this.logic_system = new LogicSystem();
	_.each(this.objects, function(object) {
		if (object.type == "SUBCIRCIT") {
		
		} else {
			object.logic_id = this.logic_system.addGate(object.type);
			if (object.DisplaysState) {
				this.logic_system.registerCallback(object.logic_id, function (new_state) {
					object.setState(new_state);
					model.drawer.invalidateRectangle(object.boundingBox());
				});
			}
			if (object.type == "SWITCH") {
				this.logic_system.setOutput(object.logic_id, object.getState());
			}
		}
	}, this);
	_.each(this.objects, function(object) {
		if (object.type == "SUBCIRCIT") {
		
		} else {
			//console.log(object.getConnections("OUTPUT", 0));
			_.each(object.getConnections("OUTPUT", 0), function(connection) {
				this.logic_system.makeConnection(connection.output_item.logic_id, connection.input_item.logic_id, connection.input_num);
			}, this);
		}
	}, this);
	console.log(this.logic_system);
};

SchemaModel.prototype.saveAsTemplate = function() {
	return this.logic_system.saveAsTemplate();
}


