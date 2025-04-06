// DEBUG LEVEL (0=off, 1=errors only, 2=important info, 3=verbose)
const DEBUG_LEVEL = 1;

// Improved logging functions
function logError(message, ...args) {
    if (DEBUG_LEVEL >= 1) {
        console.error(`❌ ${message}`, ...args);
    }
}

function logInfo(message, ...args) {
    if (DEBUG_LEVEL >= 2) {
        console.log(`ℹ️ ${message}`, ...args);
    }
}

function logVerbose(message, ...args) {
    if (DEBUG_LEVEL >= 3) {
        console.log(`🔍 ${message}`, ...args);
    }
}

logInfo("Initializing pipeline");

/**
 * Generic function to prompt the AI model with a given text
 * @param {string} prompt - The prompt text to send to the AI
 * @param {Object} config - Configuration options for the AI call
 * @returns {Promise<string>} - The AI's response text
 */
async function promptAI(prompt, config = {}) {
    try {
        const apiKey = "AIzaSyBqGJXPR5Gk2oZ9booojsuei8o3f_1Zmgc";
        
        // Default generation config
        const generationConfig = {
            temperature: config.temperature ?? 0.2,
            maxOutputTokens: config.maxOutputTokens ?? 30,
            topP: config.topP ?? 0.95,
            topK: config.topK ?? 40
        };
        
        // Use fetch API to call Gemini
        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: generationConfig
            })
        });
        
        const data = await response.json();
        
        // Check if we got a valid response
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text.trim();
        }
        
        // Handle error cases
        if (data.error) {
            logError("AI API error:", data.error);
            return config.fallbackResponse ?? "error";
        }
        
        return config.fallbackResponse ?? "no response";
    } catch (error) {
        logError("Error in promptAI:", error);
        return config.fallbackResponse ?? "error";
    }
}

/**
 * Generates a topic name for the given content using AI
 * @param {string} contents - The text content to name
 * @returns {Promise<string>} - The generated topic name
 */
async function giveName(contents) {
    try {
        // Improved prompt for better topic extraction
        const betterPrompt = `
            You are a topic extraction expert. Analyze the following text and extract 1-3 words 
            that best represent the main topic or subject. 
            
            Guidelines:
            - Use only lowercase words
            - No punctuation
            - Be specific and descriptive
            - For webpages, focus on the main content topic, not navigation elements
            - Prefer nouns or noun phrases
            - If the content is unclear, use "unknown topic"
            
            Text to analyze:
            ${contents.substring(0, 1000)}
        `;
        
        // Call the AI with our prompt
        const rawResponse = await promptAI(betterPrompt, {
            temperature: 0.2,
            maxOutputTokens: 30,
            fallbackResponse: "unknown topic"
        });
        
        // Clean up response to ensure it's 1-3 words, lowercase, no punctuation
        const cleanedResponse = rawResponse
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(' ')
            .slice(0, 3)
            .join(' ');
            
        return cleanedResponse || "unknown topic";
    } catch (error) {
        logError("Error in giveName:", error);
        return "error";
    }
}

async function giveSuggestion(topic) {
    try{
        const relevantTopic = await promptAI("Return one to three words (no punctuation and all lower case) that name the topic of the following text" + topic);
        const relevantURL = await promptAI("Return the URL (and only the URL) of a credible article about " + relevantTopic);
        return [[relevantTopic, relevantURL]]; // Return as array of arrays to match how it's used in forUI.js
    } catch (error) {
        logError("Error in giveSuggestion:", error);
        return [["error", "error"]]; // Return as array of arrays to match how it's used in forUI.js
    }
}

async function createGraph() {
    try {
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        // Implement graph creation here
        logInfo("Graph data:", graphData.length, "entries");
        return {};
    } catch (error) {
        logError("Error in createGraph:", error);
        return {};
    }
}

// Add progress tracking for dictionary fixing
let fixDictStatus = {
    inProgress: false,
    totalItems: 0,
    processedItems: 0,
    lastProcessedTime: 0
};

// Function to update progress status and notify listeners
function updateFixDictProgress(processed, total, isDone = false) {
    fixDictStatus = {
        inProgress: !isDone,
        totalItems: total,
        processedItems: processed,
        lastProcessedTime: Date.now()
    };
    
    // Dispatch event for popup to listen to
    chrome.runtime.sendMessage({
        type: "fixDictProgress",
        data: fixDictStatus
    }).catch(() => {
        // Ignore errors from no listeners
    });
}

async function fixDict() {
    try {
        logInfo("Fixing dictionary data");
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        
        // Initialize progress
        updateFixDictProgress(0, graphData.length);
        
        logInfo(`Processing ${graphData.length} entries for naming`);
        
        // Create a new array to hold the updated items
        const updatedGraphData = [];
        
        for (let i = 0; i < graphData.length; i++) {
            const item = graphData[i];
            logVerbose(`Processing item ${i+1}/${graphData.length}: ${item.self}`);
            
            // Update progress
            updateFixDictProgress(i, graphData.length);
            
            // Skip items that already have a name
            if (item.name) {
                logVerbose(`Item ${i+1} already has name: ${item.name}`);
                updatedGraphData.push(item);
                continue;
            }
            
            // Get name from data
            const contentText = item.data || "";
            // Use a shorter text sample to avoid API limits
            const textSample = contentText.substring(0, 1000);
            const name = await giveName(textSample);
            
            // Create a new object with all existing properties plus the name
            const updatedItem = {
                ...item,
                name: name
            };
            
            // For debugging
            logInfo(`Named item ${i+1}: "${name}"`);
            
            // Add to our updated array
            updatedGraphData.push(updatedItem);
            
            // Optional: clear data to save storage
            updatedItem.data = "";
        }
        
        // Save the updated data
        await chrome.storage.local.set({
            graphData: updatedGraphData
        });
        
        // Update progress as complete
        updateFixDictProgress(graphData.length, graphData.length, true);
        
        logInfo("Dictionary fixed successfully");
        return true;
    } catch (error) {
        logError("Error in fixDict:", error);
        // Update progress as complete with error
        updateFixDictProgress(0, 0, true);
        return false;
    }
}

// Listen for progress requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "getFixDictProgress") {
        sendResponse(fixDictStatus);
        return true;
    }
});

logInfo("Pipeline module loaded");
// Expose the functions to the window object
window.fixDict = fixDict;
<<<<<<< Updated upstream
window.createGraph = createGraph;

// Also expose for module contexts
export { fixDict, createGraph, giveName };
=======
window.printGraphList = printGraphList;
window.getGraphListData = getGraphListData;
window.createGraphList = async function() {
    try {
        const data = await getGraphListData();
        
        // Print the graph list
        console.log("=== Graph List with Suggestions ===");
        console.log(`Total Entries: ${data.length}`);
        
        data.forEach((item, index) => {
            console.log(`Graph Item ${index + 1}:`);
            console.log(`- Self: ${item.get('self')}`);
            console.log(`- Parent: ${item.get('parent')}`);
            console.log(`- Name: ${item.get('name')}`);
            console.log(`- AI Generated: ${item.get('ai') || false}`);
        });
        
        return data;
    } catch (error) {
        logError("Error in createGraphList:", error);
        return [];
    }
};

// Helper function for getSuggestions to match forUI.js
async function getSuggestions(list) {
    try {
        // Find edges (nodes without parents)
        const nodeSet = new Set();
        for (const node of list) {
            nodeSet.add(node.get('self'));
        }
        
        for (const node of list) {
            if (nodeSet.has(node.get('parent'))) {
                nodeSet.delete(node.get('parent'));
            }
        }
        
        // Map child URLs to names
        const childrenMap = new Map();
        for (const child of nodeSet) {
            for (const potentialMatch of list) {
                if (child === potentialMatch.get('self')) {
                    childrenMap.set(child, potentialMatch.get('name'));
                }
            }
        }
        
        // Get suggestions for each child
        for (const child of childrenMap.keys()) {
            const suggestion = await giveSuggestion(childrenMap.get(child));
            for (const suggest in suggestion) {
                const tempMap = new Map();
                tempMap.set("parent", "child");
                tempMap.set("self", suggestion[suggest][1]);
                tempMap.set("name", suggestion[suggest][0]);
                tempMap.set("ai", true);
                list.push(tempMap);
            }
        }
        
        return list;
    } catch (error) {
        logError("Error in getSuggestions:", error);
        return list;
    }
}

/**
 * Exports the list of browsing history data formatted for the graph visualization
 * @returns {Promise<Array>} - The list of graph nodes
 */
async function exportList() {
    try {
        logInfo("Exporting graph data list");
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        
        // Convert the array of objects to array of Maps to match forUI.js expectations
        const formattedList = graphData.map(item => {
            const mapItem = new Map();
            mapItem.set('self', item.self || '');
            mapItem.set('parent', item.parent || '');
            mapItem.set('name', item.name || '');
            return mapItem;
        });
        
        return formattedList;
    } catch (error) {
        logError("Error in exportList:", error);
        return [];
    }
}

/**
 * Prints the raw graph list data to console
 * @returns {Promise<boolean>} - Success status
 */
async function printGraphList() {
    try {
        const list = await exportList();
        console.log("Raw Graph List Data:");
        list.forEach((item, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`- Self: ${item.get('self')}`);
            console.log(`- Parent: ${item.get('parent')}`);
            console.log(`- Name: ${item.get('name')}`);
        });
        return true;
    } catch (error) {
        logError("Error in printGraphList:", error);
        return false;
    }
}

// Make names wrapper to match forUI.js expectations
async function makeNames() {
    try {
        await fixDict();
        return true;
    } catch (error) {
        logError("Error in makeNames:", error);
        return false;
    }
}

/**
 * Gets the graph list data with AI suggestions for display
 * @returns {Promise<Array>} - The list of graph nodes with suggestions
 */
async function getGraphListData() {
    try {
        await makeNames();
        const list = await exportList();
        
        // Mark all items as not AI-generated
        list.forEach(item => {
            item.set('ai', false);
        });
        
        // Get suggestions
        const updatedList = await getSuggestions(list);
        return updatedList;
    } catch (error) {
        logError("Error in getGraphListData:", error);
        return [];
    }
}

// Also expose for module contexts
export { fixDict, giveName, promptAI, giveSuggestion, exportList, makeNames, printGraphList, getGraphListData };
>>>>>>> Stashed changes
