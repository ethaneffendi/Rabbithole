
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("back").addEventListener("click", async function () {
    await chrome.storage.local.set({ welcomed: false });
    // alert((await chrome.storage.local.get(["welcomed"])).welcomed)
    window.location.href = "index.html";
  });

  document.getElementById("ai").addEventListener("click", function () {
    alert("This is useless now? (unless you want to do prediction function which i don't)")
  });

  
});