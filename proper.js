document.getElementById("get_urls").addEventListener('click', async function() {
    var newWeb = window.open()
    newWeb.document.writeln(JSON.stringify(await chrome.storage.local.get(['graphData'])))
});