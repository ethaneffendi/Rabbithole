
var scale = 1;
var reverseScale = 1/scale;

(function() {

jQuery.fn.springy = function(params) {
	var graph = this.graph = params.graph || new Springy.Graph();
	var nodeFont = "16px Verdana, sans-serif";
	var edgeFont = "8px Verdana, sans-serif";
	var stiffness = params.stiffness || 400.0;
	var repulsion = params.repulsion || 400.0;
	var damping = params.damping || 0.5;
	var minEnergyThreshold = params.minEnergyThreshold || 0.00001;
	var nodeSelected = params.nodeSelected || null;
	var nodeImages = {};
	var edgeLabelsUpright = true;
	// Define a maximum distance for node interaction
	var maxInteractionDistance = params.maxInteractionDistance || 50.0;
	
	// Track canvas panning state
	var canvasDragging = false;
	var canvasDragStartX = 0;
	var canvasDragStartY = 0;
	var canvasOffset = { x: 0, y: 0 };

	var canvas = this[0];
	var ctx = canvas.getContext("2d");

	var layout = this.layout = new Springy.Layout.ForceDirected(graph, stiffness, repulsion, damping, minEnergyThreshold);

	// calculate bounding box of graph layout.. with ease-in
	var currentBB = layout.getBoundingBox();
	var targetBB = {bottomleft: new Springy.Vector(-2, -2), topright: new Springy.Vector(2, 2)};
	var drawing = 0;
	// auto adjusting bounding box
	Springy.requestAnimationFrame(function adjust() {
		
		targetBB = layout.getBoundingBox();
		// current gets 20% closer to target every iteration
		currentBB = {
			bottomleft: currentBB.bottomleft.add( targetBB.bottomleft.subtract(currentBB.bottomleft)
				.divide(10)),
			topright: currentBB.topright.add( targetBB.topright.subtract(currentBB.topright)
				.divide(10))
		};

		Springy.requestAnimationFrame(adjust);
	});

	// convert to/from screen coordinates
	var toScreen = function(p) {
		var size = currentBB.topright.subtract(currentBB.bottomleft);
		var sx = p.subtract(currentBB.bottomleft).divide(size.x).x * canvas.width + canvasOffset.x;
		var sy = p.subtract(currentBB.bottomleft).divide(size.y).y * canvas.height + canvasOffset.y;
		return new Springy.Vector(sx, sy);
	};

	var fromScreen = function(s) {
		var size = currentBB.topright.subtract(currentBB.bottomleft);
		var px = ((s.x - canvasOffset.x) / canvas.width) * size.x + currentBB.bottomleft.x;
		var py = ((s.y - canvasOffset.y) / canvas.height) * size.y + currentBB.bottomleft.y;
		return new Springy.Vector(px, py);
	};

	// Calculate the canvas center point
	var canvasCenter = function() {
		return {
			x: canvas.width / 2,
			y: canvas.height / 2
		};
	};

	// Transform a screen position according to the current scale
	var transformScreenPosition = function(x, y) {
		var center = canvasCenter();
		// Convert to coordinates relative to center
		var relX = (x - center.x) / scale + center.x;
		var relY = (y - center.y) / scale + center.y;
		return { x: relX, y: relY };
	};

	// Calculate distance between two points
	var calculateDistance = function(point1, point2) {
		var dx = point1.x - point2.x;
		var dy = point1.y - point2.y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	// half-assed drag and drop
	var selected = null;
	var nearest = null;
	var dragged = null;

	jQuery(canvas).mousedown(function(e) {
		var pos = jQuery(this).offset();
		// Transform the mouse position according to scale
		var transformedPos = transformScreenPosition(e.pageX - pos.left, e.pageY - pos.top);
		var p = fromScreen(transformedPos);
		nearest = layout.nearest(p);
		
		// Only select the node if it's within the maximum interaction distance
		var nearestScreenPos = toScreen(nearest.point.p);
		var mouseScreenPos = { x: transformedPos.x, y: transformedPos.y };
		var distance = calculateDistance(nearestScreenPos, mouseScreenPos);
		
		if (distance <= maxInteractionDistance * scale) {
			selected = dragged = nearest;
			
			if (selected.node !== null) {
				dragged.point.m = 10000.0;

				if (nodeSelected) {
					nodeSelected(selected.node);
				}
			}
		} else {
			// Start canvas dragging if we didn't click on a node
			canvasDragging = true;
			canvasDragStartX = e.pageX - pos.left;
			canvasDragStartY = e.pageY - pos.top;
			selected = dragged = null;
		}

		renderer.start();
	});

	// Basic double click handler
	jQuery(canvas).dblclick(function(e) {
		var pos = jQuery(this).offset();
		// Transform the mouse position according to scale
		var transformedPos = transformScreenPosition(e.pageX - pos.left, e.pageY - pos.top);
		var p = fromScreen(transformedPos);
		nearest = layout.nearest(p);
		
		// Only select the node if it's within the maximum interaction distance
		var nearestScreenPos = toScreen(nearest.point.p);
		var mouseScreenPos = { x: transformedPos.x, y: transformedPos.y };
		var distance = calculateDistance(nearestScreenPos, mouseScreenPos);
		
		if (distance <= maxInteractionDistance * scale) {
			selected = nearest;
			node = selected.node;
			if (node && node.data && node.data.ondoubleclick) {
				node.data.ondoubleclick();
			}
		}
	});

	jQuery(canvas).mousemove(function(e) {
		var pos = jQuery(this).offset();
		var mouseX = e.pageX - pos.left;
		var mouseY = e.pageY - pos.top;
		
		if (canvasDragging) {
			// Calculate delta movement and update offset
			var deltaX = mouseX - canvasDragStartX;
			var deltaY = mouseY - canvasDragStartY;
			canvasOffset.x += deltaX;
			canvasOffset.y += deltaY;
			
			// Update drag start point
			canvasDragStartX = mouseX;
			canvasDragStartY = mouseY;
			
			renderer.start();
			return;
		}
		
		// Transform the mouse position according to scale
		var transformedPos = transformScreenPosition(mouseX, mouseY);
		var p = fromScreen(transformedPos);
		nearest = layout.nearest(p);
		
		// Calculate distance to nearest node
		var nearestScreenPos = toScreen(nearest.point.p);
		var mouseScreenPos = { x: transformedPos.x, y: transformedPos.y };
		var distance = calculateDistance(nearestScreenPos, mouseScreenPos);
		
		// If distance is greater than threshold, set nearest to null
		if (distance > maxInteractionDistance * scale) {
			nearest = null;
		}

		if (dragged !== null && dragged.node !== null) {
			dragged.point.p.x = p.x;
			dragged.point.p.y = p.y;
		}

		renderer.start();
	});

	jQuery(window).bind('mouseup',function(e) {
		dragged = null;
		canvasDragging = false;
	});

	var getTextWidth = function(node) {
		var text = (node.data.label !== undefined) ? node.data.label : node.id;
		if (node._width && node._width[text])
			return node._width[text];

		ctx.save();
		ctx.font = (node.data.font !== undefined) ? node.data.font : nodeFont;
		var width = ctx.measureText(text).width;
		ctx.restore();

		node._width || (node._width = {});
		node._width[text] = width;

		return width;
	};

	var getTextHeight = function(node) {
		return 16;
		// In a more modular world, this would actually read the font size, but I think leaving it a constant is sufficient for now.
		// If you change the font size, I'd adjust this too.
	};

	var getImageWidth = function(node) {
		var width = (node.data.image.width !== undefined) ? node.data.image.width : nodeImages[node.data.image.src].object.width;
		return width;
	}

	var getImageHeight = function(node) {
		var height = (node.data.image.height !== undefined) ? node.data.image.height : nodeImages[node.data.image.src].object.height;
		return height;
	}

	Springy.Node.prototype.getHeight = function() {
		var height;
		if (this.data.image == undefined) {
			height = getTextHeight(this);
		} else {
			if (this.data.image.src in nodeImages && nodeImages[this.data.image.src].loaded) {
				height = getImageHeight(this);
			} else {height = 10;}
		}
		return height;
	}

	Springy.Node.prototype.getWidth = function() {
		var width;
		if (this.data.image == undefined) {
			width = getTextWidth(this);
		} else {
			if (this.data.image.src in nodeImages && nodeImages[this.data.image.src].loaded) {
				width = getImageWidth(this);
			} else {width = 10;}
		}
		return width;
	}

	var renderer = this.renderer = new Springy.Renderer(layout,
		function clear() {
			// Clear entire canvas to fix ghost image issue
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		},
		function drawEdge(edge, p1, p2) {
			var x1 = toScreen(p1).x;
			var y1 = toScreen(p1).y;
			var x2 = toScreen(p2).x;
			var y2 = toScreen(p2).y;

			var direction = new Springy.Vector(x2-x1, y2-y1);
			var normal = direction.normal().normalise();

			var from = graph.getEdges(edge.source, edge.target);
			var to = graph.getEdges(edge.target, edge.source);

			var total = from.length + to.length;

			// Figure out edge's position in relation to other edges between the same nodes
			var n = 0;
			for (var i=0; i<from.length; i++) {
				if (from[i].id === edge.id) {
					n = i;
				}
			}

			//change default to  10.0 to allow text fit between edges
			var spacing = 0.0;

			// Figure out how far off center the line should be drawn
			var offset = normal.multiply(-((total - 1) * spacing)/2.0 + (n * spacing));

			var paddingX = 6;
			var paddingY = 6;

			var s1 = toScreen(p1).add(offset);
			var s2 = toScreen(p2).add(offset);

			var boxWidth = edge.target.getWidth() + paddingX;
			var boxHeight = edge.target.getHeight() + paddingY;

			var intersection = intersect_line_box(s1, s2, {x: x2-boxWidth/2.0, y: y2-boxHeight/2.0}, boxWidth, boxHeight);

			if (!intersection) {
				intersection = s2;
			}

			var stroke = (edge.data.color !== undefined) ? edge.data.color : '#000000';

			var arrowWidth;
			var arrowLength;

			var weight = (edge.data.weight !== undefined) ? edge.data.weight : 1.0;

			ctx.lineWidth = Math.max(weight * 2, 0.1);
			arrowWidth = 1 + ctx.lineWidth;
			arrowLength = 8;

			var directional = (edge.data.directional !== undefined) ? edge.data.directional : true;
			directional = false; // purely for this thing we are using

			// line
			var lineEnd;
			if (directional) {
				lineEnd = intersection.subtract(direction.normalise().multiply(arrowLength * 0.5));
			} else {
				lineEnd = s2;
			}

			// Apply center-based scaling for edges
			var center = canvasCenter();
			
			ctx.save();
			ctx.translate(center.x, center.y);
			ctx.scale(scale, scale);
			ctx.translate(-center.x, -center.y);
			
			ctx.strokeStyle = stroke;
			ctx.beginPath();
			ctx.moveTo(s1.x, s1.y);
			ctx.lineTo(lineEnd.x, lineEnd.y);
			ctx.stroke();
			
			// arrow
			if (directional) {
				ctx.fillStyle = stroke;
				ctx.translate(intersection.x, intersection.y);
				ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
				ctx.beginPath();
				ctx.moveTo(-arrowLength, arrowWidth);
				ctx.lineTo(0, 0);
				ctx.lineTo(-arrowLength, -arrowWidth);
				ctx.lineTo(-arrowLength * 0.8, -0);
				ctx.closePath();
				ctx.fill();
				ctx.translate(-intersection.x, -intersection.y); // Restore translation
			}

			// label
			if (edge.data.label !== undefined) {
				text = edge.data.label
				ctx.textAlign = "center";
				ctx.textBaseline = "top";
				ctx.font = (edge.data.font !== undefined) ? edge.data.font : edgeFont;
				ctx.fillStyle = stroke;
				var angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
				var displacement = -8;
				if (edgeLabelsUpright && (angle > Math.PI/2 || angle < -Math.PI/2)) {
					displacement = 8;
					angle += Math.PI;
				}
				var textPos = s1.add(s2).divide(2).add(normal.multiply(displacement));
				
				ctx.save();
				ctx.translate(textPos.x, textPos.y);
				ctx.rotate(angle);
				ctx.fillText(text, 0, -2);
				ctx.restore();
			}
			
			ctx.restore();
		},
		function drawNode(node, p) {
			var s = toScreen(p);
			
			// Apply center-based scaling for nodes
			var center = canvasCenter();
			
			ctx.save();
			ctx.translate(center.x, center.y);
			ctx.scale(scale, scale);
			ctx.translate(-center.x, -center.y);
			
			// Pulled out the padding aspect so that the size functions could be used in multiple places
			// These should probably be settable by the user (and scoped higher) but this suffices for now
			var paddingX = 6;
			var paddingY = 6;

			var contentWidth = node.getWidth();
			var contentHeight = node.getHeight();
			var boxWidth = 100 + paddingX;
			var boxHeight = 100 + paddingY;
			//BRADLEY CHANGE

			// The node radius - scales proportionally with zoom level
			var nodeRadius = boxWidth/8;

			// fill background
			if (selected !== null && selected.node !== null && selected.node.id === node.id) {
				ctx.fillStyle = "#5959FB"; // cornflower blue
			} else if (nearest !== null && nearest.node !== null && nearest.node.id === node.id) {
				ctx.fillStyle = "#5959FB";
			} else {
				ctx.fillStyle = "#5A5A5A"; //gray
			}
			
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(Math.round(s.x), Math.round(s.y), nodeRadius, 0, 2 * Math.PI);//CHECKPOINT
			ctx.stroke();
			ctx.fill();
			
			if (node.data.image == undefined) {	
				ctx.textAlign = "left";
				ctx.textBaseline = "top";
				ctx.font = (node.data.font !== undefined) ? node.data.font : nodeFont;
				ctx.fillStyle = (node.data.color !== undefined) ? node.data.color : "#262627"; //gray
				var text = (node.data.label !== undefined) ? node.data.label : node.id;
				ctx.fillText(text, s.x - contentWidth/2, s.y + nodeRadius*2); // Adjust text position based on node radius
			} else {
				// Currently we just ignore any labels if the image object is set. One might want to extend this logic to allow for both, or other composite nodes.
				var src = node.data.image.src;  // There should probably be a sanity check here too, but un-src-ed images aren't exaclty a disaster.
				if (src in nodeImages) {
					if (nodeImages[src].loaded) {
						// Our image is loaded, so it's safe to draw
						ctx.drawImage(nodeImages[src].object, s.x - contentWidth/2, s.y - contentHeight/2, contentWidth, contentHeight);
					}
				} else {
					// First time seeing an image with this src address, so add it to our set of image objects
					// Note: we index images by their src to avoid making too many duplicates
					nodeImages[src] = {};
					var img = new Image();
					nodeImages[src].object = img;
					img.addEventListener("load", function () {
						// HTMLImageElement objects are very finicky about being used before they are loaded, so we set a flag when it is done
						nodeImages[src].loaded = true;
					});
					img.src = src;
				}
			}
			
			ctx.restore();
		}
	);

	renderer.start();

	// helpers for figuring out where to draw arrows
	function intersect_line_line(p1, p2, p3, p4) {
		var denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));

		// lines are parallel
		if (denom === 0) {
			return false;
		}

		var ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
		var ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;

		if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
			return false;
		}

		return new Springy.Vector(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
	}

	function intersect_line_box(p1, p2, p3, w, h) {
		var tl = {x: p3.x, y: p3.y};
		var tr = {x: p3.x + w, y: p3.y};
		var bl = {x: p3.x, y: p3.y + h};
		var br = {x: p3.x + w, y: p3.y + h};

		var result;
		if (result = intersect_line_line(p1, p2, tl, tr)) { return result; } // top
		if (result = intersect_line_line(p1, p2, tr, br)) { return result; } // right
		if (result = intersect_line_line(p1, p2, br, bl)) { return result; } // bottom
		if (result = intersect_line_line(p1, p2, bl, tl)) { return result; } // left

		return false;
	}
	
	// Reset canvas panning
	this.resetCanvasOffset = function() {
		canvasOffset = { x: 0, y: 0 };
		renderer.start();
	};

	return this;
}

})();