export type LicenseTier = "monthly" | "quarterly" | "annual";

export interface LicensePayload {
  machineId: string;
  email: string;
  tier: LicenseTier;
  issuedAt: number;
  expiresAt: number;
}

export interface LicenseCheckResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
  expired?: boolean;
}

export interface ElectronAPI {
  // Control de ventana
  appReady: () => void;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  isDev: () => boolean;

  // Abre una URL en el navegador del sistema operativo
  openExternal: (url: string) => Promise<void>;

  // Licencias
  getMachineId: () => Promise<string>;
  generateRequestCode: () => Promise<string>;
  activateLicense: (licenseKey: string) => Promise<LicenseCheckResult>;
  checkLicense: () => Promise<LicenseCheckResult>;
  clearLicense: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}