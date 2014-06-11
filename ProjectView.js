var ProjectView = JakeKit.w2tabstack.extend({
	
	initialize: function(project) {
		JakeKit.w2tabstack.prototype.initialize.call(this);

		this.view1 = new SchemaView();
		this.view2 = new SchemaView();
		this.view3 = new SchemaView();
		
		this.addChild(this.view1, "Scheama 1");
		this.addChild(this.view2, "Scheama 2");
		this.addChild(this.view3, "Scheama 3");
		this.makeActive(this.view1);
	},
		
});

