/********************************************************************************************/
function Point(x, y)
/********************************************************************************************/
{
	this.x = x;
	this.y = y;
}

/********************************************************************************************/
functon Box(left, top, right, bottom)
/********************************************************************************************/
{
	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;
}

function BoxFromPointAndSize(point, size) {
	return Box(point.x, point.y, point.x + size.width, point.y + size.height);
}

Box.prototype.topLeft() {
	return new Point(this.left, this.top);
}

Box.prototype.bottomRight() {
	return new Point(this.right, this.bottom);
}

Box.prototype.pointIn(point) {
	return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
}

Box.prototype.intersects = function(other) {
	return this.pointIn(this.topLeft()) || this.pointIn(this.bottomRight());
}

/********************************************************************************************/
function DragableThing()
/********************************************************************************************/
{
	this.top_left = Point(0, 0);
	this.container = null;
}

DragableThing.prototype.setContainer = function(container) {
	this.container = container;
}

DragableThing.prototype.positon = function() {
	return this.top_left;
}

DragableThing.prototype.setPosition = function(new_position) {
	this.top_left.x = new_position.x;
	this.top_right.y = new_position.y;
}

DragableThing.prototype.size = function() {
	return {
		width: 1,
		height: 1
	};
}

DragableThing.prototype.Draw = function(ctx, selected) {
	ctx.fillRect(bla bla bla);
};

DragableThing.prototype.hitTest = function(x, y) {
	
};


/********************************************************************************************/
function Conatiner()
/********************************************************************************************/
{
	this.objects = [];
}

Container.prototype.add = function(object) {
	this.objects.push({
		bounding_box: 	BoxFromPointAndSize(object.position(), object.size()),
		object: object
	});
};

Container.prototype.remove - function(object) {
	for (var i = 0; i < this.objects.length i++) {
		if (this.objects[i].object === object) {
			this.objects.splice(i, 1);
			break;
		}
	}
}

Container.prototype.allObjectsTouchingBox = function(box) {
	var results = [];
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].bounding_box.intersects(box)) {
			results.push(this.objects[i].object);
		}
	}
	return results;
}

Container.prototype.hitTest = function(point) {
	var results = [];
	for (var i = 0; i < this.objects.length; i++) {
		if (this.objects[i].bounding_box.pointIn(point)) {
			results.push(this.objects[i].object);
		}
	}
	return results;
}

/********************************************************************************************/
function View(container)
/********************************************************************************************/
{
	this.container = container;
	this.dragged_object = null;
	this.origin = Point(0,0);
	this.scale = 20;
}

View.prototype.setWindow = function(ctx, box) {
	this.ctx = ctx;
	this.drawing_area = box;
}

View.prototype.toModelCoordinates(point) {
	return Point( (point.x / scale) + origin.x, (point.y / scale) + origin.y);
}

View.prototype.beginDrag = function(point) {
	//Locate the thing being draged
	this.start_position = self.toModelCoordinates(point)
	var objects = container.hitTest(this.start_position);
	if (objects.length > 0) {
		this.dragged_object = objects[0];
	}
}

View.prototype.continueDrag = function(x, y) {
	//Move the thing
	if (this.dragged_object) {
		this.dragged_object.setPosition(self.toModelCoordinates(point));
	}
}

View.prototype.endDrag = function(x, y) {
	//Leave the thing in its new position
	this.dragged_object = null;
}

View.prototype.cancelDrag = function() {
	//Dump the thing back in its original position
	if (this.dragged_object) {
		this.dragged_object.setPosition(this.start_position);
		this.dragged_object = null;
	}
}

View.prototype.beginDragWithNewObject = function(x, y, object) {
	//Add a new object at position (x,y), it is being dragged
}

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
			that.click(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseover',
		function(event) {
			that.mouseover(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseout',
		function(event) {
			that.mouseout(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mousedown',
		function(event) {
			that.mousedown(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mouseup',
		function(event) {
			that.mouseup(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	canvas.addEventListener('mousemove',
		function(event) {
			that.mousemove(event.x - canvas.offsetLeft, event.y - canvas.offsetTop, event);
			return false;
		}, false);
	
	this.mouse_over = false;
	this.mouse_down = false;
	this.in_drag = false;
	this.current_drag_target = null;
}

LogicWidget.prototype.mouseover = function(x, y, event) {
	this.mouse_over = true;
}

LogicWidget.prototype.mouseout = function(x, y, event) {
	this.mouse_over = false;
	if (this.current_drag_target) {
		this.current_drag_target.cancelDrag();
		this.current_drag_target= null;
	}
	this.in_drag = false;
	this.mouse_down = false;
}

LogicWidget.prototype.mousedown = function(x, y, event) {
	this.mouse_down = true;
}

LogicWidget.prototype.mouseup = function(x, y, event) {
	this.mouse_down = false;
	if (this.in_drag && this.current_drag_target) {
		this.current_drag_target.endDrag(x, y);
	}
	this.in_drag = false;
	this.current_drag_target = null;
	
}

LogicWidget.prototype.mousemove = function(x, y, event) {
	if (this.in_drag && this.current_drag_target) {
		this.current_drag_target.continueDrag(x,y);
	}
	if (!this.in_drag && mouse_down && this.current_drag_target) {
		this.current_drag_target.startDrag(this.mouse_down_x, this.mouse_down_y);
		this.current_drag_target.continueDrag(x, y);
		this.in_drag = true;
	}
}


var canvas = document.getElementById("logic_canvas");
var widget = new LogicWidget(canvas);
