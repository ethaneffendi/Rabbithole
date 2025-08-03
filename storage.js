// storage.js

// Function to save the graph data to local storage
function saveGraphData(graphData) {
  localStorage.setItem('graphData', JSON.stringify(graphData));
}

// Function to load the graph data from local storage
function loadGraphData() {
  const graphData = localStorage.getItem('graphData');
  return graphData ? JSON.parse(graphData) : null;
}