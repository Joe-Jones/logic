/********************************************************************************************/
function SchemaView(model)
/********************************************************************************************/
{
	this.model = model;
	this.dragged_object = null;
	this.drawing_area = BoxFromPointAndSize(new Point(0, 0), {width: 30, height: 30 }); 
	this.scale = 30;
	this.origin = new Point(0, 0);
	this.drawer = new SchemaDrawer(this.model, this.scale, this.drawing_area);
	this.current_hot_point = null;
	this.new_connection = null;
	this.model.drawer = this.drawer;
}

SchemaView.prototype.setContext = function (ctx) {
	this.ctx = ctx;
	this.drawer.setContext(ctx);
};

SchemaView.prototype.setScale = function(scale) {
	this.scale = scale;
	this.drawer.setScale(scale);
	this.drawer.clear();
	this.drawer.draw();
};

SchemaView.prototype.setDrawingArea = function(drawing_area) {
	this.drawing_area = drawing_area;
	this.drawer.setDrawingArea(drawing_area);
	this.drawer.invalidateRectangle(drawing_area);
	this.drawer.draw();
};

SchemaView.prototype.beginDrag = function(point) {
	if (this.current_hot_point) { // We are we creating a connection.
		this.drawer.removeHighlight(this.current_hot_point.position);
		this.drawer.draw();
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
};

SchemaView.prototype.continueDrag = function(point) {
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

SchemaView.prototype.endDrag = function(point) {
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

SchemaView.prototype.cancelDrag = function() {
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

SchemaView.prototype.beginDragWithNewObject = function(point, object) {
	//Add a new object at position (x,y), it is being dragged
};

SchemaView.prototype.addObject = function(type, at) {
	var object = makeGate(type);
	this.model.add(object);
	object.setPosition(at);
	this.drawer.invalidateRectangle(object.boundingBox());
	this.drawer.draw();
};

SchemaView.prototype.updateHighlighting = function(hot_point) {
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
SchemaView.prototype.mouseOver = function(position) {
	var hot_point = this.model.hotPoint(position);
	this.updateHighlighting(hot_point);
	this.drawer.draw();
};

SchemaView.prototype.click = function(position) {
	var objects = this.model.hitTest(position);
	if (objects.length > 0) {
		object = objects[0];
		if(object.click()) {
			this.drawer.invalidateRectangle(object.boundingBox());
		}
	}
	this.drawer.draw();
};

