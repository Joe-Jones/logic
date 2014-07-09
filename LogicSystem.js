"use strict";

var initial_values = {
	"AND": false,
	"OR": false,
	"NOT": true,
	"NAND": true,
	"NOR": true,
	"XOR": false,
	"XNOR": true,
	"SWITCH": false,
	"BULB": false
};

var operations = {
	"AND": function(a, b) {return a && b;},
	"OR": function(a, b) {return a || b;},
	"NOT": function(a, b) {return !a;},
	"NAND": function(a, b) {return !(a && b);},
	"NOR": function(a, b) {return !(a || b);},
	"XOR": function(a, b) {return (a || b) && ! (a && b);},
	"XNOR": function(a, b) {return (a && b) || (!a && !b);},
	"BULB": function(a, b, c) {return a;},
	"SWITCH": function(a, b, c) {return c;},
	"INPUT": function() {return false;},
	"OUTPUT": function() {return false;}
};

function runStep(gates, input_values) {
	var outputs = [];
	for (var i = 0; i < gates.length; i++) {
		var gate = gates[i];
		if (gate) {
			outputs[i] = operations[gate[0]](input_values[gate[1]], input_values[gate[2]], input_values[i]);
		}
	}
	return outputs;
}

function applyToArrays(func, a, b) {
	var output = [];
	for (var i = 0; i < a.length; i++) {
		output[i] = func(a[i], b[i]);
	}
	return output;
}

function any(a) {
	for (var i = 0; i < a.length; i++) {
		if (a[i]) {
			return true;
		}
	}
}

/********************************************************************************************/
function LogicSystem()
/********************************************************************************************/
{
	this.gates = [null];
	this.output_values = [false];
	this.transients = [false];
	this.callbacks = [];
}

LogicSystem.prototype.addGate = function(type) {
	var id = this.gates.length;
	this.gates.push([type, 0, 0]);
	this.output_values[id] = initial_values[type];
	this.transients[id] = initial_values[type];
	return id;
};

LogicSystem.prototype.removeGate = function(id) {
	this.gates[id] = null; 
};

LogicSystem.prototype.makeConnection = function(output_id, input_id, input_number) {
	this.gates[input_id][input_number + 1] = output_id;
};

LogicSystem.prototype.removeConnection = function(input_id, input_number) {
	this.gates[input_id][input_number + 1] = 0;
};

LogicSystem.prototype.registerCallback = function(id, callback) {
	this.callbacks[id] = callback;
};

LogicSystem.prototype.dropCallback = function(id) {
	this.callbacks[id] = null;
};

LogicSystem.prototype.setOutput = function(id, value) {
	this.transients[id] = true;
	this.output_values[id] = value;
};

LogicSystem.prototype.injectTransient = function(id) {
	this.transients[id] = true;
};

LogicSystem.prototype.runStep = function() {
	var old_output_values = this.output_values;
	this.output_values = runStep(this.gates, this.output_values);
	this.transients = applyToArrays(operations["XOR"], this.output_values, old_output_values);
};

LogicSystem.prototype.runCallbacks = function() {
	for (var i = 0; i < this.transients.length; i++) {
		if (this.transients[i] && this.callbacks[i]) {
			this.callbacks[i](this.output_values[i]);
		}
	}
};

LogicSystem.prototype.run = function() {
	while (any(this.transients)) {
		this.runStep();
		this.runCallbacks();
	}
};

LogicSystem.prototype.saveAsTemplate = function() {
	var gate_map = {};
	var inputs = {};
	var outputs = {};
	var counter = 0;
	for (var i = 0; i < this.gates.length; i++) {
		var gate = this.gates[i];
		if (gate) {
			if (gate[0] == "INPUT") {
				inputs[i] = [];
			} else if (gate[0] != "OUTPUT") {
				gate_map[i] = counter;
				counter ++;
			}
		}
	}
	var template = [];
	for (var i = 0; i < this.gates.length; i++) {
		var gate = this.gates[i];
		if (gate) {
			if (gate[0] == "OUTPUT") {
				outputs[i] = gate_map[gate[1]];
			} else if (gate[0] != "INPUT") {
				var gate_to_save = [gate[0], 0, 0]
				for (var input_num = 0; input_num <= 1; input_num++) {
					var connected_to = gate[input_num + 1]; 
					if (inputs[connected_to]) {
						inputs[connected_to].push([gate_map[i], input_num]);
					} else {
						gate_to_save[input_num + 1] = gate_map[gate[input_num + 1]];
					}
				}
				template.push(gate_to_save);
			}
		}
	}
	return {
		"inputs": inputs,
		"output": outputs,
		"gates": template
	};
};

LogicSystem.prototype.addTemplate = function(template) {
	var start_gate = this.gates.length;
	var gate_count = template["gates"].length;
	for (var i = 0; i < gate_count; i++) {
		var gate = template["gates"][i];
		var id = this.addGate(gate[0]);
		for (var j = 1; i <= 2; j++) {
			if (this.gates[id][j]) {
				this.gates[id][j] = gate[j] + start_gate;
			}
		}
	}
	var inputs = {};
	_.each(_.keys(template["inputs"]), function(input_id) {
		inputs[input_id] = _.map(template["inputs"][input_id], function(gate) { return [gate[0] + start_gate, gate[1]]; });
	});
	var outputs = {};
	_.each(_.keys(template["outputs"]), function(output_id) {
		outputs[output_id] = template["outputs"][output_id] + start_gate;
	});
	return {
		inputs: inputs,
		outputs: outputs
	};
};
