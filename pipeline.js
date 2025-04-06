// DEBUG LEVEL (0=off, 1=errors only, 2=important info, 3=verbose)
const DEBUG_LEVEL = 3;

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
        relevantTopic = await promptAI("Return one to three words (no punctuation and all lower case) that name the topic of the following text" + topic)
        relevantURL = await promptAI("Return the URL (and only the URL) of a credible article about " + relevantTopic)
        return [relevantTopic, relevantURL]
    } catch (error) {
        logError("Error in giveSuggestion:", error);
        return ["error", "error"]
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
        
        logInfo(`Processing ${graphData.length} entries for naming`);
        
        // Create a new array to hold the updated items
        const updatedGraphData = [];
        
        // Create a dictionary object for returning URL -> name mapping
        const dictionary = {};
        
        for (let i = 0; i < graphData.length; i++) {
            const item = graphData[i];
            logVerbose(`Processing item ${i+1}/${graphData.length}: ${item.self}`);
            
            // Update progress
            updateFixDictProgress(i, graphData.length);
            
            // Skip items that already have a name
            if (item.name) {
                logVerbose(`Item ${i+1} already has name: ${item.name}`);
                updatedGraphData.push(item);
                if (item.self) {
                    dictionary[item.self] = item.name;
                }
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
            
            // Add to dictionary
            if (updatedItem.self) {
                dictionary[updatedItem.self] = name;
            }
            
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
        return dictionary;
    } catch (error) {
        logError("Error in fixDict:", error);
        // Update progress as complete with error
        updateFixDictProgress(0, 0, true);
        return {};
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
// Expose the function to the window object
window.fixDict = fixDict;

// Also expose for module contexts
export { fixDict, giveName, promptAI, giveSuggestion };