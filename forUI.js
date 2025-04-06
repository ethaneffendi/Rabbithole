import { exportList, makeNames, giveSuggestion, printGraphList } from './pipeline.js';

function getEdges(list){
    var nodeSet = new Set();
    for(node of list){
        nodeSet.add(node.get('self'))
    }
    for (node of list){
        if(nodeSet.has(node.get('parent'))){
            nodeSet.delete(node.get('parent')); 
        }

    }
    return nodeSet
}

async function getSuggestions(list){
    var childUrls = getEdges(list)
    var childrenMap = new Map(); 
    for (child of childUrls){
        for (potentialMatch of list){
            if (child == potentialMatch.get('self')){
                childrenMap.set(child, potentialMatch.get('name'));
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
    for(dict of list) {
        dict.set("ai", false);
    }
    list = await getSuggestions(list);
    
    // Print raw graph data
    console.log("=== Raw Graph Data from createGraphList ===");
    list.forEach((item, index) => {
        console.log(`Graph Item ${index + 1}:`);
        console.log(`- Self: ${item.get('self')}`);
        console.log(`- Parent: ${item.get('parent')}`);
        console.log(`- Name: ${item.get('name')}`);
        console.log(`- AI Generated: ${item.get('ai')}`);
    });
    
    return list; 
}

// Expose the function to the window object for direct console access
window.createGraphList = createGraphList;
window.printRawGraphList = printGraphList;