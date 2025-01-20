// renderer.js
const { ipcRenderer } = require('electron');

let tabs = [];  // {id, title, url, webviewEl, iconUrl, isActive}
let currentTabId = null;

let historyArray = [];  // { url, title, time }

const tabListEl = document.getElementById('tabList');
const webviewContainerEl = document.getElementById('webviewContainer');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const urlBar = document.getElementById('urlBar');
const favBtn = document.getElementById('favBtn');

const historyOverlay = document.getElementById('historyOverlay');
const historyListEl = document.getElementById('historyList');
const favoritesOverlay = document.getElementById('favoritesOverlay');
const favoritesListEl = document.getElementById('favoritesList');

const settingsOverlay = document.getElementById('settingsOverlay');
const hardwareAccelToggle = document.getElementById('hardwareAccelToggle');
const sandboxToggle = document.getElementById('sandboxToggle');

// --- ABLAK KEZELÉS ---
function windowControl(action) {
  ipcRenderer.invoke('windowControl', action);
}

// --- TABBING FUNKCIÓK ---
function openNewTab(url = 'https://www.google.com') {
  const tabId = Date.now().toString();
  const webview = document.createElement('webview');
  // Webview partition, pl. 'persist:velox' - tartós tároláshoz
  webview.setAttribute('partition', 'persist:velox');
  webview.src = url;
  webview.setAttribute('allowpopups', 'true');
  webview.style.display = 'none';
  webviewContainerEl.appendChild(webview);

  const newTab = {
    id: tabId,
    title: 'Új fül',
    url,
    iconUrl: '',
    webviewEl: webview,
    isActive: false
  };
  tabs.push(newTab);

  // Események
  webview.addEventListener('page-title-updated', () => {
    newTab.title = webview.getTitle();
  });
  webview.addEventListener('did-stop-loading', () => {
    newTab.url = webview.getURL();
    urlBar.value = newTab.url;

    // favicon kinyerése
    const domain = (new URL(newTab.url)).hostname;
    newTab.iconUrl = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64';

    // Előzménybe mentés
    historyArray.push({
      url: newTab.url,
      title: newTab.title,
      time: new Date()
    });
    updateTabListUI();
  });

  setActiveTab(tabId);
}

function setActiveTab(tabId) {
  if (currentTabId) {
    const oldTab = tabs.find(t => t.id === currentTabId);
    if (oldTab) {
      oldTab.isActive = false;
      oldTab.webviewEl.style.display = 'none';
    }
  }
  const newTab = tabs.find(t => t.id === tabId);
  if (newTab) {
    newTab.isActive = true;
    newTab.webviewEl.style.display = 'block';
    currentTabId = newTab.id;
    urlBar.value = newTab.url || '';
  }
  updateTabListUI();
}

function closeTab(tabId) {
  const idx = tabs.findIndex(t => t.id === tabId);
  if (idx > -1) {
    const closingTab = tabs[idx];
    webviewContainerEl.removeChild(closingTab.webviewEl);
    tabs.splice(idx, 1);

    if (closingTab.id === currentTabId) {
      if (tabs.length > 0) {
        setActiveTab(tabs[tabs.length - 1].id);
      } else {
        currentTabId = null;
        urlBar.value = '';
      }
    }
  }
  updateTabListUI();
}

function updateTabListUI() {
  tabListEl.innerHTML = '';
  tabs.forEach(tab => {
    const tabDiv = document.createElement('div');
    tabDiv.classList.add('tab-item');
    if (tab.isActive) tabDiv.classList.add('active');

    const favImg = document.createElement('img');
    favImg.className = 'favicon';
    favImg.src = tab.iconUrl || 'https://www.google.com/s2/favicons?domain=google.com&sz=64';

    const titleSpan = document.createElement('span');
    titleSpan.classList.add('tab-title');
    titleSpan.textContent = tab.title;

    const closeIcon = document.createElement('i');
    closeIcon.classList.add('material-icons', 'tab-close-icon');
    closeIcon.textContent = 'close';
    closeIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabDiv.addEventListener('click', () => setActiveTab(tab.id));

    tabDiv.appendChild(favImg);
    tabDiv.appendChild(titleSpan);
    tabDiv.appendChild(closeIcon);
    tabListEl.appendChild(tabDiv);
  });
}

// --- NAVIGÁCIÓ ---
backBtn.addEventListener('click', () => {
  const tab = getCurrentTab();
  if (tab && tab.webviewEl.canGoBack()) {
    tab.webviewEl.goBack();
  }
});
forwardBtn.addEventListener('click', () => {
  const tab = getCurrentTab();
  if (tab && tab.webviewEl.canGoForward()) {
    tab.webviewEl.goForward();
  }
});
reloadBtn.addEventListener('click', () => {
  const tab = getCurrentTab();
  if (tab) tab.webviewEl.reload();
});

urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const input = urlBar.value.trim();
    navigateTo(decideUrl(input));
  }
});

function decideUrl(input) {
  // Ha http/https protokollal kezdődik, megy simán
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  // Egyébként Google keresés
  return 'https://www.google.com/search?q=' + encodeURIComponent(input);
}

function navigateTo(url) {
  const tab = getCurrentTab();
  if (tab) tab.webviewEl.loadURL(url);
}

function getCurrentTab() {
  return tabs.find(t => t.isActive);
}

// --- KEDVENCEK ---
favBtn.addEventListener('click', async () => {
  const tab = getCurrentTab();
  if (tab) {
    const res = await ipcRenderer.invoke('addFavorite', {
      title: tab.title,
      url: tab.url
    });
    alert('Hozzáadva kedvencekhez!');
  }
});

async function showFavorites() {
  favoritesListEl.innerHTML = '';
  const favs = await ipcRenderer.invoke('getFavorites');
  if (favs.length === 0) {
    favoritesListEl.innerHTML = '<i>Nincs kedvenc eltárolva.</i>';
  } else {
    favs.forEach(f => {
      const div = document.createElement('div');
      div.style.marginBottom = '5px';
      div.innerHTML = `<b>${f.title}</b> – <a href="#">${f.url}</a>`;
      const link = div.querySelector('a');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openNewTab(f.url);
      });
      favoritesListEl.appendChild(div);
    });
  }
  favoritesOverlay.style.display = 'flex';
}

function closeFavorites() {
  favoritesOverlay.style.display = 'none';
}

// --- ELŐZMÉNYEK ---
function showHistory() {
  historyListEl.innerHTML = '';
  if (historyArray.length === 0) {
    historyListEl.innerHTML = '<i>Még nincs előzmény.</i>';
  } else {
    const reversed = [...historyArray].reverse();
    reversed.forEach(item => {
      const div = document.createElement('div');
      div.style.marginBottom = '5px';
      div.innerHTML = `[${item.time.toLocaleTimeString()}] <b>${item.title}</b> – <a href="#">${item.url}</a>`;
      const link = div.querySelector('a');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openNewTab(item.url);
        closeHistory();
      });
      historyListEl.appendChild(div);
    });
  }
  historyOverlay.style.display = 'flex';
}

function closeHistory() {
  historyOverlay.style.display = 'none';
}

// --- BŐVÍTMÉNYEK TELEPÍTÉSE ---
async function pickExtensionInstall() {
  const dirPath = await ipcRenderer.invoke('pickExtensionDirectory');
  if (!dirPath) {
    alert("Nincs mappa kiválasztva vagy megszakítva.");
    return;
  }
  const result = await ipcRenderer.invoke('installExtension', dirPath);
  if (result.success) {
    alert("Bővítmény telepítve: " + result.name);
  } else {
    alert("Hiba: " + result.error);
  }
}

// --- BEÁLLÍTÁSOK (Settings) ---
function showSettings() {
  // Esetleg betöltjük a kezdeti állapotot is (demó)
  hardwareAccelToggle.checked = false; // Itt esetleg ipcrenderer-től infót kérhetnénk
  sandboxToggle.checked = false;
  settingsOverlay.style.display = 'flex';
}
function closeSettings() {
  settingsOverlay.style.display = 'none';
}

mainWindow.webContents.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' + 
  '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
);
async function saveSettings() {
  const hwAccel = hardwareAccelToggle.checked;
  const sandbox = sandboxToggle.checked;
  // Példa: valós appnál ez a main process felé menne, és ott hívnánk app.commandLine.appendSwitch(...) 
  // DE a switch-eket jellemzően az app indulásakor állítjuk be, run-time váltogatni nem mindig lehet.
  alert(`Beállítások mentve: \nHardveres gyorsítás: ${hwAccel}\nSandbox: ${sandbox}`);
  closeSettings();
}

// Oldal betöltéskor automatikusan nyitunk egy új fület
window.addEventListener('DOMContentLoaded', () => {
  openNewTab();
});
