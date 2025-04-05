chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("new tab! activation")
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url == "") { return }
        await chrome.storage.local.set({ currentUrl: tab.url });
        console.log('activation', await chrome.storage.local.get(['currentUrl']));
    } catch (error) {
        console.log('Error activation:', error);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    try {
        // Only process actual URL changes
        if (changeInfo.status === 'complete' && tab.url) {
            await chrome.storage.local.set({
                currentUrl: tab.url,
                tabId: tab.id
            });
            console.log('update', await chrome.storage.local.get(['currentUrl']));
        }
    } catch (error) {
        console.error('Error handling tab update:', error);
    }
});