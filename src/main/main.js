const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const { setIpcListeners } = require('./ipcListeners');
const { initUpdates } = require('./autoUpdater');
const { getAppVersion } = require('./helpers');
const path = require('path');
const {
    setupTitlebar,
    attachTitlebarToWindow,
} = require('custom-electron-titlebar/main');
const { libraryInterface } = require('./libraryInterface');

/**
 * Is Development
 */
const isDevelopment = process.env.NODE_ENV === 'DEV';

/**
 * Set app version
 */
const appVersion = getAppVersion();

/**
 * Set up title bar
 */
setupTitlebar();

/**
 * Set Application User Model ID for Windows
 */
app.setAppUserModelId('Enlyo.Recorder.v' + appVersion);

if (isDevelopment) {
    const ignored = /osn-data|[/\\]\./;

    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true,
            ignored: [ignored],
        });
    } catch (_) {
        console.warn('electron reloader does not work');
    }
}

/**
 * Reegister protocols
 */

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('enlyo-recorder', process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    }
} else {
    app.setAsDefaultProtocolClient('enlyo-recorder');
}

if (isDevelopment && process.platform === 'win32') {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    // Setting this is required to get this working in dev mode.
    app.setAsDefaultProtocolClient('enlyo-recorder', process.execPath, [
        path.resolve(process.argv[1]),
    ]);
} else {
    app.setAsDefaultProtocolClient('enlyo-recorder');
}

/**
 * Create window
 */
async function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 900,
        frame: true,
        resizable: process.env.NODE_ENV === 'DEV',
        maximizable: false,
        fullscreenable: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (process.argv.includes('--hidden')) {
        win.hide();
    }

    let tray = createTray(win);

    if (process.env.NODE_ENV === 'DEV') {
        // Load the url of the dev server if in development mode
        await win.loadURL('http://localhost:8001/');
        // if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        // Load the index.html when not in development
        win.loadFile('./dist/index.html');
    }

    attachTitlebarToWindow(win);

    // Open links with target="_blank" in default browser
    win.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();

            return;
        }

        if (tray) {
            tray.destroy();
        }

        return false;
    });
}

/**
 * Create tray
 */
function createTray(win) {
    if (process.platform != 'win32') {
        return {};
    }

    const iconPath = path.join(__dirname, '../../public/icons/icon.ico');
    let appIcon = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open recorder',
            click: function () {
                win.show();
            },
        },
        {
            label: 'Open library',
            click: function () {
                libraryInterface.open();
            },
        },
        { type: 'separator' },

        {
            label: 'Quit',
            click: function () {
                app.isQuiting = true;
                app.quit();
            },
        },
    ]);

    appIcon.on('double-click', function (event) {
        win.show();
    });
    appIcon.setToolTip('Enlyo');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

const appFolder = path.dirname(process.execPath);
const exeName = path.basename(process.execPath);
const updateExe = path.resolve(appFolder, exeName);

/**
 * Launch at startup
 */
function launchAtStartup() {
    if (process.platform === 'darwin') {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
        });
    } else {
        app.setLoginItemSettings({
            openAtLogin: true,
            openAsHidden: true,
            path: updateExe,
            args: [
                '--processStart',
                `"${exeName}"`,
                '--process-start-args',
                `"--hidden"`,
            ],
        });
    }
}

/**
 * Request single instance
 */
function requestSingleInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', () => {
            // Someone tried to run a second instance, we should focus our window.
            if (win) {
                if (win.isMinimized()) win.restore();
                if (!win.isVisible()) win.show();
                win.focus();
            }
        });
    }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;

requestSingleInstance();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    createWindow();
    setIpcListeners(win);
    initUpdates(win);
    launchAtStartup();
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

// Handle open protocol
app.on('open-url', (event, url) => {
    if (win) {
        win.show();
        win.focus();
    }
});

app.on('before-quit', function () {
    app.isQuiting = true;
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
