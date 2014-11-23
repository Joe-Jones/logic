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
	this.injectTransient(input_id);
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

LogicSystem.prototype.getOutput = function(id) {
	return this.output_values[id];
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

LogicSystem.prototype.run = function(steps) {
	var counter = 0;
	while (any(this.transients) && (counter < steps || !steps)) {
		this.runStep();
		this.runCallbacks();
		counter ++;
	}
};

function copyInto(source, destination) {
	var node_map = {};
	jsnx.forEach(source.nodes_iter(), function(node) {
		var id = _.uniqueId();
		var node_attrs = source.node.get(node);
		if (node_attrs.type && _.contains(["INPUT", "OUTPUT"], node_attrs.type)) {
			node_attrs.from_subcircuit = true;
		}
		destination.add_node(id, node_attrs);
		node_map[node] = id;
	});
	jsnx.forEach(source.edges_iter(), function(edge) {
		var edge_attrs = source.get_edge_data(edge[0], edge[1]);
		destination.add_edge(node_map[edge[0]], node_map[edge[1]], edge_attrs);
	});
}

function mergeNodes(graph, keep, go_away) {
	jsnx.forEach(graph.in_edges(go_away).concat(graph.out_edges(go_away)), function(edge) {
		var edge_attrs = graph.get_edge_data(edge[0], edge[1]);
		if (edge[0] == go_away) {
			graph.add_edge(keep, edge[1], edge_attrs);
		} else {
			graph.add_edge(edge[0], keep, edge_attrs);
		}
	});
	graph.remove_node(go_away);
}

/*
	node is a node in subcircuit. Returns a new graph the same as circuit but with node replaced by subcircuit.
	This makes the assumption that subcircuit is the correct circuit to be replacing node. There is no sanity checking,
	just pass it the right thing.
*/

function replaceNode(circuit, subcircuit, node_to_replace) {
	copyInto(subcircuit, circuit);
	jsnx.forEach(circuit.nodes(), function(node) {
		if (circuit.has_node(node)) {
			var node_attrs = circuit.node.get(node);
			if (node_attrs.type && _.contains(["INPUT", "OUTPUT"], node_attrs.type) && node_attrs.from_subcircuit) {
				// This is an input/output we need to get rid of.
				var marked_connection; // The connection node that is going to go away
				var connections; // The one we're keeping is in here
				if (node_attrs.type == "INPUT") {
					marked_connection = circuit.successors(node)[0];
					connections = circuit.in_edges_iter(node_to_replace)
				} else {
					marked_connection = circuit.predecessors(node)[0];
					connections = circuit.out_edges_iter(node_to_replace)
				}
				var connection; // The one we're going to keep.
				jsnx.forEach(connections, function(edge) {
					var edge_attrs = circuit.get_edge_data(edge[0], edge[1]);
					if (edge_attrs.connect_to == node_attrs.connection_number) {
						connection = (node_attrs.type == "INPUT" ? edge[0] : edge[1]);
					}
				})
				if (marked_connection && connection) {
					mergeNodes(circuit, connection, marked_connection);
				}
				circuit.remove_node(node);
			}
		}
	});
	circuit.remove_node(node_to_replace);
}

function replaceAllSubCircuits(circuit, template_manager) {
	var new_circuit = new jsnx.DiGraph(circuit);
	_.each(new_circuit.nodes(), function(node) {
		var node_attrs = new_circuit.node.get(node);
		if (node_attrs.type == "SUBCIRCIT") {
			replaceNode(new_circuit, template_manager.getFlatGraph(node_attrs.schema_id), node);
		}
	});
	return new_circuit;
}

function buildLogicSystem(graph, schema_model) {
	var logic_system = new LogicSystem();
	var inputs = [];
	var outputs = [];
	var logic_ids = {};
	var connection_nodes = [];
	jsnx.forEach(graph.nodes_iter(), function(node) {
		var node_attrs = graph.node.get(node);
		if (node_attrs.type) {
			logic_ids[node] = logic_system.addGate(node_attrs.type);
			if (node_attrs.type == "SWITCH") {
				inputs.push(node);
			} else if (node_attrs.type == "BULB") {
				outputs.push(node);
			}
		} else {
			connection_nodes.push(node);
		}
	});
	_.each(connection_nodes, function(connection) {
		var from = graph.predecessors(connection)[0];
		jsnx.forEach(graph.successors_iter(connection), function(node) {
			var edge_attrs = graph.get_edge_data(connection, node);
			logic_system.makeConnection(logic_ids[from], logic_ids[node], edge_attrs.connect_to);
		});
	});
	_.each(inputs, function(node) {
		var object = schema_model.getObjectByNumber(node);
		if (object) {
			logic_system.setOutput(logic_ids[node], object.getState());
			object.stateChanged = function(new_state) {
				logic_system.setOutput(logic_ids[node], new_state);
			}
		}
	});
	_.each(outputs, function(node) {
		var object = schema_model.getObjectByNumber(node);
		if (object) {
			logic_system.registerCallback(logic_ids[node], function (new_state) {
				object.setState(new_state);
			});
		}
	});
	return logic_system;
}

