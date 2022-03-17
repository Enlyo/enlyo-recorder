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

/**
 * Get unique list (array) by key
 * @param {Array} arr
 * @param {String} key
 * @returns
 */
function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
}

module.exports.generateOutputName = generateOutputName;
module.exports.getAppVersion = getAppVersion;
module.exports.getUniqueListBy = getUniqueListBy;
