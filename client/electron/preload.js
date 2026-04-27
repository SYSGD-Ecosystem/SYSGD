const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Control de ventana ──────────────────────────────────────────────────────
  appReady:    () => ipcRenderer.send('app-ready'),
  minimize:    () => ipcRenderer.send('minimize-window'),
  maximize:    () => ipcRenderer.send('maximize-window'),
  close:       () => ipcRenderer.send('close-app'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  isDev:       () => process.env.NODE_ENV === 'development',

  // Abre una URL en el navegador del sistema (sin menú contextual en Electron)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ── Licencias ───────────────────────────────────────────────────────────────
  getMachineId:        () => ipcRenderer.invoke('get-machine-id'),
  generateRequestCode: () => ipcRenderer.invoke('generate-request-code'),
  activateLicense:     (licenseKey) => ipcRenderer.invoke('activate-license', { licenseKey }),
  checkLicense:        () => ipcRenderer.invoke('check-license'),
  clearLicense:        () => ipcRenderer.invoke('clear-license'),
});