// test.js

// Mock the promptAI function
const promptAI = async (prompt, options) => {
    return "https://www.google.com";
};

// Test the suggestURL function
async function testSuggestURL() {
    const url = "https://www.youtube.com";
    const suggestedUrl = await suggestURL(url);
    console.assert(suggestedUrl === "https://www.google.com", "testSuggestURL failed");
}

testSuggestURL();