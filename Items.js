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

DragableThing.prototype.click = function() {
	return false;
};

/********************************************************************************************/
function NotGate()
/********************************************************************************************/
{
	this.initDragableThing()
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
	this.initDragableThing()
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
	this.initDragableThing()
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

/********************************************************************************************/
function NandGate()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "NAND";
}

NandGate.prototype = new DragableThing();

NandGate.prototype.draw = function(ctx, selected) {
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
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

NandGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
NandGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function NorGate()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "NOR";
}

NorGate.prototype = new DragableThing();

NorGate.prototype.draw = function(ctx, selected) {
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
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

NorGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
NorGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function XorGate()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "XOR";
}

XorGate.prototype = new DragableThing();

XorGate.prototype.draw = function(ctx, selected) {
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
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

XorGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
XorGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function XnorGate()
/********************************************************************************************/
{
	this.initDragableThing()
	this.type = "XNOR";
}

XnorGate.prototype = new DragableThing();

XnorGate.prototype.draw = function(ctx, selected) {
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
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.15);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

XnorGate.prototype.inputs = DragableThing.prototype.LogicGateDoubleInput;
XnorGate.prototype.outputs = DragableThing.prototype.LogicGateSingleOutput;


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

Switch.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;

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

Bulb.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	
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

Input.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	
	//	Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.05);
	ctx.lineTo(0.5, 0.3);
	ctx.stroke();
	
	// Circle
	ctx.moveTo(0.7, 0.5);
	ctx.arc(0.5, 0.5, 0.2, 0, Math.PI *2);
	ctx.stroke();
	
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

Output.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;
	
	//	Input
	ctx.beginPath();
	ctx.moveTo(0.5, 0.95);
	ctx.lineTo(0.5, 0.7);
	ctx.stroke();
	
	// Circle
	ctx.moveTo(0.7, 0.5);
	ctx.arc(0.5, 0.5, 0.2, 0, Math.PI *2);
	ctx.stroke();
	
	ctx.restore();
};

Output.prototype.setState = function (state) {
	this.on = state;
}

Output.prototype.inputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.95))];
};



function makeGate(type) {
	switch(type) {
		case "AND":
			return new AndGate();
		case "OR":
			return new OrGate();
		case "NOT":
			return new NotGate();
		case "NAND":
			return new NandGate();
		case "NOR":
			return new NorGate();
		case "XOR":
			return new XorGate();
		case "XNOR":
			return new XnorGate();
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

/********************************************************************************************/
function SubCircit()
/********************************************************************************************/
{
	this.initDragableThing()

}

SubCircit.prototype = new DragableThing();

SubCircit.prototype.draw = function(ctx, selected) {
	ctx.save();
	ctx.lineWidth = 0.05;

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

SubCircit.prototype.outputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.05))];
};

SubCircit.prototype.inputs = function() {
	return [this.top_left.plus(new Point(0.5, 0.05))];
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

