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
//function Project()
/********************************************************************************************/
/*{
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
};*/

var database = {
	id: "logic",
	description: "This is where all the data is kept, its a database.",
	migrations: [
		{
			version: "1.0",
			migrate: function(transaction, versionRequest, next) {
				var db = transaction.db;
				
				db.createObjectStore("config", { keyPath: "id" });
				
				db.createObjectStore("projects", { keyPath: "id", autoIncrement : true });
			
				var schemas = db.createObjectStore("schemas", { keyPath: "id", autoIncrement : true });
				schemas.createIndex("project_id", "project_id", { unique: false});
			
				db.createObjectStore("template_data", { keyPath: "id", autoIncrement : true });
			
				db.createObjectStore("schema_data", { keyPath: "id", autoIncrement : true });
			}
		}
	]
	
};

var Config = Backbone.Model.extend({
	storeName: "config",
	database: database
});

var Project = Backbone.Model.extend({
	storeName: "projects",
	database:	database
});

var ProjectList = Backbone.Collection.extend({
	database: database,
	storeName: "projects",
	model: Project
	
	/*constructor: function() {
		//Backbone.Model.apply(arguments);
	},*/
	
	//events: {
		//add: 'addItem'
	//},
	
	//addItem: function() {
	//	console.log("in the event handler");
	//}
});

var Schema = BackBone.Model.extend({
	storeName:	"schemas",
	database:	database
});

var SchemaList = BackBone.Collection.extend({
	database:	database,
	storeName:	"schemas",
	model:		Schema
});

var SchemaData = BackBone.Mode({
	database:	database,
	storeName:	"schema_data"
});

var TemplateData = BackBone.Model({
	database:	database,
	storeName:	"template_data"
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

function DataInterface() {
	//this.createDatabase();
}

/*DataInterface.prototype = {
	
	createDatabase: function() {
		
		var db;
		var open_db_request = indexedDB.open("logic", 1);
		open_db_request.onerror = function(event) {
			console.log("we may as well die right here");
		};
		open_db_request.onupgradeneeded = function(event) {
			var db = event.target.result;
			
			db.createObjectStore("projects", { keyPath: "id", autoIncrement : true });
			
			var schemas = db.createObjectStore("schemas", { keyPath: "id", autoIncrement : true });
			schemas.createIndex("project_id", "project_id", { unique: false});
			
			db.createObjectStore("template_data", { keyPath: "id", autoIncrement : true });
			
			db.createObjectStore("schema_data", { keyPath: "id", autoIncrement : true });
		};
		onsuccess = function(event) {
			db = open_db_request.result;
		};

	},
	
	loadProjectList: function() {
		
	},
	
};
*/