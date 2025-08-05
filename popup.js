// Global variables for graph
let network = null;
const nodes = new vis.DataSet();
const edges = new vis.DataSet();

// --- Function to update graph data ---
async function updateGraphData() {
  const result = await chrome.storage.local.get(["graphData"]);
  const data = result.graphData || [];

  const container = document.getElementById("network");
  if (!data || data.length === 0) {
    if (network) {
      network.destroy();
      network = null;
    }
    container.innerHTML = "No browsing data yet. Start navigating to build your graph!";
    nodes.clear();
    edges.clear();
    return;
  } else {
    // If the container has the message, clear it
    if (container.innerHTML.startsWith("No browsing")) {
        container.innerHTML = "";
    }
  }

  const newNodes = [];
  const newEdges = [];
  const processedUrls = new Set();

  data.forEach((item, index) => {
    if (item.parent && !processedUrls.has(item.parent)) {
      newNodes.push({ id: item.parent, label: item.parent.split('/')[2] || "Start", title: item.parent });
      processedUrls.add(item.parent);
    }
    if (item.self && !processedUrls.has(item.self)) {
      const label = item.name || item.self.split('/')[2] || "Unknown";
      newNodes.push({ id: item.self, label: label, title: item.self });
      processedUrls.add(item.self);
    }
    if (item.parent && item.self) {
      newEdges.push({
        id: index,
        from: item.parent,
        to: item.self,
        arrows: 'to',
        dashes: item.type === 'switch' // Dashed for tab switches
      });
    }
  });

  nodes.clear();
  edges.clear();
  nodes.add(newNodes);
  edges.add(newEdges);
  
  if (network) {
    network.fit(); // Fit the view to the new data
  }
}

// --- Function to initialize or re-initialize the graph ---
async function initializeGraph() {
    if (network) {
        network.destroy();
        network = null;
    }

    const res = await chrome.storage.sync.get(["nodeColor", "edgeColor", "nodeSize", "nodeShape"]);
    const container = document.getElementById("network");
    const graphDataForVis = {
        nodes: nodes,
        edges: edges,
    };

    const options = {
        nodes: {
            shape: res.nodeShape || "dot",
            size: res.nodeSize || 16,
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
            width: 3,
            color: {
                color: res.edgeColor || '#A0A0A0',
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
            hideEdgesOnDrag: true,
        },
    };

    network = new vis.Network(container, graphDataForVis, options);

    network.on("doubleClick", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            chrome.tabs.create({ url: nodeId });
        }
    });

    // Load initial data
    await updateGraphData();
}


// --- Listen for storage changes ---
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.graphData) {
    updateGraphData();
  }
  if (namespace === 'sync') {
    // If any style option changes, re-initialize the whole graph
    initializeGraph();
  }
});

// --- Initial setup ---
document.addEventListener("DOMContentLoaded", initializeGraph);
