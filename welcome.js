window.onload = async function () {
  var welcomed = (await chrome.storage.local.get(["welcomed"])).welcomed;
  if (welcomed == true) {
    window.location.href = "hello.html";
    // alert((await chrome.storage.local.get(["welcomed"])).welcomed)
  }
};

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("start").addEventListener("click", async function () {
    // alert("clicked");
    await chrome.storage.local.set({ welcomed: true });
    window.location.href = "hello.html";
  });
});
