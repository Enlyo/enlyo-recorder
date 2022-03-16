const { autoUpdater } = require('electron-updater');

function initUpdates(win) {
    autoUpdater.on('update-downloaded', () => {
        // After update download, force quit and install new version
        setTimeout(function () {
            autoUpdater.quitAndInstall();
        }, 5000);
    });

    autoUpdater.checkForUpdatesAndNotify();
}

module.exports.initUpdates = initUpdates;
