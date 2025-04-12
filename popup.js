//document.getDocumentElementById.addEventListener('click', newAlert);

//var aiRecommend = false;
//alert("6");

//graph = (await chrome.storage.local.get(['graph'])).graph

var graph = new Springy.Graph();
const cornflowerBlue = "#5959FB";
const lightGray = "#E0E0E2"; // actually alto

//  var dennis = graph.newNode({label: 'Dennis',ondoubleclick: function(){ alert("Hi"); } });
//  var michael = graph.newNode({label: 'Michael', ondoubleclick: function(){ alert("Hi"); }});
//  var jessica = graph.newNode({label: 'Jessica', ondoubleclick: function(){ alert("Hi"); }});
//  var timothy = graph.newNode({label: 'Timothy', ondoubleclick: function(){ alert("Hi"); }});
//  var barbara = graph.newNode({label: 'Barbara', ondoubleclick: function(){ alert("Hi"); }});
//  var franklin = graph.newNode({label: 'Franklin', ondoubleclick: function(){ alert("Hi"); }});
//  var monty = graph.newNode({label: 'Monty', ondoubleclick: function(){ alert("Hi"); }});
//  var james = graph.newNode({label: 'James', ondoubleclick: function(){ alert("Hi"); }});
//  var bianca = graph.newNode({label: 'Bianca', ondoubleclick: function(){ alert("Hi"); }});

//  graph.newEdge(dennis, michael);
//  graph.newEdge(jessica, barbara);
//  graph.newEdge(michael, timothy);
//  graph.newEdge(franklin, monty);
//  graph.newEdge(dennis, monty);
//  graph.newEdge(monty, james);
//  graph.newEdge(barbara, timothy);
//  graph.newEdge(dennis, bianca);

document.addEventListener("DOMContentLoaded", async function () {
  var data = (await chrome.storage.local.get(["graphData"])).graphData;
  var unique_nodes = {};
  var lonely_nodes = new Map();
  for (var node of data) {
    unique_nodes[node["self"]] = graph.newNode({
      label: node["name"],
      ondoubleclick: function () {
        alert(node["self"]);
      },
    });
    lonely_nodes.set(node["self"], false);
    lonely_nodes.set(
      node["parent"],
      lonely_nodes.has(node["parent"]) ? lonely_nodes.get(node["parent"]) : true
    );
    // unique_nodes[node["parent"]] = graph.newNode({
    //   label: node["parent"],
    //   ondoubleclick: function () {
    //     alert(node["parent"]);
    //   },
    // });
  }

  for (var node of lonely_nodes.keys()) {
    if (lonely_nodes.get(node) == true) {
      unique_nodes[node] = graph.newNode({
        label: "!!!lonely!!! CHECK POPUP.JS",
        ondoubleclick: function () {
          alert(node);
        },
      });
    }
  }

  for (var node of data) {
    graph.newEdge(unique_nodes[node["self"]], unique_nodes[node["parent"]], {
      color: lightGray,
    });
  }

  jQuery(function () {
    //alert("2");
    var springy = (window.springy = jQuery("#network").springy({
      graph: graph,
    }));
    /*nodeSelected: function(node){
      alert("3");
    }*/
  });

  minScale = 0.1;
  maxScale = 5;
  zoomSensitivity = 0.1;

  document.getElementById("network").addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY;
      let newScale;
      if (delta > 0) {
        newScale = scale - zoomSensitivity;
      } else {
        newScale = scale + zoomSensitivity;
      }
      // Clamp the scale within the min/max bounds
      scale = Math.max(minScale, Math.min(maxScale, newScale));
      //alert(scale);
    },
    { passive: false }
  ); // Important for preventDefault()
});
