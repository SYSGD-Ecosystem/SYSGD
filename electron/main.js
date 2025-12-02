const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let splashWindow;
let mainWindow;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 500,
        center: true,
        frame: false,
        alwaysOnTop: true,
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.show();
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // No mostrar hasta que esté listo
        frame: false, // Eliminar barra de título del sistema
        titleBarStyle: 'hidden', // Estilo personalizado
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Cargar tu frontend build
    //mainWindow.loadURL('http://localhost:5173'); // si usas vite en modo dev

    // Para producción:
    mainWindow.loadFile(path.join(__dirname, './www/index.html'));

    // Mostrar ventana principal cuando esté lista
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
    });
}

// IPC handlers
ipcMain.on('app-ready', () => {
    createMainWindow();
});

ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('unmaximize-window', () => {
    if (mainWindow) mainWindow.unmaximize();
});

ipcMain.on('close-app', () => {
    app.quit();
});

ipcMain.handle('is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

app.on('ready', createSplashWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});
