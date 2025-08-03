document.addEventListener("DOMContentLoaded", async function () {
  // 1. Get the graph data from storage
  const result = await chrome.storage.local.get(["graphData"]);
  const data = result.graphData || [];

  if (!data || data.length === 0) {
    document.getElementById("network").innerText = "No browsing data yet. Start navigating to build your graph!";
    return;
  }

  // 2. Transform the data for Vis.js
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
  const graphData = {
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
        background: '#97C2FC',
        highlight: {
          border: '#5959FB',
          background: '#D2E5FF'
        }
      }
    },
    edges: {
      width: 2,
      color: {
        color: '#E0E0E2',
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

  // 4. Initialize the Network
  const network = new vis.Network(container, graphData, options);

  // 5. Add event listener for double-clicking nodes
  network.on("doubleClick", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      // The 'id' of our nodes is the URL
      chrome.tabs.create({ url: nodeId });
    }
  });
});

async function findEdgeNodes(){
  //get all nodes from Chrome storage
  var data = (await chrome.storage.local.get(['graphData'])).graphData
  //declare a Set to be filled with the 'self' property of each node
  var nodes = new Set()
  //fill the Set
  for(let dict of data){
      nodes.add(dict['self'])
  }
  //iterate through the Set; if the 'parent' property of a dict in Chrome data is in the Set, remove it from the Set (the removed URL is not an edge node)
  for(let dict of data){
      if(nodes.has(dict['parent'])){
          nodes.delete(dict['parent'])
      }
  }
  return nodes
}

async function suggestURL(siteURL){
  //pretty self explanatory: take in a URL and spit back out a URL to a similar site
  const prompt = `Return the URL of a website that is most similar to the following URL: ${siteURL}.
  The response should be a valid URL only.`;
  const rawResponse = await promptAI(prompt, {
      temperature: 0.2,
      maxOutputTokens: 30,
      fallbackResponse: "google.com"
  });
  return rawResponse; 
}
