
//document.getDocumentElementById.addEventListener('click', newAlert);

var canvas = document.getElementById('network');

this.canvas.addEventListener('mousewheel', alert(), false);

function alert(){
  alert("Hello World");
}

var graph = new Springy.Graph();

const cornflowerBlue = '#5959FB';
const lightGray = '#E0E0E2'; // actually alto
function newAlert(){
  alert("Hello World");
}


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
graph.newEdge(michael, jessica, {color: lightGray});
graph.newEdge(jessica, barbara, {color: lightGray});
graph.newEdge(michael, timothy, {color: lightGray});
graph.newEdge(franklin, monty, {color: lightGray});
graph.newEdge(dennis, monty, {color: lightGray});
graph.newEdge(monty, james, {color: lightGray});
graph.newEdge(barbara, timothy, {color: lightGray});
graph.newEdge(dennis, bianca, {color: lightGray});
graph.newEdge(bianca, monty, {color: lightGray});

jQuery(function(){
  var springy = window.springy = jQuery('#network').springy({
    graph: graph,
    nodeSelected: function(node){
      console.log('Node selected: ' + JSON.stringify(node.data));
    }
  });
});

