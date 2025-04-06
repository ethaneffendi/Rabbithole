

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