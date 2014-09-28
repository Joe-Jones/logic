"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function(project) {
		JakeKit.HBox.prototype.initialize.call(this);
		this.project = project;
		_.bindAll(this, "openTab", "schemaNameChanged", "selectTab");
		
		this.components = new ComponentList();
		this.addChild(this.components);
		
		this.tabstack = new JakeKit.w2tabstack();
		this.addChild(this.tabstack);
		this.views = {};
		
		this.listenTo(this.project, "schemaNameChanged", this.schemaNameChanged);
		this.listenTo(this.project, "schemaOpened", this.openTab);
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
	},
	
	deleteSelection: function() {
		this.activeView().deleteSelection();
	},
	
	activeView: function() {
		return this.tabstack.activeView();
	},

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
