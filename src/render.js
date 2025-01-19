/**** Globális adatok ****/
let tabs = []; // { id, title, url, webviewEl, isActive }
let currentTabId = null;

let historyList = []; // egyszerű előzmény
let bookmarks = [];   // egyszerű könyvjelző

/**** DOM elemek ****/
const tabListEl = document.getElementById("tabList");
const webviewContainerEl = document.getElementById("webviewContainer");

const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");
const reloadBtn = document.getElementById("reloadBtn");
const urlBar = document.getElementById("urlBar");

/**** Alap gombok ****/
backBtn.addEventListener("click", () => {
  const tab = getCurrentTab();
  if (tab && tab.webviewEl.canGoBack()) {
    tab.webviewEl.goBack();
  }
});

forwardBtn.addEventListener("click", () => {
  const tab = getCurrentTab();
  if (tab && tab.webviewEl.canGoForward()) {
    tab.webviewEl.goForward();
  }
});

reloadBtn.addEventListener("click", () => {
  const tab = getCurrentTab();
  if (tab) {
    tab.webviewEl.reload();
  }
});

/**** URL sáv ****/
urlBar.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const newUrl = normalizeUrl(urlBar.value);
    navigateTo(newUrl, currentTabId);
  }
});

/**** Fülek kezelése ****/
/**
 * Új fül létrehozása. 
 * Alapértelmezett oldal pl. "https://www.google.com"
 */
function openNewTab() {
  const tabId = Date.now().toString(); // egyszerű ID
  const defaultUrl = "https://www.google.com";
  
  // létrehozunk egy webview elemet
  const webview = document.createElement("webview");
  webview.src = defaultUrl;
  webview.setAttribute("allowpopups", "true");
  webview.style.display = "none";
  webviewContainerEl.appendChild(webview);

  // tab objektum
  const newTab = {
    id: tabId,
    title: "Új fül",
    url: defaultUrl,
    webviewEl: webview,
    isActive: false
  };
  tabs.push(newTab);

  // webview események
  webview.addEventListener("page-title-updated", (e) => {
    newTab.title = e.title;
    updateTabListUI();
  });
  webview.addEventListener("did-stop-loading", () => {
    newTab.url = webview.getURL();
    urlBar.value = newTab.url;
    // Előzményekhez hozzáadjuk
    historyList.push({
      url: newTab.url,
      title: newTab.title,
      time: new Date()
    });
  });

  // Aktiváljuk az új fület
  setActiveTab(tabId);
  updateTabListUI();
}

function setActiveTab(tabId) {
  // Inaktiváljuk a mostani tabet
  if (currentTabId) {
    const oldTab = tabs.find(t => t.id === currentTabId);
    if (oldTab) {
      oldTab.isActive = false;
      oldTab.webviewEl.style.display = "none";
    }
  }
  // Újat aktiváljuk
  const newTab = tabs.find(t => t.id === tabId);
  if (newTab) {
    newTab.isActive = true;
    newTab.webviewEl.style.display = "block";
    currentTabId = newTab.id;
    urlBar.value = newTab.url || "";
  }
  updateTabListUI();
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(t => t.id === tabId);
  if (tabIndex > -1) {
    // Töröljük a webview-t a DOM-ból
    const tab = tabs[tabIndex];
    webviewContainerEl.removeChild(tab.webviewEl);
    // Töröljük a tabs tömbből
    tabs.splice(tabIndex, 1);

    // Ha ez volt az aktív fül, váltunk egy másikra
    if (tabId === currentTabId) {
      if (tabs.length > 0) {
        setActiveTab(tabs[tabs.length - 1].id);
      } else {
        currentTabId = null;
        urlBar.value = "";
      }
    }
  }
  updateTabListUI();
}

function updateTabListUI() {
  // Kirendereljük a tabeket a sidebar tab-list szekcióba
  tabListEl.innerHTML = "";
  tabs.forEach(tab => {
    const tabItem = document.createElement("div");
    tabItem.classList.add("tab-item");
    if (tab.isActive) {
      tabItem.classList.add("active");
    }
    // limitáljuk a megjelenített cím hosszát
    const displayTitle = tab.title.length > 12 ? tab.title.slice(0,12)+"..." : tab.title;

    tabItem.innerHTML = `
      <span>${displayTitle}</span>
      <i class="fas fa-times tab-close-btn"></i>
    `;
    tabItem.addEventListener("click", () => setActiveTab(tab.id));
    const closeBtn = tabItem.querySelector(".tab-close-btn");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabListEl.appendChild(tabItem);
  });
}

/**** Navigáció ****/
function navigateTo(url, tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    tab.webviewEl.loadURL(url);
  }
}

/**** Előzmények és könyvjelzők ****/
function openHistory() {
  // A példa kedvéért egy alertben mutatjuk, 
  // de lehetne oldalsávon, modálban, stb.
  let msg = "Előzmények:\n";
  historyList.slice(-10).forEach(h => {
    msg += `[${h.time.toLocaleTimeString()}] ${h.title} - ${h.url}\n`;
  });
  alert(msg);
}
function openBookmarks() {
  let msg = "Könyvjelzők:\n";
  bookmarks.forEach(b => {
    msg += `${b.title} - ${b.url}\n`;
  });
  alert(msg);
}
/**** Bővítmény telepítés ****/
async function installExtension() {
  const result = await window.electronAPI.installExtension();
  if (result.success) {
    alert(`Bővítmény sikeresen telepítve: ${result.name}`);
  } else {
    alert(`Hiba a telepítéskor: ${result.error}`);
  }
}

/**** Címsor gombok (bezár, kicsinyítés, nagyítás) ****/
function handleWindowControl(action) {
  window.electronAPI.windowControl(action);
}

/**** Hasznos segédfüggvény ****/
function normalizeUrl(input) {
  // Ha nem http/https, biggyesszünk elé https://
  if (!/^https?:\/\//i.test(input)) {
    return "https://" + input;
  }
  return input;
}

/**** Induláskor nyissunk meg egy default tabet ****/
window.addEventListener("DOMContentLoaded", () => {
  openNewTab();
});
