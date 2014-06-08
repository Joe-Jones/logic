/********************************************************************************************/
//function SchemaView(model)
/********************************************************************************************/
SchemaView = JakeKit.Canvas.extend({
		
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
	
	initialize: function() {
		JakeKit.Canvas.prototype.initialize.call(this);
		
		this.mouse_over = false;
		this.mouse_down = false;
		this.in_drag = false;
		
		// From SchemaView
		this.model = new SchemaModel();
		this.dragged_object = null;
		this.drawer = new SchemaDrawer(this.model);
		this.current_hot_point = null;
		this.new_connection = null;
		this.model.drawer = this.drawer;
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
		this.cancelDrag();
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
			this.endDrag(point);
		} else {
			this.click(point);
		}
		this.in_drag = false;
	},
	
	mousemove: function(event, _point) {
		var point = new Point(_point.elements[0], _point.elements[1]);
		if (this.in_drag) {
			this.continueDrag(point);
		} else {
			if (this.mouse_down) {
				this.beginDrag(this.mouse_down_point);
				this.continueDrag(point);
				this.in_drag = true;
			} else {
				this.mouseOver(point);
			}
		}
	},
	
	drop: function(event, point) {
		var type = event.originalEvent.dataTransfer.getData("Text");
		this.addObject(type, new Point(point.elements[0], point.elements[1]));
	},
	
	draw: function(ctx) {
		this.drawer.setContext(ctx); // Todo, not like this.
		this.drawer.draw();
	},

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	beginDrag: function(point) {
		if (this.current_hot_point) { // We are we creating a connection.
			this.drawer.removeHighlight(this.current_hot_point.position);
			this.invalidate();
			var input_item; var input_num; var output_item; var output_num;
			if (this.current_hot_point.type == "INPUT") {
				if (this.current_hot_point.item.hasInputConnection(this.current_hot_point.number)) {
					return;
				}
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
	},
	
	continueDrag: function(point) {
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
	},
	
	endDrag: function(point) {
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
		this.invalidate();
	},
	
	cancelDrag: function() {
		if (this.new_connection) {
			this.drawer.removeTempConnection();
			this.new_connection = null;
		} else if (this.dragged_object) {
			//Dump the thing back in its original position
			this.drawer.moveItem(this.dragged_object, this.original_position);
			this.dragged_object = null;
		}
		this.invalidate();
	},
	
	beginDragWithNewObject: function(point, object) {
		//Add a new object at position (x,y), it is being dragged
	},
	
	addObject: function(type, at) {
		var object = makeGate(type);
		this.model.add(object);
		object.setPosition(at);
		//this.drawer.invalidateRectangle(object.boundingBox());
		this.invalidate();
	},
	
	updateHighlighting: function(hot_point) {
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
	},
	
	/* method mouseOver to be called when the mouse has moved and the widget is not currently in a drag
	  allows the view do do any drawing needed when the mouse hovers,
	  */
	mouseOver: function(position) {
		var hot_point = this.model.hotPoint(position);
		this.updateHighlighting(hot_point);
		this.invalidate();
	},
	
	click: function(position) {
		var objects = this.model.hitTest(position);
		if (objects.length > 0) {
			object = objects[0];
			if(object.click()) {
				//this.drawer.invalidateRectangle(object.boundingBox());
			}
		}
		this.invalidate();
	},
	
});

