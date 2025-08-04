// options.js

// Function to save the options to chrome.storage
function saveOptions(e) {
  e.preventDefault();
  chrome.storage.sync.set({
    apiKey: document.querySelector("#api-key").value,
    nodeColor: document.querySelector("#node-color").value,
    edgeColor: document.querySelector("#edge-color").value,
    nodeSize: document.querySelector("#node-size").value,
    nodeShape: document.querySelector("#node-shape").value
  });
}

// Function to restore the options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(["aiModel", "apiKey", "nodeColor", "edgeColor", "nodeSize", "nodeShape"], (res) => {
    document.querySelector("#ai-model").value = res.aiModel || 'gemini-2.0-flash';
    document.querySelector("#api-key").value = res.apiKey || '';
    document.querySelector("#node-color").value = res.nodeColor || '#97C2FC';
    document.querySelector("#edge-color").value = res.edgeColor || '#E0E0E2';
    document.querySelector("#node-size").value = res.nodeSize || 16;
    document.querySelector("#node-shape").value = res.nodeShape || 'dot';
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#options-form").addEventListener("submit", saveOptions);