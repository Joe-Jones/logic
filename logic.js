/********************************************************************************************/
function LogicWidget(canvas)
/********************************************************************************************/
{
	var that = this;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	var model = new SchemaModel();
	this.view = new SchemaView(model, this.ctx);
	this.origin = new Point(0, 0);
	this.scale = 30;
	this.view.setScale(this.scale);
	this.windowResized();
	
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
			event.preventDefault();
			return false;
		}, false);
	
	canvas.addEventListener('dragover',
		function(event) {
			event.preventDefault();
			return false;
		}, false);
	
	window.addEventListener('resize',
		function(event) {
			that.windowResized();
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
	
	// The rotation
	var x_dash = y;
	var y_dash = -x;
	
	// And now change the point into model coordinates
	return new Point( (x_dash / this.scale) + this.origin.x, (y_dash / this.scale) + this.origin.y);
};

LogicWidget.prototype.windowResized = function() {
	var canvas_div = document.getElementById("canvas_div");
	this.ctx.canvas.width = canvas_div.offsetWidth;
	this.ctx.canvas.height = canvas_div.offsetHeight;
	this.ctx.rotate(Math.PI / 2);
	
	var height = this.ctx.canvas.height * this.scale;
	var width = this.ctx.canvas.width * this.scale;
	var box_rotated = BoxFromTwoPoints(this.origin, new Point(this.origin.x + height, this.origin.y - width));
	this.view.setDrawingArea(box_rotated);
}

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
	} else {
		this.view.click(point);
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
	ctx.translate(0.5, 0.5);
	ctx.rotate(Math.PI / 2);
	ctx.translate(-0.5, -0.5);
	var gate = makeGate(type)
	gate.draw(ctx);
}

function createPallet() {
	var gate_list = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "SWITCH", "BULB", "INPUT", "OUTPUT"];
	
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
