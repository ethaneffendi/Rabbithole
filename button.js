


document.getElementById('beginButton').addEventListener('click', async () => {
    
    const container = document.getElementById('welcomeContainer');
    container.classList.add('fade-out');


    await chrome.storage.local.set({ "welcomed": true })

    window.location.href = "hello.html";

});

window.onload = async function () {
    var welcomed = await chrome.storage.local.get(["welcomed"]);
    if (welcomed.welcomed) {
        window.location.href = "hello.html";
    }
}