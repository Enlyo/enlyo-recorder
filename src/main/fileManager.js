const fs = require('fs');
const path = require('path');

/**
 * Get most recent file
 */
function getMostRecentFile(dir) {
    const files = orderRecentFiles(dir);
    return files.length ? files[0] : undefined;
}

/**
 * Create dir if not exists
 */
async function createDirIfNotExists(dirpath) {
    await fs.promises.mkdir(dirpath, { recursive: true });
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

module.exports.getMostRecentFile = getMostRecentFile;
module.exports.deleteFile = deleteFile;
module.exports.createDirIfNotExists = createDirIfNotExists;
