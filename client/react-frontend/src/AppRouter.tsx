import { BrowserRouter, HashRouter } from "react-router-dom";

// Detección robusta del entorno
const isElectron = () => {
  // Verificar si estamos en Electron
  return !!(window && window.process && window.process.versions && window.process.versions.electron) ||
         !!(window && (window as any).electronAPI) ||
         // Verificación por user agent
         navigator.userAgent.toLowerCase().indexOf('electron') > -1;
};

const isCapacitor = () => {
  // Verificar si estamos en Capacitor
  return !!(window && (window as any).Capacitor) ||
         !!(window && (window as any).capacitor);
};

const AppRouter = ({ children }: { children: React.ReactNode }) => {
  const Router = isElectron() || isCapacitor() ? HashRouter : BrowserRouter;
  return <Router>{children}</Router>;
};

export default AppRouter;
