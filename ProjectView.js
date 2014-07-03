var ProjectView = JakeKit.w2tabstack.extend({
	
	initialize: function() {
		JakeKit.w2tabstack.prototype.initialize.call(this);
		this.views = {};
		this.schemas = {};
		_.bindAll(this, "openTab", "schemaNameChanged");
		this.listenTo(this, "viewSelected", this.viewSelected);
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
					//need to select the tab as well
				} else {
					_.each(open_tabs, function(schema_id) {
						var schema = that.schemas.get(schema_id);
						that.openTab(schema);
					});
					var selected_tab = that.data.get("selected_tab");
					if (!selected_tab) {
						selected_tab = open_tabs[0].schema_id;
						this.data.set("selected_tab", selected_tab);
					}
					that.selectTab(that.views[selected_tab]);
				}
				that.schemas.on("change:name", that.schemaNameChanged);
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
		}
	},
	
	selectTab: function(view) {
		this.data.set("selected_tab", view.schema_data.id);
		this.data.save();
		this.makeActive(view);
	},
	
	viewSelected: function(view) {
		this.data.set("selected_tab", view.schema_data.id);
		this.data.save();
	},
	
	activeSchema: function() {
		return this.activeView().schema;
	},
	
	schemaNameChanged: function(schema) {
		this.setCaption(this.views[schema.id], schema.get("name"));
	}
		
});

