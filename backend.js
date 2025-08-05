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
    url.startsWith("chrome://newtab/") ||
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

  // Fallback to fetch for cross-origin pages
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
      console.log('Fetch fallback failed, trying XHR:', e);
      // XHR Fallback
      try {
        const title = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.timeout = 10000; // 10 second timeout
          xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                const titleMatch = /<title\b[^>]*>(.*?)<\/title>/i.exec(xhr.responseText);
                if (titleMatch && titleMatch[1]) {
                  resolve(titleMatch[1].trim());
                } else {
                  reject(new Error("XHR success, but no title found."));
                }
              } else {
                reject(new Error(`XHR failed with status ${xhr.status}`));
              }
            }
          };
          xhr.ontimeout = () => reject(new Error("XHR request timed out."));
          xhr.onerror = () => reject(new Error("XHR request error."));
          xhr.send();
        });
        return title;
      } catch (xhrError) {
        console.log('XHR fallback failed:', xhrError.message);
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.replace('www.', '');
        } catch {
          return url; // Final fallback to the raw URL
        }
      }
    }
  }
  
  // If URL is restricted or all methods fail, return null
  return null;
}

class TabEventProcessor {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  enqueue(eventType, data, parent) {
    this.queue.push({ eventType, data, parent });
    this.processNext();
  }

  async processNext() {
    //console.log(this.processing, this.queue)
    if (this.processing || this.queue.length === 0) return;

    const { eventType, data, parent } = this.queue.shift();
    this.processing = true;

    try {
      if (eventType === "activation") {
        const tab = await chrome.tabs.get(data.tabId);
        if (tab.url) {
          await chrome.storage.local.set({ currentUrl: tab.url });
        }
      } else if (eventType === "update") {
        const realId = await getCurrentTabId();

        if (data.changeInfo.status === "complete" && data.id === realId) {
          await chrome.storage.local.set({
            currentUrl: data.url,
            tabId: data.id,
          });

          const { graphData = [] } = await chrome.storage.local.get("graphData");
          const { id_to_parent = {} } = await chrome.storage.local.get("id_to_parent");

          let title = await getPageTitleForTab(data.id, data.url) || data.url;
          let true_parent = id_to_parent[data.id];
          let connectionType = 'switch';

          if (true_parent) {
            connectionType = 'link';
            delete id_to_parent[data.id];
            await chrome.storage.local.set({ id_to_parent });
          } else {
            true_parent = parent.currentUrl;
          }

          const isGoingBack = graphData.some(
            item => item.parent === data.url && item.self === true_parent
          );

          if (true_parent && data.url && true_parent !== data.url && !isGoingBack) {
            graphData.push({
              self: data.url,
              parent: true_parent,
              name: title,
              type: connectionType,
            });
            await chrome.storage.local.set({ graphData });
          }
        }
      }
    } catch (error) {
      console.error(`Error handling ${eventType}:`, error);
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
  if (changeInfo.status === "complete") {
    const { currentUrl } = await chrome.storage.local.get("currentUrl");
    tabProcessor.enqueue(
      "update",
      { id: tabId, changeInfo, url: tab.url },
      { currentUrl }
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
    const { aiModel, googleApiKey, openaiApiKey } = await chrome.storage.sync.get(["aiModel", "googleApiKey", "openaiApiKey"]);
    let apiKey;
    let model = aiModel || 'gemini-2.0-flash';

    if (model.startsWith('gemini')) {
      apiKey = googleApiKey;
    } else if (model.startsWith('gpt')) {
      apiKey = openaiApiKey;
    }

    if (!apiKey) {
      console.error(`API key for ${model} not found. Please set it in the extension options.`);
      return config.fallbackResponse ?? "API key not set for selected model";
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
      let apiUrl;
      if (model.startsWith('gemini')) {
        apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=` + apiKey;
      } else if (model.startsWith('gpt')) {
        apiUrl = `https://api.openai.com/v1/chat/completions`; // OpenAI endpoint
      } else {
        throw new Error("Unsupported AI model selected.");
      }

      // Use fetch API to call the selected AI model with timeout
      const response = await fetch(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(model.startsWith('gpt') && { 'Authorization': `Bearer ${apiKey}` }) // Add Authorization header for OpenAI
          },
          body: JSON.stringify(
            model.startsWith('gemini') ?
            {
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
            } :
            { // OpenAI format
              model: model,
              messages: [{ role: "user", content: prompt }],
              temperature: generationConfig.temperature,
              max_tokens: generationConfig.maxOutputTokens,
              top_p: generationConfig.topP,
              frequency_penalty: 0,
              presence_penalty: 0,
            }
          ),
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
      if (model.startsWith('gemini')) {
        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts
        ) {
          return data.candidates[0].content.parts[0].text.trim();
        }
      } else if (model.startsWith('gpt')) {
        if (
          data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content
        ) {
          return data.choices[0].message.content.trim();
        }
      }

      // Handle error cases
      if (data.error) {
        console.error("AI API error:", data.error);
        return config.fallbackResponse ?? "API error: " + data.error.message;
      }

      return config.fallbackResponse ?? "no response from AI";
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
