cat underscore.js jquery.js backbone.js LogicSystem.js Geometory.js Items.js SchemaModel.js SchemaDrawer.js SchemaView.js LogicWidget.js Project.js logic.js > all-javascript.js
java -jar closure/compiler.jar --js all-javascript.js --js_output_file logic-compiled.js
