"use strict";

var ProjectView = JakeKit.HBox.extend({
	
	initialize: function(project) {
		JakeKit.HBox.prototype.initialize.call(this);
		this.project = project;
		_.bindAll(this, "openTab", "schemaNameChanged", "selectTab", "deleteSelection");
		
		this.sidebar = new Sidebar(project, this);
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
		
		this.interval_id = setInterval(function(project_view) {
			var schema_model = project_view.project.getSchema(project_view.project.selectedTab());
			schema_model.logic_system.run(100);
			project_view.activeView().doDraw();
		}, 100, this);
		
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
		html += '<span class="button" id="new-schema">New Schematic</span><hr>';
		html += 'Schematic Name<br>';
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
		
		this.$("#new-schema").click(function() {
			that.project.dispatchAction(new Action({type: "ADD_SCHEMA"}));
		});
	}

});

var picker_menu = [
	{ text: "Project", name: "projectPicked"},
	{ text: "Pallet", name: "palletPicked"},
	{ text: "Components", name: "componentsPicked"},
	{ text: "Edit", name: "editPicked"},
	{ text: "Schematic", name: "schemaDetailsPicked" },
	{ text: "About Digital Schematic", name: "aboutPicked" }
];

var Picker = Backbone.View.extend({

	className: "picker",
	
	initialize: function(none, sidebar) {
		this.sidebar = sidebar;
	},
	
	render: function() {
		var html = '';
		_.each(picker_menu, function(menu_item) {
			html += '<div id="' + menu_item.name + '">' + menu_item.text + '</div>';
		}, this);
		this.$el.html(html);
		_.each(picker_menu, function(menu_item) {
			this.$("#" + menu_item.name).click(this.sidebar[menu_item.name]);
		}, this);
	},
	
	showSelection: function(name) {
		_.each(picker_menu, function(menu_item) {
			var item_name = menu_item.name;
			if (item_name == name) {
				this.$("#" + item_name).addClass("selected");
			} else {
				this.$("#" + item_name).removeClass("selected");
			}
		}, this);
	}

});

var Sidebar = Backbone.View.extend({

	className: "sidebar",

	initialize: function(project, project_view) {
		this.project = project;
		this.project_view = project_view;
		_.bindAll(this, "palletPicked", "componentsPicked", "schemaDetailsPicked", "aboutPicked", "projectPicked", "editPicked");
		this.listenTo(this.project, "newSchema", this.newSchema);
		this.listenTo(this.project, "schemaNameChanged", this.schemaNameChanged);
		this.picker = new Picker({}, this);
	},
	
	editPicked: function() {
		if (this.current_selection != 'edit') {
			this.view = new EditBox({}, this.project_view);
			this.setContent(this.view);
			this.current_selection = "edit";
			this.picker.showSelection("editPicked");
		}
	},
	
	projectPicked: function() {
		if (this.current_selection != 'project') {
			this.view = new ProjectBox(this.project);
			this.setContent(this.view);
			this.current_selection = "project";
			this.picker.showSelection("projectPicked");
		}
	},
	
	palletPicked: function() {
		if (this.current_selection != "pallet") {
			this.view = new Pallet();
			this.setContent(this.view);
			this.current_selection = "pallet";
			this.picker.showSelection("palletPicked");
		}
	},
	
	componentsPicked: function() {
		if (this.current_selection != "components") {
			this.view = new ComponentList(this.project);
			this.setContent(this.view);
			this.current_selection = "components";
			this.picker.showSelection("componentsPicked");
		}
	},
	
	schemaDetailsPicked: function() {
		if (this.current_selection != "schema_details") {
			this.view = new SchemaDetailsView({}, this.project);
			this.setContent(this.view);
			this.current_selection = "schema_details";
			this.picker.showSelection("schemaDetailsPicked");
		}
	},
	
	aboutPicked: function() {
		if (this.current_selection != "about") {
			this.view = new AboutBox();
			this.setContent(this.view);
			this.current_selection = "about";
			this.picker.showSelection("aboutPicked");
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
		this.picker.showSelection("palletPicked");
	}
	
});

var ProjectBox = Backbone.View.extend({
	
	initialize: function(project) {
		this.project = project;
		this.mode = "project";
	},
	
	render: function() {
		this.$el.empty();
		if (this.mode == "project") {
			var html = '<table><tr><td><span class="button" id="new-project">New Project</span>'
			html += '<span class="button" id="open-project">Open Project</span><hr>';
			
			// get the project name
			var main_view = this.project.main_view;
			var database = this.project.main_view.database;
			var project_list = database.getProjectList();
			var project_id = database.getConfig("active_project");
			var project_record;
			project_list.each(function(pr) {
				if (pr.get("project_id") == project_id) {
					project_record = pr;
				}
			});
			var database_name = project_record.get("name");
			
			html += 'Project Name<br><input id="project-name" type="text" value="' + _.escape(project_record.get("name")) + '"></input>'
			this.$el.html(html);
		
			this.$("#new-project").click(main_view.newProject);
			var project_box = this;
			this.$("#open-project").click(function() {
				project_box.mode = "open-project";
				project_box.render();
			});
			this.$("#project-name").change(function() {
				project_record.set("name", project_box.$("#project-name")[0].value);
				project_record.save();
			})
		} else {
			var main_view = this.project.main_view;
			var database = this.project.main_view.database;
			var project_list = database.getProjectList();
			var records = project_list.toJSON();
			this.$el.html("<ul></ul>");
			_.each(records, function(project_record) {
				var id = _.uniqueId();
				this.$("ul").append('<li id="' + id + '">' + _.escape(project_record.name) + '</li');
				this.$("#" + id).click(function() {
					main_view.openProject(project_record.project_id);
				});
			}, this);
		}
	}
	
});

var EditBox = Backbone.View.extend({

	initialize: function(none, project_view) {
		this.project_view = project_view;
	},

	render: function() {
		this.$el.html('<table><tr><td><span class="button" id="delete">Delete</span></td></tr></table>');
		this.$("#delete").click(this.project_view.deleteSelection);
	}
	
});

var AboutBox = Backbone.View.extend({
	
	render: function() {
		var html = '<p>This is program for the <a href="http://en.wikipedia.org/wiki/Schematic_capture">schematic capture</a> and <a href="http://en.wikipedia.org/wiki/Electronic_circuit_simulation">simulation<a> of digital electronic circuits built out of <a href="http://en.wikipedia.org/wiki/Logic_gate">logic gates<\a>.</p>';
		html += '<p>This software is a toy. It may be useful for educational purposes but it is certainly not a tool suitable for professional engineers and probably not engineering students either. You will hopefully have a lot of fun playing with it though.</p>';
		html += '<p>In it&apos;s current state this software is experimental, data loss is almost guaranteed. The author is not going to help you recover lost schematics.</p>';
		html += '<p>This software was created by Joe Jones, the source code is available on git hub <a href="https://github.com/Joe-Jones/logic">https://github.com/Joe-Jones/logic</a> and can be copied under the terms of the MIT license.</p>';
		this.$el.html(html);
	}

})
