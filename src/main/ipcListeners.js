const { ipcMain } = require('electron');
const {
    deleteFile,
    initializePusher,
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
    getFileUrl,
    getActiveProcesses,
    storeEnvVariables,
    setCredentials,
    setUser,
    selectFolder,
    getHasInstalledLibraryApp,
    testLibraryAppConnection,
    openLibraryVideo,
    openSharingRoom,
    openSystemPlayer,
    openRecordingFolder,
    getSetting,
    setStoreValue,
    setAuthTokens,
    setDefaultFolder,
    stopPusher,
    showWindow,
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
    /*                              LIBRARY INTERFACE                             */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('initialize-pusher', async (event, token) => {
        return await initializePusher(token);
    });

    ipcMain.handle('stop-pusher', async (event, token) => {
        return await stopPusher(token);
    });

    ipcMain.handle('get-has-installed-library-app', async () => {
        return await getHasInstalledLibraryApp();
    });

    ipcMain.handle('test-library-app-connection', async () => {
        return await testLibraryAppConnection();
    });

    ipcMain.handle('open-library-video', async (event, recording) => {
        return await openLibraryVideo(recording);
    });

    ipcMain.handle('open-sharing-room', async () => {
        return await openSharingRoom();
    });

    /* -------------------------------------------------------------------------- */
    /*                                    AUTH                                    */
    /* -------------------------------------------------------------------------- */

    ipcMain.handle('set-auth-tokens', async (event, tokens) => {
        return setAuthTokens(tokens);
    });

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

    ipcMain.handle('show-window', async () => {
        return showWindow(win);
    });

    ipcMain.handle('store-env-variables', async (event, variables) => {
        return storeEnvVariables(variables);
    });

    ipcMain.handle('open-recording-folder', async (event, recording) => {
        return await openRecordingFolder(recording);
    });

    ipcMain.handle('get-file-url', async (event, filename) => {
        return await getFileUrl(filename);
    });

    ipcMain.handle('delete-file', async (event, filename) => {
        return await deleteFile(filename);
    });

    ipcMain.handle('open-system-player', async (event, recording) => {
        return await openSystemPlayer(recording);
    });

    ipcMain.handle('select-folder', async () => {
        return await selectFolder(win);
    });

    ipcMain.handle('set-default-folder', async () => {
        return await setDefaultFolder();
    });
}

module.exports.setIpcListeners = setIpcListeners;
