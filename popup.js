// No import statement needed.

document.addEventListener("DOMContentLoaded", async function () {
  // Check for API key first
  const apiKeyResult = await chrome.storage.local.get(['geminiApiKey']);
  const apiKeyPrompt = document.getElementById("api-key-prompt");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveApiKeyBtn = document.getElementById("save-api-key");

  if (!apiKeyResult.geminiApiKey) {
    // Show API key prompt
    apiKeyPrompt.style.display = "block";
    
    // Handle saving API key
    saveApiKeyBtn.addEventListener("click", async () => {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        await chrome.storage.local.set({ geminiApiKey: apiKey });
        apiKeyPrompt.style.display = "none";
        // Reload the page to continue with normal functionality
        window.location.reload();
      } else {
        alert("Please enter a valid API key");
      }
    });

    // Allow Enter key to save
    apiKeyInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        saveApiKeyBtn.click();
      }
    });
    
    return; // Don't continue with graph loading until API key is set
  }

  // Global variables to maintain network state
  let currentNetwork = null;
  let currentNodes = null;
  let currentEdges = null;
  let savedPositions = {}; // Store saved positions

  // Initialize the network
  await initializeNetwork();

  // Listen for changes to graphData and re-render
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.graphData) {
      console.log('Graph data changed, updating network');
      updateNetwork();
    }
  });

  async function initializeNetwork() {
    const res = await chrome.storage.sync.get(["nodeColor", "edgeColor"]);
    const result = await chrome.storage.local.get(["graphData"]);
    const data = result.graphData || [];

    if (!data || data.length === 0) {
      document.getElementById("network").innerText = "No browsing data yet. Start navigating to build your graph!";
      return;
    }

    // Clear the "no data" message
    document.getElementById("network").innerText = "";

    // Load saved positions
    const positionsResult = await chrome.storage.local.get(['nodePositions']);
    savedPositions = positionsResult.nodePositions || {};

    // Create new datasets
    currentNodes = new vis.DataSet();
    currentEdges = new vis.DataSet();
    
    buildGraphData(data, res);
    createNetwork(res);
  }

  async function updateNetwork() {
    if (!currentNetwork || !currentNodes || !currentEdges) {
      // If network doesn't exist, initialize it
      await initializeNetwork();
      return;
    }

    const res = await chrome.storage.sync.get(["nodeColor", "edgeColor"]);
    const result = await chrome.storage.local.get(["graphData"]);
    const data = result.graphData || [];

    if (!data || data.length === 0) {
      document.getElementById("network").innerText = "No browsing data yet. Start navigating to build your graph!";
      if (currentNetwork) {
        currentNetwork.destroy();
        currentNetwork = null;
      }
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
      // Add the 'from' node (parent)
      if (item.parent && !processedUrls.has(item.parent)) {
        currentNodes.add({ 
          id: item.parent, 
          label: item.parent.split('/')[2] || "Start", 
          title: item.parent 
        });
        processedUrls.add(item.parent);
      }

      // Add the 'to' node (self)
      if (item.self && !processedUrls.has(item.self)) {
        const label = item.name || item.self.split('/')[2] || "Unknown";
        currentNodes.add({ 
          id: item.self, 
          label: label, 
          title: item.self 
        });
        processedUrls.add(item.self);
      }
      
      // Add the edge
      if (item.parent && item.self) {
        currentEdges.add({
          id: index,
          from: item.parent,
          to: item.self,
          arrows: 'to'
        });
      }
    });
  }

  function buildGraphDataIncremental(data, res, existingNodes, existingEdges, newNodes, newEdges) {
    const processedUrls = new Set();

    data.forEach((item, index) => {
      // Add the 'from' node (parent) only if it doesn't exist
      if (item.parent && !processedUrls.has(item.parent)) {
        if (!existingNodes.has(item.parent)) {
          newNodes.push({ 
            id: item.parent, 
            label: item.parent.split('/')[2] || "Start", 
            title: item.parent 
          });
        }
        processedUrls.add(item.parent);
      }

      // Add the 'to' node (self) only if it doesn't exist
      if (item.self && !processedUrls.has(item.self)) {
        if (!existingNodes.has(item.self)) {
          const label = item.name || item.self.split('/')[2] || "Unknown";
          newNodes.push({ 
            id: item.self, 
            label: label, 
            title: item.self 
          });
        }
        processedUrls.add(item.self);
      }
      
      // Add the edge only if it doesn't exist
      if (item.parent && item.self && !existingEdges.has(index)) {
        newEdges.push({
          id: index,
          from: item.parent,
          to: item.self,
          arrows: 'to'
        });
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
});
