/********************************************************************************************/
function SchemaModel()
/********************************************************************************************/
{
	this.objects = [];
	this.next_item_number = 1;
	this.next_connection_number = 0;
	this.logic_system = new LogicSystem();
}

SchemaModel.prototype.nextItemId = function() {
	return this.next_item_number++;
}

SchemaModel.prototype.add = function(object) {
	that = this;
	this.objects.push(object);
	object.setModel(this);
	object.number = this.next_item_number;
	this.next_item_number++;
	
	//Add it to the LogicSystem
	object.logic_id = this.logic_system.addGate(object.type);
	
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
			that.logic_system.run();
		};
	}
};

SchemaModel.prototype.remove = function(object) {
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i] === object) {
			this.objects.splice(i, 1);
			break;
		}
	}
};

SchemaModel.prototype.allObjectsTouchingBox = function(box, include_connections) { // This just gets everything now
	var results = [];
	var connection_numbers = [];
	for (var i = 0; i < this.objects.length; i++) {
		var object = this.objects[i];
		if (true || object.boundingBox().intersects(box)) {
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
	}
	return results;
};

SchemaModel.prototype.hitTest = function(point) {
	var results = [];
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].boundingBox().pointIn(point)) {
			results.push(this.objects[i]);
		}
	}
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

SchemaModel.prototype.addConnection = function(connection) {
	connection.input_item.addConnection(connection);
	connection.output_item.addConnection(connection);
	connection.number = this.next_connection_number;
	this.next_connection_number ++;
	
	// Add to the LogicSystem
	this.logic_system.makeConnection(connection.output_item.logic_id, connection.input_item.logic_id, connection.input_num);
	this.logic_system.injectTransient(connection.input_item.logic_id);
	this.logic_system.run();
};

SchemaModel.prototype.save = function() {
	var saved = {};
	var items = [];
	var connections = [];
	for (var i = 0; i < this.objects.length; i++) {
		item = this.objects[i];
		items.push([item.number, item.type, item.top_left]);
		var conns = item.allConnections(true);
		for (var j = 0; j < conns.length; j++) {
			connection = conns[j];
			connections.push([connection.input_item.number, connection.input_num, connection.output_item.number, connection.output_num]);
		}
	}
	saved["items"] = items;
	saved["connections"] = connections;
	return saved;
};

SchemaModel.prototype.load = function(saved) {
	var item_hash = {};
	for (var i = 0; i < saved["items"].length; i++) {
		var saved_item = saved["items"][i];
		var restored_item = makeGate(saved_item[1]);
		var number = saved_item[0];
		restored_item.setPosition(new Point(saved_item[2]));
		this.add(restored_item);
		item_hash[number] = restored_item;
	}
	for (var i = 0; i < saved["connections"].length; i++) {
		var saved_connection = saved["connections"][i];
		var input_item = item_hash[saved_connection[0]];
		var input_num = saved_connection[1];
		var output_item = item_hash[saved_connection[2]];
		var output_num = saved_connection[3];
		var restored_connection = new Connection(input_item, input_num, output_item, output_num);
		this.addConnection(restored_connection);
	}
};


