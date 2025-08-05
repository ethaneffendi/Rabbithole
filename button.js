
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("back").addEventListener("click", async function () {
    await chrome.storage.local.set({ welcomed: false });
    window.location.href = "index.html";
  });

  document.getElementById("reset").addEventListener("click", async function () {
    await chrome.storage.local.set({ graphData: [], id_to_parent: {} });
  });

  document.getElementById("save-graph").addEventListener("click", async () => {
    const result = await chrome.storage.local.get(["graphData"]);
    const data = result.graphData || [];
    await chrome.storage.local.set({ savedGraphData: data });
    alert("Graph data saved!");
  });

  document.getElementById("load-graph").addEventListener("click", async () => {
    const result = await chrome.storage.local.get(["savedGraphData"]);
    const data = result.savedGraphData || [];
    await chrome.storage.local.set({ graphData: data });
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