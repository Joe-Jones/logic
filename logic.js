"use strict";

// Create a dragstart event handler.
function makeEventListener(type) {
	return function (event) {
		event.dataTransfer.setData("Text", type);
		event.dataTransfer.effectAllowed = 'move'; // only allow moves, what the fuck does that even mean?
	}
}

// indexedDB.deleteDatabase("logic");
/********************************************************************************************/
var Pallet = Backbone.View.extend({
/********************************************************************************************/

	tag: "div",

	initialize: function() {
		
	},
	
	render: function() {
		
		var gate_list = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "SWITCH", "BULB", "INPUT", "OUTPUT"];
		
		// Create the elements
		var html = '<span>';
		for (var i = 0; i < gate_list.length; i++) {
			var width = 30;
			var height = 30;
			if (gate_info[gate_list[i]]) {
				width *= gate_info[gate_list[i]].size.height;
				height *= gate_info[gate_list[i]].size.width;
			}
			html += '<canvas width="' + width + '" height="' + height +'" draggable="true" id="pallet-item-' + String(i) + '"></canvas>'
		}
		html += "</span>";
		this.$el.html(html);
		
		for (var i = 0; i < gate_list.length; i++) {
			var canvas = this.$("#pallet-item-" + String(i))[0];
			var type = gate_list[i];
			this.drawGate(canvas, type);
			canvas.addEventListener("dragstart", makeEventListener(type), true);
		}
	},
	
	drawGate: function(canvas, type) {
		var ctx = canvas.getContext("2d");
		if (gate_info[type]) {
			ctx.scale(canvas.width / gate_info[type].size.height, canvas.height / gate_info[type].size.width);
			ctx.translate(gate_info[type].size.height - 0.5, 0.5);
		} else {
			ctx.scale(canvas.width, canvas.height);
			ctx.translate(0.5, 0.5);
		}
		ctx.rotate(Math.PI / 2);
		ctx.translate(-0.5, -0.5);
		var gate = makeGate(type)
		gate.draw(ctx);
	}
	
});

/********************************************************************************************/
var MainView = JakeKit.Stack.extend({
/********************************************************************************************/
	
	initialize: function(database) {
		this.database = database;
		JakeKit.Stack.prototype.initialize.call(this);
		
		//_.bindAll(this, "setProject"); Todo delete
		
		// Create the user interface
		
		this.menu = new JakeKit.w2toolbar([
				{ type: "menu", id: "project_menu", caption: "Project", items: [
						{ text: "New", id: "new_project" },
						{ text: "Rename", id: "rename_project" },
						{ text: "Open", id: "open_project" }
				]},
				{ type: "menu", id: "schema_menu", caption: "Schema", items: [
						{ text: "New", id: "new_schema"}]},
				{ type: "menu", id: "edit_menu", caption: "Edit", items: [
						{ text:	"Undo", id: "undo"},
						{ text: "Redo", id: "redo"},
						{ text: "Delete", id: "delete"}
				]}]);
		
		this.listenTo(this.menu, "new_project", this.newProject);
		this.listenTo(this.menu, "open_project", this.showOpenProjectWindow);
		this.listenTo(this.menu, "rename_project", this.showRenameProjectWindow);
		this.listenTo(this.menu, "new_schema", this.newSchema);
	
		this.hbox = new JakeKit.HBox();
		
		this.project_view_container = new JakeKit.HBox();
		this.hbox.addChild(this.project_view_container);
		
		this.main_window = new JakeKit.VBox();
		
		this.main_window.addChild(this.menu);
		this.main_window.addChild(this.hbox);
		
		this.addChild(this.main_window);
		this.makeActive(this.main_window);
		
		// Load data
		this.project_list = database.getProjectList();
		var active_project = this.database.getConfig("active_project");
		if (active_project) {
			this.openProject(active_project);
		} else {
			this.newProject();
		}
		
	},
	
	newProject: function() {
		var project_list = this.database.getProjectList();
		var new_project = new this.database.Project({
			cdate: Date(),
			mdate: Date(),
			adate: Date(),
			name: "New Project",
			project_id: this.database.createID()
		});
		project_list.add(new_project);
		new_project.save();
		this.openProject(new_project.get("project_id"));
	},
	
	openProject: function(project_id) {
		if (this.project_view) {
			// Todo We need to tidy up the old one
		}
		this.project = new Project(this.database.loadProjectData(project_id, true));
		this.project_view = new ProjectView(this.project);
		this.project_view.listenTo(this.menu, "undo", this.project_view.undo);
		this.project_view.listenTo(this.menu, "redo", this.project_view.redo);
		this.project_view.listenTo(this.menu, "delete", this.project_view.deleteSelection);
		
		this.project_view_container.empty()
		this.project_view_container.addChild(this.project_view);
		// Todo this was never meant to be needed outside of the toolkit :-(
		if (this.project_view_container._vivified) {
			this.project_view_container._resized();
		}
		
		this.database.setConfig("active_project", project_id);
	},
	
	showOpenProjectWindow: function() {
		this.grid = new JakeKit.w2grid({
			name: "open_project_grid",
			columns: [
				{ field: 'recid', caption: 'ID', size: '50px', sortable: true, attr: 'align=center' },
				{ field: 'name', caption: 'Project Name', size: '30%', sortable: true, resizable: true },
				{ field: 'date_modified', caption: 'Last Modified', size: '30%', sortable: true, resizable: true },
				{ field: 'date_created', caption: 'Created', size: '40%', resizable: true },
			]
		});
		
		//var popup = new JakeKit.w2popup();
		//popup.setChild(grid);
		//popup.render();
		
		this.addChild(this.grid);
		this.makeActive(this.grid);
		
		this.project_list = this.database.getProjectList();
		var records = this.project_list.toJSON();
		_.each(records, function(record) {
			record.recid = record.project_id;
		});
		this.grid.add(records);
		this.listenTo(this.grid, "click", this.ProjectPicked);

	},
	
	ProjectPicked: function(event) {
		var project_id = event.recid;
		
		// Remove open dialog from the display
		this.grid.destroy();
		this.removeChild(this.grid);
		this.stopListening(this.grid);
		delete this.grid;
		
		this.makeActive(this.main_window);
		
		// Now load the Project
		this.openProject(project_id);
	},
	
	showRenameProjectWindow: function() {
	
		var that = this;
		
		var project_list = this.database.getProjectList();
		var project_id = this.database.getConfig("active_project");
		var project_record;
		project_list.each(function(pr) {
			if (pr.get("project_id") == project_id) {
				project_record = pr;
			}
		});
	
		var RenameWindow = Backbone.View.extend({
		
			initialize: function() {
			},
			
			render: function() {
				this.$el.html('<input type="text" value="' + _.escape(project_record.get("name")) + '"></input><button id="save_button">Save</button><button id="cancel_button">Cancel</button>');
				this.$("#cancel_button").on("click", function() {
					that.removeChild(that.rename_window);
					delete that.rename_window;
					that.makeActive(that.main_window);
				});
				var rename_window = this;
				this.$("#save_button").on("click", function() {
					project_record.set("name", rename_window.$("input")[0].value);
					project_record.save();
					that.removeChild(that.rename_window);
					delete that.rename_window;
					that.makeActive(that.main_window);
				});
			}
		
		});
		
		this.rename_window = new RenameWindow();
		this.addChild(this.rename_window);
		this.makeActive(this.rename_window);
	
	},
	
	newSchema: function() {
		this.project.dispatchAction(new Action({type: "ADD_SCHEMA"}));
	}
		
});
	
var body;
$(document).ready(function() {
	getDatabase("logic").done(function(database) {
		body = new JakeKit.Wrapper($('body'));
		var main_view = new MainView(database);
		body.setChild(main_view);
	});
});
