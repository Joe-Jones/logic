"use strict";

var and_scale = 1;
var and_translate = [0, 0.8];
var and_tranformation = Matrix.create([[1,0,and_translate[0]],[0,1,and_translate[1]],[0,0,1]]).multiply(Matrix.Diagonal([and_scale, and_scale, 1]));

var gate_size = { width: 1, height: 2.2};

var input_height = 2.15;
var and_input_length = 0.55;
var or_input_length = 0.59;
var output_length = 0.9;
var not_output_length = 0.73;
var xbar_adjust = 0.95;

function LogicGateSingleOutput() { return [this.top_left.plus(new Point(0.5, 0.05))]; }
function LogicGateSingleInput() { return [this.top_left.plus(new Point(0.5, input_height))] }
function LogicGateDoubleInput() { return [this.top_left.plus(new Point(0.3, input_height)), this.top_left.plus(new Point(0.7, input_height))]; }

function CanvasWrapper(ctx, transformation, scale) {
	this.ctx = ctx;
	this.transformation = transformation;
	this.scale = scale;
}

CanvasWrapper.prototype = {

	transformPoint: function(x, y) {
		var v = this.transformation.multiply(Vector.create([x, y, 1]));
		return [v.e(1), v.e(2)];
	},

	stroke: function() {
		this.ctx.stroke();
	},
	
	beginPath: function() {
		this.ctx.beginPath();
	},
	
	moveTo: function(x, y) {
		var point = this.transformPoint(x, y);
		this.ctx.moveTo(point[0], point[1]);
	},
	
	lineTo: function(x, y) {
		var point = this.transformPoint(x, y);
		this.ctx.lineTo(point[0], point[1]);
	},
	
	arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
		var point = this.transformPoint(x, y);
		this.ctx.arc(point[0], point[1], radius * this.scale, startAngle, endAngle, anticlockwise);
	},
	
	bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) {
		var cp1 = this.transformPoint(cp1x, cp1y);
		var cp2 = this.transformPoint(cp2x, cp2y);
		var end_point = this.transformPoint(x, y);
		this.ctx.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], end_point[0], end_point[1]);
	}

};

function drawAndBody(ctx) {
	ctx = new CanvasWrapper(ctx, and_tranformation, and_scale); 
	ctx.beginPath();
	ctx.moveTo(0.85, 0.8);
	ctx.lineTo(0.15, 0.8);
	ctx.lineTo(0.15, 0.5);
	ctx.arc(0.5, 0.5, 0.35, Math.PI, 0);
	ctx.lineTo(0.85, 0.8);
	ctx.stroke();
}

function drawOrBody(ctx) {
	ctx = new CanvasWrapper(ctx, and_tranformation, and_scale); 
	ctx.beginPath();
	ctx.moveTo(0.15, 0.8);
	ctx.bezierCurveTo(0.3, 0.7, 0.7, 0.7, 0.85, 0.8);
	ctx.lineTo(0.87, 0.5);
	ctx.bezierCurveTo(0.87, 0.2, 0.6, 0.2, 0.5, 0.1);
	ctx.bezierCurveTo(0.4, 0.2, 0.13, 0.2, 0.15, 0.5);
	ctx.lineTo(0.15, 0.8);
	ctx.stroke();
}

function drawNotBody(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.5, 0.57 + not_output_length);
	ctx.lineTo(0.1, 0.57 + not_output_length) ;
	ctx.lineTo(0.5, 0.17 + not_output_length);
	ctx.lineTo(0.9, 0.57 + not_output_length);
	ctx.lineTo(0.5, 0.57 + not_output_length);
	ctx.stroke();
}

function drawOutput(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.5, 0.05 + output_length);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
}

function drawNotOutput(ctx) {
	// the circle
	ctx.beginPath();
	ctx.arc(0.5, 0.1 + not_output_length, 0.1, - Math.PI ,  Math.PI );
	ctx.stroke();
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.048 + not_output_length);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
}

function drawNotInput(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.5, input_height);
	ctx.lineTo(0.5, 1.28);
	ctx.stroke();
}

function drawAndInputs(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.3, input_height);
	ctx.lineTo(0.3, input_height - and_input_length);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(0.7, input_height);
	ctx.lineTo(0.7, input_height - and_input_length);
	ctx.stroke();
}

function drawOrInputs(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.3, input_height);
	ctx.lineTo(0.3, input_height - or_input_length);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(0.7, input_height);
	ctx.lineTo(0.7, input_height - or_input_length);
	ctx.stroke();
}

function drawXBar(ctx) {
	ctx.beginPath();
	ctx.moveTo(0.15, 0.8 + xbar_adjust);
	ctx.bezierCurveTo(0.3, 0.7 + xbar_adjust, 0.7, 0.7 + xbar_adjust, 0.85, 0.8 + xbar_adjust);
	ctx.stroke();
}

function drawNotGate(ctx) {
	drawNotInput(ctx);
	drawNotBody(ctx);
	drawNotOutput(ctx);
}

function drawAndGate(ctx) {
	drawAndInputs(ctx);
	drawAndBody(ctx);
	drawOutput(ctx);
}

function drawOrGate(ctx) {
	drawOrInputs(ctx);
	drawOrBody(ctx);
	drawOutput(ctx);
}

function drawNandGate(ctx) {
	drawAndInputs(ctx);
	drawAndBody(ctx);
	drawNotOutput(ctx);
}

function drawNorGate(ctx) {
	drawOrInputs(ctx);
	drawOrBody(ctx);
	drawNotOutput(ctx);
}

function drawXorGate(ctx) {
	drawOrInputs(ctx);
	drawOrBody(ctx);
	drawOutput(ctx);
	drawXBar(ctx);
}

function drawXnorGate(ctx) {
	drawOrInputs(ctx);
	drawOrBody(ctx);
	drawNotOutput(ctx);
	drawXBar(ctx);
}

var gate_info = {
	AND:	{ drawSub: drawAndGate,		size: gate_size, input: "double"},
	OR:		{ drawSub: drawOrGate,		size: gate_size, input: "double"},
	NOT:	{ drawSub: drawNotGate,		size: gate_size, input: "single"},
	NAND:	{ drawSub: drawNandGate,	size: gate_size, input: "double"},
	NOR:	{ drawSub: drawNorGate,		size: gate_size, input: "double"},
	XOR:	{ drawSub: drawXorGate,		size: gate_size, input: "double"},
	XNOR:	{ drawSub: drawXnorGate,	size: gate_size, input: "double"}
};

/********************************************************************************************/
function DragableThing()
/********************************************************************************************/
{
	this.top_left = new Point(0, 0);
	this.model = null;
	this.DisplaysState = false;
	this.HasState = false;
}

DragableThing.prototype.initDragableThing = function() {
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

DragableThing.prototype.drawWrapper = function(ctx) {
	var position = this.position();
	ctx.save();
	ctx.translate(position.x, position.y);
	this.draw(ctx);
	ctx.restore();
}

DragableThing.prototype.draw = function(ctx) {
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

DragableThing.prototype.input = function(n) {
	return this.inputs()[n];
};

DragableThing.prototype.output = function(n) {
	return this.outputs()[n];
};

DragableThing.prototype.addConnection = function(connection) {
	if (connection.input_item === this) {
		this.input_connections[connection.input_num] = connection;
	} else {
		var number = connection.output_num;
		if (!this.output_connections[number]) {
			this.output_connections[number] = [connection];
		} else {
			this.output_connections[number].push(connection);
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

DragableThing.prototype.getInput = function(n) {
	return this.input_connections[n];
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

DragableThing.prototype.removeInput = function(input) {
	delete this.input_connections[input];
};

DragableThing.prototype.removeOutput = function(output, connection) {
	this.output_connections[output] = _.without(this.output_connections[output], connection);
};

DragableThing.prototype.click = function() {
	return false;
};

DragableThing.prototype.select = function() {
	this.selected = true;
};

DragableThing.prototype.unselect = function() {
	this.selected = false;
};

/********************************************************************************************/
function LogicGate(type) {
/********************************************************************************************/
	this.type = type;
	this.initDragableThing();
	if (gate_info[this.type].input == "single") {
		this.inputs = LogicGateSingleInput;
	} else {
		this.inputs = LogicGateDoubleInput;
	}
	this.outputs = LogicGateSingleOutput;
}

LogicGate.prototype = new DragableThing();
_.extend(LogicGate.prototype, {

	size: function() {
		return gate_info[this.type].size;
	},
	
	draw: function(ctx) {
		ctx.save();
		ctx.lineWidth = (this.selected ? 0.1 : 0.05);
		gate_info[this.type].drawSub(ctx);
		ctx.restore();
	}

});

/********************************************************************************************/
function Switch()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "SWITCH";
	this.on = false;
	this.HasState = true;
}

Switch.prototype = new DragableThing();

Switch.prototype.draw = function(ctx) {
	ctx.save();
	ctx.lineWidth = (this.selected ? 0.1 : 0.05);

	ctx.fillRect(0.15, 0.15, 0.7, 0.7);
	if(!this.on) {
		ctx.clearRect(0.3, 0.3, 0.4, 0.4);
	}
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

Switch.prototype.outputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.05))];
};

Switch.prototype.click = function() {
	this.on = !this.on;
	if (this.stateChanged) {
		this.stateChanged(this.on);
	}
	return true;
};

Switch.prototype.getState = function() {
	return this.on;
}

Switch.prototype.setState = function(state) {
	this.on = state;
	if (this.stateChanged) {
		this.stateChanged(this.on);
	}
}

/********************************************************************************************/
function Bulb()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "BULB";
	this.DisplaysState = true;
}

Bulb.prototype = new DragableThing();

Bulb.prototype.draw = function(ctx) {
	ctx.save();
	ctx.lineWidth = (this.selected ? 0.1 : 0.05);
	
	//	Input
	ctx.beginPath();
	ctx.moveTo(0.5, 0.95);
	ctx.lineTo(0.5, 0.75);
	ctx.stroke();
	
	ctx.fillRect(0.15, 0.15, 0.7, 0.7);
	if(!this.on) {
		ctx.fillStyle = "white";
		ctx.fillRect(0.3, 0.3, 0.4, 0.4);
	}
	
	ctx.restore();
};

Bulb.prototype.setState = function (state) {
	this.on = state;
}

Bulb.prototype.inputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.95))];
};

/********************************************************************************************/
function Input()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "INPUT";
}

Input.prototype = new DragableThing();

Input.prototype.draw = function(ctx) {
	ctx.save();
	ctx.lineWidth = (this.selected ? 0.1 : 0.05);
	
	//	Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.05);
	ctx.lineTo(0.5, 0.3);
	ctx.stroke();
	
	// Circle
	ctx.moveTo(0.7, 0.5);
	ctx.arc(0.5, 0.5, 0.2, 0, Math.PI *2);
	ctx.stroke();
	
	// Name
	if (_.isFunction(this.name)) {
		ctx.save();
		ctx.scale(TEXT_SCALE, TEXT_SCALE);
		ctx.rotate(TEXT_ROTATION);
		ctx.fillText(this.name(), -5, 27);
		ctx.restore();
	}
	
	ctx.restore();
};

Input.prototype.setState = function (state) {
	this.on = state;
}

Input.prototype.outputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.05))];
};

/********************************************************************************************/
function Output()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "OUTPUT";
}

Output.prototype = new DragableThing();

Output.prototype.draw = function(ctx) {
	ctx.save();
	ctx.lineWidth = (this.selected ? 0.1 : 0.05);
	
	//	Input
	ctx.beginPath();
	ctx.moveTo(0.5, 0.95);
	ctx.lineTo(0.5, 0.7);
	ctx.stroke();
	
	// Circle
	ctx.moveTo(0.7, 0.5);
	ctx.arc(0.5, 0.5, 0.2, 0, Math.PI *2);
	ctx.stroke();
	
	// Name
	if (_.isFunction(this.name)) {
		ctx.save();
		ctx.scale(TEXT_SCALE, TEXT_SCALE);
		ctx.rotate(TEXT_ROTATION);
		ctx.fillText(this.name(), -5, 27);
		ctx.restore();
	}
	
	ctx.restore();
};

Output.prototype.setState = function (state) {
	this.on = state;
}

Output.prototype.inputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.95))];
};



function makeGate(type) {
	var parts = type.split(":");
	if (parts.length == 1) {
		if (_.contains(["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"], type)) {
			return new LogicGate(type);
		} else {
			switch(type) {
				case "SWITCH":
					return new Switch();
				case "BULB":
					return new Bulb();
				case "INPUT":
					return new Input();
				case "OUTPUT":
					return new Output();
			}
		}
	} else {
		type = parts[0];
		var id = parts[1];
		if (type == "COMPONENT") {
			return new SubCircit(id);
		}
	}
}

/********************************************************************************************/
function SubCircit(id)
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "SUBCIRCIT";
	this.schema_id = id;
}

SubCircit.prototype = new DragableThing();

SubCircit.prototype.width = function() {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var number_of_inputs = schema_info.inputs.length;
	var number_of_outputs = schema_info.outputs.length;
	return _.max([number_of_inputs, number_of_outputs]) * connection_stride + 0.2;
};

SubCircit.prototype.height = function() {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var max_input_width = _.max(_.flatten([_.map(schema_info.inputs, function(item) { return item.name.length; }), 0]));
	var max_output_width = _.max(_.flatten([_.map(schema_info.outputs, function(item) { return item.name.length; }), 0]));
	return 1.2 + (max_input_width + max_output_width) * 0.25 ;
};

SubCircit.prototype.size = function() {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var number_of_inputs = schema_info.inputs.length;
	var number_of_outputs = schema_info.outputs.length;
	return {
		width: this.width(),
		height: this.height()
	};
};

// Some Constants

var TEXT_SCALE = 0.04;
var TEXT_ROTATION = - Math.PI / 2;
var connection_length = 0.28
var connection_stride = 0.48;

SubCircit.prototype.draw = function(ctx) {
	ctx.save();
	ctx.lineWidth = (this.selected ? 0.1 : 0.05);
	
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var number_of_inputs = schema_info.inputs.length;
	var number_of_outputs = schema_info.outputs.length;
	
	// Work out big we need to be
	var width = this.width();
	var height = this.height();
	
	// Draw box
	ctx.beginPath();
	ctx.moveTo(0, connection_length);
	ctx.lineTo(width , connection_length);
	ctx.lineTo(width, height - connection_length);
	ctx.lineTo(0, height - connection_length);
	ctx.lineTo(0, connection_length);
	ctx.stroke();
	
	// Draw Inputs
	for (var i = 0; i < number_of_inputs; i++) {
		ctx.beginPath();
		ctx.moveTo(0.3 + connection_stride * i, height - 0.05);
		ctx.lineTo(0.3 + connection_stride * i, height - 0.25);
		ctx.stroke();
		
		//Draw labels
		ctx.save();
		ctx.scale(TEXT_SCALE, TEXT_SCALE);
		ctx.rotate(TEXT_ROTATION);
		ctx.fillText(schema_info.inputs[i].name, 10 - height * 1 / 0.04, 10 + i * 12);
		ctx.restore();
		
	}
	
	// Outputs
	var max_output_width = _.max(_.map(schema_info.outputs, function(item) { return item.name.length; }));
	for (var i = 0; i < number_of_outputs; i++) {
		ctx.beginPath();
		ctx.moveTo(0.3 + connection_stride * i, 0.25);
		ctx.lineTo(0.3 + connection_stride * i, 0.05);
		ctx.stroke();
		
		//Draw labels
		ctx.save();
		ctx.scale(TEXT_SCALE, TEXT_SCALE);
		ctx.rotate(TEXT_ROTATION);
		ctx.fillText(schema_info.outputs[i].name, - 10 - max_output_width * 5.1,  10 + i * 12);
		ctx.restore();
	}
	
	ctx.restore();
};

SubCircit.prototype.outputs = function() {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var number_of_outputs = schema_info.outputs.length;
	var outputs = [];
	for (var i = 0; i < number_of_outputs; i++) {
		outputs.push(this.top_left.plus(new Point(0.3 + i * connection_stride, 0.05)));
	}
	return outputs;
};

SubCircit.prototype.inputs = function() {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var number_of_inputs = schema_info.inputs.length;
	var height = this.height();
	var inputs = [];
	for (var i = 0; i < number_of_inputs; i++) {
		inputs.push(this.top_left.plus(new Point(0.3 + i * connection_stride, height - 0.05)));
	}
	return inputs;
};

SubCircit.prototype.input = function(n) {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var inputs = schema_info.inputs;
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].number == n) {
			return this.inputs()[i];
		}
	}
};

SubCircit.prototype.output = function(n) {
	var schema_info = this.project.getSchemaInfo(this.schema_id);
	var outputs = schema_info.outputs;
	for (var i = 0; i < outputs.length; i++) {
		if (outputs[i].number == n) {
			return this.outputs()[i];
		}
	}
};

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
	var input, output;
	if (this.input_item) {
		input = this.input_item.input(this.input_num);
	} else {
		input = this.drag_position;
	}
	if (this.output_item) {
		output = this.output_item.output(this.output_num);
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

