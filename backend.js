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

async function getPageTitleForTab(tabId, url) {
  // First try script injection (works for same-origin pages)
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => document.title,
    });
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
  } catch (e) {
    console.log('Script injection failed, falling back to fetch:', e);
  }

  // Fallback to fetch/XHR for cross-origin pages
  if (url && !isRestrictedUrl(url)) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        throw new Error('Non-HTML content received');
      }

      const html = await response.text();
      const titleMatch = html.match(/<title\b[^>]*>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
      
      // Fallback to URL if no title found
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
      } catch {
        return url;
      }
    } catch (e) {
      console.log('Fetch fallback failed:', e);
      try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
      } catch {
        return url;
      }
    }
  }
  
  return null;
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
        // console.log("parent", JSON.stringify(parent));
        let realId = await getCurrentTabId();

        if (data.changeInfo.status === "complete" && data.id == realId) {
          // console.log("updating", data.url, data.id);
          await chrome.storage.local.set({
            currentUrl: data.url,
            tabId: data.id,
          });
        }

        var graphData =
          (await chrome.storage.local.get(["graphData"])).graphData ?? [];

let title = await getPageTitleForTab(data.id, data.url);
if (!title) {
  title = data.url; // Use URL as fallback if no title
}

          let stored_id_to_parent = (await chrome.storage.local.get(["id_to_parent"])).id_to_parent || {};
          var true_parent = stored_id_to_parent[data.id];

          if (true_parent) {
            // If a specific parent was set by onBeforeNavigate (link click), use it and then clear it
            delete stored_id_to_parent[data.id];
            await chrome.storage.local.set({ id_to_parent: stored_id_to_parent });
          } else {
            // Otherwise, use the currentUrl from the previous active tab (tab switch, typed URL, etc.)
            true_parent = parent.currentUrl;
          }

          graphData.push({
            self: data.url,
            parent: true_parent,
            name: title, // Use the title as the node name
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
        } // This closing brace is for the 'else if (eventType === "update")' block
        resolve();
      } catch (error) {
        console.error(`Error handling ${eventType}:`, error);
        reject(error); // Re-add reject for consistency, though it might not be used externally
      } finally {
        this.processing = false;
        this.processNext();
      }
    }
  }

// Initialize processor
const tabProcessor = new TabEventProcessor();

// Set up listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // console.log("STARTED ACTIVATION");
  await tabProcessor.enqueue("activation", activeInfo, "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  var current_tab_url = await chrome.storage.local.get(["currentUrl"]);
  if (changeInfo.status === "complete") {
    // console.log("STARTED UPDATE");
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

chrome.tabs.onRemoved.addListener(async (tabId) => {
  let stored_id_to_parent = (await chrome.storage.local.get(["id_to_parent"])).id_to_parent || {};
  if (stored_id_to_parent[tabId]) {
    delete stored_id_to_parent[tabId];
    await chrome.storage.local.set({ id_to_parent: stored_id_to_parent });
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
  if (details.frameId === 0 && (details.transitionType === 'link' || details.transitionType === 'generated')) {
    let id_to_parent = {};
    try {
      id_to_parent = (await chrome.storage.local.get(["id_to_parent"])).id_to_parent || {};
    } catch (error) {
      console.log("Initializing id_to_parent", error);
    }

    let host_tab = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });

    if (host_tab) {
        id_to_parent[details.tabId] = host_tab.url;
        await chrome.storage.local.set({ id_to_parent: id_to_parent });
    }
  }
});

async function promptAI(prompt, config = {}) {
  try {
    const { apiKey } = await chrome.storage.sync.get("apiKey");
    if (!apiKey) {
      console.error("API key not found. Please set it in the extension options.");
      return config.fallbackResponse ?? "API key not set";
    }

    // Default generation config
    const generationConfig = {
      temperature: config.temperature ?? 0.2,
      maxOutputTokens: config.maxOutputTokens ?? 30,
      topP: config.topP ?? 0.95,
      topK: config.topK ?? 40,
    };

    // Create an AbortController to handle timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const { aiModel } = await chrome.storage.sync.get("aiModel");
      const model = aiModel || 'gemini-2.0-flash';

      // Use fetch API to call Gemini with timeout
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=` +
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "suggestURL") {
        suggestURL(request.url).then(sendResponse);
        return true;
    }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isRestrictedUrl };
}
