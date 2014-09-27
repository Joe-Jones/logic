"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function(project) {
		JakeKit.HBox.prototype.initialize.call(this);
		this.project = project;
		
		this.components = new ComponentList();
		this.addChild(this.components);
		
		this.tabstack = new JakeKit.w2tabstack();
		this.addChild(this.tabstack);
		this.views = {};
		this.open_tabs = this.project.project_data.getData("open_tabs");
		
		if (this.open_tabs) {
			_each(this.open_tabs, function(tab_id) {
				this.openTab(this.project.getSchema(tab_id));
			}, this);
			var selected_tab = this.project.project_data.getData("selected_tab");
			// Todo, Need to remember which tab was selected.
		} else {
			//	This is how we tell we're in a new project.
			this.open_tabs = [];
			this.openTab(this.project.newSchema());
			this.selectTab(_.values(this.views)[0]);
		}
		
		_.bindAll(this, "openTab", "schemaNameChanged");
		this.listenTo(this.tabstack, "viewSelected", this.viewSelected);
		
	},
	
	getSchema: function(id) {
		return this.schemas.get(id);
	},
	
	openTab: function(model) {
		var new_view = new SchemaView(model, this.project);
		this.views[model.id] = new_view;
		this.tabstack.addChild(new_view, "a schema"); // Todo need to reimplement names for the tabs
		
		if (! _.contains(this.open_tabs, model.id)) {
			this.open_tabs.push(model.id);
			this.project.project_data.getData("open_tabs", this.open_tabs);
		}
	},
	
	selectTab: function(view) {
		this.project.project_data.setData("selected_tab", view.model.id);
		this.tabstack.makeActive(view);
	},
	
	viewSelected: function(view) {
		this.project.project_data.setData("selected_tab", view.model.id);
	},
	
	activeSchema: function() {
		return this.activeView().schema;
	},
	
	schemaNameChanged: function(schema) {
		this.tabstack.setCaption(this.views[schema.id], schema.get("name"));
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
