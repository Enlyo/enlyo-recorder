const { ipcMain } = require('electron');
const {
    clipMoment,
    clipMoments,
    deleteFile,
    getActiveProcesses,
    getAvailableMicrophones,
    getAvailableScreens,
    getAvailableSpeakers,
    getFileExists,
    getFileFromDefaultFolder,
    getFileFromFolder,
    getFileFromPicker,
    getSetting,
    getStoreValue,
    getVersion,
    initializeRecorder,
    openRecordingFolder,
    openSystemPlayer,
    saveFileToDefaultFolder,
    selectFolder,
    setDefaultFolder,
    showWindow,
    startProcessMonitor,
    startRecorder,
    stopProcessMonitor,
    stopRecorder,
    setSetting,
    setStoreValue,
    storeEnvVariables,
    deleteFileFromDefaultFolder,
} = require('./ipcHandlers');

/**
 * Set ipc listeners
 */
function setIpcListeners(win) {
    /* -------------------------------------------------------------------------- */
    /*                               SCREEN RECORDER                              */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('initialize-recorder', async () => {
        return await initializeRecorder();
    });

    ipcMain.handle('start-recorder', async () => {
        return await startRecorder();
    });

    ipcMain.handle('stop-recorder', async () => {
        return await stopRecorder();
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

    /* -------------------------------------------------------------------------- */
    /*                               PROCESS MONITOR                              */
    /* -------------------------------------------------------------------------- */

    ipcMain.on('start-process-monitor', async (event) => {
        startProcessMonitor(event);
    });

    ipcMain.on('stop-process-monitor', async (event) => {
        stopProcessMonitor(event);
    });

    ipcMain.handle('get-active-processes', async () => {
        return getActiveProcesses();
    });

    /* -------------------------------------------------------------------------- */
    /*                                  SETTINGS                                  */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('set-setting', async (event, { key, value }) => {
        return await setSetting(key, value);
    });

    ipcMain.handle('get-setting', async (event, key) => {
        return await getSetting(key);
    });

    /* -------------------------------------------------------------------------- */
    /*                                    STORE                                   */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('get-store-value', async (event, key) => {
        return getStoreValue(key);
    });

    ipcMain.handle('set-store-value', async (event, { key, value }) => {
        return setStoreValue(key, value);
    });

    /* -------------------------------------------------------------------------- */
    /*                                VIDEO EDITING                               */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('clip-moment', async (event, data) => {
        return await clipMoment(data);
    });

    ipcMain.handle('clip-moments', async (event, data) => {
        return await clipMoments(data);
    });

    /* -------------------------------------------------------------------------- */
    /*                               FILE MANAGEMENT                              */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('get-file-exists', async (event, filePath) => {
        return await getFileExists(filePath);
    });

    ipcMain.handle('get-file-from-default-folder', async (event, filename) => {
        return await getFileFromDefaultFolder(filename);
    });

    ipcMain.handle('get-file-from-folder', async (event, filename) => {
        return await getFileFromFolder(win, filename);
    });

    ipcMain.handle('get-file-from-picker', async () => {
        return await getFileFromPicker(win);
    });

    ipcMain.handle('delete-file', async (event, filePath) => {
        return await deleteFile(filePath);
    });

    ipcMain.handle(
        'delete-file-from-default-folder',
        async (event, filePath) => {
            return await deleteFileFromDefaultFolder(filePath);
        }
    );

    ipcMain.handle('select-folder', async () => {
        return await selectFolder(win);
    });

    ipcMain.handle('set-default-folder', async () => {
        return await setDefaultFolder();
    });

    ipcMain.handle('open-recording-folder', async (event, recording) => {
        return await openRecordingFolder(recording);
    });

    ipcMain.handle('save-file-to-default-folder', async (event, data) => {
        return await saveFileToDefaultFolder(win, data);
    });

    /* -------------------------------------------------------------------------- */
    /*                                    OTHER                                   */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('get-app-version', async () => {
        return getVersion();
    });

    ipcMain.handle('show-window', async () => {
        return showWindow(win);
    });

    ipcMain.handle('store-env-variables', async (event, variables) => {
        return storeEnvVariables(variables);
    });

    ipcMain.handle('open-system-player', async (event, recording) => {
        return await openSystemPlayer(recording);
    });
}

module.exports.setIpcListeners = setIpcListeners;
