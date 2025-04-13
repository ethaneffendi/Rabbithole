
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