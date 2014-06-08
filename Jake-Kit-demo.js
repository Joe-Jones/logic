SketchPad = JakeKit.Canvas.extend({
		
	initialize: function() {
		JakeKit.Canvas.prototype.initialize.call(this);
		this.mouse_down = false;
		this.dots = [];
	},
		
	transformManager: true,
	withPoints: true,
	
	mouseEvents: {
		"mousedown"	: function(event, point) {
			this.mouse_down = true;
			this.dots.push(point);
			this.invalidate();
		},
		"mouseup"	: function(event, point) {
			this.mouse_down = false;
		},
		"mousemove"	: "mousemove"
	},
	
	mousemove: function (event, point) {
		this.dots.push(point);
		this.invalidate();
	},
	
	draw: function(ctx) {
		_.each(this.dots, function(dot) {
			ctx.fillRect(dot.elements[0], dot.elements[1], 1, 1);
		});
	},
	
	pan_left: function() {
		this.ctx.translate(5, 0);
		this.invalidate();
		this.doDraw();
	},
	
	pan_right: function() {
		this.ctx.translate(-5, 0);
		this.invalidate();
		this.doDraw();
	},
	
	pan_up: function() {
		this.ctx.translate(0, -5);
		this.invalidate();
		this.doDraw();
	},
	
	pan_down: function() {
		this.ctx.translate(0, 5);
		this.invalidate();
		this.doDraw();
	},
	
	zoom_in: function() {
		this.scale(1.1);
	},
	
	zoom_out: function() {
		this.scale(0.9);
	},
	
	scale: function(factor) {
		var centre = this.centre();
		this.ctx.translate(centre.multiply(factor));
		this.ctx.scale(factor, factor);
		this.ctx.translate($V([0, 0, 1]).subtract(centre).multiply(factor));
		this.invalidate();
		this.doDraw();
	},
	
	rotate_right: function() {
		this.rotate(0.1);
	},
	
	rotate_left: function() {
		this.rotate(-0.1);
	},
	
	rotate: function(angle) {
		var centre = this.centre();
		this.ctx.translate(centre);
		this.ctx.rotate(angle);
		this.ctx.translate($V([0, 0, 1]).subtract(centre));
		this.invalidate();
		this.doDraw();
	},
	
});

var body;
$(document).ready(function() {
	body = new JakeKit.Wrapper($('body'));
		
	var toolbar = new JakeKit.W2Toolbar([
		{ type: 'button',  caption: 'left',  id: 'left'},
		{ type: 'button',  caption: 'up',  id: 'up'},
		{ type: 'button',  caption: 'down',  id: 'down'},
		{ type: 'button',  caption: 'right',  id: 'right'},
		{ type: 'button',  caption: 'zoom in',  id: 'zoom_in'},
		{ type: 'button',  caption: 'zoom out',  id: 'zoom_out'},
		{ type: 'button',  caption: 'rotate right',  id: 'rotate_right'},
		{ type: 'button',  caption: 'rotate left',  id: 'rotate_left'}
	]);

	var sketch_pad = new SketchPad();
	sketch_pad.listenTo(toolbar, "left", sketch_pad.pan_left);
	sketch_pad.listenTo(toolbar, "right", sketch_pad.pan_right);
	sketch_pad.listenTo(toolbar, "up", sketch_pad.pan_up);
	sketch_pad.listenTo(toolbar, "down", sketch_pad.pan_down);
	sketch_pad.listenTo(toolbar, "zoom_in", sketch_pad.zoom_in);
	sketch_pad.listenTo(toolbar, "zoom_out", sketch_pad.zoom_out);
	sketch_pad.listenTo(toolbar, "rotate_right", sketch_pad.rotate_right);
	sketch_pad.listenTo(toolbar, "rotate_left", sketch_pad.rotate_left);
	
	var vbox = new JakeKit.VBox();
	
	vbox.addChild(toolbar);
	vbox.addChild(sketch_pad);
		
	body.setChild(vbox);
		
});
