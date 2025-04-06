
//document.getDocumentElementById.addEventListener('click', newAlert);

//var aiRecommend = false;
//alert("6");
var graph = new Springy.Graph();

const cornflowerBlue = '#5959FB';
const lightGray = '#E0E0E2'; // actually alto

//graph = (await chrome.storage.local.get(['graph'])).graph

 var dennis = graph.newNode({label: 'Dennis',ondoubleclick: function(){ alert("Hi"); } });
 var michael = graph.newNode({label: 'Michael', ondoubleclick: function(){ alert("Hi"); }});
 var jessica = graph.newNode({label: 'Jessica', ondoubleclick: function(){ alert("Hi"); }});
 var timothy = graph.newNode({label: 'Timothy', ondoubleclick: function(){ alert("Hi"); }});
 var barbara = graph.newNode({label: 'Barbara', ondoubleclick: function(){ alert("Hi"); }});
 var franklin = graph.newNode({label: 'Franklin', ondoubleclick: function(){ alert("Hi"); }});
 var monty = graph.newNode({label: 'Monty', ondoubleclick: function(){ alert("Hi"); }});
 var james = graph.newNode({label: 'James', ondoubleclick: function(){ alert("Hi"); }});
 var bianca = graph.newNode({label: 'Bianca', ondoubleclick: function(){ alert("Hi"); }});

 graph.newEdge(dennis, michael, {color: lightGray});
 graph.newEdge(jessica, barbara, {color: lightGray});
 graph.newEdge(michael, timothy, {color: lightGray});
 graph.newEdge(franklin, monty, {color: lightGray});
 graph.newEdge(dennis, monty, {color: lightGray});
 graph.newEdge(monty, james, {color: lightGray});
 graph.newEdge(barbara, timothy, {color: lightGray});
 graph.newEdge(dennis, bianca, {color: lightGray});

/* alert("1");
var springy = window.springy = jQuery('#network').springy({
  graph: graph});
  /*nodeSelected: function(node){
    alert("3");
  }*/ 


jQuery(function(){
  //alert("2");
  var springy = window.springy = jQuery('#network').springy({
    graph: graph});
    /*nodeSelected: function(node){
      alert("3");
    }*/ 
});

minScale = 0.1;
maxScale = 5;
zoomSensitivity = 0.1;

document.getElementById('network').addEventListener('wheel', (event) => {
  
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
}, { passive: false }); // Important for preventDefault()
 
 

/*
document.getElementById('ai').addEventListener('click', function() {
  if (aiRecommend) {
    aiRecommend = false;
  } else {
    aiRecommend = true;
  }
}) */
/* 
document.getElementById('back').addEventListener('click', async function(){
  //alert("Hello World");
  await chrome.storage.local.set({ "welcomed": false })
  window.location.href = "index.html";
});
 */

/* document.getElementById('reload').addEventListener('click',  function(){
  alert("Hello World");
  createGraph();
});
 */

//document.getElementById('network').addEventListener('wheel', function(){alert("Hello World");}  );




