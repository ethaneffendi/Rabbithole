
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("back").addEventListener("click", async function () {
    await chrome.storage.local.set({ welcomed: false });
    // alert((await chrome.storage.local.get(["welcomed"])).welcomed)
    window.location.href = "index.html";
  });

  document.getElementById("reset").addEventListener("click", async function () {
    await chrome.storage.local.set({ graphData: []});
    await chrome.storage.local.set({ id_to_parent: {}});
  });
});
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("suggest-url").addEventListener("click", async () => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0].url;
        const suggestedUrl = await chrome.runtime.sendMessage({ type: "suggestURL", url: url });
        chrome.tabs.create({ url: suggestedUrl });
    });
});