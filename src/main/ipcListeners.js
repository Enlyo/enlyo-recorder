const { ipcMain } = require('electron');
const {
    initializeRecorder,
    startRecorder,
    stopRecorder,
    startProcessMonitor,
    stopProcessMonitor,
    setSetting,
    getAvailableScreens,
    getAvailableSpeakers,
    getAvailableMicrophones,
    getCredentials,
    getStoreValue,
    getVersion,
    getActiveProcesses,
    storeEnvVariables,
    setCredentials,
    setUser,
    getHasInstalledLibraryApp,
    testLibraryAppConnection,
    openLibraryVideo,
    openSystemPlayer,
    openRecordingFolder,
    getSetting,
    setStoreValue,
} = require('./ipcHandlers');

/**
 * Set ipc listeners
 */
function setIpcListeners() {
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
    /*                              LIBRARY INTERFACE                             */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('get-has-installed-library-app', async () => {
        return await getHasInstalledLibraryApp();
    });

    ipcMain.handle('test-library-app-connection', async () => {
        return await testLibraryAppConnection();
    });

    ipcMain.handle('open-library-video', async (event, recording) => {
        return await openLibraryVideo(recording);
    });

    /* -------------------------------------------------------------------------- */
    /*                                    AUTH                                    */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('set-user', async (event, user) => {
        return setUser(user);
    });

    ipcMain.handle('set-credentials', async (event, { email, password }) => {
        return setCredentials(email, password);
    });

    ipcMain.handle('get-credentials', async () => {
        return getCredentials();
    });

    /* -------------------------------------------------------------------------- */
    /*                                    OTHER                                   */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('get-app-version', async () => {
        return getVersion();
    });

    ipcMain.handle('store-env-variables', async (event, variables) => {
        return storeEnvVariables(variables);
    });

    ipcMain.handle('open-recording-folder', async (event, recording) => {
        return await openRecordingFolder(recording);
    });

    ipcMain.handle('open-system-player', async (event, recording) => {
        return await openSystemPlayer(recording);
    });
}

module.exports.setIpcListeners = setIpcListeners;
