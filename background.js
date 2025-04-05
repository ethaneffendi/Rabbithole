chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("new tab! activation")
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if(tab.url == "") {return}
        await chrome.storage.local.set({ currentUrl: tab.url });
        console.log('activation',JSON.stringify(await chrome.storage.local.get(['currentUrl'])))
    } catch (error) {
        console.log('Error activation:', error);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status === 'complete') {
            console.log("new tab! update")
            await chrome.storage.local.set({ currentUrl: tab.url });
        }
        console.log('update',JSON.stringify(await chrome.storage.local.get(['currentUrl'])))
    } catch (error) {
        console.log('Error update:', error);
    }
});