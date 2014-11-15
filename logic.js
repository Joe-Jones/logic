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
var MainView = Backbone.View.extend({
/********************************************************************************************/

	el: 'body',
	
	initialize: function(database) {
		this.database = database;
		_.bindAll(this, "newProject", "_resized");
		window.addEventListener('resize', this._resized, false);
		
		// Load data
		this.project_list = database.getProjectList();
		var active_project = this.database.getConfig("active_project");
		if (active_project) {
			this.openProject(active_project);
		} else {
			this.newProject();
		}
		
	},
	
	_resized: function() {
		if (this.project_view) {
			this.project_view.$el.width(this.$el.width());
			//this.project_view.$el.height();
			this.project_view._resized(this.$el.height());
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
			clearInterval(this.project_view.interval_id);
		}
		this.project = new Project(this.database.loadProjectData(project_id, true), this);
		this.project_view = new ProjectView(this.project);
		
		this.$el.empty();
		this.$el.append(this.project_view.$el);
		this.project_view.render();
		this._resized();
		
		this.database.setConfig("active_project", project_id);
	}
	
});
	
$(document).ready(function() {
	getDatabase("logic").done(function(database) {
		var main_view = new MainView(database);
	});
});
