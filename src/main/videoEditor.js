let ffmpeg;
let ffmpegPath;
let ffprobePath;

/**
 * Set up ffmpeg
 */
function setUpFfmpeg() {
    ffmpeg = require('fluent-ffmpeg');
    ffmpegPath = require('ffmpeg-static').replace(
        'app.asar',
        'app.asar.unpacked'
    );
    ffprobePath = require('ffprobe-static').path.replace(
        'app.asar',
        'app.asar.unpacked'
    );

    // tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
}

/**
 * Remux
 */
async function remux(inputFile, outputFile) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    let duration;
    ffmpeg.ffprobe(inputFile, (error, metadata) => {
        duration = Math.round(metadata.format.duration);
    });

    return new Promise((resolve) => {
        ffmpeg(inputFile)
            .output(outputFile)
            .withVideoCodec('copy')
            .withAudioCodec('copy')
            .on('end', function () {
                resolve({ duration });
            })
            .run();
    });
}

/**
 * Generate thumbnail
 */
async function generateThumbnail(outputfile, folder) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    return new Promise((resolve) => {
        ffmpeg(outputfile)
            .on('end', function () {
                resolve();
            })
            .screenshots({
                count: 1,
                folder: folder,
                size: '640x360',
            });
    });
}

/**
 * Clip
 */
async function clip(inputFile, outputFile, startTime, endTime) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    const duration = endTime - startTime;

    return new Promise((resolve) => {
        ffmpeg(inputFile)
            .output(outputFile)
            .setStartTime(startTime)
            .setDuration(duration)
            .withVideoCodec('copy')
            .withAudioCodec('copy')
            .on('end', function (err) {
                if (!err) {
                    resolve();
                }
            })
            .run();
    });
}

module.exports.remux = remux;
module.exports.generateThumbnail = generateThumbnail;
module.exports.clip = clip;
