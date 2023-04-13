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
async function generateThumbnail(outputfile, folder, duration) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    const thumbnailTime = Math.round(duration / 2);

    return new Promise((resolve) => {
        ffmpeg(outputfile)
            .on('end', function () {
                resolve();
            })
            .screenshots({
                timestamp: [thumbnailTime],
                count: 1,
                folder: folder,
                size: '640x360',
            });
    });
}

/**
 * Clip
 */
async function clip(inputFile, outputFile, startTime = null, endTime = null) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    return new Promise((resolve) => {
        const clipper = ffmpeg(inputFile)
            .output(outputFile)
            .withVideoCodec('copy')
            .withAudioCodec('copy')
            .on('end', function (err) {
                if (!err) {
                    resolve();
                }
            })
            .on('error', function (err, stdout, stderr) {
                console.log(err);
                console.log('ffmpeg stdout:\n' + stdout);
                console.log('ffmpeg stderr:\n' + stderr);
            })
            .on('start', (cmdline) => console.log(cmdline));

        if (startTime && endTime) {
            const duration = endTime - startTime;
            clipper.setStartTime(startTime).setDuration(duration);
        }

        clipper.run();
    });
}

/**
 * Convert playlist to mp4
 */
async function convertPlaylistToMp4(inputFile, outputFile) {
    if (!ffmpeg) {
        setUpFfmpeg();
    }

    return new Promise((resolve) => {
        ffmpeg(inputFile)
            .output(outputFile)
            .withVideoCodec('copy')
            .withAudioCodec('copy')
            .outputOptions(['-bsf:a aac_adtstoasc'])
            .on('end', function (err) {
                if (!err) {
                    resolve();
                }
            })
            .on('start', (cmdline) => console.log(cmdline))
            .run();
    });
}

module.exports.clip = clip;
module.exports.convertPlaylistToMp4 = convertPlaylistToMp4;
module.exports.generateThumbnail = generateThumbnail;
module.exports.remux = remux;
