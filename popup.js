// Global variables for graph
let network = null;
const nodes = new vis.DataSet();
const edges = new vis.DataSet();

// --- Helper function to generate a label from a URL ---
function getLabelFromUrl(url, defaultLabel = "Unknown") {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '') || defaultLabel;
    } catch (e) {
        return defaultLabel;
    }
}

// --- Function to update graph data ---
async function updateGraphData() {
    const { graphData = [] } = await chrome.storage.local.get("graphData");
    const container = document.getElementById("network");

    if (graphData.length === 0) {
        if (network) {
            network.destroy();
            network = null;
        }
        container.innerHTML = "No browsing data yet. Start navigating to build your graph!";
        nodes.clear();
        edges.clear();
        return;
    } else if (container.innerHTML.startsWith("No browsing")) {
        container.innerHTML = "";
    }
    
    if (!network) {
        initializeGraph();
        return; // initializeGraph will call updateGraphData again
    }

    const newNodes = new Map();
    const newEdges = new Map();

    graphData.forEach((item, index) => {
        if (item.parent) {
            if (!newNodes.has(item.parent)) {
                newNodes.set(item.parent, { id: item.parent, label: getLabelFromUrl(item.parent, "Start"), title: item.parent });
            }
        }
        if (item.self) {
            if (!newNodes.has(item.self)) {
                const label = item.name || getLabelFromUrl(item.self);
                newNodes.set(item.self, { id: item.self, label: label, title: item.self });
            }
        }
        if (item.parent && item.self) {
            newEdges.set(index, {
                id: index,
                from: item.parent,
                to: item.self,
                arrows: 'to',
                dashes: item.type === 'switch'
            });
        }
    });

    // Differential update for nodes
    const existingNodeIds = new Set(nodes.getIds());
    const newNodesMap = new Map(newNodes.entries());

    existingNodeIds.forEach(id => {
        if (!newNodesMap.has(id)) {
            nodes.remove(id);
        }
    });
    newNodesMap.forEach((node, id) => {
        if (!existingNodeIds.has(id)) {
            nodes.add(node);
        }
    });

    // Differential update for edges
    const existingEdgeIds = new Set(edges.getIds());
    const newEdgesMap = new Map(newEdges.entries());
    
    existingEdgeIds.forEach(id => {
        if (!newEdgesMap.has(id)) {
            edges.remove(id);
        }
    });
    newEdgesMap.forEach((edge, id) => {
        if (!existingEdgeIds.has(id)) {
            edges.add(edge);
        }
    });

    if (network) {
        network.fit();
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

// --- Function to search for nodes ---
function searchNodes() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (!searchTerm) {
        // If search is cleared, reset selection
        network.unselectAll();
        return;
    }

    const matchedNodes = nodes.get({
        filter: function (item) {
            return item.label.toLowerCase().includes(searchTerm) || item.title.toLowerCase().includes(searchTerm);
        }
    });

    if (matchedNodes.length > 0) {
        network.selectNodes(matchedNodes.map(node => node.id));
        network.focus(matchedNodes[0].id, { scale: 1.5 });
    } else {
        network.unselectAll();
    }
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
document.addEventListener("DOMContentLoaded", () => {
    initializeGraph();
    document.getElementById('search-button').addEventListener('click', searchNodes);
    document.getElementById('search-input').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchNodes();
        }
    });
});
