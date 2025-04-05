
document.getElementById("get_urls").onclick = async function () {
    var list_tabs = await chrome.tabs.query({})

    data = JSON.stringify(list_tabs)
    new_data = []
    newWin = window.open()
    for (piece of list_tabs) {
        new_data.push(piece.url)
        newWin.document.write(piece.url)
    }
};