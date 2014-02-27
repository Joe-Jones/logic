

/********************************************************************************************/
function Sheet(canvas_context)
/********************************************************************************************/
{
	this.model = new SchemaModel();
	this.view = new SchemaView(this.model, canvas_context);
}

Sheet.prototype.template = function () {
	if (!this.template && this.model.logic_system) {
		this.template = this.model.logic_system.template.saveAsTemplate();
	}
	return this.template;
};

Sheet.prototype.load = function (saved_sheet) {
	this.name = saved_sheet['name'];
	this.id = saved_sheet['id'];
	this.model.load(saved_sheet['model']);
	this.template = saved_sheet['template'];
	this.view.scale = saved_sheet['scale'];
	this.view.origin = new Point(saved_sheet['origin']);
};

Sheet.prototype.save = function () {
	return {
		'name': this.name,
		'id': this.id,
		'model': this.model.save(),
		'template': this.template,
		'scale': this.view.scale,
		'origin': this.view.origin
	};
};

/********************************************************************************************/
function Project(canvas)
/********************************************************************************************/
{
	this.sheets = [];
	this.widget = new LogicWidget(canvas)
}

Project.prototype.save  = function() {
	var that = this;
	return {
		'sheets':  _.map(that.sheets, function(sheet) { return sheet.save(); })
	};
};

Project.prototype.load = function (saved_project) {
	var that = this;
	this.sheets = _.map(saved_projects, function(sheet) {
		var sheet = new Sheet(that.widget.ctx);
		sheet.load(sheet);
		return sheet;
	});
};

var ProjectView = Backbone.View.extend({
	tagName: 'div',
	
	
	events: {
		'click button#new_project': 'newProject'
	},
	
	initialize: function(list) {
		// _.bindAll(this, 'render'); // Turorial says I'm going to need this.
		this.list = list;
		this.render();
	},
	
	render: function() {
		var html = "<div><canvas width="300" 
		this.$el.html("<button id='new_project'>New Project</button>");
	},
		
		
		
});

var ProjectList = Backbone.Collection.extend({
	model: ProjectListItem,
	
	constructor: function() {
		//Backbone.Model.apply(arguments);
	},
	
	//events: {
		//add: 'addItem'
	//},
	
	addItem: function() {
		console.log("in the event handler");
	}
});


var ProjectListItemView = Backbone.View.extend({
		
	tagName: "li",
		
	render: function() {
		var foo;
		this.$el.html();
	}
		
});
			
var ProjectListView = Backbone.View.extend({

	tagName: 'body',
	
	el: $('body'),
	
	events: {
		'click button#new_project': 'newProject'
	},
	
	initialize: function(list) {
		// _.bindAll(this, 'render'); // Turorial says I'm going to need this.
		this.list = list;
		this.render();
	},
	
	render: function() {
		this.$el.html("<button id='new_project'>New Project</button>");
	},
	
	newProject: function() {
		var item = new ProjectListItem();
		console.log(this.list);
		this.list.add(item);
	},
	
	appendItem: function() {
		this.$el.append("<b>Hi</b>");
	}

});


var project_list;
var project_list_view;

$(document).ready(function() {
		
	var db;
	var open_db_request = indexedDB.open("projects", 1);
	open_db_request.onerror = function(event) {
		console.log("we may as well die right here");
	};
	open_db_request.onupgradeneeded = function(event) {
		var db = event.target.result;
		var projects = db.createObjectStore("projects", { autoIncrement : true });
		var project_list = db.createObjectStore("project_list", { keyPath: "project_id"});
		project_list.createIndex("name", "name", { unique: false});
		project_list.createIndex("created", "created", { unique: false});
		project_list.createIndex("last_modified", "last_modified", { unique: false});
	};
	onsuccess = function(event) {
		db = open_db_request.result;
	};

	
	
	project_list = new ProjectList();
	project_list_view = new ProjectListView(project_list);
	
	
		
});



