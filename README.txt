#Rabbithole Browser Extension

A browser extension that tracks and visualizes your browsing history with AI-powered topic naming.

##Overview

Rabbithole helps you understand your browsing patterns by recording the pages you visit and their relationships (parent-child). It uses Google's Gemini AI to automatically name topics based on page content.

##How It Works

1. The extension tracks tab navigation events
2. Captures text content from each page
3. Records parent-child relationships between pages
4. Uses AI to generate descriptive names for each page
5. Provides export options for the collected data

## Installation

1. Load as an unpacked extension in Chrome
2. Browse normally to collect data
3. Click buttons in the popup to view or manipulate data

## Button Functions

- **Get Urls**: Displays collected browsing data in a formatted view
- **Fix Dict**: Processes unnamed entries to add topic names
- **Fix and Show**: Combines naming and displaying formatted data
- **Fix and Show Raw**: Combines naming and displaying raw JSON data
- **Export Dictionary**: Exports a dictionary mapping URLs to their topic names
- **Clear Storage**: Removes all collected data

## Dictionary Export

The dictionary export feature allows you to:
- View a clean table of URLs and their corresponding topic names
- Copy the dictionary as a JSON object
- Download the dictionary as a JSON file
- Share the topic mappings with other tools or applications
- See all named web pages in a single view

## Function Definitions

### AI Functionality (shared between files)

- `promptAI(prompt, config)`: Generic function to send prompts to Gemini AI
  - Takes a text prompt and optional configuration parameters
  - Returns the AI's response as a string
  - Handles error cases and fallback responses
  - Used by other functions that need AI capabilities

### Background Service Worker (background.js)

#### Core Navigation Tracking

- `getCurrentTabId()`: Retrieves the ID of the currently active tab
- `getInnerTextForTab(tabId)`: Extracts text content from a given tab
- `TabEventProcessor`: Manages queue of navigation events
  - `enqueue(eventType, data, parent)`: Adds events to queue
  - `processNext()`: Processes next event in queue

#### Data Processing

- `giveName(contents)`: Uses promptAI to generate topic name from text
- `fixDict()`: Processes entries to add topic names and returns a dictionary of URL-to-name mappings
- `updateFixDictProgress(processed, total, isDone)`: Updates progress tracking

#### Event Listeners

- `chrome.tabs.onActivated`: Tracks tab activation events
- `chrome.tabs.onUpdated`: Tracks tab update events
- `chrome.runtime.onInstalled`: Initializes storage on installation
- `chrome.runtime.onMessage`: Handles progress tracking messages

### Popup Interface (proper.js)

#### UI Elements

- `progressModal`: Displays progress during dictionary fixing
- `progressBar`: Visual indicator of processing progress
- `progressText`: Text showing progress percentage
- `progressInfo`: Additional information about processing

#### Progress Tracking

- `showProgressModal(title)`: Displays progress modal with specified title
- `updateProgress(current, total)`: Updates progress bar and text
- `hideProgressModal()`: Hides the progress modal
- `startProgressTracking()`: Begins periodic checking of processing status

#### Data Display

- `displayUrlData()`: Shows formatted browsing history in a new tab
- `displayRawData()`: Shows raw JSON data with copy/download options
- `exportDictionary()`: Creates and shows a dictionary of URLs to topic names
- `fixDictionary()`: Wrapper that calls the background script's fixDict function

#### Event Handlers

- Event listeners for all buttons in the popup interface
- Message listener for progress updates from background

### Pipeline Module (pipeline.js)

- `promptAI(prompt, config)`: Generic AI interaction function
- `giveName(contents)`: Uses promptAI to generate topic names
- `giveSuggestion(topic)`: Generates related topic and URL suggestions
- `fixDict()`: Processes entries to add names and returns a dictionary

## Logging System

- `DEBUG_LEVEL`: Controls verbosity of logs (0=none, 1=errors, 2=info, 3=verbose)
- `logError()`: Logs error messages (level 1+)
- `logInfo()`: Logs information messages (level 2+)
- `logVerbose()`: Logs detailed messages (level 3)

## Data Structure

Each entry in the browsing history contains:
- `self`: URL of the current page
- `parent`: URL of the page that led to this page
- `data`: Text content of the page (cleared after naming)
- `name`: AI-generated topic name
- `timestamp`: When the page was visited

## Technical Notes

- Uses Chrome Extension Manifest V3
- Requires tabs, storage, scripting, and webNavigation permissions
- Makes API calls to Google Gemini for AI topic naming
- Skips chrome:// and extension pages due to access restrictions 
