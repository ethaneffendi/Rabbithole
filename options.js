// options.js

// Function to save the options to chrome.storage
function saveOptions(e) {
  e.preventDefault();
  chrome.storage.sync.set({
    aiModel: document.querySelector("#ai-model").value,
    googleApiKey: document.querySelector("#google-api-key").value,
    openaiApiKey: document.querySelector("#openai-api-key").value,
    nodeColor: document.querySelector("#node-color").value,
    edgeColor: document.querySelector("#edge-color").value,
    nodeSize: document.querySelector("#node-size").value,
    nodeShape: document.querySelector("#node-shape").value,
    darkMode: document.querySelector("#dark-mode-toggle").checked
  });
}

// Function to restore the options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(["aiModel", "googleApiKey", "openaiApiKey", "nodeColor", "edgeColor", "nodeSize", "nodeShape", "darkMode"], (res) => {
    document.querySelector("#ai-model").value = res.aiModel || 'gemini-2.0-flash';
    document.querySelector("#google-api-key").value = res.googleApiKey || '';
    document.querySelector("#openai-api-key").value = res.openaiApiKey || '';
    document.querySelector("#node-color").value = res.nodeColor || '#97C2FC';
    document.querySelector("#edge-color").value = res.edgeColor || '#E0E0E2';
    document.querySelector("#node-size").value = res.nodeSize || 16;
    document.querySelector("#node-shape").value = res.nodeShape || 'dot';
    document.querySelector("#dark-mode-toggle").checked = res.darkMode;
    if (res.darkMode) {
      document.body.classList.add("dark-mode");
    }
  });
}

function toggleDarkMode() {
  if (this.checked) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  // Save the preference
  chrome.storage.sync.set({ darkMode: this.checked });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#options-form").addEventListener("submit", saveOptions);
document.querySelector("#dark-mode-toggle").addEventListener("change", toggleDarkMode);