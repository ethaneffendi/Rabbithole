//document.getDocumentElementById.addEventListener('click', newAlert);

//var aiRecommend = false;
//alert("6");

//graph = (await chrome.storage.local.get(['graph'])).graph

var graph = new Springy.Graph();
const cornflowerBlue = "#5959FB";
const lightGray = "#E0E0E2"; // actually alto

//  var dennis = graph.newNode({label: 'Dennis',ondoubleclick: function(){ alert("Hi"); } });
//  var michael = graph.newNode({label: 'Michael', ondoubleclick: function(){ alert("Hi"); }});
//  var jessica = graph.newNode({label: 'Jessica', ondoubleclick: function(){ alert("Hi"); }});
//  var timothy = graph.newNode({label: 'Timothy', ondoubleclick: function(){ alert("Hi"); }});
//  var barbara = graph.newNode({label: 'Barbara', ondoubleclick: function(){ alert("Hi"); }});
//  var franklin = graph.newNode({label: 'Franklin', ondoubleclick: function(){ alert("Hi"); }});
//  var monty = graph.newNode({label: 'Monty', ondoubleclick: function(){ alert("Hi"); }});
//  var james = graph.newNode({label: 'James', ondoubleclick: function(){ alert("Hi"); }});
//  var bianca = graph.newNode({label: 'Bianca', ondoubleclick: function(){ alert("Hi"); }});

//  graph.newEdge(dennis, michael);
//  graph.newEdge(jessica, barbara);
//  graph.newEdge(michael, timothy);
//  graph.newEdge(franklin, monty);
//  graph.newEdge(dennis, monty);
//  graph.newEdge(monty, james);
//  graph.newEdge(barbara, timothy);
//  graph.newEdge(dennis, bianca);

document.addEventListener("DOMContentLoaded", async function () {
<<<<<<< Updated upstream
  var data = (await chrome.storage.local.get(["graphData"])).graphData;
  var unique_nodes = {};
  var lonely_nodes = new Map();
  for (let node of data) {
    unique_nodes[node["self"]] = graph.newNode({
      label: node["name"],
      ondoubleclick: function () {
        chrome.tabs.create({ url: node['self'] });
      },
    });
    lonely_nodes.set(node["self"], false);
    lonely_nodes.set(
      node["parent"],
      lonely_nodes.has(node["parent"]) ? lonely_nodes.get(node["parent"]) : true
    );
    // unique_nodes[node["parent"]] = graph.newNode({
    //   label: node["parent"],
    //   ondoubleclick: function () {
    //     alert(node["parent"]);
    //   },
    // });
  }

  for (let node of lonely_nodes.keys()) {
    if (lonely_nodes.get(node) == true) {
      unique_nodes[node] = graph.newNode({
        label: "!!!lonely!!! CHECK POPUP.JS",
        ondoubleclick: function () {
          alert(node);
        },
      });
=======
  // Removed API key handling code

  // Global variables to maintain network state
  let currentNetwork = null;
  // Expose for search
  window.currentNetwork = null;
  let currentNodes = null;
  let currentEdges = null;
  let savedPositions = {}; // Store saved positions

  // Initialize the network
  await initializeNetwork();
  
    buildGraphData();

  // Listen for changes to graphData and re-render
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.graphData) {
      console.log('Graph data changed, updating network');
      updateNetwork();
>>>>>>> Stashed changes
    }
  }

  for (let node of data) {
    graph.newEdge(unique_nodes[node["self"]], unique_nodes[node["parent"]], {
      color: lightGray,
    });
  }

  jQuery(function () {
    //alert("2");
    var springy = (window.springy = jQuery("#network").springy({
      graph: graph,
    }));
    /*nodeSelected: function(node){
      alert("3");
    }*/
  });

  minScale = 0.1;
  maxScale = 5;
  zoomSensitivity = 0.1;

  document.getElementById("network").addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY;
      let newScale;
      if (delta > 0) {
        newScale = scale - zoomSensitivity;
      } else {
        newScale = scale + zoomSensitivity;
      }
<<<<<<< Updated upstream
      // Clamp the scale within the min/max bounds
      scale = Math.max(minScale, Math.min(maxScale, newScale));
      //alert(scale);
    },
    { passive: false }
  ); // Important for preventDefault()
=======
      return;
    }

    // Get existing nodes and edges to preserve them
    const existingNodes = new Set(currentNodes.getIds());
    const existingEdges = new Set(currentEdges.getIds());
    
    // Build new graph data incrementally
    const newNodes = [];
    const newEdges = [];
    buildGraphDataIncremental(data, res, existingNodes, existingEdges, newNodes, newEdges);
    
    // Add only new nodes
    if (newNodes.length > 0) {
      currentNodes.add(newNodes);
    }
    
    // Add only new edges
    if (newEdges.length > 0) {
      currentEdges.add(newEdges);
    }
    
    // Restore positions for nodes that have saved positions
    const nodesToUpdate = [];
    currentNodes.forEach((node) => {
      if (savedPositions[node.id]) {
        nodesToUpdate.push({
          id: node.id,
          x: savedPositions[node.id].x,
          y: savedPositions[node.id].y,
          ...node
        });
      }
    });
    
    // Update nodes with preserved positions
    if (nodesToUpdate.length > 0) {
      currentNodes.update(nodesToUpdate);
    }
  }

  function buildGraphData(data, res) {
    const processedUrls = new Set();

    data.forEach((item, index) => {
      // Helper to get favicon URL
      function getFavicon(url) {
        try {
          const domain = new URL(url).hostname;
          return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch {
          return undefined;
        }
      }

      // Helper to shorten title
      function shortTitle(title) {
        if (!title) return "";
        const words = title.split(/\s+/);
        if (words.length > 3) {
          return words.slice(0, 3).join(" ") + "...";
        }
        return title;
      }

      // Add the 'from' node (parent)
      if (item.parent && !processedUrls.has(item.parent)) {
        const nodeTitle = item.parentTitle || item.parentTitle === "" ? item.parentTitle : undefined;
        if (nodeTitle) {
          currentNodes.add({
            id: item.parent,
            label: shortTitle(nodeTitle),
            title: nodeTitle,
            shape: "image",
            image: getFavicon(item.parent)
          });
        }
        processedUrls.add(item.parent);
      }

      // Add the 'to' node (self)
      if (item.self && !processedUrls.has(item.self)) {
        const nodeTitle = item.title || item.name;
        if (nodeTitle) {
          currentNodes.add({
            id: item.self,
            label: shortTitle(nodeTitle),
            title: nodeTitle,
            shape: "image",
            image: getFavicon(item.self)
          });
        }
        processedUrls.add(item.self);
      }
      
      // Add the edge (no self-loops, no cross-domain on tab switch, newtab is always a branch)
      if (
        item.parent && item.self &&
        item.parent !== item.self &&
        !(item.self.includes('chrome://newtab') || item.self.includes('edge://newtab'))
      ) {
        // Only allow edge if same domain or not a tab switch
        let allowEdge = true;
        try {
          const parentDomain = new URL(item.parent).hostname;
          const selfDomain = new URL(item.self).hostname;
          // If this is a tab switch (no navigation, just activation), block cross-domain
          if (item.data === undefined && parentDomain !== selfDomain) {
            allowEdge = false;
          }
        } catch {}
        if (allowEdge) {
          currentEdges.add({
            id: index,
            from: item.parent,
            to: item.self,
            arrows: 'to'
          });
        }
      }
    });
  
  }

  function buildGraphDataIncremental(data, res, existingNodes, existingEdges, newNodes, newEdges) {
    const processedUrls = new Set();

    data.forEach((item, index) => {
      function getFavicon(url) {
        try {
          const domain = new URL(url).hostname;
          return `https://www.google.com/s2/favicons?domain=${domain}`;
        } catch {
          return undefined;
        }
      }

      // Helper to shorten title
      function shortTitle(title) {
        if (!title) return "";
        const words = title.split(/\s+/);
        if (words.length > 3) {
          return words.slice(0, 3).join(" ") + "...";
        }
        return title;
      }

      // Add the 'from' node (parent) only if it doesn't exist
      if (item.parent && !processedUrls.has(item.parent)) {
        if (!existingNodes.has(item.parent)) {
          const nodeTitle = item.parentTitle || item.parentTitle === "" ? item.parentTitle : undefined;
          if (nodeTitle) {
            newNodes.push({
              id: item.parent,
              label: shortTitle(nodeTitle),
              title: nodeTitle,
              shape: "image",
              image: getFavicon(item.parent)
            });
          }
        }
        processedUrls.add(item.parent);
      }

      // Add the 'to' node (self) only if it doesn't exist
      if (item.self && !processedUrls.has(item.self)) {
        if (!existingNodes.has(item.self)) {
          const nodeTitle = item.title || item.name;
          if (nodeTitle) {
            newNodes.push({
              id: item.self,
              label: shortTitle(nodeTitle),
              title: nodeTitle,
              shape: "image",
              image: getFavicon(item.self)
            });
          }
        }
        processedUrls.add(item.self);
      }
      
      // Add the edge only if it doesn't exist (no self-loops, no cross-domain on tab switch, newtab is always a branch)
      if (
        item.parent && item.self &&
        !existingEdges.has(index) &&
        item.parent !== item.self &&
        !(item.self.includes('chrome://newtab') || item.self.includes('edge://newtab'))
      ) {
        let allowEdge = true;
        try {
          const parentDomain = new URL(item.parent).hostname;
          const selfDomain = new URL(item.self).hostname;
          if (item.data === undefined && parentDomain !== selfDomain) {
            allowEdge = false;
          }
        } catch {}
        if (allowEdge) {
          newEdges.push({
            id: index,
            from: item.parent,
            to: item.self,
            arrows: 'to'
          });
        }
      }
    });
  }

  function createNetwork(res) {
    const container = document.getElementById("network");
    const graphDataForVis = {
      nodes: currentNodes,
      edges: currentEdges,
    };

    const options = {
      nodes: {
        shape: "dot",
        size: 16,
        font: {
          size: 14,
          color: "#333"
        },
        borderWidth: 2,
        color: {
          border: '#5959FB',
          background: res.nodeColor || '#97C2FC',
          highlight: {
            border: '#5959FB',
            background: '#D2E5FF'
          }
        }
      },
      edges: {
        width: 2,
        color: {
          color: res.edgeColor || '#919191',
          highlight: '#5959FB'
        }
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -35,
          centralGravity: 0.01,
          springLength: 150,
          springConstant: 0.09,
        },
      },
      interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: false,
      },
    };

    // Create or recreate the network
    if (currentNetwork) {
      currentNetwork.destroy();
    }
    
  currentNetwork = new vis.Network(container, graphDataForVis, options);
  window.currentNetwork = currentNetwork;
      
    // Add event listener for double-clicking nodes to open a new tab
    currentNetwork.on("doubleClick", function (params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        chrome.tabs.create({ url: nodeId });
      }
    });

    // Save node positions after physics stabilization
    currentNetwork.on("stabilizationIterationsDone", function() {
      console.log("Physics simulation completed, saving positions");
      const currentPositions = currentNetwork.getPositions();
      savedPositions = { ...savedPositions, ...currentPositions };
      chrome.storage.local.set({ nodePositions: savedPositions });
    });

    // Also save positions during stabilization (for incremental updates)
    currentNetwork.on("stabilizationProgress", function(params) {
      if (params.iterations % 10 === 0) { // Save every 10 iterations to avoid too many saves
        const currentPositions = currentNetwork.getPositions();
        savedPositions = { ...savedPositions, ...currentPositions };
      }
    });

    // Save positions when user manually moves nodes
    currentNetwork.on("dragEnd", function(params) {
      if (params.nodes.length > 0) {
        const currentPositions = currentNetwork.getPositions(params.nodes);
        savedPositions = { ...savedPositions, ...currentPositions };
        chrome.storage.local.set({ nodePositions: savedPositions });
      }
    });
  }
>>>>>>> Stashed changes
});
