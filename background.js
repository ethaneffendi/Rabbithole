chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, async function (tab) {
        await chrome.storage.local.set({ currentUrl: tab.url });
    });
});
//THESE TWO SHOULD HAVE SAME INNER CODE (FOR WHEN MAIN TAB CHANGES)
chrome.tabs.onUpdated.addListener((tabId, change, tab) => async function () {
    if (tab.active && change.url) {
        await chrome.storage.local.set({ currentUrl: change.url });
    }
});

//upon new tab
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        saveTab();
    }
});