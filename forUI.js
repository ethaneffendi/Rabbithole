import { exportList, makeNames, giveSuggestion } from './pipeline.js';

function getEdges(list){
    var nodeSet = new Set();
    for(node of list){
        nodeSet.add(node.get['self'])
    }
    for (node of list){
        if(nodeSet.has(node.get['parent'])){
            nodeSet.delete(node.get['parent']); 
        }

    }
    return nodeSet
}

async function getSuggestions(list){
    var childUrls = getEdges(list)
    var childrenMap = new Map(); 
    for (child of childUrls){
        for (potentialMatch of list){
            if (child == potentialMatch.get['self']){
                childrenMap.set(child, potentialMatch.get['name']);
            }
        }
    } 

    for (child of childrenMap.keys()){
        var suggestion = await giveSuggestion(childrenMap.get(child));
        for (suggest in suggestion) {
            let tempMap = new Map();
            tempMap.set("parent", "child"); 
            tempMap.set("self", suggest[1]);
            tempMap.set("name", suggest[0]);
            tempMap.set("ai", true);
            list.push(tempMap); 
        }
    }

    return list;
}

async function createGraphList(){
    await makeNames();
    var list = await exportList(); 
    for(dict in list) {
        dict.set("ai", false);
    }
    list = getSuggestions(list);
    return list; 
}

document.getElementById('reload').addEventListener('click', () => {
    console.log("HGGG")
    alert("HGGGG")
    var graph = new Springy.Graph();

    const cornflowerBlue = '#5959FB';
    const lightGray = '#E0E0E2'; // actually alto

    var graphList = createGraphList(); 

    var nodeMap = new Map()

    for(dict in graphList){
        nodeMap.set(dict.get['self'], graph.newNode({label: dict.get['name'], func(){window.open(dict.get['self'])}}))
    }

    for(dict in graphList){
        graph.newEdge(nodeMap.get[dict.get['parent']], nodeMap.get[dict.get['self']])
    }
})