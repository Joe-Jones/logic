logic
=====
This is program for the [schematic capture](http://en.wikipedia.org/wiki/Schematic_capture) and
[simulation](http://en.wikipedia.org/wiki/Electronic_circuit_simulation) of digital electronic
circuits built out of [logic gates](http://en.wikipedia.org/wiki/Logic_gate). It is hosted at
[www.digitalschematic.org](http://www.digitalschematic.org/).

This software is a toy. It may be useful for educational purposes but it is certainly not a tool
suitable for professional engineers and probably not engineering students either. You will
hopefully have a lot of fun playing with it though.

In it's current state this software is experimental, data loss is almost guaranteed.
The author is not going to help you recover lost schematics.

###Usage notes

At the moment there is no error handling. You may find yourself looking at a blank screen and no amount or F5 or Ctrl-R will get anything to display. This is because the program is crashing while it reads its data back from disk. If this happens you need to use your browsers developer tools to delete all of the sites local storage.

In Chrome the steps needed are. With the offending blank screen open, press F12, select Resources from along the top of the window that appears. Expand the item called Local Storage, then click on http://www.digitalschematic.org/. Now select the top item in the list on the right and hold down the Delete key until they are all gone. Well done you have deleted all your data. The next time you refresh http://www.digitalschematic.org/ it will be working again.

Improving this situation is the next thing on my to do list.

Licence
-------
The MIT License (MIT)

Copyright (c) 2014 Joe Jones

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

###Note
I have included a number of other files in this reposotory, I am not claiming
copyright on these. The only files I claim copyright on are
* Geometory.js
* jake-kit.js
* logic.html
* LogicSystem.js
* SchemaDrawer.js
* utils.js
* compile.sh
* Items.js
* Jake-Kit-demo.html
* logic.js
* Project.js
* SchemaModel.js
* tests.html
* database.js
* jake-kit.css
* Jake-Kit-demo.js
* logic.css
* logic-compiled.html
* ProjectView.js
* SchemaView.js
* tests.js
* underscore.js

I am going to remove all the files I don't hold copyright on from this reposotory.
