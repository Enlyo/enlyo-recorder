const { app, BrowserWindow } = require('electron');
const { setIpcListeners } = require('./ipcListeners');
const path = require('path');

/**
 * Is Development
 */
const isDevelopment = process.env.NODE_ENV === 'DEV';

/**
 * Create window
 */
async function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 650,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        resizable: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#202225',
            symbolColor: '#e0e0e0'
        },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (process.env.NODE_ENV === 'DEV') {
        // Load the url of the dev server if in development mode
        await win.loadURL('http://localhost:8080/');
        // if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        // Load the index.html when not in development
        win.loadFile('./dist/index.html');
    }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    createWindow();
    setIpcListeners(win);
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit();
            }
        });
    } else {
        process.on('SIGTERM', () => {
            app.quit();
        });
    }
}
