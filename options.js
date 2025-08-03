// options.js

// Function to save the options to chrome.storage
function saveOptions(e) {
  e.preventDefault();
  chrome.storage.sync.set({
    nodeColor: document.querySelector("#node-color").value,
    edgeColor: document.querySelector("#edge-color").value
  });
}

// Function to restore the options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get(["nodeColor", "edgeColor"], (res) => {
    document.querySelector("#node-color").value = res.nodeColor || '#97C2FC';
    document.querySelector("#edge-color").value = res.edgeColor || '#E0E0E2';
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#options-form").addEventListener("submit", saveOptions);