cat w2ui.js jake-kit.js database.js LogicSystem.js Geometory.js Items.js SchemaModel.js SchemaDrawer.js SchemaView.js Project.js ProjectView.js logic.js > all-javascript.js
cat w2ui.css logic.css jake-kit.css > combined.css
java -jar closure/compiler.jar --language_in=ECMASCRIPT5 --js all-javascript.js --js_output_file logic-compiled.js
