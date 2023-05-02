const fs = require('fs');
const path = require('path');
const https = require('https');
const cors = require('cors');

const express = require('express');

const { store } = require('./store');
const { getMostRecentFile } = require('./fileManager');

function getLocalIp() {
    console.log(require('os').networkInterfaces());
    return Object.values(require('os').networkInterfaces()).reduce(
        (r, list) =>
            r.concat(
                list.reduce(
                    (rr, i) =>
                        rr.concat(
                            (i.family === 'IPv4' && !i.internal && i.address) ||
                                []
                        ),
                    []
                )
            ),
        []
    )[0];
}

function startServer() {
    let key = fs.readFileSync('./selfsigned.key');
    let cert = fs.readFileSync('./selfsigned.crt');
    let options = {
        key: key,
        cert: cert,
    };

    const app = express();

    let server = https.createServer(options, app);

    app.use(cors());

    app.get('/', function (req, res) {
        console.log('works index');
    });

    app.get('/ping', (req, res) => {
        res.status(200).send('Ok');
    });

    app.get('/stream', function (req, res) {
        // Ensure there is a range given for the video
        const range = req.headers.range;
        if (!range) {
            return res.status(400).send('Requires Range header');
        }

        const OUTPUT_PATH = store.get('settings.folder');
        const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
        const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
        const videoPath = path.join(RAW_RECORDING_PATH, rawRecordingName);

        let videoSize = fs.statSync(videoPath).size;

        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        // Create headers
        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${10 ** 10}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);

        // create video read stream for this particular chunk
        const videoStream = fs.createReadStream(videoPath, { start, end });

        // Stream the video chunk to the client
        videoStream.pipe(res);
    });

    app.get('/videos/:id', function (req, res) {
        // Ensure there is a range given for the video
        const range = req.headers.range;
        if (!range) {
            return res.status(400).send('Requires Range header');
        }

        const OUTPUT_PATH = store.get('settings.folder');
        const videoPath = path.join(
            OUTPUT_PATH,
            `/Videos/${req.params.id}/${req.params.id}.mp4`
        );

        let videoSize = fs.statSync(videoPath).size;

        const CHUNK_SIZE = 10 ** 6; // 1MB
        let start = Number(range.replace(/\D/g, ''));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

        // Create headers
        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${videoSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        // HTTP Status 206 for Partial Content
        res.writeHead(206, headers);

        // create video read stream for this particular chunk
        const videoStream = fs.createReadStream(videoPath, { start, end });

        // Stream the video chunk to the client
        videoStream.pipe(res);
    });

    app.get('/videos/:id/download', function (req, res) {
        const OUTPUT_PATH = store.get('settings.folder');
        const videoPath = path.join(
            OUTPUT_PATH,
            `/Videos/${req.params.id}/${req.params.id}.mp4`
        );

        res.download(videoPath);
    });

    server.listen(8002, function () {
        console.log('Listening on port 8002!');
    });
}

module.exports.getLocalIp = getLocalIp;
module.exports.startServer = startServer;
