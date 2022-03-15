const { ipcMain } = require('electron');
const {
    handleInitializeRecorder,
    handleStartRecorderPreview,
    handleStartRecorder,
    handleStopRecorder,
    handleStartProcessMonitor,
    handleStopProcessMonitor,
    setFps,
    setScreen,
    getAvailableScreens,
    getStoreValue,
    setStoreValue,
} = require('./ipcHandlers');

/**
 * Set ipc listeners
 */
function setIpcListeners(win) {
    ipcMain.on('initialize-recorder', () => {
        handleInitializeRecorder();
    });

    ipcMain.on('start-recorder-preview', async (event, payload) => {
        const sources = await handleStartRecorderPreview(payload);

        event.reply('started-recorder-preview', sources);
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
        return setScreen(key, value);
    });

    ipcMain.handle('get-available-screens', async (event) => {
        return await getAvailableScreens(event);
    });

    ipcMain.handle('get-store-value', async (event, key) => {
        return getStoreValue(key);
    });
}

module.exports.setIpcListeners = setIpcListeners;
