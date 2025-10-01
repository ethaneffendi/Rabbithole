
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("back").addEventListener("click", async function () {
    await chrome.storage.local.set({ welcomed: false });
    // alert((await chrome.storage.local.get(["welcomed"])).welcomed)
    window.location.href = "index.html";
  });

  document.getElementById("reset").addEventListener("click", async function () {
    await chrome.storage.local.set({ graphData: []});
    await chrome.storage.local.set({ id_to_parent: {}});
  });
<<<<<<< Updated upstream
=======

  // Node search functionality
  const searchInput = document.getElementById("node-search");
  const searchBtn = document.getElementById("search-node-btn");
  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", function () {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) return;
      // Try to find node by id or label
      let foundId = null;
      if (window.currentNetwork && window.currentNetwork.body && window.currentNetwork.body.data && window.currentNetwork.body.data.nodes) {
        window.currentNetwork.body.data.nodes.forEach(function(node) {
          if (
            (node.id && node.id.toLowerCase().includes(query)) ||
            (node.label && node.label.toLowerCase().includes(query))
          ) {
            foundId = node.id;
          }
        });
      }
      if (foundId && window.currentNetwork) {
        window.currentNetwork.selectNodes([foundId]);
        // Get node position and move the view to it
        const pos = window.currentNetwork.getPositions([foundId])[foundId];
        if (pos) {
          window.currentNetwork.moveTo({ position: pos, scale: 1.5, animation: true });
        } else {
          window.currentNetwork.focus(foundId, { scale: 1.5, animation: true });
        }
      } else {
        alert("Node not found");
      }
    });
  }
>>>>>>> Stashed changes
});