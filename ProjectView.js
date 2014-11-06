"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function(project) {
		JakeKit.HBox.prototype.initialize.call(this);
		this.project = project;
		_.bindAll(this, "openTab", "schemaNameChanged", "selectTab");
		
		this.sidebar = new Sidebar(project);
		this.addChild(this.sidebar);
		
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
		this.sidebar.viewChanged();
	},
	
	activeSchema: function() {
		return this.activeView().id;
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
			if (this.project.isComponent(schema_id)) {
				var component_view = new ComponentView({ schema_id: schema_id, name: this.project.getSchemaName(schema_id) });
				this.$el.append(component_view.render().el);
			}
		}, this);
	}
	
});

var SchemaDetailsView = Backbone.View.extend({

	initialize: function(none, project) {
		this.project = project;
	},
	
	render: function() {
		var schema_id = this.project.selectedTab();
		var html = '<table><tr><td>';
		html += 'Schema Name<br>';
		html += '<input id="schema-name" type="text" value="' + _.escape(this.project.getSchemaName(schema_id)) + '">';
		html += '</td></tr><tr><td id="component-editor-panel"></td></tr></table>'
				
		this.$el.empty();
		this.$el.html(html)
			
		var that = this;
		this.$("#schema-name").on("change", function() {
			that.project.dispatchAction(new Action({
				type:		"RENAME_SCHEMA",
				schema:		schema_id,
				new_name:	that.$("input")[0].value,
				old_name:	that.project.getSchemaName(schema_id)
			}));
		});
		
		if (this.project.isComponent(schema_id)) {
			var component_editor = new ComponentEditor({}, schema_id, this.project);
			this.$("#component-editor-panel").append(component_editor.$el);
		}
	}

});

var Picker = Backbone.View.extend({
	
	initialize: function(none, sidebar) {
		this.sidebar = sidebar;
	},
	
	render: function() {
		var html = '<a href="#" id="pick-pallet">Pallet</a><a href="#" id="pick-components">Components</a>';
		html += '<a href="#" id="pick-schema-details">Schema Details</a>'
		this.$el.html(html);
		var sidebar = this.sidebar;
		this.$("#pick-pallet").click(this.sidebar.palletPicked);
		this.$("#pick-components").click(this.sidebar.componentsPicked);
		this.$("#pick-schema-details").click(this.sidebar.schemaDetailsPicked);
	}

});

var Sidebar = Backbone.View.extend({

	className: "sidebar",

	initialize: function(project) {
		this.project = project;
		_.bindAll(this, "newSchema", "schemaNameChanged", "palletPicked", "componentsPicked", "schemaDetailsPicked");
		this.listenTo(this.project, "newSchema", this.newSchema);
		this.listenTo(this.project, "schemaNameChanged", this.schemaNameChanged);
		this.picker = new Picker({}, this);
	},
	
	newSchema: function() {
	
	},
	
	schemaNameChanged: function() {
	
	},
	
	palletPicked: function() {
		if (this.current_selection != "pallet") {
			this.view = new Pallet();
			this.setContent(this.view);
			this.current_selection = "pallet";
		}
	},
	
	componentsPicked: function() {
		if (this.current_selection != "components") {
			this.view = new ComponentList(this.project);
			this.setContent(this.view);
			this.current_selection = "components";
		}
	},
	
	schemaDetailsPicked: function() {
		if (this.current_selection != "schema_details") {
			this.view = new SchemaDetailsView({}, this.project);
			this.setContent(this.view);
			this.current_selection = "schema_details";
		}
	},
	
	setContent: function(view) {
		var content_panel = this.$("#content-panel").empty();
		view.render();
		content_panel.append(view.$el);
	},
	
	viewChanged: function() {
		if (this.current_selection == "schema_details") {
			this.view.render();
		}
	},
	
	render: function() {
		this.$el.html('<table><tr><td id="picker-panel"></td></tr><tr><td id="content-panel"></td></tr></table>');
		this.picker.render();
		this.$("#picker-panel").append(this.picker.$el);
		this.palletPicked();
	}
	
});
