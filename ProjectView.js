"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function(project) {
		JakeKit.HBox.prototype.initialize.call(this);
		this.project = project;
		_.bindAll(this, "openTab", "schemaNameChanged", "selectTab");
		
		this.components = new ComponentList(project);
		this.addChild(this.components);
		
		this.tabstack = new JakeKit.w2tabstack();
		this.addChild(this.tabstack);
		this.views = {};
		
		this.listenTo(this.project, "schemaNameChanged", this.schemaNameChanged);
		this.listenTo(this.project, "schemaOpened", this.openTab);
		this.listenTo(this.project, "newSchema", this.newSchema);
		if (this.project.noSchemas()) {
			// If there is no schema, then we'll create one.
			this.project.dispatchAction(new Action({type: "ADD_SCHEMA"}));
		} else {
			_.each(this.project.listOpenTabs(), function(tab_id) {
				this.openTab(tab_id, true);
			}, this);
			var selected_tab = this.project.selectedTab();
			if (selected_tab) {
				this.selectTab(selected_tab);
			}
		}
		
		this.listenTo(this.tabstack, "viewSelected", this.viewSelected);
		
	},
	
	getSchema: function(id) {
		return this.schemas.get(id);
	},
	
	openTab: function(schema_id, dont_select) {
		var schema = this.project.getSchema(schema_id);
		var new_view = new SchemaView(schema, this.project);
		this.views[schema.id] = new_view;
		this.tabstack.addChild(new_view, this.project.getSchemaName(schema_id));
		if (!dont_select) {
			this.selectTab(schema_id);
		}
	},
	
	newSchema: function() {
		this.components.render();
	},
	
	selectTab: function(schema_id) {
		this.tabstack.makeActive(this.views[schema_id]);
	},
	
	viewSelected: function(view) {
		this.project.dispatchAction(new Action({type: "SELECT_SCHEMA", schema: view.id}));
	},
	
	activeSchema: function() {
		return this.activeView().schema;
	},
	
	schemaNameChanged: function(schema_id) {
		this.tabstack.setCaption(this.views[schema_id], this.project.getSchemaName(schema_id));
		this.components.render();
	},
	
	deleteSelection: function() {
		this.activeView().deleteSelection();
	},
	
	activeView: function() {
		return this.tabstack.activeView();
	},
	
	undo: function() {
		this.project.dispatchAction(new Action({ type: "UNDO" }));
	},
	
	redo: function() {
		this.project.dispatchAction(new Action({ type: "REDO" }));
	},

});

var ComponentView = Backbone.View.extend({

	attributes: { draggable: "true" },
	
	initialize: function(args) {
		this.schema_id = args.schema_id;
		this.name = args.name;
	},

	render: function() {
		this.$el.html(this.name);
		this.el.addEventListener("dragstart", makeEventListener("COMPONENT:" + this.schema_id), true);
		return this;
	}

});

var ComponentList = Backbone.View.extend({

	className: "components",
	
	initialize: function(project) {
		this.project = project;
	},

	render: function() {
		this.$el.empty();
		_.each(this.project.listSchemas(), function(schema_id) {
			var component_view = new ComponentView({ schema_id: schema_id, name: this.project.getSchemaName(schema_id) });
			this.$el.append(component_view.render().el);
		}, this);
	}
	
});
