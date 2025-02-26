const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');

// Állítsuk be a custom userData mappát
const userDataPath = path.join(process.cwd(), 'veloxUserData');
app.setPath('userData', userDataPath);

// Hardveres média gombok letiltása (opcionális)
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

let favorites = [];
const extensionStore = [
  { name: 'React DevTools', description: 'React alkalmazások debug eszközei' },
  { name: 'Vue DevTools', description: 'Vue.js debug és performance eszközök' },
  { name: 'Redux DevTools', description: 'Redux state kezelés debug' },
  { name: 'Angular Augury', description: 'Angular alkalmazások elemzése' }
];

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ha biztonságosabb modellt szeretnél, használd a preload scriptet a contextBridge-rel
      webviewTag: true,        // Engedélyezzük a <webview> elemet
      sandbox: false,
      devTools: true
    }
  });

  // Az index.html betöltése az "app" mappából
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC üzenetkezelők

// Ablakvezérlés: minimalizálás, maximalizálás, bezárás
ipcMain.handle('windowControl', (event, action) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  switch (action) {
    case 'minimize':
      bw.minimize();
      break;
    case 'maximize':
      if (bw.isMaximized()) {
        bw.unmaximize();
      } else {
        bw.maximize();
      }
      break;
    case 'close':
      bw.close();
      break;
    default:
      break;
  }
});

// Kedvencek kezelése
ipcMain.handle('addFavorite', (event, { title, url }) => {
  const exists = favorites.find(fav => fav.url === url);
  if (!exists) {
    favorites.push({ title, url, time: new Date() });
  }
  return favorites;
});
ipcMain.handle('getFavorites', () => {
  return favorites;
});

// Bővítmények telepítéséhez szükséges mappa kiválasztása
ipcMain.handle('pickExtensionDirectory', async (event) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(bw, {
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths[0]) {
    return null;
  }
  return result.filePaths[0];
});

// Bővítmény telepítése
ipcMain.handle('installExtension', async (event, dirPath) => {
  try {
    const loaded = await session.defaultSession.loadExtension(dirPath);
    return { success: true, name: loaded.name };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Bővítmények keresése a tárolóban
ipcMain.handle('searchExtensions', (event, query) => {
  const q = query.toLowerCase();
  return extensionStore.filter(ext =>
    ext.name.toLowerCase().includes(q) ||
    ext.description.toLowerCase().includes(q)
  );
});
