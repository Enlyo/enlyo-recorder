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

    return new Promise((resolve) => {
        ffmpeg(inputFile)
            .output(outputFile)
            .withVideoCodec('copy')
            .withAudioCodec('copy')
            .on('end', function () {
                resolve();
            })
            .run();
    });
}

module.exports.remux = remux;
