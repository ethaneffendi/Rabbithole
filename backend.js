async function getCurrentTabId() {
    return new Promise(resolve => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => resolve(tabs[0]?.id));
    });
}

// Function to check if a URL is restricted (chrome://, chrome-extension://, etc.)
function isRestrictedUrl(url) {
    if (!url) return true;
    return url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('devtools://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url.startsWith('chrome-search://') ||
        url.startsWith('file://');
}

async function getInnerTextForTab(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => document.body.innerText, // Function to execute in the target tab
        });

        // Results is an array of InjectionResult objects
        // For a single frame injection, we expect one result
        if (results && results[0] && results[0].result) {
            const innerText = results[0].result;
            // console.log("Page innerText:", innerText);
            return innerText; // Return the text
        } else {
            console.log("Could not retrieve innerText. Result:", results);
            return null;
        }
    } catch (error) {
        console.error(`Failed to execute script in tab ${tabId}: ${error}`);
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
        return new Promise((resolve) => {
            this.queue.push({ eventType, data, parent, resolve });
            this.processNext();
        });
    }

    async processNext() {
        //console.log(this.processing, this.queue)
        if (this.processing || this.queue.length === 0) return;

        const { eventType, data, parent, resolve } = this.queue.shift();
        this.processing = true;

        try {
            if (eventType === 'activation') {
                // Fixed: Using activeInfo.tabId directly
                const tab = await chrome.tabs.get(data.tabId);
                if (tab.url == "") { return resolve() }

                await chrome.storage.local.set({ currentUrl: tab.url });
                //console.log('switch', await chrome.storage.local.get(['currentUrl']));
            } else if (eventType === 'update') {
                const realId = await getCurrentTabId();

                if (data.changeInfo.status === 'complete' && data.id == realId) {
                    await chrome.storage.local.set({
                        currentUrl: data.url,
                        tabId: data.id
                    });
                }
                
                var graphData = (await chrome.storage.local.get(['graphData'])).graphData ?? []

                var text = null;
                // Only try to get inner text if it's not a restricted URL
                if (!isRestrictedUrl(data.url)) {
                    text = await getInnerTextForTab(data.id);
                } else {
                    text = "Restricted Url (Such as chrome://, chrome-extension://, etc.) Name it invalid."
                }

                graphData.push({
                    self: data.url,
                    parent: parent.currentUrl,
                    data: text
                })
                console.log("parent\n", parent.currentUrl, "\nself\n", data.url, "\n")
                await chrome.storage.local.set({ graphData: graphData })
            }
            resolve();
        } catch (error) {
            console.error(`Error handling ${eventType}:`, error);
            reject(error);
        } finally {
            this.processing = false;
            this.updating = false;
            await giveNames()
            this.processNext();
        }
    }
}

// Initialize processor
const tabProcessor = new TabEventProcessor();

// Set up listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    //console.log("STARTED ACTIVATION")
    await tabProcessor.enqueue('activation', activeInfo, "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    var current_tab_url = await chrome.storage.local.get(['currentUrl']);
    if (changeInfo.status === 'complete') {
        //console.log("STARTED UPDATE")
        await tabProcessor.enqueue('update', {
            id: tabId,
            tabId,
            changeInfo,
            url: tab.url
        }, current_tab_url);
    }
});

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

        // Create an AbortController to handle timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
            // Use fetch API to call Gemini with timeout
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
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // API returned an error status
            if (!response.ok) {
                logError(`AI API returned error status: ${response.status}`);
                return config.fallbackResponse ?? "API error: " + response.status;
            }

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
        } catch (fetchError) {
            clearTimeout(timeoutId);

            // Specific handling for timeout
            if (fetchError.name === 'AbortError') {
                logError("AI API request timed out");
                return config.fallbackResponse ?? "Request timed out";
            }

            throw fetchError; // Re-throw for the outer catch
        }
    } catch (error) {
        logError("Error in promptAI:", error);
        return config.fallbackResponse ?? "error";
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
        console.error("Error in giveName:", error);
        return "error";
    }
}

async function giveNames() {
    // console.log("Giving names")
    var data = (await chrome.storage.local.get(['graphData'])).graphData
    for (dict of data) {
        if (dict['data'] != "NAME_GIVEN") {
            // console.log("DATA TYPE",typeof dict['data'])
            dict['name'] = await giveName(dict['data'])
            // console.log("name", dict['name'])
            dict['data'] = "NAME_GIVEN"
        }
        else {
            // console.log(dict['self'], "already named")
        }
    }
    await chrome.storage.local.set({
        graphData: data
    })
}

async function createGraph() {
    var data = (await chrome.storage.local.get(['graphData'])).graphData
    var graph = new Springy.Graph()
    var nodes = {}
    for (dict of data) {
        var self = dict['self']
        var parent = dict['parent']
        var contents = dict['data']
        nodes[parent] = graph.newNode({ label: giveName(contents) })
        nodes[self] = graph.newNode({ label: giveName(contents) })
        graph.newEdge(nodes[parent], nodes[self], { color: lightGray })
    }
    chrome.storage.local.set({
        graph: graph
    })
    return graph
}