
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');


const userDataPath = path.join(process.cwd(), 'veloxUserData');
app.setPath('userData', userDataPath);


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
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      sandbox: false, 
     
      devTools: true
    }
  });

  
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


ipcMain.handle('windowControl', (event, action) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  switch (action) {
    case 'minimize':
      bw.minimize();
      break;
    case 'maximize':
      if (bw.isMaximized()) bw.unmaximize();
      else bw.maximize();
      break;
    case 'close':
      bw.close();
      break;
  }
});

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

ipcMain.handle('installExtension', async (event, dirPath) => {
  try {
    const loaded = await session.defaultSession.loadExtension(dirPath);
    return { success: true, name: loaded.name };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('searchExtensions', (event, query) => {
  const q = query.toLowerCase();
  return extensionStore.filter(ext =>
    ext.name.toLowerCase().includes(q) ||
    ext.description.toLowerCase().includes(q)
  );
});
