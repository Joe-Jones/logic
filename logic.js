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
};

Box.prototype.topLeft = function() {
	return new Point(this.left, this.top);
};

Box.prototype.bottomRight = function() {
	return new Point(this.right, this.bottom);
};

Box.prototype.pointIn = function(point) {
	return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
};

Box.prototype.intersects = function(other) {
	return this.pointIn(this.topLeft()) || this.pointIn(this.bottomRight());
};

/********************************************************************************************/
function DragableThing()
/********************************************************************************************/
{
	this.top_left = new Point(0, 0);
	this.model = null;
}

DragableThing.prototype.setModel = function(model) {
	this.model = model;
};

DragableThing.prototype.position = function() {
	return this.top_left;
};

DragableThing.prototype.setPosition = function(new_position) {
	this.top_left = new_position;
	this.model.objectMoved(this);
};

DragableThing.prototype.size = function() {
	return {
		width: 1,
		height: 1
	};
};

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
	return [new Point(0.5, 0.05)];
};

DragableThing.prototype.LogicGateSingleInput = function() {
	return [new Point(0.5, 0.95)]
};

DragableThing.prototype.LogicGateDoubleInput = function() {
	return [new Point(0.3, 0.95), new Point(0.7, 0.95)];
};

/********************************************************************************************/
function NotGate()
/********************************************************************************************/
{	
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
	moveTo(0.5, 0.4);
	ctx.arc(0.5, 0.3, 0.1, - Math.PI ,  Math.PI );
	ctx.stroke();
	
	// Output
	ctx.beginPath();
	ctx.moveTo(0.5, 0.2);
	ctx.lineTo(0.5, 0.05);
	ctx.stroke();
	
	ctx.restore();
};

NotGate.prototype.input = DragableThing.prototype.LogicGateSingleInput;
NotGate.prototype.output = DragableThing.prototype.LogicGateSingleOutput;

/********************************************************************************************/
function AndGate()
/********************************************************************************************/
{
	
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

AndGate.prototype.input = DragableThing.prototype.LogicGateSingleOutput;
AndGate.prototype.output = DragableThing.prototype.LogicGateDoubleInput;

/********************************************************************************************/
function OrGate()
/********************************************************************************************/
{
	
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

OrGate.prototype.input = DragableThing.prototype.LogicGateSingleOutput;
OrGate.prototype.output = DragableThing.prototype.LogicGateDoubleInput;


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
function SchemaModel()
/********************************************************************************************/
{
	this.objects = [];
}

SchemaModel.prototype.add = function(object) {
	this.objects.push({
		bounding_box: 	BoxFromPointAndSize(object.position(), object.size()),
		object: object
	});
	object.setModel(this);
};

SchemaModel.prototype.remove = function(object) {
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].object === object) {
			this.objects.splice(i, 1);
			break;
		}
	}
};

SchemaModel.prototype.allObjectsTouchingBox = function(box) {
	var results = [];
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].bounding_box.intersects(box)) {
			results.push(this.objects[i].object);
		}
	}
	return results;
};

SchemaModel.prototype.hitTest = function(point) {
	var results = [];
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].bounding_box.pointIn(point)) {
			results.push(this.objects[i].object);
		}
	}
	return results;
};

SchemaModel.prototype.objectMoved = function(object) {
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].object === object) {
			this.objects[i].bounding_box = BoxFromPointAndSize(object.position(), object.size());
			break;
		}
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
}

SchemaDrawer.prototype.setScale = function(scale) {
	this.scale = scale;
};

SchemaDrawer.prototype.setDrawingArea = function(drawing_area) {
	this.drawing_area = drawing_area;
};

/********
** method draw()
** Draw everything in the view, used when the view if first created, or if the view is moved or if the scale is changed
*******/
SchemaDrawer.prototype.draw = function() {
	var all_in_view = this.model.allObjectsTouchingBox(this.drawing_area);
	for (var i = 0; i < all_in_view.length; i++) {
		this.drawItem(all_in_view[i]);
	}
};

SchemaDrawer.prototype.drawItem = function(item) {
	var position = item.position();
	this.ctx.save();
	this.ctx.scale(this.scale, this.scale);
	this.ctx.translate(this.drawing_area.left + position.x, this.drawing_area.top + position.y);
	item.draw(this.ctx);
	this.ctx.restore();
};

SchemaDrawer.prototype.deleteItem = function(item) {
	var position = item.position();
	var size = item.size();
	this.ctx.save();
	this.ctx.scale(this.scale, this.scale);
	this.ctx.translate(this.drawing_area.left + position.x, this.drawing_area.top + position.y);
	//item.draw(this.ctx);
	this.ctx.clearRect(0, 0, size.width, size.height);
	this.ctx.restore();
};

/********************************************************************************************/
function View(model)
/********************************************************************************************/
{
	this.model = model;
	this.dragged_object = null;
	this.origin = new Point(0,0);
	this.scale = 30;
}

View.prototype.setWindow = function(ctx, box) {
	this.ctx = ctx;
	this.drawing_area = box;
	this.drawer = new SchemaDrawer(this.model, this.ctx, this.scale, this.drawing_area);
};

View.prototype.toModelCoordinates = function(point) {
	return new Point( (point.x / this.scale) + this.origin.x, (point.y / this.scale) + this.origin.y);
};

View.prototype.beginDrag = function(point) {
	//Locate the thing being draged
	this.start_position = this.toModelCoordinates(point);
	var objects = model.hitTest(this.start_position);
	if (objects.length > 0) {
		this.dragged_object = objects[0];
		this.original_position = this.dragged_object.position().copy();
		console.log(this.original_position);
	}
};

View.prototype.continueDrag = function(point) {
	//Move the thing
	if (this.dragged_object) {
		var p = this.toModelCoordinates(point);
		var d = p.minus(this.start_position);
		this.drawer.deleteItem(this.dragged_object);
		this.dragged_object.setPosition(this.original_position.plus(d));
		this.drawer.drawItem(this.dragged_object);
	}
};

View.prototype.endDrag = function(point) {
	//Leave the thing in its new position
	this.dragged_object = null;
};

View.prototype.cancelDrag = function() {
	//Dump the thing back in its original position
	if (this.dragged_object) {
		this.deleteItem(this.dragged_object);
		this.dragged_object.setPosition(this.original_position);
		this.drawer.drawItem(this.dragged_object);
		this.dragged_object = null;
	}
};

View.prototype.beginDragWithNewObject = function(point, object) {
	//Add a new object at position (x,y), it is being dragged
};

View.prototype.addObject = function(type, at) {
	var object = makeGate(type);
	var p = this.toModelCoordinates(at);
	this.model.add(object);
	object.setPosition(p);
	this.drawer.drawItem(object)
};

/********************************************************************************************/
function LogicWidget(canvas)
/********************************************************************************************/
{
	var that = this;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	
	canvas.addEventListener('contextmenu',
		function(event) {
			event.preventDefault();
			// dont know if I want this event
			//game.altClick(event.x - canvas.offsetLeft, event.y - canvas.offsetTop);
			console.log(event.type);
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
	this.in_drag = false;
	this.current_drag_target = null;
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
	return new Point(event.pageX - offset_x, event.pageY - offset_y);
}

LogicWidget.prototype.setView = function(view) {
	this.current_drag_target = view;
	view.setWindow(this.ctx, new Box(0, 0, 800, 600));
};

LogicWidget.prototype.mouseover = function(point, event) {
	this.mouse_over = true;
};

LogicWidget.prototype.mouseout = function(point, event) {
	this.mouse_over = false;
	if (this.current_drag_target) {
		this.current_drag_target.cancelDrag();
		// this.current_drag_target= null; again I don't think this is what I meant
	}
	this.in_drag = false;
	this.mouse_down = false;
};

LogicWidget.prototype.mousedown = function(point, event) {
	this.mouse_down = true;
	this.mouse_down_point = point;
};

LogicWidget.prototype.mouseup = function(point, event) {
	this.mouse_down = false;
	if (this.in_drag && this.current_drag_target) {
		this.current_drag_target.endDrag(point);
	}
	this.in_drag = false;
	// this.current_drag_target = null; I don't think this is what i meant
	
};

LogicWidget.prototype.mousemove = function(point, event) {
	if (this.in_drag && this.current_drag_target) {
		this.current_drag_target.continueDrag(point);
	}
	if (!this.in_drag && this.mouse_down && this.current_drag_target) {
		this.current_drag_target.beginDrag(this.mouse_down_point);
		this.current_drag_target.continueDrag(point);
		this.in_drag = true;
	}
};

LogicWidget.prototype.drop = function(point, event) {
	var type = event.dataTransfer.getData("gateType");
	this.current_drag_target.addObject(type, point); //do I need to check current_drag_target, is it a load of shit.
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
			event.dataTransfer.setData("gateType", type);
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
var model = new SchemaModel();
var view = new View(model);
var widget = new LogicWidget(canvas);
widget.setView(view);
createPallet();
