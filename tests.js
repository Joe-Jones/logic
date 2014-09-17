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