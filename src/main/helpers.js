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

/**
 * Parse caption
 */
function parseCaption(caption) {
    if (caption.includes(' - ')) {
        const words = caption.split(' - ');
        return toTitleCase(words[words.length - 1]);
    }
    return toTitleCase(caption);
}

/**
 * To title case
 */
function toTitleCase(phrase) {
    return phrase
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports.generateOutputName = generateOutputName;
module.exports.getAppVersion = getAppVersion;
module.exports.getUniqueListBy = getUniqueListBy;
module.exports.parseCaption = parseCaption;
module.exports.toTitleCase = toTitleCase;
