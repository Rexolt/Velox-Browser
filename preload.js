const { contextBridge, ipcRenderer } = require('electron');

// Engedélyezünk néhány biztonságos funkciót a rendererben
contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action) => ipcRenderer.invoke('window-control', action),
  installExtension: () => ipcRenderer.invoke('install-extension')
});
