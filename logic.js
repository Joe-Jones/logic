/********************************************************************************************/
function Pallet()
/********************************************************************************************/
{
	
}

function drawGate(canvas, type) {
	var ctx = canvas.getContext("2d");
	ctx.scale(canvas.width, canvas.height);
	ctx.translate(0.5, 0.5);
	ctx.rotate(Math.PI / 2);
	ctx.translate(-0.5, -0.5);
	var gate = makeGate(type)
	gate.draw(ctx);
}

function createPallet() {
	var gate_list = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR", "SWITCH", "BULB", "INPUT", "OUTPUT"];
	
	// Create the elements
	var html = '<table>';
	for (var i = 0; i < gate_list.length; i++) {
		html += '<tr><td><canvas width="30" height="30" draggable="true" id="pallet-item-' + String(i) + '"></canvas></td></tr>'
	}
	html += "</table>";
	document.getElementById("pallet").innerHTML = html;

	//
	function makeEventListener(type) {
		return function (event) {
			event.dataTransfer.setData("Text", type);
			event.dataTransfer.effectAllowed = 'move'; // only allow moves, what the fuck does that even mean?
		}
	}
	for (var i = 0; i < gate_list.length; i++) {
		var canvas = document.getElementById("pallet-item-" + String(i));
		var type = gate_list[i];
		drawGate(canvas, type);
		canvas.addEventListener("dragstart", makeEventListener(type), true);
	}
	
}

//var canvas = document.getElementById("logic_canvas");
//var widget = new LogicWidget(canvas);
//createPallet();
