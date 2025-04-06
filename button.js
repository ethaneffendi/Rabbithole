

document.getElementById('beginButton').addEventListener('click', async function () {
    await chrome.storage.local.set({ "welcomed": true })
    window.location.href = "hello.html";

});

window.onload = async function () {
    var welcomed = await chrome.storage.local.get(["welcomed"]);
    if (welcomed.welcomed) {
        window.location.href = "hello.html";
    }
}
/* 
document.getElementById('back').addEventListener('click', async function(){
    alert("Hello World");
    await chrome.storage.local.set({ "welcomed": false })
    window.location.href = "index.html";
  }); */