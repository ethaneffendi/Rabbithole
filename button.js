
const el = document.getElementById('back');
if (el) {
  el.addEventListener('click', async function() {
    //alert("backed");
    await chrome.storage.local.set({ "welcomed": false })
    window.location.href = "index.html";
  });
}

const el2 = document.getElementById('ai');
if (el2) {
  document.getElementById('ai').addEventListener('click', function() {
    //alert("Aied");
    if (aiRecommend) {
      aiRecommend = false;
    } else {
      aiRecommend = true;
    }
  });
}

document.getElementById('start').addEventListener('click', async function () {
    await chrome.storage.local.set({ "welcomed": true })
    window.location.href = "hello.html";

});

/* document.getElementById('back').addEventListener('click', async function() {
    alert("Hello World");
    await chrome.storage.local.set({ "welcomed": false })
    window.location.href = "index.html";
  });
 */

window.onload = async function () {
    var welcomed = await chrome.storage.local.get(["welcomed"]);
    if (welcomed.welcomed) {
        window.location.href = "hello.html";
    }
}

  

/* 
document.getElementById('back').addEventListener('click', async function(){
    alert("Hello World");
    await chrome.storage.local.set({ "welcomed": false })
    window.location.href = "index.html";
  }); */