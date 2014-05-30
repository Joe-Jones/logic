
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
