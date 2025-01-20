
const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');


const extensionStore = [
  { name: 'React DevTools', description: 'React alkalmazások debug' },
  { name: 'Vue DevTools', description: 'Vue.js debug eszközök' },
  { name: 'Redux DevTools', description: 'Redux statekezelés nyomonkövetése' },
  { name: 'Angular Augury', description: 'Angular appok elemzése' }
];

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,          
    transparent: true,     
    backgroundColor: '#00000000',
    resizable: true,
    webPreferences: {
      
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
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

ipcMain.handle('pickExtensionDirectory', async (event) => {
  const bw = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(bw, {
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return null;
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
  const results = extensionStore.filter(item => {
    return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
  });
  return results;
});
