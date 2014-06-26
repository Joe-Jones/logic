
JakeKit = {};

(function() {

	JakeKit.Wrapper = Backbone.View.extend({
		
		initialize: function(element) {
			this.$el = element;
			_.bindAll(this, "_resized");
			window.addEventListener('resize', this._resized, false);
		},
		
		render: function() {
			return this;
		},
		
		setChild: function(child) {
			this.child = child;
			this.$el.empty()
			this.$el.append(this.child.$el);
			this.child.render();
			this._resized();
		},
		
		_resized: function() {
			if (_.isObject(this.child) && _.isFunction(this.child._resized)) {
				this.child._resized();
			}
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
		},
		
		_resized: function() {
			var height = this.$el.height();
			var last_index = this._children.length - 1;
			_.each(this._children, function(child, index) {
				if (index != last_index) {
					height -= child.$el.height();
				} else {
					child.$el.height(height);
				}
				if (_.isFunction(child._resized)) {
					child._resized();
				}
			});
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
		},
		
		_resized: function() {
			var width = this.$el.width();
			var last_index = this._children.length - 1;
			_.each(this._children, function(child, index) {
				if (index != last_index) {
					width -= child.$el.width();
				} else {
					child.$el.width(width);
				}
				if (_.isFunction(child._resized)) {
					child._resized();
				}
			});
		}
		
	});
	
	JakeKit.Stack = Backbone.View.extend({
		
		className: 'Jake-Kit-Layout Jake-Kit-Stack',
		
		initialize: function() {
			this._children = {};
			this._vivified = false;
		},                             
		
		render: function() {
			var that = this;
			this._vivified = true;
			_.each(this._children, function(child) {
				that._addChild(child);
			});
			if (this._active_child) {
				this.makeActive(this._active_child);
			}
			this._resized();
		},
		
		_resized: function() {
			if (this._active_child) {
				var view = this._active_child
				var $el = view.$el;
				$el.height(this.$el.height());
				$el.width(this.$el.width());
				view._resized();
			}
		},
		
		addChild: function(child) {
			var new_child = { view: child, id: _.uniqueId("JakeKit_Stack") };
			this._children[child.cid] = new_child;
			if (this._vivified) {
				this._addChild(new_child);
			}
		},
		
		_addChild: function(child) {
			this.$el.append(child.view.$el);
			child.view.render();
			child.view.$el.hide();
		},
		
		makeActive: function(child) {
			if (this._vivified) {
				if (this._active_child) {
					this._active_child.$el.hide();
				}
				this._children[child.cid].view.$el.show();
				this._active_child = child;
				this._resized();
			} else {
				this._active_child = child;
			}
		},
		
		removeChild: function(child) {
			delete this._children[child.cid];
			if (this._active_child === child) {
				this._active_child = false;
			}
			if (this._vivified) {
				child.$el.detach();
			}
		}
			
	});
	
	JakeKit.w2toolbar = Backbone.View.extend({
	
		tag: 'div',
		
		className: '.Jake-Kit-Layout',
		
		initialize: function(template) {
			this.template = template;
			this.name = _.uniqueId("JakeKit_w2toolbar");
		},
		
		render: function() {
			var that = this;
			this.$el.html("<div>");
			this.$("div").w2toolbar({ name: this.name, items: this.template});
			w2ui[this.name].on("click", function(event) {
				if (_.isObject(event.subItem)) {
					that.trigger(event.subItem.id);
				} else {
					that.trigger(event.target);
				}
			});
		}
		
	});
	
	JakeKit.w2tabs = Backbone.View.extend({
		
		className: 'Jake-Kit-Layout',
		
		initialize: function() {
			this.name = _.uniqueId("JakeKit_w2tabs");
			this._tabs = [];
			this._vivified = false;
		},
		
		render: function() {
			var that = this;
			this.$el.html("<div>");;
			this.$("div").w2tabs({ 
				name: this.name,
				onClick: function(event) {
					var id = event.target;
					if (id != that._active_tab) {
						that._active_tab = id;
						that.trigger("tabChanged", id);
					}
				}
			});
			this._vivified = true;
			_.each(this._tabs, function(tab) {
				that._addTab(tab);
			});
			if (this._active_tab) {
				this.makeActive(this._active_tab);
			}
		},
		
		_resized: function() {
			
		},
		
		addTab: function(id, caption) {
			var new_tab = { id: id, caption: caption };
			this._tabs.push(new_tab);
			if (this._vivified) {
				this._addTab(new_tab);
			}
		},
		
		_addTab: function(tab) {
			w2ui[this.name].add({ id: tab.id, caption: tab.caption});
		},
		
		makeActive: function(id) {
			if (this._vivified) {
				w2ui[this.name].select(id);
			}
			this._active_tab = id;
		},
		
		removeTab(id) {
			w2ui[this.name].
		}
		
	});
	
	JakeKit.w2tabstack = JakeKit.VBox.extend({
		
		initialize: function() {
			JakeKit.VBox.prototype.initialize.call(this);
			this._tabs = new JakeKit.w2tabs();
			JakeKit.VBox.prototype.addChild.call(this, this._tabs);
			this._stack = new JakeKit.Stack();
			JakeKit.VBox.prototype.addChild.call(this, this._stack);
			this._views = {};
			this.listenTo(this._tabs, "tabChanged", this._tabChanged);
		},
		
		addChild: function(view, caption) {
			this._views[view.cid] = view;
			this._tabs.addTab(view.cid, caption);
			this._stack.addChild(view);
		},
		
		makeActive: function(view) {
			this._tabs.makeActive(view.cid);
			this._stack.makeActive(view);
		},
		
		_tabChanged: function(id) {
			this._stack.makeActive(this._views[id]);
		}
		
	});
	
	JakeKit.w2popup = Backbone.View.extend({
	
		initialize: function(template) {
			this._name = _.uniqueId("JakeKit_w2popup");
			if (_.isObject(template)) {
				this._template = template;
			} else {
				this._template = {};
			}
			this._template.body = "<div class=\"Jake-Kit-Layout\" style=\"width: 100%; height: 350px;\" id=\"" + this._name + "\"></div>";
			//this._template.name = this._name;
			this.vivified = false;
		},
		
		render: function() {
			w2popup.open(this._template);
			this.$el = $("#" + this._name);
			this._vivfied = true;
			this._setChild();
		},
		
		setChild: function(child) {
			this._child = child;
			if (this._vivified) {
				this._setChild();
			}
		},
		
		_setChild: function() {
			this.$el.empty()
			this.$el.append(this._child.$el);
			this._child.render();
			this._resized();
		},
		
		_resized: function() {
			if (_.isObject(this._child)) {
				this._child._resized();
			}
		}
		
	});
	
	JakeKit.w2grid = Backbone.View.extend({
	
		initialize: function(template) {
			this._name = _.uniqueId("JakeKit_w2grid");
			this._options = {
				name: this._name
			};
			_.extend(this._options, _.pick(template, "columns", "records"));
		},
		
		render: function() {
			this.$el.html("<div>");
			this.$el.w2grid(this._options);
			var that = this;
			w2ui[this._name].on('click', function(event) {
				that.trigger('click', event);
			});
		},
		
		_resized: function() {
			w2ui[this._name].resize();
		},
		
		add: function() {
			w2ui[this._name].add.apply(w2ui[this._name], arguments);
		},
		
		destroy: function() {
			w2ui[this._name].destroy();
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
		},
			
		render: function() {
			this.$el.html('<canvas class="Jake-Kit-Layout ">');
			this.$canvas = this.$("canvas");
			this.canvas = this.$canvas[0];
			this.ctx = this.canvas.getContext("2d");
			
			this._canvas_state_stack = [{ transformation: Matrix.I(3), attributes: {} }];
			this._current_inverse = Matrix.I(3);
			
			this._resized();
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
