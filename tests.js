"use strict";

QUnit.module("template manager");

var MockModel = function(id, name, containing, template_manager) {
	this.id = id;
	this.name = name;
	this.containing = containing;
	this.template_manager = template_manager;
}

MockModel.prototype = {
	
	saveAsTemplate: function() {
		if (_.isArray(this.containing) && this.containing.length > 0) {
			var template = this.name + "(";
			var first = true;
			_.each(this.containing, function(id) {
				if (!first) {
					template += ",";
				} else {
					first = false;
				}
				template += this.template_manager.getTemplate(id);
			}, this);
			return template + ")";
		} else {
			return this.name;
		}
	},
	
	subcomponentInvalid: function() {}

};

QUnit.test( "template manager test", function( assert ) {
  
  var template_manager = new TemplateManager();
  
  var model_1 = new MockModel(1, "model_1", [], template_manager);
  template_manager.addModel(model_1);
  
  var model_2 = new MockModel(2, "model_2", [], template_manager);
  template_manager.addModel(model_2);
  
  var model_3 = new MockModel(3, "model_3", [1, 2], template_manager);
  template_manager.addModel(model_3);
  template_manager.templateAdded(1, 3);
  template_manager.templateAdded(2, 3);
  
  var model_4 = new MockModel(4, "model_4", [3], template_manager);
  template_manager.addModel(model_4);
  template_manager.templateAdded(3, 4);
  
  assert.equal(template_manager.getTemplate(4), "model_4(model_3(model_1,model_2))", "The template is as it should be.");
  
  model_1.name = "new name";
  
  assert.equal(template_manager.getTemplate(4), "model_4(model_3(model_1,model_2))", "The template should not have changed.");
 
  template_manager.templateInvalid(1);
 
  assert.equal(template_manager.getTemplate(4), "model_4(model_3(new name,model_2))", "The template should have changed now as we have called templateInvalid.");
  
  assert.ok(template_manager.validToAdd(1, 4), "We should be able to add model 1 to model 4.");
  assert.ok(!template_manager.validToAdd(4, 1), "We should not be able to add model 4 to model 1.");
  
  // This last test would be a bug if we did it for real, if we have called templateRemoved we should have removed the reference from the model as well.
  // We're just doing this to test that the template manager no longer thinks that model_4 depends on model_1.
  template_manager.templateRemoved(1, 3);
  model_1.name = "other name";
  template_manager.templateInvalid(1);
  assert.equal(template_manager.getTemplate(4), "model_4(model_3(new name,model_2))", "We are no longer tracking changes to model_1 as it has been removed from model_3.");
  
});

QUnit.module("logic system");

function checkTruthTable(table, table_name, logic_system, input_ids, output_ids, assert) {
	var row_number = 0;
	_.each(table, function(row) {
		var final_values = {};
		var n = 0;
		_.each(input_ids, function(input_id) {
			logic_system.setOutput(input_id, row[n]);
			n++;
		}, this);
		_.each(output_ids, function(output_id) {
			final_values[n] = logic_system.getOutput(output_id);
			var saved_n = n;
			logic_system.registerCallback(output_id, function(value) {
				final_values[saved_n] = value;
			});
			n++;
		}, this);
		logic_system.run();
		_.each(_.keys(final_values), function(column_number) {
			assert.equal(final_values[column_number], row[column_number],
			             "Table \"" + table_name + "\", Row " + row_number + ", Column " + column_number + " should be " + row[column_number] + ".");
		}, this);
		_.each(output_ids, function(output_id) {
			logic_system.dropCallback(output_id);
		}, this);
		row_number++;
	}, this);
}

QUnit.test("simple test", function(assert) {
	var logic_system = new LogicSystem;
	var input_1 = logic_system.addGate("SWITCH");
	var input_2 = logic_system.addGate("SWITCH");
	var and_gate = logic_system.addGate("AND");
	var output = logic_system.addGate("BULB");
	logic_system.makeConnection(input_1, and_gate, 0);
	logic_system.makeConnection(input_2, and_gate, 1)
	logic_system.makeConnection(and_gate, output, 0)
	var truth_table = [
		[0, 0, 0],
		[0, 1, 0],
		[1, 0, 0],
		[1, 1, 1]];
	checkTruthTable(truth_table, "And Gate", logic_system, [input_1, input_2], [output], assert);
});

function halfAdder() {
	var logic_system = new LogicSystem;
	var input_a = logic_system.addGate("INPUT");
	var input_b = logic_system.addGate("INPUT");
	var and_gate = logic_system.addGate("AND");
	var xor_gate = logic_system.addGate("XOR");
	var output_s = logic_system.addGate("OUTPUT");
	var output_c = logic_system.addGate("OUTPUT");
	logic_system.makeConnection(input_a, and_gate, 0);
	logic_system.makeConnection(input_b, and_gate, 1);
	logic_system.makeConnection(input_a, xor_gate, 0);
	logic_system.makeConnection(input_b, xor_gate, 1);
	logic_system.makeConnection(and_gate, output_c, 0);
	logic_system.makeConnection(xor_gate, output_s, 0);
	return { template: logic_system.saveAsTemplate(), a: input_a, b: input_b, s: output_s, c: output_c };
}

QUnit.test("half adder test", function(assert) {
	var logic_system = new LogicSystem;
	var adder = halfAdder();
	var adder_instance = logic_system.addTemplate(adder["template"]);
	var input_a = logic_system.addGate("SWITCH");
	var input_b = logic_system.addGate("SWITCH");
	var output_s = logic_system.addGate("BULB");
	var output_c = logic_system.addGate("BULB");
	logic_system.connectToTemplateInstance(input_a, adder_instance, adder["a"]);
	logic_system.connectToTemplateInstance(input_b, adder_instance, adder["b"]);
	logic_system.makeConnection(logic_system.gateNumber(adder_instance, adder["s"]), output_s, 0);
	logic_system.makeConnection(logic_system.gateNumber(adder_instance, adder["c"]), output_c, 0);
	var truth_table = [
		[0, 0, 0, 0],
		[1, 0, 0, 1],
		[0, 1, 0, 1],
		[1, 1, 1, 0]];
	checkTruthTable(truth_table, "Half Adder", logic_system, [input_a, input_b], [output_c, output_s], assert);
});

QUnit.module("database");

function tidy(db_name) {
	deleteDatabase(db_name);
	QUnit.start();
}

QUnit.asyncTest("config test", function(assert) {
	expect(1);

	getDatabase("test_database").done(function (database) {
		database.setConfig("an", "example").done(function () {
			getDatabase("test_database").done(function(database) {
				assert.equal(database.getConfig("an"), "example", "We should get the same value back");
				tidy("test_database");
			}).fail(function() { assert.ok(false, "could not open the database the second time"); tidy("test_database"); });
		}).fail(function() { assert.ok(false, "could not write to the database"); tidy("test_database"); });
	}).fail(function() { assert.ok(false, "could not open the database the first time"); tidy("test_database"); });

});

QUnit.asyncTest("project list test 1", function(assert) {
	expect(3);
	
	getDatabase("test_database2").done(function (database) {
		var project_list = database.getProjectList();
		var project1 = new database.Project();
		var project2 = new database.Project();
		var project3 = new database.Project();
		project1.set("name", "project1");
		project2.set("name", "project2");
		project3.set("name", "project3");
		project_list.add(project1);
		project_list.add(project2);
		project_list.add(project3);
		
		var names = [];
		project_list.each(function (project) {
			names.push(project.get("name"));
		}, this);
		_.each(["project1", "project2", "project3"], function (name) {
			assert.ok(_.contains(names, name), "Project with name " + name + " was in the project list");
		}, this);
		tidy("test_database2");
	}).fail(function() { assert.ok(false, "could not open the database the first time"); tidy("test_database2"); });
});

QUnit.asyncTest("project list test 2", function(assert) {
	expect(3);
	
	getDatabase("test_database3").done(function (database) {
		var project_list = database.getProjectList();
		var project1 = new database.Project();
		var project2 = new database.Project();
		var project3 = new database.Project();
		project1.set("name", "project1");
		project2.set("name", "project2");
		project3.set("name", "project3");
		project_list.add(project1);
		project_list.add(project2);
		project_list.add(project3);
		var promise = $.when(project1.save(), project2.save(), project3.save());
		
		promise.done(function() {
		
			getDatabase("test_database3").done(function (database) {
				var project_list = database.getProjectList();
				var names = [];
				project_list.each(function (project) {
					names.push(project.get("name"));
				}, this);
				_.each(["project1", "project2", "project3"], function (name) {
					assert.ok(_.contains(names, name), "Project with name " + name + " was in the project list");
				}, this);
				tidy("test_database3");
			}).fail(function() { assert.ok(false, "could not open the database the second time"); tidy("test_database3"); });
			
		}).fail(function() { assert.ok(false, "could not sync the project list"); tidy("test_database3"); });
		
	}).fail(function() { assert.ok(false, "could not open the database the first time"); tidy("test_database3"); });
});

QUnit.asyncTest("project data test", function(assert) {
	expect(3);
	getDatabase("test_database4").done(function (database) {
		database.loadProjectData("example_project").done(function (project_data) {
			project_data.setItem("1", "1");
			project_data.setItem("2", "2");
			project_data.setItem("Hippopotamus", "Is very big.");
			getDatabase("test_database4").done(function (database) {
				database.loadProjectData("example_project").done(function (project_data) {
					_.each(project_data.keys(), function(key) {
						if (key == "Hippopotamus") {
							assert.equal(project_data.getItem(key), "Is very big.", "Yes a Hippopotamus is very big.");
						} else {
							assert.equal(project_data.getItem(key), key, key + " is not a Hippopotamus.");
						}
					});
					tidy("test_database4");
				}).fail(function() { assert.ok(false, "could not get the project data"); tidy("test_database4"); });
			}).fail(function() { assert.ok(false, "could not open the database, the second time"); tidy("test_database4"); });
		}).fail(function() { assert.ok(false, "could create the project"); QUnit.start();});
	}).fail(function() { assert.ok(false, "could not open the database"); QUnit.start();});
});

function databaseOnDisk(id) {
	var regex = new RegExp("^" + id + "\\/");
	for(var i = 0; i < localStorage.length; i++) {
		var key = localStorage.key(i);
		if (key.match(regex)) {
			return true;
		}
	}
	return false;
}

function projectOnDisk(project) {
	var keys = project.keys();
	if (keys.length == 0) {
		return false;
	}
	return _.every(keys, function(key) {
		return localStorage.getItem(project.database.id + "/projects/" + project.id + "/" + key);
	});
}

QUnit.test("delete data", function(assert) {
	var database = getDatabase("testdatabase5", true);
	database.setConfig("config1", [1,2,3]);
	database.setConfig("config2", [4,5,6]);
	var project1 = database.loadProjectData("project1", true);
	project1.setItem("key1", {1:2,3:4});
	project1.setItem("key2", [1,2,3,4,5,6,7,8]);
	project1.setItem("key3", "A string");
	var project2 = database.loadProjectData("project2", true);
	project2.setItem("key1", {1:2,3:4});
	project2.setItem("key2", [1,2,3,4,5,6,7,8]);
	project2.setItem("key3", "A string");
	
	var database2 = getDatabase("testdatabase6", true);
	database2.setConfig("config1", [1,2,3]);
	database2.setConfig("config2", [4,5,6]);
	var project2_1 = database2.loadProjectData("project1", true);
	project2_1.setItem("key1", {1:2,3:4});
	project2_1.setItem("key2", [1,2,3,4,5,6,7,8]);
	project2_1.setItem("key3", "A string");
	var project2_2 = database2.loadProjectData("project2", true);
	project2_2.setItem("key1", {1:2,3:4});
	project2_2.setItem("key2", [1,2,3,4,5,6,7,8]);
	project2_2.setItem("key3", "A string");
	
	assert.ok(databaseOnDisk("testdatabase5"), "check 1");
	assert.ok(projectOnDisk(project1), "check 2");
	assert.ok(projectOnDisk(project2), "check 3");
	assert.ok(databaseOnDisk("testdatabase6"), "check 4");
	assert.ok(projectOnDisk(project2_1), "check 5");
	assert.ok(projectOnDisk(project2_2), "check 6");
	
	database.deleteProjectData("project1");
	
	assert.ok(databaseOnDisk("testdatabase5"), "check 7");
	assert.ok(!projectOnDisk(project1), "check 8");
	assert.ok(projectOnDisk(project2), "check 9");
	assert.ok(databaseOnDisk("testdatabase6"), "check 10");
	assert.ok(projectOnDisk(project2_1), "check 11");
	assert.ok(projectOnDisk(project2_2), "check 12");
	
	deleteDatabase("testdatabase5");
	
	assert.ok(!databaseOnDisk("testdatabase5"), "check 13");
	assert.ok(!projectOnDisk(project1), "check 14");
	assert.ok(!projectOnDisk(project2), "check 15");
	assert.ok(databaseOnDisk("testdatabase6"), "check 16");
	assert.ok(projectOnDisk(project2_1), "check 17");
	assert.ok(projectOnDisk(project2_2), "check 18");
	
	deleteDatabase("testdatabase6");
	
	assert.ok(!databaseOnDisk("testdatabase5"), "check 19");
	assert.ok(!projectOnDisk(project1), "check 20");
	assert.ok(!projectOnDisk(project2), "check 21");
	assert.ok(!databaseOnDisk("testdatabase6"), "check 22");
	assert.ok(!projectOnDisk(project2_1), "check 23");
	assert.ok(!projectOnDisk(project2_2), "check 24");
});

QUnit.module("projects and schemas");

function checkTruthTable2(table, table_name, schema, input_ids, output_ids, assert) {
	var row_number = 0;
	_.each(table, function(row) {
		var n = 0;
		_.each(input_ids, function(input_id) {
			schema.getObjectByNumber(input_id).stateChanged(row[n]);
			n++;
		}, this);
		_.each(output_ids, function(output_id) {
			assert.equal(Boolean(schema.getObjectByNumber(output_id).on), Boolean(table[row_number][n]),
			             "Table \"" + table_name + "\", Row " + row_number + ", Column " + n + " should be " + table[row_number][n] + ".");
			n++;
		}, this);
		row_number++;
	}, this);
}

QUnit.test("create a schema and test it", function(assert) {

	// Open a database.
	var database = getDatabase("testdatabase7", true);
	
	// Create a project
	var project_data = database.loadProjectData("example_project", true);
	var project = new Project(project_data);
	
	// Add a schema to the project
	var schema_id;
	project.on("schemaOpened", function(id) { schema_id = id; });
	project.dispatchAction(new Action({project_id: "example_project", type: "ADD_SCHEMA"}));
	var schema = project.getSchema(schema_id);
	
	// Build a circuit in the schema
	var new_gate;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH"}));
	var switch1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH"}));
	var switch2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "AND"}));
	var and_gate = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "BULB"}));
	var bulb = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch1, output_num: 0, input_item: and_gate, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch2, output_num: 0, input_item: and_gate, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: and_gate, output_num: 0, input_item: bulb, input_num: 0}));
									   
	var truth_table = [
		[0,0,0],
		[0,1,0],
		[1,0,0],
		[1,1,1]];

	checkTruthTable2(truth_table, "test an and gate", schema, [switch1, switch2], [bulb], assert);
	
	deleteDatabase("testdatabase7");
	
});

QUnit.test("create a schema and test it's been saved", function(assert) {

	// Open a database.
	var database = getDatabase("testdatabase8", true);
	
	// Create a project
	var project_data = database.loadProjectData("example_project", true);
	var project = new Project(project_data);
	
	// Add a schema to the project
	var schema_id;
	project.on("schemaOpened", function(id) { schema_id = id; });
	project.dispatchAction(new Action({project_id: "example_project", type: "ADD_SCHEMA"}));
	var schema = project.getSchema(schema_id);
	
	// Build a circuit in the schema
	var new_gate;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH"}));
	var switch1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH"}));
	var switch2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "AND"}));
	var and_gate = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "BULB"}));
	var bulb = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch1, output_num: 0, input_item: and_gate, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch2, output_num: 0, input_item: and_gate, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: and_gate, output_num: 0, input_item: bulb, input_num: 0}));
									   
									  
	// open the database and project a second time to 
	var database2 = getDatabase("testdatabase8", true);
	var project_data2 = database2.loadProjectData("example_project", true);
	var project2 = new Project(project_data2);
	var schema2 = project2.getSchema(schema_id);
									   
	var truth_table = [
		[0,0,0],
		[0,1,0],
		[1,0,0],
		[1,1,1]];

	checkTruthTable2(truth_table, "test an and gate", schema2, [switch1, switch2], [bulb], assert);
	
	deleteDatabase("testdatabase8");
	
});

QUnit.test("create a schema and check point it", function(assert) {

	// Open a database.
	var database = getDatabase("testdatabase9", true);
	
	// Create a project
	var project_data = database.loadProjectData("example_project", true);
	var project = new Project(project_data);
	
	// Add a schema to the project
	var schema_id;
	project.on("schemaOpened", function(id) { schema_id = id; });
	project.dispatchAction(new Action({project_id: "example_project", type: "ADD_SCHEMA"}));
	var schema = project.getSchema(schema_id);
	
	// Build a circuit in the schema
	var new_gate;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var switch1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var switch2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "AND", position: new Point(0, 0)}));
	var and_gate = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "BULB", position: new Point(0, 0)}));
	var bulb = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch1, output_num: 0, input_item: and_gate, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch2, output_num: 0, input_item: and_gate, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: and_gate, output_num: 0, input_item: bulb, input_num: 0}));
									   
	// Now the check point
	project.checkPoint();
									  
	// open the database and project a second time to 
	var database2 = getDatabase("testdatabase9", true);
	var project_data2 = database2.loadProjectData("example_project", true);
	var project2 = new Project(project_data2);
	var schema2 = project2.getSchema(schema_id);
									   
	var truth_table = [
		[0,0,0],
		[0,1,0],
		[1,0,0],
		[1,1,1]];

	checkTruthTable2(truth_table, "test an and gate", schema2, [switch1, switch2], [bulb], assert);
	
	deleteDatabase("testdatabase9");
	
});

function buildCircuit1(project, schema, gate_type) {
	// Build a circuit in the schema
	var new_gate;
	var project_id = null; // Todo Actions don't need a project_id
	var schema_id = schema.id;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var switch1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var switch2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: gate_type, position: new Point(0, 0)}));
	var and_gate = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", project_id: "example_project", schema_id: schema_id, gate_type: "BULB", position: new Point(0, 0)}));
	var bulb = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch1, output_num: 0, input_item: and_gate, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: switch2, output_num: 0, input_item: and_gate, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", project_id: "example_project", schema_id: schema_id,
									   output_item: and_gate, output_num: 0, input_item: bulb, input_num: 0}));
	return [[switch1, switch2], [bulb]];
}

function getAProject(database_name, project_id) {
	// Open a database.
	var database = getDatabase(database_name, true);
	
	// Create a project
	var project_data = database.loadProjectData(project_id, true);
	var project = new Project(project_data);
	
	return project;
}

function addSchema(project) {
	// Add a schema to the project
	var schema_id;
	project.on("schemaOpened", function(id) { schema_id = id; });
	project.dispatchAction(new Action({project_id: "example_project", type: "ADD_SCHEMA"}));
	var schema = project.getSchema(schema_id);
	return schema;
}

QUnit.test("test undo", function(assert) {
	// This doesn't really test undo, just that it doesn't break anything using it.
	var project = getAProject("testdatabase10", "example_project");
	var schema = addSchema(project);
	buildCircuit1(project, schema, "AND");
	for (var i = 0; i < 7; i++) {
		project.dispatchAction(new Action({type: "UNDO"}));
	}
	var io = buildCircuit1(project, schema, "OR");
	var truth_table = [
		[0,0,0],
		[0,1,1],
		[1,0,1],
		[1,1,1]];
	checkTruthTable2(truth_table, "test an or gate", schema, io[0], io[1], assert);
	deleteDatabase("testdatabase10");
});

function buildHalfAdder(project, schema) {
	var new_gate;
	var schema_id = schema.id;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "INPUT", position: new Point(0, 0)}));
	var input1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "INPUT", position: new Point(0, 0)}));
	var input2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "AND", position: new Point(0, 0)}));
	var input_and = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "OR", position: new Point(0, 0)}));
	var or = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "NOT", position: new Point(0, 0)}));
	var not = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "AND", position: new Point(0, 0)}));
	var output_and = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "OUTPUT", position: new Point(0, 0)}));
	var carry = new_gate
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "OUTPUT", position: new Point(0, 0)}));
	var sum = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input1, output_num: 0, input_item: input_and, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input1, output_num: 0, input_item: or, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input2, output_num: 0, input_item: input_and, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input2, output_num: 0, input_item: or, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input_and, output_num: 0, input_item: carry, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input_and, output_num: 0, input_item: not, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: not, output_num: 0, input_item: output_and, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: or, output_num: 0, input_item: output_and, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: output_and, output_num: 0, input_item: sum, input_num: 0}));
}

QUnit.test("embed a template in a schema", function(assert) {
	var project = getAProject("testdatabase11", "test_project");
	var component = addSchema(project);
	buildHalfAdder(project, component);
	
	var schema = addSchema(project);
	var new_gate;
	var schema_id = schema.id;
	schema.on("gateAdded", function(id) { new_gate = id; });
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var input1 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "SWITCH", position: new Point(0, 0)}));
	var input2 = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "COMPONENT:" + component.id, position: new Point(0, 0)}));
	var adder_instance = new_gate;
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "BULB", position: new Point(0, 0)}));
	var carry = new_gate
	project.dispatchAction(new Action({type: "ADD_GATE", schema_id: schema_id, gate_type: "BULB", position: new Point(0, 0)}));
	var sum = new_gate;
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input1, output_num: 0, input_item: adder_instance, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: input2, output_num: 0, input_item: adder_instance, input_num: 1}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: adder_instance, output_num: 0, input_item: carry, input_num: 0}));
	project.dispatchAction(new Action({type: "ADD_CONNECTION", schema_id: schema_id,
									   output_item: adder_instance, output_num: 1, input_item: sum, input_num: 0}));
									   
	var truth_table = [
		[0,0,0,0],
		[0,1,0,1],
		[1,0,0,1],
		[1,1,1,0],
	];
	
	checkTruthTable2(truth_table, "test a subsircuit", schema, [input1, input2], [carry, sum], assert);
	deleteDatabase("testdatabase11");
});

function loadProject(actions, database_name, project_name) {
	var project = getAProject(database_name, project_name);
	_.each(actions, function(action) {
		project.dispatchAction(vivifyAction(action));
	});
	return project;
}

function getNth(schema, n, type) {
	var counter = 0;
	var wanted = _.find(schema.objects, function(object) {
		if (object.type == type) {
			if (counter == n) {
				return true;
			} else {
				counter++;
			}
		}
		return false;
	});
	return wanted.number;
}

function getSwitch(schema, n) {
	return getNth(schema, n, "SWITCH");
}

function getBulb(schema, n) {
	return getNth(schema, n, "BULB");
}

function checkTruthTable3(truth_table, test_name, actions, schema_id, inputs, outputs, assert) {
	var project = loadProject(actions, "testDatabase", "testProject");
	var schema = project.getSchema(schema_id);
	var input_ids = _.map(inputs, function(n) { return getSwitch(schema, n); });
	var output_ids = _.map(outputs, function(n) { return getBulb(schema, n); });
	checkTruthTable2(truth_table, test_name, schema, input_ids, output_ids, assert);
	deleteDatabase("testDatabase");
}

QUnit.test("Simple test of the new testing framework.", function(assert) {
	var actions = [{"type":"ADD_SCHEMA","previous_schema":null,"previously_selected_tab":null},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":6.1,"y":-10.8}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":9.133333333333333,"y":-10.533333333333333}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OUTPUT","position":{"x":7.533333333333333,"y":-18.866666666666667}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OR","position":{"x":8.033333333333333,"y":-15}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":0,"output_item":4,"output_num":0},{"type":"ADD_SCHEMA","previous_schema":"schema/1","previously_selected_tab":"schema/1"},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"COMPONENT:schema/0","position":{"x":6.966666666666667,"y":-15.133333333333333}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":6.033333333333333,"y":-9.666666666666666}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":8.9,"y":-8.666666666666666}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"BULB","position":{"x":6.966666666666667,"y":-20.333333333333332}},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":0,"output_item":2,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":1,"output_item":3,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0}];
	var truth_table = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];
	checkTruthTable3(truth_table, "It's just an or gate.", actions, "schema/1", [0, 1], [0], assert);
});

QUnit.test("Go back and change the content of a component.", function(assert) {
	var actions = [{"type":"ADD_SCHEMA","previous_schema":"schema/0","previously_selected_tab":"schema/0"},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":5.666666666666667,"y":-5.3}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":9.466666666666667,"y":-5.199999999999999}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OUTPUT","position":{"x":7.733333333333333,"y":-11.966666666666667}},{"type":"ADD_SCHEMA","previous_schema":"schema/1","previously_selected_tab":"schema/1"},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"COMPONENT:schema/0","position":{"x":7.533333333333333,"y":-12.866666666666667}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":6.466666666666667,"y":-6.966666666666667}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":10,"y":-7.266666666666666}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"BULB","position":{"x":7.8,"y":-19.5}},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":0,"output_item":2,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":1,"output_item":3,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0},{"type":"SELECT_SCHEMA","schema":"schema/0","previous_schema":"schema/1"},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OR","position":{"x":7.7,"y":-8.5}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":0,"output_item":4,"output_num":0},{"type":"SELECT_SCHEMA","schema":"schema/1","previous_schema":"schema/0"}];
	var truth_table = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];
	checkTruthTable3(truth_table, "It's just an or gate.", actions, "schema/1", [0, 1], [0], assert);
});

QUnit.test("Another example.", function(assert) {
	var actions = [{"type":"ADD_SCHEMA","previous_schema":"schema/0","previously_selected_tab":"schema/0"},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":5.5,"y":-5.166666666666667}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":9.6,"y":-5.466666666666666}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"AND","position":{"x":7.666666666666667,"y":-9.633333333333333}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OUTPUT","position":{"x":7.533333333333333,"y":-14.5}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":3,"output_num":0},{"type":"ADD_SCHEMA","previous_schema":"schema/1","previously_selected_tab":"schema/1"},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"COMPONENT:schema/0","position":{"x":6.733333333333333,"y":-11.766666666666666}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":5.666666666666667,"y":-5.533333333333333}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":9.033333333333333,"y":-4.499999999999999}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"BULB","position":{"x":6.7,"y":-16.5}},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":0,"output_item":2,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":1,"output_item":3,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":3,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":3,"replay":true},{"type":"SELECT_SCHEMA","schema":"schema/0","previous_schema":"schema/1"},{"actions":[{"schema_id":"schema/0","type":"REMOVE_CONNECTION","input_item":3,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"REMOVE_CONNECTION","input_item":3,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"REMOVE_CONNECTION","input_item":4,"input_num":0,"output_item":3,"output_num":0},{"schema_id":"schema/0","type":"REMOVE_NUMBERED_GATE","number":3,"gate_type":"AND","position":{"x":7.666666666666667,"y":-9.633333333333333}}]},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OR","position":{"x":7.633333333333333,"y":-9.533333333333333}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":5,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":5,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":5,"output_num":0},{"type":"SELECT_SCHEMA","schema":"schema/1","previous_schema":"schema/0"},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true},{"schema_id":"schema/1","type":"MOVE_GATE","item":3,"new_position":{"x":9.033333333333333,"y":-4.533333333333332},"old_position":{"x":9.033333333333333,"y":-4.499999999999999},"replay":true},{"schema_id":"schema/1","type":"MOVE_GATE","item":3,"new_position":{"x":9.033333333333333,"y":-4.5666666666666655},"old_position":{"x":9.033333333333333,"y":-4.533333333333332},"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":3,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":3,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true},{"type":"SWITCH_CLICK","schema_id":"schema/1","item":2,"replay":true}];
	var truth_table = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];
	checkTruthTable3(truth_table, "It's just an or gate.", actions, "schema/1", [0, 1], [0], assert);
});

QUnit.test("Nesting example.", function(assert) {
	var actions = [{"type":"ADD_SCHEMA","previous_schema":"schema/0","previously_selected_tab":"schema/0"},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":5.4,"y":-5.133333333333333}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"INPUT","position":{"x":9.433333333333334,"y":-4.5666666666666655}},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OR","position":{"x":7.933333333333334,"y":-10.166666666666666}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":0,"output_item":1,"output_num":0},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":3,"input_num":1,"output_item":2,"output_num":0},{"schema_id":"schema/0","type":"ADD_GATE","gate_type":"OUTPUT","position":{"x":7.2,"y":-15.666666666666666}},{"schema_id":"schema/0","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":3,"output_num":0},{"type":"ADD_SCHEMA","previous_schema":"schema/1","previously_selected_tab":"schema/1"},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"COMPONENT:schema/0","position":{"x":5.6,"y":-12.733333333333333}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"INPUT","position":{"x":4.533333333333333,"y":-7.233333333333333}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"INPUT","position":{"x":7.466666666666667,"y":-7.599999999999999}},{"schema_id":"schema/1","type":"ADD_GATE","gate_type":"OUTPUT","position":{"x":5.2,"y":-19.1}},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":0,"output_item":2,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":1,"input_num":1,"output_item":3,"output_num":0},{"schema_id":"schema/1","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0},{"type":"ADD_SCHEMA","previous_schema":"schema/2","previously_selected_tab":"schema/2"},{"schema_id":"schema/2","type":"ADD_GATE","gate_type":"COMPONENT:schema/1","position":{"x":6.433333333333334,"y":-13.933333333333334}},{"schema_id":"schema/2","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":5.5,"y":-7.6}},{"schema_id":"schema/2","type":"ADD_GATE","gate_type":"SWITCH","position":{"x":8.566666666666666,"y":-7.033333333333332}},{"schema_id":"schema/2","type":"ADD_GATE","gate_type":"BULB","position":{"x":6.133333333333333,"y":-18.933333333333334}},{"schema_id":"schema/2","type":"ADD_CONNECTION","input_item":1,"input_num":0,"output_item":2,"output_num":0},{"schema_id":"schema/2","type":"ADD_CONNECTION","input_item":1,"input_num":1,"output_item":3,"output_num":0},{"schema_id":"schema/2","type":"ADD_CONNECTION","input_item":4,"input_num":0,"output_item":1,"output_num":0}];
	var truth_table = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]];
	checkTruthTable3(truth_table, "It's just an or gate.", actions, "schema/2", [0, 1], [0], assert);
});