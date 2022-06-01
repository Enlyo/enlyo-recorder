/**
 * Get file type
 */
function getFileType(file) {
    const _split = file.split('.');
    return _split[_split.length - 1];
}

/**
 * Generate output name
 */
function generateOutputName(
    rawRecordingName,
    appendMessage = 'enlyo-recording',
    appendTo = 'front',
    inputFormat = 'mp4',
    outputFormat = 'mp4'
) {
    rawRecordingName = rawRecordingName.replace(inputFormat, '');
    rawRecordingName = rawRecordingName.replace(' ', '-');
    if (appendTo === 'back')
        rawRecordingName = rawRecordingName.replace('.', '');

    return appendTo === 'front'
        ? `${appendMessage}-${rawRecordingName}${outputFormat}`
        : `${rawRecordingName}-${appendMessage}.${outputFormat}`;
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
module.exports.getFileType = getFileType;
module.exports.getUniqueListBy = getUniqueListBy;
module.exports.parseCaption = parseCaption;
module.exports.toTitleCase = toTitleCase;
