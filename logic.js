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
var MainView = JakeKit.VBox.extend({
/********************************************************************************************/
	
	initialize: function() {
		JakeKit.VBox.prototype.initialize.call(this);
		
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
		
		var project_view = new ProjectView();
	
		hbox = new JakeKit.HBox();
		
		hbox.addChild(pallet);
		hbox.addChild(project_view);
		
		this.addChild(menu);
		this.addChild(hbox);
	},
		
});
	
var body;
$(document).ready(function() {
	body = new JakeKit.Wrapper($('body'));
	main_view = new MainView();
	body.setChild(main_view);
});
