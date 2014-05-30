

/********************************************************************************************/
function Sheet()
/********************************************************************************************/
{
	this.model = new SchemaModel();
	this.view = new SchemaView(this.model);
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
function Project()
/********************************************************************************************/
{
	this.sheets = [];
}

Project.prototype.addSheet = function() {
	this.sheets.push(new Sheet());
};

Project.prototype.save = function() {
	var that = this;
	return {
		'sheets':  _.map(that.sheets, function(sheet) { return sheet.save(); })
	};
};

Project.prototype.load = function (saved_project) {
	var that = this;
	this.sheets = _.map(saved_projects, function(sheet) {
		var sheet = new Sheet();
		sheet.load(sheet);
		return sheet;
	});
};

var sheetView = Backbone.View.extend({
		
	tagName: 'canvas',
	id: 'canvas',
	
	initialize: function(sheet) {
		this.sheet = sheet;
	},
	
	render: function() {
		this.logic_widget = new LogicWidget(this.el);
		this.logic_widget.setSheet(this.sheet);
	}
		
});

/********************************************************************************************/
var ProjectView = Backbone.View.extend({
/********************************************************************************************/
	tagName: 'div',
	
	events: {
		'click button#new_project': 'newProject'
	},
	
	initialize: function(project) {
		// _.bindAll(this, 'render'); // Turorial says I'm going to need this.
		this.project = project;
		this.render();
		this.widget.setSheet(this.project.sheets[0]);
	},
	
	render: function() {
		var html =	"";
		this.$el.html(html);
		createPallet();
		this.widget = new LogicWidget($('#logic_canvas')[0]);
	},
	
	addSheet: function(sheet) {
		
		
	}
		
		
});

/*var ProjectList = Backbone.Collection.extend({
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
});*/


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


//var project_list;
//var project_list_view;

/*var project;
var project_view;

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

	
	
	//project_list = new ProjectList();
	//project_list_view = new ProjectListView(project_list);
	
	project = new Project();
	project.addSheet();
	project_view = new ProjectView(project);
	
	
		
});*/



