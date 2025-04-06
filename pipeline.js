async function createGraph() {
    var data = await chrome.storage.local.get(['graphData'])
    var graph = new Springy.Graph()
    var nodes = new Map()
    for(dict in data) {
        nodes.set(dict.get['parent'], graph.newNode({label: 'NOT IMPLEMENTED'}))
        nodes.set(dict.get['self'], graph.newNode({label: 'NOT IMPLEMENTED'}))
        graph.newEdge(nodes[dict.get['parent']], nodes[dict.get['self']], {color:lightGray})
    }
    return graph
}