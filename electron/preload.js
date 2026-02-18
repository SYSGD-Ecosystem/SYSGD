const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Función para notificar cuando la app está lista
  appReady: () => ipcRenderer.send('app-ready'),
  
  // Funciones de control de ventana
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  unmaximize: () => ipcRenderer.send('unmaximize-window'),
  close: () => ipcRenderer.send('close-app'),
  
  // Función para verificar si la ventana está maximizada
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  
  // Función para verificar si estamos en modo desarrollo
  isDev: () => process.env.NODE_ENV === 'development'
});
