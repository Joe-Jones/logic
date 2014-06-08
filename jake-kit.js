
JakeKit = {};

(function() {

	JakeKit.Wrapper = Backbone.View.extend({
		
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
	
	JakeKit.VBox = Backbone.View.extend({
			
		className: 'Jake-Kit-Layout Jake-Kit-VBox',
			
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
	
	JakeKit.HBox = Backbone.View.extend({
			
		className: 'Jake-Kit-Layout Jake-Kit-HBox',
			
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
	
	JakeKit.W2Toolbar = Backbone.View.extend({
	
		tag: 'div',
		
		initialize: function(template) {
			this.template = template;
			this.name = _.uniqueId("JakeKit_W2Toolbar");
		},
		
		render: function() {
			var that = this;
			this.$el.w2toolbar({ name: this.name, items: this.template});
			w2ui[this.name].on("click", function(event) {
				that.trigger(event.target);	
			});
		}
	
	});
	
	var pointFromEvent = function(event) {
		// This code is bases on the snipit found in https://bugzilla.mozilla.org/show_bug.cgi?id=122665#c3
		// There is some more background in https://bugzilla.mozilla.org/show_bug.cgi?id=69787
		
		// Get the position out of the event
		var event_x, event_y;
		if (event.type == "drop") {
			event_x = event.originalEvent.pageX;
			event_y = event.originalEvent.pageY;
		} else {
			event_x = event.pageX;
			event_y = event.pageY;
		}
		
		var element = event.target;
		var offset_x = 0;
		var offset_y = 0;
		while (element.offsetParent) {
			offset_x += element.offsetLeft;
			offset_y += element.offsetTop;
			element = element.offsetParent;
		}
		var x = event_x - offset_x;
		var y = event_y - offset_y;
		return($V([x, y, 1]));
	};
		
	var wrapMouseHandler = function(f, object) {
		return function(event) {
			var p = pointFromEvent(event);
			p = object._current_inverse.multiply(p);
			var result = f.call(object, event, p);
			object.doDraw();
		};
	};
	
	/*var Box = function(top_left, width, height) {
		this.top_left, 
	}*/
	
	JakeKit.Canvas = Backbone.View.extend({
			
		className: "Jake-Kit-Layout Jake-Kit-Canvas",
		
		constructor: function() {
			var that = this;
			Backbone.View.apply(this, arguments);
			var mouse_events = {};
			_.each(_.keys(this.mouseEvents), function(key) {
				var f = that.mouseEvents[key];
				if (!_.isFunction(f)) {
					f = that[f];
				}
				f = wrapMouseHandler(f, that);
				mouse_events[key] = f;
			});
			this.delegateEvents(mouse_events);
			this._needs_drawn = false;
		},
			
		initialize: function() {
			this._vivified = false;
			_.bindAll(this, "_resized");
		},
			
		render: function() {
			this.$el.html('<canvas class="Jake-Kit-Layout ">');
			this.$canvas = this.$("canvas");
			this.canvas = this.$canvas[0];
			this.ctx = this.canvas.getContext("2d");
			
			this._canvas_state_stack = [{ transformation: Matrix.I(3), attributes: {} }];
			this._current_inverse = Matrix.I(3);
			
			this._resized();
			window.addEventListener('resize', this._resized, false);
			if (_.isFunction(this.ready)) {
				this.ready();
			}
			this.draw(this.ctx);
		},
		
		save: function() {
			this._saveCanvasAttributes();
			this._canvas_state_stack.push({ transformation: _.last(this._canvas_state_stack).transformation.dup(), attributes: {} });
			this.ctx.save();
		},
			
		restore: function() {
			this.ctx.restore();
			if (this._canvas_state_stack.length > 1) {
				this._canvas_state_stack.pop();
				this._current_inverse = _.last(this._canvas_state_stack).transformation.inv();
			}
		},
		
		scale: function(x, y) {
			this.ctx.scale(x, y);
			this._modifyMatrix($M([[x, 0, 0], [0, y, 0], [0, 0, 1]]));
		},
		
		rotate: function(angle) {
			this.ctx.rotate(angle);
			this._modifyMatrix($M([[Math.cos(angle), -Math.sin(angle), 0], [Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]]));
		},
		
		translate: function(x, y) {
			var x_, y_;
			if (_.isNumber(x)) {
				x_ = x;
				y_ = y;
			} else {
				x_ = x.elements[0];
				y_ = x.elements[1];
			}
			this.ctx.translate(x_, y_);
			this._modifyMatrix($M([[1, 0, x_], [0, 1, y_], [0, 0, 1]]));
		},
		
		transform: function(m11, m12, m21, m22, dx, dy) {
			this.ctx.transform(m11, m12, m21, m22, dx, dy);
		},
		
		setTransform: function(m11, m12, m21, m22, dx, dy) {
			this.ctx.setTransform(m11, m12, m21, m22, dx, dy);
		},
		
		_changeMatrix: function(f) {
			var new_matrix = f(_.last(this._canvas_state_stack).transformation);
			this._current_inverse = new_matrix.inv();
			_.last(this._canvas_state_stack).transformation = new_matrix;
		},
		
		_modifyMatrix: function(M) {
			var new_matrix = _.last(this._canvas_state_stack).transformation.multiply(M);
			this._current_inverse = new_matrix.inv();
			_.last(this._canvas_state_stack).transformation = new_matrix;
		},
		
		_saveCanvasAttributes: function() {
			//Todo this is where we save all the other state that is not part of the transformation.
		},
		
		_recreateCanvasState: function() {
			var that = this;
			_.each(this._canvas_state_stack, function(state, index) {
				var T = state.transformation;
				that.ctx.setTransform(T.e(1, 1), T.e(2, 1), T.e(1, 2), T.e(2, 2), T.e(1, 3), T.e(2, 3));
				// Todo, recreate all the other state here.
				if (index != that._canvas_state_stack.length - 1) {
					that._original_methods.save.call(that.ctx);
				}
			});
		},
		
		_resized: function() {
			// Save all the canvas attributes.
			this._saveCanvasAttributes();
			
			// Resize the canvas to match the containing div.
			this.canvas.width = this.$el.width();
			this.canvas.height = this.$el.height();
			
			// The canvas has lost all its state, recreate it's transformations and attributes.
			this._recreateCanvasState();
			
			this._current_inverse = _.last(this._canvas_state_stack).transformation.inv();
			
			if (_.isFunction(this.onresize)) { // I don't think this is going to be part of the API
				this.onresize();
			}
			if (_.isFunction(this.draw)) {
				this.draw(this.ctx);
			}
		},
		
		invalidate: function() {
			this._needs_redrawn = true;
		},
		
		doDraw: function() {
			if (this._needs_redrawn && _.isFunction(this.draw)) {
				this._clearScreen();
				this.draw(this.ctx);
			}
		},
		
		topLeft: function() {
			return this._current_inverse.multiply($V([0, 0, 1]));
		},
		
		topRight: function() {
			return this._current_inverse.multiply($V([this.canvas.width, 0, 1]));
		},
		
		bottomLeft: function() {
			return this._current_inverse.multiply($V([0, this.canvas.height, 1]));
		},
		
		bottomRight: function() {
			return this._current_inverse.multiply($V([this.canvas.width, this.canvas.height, 1]));
		},
		
		centre: function() {
			return this._current_inverse.multiply($V([this.canvas.width / 2, this.canvas.height / 2, 1]));
		},
		
		_clearScreen: function() {
			this._clearBoundingRect(this.topLeft(), this.topRight(), this.bottomLeft(), this.bottomRight());
		},
		
		_clearBoundingRect: function() {
			var x_min, x_max, y_min, ymax;
			x_min = x_max = y_min = y_max = NaN;
			_.each(arguments, function(point) {
				var pick = function(a, b, f) {
					if (a === NaN) {
						return b;
					} else {
						return f([a, b]);
					}
				};
				x_min = pick(x_min, point.elements[0], _.min);
				x_max = pick(x_max, point.elements[0], _.max);
				y_min = pick(y_min, point.elements[1], _.min);
				y_max = pick(y_max, point.elements[1], _.max);
			});
			this.ctx.clearRect(x_min, y_min, x_max - x_min, y_max - y_min);
		}
		
		
	});

})();
