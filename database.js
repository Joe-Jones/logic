"use strict";

function getDatabase(name, cheat) {
	var database = new Database(name);
	
	database.Project = Backbone.Model.extend({
		save: function() {
			database.saveProjectList();
		}
	});

	database.ProjectList = Backbone.Collection.extend({
		model: database.Project
	});
	
	if (cheat) {
		return database;
	} else {
		var deferred = $.Deferred();
		deferred.resolve(database);
		return deferred;
	}
}

function deleteDatabase(name) {
	_.each(getDatabase(name, true).keys(), function(key) {
		localStorage.removeItem(name + "/" + key);
	});
}

function Database(id) {
	this.id = id;
}

Database.prototype = {
	
	/*
		create a unique id.
	*/
	
	createID: function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	},
	
	configKey: function(key) {
		return this.id + "/global-config/" + key;
	},
	
	keys: function() {
		var keys = [];
		var regex = new RegExp("^" + this.id + "\\/(.*)");
		for (var i = 0; i < localStorage.length; i++) {
			var match = localStorage.key(i).match(regex);
			if (match) {
				keys.push(match[1]);
			}
		}
		return keys;
	},
	
	/***************************************************************************************
		Public interface below this point
	*/

	/*
		sets a global config value.
		Returns a promise that lets you know when the value has been written to the database.
	*/
	
	setConfig: function(key, value) {
		localStorage.setItem(this.configKey(key), JSON.stringify(value));
		var deferred = $.Deferred();
		deferred.resolve();
		return deferred;
	},
	
	/*
		gets a global config value
	*/
	
	getConfig: function(key) {
		return JSON.parse(localStorage.getItem(this.configKey(key)));
	},
	
	/*
		gets the project list, this is a Backbone collection.
	*/
	
	getProjectList: function() {
		if (this.project_list) {
			return this.project_list;
		} else {
			this.project_list = new this.ProjectList(JSON.parse(localStorage.getItem(this.id + "/project-list")));
		}
		return this.project_list;
	},
	
	saveProjectList: function() {
		localStorage.setItem(this.id + "/project-list", JSON.stringify(this.project_list.toJSON()));
	},

	/*
		returns a promise containing the ProjectData for the project with ID id.
		If id is undefined it creates a new project.
	*/

	loadProjectData: function(id, cheat) {
		if (cheat) {
			return new ProjectData(id, this);
		} else {
			var deferred = $.Deferred();
			deferred.resolve(new ProjectData(id, this));
			return deferred;
		}
	},
	
	deleteProjectData: function(id) {
		_.each(this.loadProjectData(id, true).getKeys(/.*/), function(key) {
			localStorage.removeItem(this.id + "/projects/" + id + "/" + key);
		}, this);
	}

};

function ProjectData(project_id, database) {
	this.id = project_id;
	this.database = database;
}

ProjectData.prototype = {

	key: function(key) {
		return this.database.id + "/projects/" + this.id + "/" + key;
	},

	/*
		returns an array of all the keys that match the regex pattern.
	*/

	getKeys: function(pattern) {
		var regex = new RegExp("projects\\/" + this.id + "\\/(.*)");
		var keys = [];
		_.each(this.database.keys(), function(key) {
			var match = key.match(regex);
			if (match) {
				keys.push(match[1]);
			}
		}, this);
		return keys;
	},
	
	/*
		returns the data corresponding to the key
	*/
	
	getData: function(key) {
		return JSON.parse(localStorage.getItem(this.key(key)));
	},
	
	/*
		sets the data for a key
	*/
	
	setData: function(key, value) {
		localStorage.setItem(this.key(key), JSON.stringify(value));
	},
	
	save: function() {
		var deferred = $.Deferred();
		deferred.resolve();
		return deferred;
	},
	
};

// Todo I don't know if we need to keep the rest of this file.

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