const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('nutrition', {
  search: query => ipcRenderer.invoke('food-search', query)
});
