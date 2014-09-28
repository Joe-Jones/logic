"use strict";

var SchemaView = JakeKit.Canvas.extend({
		
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
	
	initialize: function(model, action_recorder) {
		JakeKit.Canvas.prototype.initialize.call(this);
		var that = this;
		
		this.action_recorder = action_recorder;
		
		this.mouse_over = false;
		this.mouse_down = false;
		this.in_drag = false;
		
		// From SchemaView
		this.model = model;
		this.dragged_object = null;
		this.drawer = new SchemaDrawer(this.model);
		this.current_hot_point = null;
		this.new_connection = null;
		this.model.drawer = this.drawer;
		this.selection = [];

	},
	
	id: function() {
		return this.model.id;
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
		} else {
			// We are either moving an item, or creating a selection.
			this.start_position = point;
			var objects = this.model.hitTest(this.start_position);
			if (objects.length > 0) {
				// We are dragging an object
				this.dragged_object = objects[0];
				this.original_position = this.dragged_object.position().copy();
			} else {
				// We are creating a selection
				this.corner = point;
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
		} else if (this.corner) {
			this.selection_box = BoxFromTwoPoints(this.corner, point);
			_.each(this.selection, function(item) { item.unselect(); });
			this.selection = this.model.allObjectsTouchingBox(this.selection_box, false);
			_.each(this.selection, function(item) { item.select(); });
			this.drawer.setSelectionBox(this.selection_box);
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
				this.addConnection(this.new_connection);
			}
			this.new_connection = null;
		} else if (this.corner) {
			// Leave the selected stuff selected.
			delete this.corner;
			this.drawer.setSelectionBox();
		} else {
			//Leave the thing in its new position
			this.moveObject(this.dragged_object, this.original_position);
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
		} else if (this.corner) {
			_.each(this.selection, function(item) { item.unselect(); });
			this.selection = [];
			delete this.corner;
			this.drawer.setSelectionBox();
		}
		this.invalidate();
	},
	
	beginDragWithNewObject: function(point, object) {
		//Add a new object at position (x,y), it is being dragged
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
			var object = objects[0];
			if(object.click()) {
				this.action_recorder.dispatchAction(new Action({
					type: "SWITCH_CLICK",
					schema_id: this.model.id,
					item: object.number
				}));
				//this.drawer.invalidateRectangle(object.boundingBox());
			}
		}
		this.invalidate();
	},
	
	///////////////////////////////////////////////////////////////////////////
	// Actions that we record so that they can be undone
	
	addObject: function(type, at) {
		var action = new Action({
			schema_id: this.model.id,
			type: "ADD_GATE",
			gate_type:	type,
			position: at
		});
		this.action_recorder.dispatchAction(action);
	},
	
	deleteObject: function() {
	
	},
	
	moveObject: function(object, original_position) {
		this.action_recorder.dispatchAction(new Action({
			schema_id: 		this.model.id,
			type:			"MOVE_GATE",
			item:			object.number,
			new_position:	object.top_left,
			old_position:	original_position
		}));
	},
	
	addConnection: function(connection) {
		var action = new Action({
			schema_id: 		this.model.id,
			type:			"ADD_CONNECTION",
			input_item:		connection.input_item.number,
			input_num:		connection.input_num,
			output_item:	connection.output_item.number,
			output_num:		connection.output_num
		});
		this.action_recorder.dispatchAction(action);
	},
	
	deleteConnection: function(connection) {
	
	},
	
	deleteSelection: function() {
		if (this.selection.length > 0) {
			var connections = [];
			_.each(this.selection, function(item) {	connections = _.union(connections, item.allConnections()); });
			var actions = [];
			_.each(connections, function(connection) {
				actions.push(new Action({
					schema_id: 		this.model.id,
					type:			"REMOVE_CONNECTION",
					input_item:		connection.input_item.number,
					input_num:		connection.input_num,
					output_item:	connection.output_item.number,
					output_num:		connection.output_num
				}));
			}, this);
			_.each(this.selection, function(gate) {
				actions.push(new Action({
					schema_id: 		this.model.id,
					type:			"REMOVE_NUMBERED_GATE",
					number:			gate.number,
					gate_type:		gate.type,
					position:		gate.position()
				}));
			}, this);
			var action = new GroupedActions(actions);
			this.action_recorder.dispatchAction(action);
			this.selection = [];
		}
	}
	
});
