"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function() {
		JakeKit.w2tabstack.prototype.initialize.call(this);
		this.tabstack = new JakeKit.w2tabstack();
		this.addChild(this.tabstack);
		this.views = {};
		this.schemas = {};
		this.history = [];
		this.history_position = 0;
		_.bindAll(this, "openTab", "schemaNameChanged");
		this.listenTo(this.tabstack, "viewSelected", this.viewSelected);
	},
	
	setProject: function(project) {
		var that = this;
		
		// Get rid of any existing views
		_.each(this.views, function(view, id) {
			this.removeChild(view);
		});
		this.views = {};
		
		this.data = project;
		
		this.schemas = new SchemaList();
		this.schemas.fetch({
			conditions: { project_id: this.data.id },
			success: function() {
				var open_tabs = that.data.get("open_tabs");
				if (_.size(open_tabs) == 0) {
					that.newTab();
					//need to select the tab as well
				} else {
					_.each(open_tabs, function(schema_id) {
						var schema = that.schemas.get(schema_id);
						that.openTab(schema);
					});
					var selected_tab = that.data.get("selected_tab");
					if (!selected_tab) {
						selected_tab = open_tabs[0].schema_id;
						this.data.set("selected_tab", selected_tab);
					}
					that.selectTab(that.views[selected_tab]);
				}
				that.schemas.on("change:name", that.schemaNameChanged);
			},
			error: function() {
				console.log("error");
				console.log(arguments);
			}
		});
		
	},
	
	newTab: function() {
		var new_schema = new Schema({
			project_id:			this.data.id,
			contains:			[],
			contains_recursive:	[],
			name:				"New Schema"
		});
		new_schema.save({}, { success: this.openTab });
	},
	
	openTab: function(schema) {
		var new_view = new SchemaView(schema, this);
		this.views[schema.id] = new_view;
		this.tabstack.addChild(new_view, schema.get("name"));
		
		var open_tabs = this.data.get("open_tabs");
		if (! _.contains(open_tabs, schema.id)) {
			this.data.set("open_tabs", open_tabs.concat(new_view.id));
		}
	},
	
	selectTab: function(view) {
		this.data.set("selected_tab", view.schema_data.id);
		this.data.save();
		this.tabstack.makeActive(view);
	},
	
	viewSelected: function(view) {
		this.data.set("selected_tab", view.schema_data.id);
		this.data.save();
	},
	
	activeSchema: function() {
		return this.activeView().schema;
	},
	
	schemaNameChanged: function(schema) {
		this.tabstack.setCaption(this.views[schema.id], schema.get("name"));
	},
	
	record: function(action) {
		if (this.history_position != this.history.length) { // We need to get rid of redo history
			this.history = _.first(this.history, this.history_position);
		}
		this.history.push(action);
		this.history_position++;
	},
	
	undo: function() {
		if (this.history_position > 0) {
			var last_action = this.history[this.history_position - 1];
			var undo_action = last_action.inverse();
			undo_action.doTo(this.views[undo_action.schemaID()].model);
			this.history_position--;
			
			this.views[undo_action.schemaID()].saveSchema();
		}
	},
	
	redo: function() {
		if (this.history_position < this.history.length) {
			var action = this.history[this.history_position];
			action.doTo(this.views[action.schemaID()].model);
			this.history_position++;
			
			this.views[action.schemaID()].saveSchema();
		}
	},
	
	deleteSelection: function() {
		this.activeView().deleteSelection();
	},
	
	activeView: function() {
		return this.tabstack.activeView();
	}
		
});

var ComponentView = Backbone.View.extend({

	render: function() {
		var html = "Hi you bam pots";
		this.$el.html(html);
		
		return this;
	}

});

var ComponentList = Backbone.View.extend({

	render: function() {
		this.collection.each(function(component) {
			var component_view = new ComponentView({ model: component });
			this.$el.append(component_view.render().el);
		}, this);
	}
	
});




