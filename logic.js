/********************************************************************************************/
function Point(x, y)
/********************************************************************************************/
{
	if (typeof y == 'undefined') { // Copy Constructor
		this.x = x.x;
		this.y = x.y;
	}
	this.x = x;
	this.y = y;
}

Point.prototype.copy = function() {
    return new Point(this.x, this.y);
};

Point.prototype.minus = function(other) {
	return new Point(this.x - other.x, this.y - other.y);
};

Point.prototype.plus = function(other) {
	return new Point(this.x + other.x, this.y + other.y);
};

Point.prototype.distance = function(other) {
	return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
}

function midPoint(point1, point2) {
	return new Point((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
}

/********************************************************************************************/
function Box(left, top, right, bottom)
/********************************************************************************************/
{
	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;
}

function BoxFromPointAndSize(point, size) {
	return new Box(point.x, point.y, point.x + size.width, point.y + size.height);
}

function smallest(a, b) {
	if (a < b) {
		return a;
	}
	return b;
}

function biggest(a, b) {
	if (a > b) {
		return a;
	}
	return b;
}

function BoxFromTwoPoints(point1, point2)  {
	return new Box(smallest(point1.x, point2.x), smallest(point1.y, point2.y), biggest(point1.x, point2.x), biggest(point1.y, point2.y));
}

function SmallestCoveringBox(box1, box2) {
	return new Box(smallest(box1.left, box2.left), smallest(box1.top, box2.top), biggest(box1.right, box2.right), biggest(box1.bottom, box2.bottom));
}

Box.prototype.topLeft = function() {
	return new Point(this.left, this.top);
};

Box.prototype.bottomRight = function() {
	return new Point(this.right, this.bottom);
};

Box.prototype.topRight = function() {
	return new Point(this.right, this.top);
};

Box.prototype.bottomLeft = function() {
	return new Point(this.left, this.bottom);
};

Box.prototype.pointIn = function(point) {
	return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
};

function inInterval(number, interval) {
	return number >= interval[0] && number <= interval[1];
}

function oneEndpointContainedIn(interval_1, interval_2) {
	return inInterval(interval_1[0], interval_2) || inInterval(interval_1[1], interval_2);
}

function intervalsIntersect(interval_1, interval_2) {
	return oneEndpointContainedIn(interval_1, interval_2) || oneEndpointContainedIn(interval_2, interval_1);
}

Box.prototype.intersects = function(other) {
	return intervalsIntersect([this.top, this.bottom], [other.top, other.bottom]) && intervalsIntersect([this.left, this.right], [other.left, other.right]);
};

Box.prototype.width = function() {
	return Math.abs(this.left - this.right);
};

Box.prototype.height = function() {
	return Math.abs(this.bottom - this.top);
};

Box.prototype.expand = function(amount) {
	var half_amount = amount / 2;
	return new Box(this.left - half_amount, this.top - half_amount, this.right + half_amount, this.bottom + half_amount);
};

/********************************************************************************************/
function DragableThing()
/********************************************************************************************/
{
	this.top_left = new Point(0, 0);
	this.model = null;
	this.output_connections = [];
	this.input_connections = [];
}

DragableThing.prototype.setModel = function(model) {
	this.model = model;
};

DragableThing.prototype.position = function() {
	return this.top_left;
};

DragableThing.prototype.setPosition = function(new_position) {
	this.top_left = new_position;
};

DragableThing.prototype.size = function() {
	return {
		width: 1,
		height: 1
	};
};

DragableThing.prototype.boundingBox = function() {
	return BoxFromPointAndSize(this.top_left, this.size());
};

DragableThing.prototype.drawWrapper = function(ctx, selected) {
	var position = this.position();
	ctx.save();
	ctx.translate(position.x, position.y);
	this.draw(ctx);
	ctx.restore();
}

DragableThing.prototype.draw = function(ctx, selected) {
	ctx.fillRect(0, 0, 1, 1);
};

DragableThing.prototype.hitTest = function(x, y) {
	
};

DragableThing.prototype.inputs = function() {
	return [];
}

DragableThing.prototype.outputs = function() {
	return [];
}

DragableThing.prototype.LogicGateSingleOutput = function() {
	return [this.top_left.plus(new Point(0.5, 0.05))];
};

DragableThing.prototype.LogicGateSingleInput = function() {
	return [this.top_left.plus(new Point(0.5, 0.95))]
};

DragableThing.prototype.LogicGateDoubleInput = function() {
	return [this.top_left.plus(new Point(0.3, 0.95)), this.top_left.plus(new Point(0.7, 0.95))];
};

DragableThing.prototype.addConnection = function(connection) {
	if (connection.input_item === this) {
		this.input_connections[connection.input_num] = connection;
	} else {
		var number = connection.output_num;
		if (!this.output_connections[number]) {
			this.output_connections[number] = [connection];
		} else {
			this.output_connections.push(connection);
		}
	}
};

DragableThing.prototype.getConnections = function(type, number) {
	if (type == "INPUT") {
		return [this.input_connections[number]];
	} else {
		return this.output_connections[number];
	}
};

DragableThing.prototype.allConnections = function(just_inputs) {
	var all_connections = [];
	for (var i = 0; i < this.input_connections.length; i++) {
		if (this.input_connections[i]) {
			all_connections.push(this.input_connections[i]);
		}
	}
	if (just_inputs) {
		return all_connections;
	}
	for (var i = 0; i < this.output_connections.length; i++) {
		if (this.output_connections[i]) {
			all_connections = all_connections.concat(this.output_connections[i]);
		}
	}
	return all_connections;
}

DragableThing.prototype.hasInputConnection = function(number) {
	return Boolean(this.input_connections[number]);	
};

DragableThing.prototype.removeConnection = function(connection) {
	if (connection.input_item === this) {
		
	} else {
		
	}
};

/********************************************************************************************/
function NotGate()
/********************************************************************************************/
{	
	this.type = "NOT";
}

NotGate.prototype = new DragableThing();

NotGate.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	ctx.beginPath();
	
	//	Input
	ctx.moveTo(0.5, 0.95);
	ctx.lineTo(0.5, 0.8);
	
	// Triangle
	ctx.lineTo(0.1, 0.8);
	ctx.lineTo(0.5, 0.4);
	ctx.lineTo(0.9, 0.8);
	ctx.lineTo(0.5, 0.8);
	
	ctx.stroke();
	
	// the circle
	ctx.beginPath();
	ctx.arc(0.5, 0.3, 0.1, - Math.PI ,  Math.PI );
	ctx.stroke();
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.2);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

NotGate.prototype.inputs = DragableThing.prototype.LogicGateSingleInput;
NotGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function AndGate()
/********************************************************************************************/
{
	this.type = "AND";
}

AndGate.prototype = new DragableThing();

AndGate.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	
	//	Inputs
	ctx.beginPath();
	ctx.moveTo(0.3, 0.95);
	ctx.lineTo(0.3, 0.8);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(0.7, 0.95);
	ctx.lineTo(0.7, 0.8);
	ctx.stroke();
	
	// Body
	ctx.beginPath();
	ctx.moveTo(0.85, 0.8);
	ctx.lineTo(0.15, 0.8);
	ctx.lineTo(0.15, 0.5);
	ctx.arc(0.5, 0.5, 0.35, Math.PI, 0);
	ctx.lineTo(0.85, 0.8);
	ctx.stroke();
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

AndGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
AndGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function OrGate()
/********************************************************************************************/
{
	this.type = "OR";
}

OrGate.prototype = new DragableThing();

OrGate.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	
	//	Inputs
	ctx.beginPath();
	ctx.moveTo(0.3, 0.95);
	ctx.lineTo(0.3, 0.75);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(0.7, 0.95);
	ctx.lineTo(0.7, 0.75);
	ctx.stroke();
	
	// Body
	ctx.beginPath();
	ctx.moveTo(0.15, 0.8);
	ctx.bezierCurveTo(0.3, 0.7, 0.7, 0.7, 0.85, 0.8);
	ctx.lineTo(0.87, 0.5);
	ctx.bezierCurveTo(0.87, 0.2, 0.6, 0.2,		0.5, 0.1);
	ctx.bezierCurveTo(0.4, 0.2, 0.13, 0.2, 			0.15, 0.5);
	ctx.lineTo(0.15, 0.8);
	ctx.stroke();
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

OrGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
OrGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;


function makeGate(type) {
	switch(type) {
		case "AND":
			return new AndGate();
		case "OR":
			return new OrGate();
		case "NOT":
			return new NotGate();
	}
}

/********************************************************************************************/
function Connection(input_item, input_num, output_item, output_num)
/********************************************************************************************/
{
	this.input_item = input_item;
	this.input_num = input_num;
	this.output_item = output_item;
	this.output_num = output_num;
}

Connection.prototype.getPoints = function() {
	var input;
	var outputs;
	if (this.input_item) {
		input = this.input_item.inputs()[this.input_num];
	} else {
		input = this.drag_position;
	}
	if (this.output_item) {
		output = this.output_item.outputs()[this.output_num];
	} else {
		output = this.drag_position;
	}
	return [input, output];
}

Connection.prototype.boundingBox = function() {
	var points = this.getPoints();
	var input = points[0];
	var output = points[1];
	if (output.y >= input.y) {
		return BoxFromTwoPoints(input, output);
	} else {
		return new Box(smallest(input.x, output.x), output.y - 1, biggest(input.x, output.x), input.y + 1);
	}
};

Connection.prototype.setDragPosition = function(position) {
	this.drag_position = position;
};

Connection.prototype.drawWrapper = function(ctx) {
	var points = this.getPoints();
	var input = points[0];
	var output = points[1];
	if (output.y >= input.y) {
		ctx.save();
		ctx.lineWidth = 0.05;
		ctx.beginPath();
		ctx.moveTo(input.x, input.y);
		var half_way = (output.y + input.y) / 2;
		ctx.bezierCurveTo(input.x, half_way, output.x, half_way, output.x, output.y);
		ctx.stroke();
		ctx.restore();
	} else {
		ctx.save();
		ctx.lineWidth = 0.05;
		ctx.beginPath();
		ctx.moveTo(output.x, output.y);
		var mid_point = midPoint(input, output);
		var second_control_point = midPoint(output, mid_point);
		var third_control_point = midPoint(mid_point, input)
		ctx.bezierCurveTo(output.x, output.y - 1, second_control_point.x, second_control_point.y, mid_point.x, mid_point.y);
		ctx.bezierCurveTo(third_control_point.x, third_control_point.y, input.x, input.y + 1, input.x, input.y);
		ctx.stroke();
		ctx.restore();
	}
}

/********************************************************************************************/
function SchemaModel()
/********************************************************************************************/
{
	this.objects = [];
	this.next_item_number = 0;
	this.next_connection_number = 0;
}

SchemaModel.prototype.add = function(object) {
	this.objects.push(object);
	object.setModel(this);
	object.number = this.next_item_number;
	this.next_item_number++;
};

SchemaModel.prototype.remove = function(object) {
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i] === object) {
			this.objects.splice(i, 1);
			break;
		}
	}
};

SchemaModel.prototype.allObjectsTouchingBox = function(box, include_connections) {
	var results = [];
	var connection_numbers = [];
	for (var i = 0; i < this.objects.length; i++) {
		var object = this.objects[i];
		if (object.boundingBox().intersects(box)) {
			results.push(object);
		}
		if (include_connections) {
			var connections = object.allConnections();
			for (var j = 0; j < connections.length; j++) {
				var connection = connections[j];
				if (connection.boundingBox().intersects(box) && !connection_numbers[connection.number]) {
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
		restored_item.number = number;
		if (number > this.next_item_number) {
			this.next_item_number = number;
		}
		restored_item.setPosition(saved_item[2]); // I don't know if this will work.
		restored_item.setModel(this);
		this.objects.push(restored_item);
		item_hash[number = restored_item];
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

/********************************************************************************************/
function SchemaDrawer(model, canvas_context, scale, drawing_area)
/********************************************************************************************/
{
	this.model = model;
	this.ctx = canvas_context;
	this.scale = scale;
	this.drawing_area = drawing_area;
	this.ctx.save()
	this.setTransform();
	this.highlight = null;
	this.temp_connection = null;
}

SchemaDrawer.prototype.setScale = function(scale) {
	this.scale = scale;
	this.setTransform();
};

SchemaDrawer.prototype.setDrawingArea = function(drawing_area) {
	this.drawing_area = drawing_area;
	this.setTransform();
};

SchemaDrawer.prototype.setTransform = function() {
	this.ctx.restore();
	this.ctx.save();
	this.ctx.scale(this.scale, this.scale);
	this.ctx.translate(this.drawing_area.left, this.drawing_area.top);
	this.invalid_rectangle = this.drawing_area;
};

SchemaDrawer.prototype.clear = function() { // We can probably do without this now.
	// Based on code on this page http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
	this.ctx.save();
	this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
}

SchemaDrawer.prototype.invalidateRectangle = function(rectangle) {
	if (!this.invalid_rectangle) {
		this.invalid_rectangle = rectangle;
	} else {
		this.invalid_rectangle = SmallestCoveringBox(this.invalid_rectangle, rectangle);
	}
};

SchemaDrawer.prototype.draw = function(exclude_item) {
	if (this.temp_connection) {
		this.invalidateRectangle(this.temp_connection.boundingBox().expand(0.1));
	}
	if (this.invalid_rectangle) {
		// Set up the clip path.
		this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(this.invalid_rectangle.left, this.invalid_rectangle.top);
		this.ctx.lineTo(this.invalid_rectangle.right, this.invalid_rectangle.top);
		this.ctx.lineTo(this.invalid_rectangle.right, this.invalid_rectangle.bottom);
		this.ctx.lineTo(this.invalid_rectangle.left, this.invalid_rectangle.bottom);
		this.ctx.closePath();
		this.ctx.clip();
		
		// Delete the old rectangle.
		this.ctx.clearRect(this.invalid_rectangle.left, this.invalid_rectangle.top, this.invalid_rectangle.width(), this.invalid_rectangle.height());
		
		// Draw everything that might have been deleted or damaged by the clearRect.
		var all_needing_redrawn = this.model.allObjectsTouchingBox(this.invalid_rectangle, true);
		for (var i = 0; i < all_needing_redrawn.length; i++) {
			var list_item = all_needing_redrawn[i];
			if (list_item !== exclude_item) {
				list_item.drawWrapper(this.ctx);
			}
		}
		
		if (this.highlight) {
			this.drawHighlight(this.highlight);
		}
		
		if (this.temp_connection) {
			this.temp_connection.drawWrapper(this.ctx);
		}
		
		// Drop the clip path and draw item in new position.
		this.ctx.restore();
		
		this.invalid_rectangle = null;
	}
};

SchemaDrawer.prototype.invalidateItem = function(item) {
	this.invalidateRectangle(item.boundingBox());
	var connections = item.allConnections();
	for (var i = 0; i < connections.length; i++) {
		this.invalidateRectangle(connections[i].boundingBox().expand(0.1));
	}
}

SchemaDrawer.prototype.moveItem = function(item, new_position) {
	this.invalidateItem(item);
	item.setPosition(new_position);
	this.invalidateItem(item);
};

SchemaDrawer.prototype.drawHighlight = function(point) {
	this.ctx.save();
	this.ctx.globalAlpha = 0.5;
	this.ctx.strokeStyle = "red";
	this.ctx.lineWidth = 0.1;
	this.ctx.beginPath();
	this.ctx.arc(point.x, point.y, 0.1, 0, 2 * Math.PI);
	this.ctx.stroke()
	this.ctx.restore();
};


SchemaDrawer.prototype.addHighlight = function(point) {
	this.highlight = point;
	this.invalidateRectangle(BoxFromPointAndSize(point.minus(new Point(0.2, 0.2)), {width: 0.4, height: 0.4}));
};

SchemaDrawer.prototype.removeHighlight = function(point) {
	this.highlight = null;
	this.invalidateRectangle(BoxFromPointAndSize(point.minus(new Point(0.2, 0.2)), {width: 0.4, height: 0.4}));
};

SchemaDrawer.prototype.addTempConnection = function(connection) {
	this.temp_connection = connection;
};

SchemaDrawer.prototype.removeTempConnection = function() {
	this.invalidateRectangle(this.temp_connection.boundingBox().expand(0.1));
	this.temp_connection = null;
};

/********************************************************************************************/
function View(model, canvas_context)
/********************************************************************************************/
{
	this.model = model;
	this.dragged_object = null;
	this.drawing_area = BoxFromPointAndSize(new Point(0, 0), {width: 30, height: 30 }); 
	this.scale = 30;
	this.ctx = canvas_context;
	this.drawer = new SchemaDrawer(this.model, this.ctx, this.scale, this.drawing_area);
	this.current_hot_point = null;
	this.new_connection = null;
}

View.prototype.setScale = function(scale) {
	this.scale = scale;
	this.drawer.setScale(scale);
	this.drawer.clear();
	this.drawer.draw();
};

View.prototype.setDrawingArea = function(drawing_area) {
	this.drawing_area = drawing_area;
	this.drawer.setDrawingArea(drawing_area);
	this.drawer.clear();
	this.drawer.draw();
};

View.prototype.beginDrag = function(point) {
	if (this.current_hot_point) { // We are we creating a connection.
		this.drawer.removeHighlight(this.current_hot_point.position);
		this.drawer.draw();
		var input_item; var input_num; var output_item; var output_num;
		if (this.current_hot_point.type == "INPUT") {
			input_item = this.current_hot_point.item;
			input_num = this.current_hot_point.number;
		} else {
			output_item = this.current_hot_point.item;
			output_num = this.current_hot_point.number;
		}
		this.new_connection = new Connection(input_item, input_num, output_item, output_num);
		this.drawer.addTempConnection(this.new_connection);
		this.new_connection.setDragPosition(point); // Not sure we need that.
		this.drag_start_hot_point = this.current_hot_point;
		this.current_hot_point = null;
	} else { // We are potentialy moving an item
		this.start_position = point;
		var objects = this.model.hitTest(this.start_position);
		if (objects.length > 0) {
			this.dragged_object = objects[0];
			this.original_position = this.dragged_object.position().copy();
		}
	}
};

View.prototype.continueDrag = function(point) {
	//Move the thing
	if (this.new_connection) {
		this.drawer.invalidateRectangle(this.new_connection.boundingBox().expand(0.1));
		this.new_connection.setDragPosition(point);
		// Are we over a hot point we could connect to
		var hot_point = this.model.hotPoint(point);
		if (hot_point
			&& hot_point.type != this.drag_start_hot_point.type
			&& (hot_point.type == "OUTPUT" || !hot_point.item.hasInputConnection(hot_point.number)))
		{
			this.updateHighlighting(hot_point);
		} else if (!hot_point) {
			this.updateHighlighting(null);
		}
	} else if (this.dragged_object) {
		var d = point.minus(this.start_position);
		this.drawer.moveItem(this.dragged_object, this.original_position.plus(d));
	}
	this.drawer.draw();
};

View.prototype.endDrag = function(point) {
	if (this.new_connection) {
		this.drawer.removeTempConnection();
		var hot_point = this.model.hotPoint(point);
		if	(hot_point
			&& hot_point.type != this.drag_start_hot_point.type
			&& (hot_point.type == "OUTPUT" || !hot_point.item.hasInputConnection(hot_point.number)))
		{
			if (hot_point.type == "INPUT") {
				this.new_connection.input_item = hot_point.item;
				this.new_connection.input_num = hot_point.number;
			} else {
				this.new_connection.output_item = hot_point.item;
				this.new_connection.output_num = hot_point.number;
			}
			this.model.addConnection(this.new_connection);
		}
		this.new_connection = null;
	} else {
		//Leave the thing in its new position
		this.dragged_object = null;
	}
	this.drawer.draw();
};

View.prototype.cancelDrag = function() {
	if (this.new_connection) {
		this.drawer.removeTempConnection();
		this.new_connection = null;
	} else if (this.dragged_object) {
		//Dump the thing back in its original position
		this.drawer.moveItem(this.dragged_object, this.original_position);
		this.dragged_object = null;
	}
	this.drawer.draw();
};

View.prototype.beginDragWithNewObject = function(point, object) {
	//Add a new object at position (x,y), it is being dragged
};

View.prototype.addObject = function(type, at) {
	var object = makeGate(type);
	this.model.add(object);
	object.setPosition(at);
	this.drawer.invalidateRectangle(object.boundingBox());
	this.drawer.draw();
};

View.prototype.updateHighlighting = function(hot_point) {
	if (hot_point && this.current_hot_point) {
		if (!hotPointsEqual(hot_point, this.current_hot_point)) {
			this.drawer.removeHighlight(this.current_hot_point.position);
			this.drawer.addHighlight(hot_point.position);
			this.current_hot_point = hot_point;
		}
	} else {
		if (hot_point) {
			this.drawer.addHighlight(hot_point.position);
			this.current_hot_point = hot_point;
		} else if (this.current_hot_point) {
			this.drawer.removeHighlight(this.current_hot_point.position);
			this.current_hot_point = null;
		}
	}
};

/* method mouseOver to be called when the mouse has moved and the widget is not currently in a drag
  allows the view do do any drawing needed when the mouse hovers,
  */
View.prototype.mouseOver = function(position) {
	var hot_point = this.model.hotPoint(position);
	this.updateHighlighting(hot_point);
	this.drawer.draw();
};

/********************************************************************************************/
function LogicWidget(canvas)
/********************************************************************************************/
{
	var that = this;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	var model = new SchemaModel();
	this.view = new View(model, this.ctx);
	this.origin = new Point(0, 0);
	this.scale = 30;
	this.view.setScale(this.scale);
	this.canvasResized();
	
	canvas.addEventListener('contextmenu',
		function(event) {
			event.preventDefault();
			// dont know if I want this event
			//game.altClick(event.x - canvas.offsetLeft, event.y - canvas.offsetTop);
			//console.log(event.type);
			return false;
		}, false);
	
	canvas.addEventListener('click',
		function(event) {
			// not even sure if I want this either
			event.preventDefault();
			//that.click(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseover',
		function(event) {
			that.mouseover(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseout',
		function(event) {
			that.mouseout(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('mousedown',
		function(event) {
			that.mousedown(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseup',
		function(event) {
			that.mouseup(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('mousemove',
		function(event) {
			that.mousemove(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('drop',
		function(event) {
			that.drop(that.pointFromEvent(event), event);
			return false;
		}, false);
	
	canvas.addEventListener('dragover',
		function(event) {
			event.preventDefault();
			return false;
		}, false);
	
	this.mouse_over = false;
	this.mouse_down = false;
	this.in_drag = false
}

LogicWidget.prototype.pointFromEvent = function(event) {
	// This code is bases on the snipit found in https://bugzilla.mozilla.org/show_bug.cgi?id=122665#c3
	// There is some more background in https://bugzilla.mozilla.org/show_bug.cgi?id=69787
	var element = event.target;
	var offset_x = 0;
	var offset_y = 0;
	while (element.offsetParent) {
		offset_x += element.offsetLeft;
		offset_y += element.offsetTop;
		element = element.offsetParent;
	}
	var x = event.pageX - offset_x;
	var y = event.pageY - offset_y;
	
	// And now change the point into model coordinates
	return new Point( (x / this.scale) + this.origin.x, (y / this.scale) + this.origin.y);
};

LogicWidget.prototype.canvasResized = function() {
	this.view.setDrawingArea(BoxFromPointAndSize(this.origin, { width: this.ctx.canvas.width * this.scale, height: this.ctx.canvas.height * this.scale }));
};

LogicWidget.prototype.mouseover = function(point, event) {
	this.mouse_over = true;
};

LogicWidget.prototype.mouseout = function(point, event) {
	this.mouse_over = false;
	this.view.cancelDrag();
	this.in_drag = false;
	this.mouse_down = false;
};

LogicWidget.prototype.mousedown = function(point, event) {
	this.mouse_down = true;
	this.mouse_down_point = point;
};

LogicWidget.prototype.mouseup = function(point, event) {
	this.mouse_down = false;
	if (this.in_drag) {
		this.view.endDrag(point);
	}
	this.in_drag = false;
};

LogicWidget.prototype.mousemove = function(point, event) {
	if (this.in_drag) {
		this.view.continueDrag(point);
	} else {
		if (this.mouse_down) {
			this.view.beginDrag(this.mouse_down_point);
			this.view.continueDrag(point);
			this.in_drag = true;
		} else {
			this.view.mouseOver(point);
		}
	}
};

LogicWidget.prototype.drop = function(point, event) {
	var type = event.dataTransfer.getData("Text");
	this.view.addObject(type, point);
};


/********************************************************************************************/
function Pallet()
/********************************************************************************************/
{
	
}

function drawGate(canvas, type) {
	var ctx = canvas.getContext("2d");
	ctx.scale(canvas.width, canvas.height);
	var gate = makeGate(type)
	gate.draw(ctx);
}

function createPallet() {
	var gate_list = ["AND", "OR", "NOT"];
	
	// Create the elements
	var html = '<table>';
	for (var i = 0; i < gate_list.length; i++) {
		html += '<tr><td><canvas width="30" height="30" draggable="true" id="pallet-item-' + String(i) + '"></canvas></td></tr>'
	}
	html += "</table>";
	document.getElementById("pallet").innerHTML = html;

	//
	function makeEventListener(type) {
		return function (event) {
			event.dataTransfer.setData("Text", type);
			event.dataTransfer.effectAllowed = 'move'; // only allow moves, what the fuck does that even mean?
		}
	}
	for (var i = 0; i < gate_list.length; i++) {
		var canvas = document.getElementById("pallet-item-" + String(i));
		var type = gate_list[i];
		drawGate(canvas, type);
		canvas.addEventListener("dragstart", makeEventListener(type), true);
	}
	
}

var canvas = document.getElementById("logic_canvas");
var widget = new LogicWidget(canvas);
createPallet();
