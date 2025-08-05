
function showStatusMessage(message, duration = 2000) {
  const statusElement = document.getElementById("status-message");
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.opacity = 1;
    setTimeout(() => {
      statusElement.style.opacity = 0;
    }, duration);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("back").addEventListener("click", async function () {
    await chrome.storage.local.set({ welcomed: false });
    window.location.href = "index.html";
  });

  document.getElementById("reset").addEventListener("click", async function () {
    await chrome.storage.local.set({ graphData: [], id_to_parent: {} });
    showStatusMessage("Graph reset!");
  });

  document.getElementById("save-graph").addEventListener("click", async () => {
    const { graphData = [] } = await chrome.storage.local.get("graphData");
    await chrome.storage.local.set({ savedGraphData: graphData });
    showStatusMessage("Graph saved!");
  });

  document.getElementById("load-graph").addEventListener("click", async () => {
    const { savedGraphData = [] } = await chrome.storage.local.get("savedGraphData");
    await chrome.storage.local.set({ graphData: savedGraphData });
    showStatusMessage("Graph loaded!");
  });

  document.getElementById("suggest-url").addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const suggestedUrl = await chrome.runtime.sendMessage({ type: "suggestURL", url: tabs[0].url });
      if (suggestedUrl) {
        chrome.tabs.create({ url: suggestedUrl });
      }
    }
  });

  document.getElementById("export-graph").addEventListener("click", () => {
    if (network) {
      const canvas = network.canvas.frame.canvas;
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "rabbithole-graph.png";
      link.click();
    }
  });
});