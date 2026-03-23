const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

// ─── CLAVE PÚBLICA RSA (embebida en el cliente, es seguro hacerla pública) ───
// Esta clave SOLO puede VERIFICAR firmas. Para CREAR licencias se necesita
// la clave privada, que solo existe en tu servidor.
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA+TfXpg9HXrxiVIrsbe29
JZ1k14gJc+2bmImBo6fVitcRUZn8Jw/VtjgsdH8/IVKg00vCw8cXjYdSvBJBfKpx
coMx8z4tqFIW8AVz34jVcLcphWhTtZbqybeJi+dQX0OIEG4WVTq+tb7gRXvbL3kV
iGj8L5qC5Gy1nDPa708xf9h9ZmZ5FjrffnqdwXzC31EXRLiyQoMTsuppCOi0lFhl
F2x2yb1YA+jq7kLZ1bfK2re0Xjxps5G4Phs0dEbAkViU9Z6C2LZti31IwbavH/iU
vHW6f2RZ0uWMwaDQ7iuOZyKiv0am+uSx6YntC/vhut15b4UsLlxDN0OObR3ifvUb
wQIDAQAB
-----END PUBLIC KEY-----`;

let splashWindow;
let mainWindow;

// ─── ALMACENAMIENTO DE LICENCIA ───────────────────────────────────────────────
const licenseStore = {
  filePath: null,
  getFilePath() {
    if (!this.filePath) {
      this.filePath = path.join(app.getPath('userData'), 'license.json');
    }
    return this.filePath;
  },
  read() {
    try {
      const p = this.getFilePath();
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error('Error leyendo licencia:', e);
    }
    return null;
  },
  write(data) {
    try {
      fs.writeFileSync(this.getFilePath(), JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error('Error guardando licencia:', e);
      return false;
    }
  },
  delete() {
    try {
      const p = this.getFilePath();
      if (fs.existsSync(p)) fs.unlinkSync(p);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// ─── MACHINE ID ───────────────────────────────────────────────────────────────
// Genera un ID único y reproducible basado en características del hardware.
// Siempre producirá el mismo valor en la misma máquina.
function getMachineId() {
  const info = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model || 'unknown',
    os.totalmem().toString(),
  ].join('|');

  return crypto.createHash('sha256').update(info).digest('hex').toUpperCase();
}

// ─── REQUEST CODE ─────────────────────────────────────────────────────────────
// El cliente genera este código para enviar al servidor.
// Contiene el machineId y un timestamp (para que el servidor rechace códigos viejos).
// Se codifica en base64url para ser fácil de copiar/pegar.
function generateRequestCode() {
  const payload = {
    machineId: getMachineId(),
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

// ─── VERIFICAR LICENCIA (100% OFFLINE) ───────────────────────────────────────
// Verifica que la licencia fue firmada por el servidor con su clave privada.
// Sin conexión a internet, sin llamadas a APIs.
function verifyLicense(licenseKey) {
  try {
    const [payloadB64, signature] = licenseKey.split('.');
    if (!payloadB64 || !signature) {
      return { valid: false, error: 'Formato de licencia inválido' };
    }

    // 1. Verificar firma RSA
    const verify = crypto.createVerify('SHA256');
    verify.update(payloadB64);
    const signatureValid = verify.verify(PUBLIC_KEY, signature, 'base64url');

    if (!signatureValid) {
      return { valid: false, error: 'La firma de la licencia es inválida' };
    }

    // 2. Decodificar payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // 3. Verificar que la licencia es para ESTE dispositivo
    const currentMachineId = getMachineId();
    if (payload.machineId !== currentMachineId) {
      return {
        valid: false,
        error: 'Esta licencia fue generada para otro dispositivo',
      };
    }

    // 4. Verificar expiración
    if (Date.now() > payload.expiresAt) {
      return {
        valid: false,
        error: 'La licencia ha expirado',
        expired: true,
        payload,
      };
    }

    return { valid: true, payload };
  } catch (e) {
    console.error('Error verificando licencia:', e);
    return { valid: false, error: 'Error al procesar la licencia' };
  }
}

// ─── IPC: HANDLERS DE LICENCIA ────────────────────────────────────────────────

// Devuelve el machineId de este dispositivo
ipcMain.handle('get-machine-id', () => getMachineId());

// Genera el request code para que el usuario lo pegue en la web
ipcMain.handle('generate-request-code', () => generateRequestCode());

// Activa una licencia: la verifica y la guarda localmente si es válida
ipcMain.handle('activate-license', (event, { licenseKey }) => {
  const result = verifyLicense(licenseKey);

  if (result.valid) {
    // Guardar la licencia en disco para futuras verificaciones offline
    licenseStore.write({
      licenseKey,
      payload: result.payload,
      activatedAt: new Date().toISOString(),
    });
  }

  return result;
});

// Verifica la licencia guardada (llamar al iniciar la app)
ipcMain.handle('check-license', () => {
  const stored = licenseStore.read();
  if (!stored) {
    return { valid: false, error: 'No hay licencia activada' };
  }

  // Re-verificar la firma y expiración cada vez que se abre la app
  const result = verifyLicense(stored.licenseKey);
  return result;
});

// Elimina la licencia guardada (desactivar)
ipcMain.handle('clear-license', () => licenseStore.delete());

// ─── IPC: CONTROL DE VENTANA ──────────────────────────────────────────────────
ipcMain.on('app-ready', () => createMainWindow());
ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('close-app', () => app.quit());
ipcMain.handle('is-maximized', () => mainWindow?.isMaximized() ?? false);

// ─── VENTANAS ─────────────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    center: true,
    frame: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, 'www/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  }

  mainWindow.once('ready-to-show', () => {
    splashWindow?.close();
    splashWindow = null;
    mainWindow.show();
  });
}

app.on('ready', createSplashWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});