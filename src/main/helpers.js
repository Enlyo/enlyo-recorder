/**
 * Generate output name
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
 */
function getAppVersion() {
    return require('../../package.json').version;
}

/**
 * Get unique list (array) by key
 */
function getUniqueListBy(arr, key) {
    return [...new Map(arr.map((item) => [item[key], item])).values()];
}

module.exports.generateOutputName = generateOutputName;
module.exports.getAppVersion = getAppVersion;
module.exports.getUniqueListBy = getUniqueListBy;
