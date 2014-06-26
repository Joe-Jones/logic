var ProjectView = JakeKit.w2tabstack.extend({
	
	initialize: function() {
		JakeKit.w2tabstack.prototype.initialize.call(this);
		this.views = {};
		_.bindAll(this, "openTab");
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
			conditions: { project_id: this.data.id },
			success: function() {
				var open_tabs = that.data.get("open_tabs");
				if (_.size(open_tabs) == 0) {
					that.newTab();
				} else {
					_.each(open_tabs, function(schema_id) {
						var schema = new Schema( {id: schema_id} );
						schema.fetch({ success: that.openTab });
						//that.openTab(schema_id);
					});
				}
			},
			error: function() {
				console.log("error");
				console.log(arguments);
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
		new_schema.save({}, { success: this.openTab });
	},
	
	openTab: function(schema) {
		var new_view = new SchemaView(schema);
		this.views[schema.id] = new_view;
		this.addChild(new_view, schema.get("name"));
		this.makeActive(new_view);
		
		var open_tabs = this.data.get("open_tabs");
		if (! _.contains(open_tabs, schema.id)) {
			this.data.set("open_tabs", open_tabs.concat(new_view.id));
			this.data.save();
		}
	}
		
});

