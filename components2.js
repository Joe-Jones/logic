
var Wrapper = Backbone.View.extend({
	
	initialize: function(element) {
		this.$el = element;
	},
	
	render: function() {
		return this;
	},
	
	setChild: function(child) {
		this.child = child;
		this.$el.empty()
		this.$el.append(this.child.$el);
		this.child.render();
	}
	
});

var VBox = Backbone.View.extend({
		
	className: 'VBox',
		
	initialize: function() {
		this._children = [];
		this._vivified = false;
	},
		
	render: function() {
		var that = this;
		_.each(this._children, function(child) {
			that.$el.append(child.$el);
			child.render();
		});
		this._vivified = true;
		return this;
	},
	
	addChild: function(child) {
		this._children.push(child);
		if (this._vivified) {
			this.$el.append(child.$el);
			child.render();
		}
	}
	
});

var Canvas = Backbone.View.extend({

		
	initialize: function() {
		this._vivified = false;
		_.bindAll(this, "_resized");
	},
		
	render: function() {
		this.$el.html("<canvas>");
		this.$canvas = this.$("canvas");
		this.canvas = this.$canvas[0];
		this.ctx = this.canvas.getContext("2d");
		this._resized();
		window.addEventListener('resize', this._resized, false);
	},
	
	_resized: function() {
		console.log(this.$el.width());
		this.canvas.width = this.$el.width();
		this.canvas.height = this.$el.height();
		if (this.onresize) {
			this.onresize();
		}
	}
	
});

var W2Toolbar = Backbone.View.extend({
	
	tag: 'div',
	
	initialize: function(template) {
		this.template = template;
	},
	
	render: function() {
		this.$el.w2toolbar(this.template);
	}

});

var W2Layout = Backbone.View.extend({
	
	initialize: function(template) {
		this.template = template;
		this.$el = $('<div style="height: 400px">');
		this._children = {};
		this._vivified = false;
	},
	
	render: function() {
		var that = this;
		this.$el.w2layout(this.template);
		this._w2Object = w2ui[this.template.name];
		_.each(this._children, function(child, panel) {
			that._vivify(panel, child);
		});
		this._vivified = true;
	},
	
	setChild: function(panel, child) {
		this._children[panel] = child;
		if (this._vivfied) {
			this._vivify(panel, child);
		}
	},
	
	_vivify: function(panel, child) {
		this._w2Object.html(panel, child.el);
		child.render();
	}
	
});

