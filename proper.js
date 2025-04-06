document.getElementById("get_urls").addEventListener('click', async function () {
    var newWeb = window.open()
    newWeb.document.writeln(JSON.stringify(await chrome.storage.local.get(['graphData'])))
});
document.getElementById("clear_storage").addEventListener('click', async function () {
    chrome.storage.local.set({
        currentUrl: "",
        tabId: 0,
        graphData: [],
    })
});
