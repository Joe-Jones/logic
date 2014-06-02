var LogicWidget = Canvas.extend({

	events: {
		"contextmenu canvas"	: "preventDefault", // dont know if I want this event
		"click canvas"			: "preventDefault", // not even sure if I want this either
		"mouseover canvas"		: "mouseover",
		"mouseout canvas"		: "mouseout",
		"mousedown canvas"		: "mousedown",
		"mouseup canvas"		: "mouseup",
		"mousemove canvas"		: "mousemove",
		"drop canvas"			: "drop",
		"dragover canvas"		: "preventDefault"
	},
	
	preventDefault: function(event) {
		event.preventDefault();
		return false;
	},
	
	takesPoint: function() {
		var that = this;
		_.each(arguments, function(method_name) {
			if (_.isFunction(that[method_name])) {
				var existing_function = that[method_name];
				that[method_name] = function (event) {
					existing_function.call(that, that.pointFromEvent(event.originalEvent), event);
					return false;
				}
			}
		});
	},
	
	initialize: function(sheet) {
		Canvas.prototype.initialize.call(this);
		var that = this;
		
		this.takesPoint("mouseover", "mouseout", "mousedown", "mouseup", "mousemove", "drop");
		//_.bindAll(this, "drop");
		var drop = this.drop;
		//this.drop = function(event) { drop.call(that, event); event.preventDefault(); return false; };
		                                                                             
		this.sheet = sheet;
		
		this.mouse_over = false;
		this.mouse_down = false;
		this.in_drag = false
	},
	
	render: function() {
		Canvas.prototype.render.call(this);
		this.ctx.save();
		this.setSheet(this.sheet);
	},
	
	pointFromEvent: function(event) {
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
	},
	
	windowResized: function() {
		//var canvas_div = document.getElementById("canvas");
		//this.ctx.canvas.width = canvas_div.offsetWidth;
		//this.ctx.canvas.height = canvas_div.offsetHeight;
		this.ctx.rotate(Math.PI / 2);
		
		var height = this.ctx.canvas.height * this.scale;
		var width = this.ctx.canvas.width * this.scale;
		var box_rotated = BoxFromTwoPoints(this.origin, new Point(this.origin.x + height, this.origin.y - width));
		this.view.setDrawingArea(box_rotated);
	},
	
	mouseover: function(point, event) {
		this.mouse_over = true;
	},
	
	mouseout: function(point, event) {
		this.mouse_over = false;
		this.view.cancelDrag();
		this.in_drag = false;
		this.mouse_down = false;
	},
	
	mousedown: function(point, event) {
		this.mouse_down = true;
		this.mouse_down_point = point;
	},
	
	mouseup: function(point, event) {
		this.mouse_down = false;
		if (this.in_drag) {
			this.view.endDrag(point);
		} else {
			this.view.click(point);
		}
		this.in_drag = false;
	},
	
	mousemove: function(point, event) {
		console.log("#");
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
	},
	
	drop: function(point, event) {
		var type = event.originalEvent.dataTransfer.getData("Text");
		this.view.addObject(type, point);
	},
	
	setSheet: function (sheet) {
		this.view = sheet.view;
		this.scale = sheet.view.scale;
		this.origin = sheet.view.origin;
		this.view.setContext(this.ctx);	
		this.view.setScale(this.scale);
		this.windowResized();
	}
});


