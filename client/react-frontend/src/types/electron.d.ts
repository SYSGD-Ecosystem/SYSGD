// Tipos para la API de Electron
export interface ElectronAPI {
  appReady: () => void;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  isDev: () => boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
