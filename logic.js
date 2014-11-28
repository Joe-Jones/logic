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
		
		_.bindAll(this, "newProject");
		
		// Create the user interface
		
		this.project_view_container = new JakeKit.HBox();
		
		this.addChild(this.project_view_container);
		this.makeActive(this.project_view_container);
		
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
	
	openProject: function(project_id, replay_to) {
		if (this.project_view) {
			clearInterval(this.project_view.interval_id);
		}
		var error_at = null;
		try {
			this.project = new Project(this.database.loadProjectData(project_id, true), this, replay_to);
		}
		catch (e) { throw(e);
			error_at = e.error_at;
		}
		
		this.project_view_container.empty()
		if (_.isNumber(error_at)) {
			var error_handler = new ErrorHandler({}, this, project_id, error_at - 1);
			this.project_view_container.addChild(error_handler);
		} else {
			this.project_view = new ProjectView(this.project);
			this.project_view_container.addChild(this.project_view);
			// Todo this was never meant to be needed outside of the toolkit :-(
			if (this.project_view_container._vivified) {
				this.project_view_container._resized();
			}
			
			this.database.setConfig("active_project", project_id);
		}
	}
	
});

var ErrorHandler = Backbone.View.extend({

	initialize: function(none, main_view, project_id, replay_to) {
		this.project_id = project_id;
		this.replay_to = replay_to;
		this.main_view = main_view;
	},
	
	render: function() {
		var html = '<div style="ErrorHandler">An error has occurred, what do you want to do<br>';
		html += '<input type="radio" name="recovery_choice" value="recover" checked>Try and recover the ';
		html += 'project. You may loose some of your most recent edits but the project will remain usable.<br>';
		html += '<input type="radio" name="recovery_choice" value="new">Forget this project for now and ';
		html += 'open a new project<br>';
		//html += '<input type="radio" name="recovery_choice" value="existing">Forget this project for now and ';
		//html += 'choose a different project to open<br>';
		html += '<button id="go" a="Go">Go</button>';
		this.$el.html(html);
		var that = this;
		this.$("#go").click(function() {
			console.log();
			switch ($("input:radio[name='recovery_choice']:checked").val()) {
			
				case "recover":
				that.main_view.openProject(that.project_id, that.replay_to);
				break;
				
				case "new":
				that.main_view.newProject();
				break;
				
				case "existing":
				
				break;
			}
		});
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
