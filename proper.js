// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup loaded");
    
    // Create a progress modal
    const progressModal = document.createElement('div');
    progressModal.style.display = 'none';
    progressModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); width: 300px; text-align: center;">
                <h3 id="progress-title">Processing...</h3>
                <div style="margin: 15px 0;">
                    <div style="height: 20px; background: #eee; border-radius: 10px; overflow: hidden;">
                        <div id="progress-bar" style="height: 100%; background: #4299e1; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <div id="progress-text" style="margin-top: 10px; font-size: 14px;">Initializing...</div>
                </div>
                <div id="progress-info" style="margin-top: 10px; font-size: 12px; color: #666;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressInfo = document.getElementById('progress-info');
    const progressTitle = document.getElementById('progress-title');
    
    // Function to show progress modal
    function showProgressModal(title = "Processing...") {
        progressTitle.textContent = title;
        progressText.textContent = "Initializing...";
        progressBar.style.width = "0%";
        progressInfo.textContent = "";
        progressModal.style.display = 'block';
    }
    
    // Function to update progress
    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `Processing ${current} of ${total} items (${percent}%)`;
        progressInfo.textContent = `Please wait, this may take some time...`;
    }
    
    // Function to hide progress modal
    function hideProgressModal() {
        progressModal.style.display = 'none';
    }
    
    // Check progress periodically
    let progressInterval = null;
    
    function startProgressTracking() {
        if (progressInterval) clearInterval(progressInterval);
        
        progressInterval = setInterval(async () => {
            try {
                const response = await chrome.runtime.sendMessage({type: "getFixDictProgress"});
                if (response && response.inProgress) {
                    updateProgress(response.processedItems, response.totalItems);
                } else {
                    clearInterval(progressInterval);
                    progressInterval = null;
                    hideProgressModal();
                }
            } catch (error) {
                console.error("Error checking progress:", error);
            }
        }, 500);
    }
    
    // Listen for progress updates from background
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "fixDictProgress") {
            const data = message.data;
            
            if (data.inProgress) {
                if (progressModal.style.display === 'none') {
                    showProgressModal("Naming Entries...");
                }
                updateProgress(data.processedItems, data.totalItems);
            } else {
                hideProgressModal();
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
            }
        }
        return true;
    });
    
<<<<<<< Updated upstream
    // Helper function to display URL data
    async function displayUrlData() {
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
    }
    
    // Helper function to display raw JSON data
    async function displayRawData() {
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        
        // Open in a new tab and display the raw data
        const newWeb = window.open();
        if (newWeb) {
            // Create a display for raw JSON data
            newWeb.document.write(`
                <html>
                <head>
                    <title>Raw Graph Data</title>
                    <style>
                        body { 
                            font-family: monospace; 
                            margin: 20px; 
                            background-color: #f8f9fa;
                        }
                        h1 { 
                            color: #333; 
                            font-family: Arial, sans-serif;
                            margin-bottom: 20px;
                        }
                        pre {
                            background-color: #fff;
                            padding: 15px;
                            border-radius: 5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            overflow: auto;
                            max-height: 80vh;
                            white-space: pre-wrap;
                        }
                        .controls {
                            margin-bottom: 15px;
                        }
                        button {
                            padding: 5px 10px;
                            margin-right: 10px;
                            background-color: #4299e1;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                        }
                        button:hover {
                            background-color: #3182ce;
                        }
                        .no-data {
                            color: #e53e3e;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <h1>Raw Browsing History Data (${graphData.length} entries)</h1>
                    <div class="controls">
                        <button id="copy-btn">Copy to Clipboard</button>
                        <button id="download-btn">Download as JSON</button>
                    </div>
            `);
            
            if (graphData.length === 0) {
                newWeb.document.write('<p class="no-data">No browsing data collected yet.</p>');
            } else {
                // Format the JSON with indentation for readability
                const formattedJson = JSON.stringify(graphData, null, 2);
                newWeb.document.write(`<pre id="json-content">${formattedJson}</pre>`);
                
                // Add script for copy and download functionality
                newWeb.document.write(`
                    <script>
                        document.getElementById('copy-btn').addEventListener('click', function() {
                            const jsonContent = document.getElementById('json-content').textContent;
                            navigator.clipboard.writeText(jsonContent)
                                .then(() => alert('JSON data copied to clipboard!'))
                                .catch(err => alert('Failed to copy: ' + err));
                        });
                        
                        document.getElementById('download-btn').addEventListener('click', function() {
                            const jsonContent = document.getElementById('json-content').textContent;
                            const blob = new Blob([jsonContent], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'rabbithole_data_' + new Date().toISOString().split('T')[0] + '.json';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        });
                    </script>
                `);
            }
            
            newWeb.document.write('</body></html>');
            newWeb.document.close();
        }
        return graphData.length;
    }
    
    // Helper function to fix dictionary
    async function fixDictionary() {
        try {
            // Show progress modal
            showProgressModal("Naming Entries...");
            startProgressTracking();
            
            // Check if the function exists in window context
            if (typeof window.fixDict === 'function') {
                return await window.fixDict();
=======
    // Print Raw List button - outputs pure JSON to a new window
    document.getElementById("print_raw_list").addEventListener('click', async function() {
        try {
            const result = await chrome.storage.local.get(['graphData']);
            const graphData = result.graphData || [];
            
            // Open in a new window
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>Raw List Data</title>
                        <style>
                            body { 
                                font-family: monospace; 
                                margin: 10px; 
                                background-color: #2d2d2d;
                                color: #f8f8f2;
                                white-space: pre;
                                overflow-wrap: normal;
                                overflow-x: auto;
                            }
                            pre {
                                margin: 0;
                            }
                        </style>
                    </head>
                    <body>
                        <pre>${JSON.stringify(graphData, null, 2)}</pre>
                    </body>
                </html>`);
                
                newWindow.document.close();
>>>>>>> Stashed changes
            } else {
                alert("Unable to open new window. Please check your popup blocker settings.");
            }
        } catch (error) {
            console.error("Error displaying raw list:", error);
            alert("Error displaying raw list: " + error.message);
        }
    });
    
    // Print Raw Graph List button - outputs pure JSON to a new window
    document.getElementById("print_raw_graph_list").addEventListener('click', async function() {
        try {
            let graphData = [];
            
            // Get the graph data with suggestions
            if (typeof window.getGraphListData === 'function') {
                graphData = await window.getGraphListData();
            } else {
                const pipeline = await import('./pipeline.js');
                if (pipeline && typeof pipeline.getGraphListData === 'function') {
                    graphData = await pipeline.getGraphListData();
                } else {
                    throw new Error("Graph list function not found");
                }
            }
            
            // Convert Map objects to plain JS objects for JSON serialization
            const serializedData = graphData.map(item => {
                const obj = {};
                for (let [key, value] of item.entries()) {
                    obj[key] = value;
                }
                return obj;
            });
            
            // Open in a new window
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>Raw Graph List Data</title>
                        <style>
                            body { 
                                font-family: monospace; 
                                margin: 10px; 
                                background-color: #2d2d2d;
                                color: #f8f8f2;
                                white-space: pre;
                                overflow-wrap: normal;
                                overflow-x: auto;
                            }
                            pre {
                                margin: 0;
                            }
                        </style>
                    </head>
                    <body>
                        <pre>${JSON.stringify(serializedData, null, 2)}</pre>
                    </body>
                </html>`);
                
                newWindow.document.close();
            } else {
                alert("Unable to open new window. Please check your popup blocker settings.");
            }
        } catch (error) {
            console.error("Error displaying raw graph list:", error);
            alert("Error displaying raw graph list: " + error.message);
        }
    });
    
    // Fancy Output button - opens in a new window
    document.getElementById("fancy_output").addEventListener('click', async function() {
        try {
            let graphData = [];
            
            // Get the graph data with suggestions
            if (typeof window.getGraphListData === 'function') {
                graphData = await window.getGraphListData();
            } else {
                const pipeline = await import('./pipeline.js');
                if (pipeline && typeof pipeline.getGraphListData === 'function') {
                    graphData = await pipeline.getGraphListData();
                } else {
                    throw new Error("Graph list function not found");
                }
            }
            
            // Open in a new window
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                    <head>
                        <title>Fancy Rabbithole Output</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                margin: 20px; 
                                background-color: #f8f9fa;
                            }
                            h1 { 
                                color: #333; 
                                margin-bottom: 20px;
                            }
                            .entry {
                                margin-bottom: 15px;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 5px;
                                background-color: #fff;
                            }
                            .ai-generated {
                                background-color: #ebf8ff;
                                border-color: #90cdf4;
                            }
                            .url {
                                font-weight: bold;
                                color: #2b6cb0;
                                word-break: break-all;
                            }
                            .parent, .name {
                                margin: 5px 0;
                                color: #4a5568;
                            }
                            .ai-badge {
                                display: inline-block;
                                padding: 2px 6px;
                                background-color: #4299e1;
                                color: white;
                                border-radius: 4px;
                                font-size: 12px;
                                margin-left: 5px;
                            }
                            .no-data {
                                color: #e53e3e;
                                font-style: italic;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Fancy Graph View (${graphData.length} entries)</h1>
                `);
                
                if (graphData.length === 0) {
                    newWindow.document.write('<p class="no-data">No graph data available.</p>');
                } else {
                    graphData.forEach((item, index) => {
                        const isAi = item.get('ai');
                        newWindow.document.write(`
                            <div class="entry ${isAi ? 'ai-generated' : ''}">
                                <div class="url">URL: ${item.get('self') || 'Unknown URL'} ${isAi ? '<span class="ai-badge">AI Suggested</span>' : ''}</div>
                                <div class="parent">Parent: ${item.get('parent') || 'None'}</div>
                                <div class="name">Name: ${item.get('name') || 'Unnamed page'}</div>
                            </div>
                        `);
                    });
                }
                
                newWindow.document.write('</body></html>');
                newWindow.document.close();
            } else {
                alert("Unable to open new window. Please check your popup blocker settings.");
            }
        } catch (error) {
            console.error("Error displaying fancy output:", error);
            alert("Error displaying fancy output: " + error.message);
        }
    });
    
    // Delete History button
    document.getElementById("clear_storage").addEventListener('click', async function() {
        try {
            if (confirm("Are you sure you want to delete all browsing history data? This cannot be undone.")) {
                await chrome.storage.local.set({
                    currentUrl: "",
                    tabId: 0,
                    graphData: [],
                });
                alert("Browsing history has been deleted successfully.");
            }
        } catch (error) {
<<<<<<< Updated upstream
            console.error("Error clearing storage:", error);
            alert("Error clearing storage: " + error.message);
        }
    });
    
    // Fix Dict button
    document.getElementById("fix_dict").addEventListener('click', async function() {
        try {
            await fixDictionary();
            hideProgressModal();
            alert("Dictionary fixed successfully");
        } catch (error) {
            console.error("Error in fix_dict:", error);
            alert("Error: " + error.message);
        }
    });
    
    // Fix and Show button (combines both operations)
    document.getElementById("fix_and_show").addEventListener('click', async function() {
        try {
            // First fix the dictionary
            await fixDictionary();
            hideProgressModal();
            
            // Then display the data
            const entryCount = await displayUrlData();
        } catch (error) {
            hideProgressModal();
            console.error("Error in fix_and_show:", error);
            alert("Error: " + error.message);
        }
    });
    
    // Fix and Show Raw button (fix and show raw JSON)
    document.getElementById("fix_and_show_raw").addEventListener('click', async function() {
        try {
            // First fix the dictionary
            await fixDictionary();
            hideProgressModal();
            
            // Then display the raw data
            const entryCount = await displayRawData();
        } catch (error) {
            hideProgressModal();
            console.error("Error in fix_and_show_raw:", error);
            alert("Error: " + error.message);
=======
            console.error("Error deleting history:", error);
            alert("Error deleting history: " + error.message);
>>>>>>> Stashed changes
        }
    });
});