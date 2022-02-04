const { ipcMain } = require('electron');
const {
    handleInitializeRecorder,
    handleStartRecorderPreview,
    handleResizeRecorderPreview,
    handleStopRecorderPreview,
    handleStartRecorder,
    handleStopRecorder,
    handleStartProcessMonitor,
    handleStopProcessMonitor,
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

    ipcMain.on('resize-recorder-preview', (event, payload) => {
        const result = handleResizeRecorderPreview(win, payload);

        event.reply('resized-recording-preview', result);
    });

    ipcMain.on('stop-recorder-preview', (event, payload) => {
        const result = handleStopRecorderPreview(win, payload);

        event.reply('stopped-recording-preview', result);
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
}

module.exports.setIpcListeners = setIpcListeners;
