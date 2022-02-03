const { ipcMain } = require('electron');
const {
    handleInitializeRecorder,
    handleStartRecorderPreview,
    handleResizeRecorderPreview,
    handleStartRecorder,
    handleStopRecorder,
} = require('./ipcHandlers');

/**
 * Set ipc listeners
 */
function setIpcListeners(win) {
    ipcMain.on('initialize-recorder', () => {
        handleInitializeRecorder();
    });

    ipcMain.on('start-recorder-preview', (event, payload) => {
        const result = handleStartRecorderPreview(win, payload);

        event.reply('resized-recording-preview', result);
    });

    ipcMain.on('resize-recorder-preview', (event, payload) => {
        const result = handleResizeRecorderPreview(win, payload);

        event.reply('resized-recording-preview', result);
    });

    ipcMain.on('start-recorder', (event) => {
        handleStartRecorder();

        event.reply('started-recorder');
    });

    ipcMain.on('stop-recorder', (event) => {
        handleStopRecorder();

        event.reply('stopped-recorder');
    });
}

module.exports.setIpcListeners = setIpcListeners;
