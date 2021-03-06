const fs = require('fs');
const { promises: Fs } = require('fs');
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
 * Delete file
 */
async function deleteFile(filePath) {
    return new Promise((resolve) => {
        fs.unlink(filePath, () => {
            resolve();
        });
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

module.exports.createDirIfNotExists = createDirIfNotExists;
module.exports.deleteFile = deleteFile;
module.exports.getFileExists = getFileExists;
module.exports.getFileSize = getFileSize;
module.exports.getMostRecentFile = getMostRecentFile;
module.exports.getThumbnail = getThumbnail;
