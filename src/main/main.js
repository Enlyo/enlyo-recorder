const { app, BrowserWindow, shell, Tray, Menu, protocol } = require('electron');
const { setIpcListeners } = require('./ipcListeners');
const { initUpdates } = require('./autoUpdater');
const { getAppVersion } = require('./helpers');
const path = require('path');
const {
    setupTitlebar,
    attachTitlebarToWindow,
} = require('custom-electron-titlebar/main');

protocol.registerSchemesAsPrivileged([
    { scheme: 'local', privileges: { bypassCSP: true, supportFetchAPI: true } },
]);

function registerLocalVideoProtocol() {
    protocol.registerFileProtocol('local', (request, callback) => {
        const url = request.url.replace(/^local:\/\//, '');
        // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
        const decodedUrl = decodeURI(url); // Needed in case URL contains spaces
        try {
            // eslint-disable-next-line no-undef
            return callback({
                path: decodedUrl,
            });
        } catch (error) {
            console.error(
                'ERROR: registerLocalVideoProtocol: Could not get file path:',
                error
            );
        }
    });
}

/**
 * Is Development
 */
const isDevelopment = process.env.NODE_ENV === 'DEV';

/**
 * Set app version
 */
const appVersion = getAppVersion();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;

/**
 * Set up title bar
 */
setupTitlebar();

/**
 * Disable background timer throttling
 */
app.commandLine.appendSwitch('disable-background-timer-throttling');

/**
 * Enable experimental web platform features (required for browser-based filesystem access)
 */
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

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
 * Register protocols
 */

function registerProtocols() {
    if (process.defaultApp) {
        if (process.argv.length >= 1) {
            app.setAsDefaultProtocolClient('enlyo-recorder', process.execPath, [
                path.resolve(process.argv[0]),
            ]);
        }
    } else {
        app.setAsDefaultProtocolClient('enlyo-recorder');
    }

    if (isDevelopment && process.platform === 'win31') {
        // Set the path of electron.exe and your app.
        // These two additional parameters are only available on windows.
        // Setting this is required to get this working in dev mode.
        app.setAsDefaultProtocolClient('enlyo-recorder', process.execPath, [
            path.resolve(process.argv[0]),
        ]);
    } else {
        app.setAsDefaultProtocolClient('enlyo-recorder');
    }
}

/**
 * Create window
 */
async function createWindow() {
    win = new BrowserWindow({
        width: 900,
        height: 600,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    win.maximize();

    if (process.argv.includes('--hidden')) {
        win.hide();
    }

    let tray = createTray(win);

    if (process.env.NODE_ENV === 'DEV') {
        // Load the url of the dev server if in development mode
        await win.loadURL('http://localhost:3000/');
        require('vue-devtools').install();

        if (!process.env.IS_TEST) win.webContents.openDevTools();
    } else {
        // await win.loadURL('http://dev.app.enlyo.com');
        await win.loadURL('http://app.enlyo.com');
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
            id: 'start-recording',
            label: 'Start recording',
            visible: true,
            click: function (item) {
                item.visible = false;
                item.menu.getMenuItemById('stop-recording').visible = true;
                win.webContents.send('start-recorder-request');
            },
        },

        {
            id: 'stop-recording',
            label: 'Stop recording',
            visible: false,
            click: function (item) {
                item.visible = false;
                item.menu.getMenuItemById('start-recording').visible = true;
                win.webContents.send('stop-recorder-request');
            },
        },

        { type: 'separator' },

        {
            label: 'Videos',
            click: function () {
                win.webContents.send('go-to-videos');
                win.show();
            },
        },

        {
            label: 'Sharing room',
            click: function () {
                win.webContents.send('go-to-sharing-room');
                win.show();
            },
        },

        {
            label: 'Settings',
            click: function () {
                win.webContents.send('go-to-settings');
                win.show();
            },
        },

        { type: 'separator' },

        {
            enabled: false,
            label: appVersion,
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

    appIcon.on('click', () => {
        win.show();
    });

    appIcon.on('double-click', () => {
        win.webContents.send('go-to-latest-video');
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
        console.warn('There is another instance of the Enlyo Recorder active');
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

requestSingleInstance();
registerProtocols();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    createWindow();
    setIpcListeners(win);
    initUpdates(win);
    launchAtStartup();

    // protocol.registerFileProtocol('enlyo-video', fileHandler);
    registerLocalVideoProtocol();
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
