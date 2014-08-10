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
	
	/*************************************************************************************
		Template Manager methods.
		
		These methods go together and are used to manage templates and their dependances.
		
		A note on terminology, mainly we are refering to the ids, in fact every method here that
		takes an argument, that argument is an id. The words view, schema, and template are
		interchangable when talking about ids. This is because there is a one to one relationship
		between views, schemas and templates and they all use the same id.
		
	*************************************************************************************/
	
	/*
		Getter and Setter methods to separate the rest of the Template Manager from the
		rest of the class.
	*/
	
	getContains: function(id) {
		this.getSchema(id).get("contains");
	},
	
	setContains: function(id, contains) {
		var schema = this.getSchema(id);
		schema.set("contains", contains);
		schema.save();
	},
	
	getContainsRec: function(id) {
		this.getSchema(id).get("contains_recursive");
	},
	
	setContainsRec: function(id, contains_rec) {
		var schema = this.getSchema(id);
		schema.set("contains_recursive", contains);
		schema.save();
	},
	
	allConatiningRec: function(id) {
		return _.map(this.schemas.filter(function(schema) { return _.contains(schema.get("contains_recursive"), id); }),
					function (schema) { return schema.id; });
	},
	
	allContaining: function(id) {
		return 
	}
	
	/*
		The main method for 
	*/
	calculateContainsRec: function(id) {
		var that = this;
		var contained = _.keys(this.getContains(id));
		setContainsRec(id, _.union(contained, _.union.apply(_, _.map(contained, function(contained) { return that.getContainsRec(contained); }))));
	},
	
	
	
	/* 
		Called to initialise the template manager
	*/
	loadTemplates: function() {
		var templates = new TemplateList();
		this.templates = {};
		var that = this;
		return templates.fetch({ conditions: { project_id: this.data.id } }).promise().done(function() {
			templates.forEach(function(template) {
				this.templates[template.get("schema_id")] = template;
			}, that);
		});
	},
	
	rebuildNeededTemplates: function(id) {
		_.each(this.getContains(id), function(containd) {
			this.rebuildTemplate(containd);
		}, this);
	},
	
	rebuildTemplate: function(id) {
		if (!this.templates[id].has("data")) {
		
			this.rebuildNeededTemplates(id);
			
			var template = this.templates[id];
			if (template) {
				template.set("data", this.views[id].saveAsTemplate());
			} else {
				template = new Template( { project_id: this.data.id, data: this.views[id].saveAsTemplate(), schema_id: id });
				this.templates[id] = template;
			}
			template.save();
		}
	},
	
	/* 
		Called by a view, using its own schema id to let the template manager know it's template is invalid.
	*/  
	templateInvalid: function(id) {
		var all_containing = this.allConatiningRec(id);
		_.each(all_containing, function(containing) {
			this.templates[containing].unset("data");
			this.templates[containing].save();
		}, this);
		
		each(all_containing, function(containing) {
			this.rebuildTemplate(id);
		}, this);
		
	},
	
	/* 
		Called by a view to get the template for a different schema. This is not an Asyncronos call, instead we
		are going to be very clever and make sure this never gets called when the template manager can't imediatly
		forfill the request
	*/
	getTemplate: function(id) {
		return this.templates[id].get("data");
	},
	
	/*
		Called to check we would not create a cyclic dependantcy by adding added to to.
	*/
	
	validToAdd: function(added, to) {
		return !_.contains(this.getContainsRec(to), added);
	},
	
	/*
		Called to let the template manager know that a copy template with id added has been added to schema with id to.
	*/
	templateAdded: function(added, to) {
		var contained = this.getContained(to);
		if (contained[added]) {
			contained.added ++;
			this.setContained(to, contained);
		} else {
			contained[added] = 1;
			this.setContained(to, contained);
			if (!_.contains(this.getContainedRec("to"), added)) {
				all_needing_recalculated = getAllContainingRec(to);
				_.each(getAllContainingRec(to), function(id) { //This aint going to work!!
					this.calculateContainsRec(id);
				}, this);
			}
		}
	},
	
	/*
		Called to let the template manager that one of the copies of removed that from contained has
		been removed.
	*/
	templateRemoved: function(refoved, from) {
		var contained = this.getContained(to);
	}
	
});

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
