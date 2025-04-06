// Background service worker initialization
console.log("🚀 Rabbithole background service worker starting...");

// Global debug level (0=off, 1=errors only, 2=important info, 3=verbose)
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

// Import functionality from pipeline for AI operations
// We need to manually define the function since we can't import in service workers with MV3
// This will be kept in sync with pipeline.js

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

async function getCurrentTabId() {
    return new Promise(resolve => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => resolve(tabs[0]?.id));
    });
}

async function getInnerTextForTab(tabId) {
    try {
        // Check if we can access this tab
        const tab = await chrome.tabs.get(tabId);
        
        // Skip getting content for extension and chrome pages
        if (tab.url.startsWith('chrome://') || 
            tab.url.startsWith('chrome-extension://') || 
            tab.url === 'about:blank') {
            logVerbose(`Skipping content extraction for restricted URL: ${tab.url}`);
            return "";
        }
        
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => document.body.innerText, // Function to execute in the target tab
        });

        // Results is an array of InjectionResult objects
        // For a single frame injection, we expect one result
        if (results && results[0] && results[0].result) {
            const innerText = results[0].result;
            return innerText; // Return the text
        } else {
            logInfo("Could not retrieve innerText. Result:", results);
            return null;
        }
    } catch (error) {
        logError(`Failed to execute script in tab ${tabId}: ${error}`);
        // Handle errors, e.g., tab closed, no permission, page not loaded yet
        return null;
    }
}

class TabEventProcessor {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async enqueue(eventType, data, parent) {
        return new Promise((resolve, reject) => {
            this.queue.push({ eventType, data, parent, resolve, reject });
            this.processNext();
        });
    }

    async processNext() {
        if (this.processing || this.queue.length === 0) return;

        const { eventType, data, parent, resolve, reject } = this.queue.shift();
        this.processing = true;

        try {
            if (eventType === 'activation') {
                // Fixed: Using activeInfo.tabId directly
                const tab = await chrome.tabs.get(data.tabId);
                if (tab.url == "") { return resolve() }

                await chrome.storage.local.set({ currentUrl: tab.url });
                logVerbose(`Tab activated: set currentUrl to ${tab.url}`);
            } else if (eventType === 'update') {
                const realId = await getCurrentTabId();

                if (data.changeInfo.status === 'complete' && data.id == realId) {
                    await chrome.storage.local.set({
                        currentUrl: data.url,
                        tabId: data.id
                    });
                    logVerbose(`Current tab updated: set currentUrl to ${data.url}`);
                } else if (data.changeInfo.status === 'complete') {
                    logVerbose(`Background tab updated: ${data.url}`);
                }
                
                // Skip the URL check here since we already did it in the listener
                
                // Get existing graph data
                const result = await chrome.storage.local.get(['graphData']);
                const graphData = result.graphData || [];

                // Get page text if possible
                const text = await getInnerTextForTab(data.id);
                
                // Skip if we couldn't get text
                if (text === null) {
                    logInfo(`Could not get text for tab ${data.id}, skipping`);
                    return resolve();
                }
                
                // Create new entry with name property initialized
                const newEntry = {
                    self: data.url,
                    parent: parent.currentUrl || "",
                    data: text || "",
                    timestamp: Date.now(),
                    name: "" // Initialize name property
                };
                
                graphData.push(newEntry);
                
                logInfo(`Added entry: ${data.url}`);
                await chrome.storage.local.set({ graphData: graphData });
            }
            resolve();
        } catch (error) {
            logError(`Error handling ${eventType}:`, error);
            reject(error);
        } finally {
            this.processing = false;
            this.updating = false;
            this.processNext();
        }
    }
}

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

async function createGraph() {
    try {
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        var graph = {}; // Replace with actual graph implementation
        var nodes = new Map();
        
        for (const item of graphData) {
            const contents = item.data || "";
            const parentName = await giveName(contents);
            nodes.set(item.parent, { label: parentName });
            nodes.set(item.self, { label: parentName });
            // Implementation for adding edge would go here
        }
        return graph;
    } catch (error) {
        logError("Error in createGraph:", error);
        return {};
    }
}

async function fixDict() {
    try {
        logInfo("Fixing dictionary data");
        const result = await chrome.storage.local.get(['graphData']);
        const graphData = result.graphData || [];
        
        logInfo(`Processing ${graphData.length} entries for naming`);
        
        // Create a new array to hold the updated items
        const updatedGraphData = [];
        
        for (let i = 0; i < graphData.length; i++) {
            const item = graphData[i];
            logVerbose(`Processing item ${i+1}/${graphData.length}: ${item.self}`);
            
            // Skip items that already have a name
            if (item.name && item.name !== "") {
                logVerbose(`Item ${i+1} already has name: ${item.name}`);
                updatedGraphData.push(item);
                continue;
            }
            
            // Get name from data
            const contentText = item.data || "";
            // Use a shorter text sample to avoid API limits
            const textSample = contentText.substring(0, 500);
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
            
            // Clear data to save storage
            updatedItem.data = "";
        }
        
        // Save the updated data
        await chrome.storage.local.set({
            graphData: updatedGraphData
        });
        
        logInfo("Dictionary fixed successfully");
        return true;
    } catch (error) {
        logError("Error in fixDict:", error);
        return false;
    }
}

// Initialize processor
const tabProcessor = new TabEventProcessor();

// Set up listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    //console.log("STARTED ACTIVATION")
    try {
        await tabProcessor.enqueue('activation', activeInfo, "");
    } catch (error) {
        logError("Error handling tab activation:", error);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        // Get current URL from storage properly
        const storageData = await chrome.storage.local.get(['currentUrl']);
        const currentUrl = storageData.currentUrl || "";
        
        logVerbose(`Tab updated: ${tabId}, status: ${changeInfo.status}`);
        
        if (changeInfo.status === 'complete') {
            // Skip chrome:// and extension pages
            if (tab.url.startsWith('chrome://') || 
                tab.url.startsWith('chrome-extension://') || 
                tab.url === 'about:blank') {
                logVerbose(`Skipping tracking for restricted URL: ${tab.url}`);
                return;
            }
            
            await tabProcessor.enqueue('update', {
                id: tabId,
                tabId,
                changeInfo,
                url: tab.url
            }, {currentUrl: currentUrl}); // Pass as object with currentUrl property
        }
    } catch (error) {
        logError("Error handling tab update:", error);
    }
});

// Initialize storage if needed
chrome.runtime.onInstalled.addListener(async () => {
    logInfo("Extension installed/updated");
    await chrome.storage.local.set({
        currentUrl: "",
        tabId: 0,
        graphData: []
    });
});

logInfo("Background service worker initialized successfully");

