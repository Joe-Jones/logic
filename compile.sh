cat w2ui.js jake-kit.js database.js LogicSystem.js Geometory.js Items.js SchemaModel.js SchemaDrawer.js SchemaView.js LogicWidget.js Project.js logic.js > all-javascript.js
java -jar closure/compiler.jar --js all-javascript.js --js_output_file logic-compiled.js
