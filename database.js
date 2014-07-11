"use strict";

var database = {
	id: "logic",
	description: "This is where all the data is kept, its a database.",
	migrations: [
		{
			version: 1.0,
			migrate: function(transaction, next) {
				var db = transaction.db;
				
				db.createObjectStore("config", { keyPath: "id" });
				
				db.createObjectStore("projects", { keyPath: "id", autoIncrement : true });
			
				var schemas = db.createObjectStore("schemas", { keyPath: "id", autoIncrement : true });
				schemas.createIndex("project_id", "project_id", { unique: false});
			
				db.createObjectStore("template_data", { keyPath: "id", autoIncrement : true });
			
				db.createObjectStore("schema_data", { keyPath: "id", autoIncrement : true });
				
				var actions = db.createObjectStore("actions", { keyPath: "id", autoIncrement: true });
				actions.createIndex("project_id", "project_id", {unique: false});
				actions.createIndex("schema_id", "schema_id", {unique: false});
				//actions.createIndex("
				
				next();
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

var Schema = Backbone.Model.extend({
	storeName:	"schemas",
	database:	database
});

var SchemaList = Backbone.Collection.extend({
	database:	database,
	storeName:	"schemas",
	model:		Schema
});

var SchemaData = Backbone.Model.extend({
	database:	database,
	storeName:	"schema_data"
});

var TemplateData = Backbone.Model.extend({
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