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

module.exports.generateOutputName = generateOutputName;
