// No import statement needed.

document.addEventListener("DOMContentLoaded", async function () {
  const res = await chrome.storage.sync.get(["nodeColor", "edgeColor"]);
  // 1. Get the "source of truth" graph data directly from chrome.storage.
  // This is the correct way to "load" the data.
  const result = await chrome.storage.local.get(["graphData"]);
  const data = result.graphData || [];

  if (!data || data.length === 0) {
    document.getElementById("network").innerText = "No browsing data yet. Start navigating to build your graph!";
    return;
  }

  // 2. Transform the raw data for Vis.js (this part was already good)
  const nodes = new vis.DataSet();
  const edges = new vis.DataSet();
  const processedUrls = new Set();

  data.forEach((item, index) => {
    // Add the 'from' node (parent)
    if (item.parent && !processedUrls.has(item.parent)) {
      nodes.add({ id: item.parent, label: item.parent.split('/')[2] || "Start", title: item.parent });
      processedUrls.add(item.parent);
    }

    // Add the 'to' node (self)
    if (item.self && !processedUrls.has(item.self)) {
      const label = item.name || item.self.split('/')[2] || "Unknown";
      nodes.add({ id: item.self, label: label, title: item.self });
      processedUrls.add(item.self);
    }
    
    // Add the edge
    if (item.parent && item.self) {
      edges.add({
        id: index,
        from: item.parent,
        to: item.self,
        arrows: 'to'
      });
    }
  });

  // 3. Setup Vis.js Network
  const container = document.getElementById("network");
  const graphDataForVis = {
    nodes: nodes,
    edges: edges,
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

  // 4. Initialize the Network
  const network = new vis.Network(container, graphDataForVis, options);
    
  // NOTE: The network.on("afterDrawing", ...) block has been removed.
  // The popup should NOT be saving data. Only the backend writes data.
  
  // 5. Add event listener for double-clicking nodes to open a new tab
  network.on("doubleClick", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      // The 'id' of our nodes is the URL
      chrome.tabs.create({ url: nodeId });
    }
  });

  // NOTE: The findEdgeNodes and suggestURL functions are not called here.
  // They should be triggered by a user action (like a button click) if you
  // want to use them in the UI.
});
