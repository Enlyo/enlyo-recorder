const fs = require('fs');
const path = require('path');

/**
 * Get most recent file
 * @param {*} dir
 * @returns
 */
function getMostRecentFile(dir) {
    const files = orderRecentFiles(dir);
    return files.length ? files[0] : undefined;
}

/**
 * Create dire if not exists
 */
async function createDirIfNotExists(dirpath) {
    await fs.promises.mkdir(dirpath, { recursive: true });
}

/**
 * Delete file
 * @param {*} filePath
 */
async function deleteFile(filePath) {
    fs.unlink(filePath);
}

/**
 * Order recent files
 * @param {*} dir
 * @returns
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
module.exports.createDirIfNotExists = createDirIfNotExists;
