// Check if service worker is running properly
async function checkServiceWorkerStatus() {
  try {
    console.log("Checking service worker status...");
    
    const statusElement = document.createElement('div');
    statusElement.style.fontSize = '12px';
    statusElement.style.padding = '5px';
    statusElement.style.marginTop = '10px';
    statusElement.style.color = '#666';
    statusElement.style.border = '1px solid #ddd';
    statusElement.style.borderRadius = '4px';
    statusElement.style.backgroundColor = '#f8f8f8';
    statusElement.textContent = "Checking extension status...";
    document.body.appendChild(statusElement);
    
    // Try to communicate with the service worker
    const response = await chrome.runtime.sendMessage({type: "ping"});
    
    if (response && response.success) {
      console.log("Service worker is active:", response);
      
      statusElement.style.color = 'green';
      statusElement.textContent = "Extension ready ✅";
      
      // Add debug tools in development
      const debugTools = document.createElement('div');
      debugTools.style.marginTop = '10px';
      debugTools.style.fontSize = '12px';
      
      // Create a link to view the data
      const viewDataLink = document.createElement('a');
      viewDataLink.href = '#';
      viewDataLink.textContent = "View browsing data";
      viewDataLink.style.marginRight = '15px';
      viewDataLink.style.color = 'blue';
      viewDataLink.onclick = async (e) => {
        e.preventDefault();
        const result = await chrome.storage.local.get(['graphData']);
        console.log("Current graph data:", result.graphData);
        alert(`Data loaded: ${result.graphData?.length || 0} entries found. Check browser console for details.`);
      };
      
      // Create a link to continue to the graph
      const continueLink = document.createElement('a');
      continueLink.href = '#';
      continueLink.textContent = "Go to graph view";
      continueLink.style.color = 'blue';
      continueLink.onclick = async (e) => {
        e.preventDefault();
        await chrome.storage.local.set({ "welcomed": true });
        window.location.href = "hello.html";
      };
      
      debugTools.appendChild(viewDataLink);
      debugTools.appendChild(continueLink);
      statusElement.appendChild(document.createElement('br'));
      statusElement.appendChild(debugTools);
    } else {
      console.error("Service worker did not respond correctly");
      statusElement.style.color = 'orange';
      statusElement.textContent = "Extension partially initialized ⚠️";
      
      // Add a retry button
      const retryButton = document.createElement('button');
      retryButton.textContent = "Retry connection";
      retryButton.style.marginTop = '10px';
      retryButton.style.padding = '5px 10px';
      retryButton.style.fontSize = '12px';
      retryButton.onclick = () => {
        location.reload();
      };
      statusElement.appendChild(document.createElement('br'));
      statusElement.appendChild(retryButton);
    }
  } catch (error) {
    console.error("Error checking service worker:", error);
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.style.padding = '5px';
    errorElement.textContent = `Service worker error: ${error.message}`;
    document.body.appendChild(errorElement);
  }
}

document.getElementById('beginButton').addEventListener('click', async function () {
  try {
    console.log("Start button clicked");
    await chrome.storage.local.set({ "welcomed": true });
    window.location.href = "hello.html";
  } catch (error) {
    console.error("Error in button click:", error);
    alert("Error: " + error.message);
  }
});

window.onload = async function () {
  try {
    console.log("Page loaded");
    // Check service worker status when page loads
    await checkServiceWorkerStatus();
    
    // Check if user was already welcomed
    var welcomed = await chrome.storage.local.get(["welcomed"]);
    if (welcomed.welcomed) {
      console.log("User already welcomed, redirecting to hello.html");
      window.location.href = "hello.html";
    }
  } catch (error) {
    console.error("Error in page load:", error);
    const errorElement = document.createElement('div');
    errorElement.style.color = 'red';
    errorElement.style.padding = '5px';
    errorElement.textContent = `Error: ${error.message}`;
    document.body.appendChild(errorElement);
  }
}