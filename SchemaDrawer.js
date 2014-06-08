/********************************************************************************************/
function SchemaDrawer(model, scale, drawing_area)
/********************************************************************************************/
{
	this.model = model;
	this.drawing_area = drawing_area;
	this.highlight = null;
	this.temp_connection = null;
}

SchemaDrawer.prototype.setContext = function(ctx) {
	this.ctx = ctx;
	//this.setTransform();
};

SchemaDrawer.prototype.setScale = function(scale) {
	this.scale = scale;
	this.setTransform();
};

SchemaDrawer.prototype.setDrawingArea = function(drawing_area) {
	this.drawing_area = drawing_area;
	this.setTransform();
};

SchemaDrawer.prototype.clear = function() { // We can probably do without this now.
	// Based on code on this page http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
	this.ctx.save();
	this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
	this.ctx.restore();
}

SchemaDrawer.prototype.invalidateRectangle = function(rectangle) {
	if (!this.invalid_rectangle) {
		this.invalid_rectangle = rectangle;
	} else {
		this.invalid_rectangle = SmallestCoveringBox(this.invalid_rectangle, rectangle);
	}
};

SchemaDrawer.prototype.draw = function(exclude_item) {
	/*if (this.temp_connection) {
		this.invalidateRectangle(this.temp_connection.boundingBox().expand(0.1));
	}*/
	if (true || this.invalid_rectangle) {
		// Set up the clip path.
		/*this.ctx.save();
		this.ctx.beginPath();
		this.ctx.moveTo(this.invalid_rectangle.left, this.invalid_rectangle.top);
		this.ctx.lineTo(this.invalid_rectangle.right, this.invalid_rectangle.top);
		this.ctx.lineTo(this.invalid_rectangle.right, this.invalid_rectangle.bottom);
		this.ctx.lineTo(this.invalid_rectangle.left, this.invalid_rectangle.bottom);
		this.ctx.closePath();
		this.ctx.clip();*/
		
		// Delete the old rectangle.
		//this.ctx.clearRect(this.invalid_rectangle.left, this.invalid_rectangle.top, this.invalid_rectangle.width(), this.invalid_rectangle.height());
		
		// Draw everything that might have been deleted or damaged by the clearRect.
		var all_needing_redrawn = this.model.allObjectsTouchingBox(this.invalid_rectangle, true);
		for (var i = 0; i < all_needing_redrawn.length; i++) {
			var list_item = all_needing_redrawn[i];
			if (list_item !== exclude_item) {
				list_item.drawWrapper(this.ctx);
			}
		}
		
		if (this.highlight) {
			this.drawHighlight(this.highlight);
		}
		
		if (this.temp_connection) {
			this.temp_connection.drawWrapper(this.ctx);
		}
		
		// Drop the clip path and draw item in new position.
		//this.ctx.restore();
		
		this.invalid_rectangle = null;
	}
};

SchemaDrawer.prototype.invalidateItem = function(item) {
	this.invalidateRectangle(item.boundingBox());
	var connections = item.allConnections();
	for (var i = 0; i < connections.length; i++) {
		this.invalidateRectangle(connections[i].boundingBox().expand(0.1));
	}
}

SchemaDrawer.prototype.moveItem = function(item, new_position) {
	this.invalidateItem(item);
	item.setPosition(new_position);
	this.invalidateItem(item);
};

SchemaDrawer.prototype.drawHighlight = function(point) {
	this.ctx.save();
	this.ctx.globalAlpha = 0.5;
	this.ctx.strokeStyle = "red";
	this.ctx.lineWidth = 0.1;
	this.ctx.beginPath();
	this.ctx.arc(point.x, point.y, 0.1, 0, 2 * Math.PI);
	this.ctx.stroke()
	this.ctx.restore();
};


SchemaDrawer.prototype.addHighlight = function(point) {
	this.highlight = point;
	this.invalidateRectangle(BoxFromPointAndSize(point.minus(new Point(0.2, 0.2)), {width: 0.4, height: 0.4}));
};

SchemaDrawer.prototype.removeHighlight = function(point) {
	this.highlight = null;
	this.invalidateRectangle(BoxFromPointAndSize(point.minus(new Point(0.2, 0.2)), {width: 0.4, height: 0.4}));
};

SchemaDrawer.prototype.addTempConnection = function(connection) {
	this.temp_connection = connection;
};

SchemaDrawer.prototype.removeTempConnection = function() {
	this.invalidateRectangle(this.temp_connection.boundingBox().expand(0.1));
	this.temp_connection = null;
};
