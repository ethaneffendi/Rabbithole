// No import statement needed.


let network = null;

// --- Function to render the graph ---
async function renderGraph() {
  const res = await chrome.storage.sync.get(["nodeColor", "edgeColor", "nodeSize", "nodeShape"]);
  const result = await chrome.storage.local.get(["graphData"]);
  const data = result.graphData || [];

  if (!data || data.length === 0) {
    document.getElementById("network").innerText = "No browsing data yet. Start navigating to build your graph!";
    return;
  }

  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const processedUrls = new Set();

  data.forEach((item, index) => {
    if (item.parent && !processedUrls.has(item.parent)) {
      nodes.add({ id: item.parent, label: item.parent.split('/')[2] || "Start", title: item.paret });
      processedUrls.add(item.parent);
    }
    if (item.self && !processedUrls.has(item.self)) {
      const label = item.name || item.self.split('/')[2] || "Unknown";
      nodes.add({ id: item.self, label: label, title: item.self });
      processedUrls.add(item.self);
    }
    if (item.parent && item.self) {
      edges.add({
        id: index,
        from: item.parent,
        to: item.self,
        arrows: 'to'
      });
    }
  });

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
      width: 2,
      color: {
        color: res.edgeColor || '#E0E0E2',
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

  const network = new vis.Network(container, graphDataForVis, options);

  network.on("doubleClick", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      chrome.tabs.create({ url: nodeId });
    }
  });
}

// --- Listen for storage changes and re-render ---
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.graphData) {
    renderGraph();
  }
});

// --- Initial render when the popup opens ---
document.addEventListener("DOMContentLoaded", renderGraph);
