async function saveTab() {
    const data = [{
        "self": [(await chrome.tabs.query({})).url],
        "parent": await chrome.storage.local.get(['currentUrl'])
    }]
    data = data.concat(await chrome.storage.local.get(['objs']))
    await chrome.storage.local.set({ data: data });
}

async function fetch() {
    const data = await chrome.storage.local.get(['objs']);
    newWin = window.open()
    newWin.document.write(JSON.stringify(data))
/*     for (piece of data) {
        newWin.document.write(JSON.stringify(piece.url));
        newWin.document.write("");
    } */
}


document.getElementById("get_urls").onclick = async function () {
    fetch();
};