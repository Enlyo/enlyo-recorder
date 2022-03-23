const { Notification } = require('electron');
const fileManager = require('./fileManager');
const { processMonitor } = require('./processMonitor');
const { screenRecorder } = require('./screenRecorder');
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

/**
 * Handle initialize recorder
 */
async function handleInitializeRecorder(settings) {
    screenRecorder.setSettings({ outputPath: RAW_RECORDING_PATH, ...settings });

    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);
    screenRecorder.initialize();
}

/**
 * Handle start recorder
 */
function handleStartRecorder() {
    new Notification({
        title: 'Started recording',
    }).show();

    screenRecorder.start();
}

/**
 * Handle stop recorder
 */
async function handleStopRecorder() {
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

    await fileManager.deleteFile(inputFile);

    const APP_BASE = store.get('env.appBase') || 'https://app.enlyo.com';
    require('electron').shell.openExternal(
        `${APP_BASE}?fileName=${outputName}&duration=${data.duration}`
    );
}

/**
 * Handle start process monitor
 */
function handleStartProcessMonitor(event) {
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
 * Handle stop process monitor
 */
function handleStopProcessMonitor() {
    processMonitor.stopInterval();
}

/**
 * Set setting
 */
function setSetting(key, value) {
    const storeKey = `settings.${key}`;
    store.set(storeKey, value);

    if (key === 'fps') {
        return screenRecorder.setFps(value);
    } else if (key === 'screen') {
        return screenRecorder.setScreen(value);
    } else if (key === 'resolution') {
        return screenRecorder.setResolution(value);
    }
}

/**
 * Get available screens
 */
function getAvailableScreens() {
    return screenRecorder.getAvailableScreens();
}

/**
 * Get store value
 */
function getStoreValue(key) {
    return store.get(key);
}

/**
 * Get get app version
 */
function getVersion() {
    return getAppVersion();
}

/**
 * Get active processes
 */
function getActiveProcesses() {
    return processMonitor.getActiveProcesses();
}

/**
 * Set env variables to storage
 */
function storeEnvVariables(variables) {
    store.set('env', variables);
}

module.exports.handleInitializeRecorder = handleInitializeRecorder;
module.exports.handleStartRecorder = handleStartRecorder;
module.exports.handleStopRecorder = handleStopRecorder;
module.exports.handleStartProcessMonitor = handleStartProcessMonitor;
module.exports.handleStopProcessMonitor = handleStopProcessMonitor;
module.exports.getAvailableScreens = getAvailableScreens;
module.exports.setSetting = setSetting;
module.exports.getStoreValue = getStoreValue;
module.exports.getVersion = getVersion;
module.exports.getActiveProcesses = getActiveProcesses;
module.exports.storeEnvVariables = storeEnvVariables;
