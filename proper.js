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
    
    // Helper function to export the dictionary
    async function exportDictionary() {
        try {
            // Get the dictionary data
            const result = await chrome.storage.local.get(['graphData']);
            const graphData = result.graphData || [];
            
            // Create a dictionary object with URL keys and name values
            const dictionary = {};
            graphData.forEach(entry => {
                if (entry.self && entry.name) {
                    dictionary[entry.self] = entry.name;
                }
            });
            
            return dictionary;
        } catch (error) {
            console.error("Error exporting dictionary:", error);
            alert("Error exporting dictionary: " + error.message);
            return null;
        }
    }
    
    // Helper function to fix dictionary
    async function makeNames() {
        try {
            // Show progress modal
            showProgressModal("Naming Entries...");
            startProgressTracking();
            
            // Check if the function exists in window context
            if (typeof window.fixDict === 'function') {
                return await window.fixDict();
            } else {
                // Try to access the background script's function
                const backgroundPage = await chrome.runtime.getBackgroundPage();
                if (backgroundPage && typeof backgroundPage.fixDict === 'function') {
                    return await backgroundPage.fixDict();
                } else {
                    hideProgressModal();
                    throw new Error("fixDict function not found anywhere");
                }
            }
        } catch (error) {
            hideProgressModal();
            throw error;
        }
    }
    
    // Get URLs button
    document.getElementById("get_urls").addEventListener('click', async function() {
        try {
            await displayUrlData();
        } catch (error) {
            console.error("Error retrieving data:", error);
            alert("Error retrieving data: " + error.message);
        }
    });
    
    // Clear Storage button
    document.getElementById("clear_storage").addEventListener('click', async function() {
        try {
            await chrome.storage.local.set({
                currentUrl: "",
                tabId: 0,
                graphData: [],
            });
            alert("Storage cleared successfully");
        } catch (error) {
            console.error("Error clearing storage:", error);
            alert("Error clearing storage: " + error.message);
        }
    });
    
    // Fix Dict button
    document.getElementById("fix_dict").addEventListener('click', async function() {
        try {
            await makeNames();
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
            await makeNames();
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
            await makeNames();
            hideProgressModal();
            
            // Then display the raw data
            const entryCount = await displayRawData();
        } catch (error) {
            hideProgressModal();
            console.error("Error in fix_and_show_raw:", error);
            alert("Error: " + error.message);
        }
    });
    
    // Export Dictionary button
    document.getElementById("export_dict").addEventListener('click', async function() {
        try {
            // First fix the dictionary to ensure all entries are named
            await makeNames();
            hideProgressModal();
            
            // Then export the dictionary
            await exportDictionary();
        } catch (error) {
            hideProgressModal();
            console.error("Error in export_dict:", error);
            alert("Error: " + error.message);
        }
    });
});