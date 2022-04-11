/**
 * Remux
 */
async function remux(inputFile, outputFile) {
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static').replace(
        'app.asar',
        'app.asar.unpacked'
    );
    const ffprobePath = require('ffprobe-static').path.replace(
        'app.asar',
        'app.asar.unpacked'
    );

    // Tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

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
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static').replace(
        'app.asar',
        'app.asar.unpacked'
    );
    const ffprobePath = require('ffprobe-static').path.replace(
        'app.asar',
        'app.asar.unpacked'
    );
    // Tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

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

module.exports.remux = remux;
module.exports.generateThumbnail = generateThumbnail;
