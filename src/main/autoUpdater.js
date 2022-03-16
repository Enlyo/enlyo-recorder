const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

function initUpdates(win) {
    autoUpdater.on('checking-for-update', () => {
        console.debug('checking-for-update');
        log.info('checking-for-update');

        win.webContents.send('state-updated', 'checkingUpdates');
    });

    autoUpdater.on('update-available', () => {
        console.debug('update-available');
        log.info('update-available');

        win.webContents.send('state-updated', 'updateAvailable');
    });

    autoUpdater.on('update-not-available', () => {
        console.debug('update-not-available');
        log.info('update-not-available');
        win.webContents.send('state-updated', 'active');
    });

    autoUpdater.on('update-downloaded', () => {
        console.debug('update downloaded');
        log.info('update downloaded');
        win.webContents.send('state-updated', 'updateDownloaded');

        setTimeout(function () {
            autoUpdater.quitAndInstall();
        }, 5000);
    });

    log.transports.file.level = 'debug';
    autoUpdater.logger = log;

    autoUpdater.checkForUpdatesAndNotify();
    log.info('init updates');
}

module.exports.initUpdates = initUpdates;
