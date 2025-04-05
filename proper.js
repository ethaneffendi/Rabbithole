/* // content.js
async function saveTab() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];
        if (!activeTab) throw new Error('No active tab found');

        const data = [{
            "self": [activeTab.url],
            "parent": await chrome.storage.local.get(['currentUrl'])
        }];

        const existingObjs = await chrome.storage.local.get(['objs']);
        const newData = data.concat(existingObjs.objs || []);
        await chrome.storage.local.set({ objs: newData });
    } catch (error) {
        console.error('Error saving tab:', error);
        throw error;
    }
}

async function fetch() {
    try {
        const data = await chrome.storage.local.get(['objs']);
        const newWin = window.open();
        newWin.document.write(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

document.getElementById("get_urls").onclick = fetch; */