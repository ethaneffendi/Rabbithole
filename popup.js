document.addEventListener('DOMContentLoaded', () => {
    const nodes = new vis.DataSet([
      { id: 1, label: "Animal" },
      { id: 2, label: "Mammal" },
      { id: 3, label: "Bird" },
      { id: 4, label: "Dog" },
      { id: 5, label: "Cat" },
      { id: 6, label: "Sparrow" }
    ]);
  
    const edges = new vis.DataSet([
      { from: 1, to: 2, label: "is-a" },
      { from: 1, to: 3, label: "is-a" },
      { from: 2, to: 4, label: "is-a" },
      { from: 2, to: 5, label: "is-a" },
      { from: 3, to: 6, label: "is-a" }
    ]);
  
    const container = document.getElementById('network');
    const data = { nodes, edges };
  
    const options = {
      edges: {
        arrows: { to: true },
        font: { align: 'middle' }
      },
      nodes: {
        shape: 'dot',
        size: 16,
        font: { size: 14 }
      },
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -60,
          springLength: 100,
          springConstant: 0.08
        },
        stabilization: { iterations: 100 }
      },
      interaction: {
        hover: true,
        dragNodes: true,
        zoomView: true
      }
    };
  
    new vis.Network(container, data, options);
  });
  