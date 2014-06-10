/********************************************************************************************/
Pallet = Backbone.View.extend({
/********************************************************************************************/

	tag: "div",

	initialize: function() {
		
	},
	
	render: function() {
		
		var gate_list = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "SWITCH", "BULB", "INPUT", "OUTPUT"];
		
		// Create the elements
		var html = '<table>';
		for (var i = 0; i < gate_list.length; i++) {
			html += '<tr><td><canvas width="30" height="30" draggable="true" id="pallet-item-' + String(i) + '"></canvas></td></tr>'
		}
		html += "</table>";
		this.$el.html(html);
		
		//
		function makeEventListener(type) {
			return function (event) {
				event.dataTransfer.setData("Text", type);
				event.dataTransfer.effectAllowed = 'move'; // only allow moves, what the fuck does that even mean?
			}
		}
		for (var i = 0; i < gate_list.length; i++) {
			var canvas = this.$("#pallet-item-" + String(i))[0];
			var type = gate_list[i];
			this.drawGate(canvas, type);
			canvas.addEventListener("dragstart", makeEventListener(type), true);
		}
	},
	
	drawGate: function(canvas, type) {
		var ctx = canvas.getContext("2d");
		ctx.scale(canvas.width, canvas.height);
		ctx.translate(0.5, 0.5);
		ctx.rotate(Math.PI / 2);
		ctx.translate(-0.5, -0.5);
		var gate = makeGate(type)
		gate.draw(ctx);
	}
	
});

/********************************************************************************************/
var MainView = Backbone.View.extend({
/********************************************************************************************/
		
	tagName: 'body',
	
	el: $('body'),
	
	initialize: function() {
		this.menu = new Menu(main_menu);
		this.render();
	},
	
	render: function() {
		var html = 	"<table><tr><td id='main_menu'></td></tr><table>" +
					"<div id='pallet' class='layout'></div>" +
					'<div id="project_div" class="layout"></div>';
		this.$el.html(html);
		createPallet();
		this.$el.find("#main_menu").replaceWith(this.menu.$el);
		return this;
	}
		
});
	
var body;
$(document).ready(function() {
	body = new JakeKit.Wrapper($('body'));

	var menu = new JakeKit.w2toolbar([
			{ type: "menu", id: "project_menu", caption: "Project", items: [
				{ text: "New" },
				{ text: "Rename" },
				{ text: "Open" },
				{ text: "Save" }
			]},
			{ type: "menu", id: "sheet_nemu", caption: "Schema", items: [
				{ text: "New" },
				{ text: "Rename" }]}]);
	
	var pallet = new Pallet();
	
	view1 = new SchemaView();
	view2 = new SchemaView();
	view3 = new SchemaView();
	
	var tabs = new JakeKit.w2tabstack();
	tabs.addChild(view1, "Scheama 1");
	tabs.addChild(view2, "Scheama 2");
	tabs.addChild(view3, "Scheama 3");
	tabs.makeActive(view1);
	
	//stack = new JakeKit.Stack();
	//stack.addChild(view1);
	//stack.addChild(view2);
	//stack.addChild(view3);
	//stack.makeActive(view1);
	
	vbox = new JakeKit.VBox();
	hbox = new JakeKit.HBox();
	
	hbox.addChild(pallet);
	hbox.addChild(tabs);
	//hbox.addChild(view1);
	
	vbox.addChild(menu);
	vbox.addChild(hbox);
	
	body.setChild(vbox);
});
