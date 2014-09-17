"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function() {
		JakeKit.HBox.prototype.initialize.call(this);
		
		this.components = new ComponentList();
		this.addChild(this.components);
		
		this.tabstack = new JakeKit.w2tabstack();
		this.addChild(this.tabstack);
		this.views = {};
		this.history = [];
		this.history_position = 0;
		_.bindAll(this, "openTab", "schemaNameChanged");
		this.listenTo(this.tabstack, "viewSelected", this.viewSelected);
	},
	
	getSchema: function(id) {
		return this.schemas.get(id);
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
				// Render the components list
				that.components.collection = that.schemas;
				that.components.render();
				
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
			contains:			{},
			contains_recursive:	[],
			name:				"New Schema"
		});
		new_schema.save({}, { success: this.openTab });
	},
	
	openTab: function(schema) {
		var new_view = new SchemaView(schema, this, this);
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
	},

});

/*************************************************************************************
	Template Manager.

	These methods go together and are used to manage templates and their dependences.

	A note on terminology, mainly we are referring to the ids, in fact every method here that
	takes an argument, that argument is an id. The words view, schema, and template are
	interchangeable when talking about ids. This is because there is a one to one relationship
	between views, schemas and templates and they all use the same id.

*************************************************************************************/

function TemplateManager(data) {
	if (_.isObject(data)) {
		_.extend(this, data);
	} else {
		this.templates = {};
		this.contains = {};
	}
	this.models = {};
}

TemplateManager.prototype = {

	/*
		Returns a list of all the components included directly in the schema with ID id.
	*/

	allContainedBy: function(id) {
		return _.keys(this.contains[id]); 
	}
	
	/*
		Return a list of all schemas which directly include the schema with ID id.
	*/
	
	allContaining: function(id) {
		return _.filter(_.keys(this.contains), function(k) { return _.contains(_.keys(this.contains[k]) id); }, this);
	}

	rebuildNeededTemplates: function(id) {
		_.each(this.allContainedBy(id), function(containd) {
			this.rebuildTemplate(containd);
		}, this);
	},

	/*
		if it needs to be, rebuild template with ID id. First rebuilding any templates it depends on.
	*/
	
	rebuildTemplate: function(id) { //Todo this looks like it needs rewritten.
		if (!this.templates[id]) {
			this.rebuildNeededTemplates(id);
			this.templates[id] = this.models[id].saveAsTemplate();
		}
	},

	/* Public methods below this line */
	
	/* 
		the template manager needs to be able to find a model for every template it is managing.
	*/
	
	addModel: function(model) {
		this.models[model.id] = model;
	},
	
	/*
		Called by a view, using its own schema id to let the template manager know it's template is invalid.
	*/
	
	templateInvalid: function(id) {
		delete this.templates[id];
		_.each(this.allConatining(id), function(containing_id) {
			this.templateInvalid(containing_id);
		}, this);
	},

	/*
		Called by a view to get the template for a different schema.
	*/
	
	getTemplate: function(id) {
		this.rebuildTemplate(id);
		return this.templates[id];
	},
	
	/*
		Called to check we would not create a cyclic dependency by adding added to to.
	*/
	
	validToAdd: function(added, to) {
		/*
			we need to check that added does not in some way contain to
		*/
		added_contains = _.keys(this.contains[added]);
		return added != to && !_.contains(added_contains, to) && _.every(added_contains, function(id) { return this.validToAdd(id, to); }, this);
	},

	/*
		Called to let the template manager know that a copy template with id added has been added to schema with id to.
	*/
	
	templateAdded: function(added, to) {
		var contains = this.contains[to];
		if (contained[added]) {
			contained[added] ++;
		} else {
			contained[added] = 1;
		}
	},
	
	/*
		Called to let the template manager that one of the copies of removed that from contained has
		been removed.
	*/
	
	templateRemoved: function(removed, from) {
		var contains = this.contains[from];
		if (contained[removed] > 1) {
			contained[removed]--;
		} else {
			delete contained[removed];
		}
	}

};

var ComponentView = Backbone.View.extend({

	attributes: { draggable: "true" },

	render: function() {
		var html = this.model.get("name");
		this.$el.html(html);
		
		this.el.addEventListener("dragstart", makeEventListener("COMPONENT:" + this.model.id), true);
		
		return this;
	}

});

var ComponentList = Backbone.View.extend({

	className: "components",

	render: function() {
		if (this.collection) {
			this.collection.each(function(component) {
				var component_view = new ComponentView({ model: component });
				this.$el.append(component_view.render().el);
			}, this);
		}
	}
	
});
