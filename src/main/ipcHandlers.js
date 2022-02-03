const { Notification } = require('electron');

const fileManager = require('./fileManager');
const { screenRecorder } = require('./screenRecorder');
const videoEditor = require('./videoEditor');
const { getMostRecentFile } = require('./fileManager');
const { generateOutputName } = require('./helpers');

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
async function handleInitializeRecorder() {
    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);

    screenRecorder.initialize({ outputPath: RAW_RECORDING_PATH });
}

/**
 * Handle start recorder preview
 * @param {*} win
 * @param {*} payload
 */
function handleStartRecorderPreview(win, payload) {
    return screenRecorder.setupPreview(win, payload);
}

/**
 * Handle resize recorder preview
 * @param {*} win
 * @param {*} payload
 * @returns
 */
function handleResizeRecorderPreview(win, payload) {
    return screenRecorder.resizePreview(win, payload);
}

/**
 * Handle stop recorder preview
 */
function handleStopRecorderPreview() {
    return screenRecorder.destroyPreview();
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

    await videoEditor.remux(inputFile, outputFile);

    fileManager.deleteFile(inputFile);
}

module.exports.handleInitializeRecorder = handleInitializeRecorder;
module.exports.handleStartRecorderPreview = handleStartRecorderPreview;
module.exports.handleResizeRecorderPreview = handleResizeRecorderPreview;
module.exports.handleStopRecorderPreview = handleStopRecorderPreview;
module.exports.handleStartRecorder = handleStartRecorder;
module.exports.handleStopRecorder = handleStopRecorder;
