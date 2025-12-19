import { BrowserRouter, HashRouter } from "react-router-dom";

interface CapacitorAPI {
  getPlatform?: () => string;
  isNative?: () => boolean;
}

interface ElectronAPI {
  appReady: () => void;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  isDev: () => boolean;
}

const isElectron = () => {
  return !!(window && window.process && window.process.versions && window.process.versions.electron) ||
         !!(window && (window as Window & { electronAPI?: ElectronAPI }).electronAPI) ||
         navigator.userAgent.toLowerCase().indexOf('electron') > -1;
};

const isCapacitor = () => {
  const capacitorWindow = window as Window & {
    Capacitor?: CapacitorAPI;
    capacitor?: CapacitorAPI
  };
  return !!(capacitorWindow.Capacitor) || !!(capacitorWindow.capacitor);
};

const AppRouter = ({ children }: { children: React.ReactNode }) => {
  const Router = isElectron() || isCapacitor() ? HashRouter : BrowserRouter;
  return <Router>{children}</Router>;
};

export default AppRouter;
