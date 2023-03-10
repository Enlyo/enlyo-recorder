const path = require('path');
const { app } = require('electron');

/**
 * Set launch at startup
 */
function setLaunchAtStartup(launchAtStartup) {
    launchAtStartup = launchAtStartup === 'yes';

    const appFolder = path.dirname(process.execPath);
    const exeName = path.basename(process.execPath);
    const updateExe = path.resolve(appFolder, exeName);

    if (process.platform === 'darwin') {
        app.setLoginItemSettings({
            openAtLogin: launchAtStartup,
            openAsHidden: true,
        });
    } else {
        app.setLoginItemSettings({
            openAtLogin: launchAtStartup,
            openAsHidden: true,
            path: updateExe,
            name: 'Enlyo',
            args: [
                '--processStart',
                `"${exeName}"`,
                '--process-start-args',
                `"--hidden"`,
            ],
        });
    }
}

module.exports.setLaunchAtStartup = setLaunchAtStartup;
