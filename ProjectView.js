var ProjectView = JakeKit.w2tabstack.extend({
	
	initialize: function() {
		JakeKit.w2tabstack.prototype.initialize.call(this);
		this.views = {};
		_.bindAll(this, "openTab");

		//this.view1 = new SchemaView();
		//this.view2 = new SchemaView();
		//this.view3 = new SchemaView();
		
		//this.addChild(this.view1, "Scheama 1");
		//this.addChild(this.view2, "Scheama 2");
		//this.addChild(this.view3, "Scheama 3");
		//this.makeActive(this.view1);
	},
	
	setProject: function(project) {
		var that = this;
		
		// Get rid of any existing views
		_.each(this.views, function(view, id) {
			this.removeChild(view);
		});
		this.views = {};
		
		this.data = project;
		
		this.schemas = new SchemaList();
		this.schemas.fetch({
			conditions: { projectid: this.data.id },
			success: function() {
				var open_tabs = that.data.get("open_tabs");
				if (_.size(open_tabs) == 0) {
					that.newSchema();
				} else {
					_.each(open_tabs, function(schema_id) {
						that.openTab(schema_id);
					});
				}
			}
		});
		
	},
	
	newTab: function() {
		var new_schema = new Schema({
			project_id:			this.data.id,
			contains:			[],
			contains_recursive:	[],
			name:				"New Schema"
		});
		new_schema.save({}, success: this.openTab);
		this
	},
	
	openTab: function(schema) {
	
	}
		
});

