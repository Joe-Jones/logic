/********************************************************************************************/
function Point(x, y)
/********************************************************************************************/
{
	if (typeof y == 'undefined') { // Copy Constructor
		this.x = x.x;
		this.y = x.y;
	}
	this.x = x;
	this.y = y;
}

Point.prototype.copy = function() {
    return new Point(this.x, this.y);
};

Point.prototype.minus = function(other) {
	return new Point(this.x - other.x, this.y - other.y);
};

Point.prototype.plus = function(other) {
	return new Point(this.x + other.x, this.y + other.y);
};

Point.prototype.distance = function(other) {
	return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
}

function midPoint(point1, point2) {
	return new Point((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
}

/********************************************************************************************/
function Box(left, top, right, bottom)
/********************************************************************************************/
{
	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;
}

function BoxFromPointAndSize(point, size) {
	return new Box(point.x, point.y, point.x + size.width, point.y + size.height);
}

function smallest(a, b) {
	if (a < b) {
		return a;
	}
	return b;
}

function biggest(a, b) {
	if (a > b) {
		return a;
	}
	return b;
}

function BoxFromTwoPoints(point1, point2)  {
	return new Box(smallest(point1.x, point2.x), smallest(point1.y, point2.y), biggest(point1.x, point2.x), biggest(point1.y, point2.y));
}

function SmallestCoveringBox(box1, box2) {
	return new Box(smallest(box1.left, box2.left), smallest(box1.top, box2.top), biggest(box1.right, box2.right), biggest(box1.bottom, box2.bottom));
}

Box.prototype.topLeft = function() {
	return new Point(this.left, this.top);
};

Box.prototype.bottomRight = function() {
	return new Point(this.right, this.bottom);
};

Box.prototype.topRight = function() {
	return new Point(this.right, this.top);
};

Box.prototype.bottomLeft = function() {
	return new Point(this.left, this.bottom);
};

Box.prototype.pointIn = function(point) {
	return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
};

function inInterval(number, interval) {
	return number >= interval[0] && number <= interval[1];
}

function oneEndpointContainedIn(interval_1, interval_2) {
	return inInterval(interval_1[0], interval_2) || inInterval(interval_1[1], interval_2);
}

function intervalsIntersect(interval_1, interval_2) {
	return oneEndpointContainedIn(interval_1, interval_2) || oneEndpointContainedIn(interval_2, interval_1);
}

Box.prototype.intersects = function(other) {
	return intervalsIntersect([this.top, this.bottom], [other.top, other.bottom]) && intervalsIntersect([this.left, this.right], [other.left, other.right]);
};

Box.prototype.width = function() {
	return Math.abs(this.left - this.right);
};

Box.prototype.height = function() {
	return Math.abs(this.bottom - this.top);
};

Box.prototype.expand = function(amount) {
	var half_amount = amount / 2;
	return new Box(this.left - half_amount, this.top - half_amount, this.right + half_amount, this.bottom + half_amount);
};

