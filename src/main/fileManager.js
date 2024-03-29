const { copy } = require('fluent-ffmpeg/lib/utils');
const fs = require('fs');
const Https = require('https');
const http = require('http');
const { promises: Fs } = require('fs');
const getSize = require('get-folder-size');

const path = require('path');

/* -------------------------------------------------------------------------- */
/*                                    FILES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get most recent file
 */
function getMostRecentFile(dir) {
    const files = orderRecentFiles(dir);
    return files.length ? files[0] : undefined;
}

/**
 * Get file exists
 */
async function getFileExists(path) {
    try {
        await Fs.access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get file size
 */
async function getFileSize(file) {
    return (await fs.promises.stat(file)).size;
}

/**
 * Get folder size
 */
async function getFolderSize(dir) {
    return new Promise((resolve) => {
        getSize(dir, (err, size) => {
            if (err) {
                throw err;
            }

            resolve(size);
        });
    });
}

/**
 * Get thumbnail
 */
async function getThumbnail(file) {
    return new Promise((resolve) => {
        fs.readFile(file, (err, data) => {
            if (err) {
                return;
            }
            resolve(`data:image/png;base64,${data.toString('base64')}`);
        });
    });
}

/**
 * Copy File
 */
async function copyFile(inputPath, outputPath) {
    return new Promise((resolve) => {
        fs.copyFile(inputPath, outputPath, () => {
            resolve();
        });
    });
}

/**
 * Delete file
 */
async function deleteFile(filePath) {
    return new Promise((resolve) => {
        try {
            fs.unlink(filePath, () => {
                resolve();
            });
        } catch {
            resolve();
        }
    });
}

/**
 * Delete all files
 */
function deleteAllFiles(directory) {
    fs.readdirSync(directory).forEach((file) => {
        fs.unlink(path.join(directory, file), () => {});
    });
}

/**
 *
 * @param {*} dirpath
 */
async function deleteOldFiles(folder, days) {
    fs.readdirSync(folder).forEach((file) => {
        const filePath = path.join(folder, file);
        const isOlder =
            fs.statSync(filePath).ctime <
            Date.now() - days * 24 * 60 * 60 * 1000;

        if (isOlder) {
            fs.unlinkSync(filePath);
        }
    });
}

/**
 * Rename file
 */

async function renameFile(oldPath, newPath) {
    fs.rename(oldPath, newPath, function (err) {
        if (err) console.log('ERROR: ' + err);
    });
}

/* -------------------------------------------------------------------------- */
/*                                 DIRECTORIES                                */
/* -------------------------------------------------------------------------- */

/**
 * Create dir if not exists
 */
async function createDirIfNotExists(dirpath) {
    await fs.promises.mkdir(dirpath, { recursive: true });
}

/**
 * Delete folder
 */
async function deleteFolder(path) {
    return new Promise((resolve) => {
        fs.rm(path, { recursive: true }, () => {
            resolve();
        });
    });
}

/**
 * Order recent files
 */
function orderRecentFiles(dir) {
    return fs
        .readdirSync(dir)
        .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
        .map((file) => ({
            file,
            mtime: fs.lstatSync(path.join(dir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

/* -------------------------------------------------------------------------- */
/*                                  DOWNLOAD                                  */
/* -------------------------------------------------------------------------- */

/**
 * Download a file from the given `url` into the `targetFile`.
 *
 * @param {String} url
 * @param {String} targetFile
 *
 * @returns {Promise<void>}
 */
async function downloadFile(url, targetFile) {
    return await new Promise((resolve, reject) => {
        Https.get(url, (response) => {
            const code = response.statusCode ?? 0;

            if (code >= 400) {
                return reject(new Error(response.statusMessage));
            }

            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location) {
                return downloadFile(response.headers.location, targetFile);
            }

            // save the file to disk
            const fileWriter = fs
                .createWriteStream(targetFile)
                .on('finish', () => {
                    resolve({});
                });

            response.pipe(fileWriter);
        }).on('error', (error) => {
            reject(error);
        });
    });
}

const downloadLocalFile = (url, dest, cb = () => {}) => {
    const file = fs.createWriteStream(dest);

    const request = http.get(url, (response) => {
        // check if response is success
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        response.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb));

    // check for request error too
    request.on('error', (err) => {
        fs.unlink(dest, () => cb(err.message)); // delete the (partial) file and then return the error
    });

    file.on('error', (err) => {
        // Handle errors
        fs.unlink(dest, () => cb(err.message)); // delete the (partial) file and then return the error
    });
};

module.exports.copyFile = copyFile;
module.exports.createDirIfNotExists = createDirIfNotExists;
module.exports.deleteFile = deleteFile;
module.exports.deleteAllFiles = deleteAllFiles;
module.exports.deleteFolder = deleteFolder;
module.exports.deleteOldFiles = deleteOldFiles;
module.exports.downloadFile = downloadFile;
module.exports.downloadLocalFile = downloadLocalFile;
module.exports.getFileExists = getFileExists;
module.exports.getFileSize = getFileSize;
module.exports.getFolderSize = getFolderSize;
module.exports.getMostRecentFile = getMostRecentFile;
module.exports.getThumbnail = getThumbnail;
module.exports.renameFile = renameFile;
