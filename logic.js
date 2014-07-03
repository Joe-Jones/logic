/********************************************************************************************/
Pallet = Backbone.View.extend({
/********************************************************************************************/

	tag: "div",

	initialize: function() {
		
	},
	
	render: function() {
		
		var gate_list = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "SWITCH", "BULB", "INPUT", "OUTPUT"];
		
		// Create the elements
		var html = '<table>';
		for (var i = 0; i < gate_list.length; i++) {
			html += '<tr><td><canvas width="30" height="30" draggable="true" id="pallet-item-' + String(i) + '"></canvas></td></tr>'
		}
		html += "</table>";
		this.$el.html(html);
		
		//
		function makeEventListener(type) {
			return function (event) {
				event.dataTransfer.setData("Text", type);
				event.dataTransfer.effectAllowed = 'move'; // only allow moves, what the fuck does that even mean?
			}
		}
		for (var i = 0; i < gate_list.length; i++) {
			var canvas = this.$("#pallet-item-" + String(i))[0];
			var type = gate_list[i];
			this.drawGate(canvas, type);
			canvas.addEventListener("dragstart", makeEventListener(type), true);
		}
	},
	
	drawGate: function(canvas, type) {
		var ctx = canvas.getContext("2d");
		ctx.scale(canvas.width, canvas.height);
		ctx.translate(0.5, 0.5);
		ctx.rotate(Math.PI / 2);
		ctx.translate(-0.5, -0.5);
		var gate = makeGate(type)
		gate.draw(ctx);
	}
	
});

/********************************************************************************************/
var MainView = JakeKit.Stack.extend({
/********************************************************************************************/
	
	initialize: function() {
		JakeKit.Stack.prototype.initialize.call(this);
		
		_.bindAll(this, "setProject");
		
		// Create the user interface
		
		var menu = new JakeKit.w2toolbar([
				{ type: "menu", id: "project_menu", caption: "Project", items: [
						{ text: "New", id: "new_project" },
						{ text: "Rename", id: "rename_project" },
						{ text: "Open", id: "open_project" },
						{ text: "Save" }
				]},
				{ type: "menu", id: "schema_menu", caption: "Schema", items: [
						{ text: "New", id: "new_schema"},
						{ text: "Rename", id: "rename_schema" }]}]);
						
		this.listenTo(menu, "new_project", this.newProject);
		this.listenTo(menu, "open_project", this.showOpenProjectWindow);
		this.listenTo(menu, "rename_project", this.showRenameProjectWindow);
		this.listenTo(menu, "new_schema", this.newSchema);
		this.listenTo(menu, "rename_schema", this.showRenameSchemaWindow);
		
		var pallet = new Pallet();
		
		this.project_view = new ProjectView();
	
		var hbox = new JakeKit.HBox();
		
		hbox.addChild(pallet);
		hbox.addChild(this.project_view);
		
		this.main_window = new JakeKit.VBox();
		
		this.main_window.addChild(menu);
		this.main_window.addChild(hbox);
		
		this.addChild(this.main_window);
		this.makeActive(this.main_window);
		
		// Load data
		
		this.config = new Config({id: 1});
		
		var that = this;
		this.config.fetch({
			success: function() {
				that.openProject(that.config.get("active_project"));
			},
			error: function(config, error_text) {
				if (error_text == "Not Found") {
					// This is not an error, we are being run for the first time, need to create the config object.
					that.newProject();
				}
		}});
	
	},
	
	newProject: function() {
		project = new Project({
			cdate: Date(),
			mdate: Date(),
			adate: Date(),
			name: "New Project",
			open_tabs: []
		});
		project.save({}, { success: this.setProject	});
	},
	
	openProject: function(project_id) {
		var project = new Project({ id: project_id });
		project.fetch({
			success: this.setProject
		});
	},
	
	setProject: function(project) {
		this.activeProject = project;
		this.config.save({ active_project: project.id });
		this.project_view.setProject(project);
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
		
		this.project_list = new ProjectList();
		var that = this;
		this.project_list.fetch({success: function() {
			var records = that.project_list.toJSON();
			_.each(records, function(record) {
				record.recid = record.id;
			});
			that.grid.add(records);
		}});
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
		
		
	},
	
	showRenameProjectWindow: function() {
	
		var that = this;
	
		var RenameWindow = Backbone.View.extend({
		
			initialize: function() {
			},
			
			render: function() {
				this.$el.html('<input type="text"></input><button id="save_button">Save</button><button id="cancel_button">Cancel</button>');
				this.$("#cancel_button").on("click", function() {
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
		this.project_view.newTab();
	},
	
	showRenameSchemaWindow: function() {
		
		var that = this;
	
		var RenameWindow = Backbone.View.extend({
		
			initialize: function(model) {
				this.model = model;
			},
			
			render: function() {
				this.$el.html('<input type="text" value="' + _.escape(this.model.get("name")) + '">' +
							  '<button id="save_button">Save</button><button id="cancel_button">Cancel</button>');
				this.$("#cancel_button").on("click", function() {
					that.removeChild(that.rename_window);
					delete that.rename_window;
					that.makeActive(that.main_window);
				});
				var rename_window = this;
				this.$("#save_button").on("click", function() {
					rename_window.model.set("name", rename_window.$("input")[0].value);
					rename_window.model.save();
					that.removeChild(that.rename_window);
					delete that.rename_window;
					that.makeActive(that.main_window);
				});
					
			},
			
			_resized: function() {}
		
		});
		
		this.rename_window = new RenameWindow(this.project_view.activeSchema());
		this.addChild(this.rename_window);
		this.makeActive(this.rename_window);
		
	}
		
});
	
var body;
$(document).ready(function() {
	body = new JakeKit.Wrapper($('body'));
	var main_view = new MainView();
	body.setChild(main_view);
});
