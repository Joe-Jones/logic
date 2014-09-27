"use strict";

/*************************************************************************************
	Template Manager.

	These methods go together and are used to manage templates and their dependences.

	A note on terminology, mainly we are referring to the ids, in fact every method here that
	takes an argument, that argument is an id. The words view, schema, and template are
	interchangeable when talking about ids. This is because there is a one to one relationship
	between views, schemas and templates and they all use the same id.

*************************************************************************************/

function TemplateManager(data) {
	if (_.isObject(data)) {
		_.extend(this, data);
	} else {
		this.templates = {};
		this.contains = {};
	}
	this.models = {};
}

TemplateManager.prototype = {

	/*
		Returns a list of all the components included directly in the schema with ID id.
	*/

	allContainedBy: function(id) {
		return _.keys(this.contains[id]); 
	},
	
	/*
		Return a list of all schemas which directly include the schema with ID id.
	*/
	
	allContaining: function(id) {
		return _.filter(_.keys(this.contains), function(k) { return _.contains(_.keys(this.contains[k]), String(id)); }, this);
	},

	rebuildNeededTemplates: function(id) {
		_.each(this.allContainedBy(id), function(containd) {
			this.rebuildTemplate(containd);
		}, this);
	},

	/*
		if it needs to be, rebuild template with ID id. First rebuilding any templates it depends on.
	*/
	
	rebuildTemplate: function(id) { //Todo this looks like it needs rewritten.
		if (!this.templates[id]) {
			this.rebuildNeededTemplates(id);
			this.templates[id] = this.models[id].saveAsTemplate();
		}
	},

	/* Public methods below this line */
	
	/* 
		the template manager needs to be able to find a model for every template it is managing.
	*/
	
	addModel: function(model) {
		if (!this.contains[model.id]) {
			this.contains[model.id] = {};
		}
		this.models[model.id] = model;
	},
	
	/*
		Called by a view, using its own schema id to let the template manager know it's template is invalid.
	*/
	
	templateInvalid: function(id) {
		delete this.templates[id];
		_.each(this.allContaining(id), function(containing_id) {
			this.templateInvalid(containing_id);
		}, this);
	},

	/*
		Called by a view to get the template for a different schema.
	*/
	
	getTemplate: function(id) {
		this.rebuildTemplate(id);
		return this.templates[id];
	},
	
	/*
		Called to check we would not create a cyclic dependency by adding added to to.
	*/
	
	validToAdd: function(added, to) {
		/*
			we need to check that added does not in some way contain to
		*/
		var added_contains = _.keys(this.contains[added]);
		return added != to && !_.contains(added_contains, to) && _.every(added_contains, function(id) { return this.validToAdd(id, to); }, this);
	},

	/*
		Called to let the template manager know that a copy template with id added has been added to schema with id to.
	*/
	
	templateAdded: function(added, to) {
		var contained = this.contains[to];
		if (contained[added]) {
			contained[added] ++;
		} else {
			contained[added] = 1;
		}
	},
	
	/*
		Called to let the template manager that one of the copies of removed that from contained has
		been removed.
	*/
	
	templateRemoved: function(removed, from) {
		var contained = this.contains[from];
		if (contained[removed] > 1) {
			contained[removed]--;
		} else {
			delete contained[removed];
		}
	}

};

function Project(project_data) {
	this.project_data = project_data;
	this.template_manager = new TemplateManager(this.project_data.getData("template_manager"));
	this.schemas = {};
	_.each(this.project_data.getKeys(/schema\/.*/), function(id) {
		this.addSchema(id);
	}, this);
	this.history = [];
	this.history_position = 0;
}

Project.prototype = {

	// private
	addSchema: function(id) {
		var data = this.project_data.getData(id);
		var schema = new SchemaModel(id, this.project_data.project_id, data, this.template_manager);
		this.template_manager.addModel(schema);
		this.schemas[id] = schema;
		return schema;
	},

	newSchema: function() {
		var new_schema = this.addSchema("schema/" + this.project_data.database.createID());
		// we load this here because we're probably being called from the user interface and this model is about to be added to a view.
		new_schema.load();
		return new_schema;
	},
	
	getSchema: function(id) {
		var schema = this.schemas[id];
		if (!schema.loaded) {
			schema.load();
		}
		return schema;
	},
	
	checkPoint: function() {
		_.each(this.project_data.getKeys(/schema\/.*/), function(id) {
			this.project_data.setData(id, this.schemas[id].save());
		}, this);
		this.project_data.setData("template_manager", this.template_manager.save());
		this.project_data.save();
	},
	
	record: function(action) {
		if (this.history_position != this.history.length) { // We need to get rid of redo history
			this.history = _.first(this.history, this.history_position);
		}
		this.history.push(action);
		this.history_position++;
	},
	
	undo: function() {
		if (this.history_position > 0) {
			var last_action = this.history[this.history_position - 1];
			var undo_action = last_action.inverse();
			undo_action.doTo(this.views[undo_action.schemaID()].model);
			this.history_position--;
			
			this.views[undo_action.schemaID()].saveSchema();
		}
	},
	
	redo: function() {
		if (this.history_position < this.history.length) {
			var action = this.history[this.history_position];
			action.doTo(this.views[action.schemaID()].model);
			this.history_position++;
			
			this.views[action.schemaID()].saveSchema();
		}
	},

};

function Action(args) {
	if (args.json) {
		
	} else {
		_.extend(this, args);
	}
}

Action.prototype = {

	toJSON: function() {
		return {};
	},
	
	inverse: function() {
		switch (this.type) {
			case "ADD_GATE":
				return new Action({
					project_id:		this.project_id,
					schema_id:		this.schema_id,
					type:			"REMOVE_GATE"
				});
			case "ADD_CONNECTION":
				return new Action({
					project_id:		this.project_id,
					schema_id:		this.schema_id,
					type:			"REMOVE_CONNECTION",
					input_item:		this.input_item,
					input_num:		this.input_num,
					output_item:	this.output_item,
					output_num:		this.output_num
				});
			case "REMOVE_CONNECTION":
				return new Action({
					project_id:		this.project_id,
					schema_id:		this.schema_id,
					type:			"ADD_CONNECTION",
					input_item:		this.input_item,
					input_num:		this.input_num,
					output_item:	this.output_item,
					output_num:		this.output_num
				});
			case "REMOVE_NUMBERED_GATE":
				return new Action({
					project_id:		this.project_id,
					schema_id:		this.schema_id,
					type:			"ADD_NUMBERED_GATE",
					number:			this.number,
					gate_type:		this.gate_type,
					position:		this.position
				});
		}
	},
	
	doTo: function(model) {
		switch (this.type) {
			case "ADD_GATE":
				var object = makeGate(this.gate_type);
				model.add(object);
				object.setPosition(this.position);
				break;
			case "REMOVE_GATE":
				model.removeLastGate();
				break;
			case "ADD_CONNECTION":
				model.addConnection(this.input_item, this.input_num, this.output_item, this.output_num);
				break;
			case "REMOVE_CONNECTION":
				model.removeConnection(this.input_item, this.input_num, this.output_item, this.output_num);
				break;
			case "REMOVE_NUMBERED_GATE":
				model.remove(this.number);
				break;
			case "ADD_NUMBERED_GATE":
				var object = makeGate(this.gate_type);
				object.number = this.number;
				model.add(object);
				object.setPosition(this.position);
				break;
		}
	},
	
	schemaID: function() {
		return this.schema_id;
	}
	
};

function GroupedActions(actions) {
	this.actions = actions;
}

GroupedActions.prototype = {

	toJSON: function() {
		return {};
	},
	
	inverse: function() {
		var actions = [];
		_.each(this.actions, function(action) { actions.unshift(action.inverse()); });
		return new GroupedActions(actions);
	},
	
	doTo: function(model) {
		_.each(this.actions, function(action) { action.doTo(model) });
	},
	
	schemaID: function() {
		return this.actions[0].schema_id;
	}

};


//Todo are we actually using the rest of this file or is it just junk.

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