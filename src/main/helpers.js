/**
 * Generate output name
 * @param {*} rawRecordingName
 * @param {*} appendMessage
 * @param {*} format
 * @returns
 */
function generateOutputName(
    rawRecordingName,
    appendMessage = 'enlyo-recording',
    inputFormat,
    outputFormat
) {
    rawRecordingName = rawRecordingName.replace(inputFormat, '');
    rawRecordingName = rawRecordingName.replace(' ', '-');
    return `${appendMessage}-${rawRecordingName}${outputFormat}`;
}

/**
 * Get app version
 *
 * @returns
 */
function getAppVersion() {
    return require('../../package.json').version;
}

module.exports.generateOutputName = generateOutputName;
module.exports.getAppVersion = getAppVersion;
