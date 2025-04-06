import { fixDict, createGraph } from "./pipeline.js";

// Wait for the DOM content to be loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => async function() {
  // Event listener for the "get_urls" button
  document.getElementById("get_urls").addEventListener('click', async function () {
    const newWeb = window.open();
    const graphData = await chrome.storage.local.get(['graphData']);
    newWeb.document.writeln(JSON.stringify(graphData));
  });

  // Event listener for the "clear_storage" button
  document.getElementById("clear_storage").addEventListener('click', async function () {
    await chrome.storage.local.set({
      currentUrl: "",
      tabId: 0,
      graphData: [],
    });
  });

  // Event listener for the "fix_dict" button
  document.getElementById("fix_dict").addEventListener('click', async function () {
    await fixDict();
  });
});
