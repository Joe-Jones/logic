"use strict";

function getDatabase(name) {
	var database = new Database(name);
	
	database.Config = Backbone.Model.extend({
		storeName: "config",
		database: database
	});
	
	database.Project = Backbone.Model.extend({
		storeName: "projects",
		database:	database
	});

	database.ProjectList = Backbone.Collection.extend({
		database: database,
		storeName: "projects",
		model: database.Project
	});
	
	database.config = new database.Config({id: 1});
	
	var config_promise = database.config.fetch();
	
	var deferred = $.Deferred();
	config_promise.always(function() {
		deferred.resolve(database);
	});
	
	database.project_list = new database.ProjectList;
	
	var project_list_promise = database.project_list.fetch();
	
	return $.when(deferred, project_list_promise);
}

function Database(name) {
	this.id = name;
	
}

Database.prototype = {

	description: "This is where all the data is kept, its a database.",
	migrations: [
		{
			version: 1.0,
			migrate: function(transaction, next) {
				var db = transaction.db;
				
				var config = db.createObjectStore("config", { keyPath: "id" });
				config.createIndex("key", "key", { unique: true });
				
				db.createObjectStore("projects", { keyPath: "id", autoIncrement : true });
			
				var blobs = db.createObjectStore("blobs", { keyPath: "id", autoIncrement : true });
				blobs.createIndex("project_id", "project_id", { unique: false});
				blobs.createIndex("name", "name", { unique: false });
				
				next();
			}
		}
	],

	/*
		sets a global config value.
		Returns a promise that lets you know when the value has been written to the database.
	*/
	
	setConfig: function(key, value) {
		this.config.set(key, value);
		return this.config.save();
	},
	
	/*
		gets a global config value
	*/
	
	getConfig: function(key) {
		return this.config.get(key);
	},
	
	/*
		gets the project list, this is a Backbone collection.
	*/
	
	getProjectList: function() {
		return this.project_list;
	},

	/*
		returns a promise containing the ProjectData for the project with ID id.
		If id is undefined it creates a new project.
	*/

	loadProjectData: function(id) {
	
	}

};

function ProjectData() {

}

ProjectData.prototype = {

	/*
	
	*/

	addObject: function(key, object) {
	
	},
	
	removeObject: function(key) {
	
	}
	
};



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
			
				var templates = db.createObjectStore("templates", { keyPath: "id", autoIncrement : true });
				templates.createIndex("project_id", "project_id", { unique: false });
			
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

var Template = Backbone.Model.extend({
	database:	database,
	storeName:	"templates"
});

var TemplateList = Backbone.Collection.extend({
	database: 	database,
	storeName:	"templates",
	model:		TemplateList
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