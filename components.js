
function Class(prototype) {
	var proto = {};
	
	if (_.isArray(prototype.parents)) {
		_.each(prototype.parents, function(parent) {
			_.extend(proto, parent.prototype);
		});
	}
	_.extend(proto, prototype);

	var constructor = function() {
		if (_.isFunction(prototype.init)) {
			prototype.init.apply(this, arguments);
		}
	};
	
	constructor.prototype = proto;
	
	return constructor;
}


/*var Parent1 = Class({
		
		f1: function() {
			console.log("f1 called");
		}
		
});

var Parent2 = Class({
		
		parents: [Parent1],
		
		f2: function() {
			console.log("f2 called");
		}
		
});

var Parent3 = Class({
		
		f3: function() {
			console.log("f3 called");
		}
		
});

var Child = Class({
		
		parents: [Parent2, Parent3],
		
		init: function(message) {
			this.message = message;
		},
		
		f4: function() {
			this.f1();
			this.f2();
			this.f3();
			console.log(this.message);
		}
		
});*/

//c = new Child("Hi there");

//c.f4();

/************************************************************************************************************/
		
var Component = Class({
		
	addChild: function(child) {
		this.$el.append(child.$el);
	}
	
})

var Text = Class({
		
	parents: [Component],
		
	init: function(text) {
		this.text = text;
	},
	
	createDOMNode: function() {
		if (_.isString(this.text)) {
			this.$el = $("<div>" + this.text + "</div>");
		} else {
			this.$el = $("<div></div>");
		}
	},
	
	setText: function(text) {
		this.text = text;
		this.$el.html(text);
	}
	
});

var DOMAdapter = Class({
		
	parents: [Component],
		
	init: function(node) {
		this.$el = node;
	}
	
});

var W2Toolbar = Class({
	
	parents: [Component],
	
	init: function(template) {
		this.template = template;
	},
	
	createDOMNode: function() {
		this.$el = $("<div>");
		this.$el.w2toolbar(this.template);
	}
		
});

var W2Layout = Class({
		
	parent: [Component],
	
	init: function(template) {
		this.template = template;
	},
	
	createDOMNode: function() {
		this.$el = $('<div style="height: 400px">');
		
	},
	
	doIt: function() {
		this.$el.w2layout(this.template);
	}
});

/************************************************************************************************************/

//var body = new DOMAdapter($('body'));

//var t = new Text("Hi There");
//t.createDOMNode();
/*	
var menu = new W2Toolbar({
	name: "menu",
	items: [
		{ type: "menu", id: "project_menu", caption: "Project", items: [
			{ text: "New" },
			{ text: "Rename" },
			{ text: "Open" },
			{ text: "Save" }
		]},
		{ type: "menu", id: "sheet_nemu", caption: "Schema", items: [
			{ text: "New" },
			{ text: "Rename" }
]}]});

menu.createDOMNode();



//layout.createDOMNode();
*/
var body, layout;

$(document).ready(function() {
		
	body = new DOMAdapter($('body'));
		
	var pstyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 5px;';
	
	layout = new W2Layout({
        name: 'layout',
        panels: [
            { type: 'top',  size: 50, resizable: true, style: pstyle, content: 'top' },
            { type: 'left', size: 200, resizable: true, style: pstyle, content: 'left' },
            { type: 'main', style: pstyle, content: 'main' },
            { type: 'preview', size: '50%', resizable: true, style: pstyle, content: 'preview' },
            { type: 'right', size: 200, resizable: true, style: pstyle, content: 'right' },
            { type: 'bottom', size: 50, resizable: true, style: pstyle, content: 'bottom' }
        ]
    });
    
    layout.createDOMNode();
	
	body.addChild(layout);
	layout.doIt()
	
	/*$('#myLayout').w2layout({
        name: 'layout',
        panels: [
            { type: 'top',  size: 50, resizable: true, style: pstyle, content: 'top' },
            { type: 'left', size: 200, resizable: true, style: pstyle, content: 'left' },
            { type: 'main', style: pstyle, content: 'main' },
            { type: 'preview', size: '50%', resizable: true, style: pstyle, content: 'preview' },
            { type: 'right', size: 200, resizable: true, style: pstyle, content: 'right' },
            { type: 'bottom', size: 50, resizable: true, style: pstyle, content: 'bottom' }
        ]
    });*/
});
//body.addChild(layout);

