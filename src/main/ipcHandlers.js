const { recorder } = require("./recorder");

/**
 * Handle initialize recorder
 */
function handleInitializeRecorder() {
    recorder.initialize();
}

/**
 * Handle start recorder preview
 * @param {*} win
 * @param {*} payload
 */
function handleStartRecorderPreview(win, payload) {
    return recorder.setupPreview(win, payload);
}

/**
 * Handle resize recorder preview
 * @param {*} win
 * @param {*} payload
 * @returns
 */
function handleResizeRecorderPreview(win, payload) {
    return recorder.resizePreview(win, payload);
}

/**
 * Handle start recorder
 */
function handleStartRecorder() {
    recorder.start();
}

/**
 * Handle stop recorder
 */
function handleStopRecorder() {
    recorder.stop();
}

module.exports.handleInitializeRecorder = handleInitializeRecorder;
module.exports.handleStartRecorderPreview = handleStartRecorderPreview;
module.exports.handleResizeRecorderPreview = handleResizeRecorderPreview;
module.exports.handleStartRecorder = handleStartRecorder;
module.exports.handleStopRecorder = handleStopRecorder;
