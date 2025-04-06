// Improved error handling
function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  
  // Create error message for display
  let errorMessage = `Error in ${context}: ${error.message}`;
  
  // Show error in console with full details
  console.groupCollapsed("Error Details");
  console.error("Error object:", error);
  console.error("Stack trace:", error.stack);
  console.groupEnd();
  
  // Log error to DOM for debugging popup issues
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.padding = '5px';
  errorDiv.style.margin = '5px';
  errorDiv.style.border = '1px solid red';
  errorDiv.style.borderRadius = '3px';
  errorDiv.style.backgroundColor = '#fff0f0';
  errorDiv.textContent = errorMessage;
  
  // Add a close button to dismiss the error
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.float = 'right';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = 'red';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = function() {
    document.body.removeChild(errorDiv);
  };
  
  errorDiv.insertBefore(closeButton, errorDiv.firstChild);
  document.body.appendChild(errorDiv);
  
  // Hide the loading indicator if it exists
  if (document.getElementById('load-indicator')) {
    document.getElementById('load-indicator').style.display = 'none';
  }
}

//document.getDocumentElementById.addEventListener('click', newAlert);
console.log("Loading popup.js");

var aiRecommend = false;
var graph;

const cornflowerBlue = '#5959FB';
const lightGray = '#E0E0E2'; // actually alto

function newAlert(){
  alert("Hello World");
}

// Function to validate that Springy is properly loaded
function validateSpringyLoaded() {
  try {
    // Check if Springy is defined
    if (typeof Springy === 'undefined') {
      console.error("Springy library is not loaded");
      return false;
    }
    
    // Check if jQuery is loaded
    if (typeof jQuery === 'undefined') {
      console.error("jQuery library is not loaded");
      return false;
    }
    
    // Check if the Springy jQuery plugin is loaded
    if (!jQuery.fn.springy) {
      console.error("Springy jQuery plugin is not loaded");
      return false;
    }
    
    console.log("Springy validation passed - all dependencies loaded");
    return true;
  } catch (error) {
    console.error("Error validating Springy:", error);
    return false;
  }
}

// Initialize an empty graph
function initGraph() {
  try {
    console.log("Initializing graph");
    
    // Validate Springy is properly loaded before proceeding
    if (!validateSpringyLoaded()) {
      const errorMessage = "Required libraries not loaded. Please reload the extension.";
      handleError(new Error(errorMessage), "initGraph");
      
      // Show error in the graph area
      if (document.getElementById('load-indicator')) {
        document.getElementById('load-indicator').style.color = 'red';
        document.getElementById('load-indicator').textContent = errorMessage;
      }
      return;
    }
    
    // Clear any existing graph first
    if (window.springy && window.springy.renderer) {
      console.log("Stopping existing renderer before creating new graph");
      window.springy.renderer.stop();
      // Give time for the renderer to stop completely
      setTimeout(() => {
        // Initialize the graph
        graph = new Springy.Graph();
        
        // Call function to load real data from storage
        loadGraphDataFromStorage();
      }, 100);
    } else {
      // No existing renderer, just create the graph
      // Initialize the graph
      graph = new Springy.Graph();
      
      // Call function to load real data from storage
      loadGraphDataFromStorage();
    }
  } catch (error) {
    handleError(error, "initGraph");
  }
}

// Function to load graph data from Chrome storage
async function loadGraphDataFromStorage() {
  try {
    console.log("Loading graph data from storage");
    const result = await chrome.storage.local.get(['graphData']);
    const graphData = result.graphData || [];
    
    console.log(`Found ${graphData.length} entries in graph data`);
    
    if (graphData.length === 0) {
      console.log("No graph data found");
      // Create an empty graph
      graph = new Springy.Graph();
      renderGraph();
      
      // Hide the loading indicator
      if (document.getElementById('load-indicator')) {
        document.getElementById('load-indicator').textContent = "No browsing data available. Please browse some websites to populate the graph.";
        setTimeout(function() {
          if (document.getElementById('load-indicator')) {
            document.getElementById('load-indicator').style.display = 'none';
          }
        }, 3000);
      }
      return;
    }
    
    // Track nodes by URL to avoid duplicates
    const nodeMap = {};
    
    // First pass: create all nodes
    graphData.forEach((entry, index) => {
      const url = entry.self;
      const name = entry.name || "unnamed";
      
      console.log(`Processing node ${index + 1}: ${name} (${url})`);
      
      if (!nodeMap[url] && url) {
        nodeMap[url] = graph.newNode({
          label: name,
          url: url,
          ondoubleclick: function() { 
            chrome.tabs.create({ url: url });
          }
        });
      }
    });
    
    // Second pass: create edges
    graphData.forEach((entry) => {
      const sourceUrl = entry.self;
      const targetUrl = entry.parent;
      
      // Only create edge if both source and target exist
      if (nodeMap[sourceUrl] && nodeMap[targetUrl]) {
        graph.newEdge(nodeMap[sourceUrl], nodeMap[targetUrl], {
          color: lightGray
        });
      }
    });
    
    // If graph is empty (no valid connections), create an empty graph
    if (graph.nodes.length === 0) {
      console.log("No valid connections found in the data");
      
      // Hide the loading indicator
      if (document.getElementById('load-indicator')) {
        document.getElementById('load-indicator').textContent = "Found data but no valid connections to display.";
        setTimeout(function() {
          if (document.getElementById('load-indicator')) {
            document.getElementById('load-indicator').style.display = 'none';
          }
        }, 3000);
      }
    } else {
      console.log(`Created graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    }
    
    // Initialize springy with the loaded graph
    renderGraph();
    
  } catch (error) {
    handleError(error, "loadGraphDataFromStorage");
    // Create an empty graph on error
    graph = new Springy.Graph();
    renderGraph();
  }
}

// Render the graph with springy
function renderGraph() {
  try {
    console.log("Rendering graph with springy");
    
    // Check if Springy and jQuery are available 
    if (typeof jQuery === 'undefined' || typeof Springy === 'undefined') {
      throw new Error("Required libraries not loaded");
    }
    
    // Clear any existing canvas first
    const canvas = document.getElementById('network');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    jQuery(function(){
      // Fixed node size - we'll use this in our custom node drawing
      var fixedNodeSize = 10;
      
      // Define springy options
      var springyOptions = {
        graph: graph,
        nodeSelected: function(node){
          console.log('Node selected: ' + JSON.stringify(node.data));
          // Re-add URL opening functionality on selection
          if (node.data && node.data.ondoubleclick) {
            // URL will be opened on double-click through the ondoubleclick function
            // that we set during node creation
            console.log('Node has ondoubleclick handler');
          }
        },
        maxInteractionDistance: fixedNodeSize * 3 // Scale the interaction distance with node size
      };
      
      // If we already have an instance, destroy it properly
      if (window.springy && window.springy.renderer) {
        try {
          window.springy.renderer.stop();
          window.springy = null;
        } catch (err) {
          console.error("Error cleaning up previous springy renderer:", err);
        }
      }
      
      // Initialize springy with options
      var springy = window.springy = jQuery('#network').springy(springyOptions);
      
      // Store current scale for zoom operations
      window.graphScale = 1.0;
      
      // Get renderer from springy instance
      var renderer = window.springy.renderer;
      
      // Only override rendering functions if we have a valid renderer
      if (renderer) {
        console.log("Successfully got renderer, overriding node drawing");
        
        // Save original drawNode function for reference
        var originalDrawNode = renderer.drawNode;
        
        // Override drawNode with our version that uses consistent node sizes
        renderer.drawNode = function(node, p) {
          try {
            var s = renderer.toScreen(p);
            
            // Save context state
            ctx.save();
            
            // Draw node (circle)
            ctx.beginPath();
            ctx.arc(s.x, s.y, fixedNodeSize, 0, 2 * Math.PI, false);
            
            // Fill with consistent color
            if (renderer.selected !== null && renderer.selected.node !== null && renderer.selected.node.id === node.id) {
              ctx.fillStyle = '#5959FB'; // cornflower blue for selected node
            } else if (renderer.nearest !== null && renderer.nearest.node !== null && renderer.nearest.node.id === node.id) {
              ctx.fillStyle = '#8080FA'; // lighter blue for hover
            } else {
              ctx.fillStyle = '#5959FB'; // cornflower blue for normal nodes
            }
            ctx.fill();
            
            // Add white border
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            
            // Draw the label if it exists
            if (node.data && node.data.label) {
              var text = node.data.label || node.id;
              ctx.font = '12px Arial';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#000000';
              ctx.fillText(text, s.x, s.y + fixedNodeSize + 12);
            }
            
            // Restore context state
            ctx.restore();
          } catch (err) {
            console.error("Error in custom drawNode:", err);
            // Fall back to original implementation if our custom one fails
            if (originalDrawNode) {
              originalDrawNode(node, p);
            }
          }
        };
      } else {
        console.warn("Could not get renderer to override node drawing");
      }
      
      // Dispatch event when graph is rendered and add zoom controls
      setTimeout(function() {
        // Hide the loading indicator explicitly
        if (document.getElementById('load-indicator')) {
          document.getElementById('load-indicator').style.display = 'none';
        }
        
        // Add zoom controls
        addZoomControls();
        
        // Dispatch custom event
        window.dispatchEvent(new Event('graphRendered'));
      }, 500);
    });
  } catch (error) {
    handleError(error, "renderGraph");
    // Hide loading indicator even if there's an error
    if (document.getElementById('load-indicator')) {
      document.getElementById('load-indicator').style.display = 'none';
    }
  }
}

// Add zoom controls to the graph
function addZoomControls() {
  try {
    // Create container for zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.id = 'zoom-controls';
    zoomControls.style.position = 'absolute';
    zoomControls.style.top = '10px';
    zoomControls.style.right = '10px';
    zoomControls.style.zIndex = '100';
    zoomControls.style.display = 'flex';
    zoomControls.style.flexDirection = 'column';
    zoomControls.style.gap = '5px';
    
    // Create zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = '+';
    zoomInBtn.style.width = '30px';
    zoomInBtn.style.height = '30px';
    zoomInBtn.style.fontSize = '18px';
    zoomInBtn.style.cursor = 'pointer';
    zoomInBtn.style.borderRadius = '50%';
    zoomInBtn.style.border = '1px solid #ccc';
    zoomInBtn.style.backgroundColor = 'white';
    zoomInBtn.title = 'Zoom In';
    zoomInBtn.onclick = function() {
      zoomGraph(0.1); // Zoom in by 10%
    };
    
    // Create zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.style.width = '30px';
    zoomOutBtn.style.height = '30px';
    zoomOutBtn.style.fontSize = '18px';
    zoomOutBtn.style.cursor = 'pointer';
    zoomOutBtn.style.borderRadius = '50%';
    zoomOutBtn.style.border = '1px solid #ccc';
    zoomOutBtn.style.backgroundColor = 'white';
    zoomOutBtn.title = 'Zoom Out';
    zoomOutBtn.onclick = function() {
      zoomGraph(-0.1); // Zoom out by 10%
    };
    
    // Create reset zoom button
    const resetZoomBtn = document.createElement('button');
    resetZoomBtn.textContent = '⟲';
    resetZoomBtn.style.width = '30px';
    resetZoomBtn.style.height = '30px';
    resetZoomBtn.style.fontSize = '16px';
    resetZoomBtn.style.cursor = 'pointer';
    resetZoomBtn.style.borderRadius = '50%';
    resetZoomBtn.style.border = '1px solid #ccc';
    resetZoomBtn.style.backgroundColor = 'white';
    resetZoomBtn.title = 'Reset Zoom';
    resetZoomBtn.onclick = function() {
      window.graphScale = 1.0;
      applyZoom(1.0);
    };
    
    // Add buttons to container
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(resetZoomBtn);
    
    // Add container to canvas parent
    const canvas = document.getElementById('network');
    const canvasParent = canvas.parentElement;
    canvasParent.style.position = 'relative';
    canvasParent.appendChild(zoomControls);
    
    console.log("Zoom controls added");
  } catch (error) {
    handleError(error, "addZoomControls");
  }
}

// Zoom the graph by a specific amount
function zoomGraph(zoomDelta) {
  try {
    // Get current scale
    const currentScale = window.graphScale || 1.0;
    
    // Calculate new scale
    let newScale = currentScale + zoomDelta;
    
    // Clamp scale between min and max values
    newScale = Math.max(0.1, Math.min(5.0, newScale));
    
    // Update stored scale
    window.graphScale = newScale;
    
    // Apply the zoom transformation to the canvas
    applyZoom(newScale);
    
    console.log(`Graph zoomed to scale: ${newScale}`);
  } catch (error) {
    handleError(error, "zoomGraph");
  }
}

// Apply zoom transformation to canvas
function applyZoom(scale) {
  try {
    const canvas = document.getElementById('network');
    if (!canvas) return;
    
    // Get the parent container
    const container = document.getElementById('graph-container') || canvas.parentElement;
    
    // Apply CSS transform for browsers that support it
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'center center';
    
    // For Springy, properly update the scale using our new setScale method
    if (window.springy) {
      try {
        // If setScale method exists (our added method), use it
        if (typeof window.springy.setScale === 'function') {
          console.log(`Setting Springy scale to ${scale} using setScale method`);
          window.springy.setScale(scale);
        } else {
          // Direct access to global scale variable as fallback
          console.log(`Setting Springy scale to ${scale} using global variable`);
          window.scale = scale;
          
          // Force redraw if renderer exists
          if (window.springy.renderer) {
            window.springy.renderer.start();
          }
        }
        
        // For larger scale values, adjust the layout parameters to maintain spacing
        if (window.springy.layout) {
          // Adjust the stiffness and repulsion based on zoom level
          const baseStiffness = 400.0;
          const baseRepulsion = 400.0;
          
          // Scale these parameters inversely with zoom for better visualization
          window.springy.layout.stiffness = baseStiffness * (1/Math.max(0.5, scale));
          window.springy.layout.repulsion = baseRepulsion * (1/Math.max(0.5, scale));
        }
      } catch (e) {
        console.error("Error updating Springy scale:", e);
      }
    }
    
    // Update container styles for proper overflow handling
    if (container) {
      container.style.overflow = 'hidden';
    }
    
    console.log(`Applied zoom scale: ${scale}`);
  } catch (error) {
    handleError(error, "applyZoom");
  }
}

// Initialize graph when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log("DOM content loaded");
    
    // Wait a short time to ensure all scripts are loaded
    setTimeout(function() {
      // Initialize the graph if Springy is loaded properly
      initGraph();
      
      // Set up other event listeners
      setupEventListeners();
    }, 100);
  } catch (error) {
    handleError(error, "DOMContentLoaded");
  }
});

function setupEventListeners() {
  try {
    console.log("Setting up event listeners");
    
    // Handle zooming with mouse wheel
document.getElementById('network').addEventListener('wheel', (event) => {
      event.preventDefault();
      
      // Determine zoom direction from wheel delta
      const zoomDirection = event.deltaY < 0 ? 1 : -1;
      
      // Apply zoom change (smaller increments for smoother zooming)
      const zoomDelta = zoomDirection * 0.05;
      zoomGraph(zoomDelta);
      
    }, { passive: false }); // Important for preventDefault()

    // Handle back button
    document.getElementById('back').addEventListener('click', async function(){
      console.log("Back button clicked");
      await chrome.storage.local.set({ "welcomed": false })
      window.location.href = "index-merge.html";
    });

    // Handle fancy output button for viewing browsing history
    document.getElementById('fancy_output').addEventListener('click', async function(){
      try {
        console.log("Fancy output button clicked");
        
        // First, try the global displayUrlData function
        if (typeof window.displayUrlData === 'function') {
          console.log("Using window.displayUrlData function");
          window.displayUrlData();
        } 
        // Then, try the one from proper.js
        else if (typeof displayUrlData === 'function') {
          console.log("Using local displayUrlData function");
          displayUrlData();
        } 
        // Lastly, use the fallback implementation
        else {
          console.log("Using fallback displayUrlData implementation");
          // Get graph data
          const result = await chrome.storage.local.get(['graphData']);
          const graphData = result.graphData || [];
          
          // Open in a new tab and display the data
          const newWeb = window.open();
          if (newWeb) {
            // Create a more user-friendly display
            newWeb.document.write(`
              <html>
              <head>
                <title>Graph Data</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  h1 { color: #333; }
                  .entry { 
                    margin-bottom: 15px; 
                    padding: 10px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px;
                    background-color: #f9f9f9;
                  }
                  .name { 
                    font-weight: bold; 
                    color: #2c5282;
                    font-size: 18px;
                  }
                  .url { 
                    color: #2b6cb0; 
                    margin: 5px 0;
                    word-break: break-all;
                  }
                  .parent { 
                    color: #718096; 
                    margin-bottom: 10px;
                    word-break: break-all;
                  }
                  .timestamp {
                    color: #718096;
                    font-size: 12px;
                  }
                  .no-data {
                    color: #e53e3e;
                    font-style: italic;
                  }
                </style>
              </head>
              <body>
                <h1>Browsing History (${graphData.length} entries)</h1>
            `);
            
            if (graphData.length === 0) {
              newWeb.document.write('<p class="no-data">No browsing data collected yet.</p>');
  } else {
              // Display each entry with formatting
              graphData.forEach((entry, index) => {
                const date = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time';
                newWeb.document.write(`
                  <div class="entry">
                    <div class="name">${index + 1}. ${entry.name || 'Unnamed page'}</div>
                    <div class="url">URL: ${entry.self || 'Unknown URL'}</div>
                    <div class="parent">Parent: ${entry.parent || 'None'}</div>
                    <div class="timestamp">Visited: ${date}</div>
                  </div>
                `);
              });
            }
            
            newWeb.document.write('</body></html>');
            newWeb.document.close();
          } else {
            alert("Unable to open new window. Please check your popup blocker settings.");
          }
        }
      } catch (error) {
        handleError(error, "fancy_output");
        alert("Error displaying browsing history. Check console for details.");
      }
    });

    // Handle AI recommendation button
    document.getElementById('ai').addEventListener('click', async function() {
      try {
        console.log("AI button clicked");
        // Create a modal to show progress
        const modalHtml = `
          <div id="ai-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 8px; max-width: 80%; text-align: center;">
              <h3>Processing Browse History</h3>
              <p id="ai-status">Analyzing your browsing data and generating recommendations...</p>
              <div style="margin: 15px 0; background: #eee; height: 20px; border-radius: 10px; overflow: hidden;">
                <div id="ai-progress" style="height: 100%; background: #4299e1; width: 10%; transition: width 0.3s;"></div>
              </div>
              <button id="ai-cancel" style="padding: 8px 16px; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
          </div>
        `;
        
        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        // Setup cancel button
        document.getElementById('ai-cancel').addEventListener('click', function() {
          document.body.removeChild(modalContainer);
        });
        
        // Progress animation
        let progress = 10;
        const progressBar = document.getElementById('ai-progress');
        const progressInterval = setInterval(() => {
          progress += 5;
          if (progress > 90) progress = 90;
          progressBar.style.width = `${progress}%`;
        }, 300);
        
        // Set a timeout to automatically close the modal if it takes too long
        const timeoutId = setTimeout(() => {
          if (document.body.contains(modalContainer)) {
            clearInterval(progressInterval);
            document.getElementById('ai-status').textContent = "Operation timed out. Please try again later.";
            progressBar.style.width = '100%';
            progressBar.style.background = '#e53e3e';
            
            // Close the modal after showing the error message
            setTimeout(() => {
              if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
              }
            }, 3000);
          }
        }, 20000); // 20 second timeout
        
        // Call background script to generate AI suggestions
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        
        if (graphData.length === 0) {
          clearInterval(progressInterval);
          clearTimeout(timeoutId);
          document.getElementById('ai-status').innerHTML = `
            No browsing data found.<br>
            <div style="margin-top: 15px; font-size: 14px;">
              To collect data, browse websites with this extension enabled.<br>
              The extension will track pages you visit and build a graph of your browsing history.
            </div>
          `;
          progressBar.style.width = '100%';
          progressBar.style.background = '#e53e3e';
          return;
        }
        
        // Fix missing names if needed
        let needsNaming = false;
        for (const entry of graphData) {
          if (!entry.name || entry.name === "") {
            needsNaming = true;
            break;
          }
        }
        
        if (needsNaming) {
          document.getElementById('ai-status').textContent = "Naming entries with missing titles...";
          try {
            await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({type: "fixDict"}, response => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            });
          } catch (error) {
            console.error("Error fixing dictionary:", error);
            // Continue even if naming fails
          }
        }
        
        // Generate suggestions
        document.getElementById('ai-status').textContent = "Generating AI recommendations based on your browsing...";
        
        // Send message to background.js for AI processing with proper promise handling
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({type: "generateSuggestions"}, response => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(response);
              }
            });
          });
          
          clearInterval(progressInterval);
          clearTimeout(timeoutId);
          
          if (response && response.success) {
            progressBar.style.width = '100%';
            document.getElementById('ai-status').textContent = "Recommendations generated! Refreshing graph...";
            
            // Refresh the graph with new data - use a clean refresh mechanism
            setTimeout(() => {
              if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
              }
              
              // Clean restart of the graph rendering
              if (window.springy && window.springy.renderer) {
                // First stop the current renderer
                window.springy.renderer.stop();
                
                // Clear any references to the old graph
                if (document.getElementById('network')) {
                  const canvas = document.getElementById('network');
                  const ctx = canvas.getContext('2d');
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                // Wait a bit to ensure everything is cleared before restarting
                setTimeout(() => {
                  window.springy = null;
                  initGraph(); // Reload the graph with the new data
                }, 300);
              } else {
                initGraph(); // Reload the graph with the new data
              }
            }, 1000);
          } else {
            progressBar.style.width = '100%';
            progressBar.style.background = '#e53e3e';
            document.getElementById('ai-status').textContent = 
              response?.error 
                ? `Error: ${response.error}` 
                : "Error generating recommendations. Please try again.";
            
            // Close the modal after showing the error message
            setTimeout(() => {
              if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
              }
            }, 3000);
          }
        } catch (error) {
          clearInterval(progressInterval);
          clearTimeout(timeoutId);
          
          progressBar.style.width = '100%';
          progressBar.style.background = '#e53e3e';
          document.getElementById('ai-status').textContent = `Error: ${error.message || "Connection error"}`;
          
          // Close the modal after showing the error message
          setTimeout(() => {
            if (document.body.contains(modalContainer)) {
              document.body.removeChild(modalContainer);
            }
          }, 3000);
        }
        
      } catch (error) {
        handleError(error, "ai_button");
        alert("Error processing AI recommendations: " + error.message);
      }
    });
  } catch (error) {
    handleError(error, "setupEventListeners");
  }
}

// Implement the displayUrlData function if it doesn't exist in proper.js
if (typeof displayUrlData !== 'function') {
  window.displayUrlData = async function() {
    try {
      console.log("Displaying URL data from popup.js");
      const result = await chrome.storage.local.get(['graphData']);
      const graphData = result.graphData || [];
      
      // Open in a new tab and display the data
      const newWeb = window.open();
      if (newWeb) {
        // Create a more user-friendly display
        newWeb.document.write(`
          <html>
          <head>
            <title>Graph Data</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .entry { 
                margin-bottom: 15px; 
                padding: 10px; 
                border: 1px solid #ddd; 
                border-radius: 5px;
                background-color: #f9f9f9;
              }
              .name { 
                font-weight: bold; 
                color: #2c5282;
                font-size: 18px;
              }
              .url { 
                color: #2b6cb0; 
                margin: 5px 0;
                word-break: break-all;
              }
              .parent { 
                color: #718096; 
                margin-bottom: 10px;
                word-break: break-all;
              }
              .timestamp {
                color: #718096;
                font-size: 12px;
              }
              .no-data {
                color: #e53e3e;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <h1>Browsing History (${graphData.length} entries)</h1>
        `);
        
        if (graphData.length === 0) {
          newWeb.document.write('<p class="no-data">No browsing data collected yet.</p>');
        } else {
          // Display each entry with formatting
          graphData.forEach((entry, index) => {
            const date = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time';
            newWeb.document.write(`
              <div class="entry">
                <div class="name">${index + 1}. ${entry.name || 'Unnamed page'}</div>
                <div class="url">URL: ${entry.self || 'Unknown URL'}</div>
                <div class="parent">Parent: ${entry.parent || 'None'}</div>
                <div class="timestamp">Visited: ${date}</div>
              </div>
            `);
          });
        }
        
        newWeb.document.write('</body></html>');
        newWeb.document.close();
      }
      return graphData.length;
    } catch (error) {
      console.error("Error displaying URL data:", error);
      alert("Error displaying browsing history: " + error.message);
      return 0;
    }
  };
}

// Add diagnostic function to help debug Springy issues
function diagnoseSpringyIssues() {
  console.group("Springy Diagnostics");
  
  // Check if main objects exist
  console.log("jQuery exists:", typeof jQuery !== 'undefined');
  console.log("Springy exists:", typeof Springy !== 'undefined');
  
  if (typeof jQuery !== 'undefined') {
    console.log("jQuery version:", jQuery.fn.jquery);
    console.log("jQuery.fn.springy exists:", typeof jQuery.fn.springy !== 'undefined');
  }
  
  // Check if our graph object exists
  console.log("Graph object exists:", typeof graph !== 'undefined');
  
  // Check if springy is initialized
  console.log("window.springy exists:", typeof window.springy !== 'undefined');
  
  if (typeof window.springy !== 'undefined') {
    console.log("window.springy.renderer exists:", typeof window.springy.renderer !== 'undefined');
    console.log("window.springy.setScale exists:", typeof window.springy.setScale === 'function');
    console.log("window.springy.layout exists:", typeof window.springy.layout !== 'undefined');
  }
  
  // Check global scale variable
  console.log("Global scale variable exists:", typeof scale !== 'undefined');
  console.log("Current scale value:", typeof scale !== 'undefined' ? scale : "undefined");
  
  // Check our tracking variable
  console.log("window.graphScale exists:", typeof window.graphScale !== 'undefined');
  console.log("Current graphScale value:", window.graphScale);
  
  console.groupEnd();
  
  return {
    jqueryLoaded: typeof jQuery !== 'undefined',
    springyLoaded: typeof Springy !== 'undefined',
    springyPluginLoaded: typeof jQuery !== 'undefined' && typeof jQuery.fn.springy !== 'undefined',
    graphInitialized: typeof graph !== 'undefined',
    rendererAvailable: typeof window.springy !== 'undefined' && typeof window.springy.renderer !== 'undefined',
    scaleMethodExists: typeof window.springy !== 'undefined' && typeof window.springy.setScale === 'function'
  };
}

// Run diagnostics when graph is rendered
window.addEventListener('graphRendered', function() {
  setTimeout(diagnoseSpringyIssues, 1000);
});




