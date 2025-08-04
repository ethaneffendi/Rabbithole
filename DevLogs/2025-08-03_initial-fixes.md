# Dev Log - 2025-08-03: Initial Fixes and Refactoring

## Changes

*   **Fixed Real-time Graph Updates:** Modified `popup.js` to listen for changes in `chrome.storage` and automatically redraw the graph when new data is available. This resolves the issue where the popup had to be closed and reopened to see updates.
*   **Removed Unused Code:** Deleted the `storage.js` file, which was using the incorrect `localStorage` API. Also removed the unused `giveNameToURL` function from `backend.js`.
*   **Consolidated Event Listeners:** Refactored `button.js` to use a single `DOMContentLoaded` event listener, improving code organization.
*   **Secured API Key:** Removed the hardcoded API key from `backend.js`. The key is now stored in `chrome.storage.sync` and can be set by the user on the options page.