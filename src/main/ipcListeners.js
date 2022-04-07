const { ipcMain } = require('electron');
const {
    handleInitializeRecorder,
    handleStartRecorder,
    handleStopRecorder,
    handleStartProcessMonitor,
    handleStopProcessMonitor,
    setSetting,
    getAvailableScreens,
    getAvailableSpeakers,
    getAvailableMicrophones,
    getStoreValue,
    getVersion,
    getActiveProcesses,
    storeEnvVariables,
    getHasInstalledLibraryApp,
    testLibraryAppConnection,
} = require('./ipcHandlers');

/**
 * Set ipc listeners
 */
function setIpcListeners(win) {
    ipcMain.on('initialize-recorder', (event, settings) => {
        handleInitializeRecorder(settings);
    });

    ipcMain.on('start-recorder', async (event) => {
        await handleStartRecorder();

        event.reply('started-recorder');
    });

    ipcMain.on('stop-recorder', async (event) => {
        await handleStopRecorder();

        event.reply('stopped-recorder');
    });

    ipcMain.on('start-process-monitor', async (event) => {
        handleStartProcessMonitor(event);
    });

    ipcMain.on('stop-process-monitor', async (event) => {
        handleStopProcessMonitor(event);
    });

    ipcMain.handle('set-setting', async (event, { key, value }) => {
        return setSetting(key, value);
    });

    ipcMain.handle('get-available-screens', async (event) => {
        return await getAvailableScreens(event);
    });

    ipcMain.handle('get-available-microphones', async (event) => {
        return await getAvailableMicrophones(event);
    });

    ipcMain.handle('get-available-speakers', async (event) => {
        return await getAvailableSpeakers(event);
    });

    ipcMain.handle('get-store-value', async (event, key) => {
        return getStoreValue(key);
    });

    ipcMain.handle('get-app-version', async () => {
        return getVersion();
    });

    ipcMain.handle('get-active-processes', async () => {
        return getActiveProcesses();
    });

    ipcMain.handle('store-env-variables', async (event, variables) => {
        return storeEnvVariables(variables);
    });

    ipcMain.handle(
        'get-has-installed-library-app',
        async (event, variables) => {
            return await getHasInstalledLibraryApp();
        }
    );

    ipcMain.handle('test-library-app-connection', async (event, variables) => {
        return await testLibraryAppConnection();
    });
}

module.exports.setIpcListeners = setIpcListeners;
