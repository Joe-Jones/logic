var LogicWidget = JakeKit.Canvas.extend({

	mouseEvents: {
		"mousedown"		: "mousedown",
		"mouseup"		: "mouseup",
		"mousemove"		: "mousemove",
		"drop"			: "drop",
		"dragover"		: "preventDefault"
	},
		
	events: {
		//"contextmenu canvas"	: "preventDefault", // dont know if I want this event
		//"click canvas"			: "preventDefault", // not even sure if I want this either
		"mouseover canvas"		: "mouseover",
		"mouseout canvas"		: "mouseout"
	},
	
	preventDefault: function(event) {
		event.preventDefault();
		return false;
	},
	
	initialize: function(sheet) {
		JakeKit.Canvas.prototype.initialize.call(this);
		                                                                             
		this.sheet = sheet;
		
		this.mouse_over = false;
		this.mouse_down = false;
		this.in_drag = false
		
		this.view = sheet.view;
	},
	
	ready: function() {
		this.scale(30, 30);
		this.rotate(Math.PI / 2)
	},
	
	mouseover: function(event) {
		this.mouse_over = true;
	},
	
	mouseout: function(event) {
		this.mouse_over = false;
		this.view.cancelDrag();
		this.in_drag = false;
		this.mouse_down = false;
	},
	
	mousedown: function(event, _point) {
		var point = new Point(_point.elements[0], _point.elements[1]);
		this.mouse_down = true;
		this.mouse_down_point = point;
	},
	
	mouseup: function(event, _point) {
		var point = new Point(_point.elements[0], _point.elements[1]);
		this.mouse_down = false;
		if (this.in_drag) {
			this.view.endDrag(point);
		} else {
			this.view.click(point);
		}
		this.in_drag = false;
	},
	
	mousemove: function(event, _point) {
		var point = new Point(_point.elements[0], _point.elements[1]);
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
	
	drop: function(event, point) {
		var type = event.originalEvent.dataTransfer.getData("Text");
		this.view.addObject(type, new Point(point.elements[0], point.elements[1]));
	},
	
	draw: function(ctx) {
		this.view.setContext(this.ctx, this); // Todo, not like this.
		this.view.drawer.draw();
	}
	
});
