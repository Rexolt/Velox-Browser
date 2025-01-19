
const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');


const extensionStore = [
  { name: 'React DevTools', description: 'React appok fejlesztőeszköze' },
  { name: 'Vue DevTools', description: 'Vue.js fejlesztőeszközök' },
  { name: 'Redux DevTools', description: 'Redux állapotkezelés debug' },
];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,                
    backgroundColor: '#1e1e1e',  
    webPreferences: { 

      nodeIntegration: true,     
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
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
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});


ipcMain.handle('pickExtensionDirectory', async (event) => {
  const mainWindow = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths[0]) {
    return null;
  }
  return result.filePaths[0];
});


ipcMain.handle('installExtension', async (event, extensionPath) => {
  try {
    const loaded = await session.defaultSession.loadExtension(extensionPath);
    return { success: true, name: loaded.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


ipcMain.handle('searchExtensions', (event, query) => {

  const results = extensionStore.filter(ext => {
    return (
      ext.name.toLowerCase().includes(query.toLowerCase()) ||
      ext.description.toLowerCase().includes(query.toLowerCase())
    );
  });
  return results;
});
