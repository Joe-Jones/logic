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
		body = new Wrapper($('body'));
		
		var pstyle = 'background-color: #F5F6F7; border: 1px solid #dfdfdf; padding: 5px;';
		var layout = new W2Layout({
				name: 'mainLayout',
				panels: [
					//{ type: 'top',  size: 32, resizable: false, style: '', content: 'top' },
					{ type: 'left', size: 75, resizable: false, style: pstyle, content: 'left' },
					{ type: 'main', style: pstyle, content: 'main' },
					/*{ type: 'preview', size: '50%', resizable: true, style: pstyle, content: 'preview' },
					{ type: 'right', size: 200, resizable: true, style: pstyle, content: 'right' },
					{ type: 'bottom', size: 50, resizable: true, style: pstyle, content: 'bottom' }*/]});
		
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
					{ text: "Rename" }]}]});
		
		var pallet = new Pallet();
		
		var sheet = new Sheet();
		var view = new LogicWidget(sheet);
		
		//layout.setChild("top", menu);
		layout.setChild("left", pallet);
		layout.setChild("main", view);
		
		vbox = new VBox();
		
		vbox.addChild(menu);
		vbox.addChild(layout);
		
		body.setChild(vbox);
});
