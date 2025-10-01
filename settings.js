// Settings logic for Rabbithole extension
const defaultSettings = {
  labelMode: 'title',
  arrowColor: '#888888',
  showFavicon: true,
  arrowSmooth: true,
  arrowWidth: 2
};

function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    document.getElementById('labelMode').value = settings.labelMode;
    document.getElementById('arrowColor').value = settings.arrowColor;
    document.getElementById('showFavicon').checked = settings.showFavicon;
    document.getElementById('arrowSmooth').checked = settings.arrowSmooth;
    document.getElementById('arrowWidth').value = settings.arrowWidth;
  });
}

function saveSettings() {
  const settings = {
    labelMode: document.getElementById('labelMode').value,
    arrowColor: document.getElementById('arrowColor').value,
    showFavicon: document.getElementById('showFavicon').checked,
    arrowSmooth: document.getElementById('arrowSmooth').checked,
    arrowWidth: parseInt(document.getElementById('arrowWidth').value, 10)
  };
  chrome.storage.sync.set(settings, () => {
    alert('Settings saved!');
  });
}

function resetSettings() {
  chrome.storage.sync.set(defaultSettings, loadSettings);
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  document.getElementById('saveSettings').onclick = saveSettings;
  document.getElementById('resetSettings').onclick = resetSettings;
});
