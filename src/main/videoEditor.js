/**
 * Remux
 */
function remux(inputFile, outputFile) {
    const ffmpeg = require("fluent-ffmpeg");
    const ffmpegPath = require("ffmpeg-static").replace(
        "app.asar",
        "app.asar.unpacked"
    );
    const ffprobePath = require("ffprobe-static").path.replace(
        "app.asar",
        "app.asar.unpacked"
    );

    //tell the ffmpeg package where it can find the needed binaries.
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    ffmpeg(inputFile)
        .output(outputFile)
        .withVideoCodec("copy")
        .withAudioCodec("copy")
        .run();
}

module.exports.remux = remux;
