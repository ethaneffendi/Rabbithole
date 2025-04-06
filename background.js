async function getCurrentTabId() {
    return new Promise(resolve => {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => resolve(tabs[0]?.id));
    });
}

class TabEventProcessor {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    async enqueue(eventType, data, parent) {
        return new Promise((resolve) => {
            this.queue.push({ eventType, data, parent, resolve });
            this.processNext();
        });
    }

    async processNext() {
        //console.log(this.processing, this.queue)
        if (this.processing || this.queue.length === 0) return;

        const { eventType, data, parent, resolve } = this.queue.shift();
        this.processing = true;

        try {
            if (eventType === 'activation') {
                // Fixed: Using activeInfo.tabId directly
                const tab = await chrome.tabs.get(data.tabId);
                if (tab.url == "") { return resolve() }

                await chrome.storage.local.set({ currentUrl: tab.url });
                //console.log('switch', await chrome.storage.local.get(['currentUrl']));
            } else if (eventType === 'update') {
                const realId = await getCurrentTabId();

                if (data.changeInfo.status === 'complete' && data.id == realId) {
                    await chrome.storage.local.set({
                        currentUrl: data.url,
                        tabId: data.id
                    });
                    //console.log('new tab', await chrome.storage.local.get(['currentUrl']));
                } else if (data.changeInfo.status === 'complete') {
                    //console.log('branched', data.url)
                }
                var graphData = (await chrome.storage.local.get(['graphData'])).graphData ?? []

                graphData.push({
                    self: data.url,
                    parent: parent.currentUrl
                })//remember to add data of the page
                console.log("parent\n",parent.currentUrl,"\nself\n",data.url,"\n")
                await chrome.storage.local.set({graphData: graphData})
            }
            resolve();
        } catch (error) {
            //console.error(`Error handling ${eventType}:`, error);
            reject(error);
        } finally {
            this.processing = false;
            this.updating = false;
            this.processNext();
        }
    }
}

// Initialize processor
const tabProcessor = new TabEventProcessor();

// Set up listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    //console.log("STARTED ACTIVATION")
    await tabProcessor.enqueue('activation', activeInfo, "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    current_tab_url = await chrome.storage.local.get(['currentUrl']);
    if (changeInfo.status === 'complete') {
        //console.log("STARTED UPDATE")
        await tabProcessor.enqueue('update', {
            id: tabId,
            tabId,
            changeInfo,
            url: tab.url
        }, current_tab_url);
    }
});