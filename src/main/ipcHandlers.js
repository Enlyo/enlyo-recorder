const { Notification, dialog, safeStorage } = require('electron');
const fileManager = require('./fileManager');
const { processMonitor } = require('./processMonitor');
const { screenRecorder } = require('./screenRecorder');
const { libraryInterface } = require('./libraryInterface');
const videoEditor = require('./videoEditor');
const { getMostRecentFile } = require('./fileManager');
const { generateOutputName, getAppVersion } = require('./helpers');
const { store } = require('./store');
const path = require('path');
const { pusher } = require('./pusher');

/* -------------------------------------------------------------------------- */
/*                               SCREEN RECORDER                              */
/* -------------------------------------------------------------------------- */

/**
 * Initialize recorder
 */
async function initializeRecorder() {
    const OUTPUT_PATH = store.get('settings.folder');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    const settings = store.get('settings');
    screenRecorder.setSettings({ outputPath: RAW_RECORDING_PATH, ...settings });

    screenRecorder.initialize();
}

/**
 * Start recorder
 */
async function startRecorder() {
    new Notification({
        title: 'Started recording',
    }).show();

    const OUTPUT_PATH = store.get('settings.folder');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    await fileManager.createDirIfNotExists(OUTPUT_PATH);
    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);

    return await screenRecorder.start();
}

/**
 * Stop recorder
 */
async function stopRecorder() {
    const OUTPUT_PATH = store.get('settings.folder');
    const OUTPUT_APPEND_MESSAGE = store.get('settings.name');

    const INPUT_FORMAT = 'mkv';
    const OUTPUT_FORMAT = 'mp4';

    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
    const inputFile = `${RAW_RECORDING_PATH}/${rawRecordingName}`;

    const outputName = generateOutputName(
        rawRecordingName,
        OUTPUT_APPEND_MESSAGE,
        INPUT_FORMAT,
        OUTPUT_FORMAT
    );
    const outputFile = `${OUTPUT_PATH}/${outputName}`;

    // Show notification
    new Notification({
        title: 'Stopped recording',
    }).show();

    // Stop recorder
    await screenRecorder.stop();

    // Remux video
    const data = await _remuxVideo(inputFile, outputFile);

    // Enrich data
    data.folder = OUTPUT_PATH;
    data.name = outputName;
    data.thumbnail = await _generateThumbnail(outputFile, RAW_RECORDING_PATH);
    data.video = await fileManager.getVideo(outputFile);

    // Remove temp video
    await fileManager.deleteFile(inputFile);

    return data;
}

/**
 * Remux video
 */
async function _remuxVideo(inputFile, outputFile) {
    const data = await videoEditor.remux(inputFile, outputFile);
    data.size = await fileManager.getFileSize(outputFile);
    data.file = outputFile;

    return data;
}

/**
 * Generate thumbnail
 */
async function _generateThumbnail(video, path) {
    // Generate thumbnail
    await videoEditor.generateThumbnail(video, path);
    const tmpThumbnail = getMostRecentFile(path);
    const tmpThumbnailFile = `${path}/${tmpThumbnail.file}`;
    const thumbnail = await fileManager.getThumbnail(tmpThumbnailFile);
    await fileManager.deleteFile(tmpThumbnailFile);
    return thumbnail;
}

/**
 * Get available screens
 */
function getAvailableScreens() {
    return screenRecorder.getAvailableScreens();
}

/**
 * Get available speakers
 */
function getAvailableSpeakers() {
    return screenRecorder.getAvailableSpeakers();
}

/**
 * Get available microphones
 */
function getAvailableMicrophones() {
    return screenRecorder.getAvailableMicrophones();
}

/* -------------------------------------------------------------------------- */
/*                               PROCESS MONITOR                              */
/* -------------------------------------------------------------------------- */

/**
 *  Start process monitor
 */
function startProcessMonitor(event) {
    processMonitor.startInterval(
        () => _handleProcessStarted(event),
        () => _handleProcessEnded(event)
    );
}

function _handleProcessStarted(event) {
    if (!screenRecorder.isRecording) {
        event.reply('start-recorder-request');
    }
}

function _handleProcessEnded(event) {
    if (screenRecorder.isRecording) {
        event.reply('stop-recorder-request');
    }
}

/**
 *  Stop process monitor
 */
function stopProcessMonitor() {
    processMonitor.stopInterval();
}

/**
 * Get active processes
 */
function getActiveProcesses() {
    return processMonitor.getActiveProcesses();
}

/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Set setting
 */
async function setSetting(key, value) {
    try {
        const storeKey = `settings.${key}`;
        setStoreValue(storeKey, value);

        if (key === 'fps') {
            return screenRecorder.setFps(value);
        } else if (key === 'captureMode') {
            return screenRecorder.setCaptureMode(value);
        } else if (key === 'screen') {
            return screenRecorder.setScreen(value);
        } else if (key === 'resolution') {
            return screenRecorder.setResolution(value);
        } else if (key === 'speaker') {
            return screenRecorder.setSpeaker(value);
        } else if (key === 'microphone') {
            return screenRecorder.setMicrophone(value);
        } else if (key === 'speakerVolume') {
            return screenRecorder.setSpeakerVolume(value);
        } else if (key === 'microphoneVolume') {
            return screenRecorder.setMicrophoneVolume(value);
        } else if (key === 'folder') {
            const RAW_RECORDING_PATH = path.join(value, 'tmp');
            await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);
            return screenRecorder.setFolder(RAW_RECORDING_PATH);
        }
    } catch {
        console.warn('Could not set setting');
        console.warn(key);
        console.warn(value);
    }
}

/**
 * Get setting
 */
async function getSetting(key) {
    const storeKey = `settings.${key}`;
    const storeValue = getStoreValue(storeKey);
    return storeValue;
}

/* -------------------------------------------------------------------------- */
/*                                    STORE                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get store value
 */
function getStoreValue(key) {
    return store.get(key);
}

/**
 * Set store value
 */
function setStoreValue(key, value) {
    return store.set(key, value);
}

/* -------------------------------------------------------------------------- */
/*                              LIBRARY INTERFACE                             */
/* -------------------------------------------------------------------------- */

/**
 * Initialize pusher
 */
function initializePusher() {
    return pusher.start();
}

/**
 * Get has installed library app
 */
function getHasInstalledLibraryApp() {
    return libraryInterface.isLibraryAppInstalled();
}

/**
 * Test library app connection
 */
function testLibraryAppConnection() {
    return libraryInterface.testConnection();
}

/**
 * Open library video
 */
function openLibraryVideo(recording) {
    libraryInterface.openVideo({ id: recording.id });
}

/**
 * Open sharing room
 */
function openSharingRoom() {
    const roomToken = store.get('settings.roomToken');
    libraryInterface.openSharingRoom(roomToken);
}

/* -------------------------------------------------------------------------- */
/*                                    AUTH                                    */
/* -------------------------------------------------------------------------- */

/**
 * Set auth tokens
 */
function setAuthTokens(authTokens) {
    store.set('authTokens', authTokens);
}

/**
 * Set user
 */
function setUser(user) {
    store.set('user', user);
}

/**
 * Set credentials
 */
function setCredentials(email, password) {
    const emailBuffer = safeStorage.encryptString(email);
    const passwordBuffer = safeStorage.encryptString(password);
    const credentials = {
        email: emailBuffer.toString('latin1'),
        password: passwordBuffer.toString('latin1'),
    };
    store.set('credentials', credentials);
}

/**
 * Get credentials
 */
function getCredentials() {
    const credentials = store.get('credentials');

    if (!credentials || !credentials.email || !credentials.password) {
        return { email: '', password: '' };
    }

    const email = safeStorage.decryptString(
        Buffer.from(credentials.email, 'latin1')
    );
    const password = safeStorage.decryptString(
        Buffer.from(credentials.password, 'latin1')
    );

    return {
        email,
        password,
    };
}

/* -------------------------------------------------------------------------- */
/*                                    OTHER                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get get app version
 */
function getVersion() {
    return getAppVersion();
}

/**
 * Set env variables to storage
 */
function storeEnvVariables(variables) {
    store.set('env', variables);
}

/**
 * Open system player
 */
function openSystemPlayer(recording) {
    require('electron').shell.openExternal(recording.file);
}

/**
 * Open recording folder
 */
function openRecordingFolder(recording) {
    require('electron').shell.openPath(recording.folder);
}

/**
 * Select folder
 */
async function selectFolder(win) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });
    return result;
}

/**
 * Set default folder
 */
async function setDefaultFolder() {
    const VIDEO_PATH = require('electron').app.getPath('videos');
    const RECORDING_FOLDER = 'enlyo';
    const OUTPUT_PATH = path.join(VIDEO_PATH, RECORDING_FOLDER);
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    await fileManager.createDirIfNotExists(OUTPUT_PATH);
    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);

    setStoreValue('settings.folder', OUTPUT_PATH);

    screenRecorder.setFolder(RAW_RECORDING_PATH);

    return OUTPUT_PATH;
}

module.exports.getActiveProcesses = getActiveProcesses;
module.exports.getAvailableMicrophones = getAvailableMicrophones;
module.exports.getAvailableScreens = getAvailableScreens;
module.exports.getAvailableSpeakers = getAvailableSpeakers;
module.exports.getHasInstalledLibraryApp = getHasInstalledLibraryApp;
module.exports.getSetting = getSetting;
module.exports.getStoreValue = getStoreValue;
module.exports.getVersion = getVersion;
module.exports.initializePusher = initializePusher;
module.exports.initializeRecorder = initializeRecorder;
module.exports.openLibraryVideo = openLibraryVideo;
module.exports.openSystemPlayer = openSystemPlayer;
module.exports.openSharingRoom = openSharingRoom;
module.exports.openRecordingFolder = openRecordingFolder;
module.exports.selectFolder = selectFolder;
module.exports.setAuthTokens = setAuthTokens;
module.exports.setDefaultFolder = setDefaultFolder;
module.exports.setSetting = setSetting;
module.exports.setStoreValue = setStoreValue;
module.exports.setUser = setUser;
module.exports.startProcessMonitor = startProcessMonitor;
module.exports.startRecorder = startRecorder;
module.exports.stopProcessMonitor = stopProcessMonitor;
module.exports.stopRecorder = stopRecorder;
module.exports.storeEnvVariables = storeEnvVariables;
module.exports.testLibraryAppConnection = testLibraryAppConnection;
module.exports.setCredentials = setCredentials;
module.exports.getCredentials = getCredentials;
