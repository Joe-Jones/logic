"use strict";

function Storage(storage) {
	this.storage = storage;
}

Storage.prototype = {
	
	keys: function() {
		var keys = [];
		for (var i = 0; i < this.storage.length; i++) {
			keys.push(this.storage.key(i));
		}
		return keys;
	},
	
	getItem: function(key) {
		return this.storage.getItem(key);
	},
	
	setItem: function(key, value) {
		this.storage.setItem(key, value);
	},
	
	removeItem: function(key) {
		this.storage.removeItem(key);
	},
	
	clear: function() {
		this.storage.clear();
	}

};

function SubStorage(storage, prefix) {
	this.storage = storage;
	this.key_matcher = new RegExp(prefix + "\/(.*)");
	this.prefix = prefix;
}

SubStorage.prototype = {

	keys: function () {
		var keys = [];
		_.each(this.storage.keys(), function(key) {
			var match = key.match(this.key_matcher);;
			if (match) {
				keys.push(match[1]);
			}
		}, this);
		return keys;
	},
	
	getItem: function(key) {
		return this.storage.getItem(this.prefix + "/" + key);
	},
	
	setItem: function(key, value) {
		this.storage.setItem(this.prefix + "/" + key, value);
	},
  
	removeItem: function(key) {
		this.storage.removeItem(this.prefix + "/" + key);
	},
  
	clear: function() {
		_.each(this.keys(), function(key) {
			this.removeItem(key);
		}, this);
	}
	
};

function JSONStorage(storage) {
	this.storage = storage;
}

JSONStorage.prototype = {

	keys: function() {
		return this.storage.keys();
	},
	
	getItem: function(key) {
		return JSON.parse(this.storage.getItem(key));
	},
	
	setItem: function(key, value) {
		this.storage.setItem(key, JSON.stringify(value));
	},
	
	removeItem: function(key) {
		this.storage.removeItem(key);
	},
	
	clear: function() {
		this.storage.clear();
	}

};

var storage = new Storage(localStorage);

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
	this.storage = new SubStorage(storage, id);
	this.global_config = new SubStorage(this.storage, "global-config");
	this.projects = new SubStorage(this.storage, "projects");
}

Database.prototype = {
	
	/*
		create a unique id.
	*/
	
	createID: function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	},
	
	keys: function() {
		return this.storage.keys();
	},
	
	/***************************************************************************************
		Public interface below this point
	*/

	/*
		sets a global config value.
		Returns a promise that lets you know when the value has been written to the database.
	*/
	
	setConfig: function(key, value) {
		this.global_config.setItem(key, JSON.stringify(value));
		var deferred = $.Deferred();
		deferred.resolve();
		return deferred;
	},
	
	/*
		gets a global config value
	*/
	
	getConfig: function(key) {
		return JSON.parse(this.global_config.getItem(key));
	},
	
	/*
		gets the project list, this is a Backbone collection.
	*/
	
	getProjectList: function() {
		if (this.project_list) {
			return this.project_list;
		} else {
			this.project_list = new this.ProjectList(JSON.parse(this.storage.getItem("project-list")));
		}
		return this.project_list;
	},
	
	saveProjectList: function() {
		this.storage.setItem("project-list", JSON.stringify(this.project_list.toJSON()));
	},

	/*
		returns a promise containing the ProjectData for the project with ID id.
		If id is undefined it creates a new project.
	*/

	loadProjectData: function(id, cheat) {
		var project_data = new JSONStorage(new SubStorage(this.projects, id))
		project_data.id = id;
		project_data.database = this;
		if (cheat) {
			return project_data;
		} else {
			var deferred = $.Deferred();
			deferred.resolve(project_data);
			return deferred;
		}
	},
	
	deleteProjectData: function(id) {
		this.loadProjectData(id, true).clear();
	}

};
