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
	}

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
	indexedDB.deleteDatabase(db_name);
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
			project_data.setData("1", "1");
			project_data.setData("2", "2");
			project_data.setData("Hippopotamus", "Is very big.");
			project_data.save().done(function () {
				getDatabase("test_database4").done(function (database) {
					database.loadProjectData("example_project").done(function (project_data) {
						_.each(project_data.getKeys(/.*/), function(key) {
							if (key == "Hippopotamus") {
								assert.equal(project_data.getData(key), "Is very big.", "Yes a Hippopotamus is very big.");
							} else {
								assert.equal(project_data.getData(key), key, key + " is not a Hippopotamus.");
							}
						});
						tidy("test_database4");
					}).fail(function() { assert.ok(false, "could not get the project data"); tidy("test_database4"); });
				}).fail(function() { assert.ok(false, "could not open the database, the second time"); tidy("test_database4"); });
			}).fail(function() { assert.ok(false, "not sane the project data"); QUnit.start();});
		}).fail(function() { assert.ok(false, "could create the project"); QUnit.start();});
	}).fail(function() { assert.ok(false, "could not open the database"); QUnit.start();});
});