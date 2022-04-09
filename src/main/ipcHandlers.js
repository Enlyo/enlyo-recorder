const { Notification } = require('electron');
const fileManager = require('./fileManager');
const { processMonitor } = require('./processMonitor');
const { screenRecorder } = require('./screenRecorder');
const { libraryInterface } = require('./libraryInterface');
const videoEditor = require('./videoEditor');
const { getMostRecentFile } = require('./fileManager');
const { generateOutputName, getAppVersion } = require('./helpers');
const { store } = require('./store');

const VIDEO_PATH = require('electron').app.getPath('videos');
const RECORDING_FOLDER = 'enlyo';
const OUTPUT_PATH = `${VIDEO_PATH}/${RECORDING_FOLDER}`;
const RAW_RECORDING_PATH = `${OUTPUT_PATH}/tmp`;

const OUTPUT_APPEND_MESSAGE = 'enlyo-recording';
const INPUT_FORMAT = 'mkv';
const OUTPUT_FORMAT = 'mp4';

/* -------------------------------------------------------------------------- */
/*                               SCREEN RECORDER                              */
/* -------------------------------------------------------------------------- */

/**
 * Initialize recorder
 */
async function initializeRecorder() {
    const settings = store.get('settings');
    screenRecorder.setSettings({ outputPath: RAW_RECORDING_PATH, ...settings });

    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);
    screenRecorder.initialize();
}

/**
 * Start recorder
 */
async function startRecorder() {
    new Notification({
        title: 'Started recording',
    }).show();

    return await screenRecorder.start();
}

/**
 * Stop recorder
 */
async function stopRecorder() {
    new Notification({
        title: 'Stopped recording',
    }).show();

    await screenRecorder.stop();

    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
    const inputFile = `${RAW_RECORDING_PATH}/${rawRecordingName}`;

    const outputName = generateOutputName(
        rawRecordingName,
        OUTPUT_APPEND_MESSAGE,
        INPUT_FORMAT,
        OUTPUT_FORMAT
    );
    const outputFile = `${OUTPUT_PATH}/${outputName}`;

    const data = await videoEditor.remux(inputFile, outputFile);
    data.folder = OUTPUT_PATH;
    data.name = outputName;
    data.file = outputFile;
    await fileManager.deleteFile(inputFile);

    return data;
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
function setSetting(key, value) {
    const storeKey = `settings.${key}`;
    setStoreValue(storeKey, value);

    if (key === 'fps') {
        return screenRecorder.setFps(value);
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
    }
}

/**
 * Get setting
 */
async function getSetting(key) {
    const storeKey = `settings.${key}`;
    console.debug(storeKey);
    const storeValue = getStoreValue(storeKey);
    console.debug(storeValue);
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
    console.debug(recording);
    require('electron').shell.openExternal(recording.file);
}

/**
 * Open recording folder
 */
function openRecordingFolder(recording) {
    console.debug(recording);
    require('electron').shell.openPath(recording.folder);
}

/**
 * Set user
 */
function setUser(user) {
    store.set('user', user);
}

module.exports.getActiveProcesses = getActiveProcesses;
module.exports.getAvailableMicrophones = getAvailableMicrophones;
module.exports.getAvailableScreens = getAvailableScreens;
module.exports.getAvailableSpeakers = getAvailableSpeakers;
module.exports.getHasInstalledLibraryApp = getHasInstalledLibraryApp;
module.exports.getSetting = getSetting;
module.exports.getStoreValue = getStoreValue;
module.exports.getVersion = getVersion;
module.exports.initializeRecorder = initializeRecorder;
module.exports.openLibraryVideo = openLibraryVideo;
module.exports.openSystemPlayer = openSystemPlayer;
module.exports.openRecordingFolder = openRecordingFolder;
module.exports.setSetting = setSetting;
module.exports.setStoreValue = setStoreValue;
module.exports.setUser = setUser;
module.exports.startProcessMonitor = startProcessMonitor;
module.exports.startRecorder = startRecorder;
module.exports.stopProcessMonitor = stopProcessMonitor;
module.exports.stopRecorder = stopRecorder;
module.exports.storeEnvVariables = storeEnvVariables;
module.exports.testLibraryAppConnection = testLibraryAppConnection;
