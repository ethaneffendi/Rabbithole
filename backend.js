chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "hello.html",
    enabled: true
  });
  
  chrome.sidePanel.setPanelBehavior({ 
    openPanelOnActionClick: true 
  });
});

async function getCurrentTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      (tabs) => resolve(tabs[0]?.id)
    );
  });
}

// Function to check if a URL is restricted (chrome://, chrome-extension://, etc.)
function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("devtools://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-search://") ||
    url.startsWith("file://")
  );
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

    let { eventType, data, parent, resolve } = this.queue.shift();
    this.processing = true;

    try {
      if (eventType === "activation") {
        // Fixed: Using activeInfo.tabId directly
        let tab = await chrome.tabs.get(data.tabId);
        if (tab.url == "") {
          return resolve();
        }
        await chrome.storage.local.set({ currentUrl: tab.url });
        //console.log('switch', await chrome.storage.local.get(['currentUrl']));
      } else if (eventType === "update") {
        console.log("parent", JSON.stringify(parent));
        let realId = await getCurrentTabId();

        if (data.changeInfo.status === "complete" && data.id == realId) {
          console.log("updating", data.url, data.id);
          await chrome.storage.local.set({
            currentUrl: data.url,
            tabId: data.id,
          });
        }

        var graphData =
          (await chrome.storage.local.get(["graphData"])).graphData ?? [];

        var text = null;
        // Only try to get inner text if it's not a restricted URL
        if (!isRestrictedUrl(data.url)) {
          text = await getInnerTextForTab(data.id);
        } else {
          text =
            "Restricted Url (Such as chrome://, chrome-extension://, etc.) Name it invalid.";
        }

        try {
          var true_parent = (await chrome.storage.local.get(["id_to_parent"]))
            .id_to_parent[data.id];
          console.log("true_parent", JSON.stringify(true_parent));
          if (true_parent == undefined) {
            true_parent = parent.currentUrl;
          }
        } catch {
          var true_parent = parent.currentUrl;
        }
        graphData.push({
          self: data.url,
          parent: true_parent,
          data: text,
        });
        console.log(
          "parent\n",
          true_parent,
          "\nself\n",
          data.url,
          data.id,
          "\n"
        );
        await chrome.storage.local.set({ graphData: graphData });
      }
      resolve();
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
      reject(error);
    } finally {
      this.processing = false;
      this.updating = false;
      //   await chrome.storage.local.set({ currentUrl: data.url });
      await giveNames();
      this.processNext();
    }
  }
}

// Initialize processor
const tabProcessor = new TabEventProcessor();

// Set up listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("STARTED ACTIVATION");
  await tabProcessor.enqueue("activation", activeInfo, "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  var current_tab_url = await chrome.storage.local.get(["currentUrl"]);
  if (changeInfo.status === "complete") {
    console.log("STARTED UPDATE");
    await tabProcessor.enqueue(
      "update",
      {
        id: tabId,
        changeInfo,
        url: tab.url,
      },
      current_tab_url
    );
  }
});

// chrome.tabs.onCreated.addListener(async (tab) => {
//   id_to_parent = {};
//   try {
//     id_to_parent = (await chrome.storage.local.get(["id_to_parent"]))
//       .id_to_parent;
//   } catch (error) {
//     console.log("Initializing id_to_parent", error);
//   }
//   let currentTab = await new Promise((resolve) => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       resolve(tabs[0]);
//     });
//   });
//   id_to_parent[tab.id] = currentTab.url;
//   console.log(tab.id, currentTab.url);
//   console.log(JSON.stringify(id_to_parent));
//   await chrome.storage.local.set({
//     id_to_parent: id_to_parent,
//   });
// });

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    console.log("STARTED NAVIGATION");
  id_to_parent = {};
  try {
    id_to_parent = (await chrome.storage.local.get(["id_to_parent"]))
      .id_to_parent;
  } catch (error) {
    console.log("Initializing id_to_parent", error);
  }
  let host_tab = await new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
  id_to_parent[details.tabId] = host_tab.url;
  console.log(details.tabId, host_tab.url);
  await chrome.storage.local.set({
    id_to_parent: id_to_parent,
  });
});

async function promptAI(prompt, config = {}) {
  try {
    const apiKey = "AIzaSyBqGJXPR5Gk2oZ9booojsuei8o3f_1Zmgc";

    // Default generation config
    const generationConfig = {
      temperature: config.temperature ?? 0.2,
      maxOutputTokens: config.maxOutputTokens ?? 30,
      topP: config.topP ?? 0.95,
      topK: config.topK ?? 40,
    };

    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      // Use fetch API to call Gemini with timeout
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: generationConfig,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // API returned an error status
      if (!response.ok) {
        console.error(`AI API returned error status: ${response.status}`);
        return config.fallbackResponse ?? "API error: " + response.status;
      }

      const data = await response.json();

      // Check if we got a valid response
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
      ) {
        return data.candidates[0].content.parts[0].text.trim();
      }

      // Handle error cases
      if (data.error) {
        console.error("AI API error:", data.error);
        return config.fallbackResponse ?? "error";
      }

      return config.fallbackResponse ?? "no response";
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Specific handling for timeout
      if (fetchError.name === "AbortError") {
        console.error("AI API request timed out");
        return config.fallbackResponse ?? "Request timed out";
      }

      throw fetchError; // Re-throw for the outer catch
    }
  } catch (error) {
    console.error("Error in promptAI:", error);
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
      fallbackResponse: "unknown topic",
    });

    // Clean up response to ensure it's 1-3 words, lowercase, no punctuation
    const cleanedResponse = rawResponse
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 3)
      .join(" ");

    return cleanedResponse || "unknown topic";
  } catch (error) {
    console.error("Error in giveName:", error);
    return "error";
  }
}

async function giveNames() {
  // console.log("Giving names")
  var data = (await chrome.storage.local.get(["graphData"])).graphData;
  for (dict of data) {
    if (dict["data"] != "NAME_GIVEN") {
      // console.log("DATA TYPE",typeof dict['data'])
      dict["name"] = await giveName(dict["data"]);
      // console.log("name", dict['name'])
      dict["data"] = "NAME_GIVEN";
    } else {
      // console.log(dict['self'], "already named")
    }
  }
  await chrome.storage.local.set({
    graphData: data,
  });
}

async function createGraph() {
  var data = (await chrome.storage.local.get(["graphData"])).graphData;
  var graph = new Springy.Graph();
  var nodes = {};
  for (dict of data) {
    var self = dict["self"];
    var parent = dict["parent"];
    var contents = dict["data"];
    nodes[parent] = graph.newNode({ label: giveName(contents) });
    nodes[self] = graph.newNode({ label: giveName(contents) });
    graph.newEdge(nodes[parent], nodes[self], { color: lightGray });
  }
  chrome.storage.local.set({
    graph: graph,
  });
  return graph;
}

async function giveNameToURL(inputURL){
  const prompt = `You are a topic extraction expert. Analyze the following text and extract 1-3 words
          that best represent the main topic or subject.

          Guidelines:
          - Use only lowercase words
          - No punctuation
          - Be specific and descriptive
          - For webpages, focus on the main content topic, not navigation elements
          - Prefer nouns or noun phrases
          - If the content is unclear, use "unknown topic"

          Text to analyze:
          ${inputURL}`
  const rawResponse = await promptAI(prompt, {
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
}

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

async function produceSuggestionNodes(){
  //get all nodes from Chrome storage
  var data = (await chrome.storage.local.get(['graphData'])).graphData
  //get the Set of all edge nodes
  var edgeNodes = await findEdgeNodes()
  //declare a Map to be filled with siteURL:suggestedURL
  var suggestions = new Map()
  //iterate through the siteURLs in the Set 
  for(let siteURL of edgeNodes){
      //get the suggestion for each siteURL
      var suggestionURL = await suggestURL(siteURL)
      //add siteURL:suggestionURL to the Map
      suggestions.set(siteURL, suggestionURL)
  }
  //for each siteURL:suggestionURL pair in the Map, push a new node to Chrome storage
  for(const [siteURL, suggestionURL] of suggestions.entries()){
      var newNode = {self: suggestionURL, parent: siteURL, name: await giveNameToURL(suggestionURL), isASuggestion: true}
      data.push(newNode)
      await chrome.storage.local.set({ graphData: data });
  }
}



