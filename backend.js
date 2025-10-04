// Removed merge conflict markers and duplicate code sections

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

      this.processNext();
    }
  }
}

// Initialize processor
// ...existing code...

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
  let id_to_parent = {};
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
  if (host_tab && host_tab.url) {
    id_to_parent[details.tabId] = host_tab.url;
    console.log(details.tabId, host_tab.url);
  } else {
    console.log('No active tab or URL found for tab', details.tabId, host_tab);
  }
  await chrome.storage.local.set({
    id_to_parent: id_to_parent,
  });
});

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
  let id_to_parent = {};
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
  if (host_tab && host_tab.url) {
    id_to_parent[details.tabId] = host_tab.url;
    console.log(details.tabId, host_tab.url);
  } else {
    console.log('No active tab or URL found for tab', details.tabId, host_tab);
  }
  await chrome.storage.local.set({
    id_to_parent: id_to_parent,
  });
});




