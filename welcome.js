window.onload = async function () {
  var welcomed = (await chrome.storage.local.get(["welcomed"])).welcomed;
  if (welcomed == true) {
    window.location.href = "hello.html";
    // alert((await chrome.storage.local.get(["welcomed"])).welcomed)
  }
};

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("start").addEventListener("click", async function () {
    // alert("clicked");
    await chrome.storage.local.set({ welcomed: true });
    window.location.href = "hello.html";
  });
});

/* 
		//stuff
		var originalCalculateForces = Springy.Layout.ForceDirected.prototype.calculateForces;
		

		// Override the calculateForces method
		Springy.Layout.ForceDirected.prototype.calculateForces = function () {
			
			// First call the original method for basic spring physics
			originalCalculateForces.call(this);

			// Then add universal repulsion between all nodes
			var that = this;
			var nodePoints = this.nodePoints;
			var nodeIds = Object.keys(nodePoints);
			// Apply repulsion between EVERY pair of nodes
			for (var i = 0; i < nodeIds.length; i++) {
				var node1 = nodePoints[nodeIds[i]];

				for (var j = i + 1; j < nodeIds.length; j++) {
					var node2 = nodePoints[nodeIds[j]];

					// Calculate vector between the nodes
					var delta = node2.p.subtract(node1.p);
					var distance = delta.magnitude();

					// Skip if too far away to matter
					if (distance > repulsionDistance) continue;

					// Avoid division by zero
					if (distance < 0.01) distance = 0.01;

					// Calculate repulsion force - inverse square law
					var direction = delta.normalise();
					var repulsionForce = globalNodeRepulsion / (distance * distance);

					// Apply force to both nodes in opposite directions
					var force = direction.multiply(repulsionForce);
					node2.applyForce(force);
					node1.applyForce(force.multiply(-1));
				}
			} 
        // Also maintain edge tension as in previous code
			this.graph.edges.forEach(function (edge) {
				var source = that.point(edge.source);
				var target = that.point(edge.target);

				if (!source || !target) return;

				var d = target.p.subtract(source.p);
				var displacement = d.magnitude() - (edge.data.length || 80.0);

				if (Math.abs(displacement) > 0.1) {
					var direction = d.normalise();
					var force = direction.multiply(displacement * 0.05); // Adjusted spring force

					// Apply the force to both nodes
					target.applyForce(force.multiply(-1));
					source.applyForce(force);
				}
			});
		};*/