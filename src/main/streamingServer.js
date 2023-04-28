const fs = require('fs');
const path = require('path');

const express = require('express');

const { store } = require('./store');
const { getMostRecentFile } = require('./fileManager');

function startServer() {
    const app = express();

    app.get('/', function (req, res) {
        console.log('works index');
    });

    app.get('/stream', function (req, res) {
        console.log('works stream');

        // Ensure there is a range given for the video
        const range = req.headers.range;
        if (!range) {
            return res.status(400).send('Requires Range header');
        }

        const OUTPUT_PATH = store.get('settings.folder');
        const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
        const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
        const videoPath = path.join(RAW_RECORDING_PATH, rawRecordingName);

        console.debug(videoPath);

        let videoSize = fs.statSync(videoPath).size;
        // videoSize = videoSize * 10000;

        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        console.debug('size: ' + videoSize);
        console.debug('start: ' + start);
        console.debug('end: ' + end);
        console.debug('chunck size: ' + CHUNK_SIZE);

        // Create headers
        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${10 ** 10}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        console.debug(headers);

        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);

        // create video read stream for this particular chunk
        const videoStream = fs.createReadStream(videoPath, { start, end });

        // Stream the video chunk to the client
        videoStream.pipe(res);
    });

    app.listen(8000, function () {
        console.log('Listening on port 8000!');
    });
}

module.exports.startServer = startServer;
