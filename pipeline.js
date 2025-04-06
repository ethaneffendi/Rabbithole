import { GoogleGenAI } from "@google/genai";

async function giveName(contents) {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyBqGJXPR5Gk2oZ9booojsuei8o3f_1Zmgc" });
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: "Return one to three words (no punctuation and all lower case) that name the topic of the following text" + contents,
  });
  return response
}


async function createGraph() {
    var data = await chrome.storage.local.get(['graphData'])
    var graph = new Springy.Graph()
    var nodes = new Map()
    for(dict in data) {
        var contents = dict.get['data']
        nodes.set(dict.get['parent'], graph.newNode({label: giveName(contents)}))
        nodes.set(dict.get['self'], graph.newNode({label: giveName(contents)}))
        graph.newEdge(nodes[dict.get['parent']], nodes[dict.get['self']], {color:lightGray})
    }
    return graph
}
