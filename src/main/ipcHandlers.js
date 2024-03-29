const path = require('path');
const { BrowserWindow, Notification, dialog } = require('electron');
const { outputFile } = require('fs-extra');
const fs = require('fs');

const { store } = require('./store');

const fileManager = require('./fileManager');
const videoEditor = require('./videoEditor');
const { generateOutputName, getAppVersion, getFileType } = require('./helpers');
const { getMostRecentFile } = require('./fileManager');
const { processMonitor } = require('./processMonitor');
const { screenRecorder } = require('./screenRecorder');
const { setLaunchAtStartup } = require('./app');
const { createGameParser } = require('./gameParser');
const { createProcessHandler } = require('./processHandler');
const { createM3u8Writer } = require('./m3u8Writer');

let cameraWin;
let m3u8Writer;

const OUTPUT_FORMAT = 'mp4';
const RECORDING_DIR = path.join('tmp', 'recording');

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

async function getDir(relativeDir) {
    let baseDir = store.get('settings.folder');
    if (!baseDir) {
        baseDir = await setDefaultFolder();
    }
    const dir = path.join(baseDir, relativeDir);
    await fileManager.createDirIfNotExists(dir);
    return dir;
}

async function getRecordingDir() {
    return await getDir(RECORDING_DIR);
}

/* -------------------------------------------------------------------------- */
/*                               SCREEN RECORDER                              */
/* -------------------------------------------------------------------------- */

/**
 * Initialize recorder
 */
async function initializeRecorder() {
    const settings = store.get('settings');
    screenRecorder.setSettings({
        outputPath: await getRecordingDir(),
        ...settings,
    });
    screenRecorder.initialize();
}

/**
 * Start recorder
 */
async function startRecorder() {
    const recordingDir = await getRecordingDir();

    m3u8Writer = createM3u8Writer(recordingDir);
    m3u8Writer.start();

    return await screenRecorder.start();
}

/**
 * Stop recorder
 */
async function stopRecorder() {
    await screenRecorder.stop();
    await m3u8Writer.stop();
}

/**
 * Save recording
 */
async function saveRecording({ name, folder }) {
    const outputDir = await getDir(folder);
    recordingDir = await getRecordingDir();
    const inputPath = path.join(recordingDir, 'index.m3u8');

    console.debug('---');
    console.debug('Remuxing recording...');
    const index = fs.readFileSync(inputPath, {
        encoding: 'utf8',
        flag: 'r',
    });
    console.debug(index);
    console.debug('---');

    // Save recording
    const outputName = `${name}.${OUTPUT_FORMAT}`;
    const outputPath = path.join(outputDir, outputName);
    let data = await videoEditor.remux(inputPath, outputPath);

    // Retry mechanism for remuxing the video (Let's see if we can find a better method)
    if (!data) {
        console.debug('retry');
        data = await videoEditor.remux(inputPath, outputPath);
    }
    if (!data) {
        console.debug('retry');
        data = await videoEditor.remux(inputPath, outputPath);
    }

    // Calculate file specifics
    const size = await fileManager.getFileSize(outputPath);
    const thumbnail = await _generateThumbnail(
        outputPath,
        recordingDir,
        data.duration
    );

    // Remove temp files
    fileManager.deleteAllFiles(recordingDir);

    return {
        dir: outputDir,
        duration: data.duration,
        fileHandle: {
            duration: data.duration,
            name: outputName,
            path: outputPath,
            size: size,
            url: `local://${outputPath}`,
        },
        name: outputName,
        path: outputPath,
        size: size,
        thumbnail: thumbnail,
    };
}

/**
 * Generate thumbnail
 */
async function _generateThumbnail(video, path, duration) {
    await videoEditor.generateThumbnail(video, path, duration);
    const tmpThumbnail = getMostRecentFile(path);
    const tmpThumbnailFile = `${path}/${tmpThumbnail.file}`;
    const thumbnail = await fileManager.getThumbnail(tmpThumbnailFile);
    await fileManager.deleteFile(tmpThumbnailFile);
    return thumbnail;
}

/**
 * Get available screens
 */
function getAvailableScreens() {
    return screenRecorder.getAvailableScreens();
}

/**
 * Get available speakers
 */
function getAvailableSpeakers() {
    return screenRecorder.getAvailableSpeakers();
}

/**
 * Get available microphones
 */
function getAvailableMicrophones() {
    return screenRecorder.getAvailableMicrophones();
}

/* -------------------------------------------------------------------------- */
/*                                   CAMERA                                   */
/* -------------------------------------------------------------------------- */

/**
 * Show camera
 */
async function showCamera(win, cam) {
    const { screen } = require('electron');

    let display = screen.getPrimaryDisplay();
    const { height } = display.workAreaSize;

    cameraWin = new BrowserWindow({
        alwaysOnTop: true,
        frame: false,
        height: 176,
        resizable: false,
        maximizable: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preloadWebcam.js'),
        },
        show: false,
        transparent: true,
        width: 176,
        x: 10,
        y: height - 10 - 174,
    });

    cameraWin.setAlwaysOnTop(true, 'floating');
    cameraWin.setVisibleOnAllWorkspaces(true);
    cameraWin.setFullScreenable(false);

    cameraWin.on('close', function () {
        cameraWin = null;
    });

    cameraWin.webContents.on('did-finish-load', () => {
        cameraWin.show();
        win.show();
    });

    await cameraWin.loadFile(path.join(__dirname, './webcam.html'));
    cameraWin.webContents.send('set-cam', cam);
}

/**
 * Hide camera
 */
async function hideCamera() {
    if (!cameraWin) return;

    cameraWin.close();
    cameraWin = null;
}

/* -------------------------------------------------------------------------- */
/*                               PROCESS MONITOR                              */
/* -------------------------------------------------------------------------- */

/**
 *  Start process monitor
 */
function startProcessMonitor(event, { autoRecordProcesses }, win) {
    const gameParser = createGameParser();
    const processHandler = createProcessHandler(gameParser);

    processMonitor.startInterval(
        async () => await processHandler.handleProcessStarted(event, win),
        async () => await processHandler.handleProcessEnded(event),
        autoRecordProcesses
    );
}

/**
 *  Stop process monitor
 */
function stopProcessMonitor() {
    processMonitor.stopInterval();
}

/**
 * Get active processes
 */
function getActiveProcesses() {
    return processMonitor.getActiveProcesses();
}

/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Set setting
 */
async function setSetting(key, value) {
    try {
        const storeKey = `settings.${key}`;
        setStoreValue(storeKey, value);

        if (key === 'fps') {
            return screenRecorder.setFps(value);
        } else if (key === 'captureMode') {
            return screenRecorder.setCaptureMode(value);
        } else if (key === 'screen') {
            return screenRecorder.setScreen(value);
        } else if (key === 'resolution') {
            return screenRecorder.setResolution(value);
        } else if (key === 'speaker') {
            return screenRecorder.setSpeaker(value);
        } else if (key === 'microphone') {
            return screenRecorder.setMicrophone(value);
        } else if (key === 'speakerVolume') {
            return screenRecorder.setSpeakerVolume(value);
        } else if (key === 'microphoneVolume') {
            return screenRecorder.setMicrophoneVolume(value);
        } else if (key === 'folder') {
            return screenRecorder.setFolder(await getRecordingDir());
        } else if (key === 'launchAtStartup') {
            setLaunchAtStartup(value);
        }
    } catch {
        console.warn('Could not set setting');
        console.warn(key);
        console.warn(value);
    }
}

/**
 * Get setting
 */
async function getSetting(key) {
    const storeKey = `settings.${key}`;
    const storeValue = getStoreValue(storeKey);
    return storeValue;
}

/* -------------------------------------------------------------------------- */
/*                                    STORE                                   */
/* -------------------------------------------------------------------------- */

/**
 * Get store value
 */
function getStoreValue(key) {
    return store.get(key);
}

/**
 * Set store value
 */
function setStoreValue(key, value) {
    return store.set(key, value);
}

/* -------------------------------------------------------------------------- */
/*                                VIDEO EDITING                               */
/* -------------------------------------------------------------------------- */

/**
 * Clip moments
 */
async function clipMoments({ moments }) {
    const clippedMoments = await _clipMoments({ moments });
    return {
        success: true,
        clips: clippedMoments,
    };
}

async function _clipMoments({ moments }) {
    let clippedMoments = [];

    for (let index = 0; index < moments.length; index++) {
        const moment = moments[index];
        const data = await _clipMoment(moment);
        clippedMoments.push(data);
    }

    return clippedMoments;
}

/**
 * Clip
 */
async function clip({ fileHandle, startTime, endTime, folder, outputName }) {
    try {
        return await _clip({
            fileHandle,
            startTime,
            endTime,
            folder,
            outputName,
        });
    } catch (error) {
        return {
            success: false,
        };
    }
}

async function _clip({ fileHandle, startTime, endTime, folder, outputName }) {
    startTime = startTime / 1000;
    endTime = endTime / 1000;

    const WORKSPACE_PATH = store.get('settings.folder');
    const outputFolder = folder
        ? path.join(WORKSPACE_PATH, folder)
        : WORKSPACE_PATH;
    await fileManager.createDirIfNotExists(outputFolder);

    const fileName = fileHandle.name;
    const fileType = getFileType(fileName);
    const inputFile = fileHandle.path;

    const outputFilename = outputName
        ? `${outputName}.${fileType}`
        : generateOutputName(
              fileName,
              `${startTime}-${endTime}`,
              'back',
              fileType,
              fileType
          );
    const outputFile = path.join(outputFolder, outputFilename);

    if (inputFile === outputFile) {
        const tmpOutputFile = path.join(outputFolder, 'tmp.' + fileType);
        await videoEditor.clip(inputFile, tmpOutputFile, startTime, endTime);
        fileManager.deleteFile(inputFile);
        fileManager.renameFile(tmpOutputFile, outputFile);
    } else {
        await videoEditor.clip(inputFile, outputFile, startTime, endTime);
    }

    const size = await fileManager.getFileSize(outputFile);
    const dataUrl = `local://${outputFile}`;

    return {
        success: true,
        data: {
            fileHandle: {
                path: outputFile,
                name: outputFilename,
                url: dataUrl,
                size,
            },
            file: {
                name: outputFilename,
                size,
            },
        },
    };
}

/* -------------------------------------------------------------------------- */
/*                               FILE MANAGEMENT                              */
/* -------------------------------------------------------------------------- */

/**
 * Copy file
 */
async function copyFile({ inputPath, outputFolder, outputName }) {
    const fileType = getFileType(inputPath);

    const workspace = store.get('settings.folder');
    await fileManager.createDirIfNotExists(path.join(workspace, outputFolder));
    const outputPath = path.join(
        workspace,
        outputFolder,
        `${outputName}.${fileType}`
    );
    await fileManager.copyFile(inputPath, outputPath);

    return {
        success: true,
        fileHandle: {
            path: outputPath,
            name: `${outputName}.${fileType}`,
            size: await fileManager.getFileSize(outputPath),
            url: `local://${outputPath}`,
        },
    };
}

/**
 * Delete folder
 */
async function deleteFolder(folder) {
    const workspace = store.get('settings.folder');
    const toBeDeleted = path.join(workspace, folder);

    return await fileManager.deleteFolder(toBeDeleted);
}

/**
 * Get file exists
 *
 */
async function getFileExists(filePath) {
    return await fileManager.getFileExists(filePath);
}

/**
 * Get file from picker
 */
async function getFileFromPicker(win) {
    try {
        return await _getFileFromPicker(win);
    } catch (error) {
        return { success: false, reason: error };
    }
}

async function _getFileFromPicker(win) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
    });

    if (!result.canceled) {
        const filePath = result.filePaths[0];
        const name = path.basename(filePath);
        const size = await fileManager.getFileSize(filePath);
        const url = `local://${result.filePaths[0]}`;

        return {
            fileFound: true,
            fileHandle: {
                path: filePath,
                name,
                size,
                url,
            },
            file: {
                name,
                size,
            },
        };
    }

    return { fileFound: false, reason: 'canceled' };
}

/**
 * Get file from folder
 */
async function getFileFromFolder(win, filename) {
    try {
        return await _getFileFromFolder(win, filename);
    } catch (error) {
        return { fileFound: false, reason: error };
    }
}

async function _getFileFromFolder(win, filename) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });

    if (result.canceled) {
        return { success: false, reason: 'UserCanceled' };
    }

    const folderPath = result.filePaths[0];
    const filePath = `${folderPath}/${filename}`;
    const fileExists = await fileManager.getFileExists(filePath);

    if (!fileExists) {
        return { fileFound: false, reason: 'FileNotFound' };
    }

    const size = await fileManager.getFileSize(filePath);
    const url = `local://${filePath}`;

    return {
        fileFound: true,
        fileHandle: {
            path: filePath,
            name: filename,
            size,
            url,
        },
    };
}

/**
 * Get file from default folder
 */
async function getFileFromDefaultFolder({ filename, folder }) {
    try {
        return await _getFileFromDefaultFolder({ filename, folder });
    } catch (error) {
        return { fileFound: false, reason: error };
    }
}

async function _getFileFromDefaultFolder({ filename, folder }) {
    const DEFAULT_FOLDER = store.get('settings.folder');
    const folderPath = folder
        ? path.join(DEFAULT_FOLDER, folder)
        : DEFAULT_FOLDER;
    const filePath = path.join(folderPath, filename);
    const fileExists = await fileManager.getFileExists(filePath);

    if (!fileExists) {
        return { fileFound: false, reason: 'FileNotFound' };
    }

    const size = await fileManager.getFileSize(filePath);
    const url = `local://${filePath}`;

    return {
        fileFound: true,
        fileHandle: {
            path: filePath,
            name: filename,
            size,
            url,
        },
    };
}

/**
 * Delete file
 */
async function deleteFile({ filePath, deleteFolder }) {
    const fileExists = await fileManager.getFileExists(filePath);
    if (!fileExists) {
        return { fileDeleted: false };
    }

    deleteFolder
        ? await fileManager.deleteFolder(path.dirname(filePath))
        : await fileManager.deleteFile(filePath);

    return { fileDeleted: true };
}

/**
 * Delete old files
 */
async function deleteOldFiles({ folder, days }) {
    const DEFAULT_FOLDER = store.get('settings.folder');
    const folderPath = folder
        ? path.join(DEFAULT_FOLDER, folder)
        : DEFAULT_FOLDER;
    await fileManager.deleteOldFiles(folderPath, days);
}

/**
 * Delete file from default folder
 */
async function deleteFileFromDefaultFolder(filename) {
    const DEFAULT_FOLDER = store.get('settings.folder');
    const filePath = `${DEFAULT_FOLDER}/${filename}`;

    const fileExists = await fileManager.getFileExists(filePath);
    if (!fileExists) {
        return { fileDeleted: false };
    }

    await fileManager.deleteFile(filePath);
    return { fileDeleted: true };
}

/**
 * Select folder
 */
async function selectFolder(win) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });

    if (!result.canceled) {
        const defaultDir = result.filePaths[0];

        setStoreValue('settings.folder', defaultDir);

        const recordingDir = await getRecordingDir();
        screenRecorder.setFolder(recordingDir);
    }

    return result;
}

/**
 * Set default folder
 */
async function setDefaultFolder() {
    const videoDir = require('electron').app.getPath('videos');
    const defaultDir = path.join(videoDir, 'Enlyo');

    await fileManager.createDirIfNotExists(defaultDir);
    setStoreValue('settings.folder', defaultDir);

    return defaultDir;
}

/**
 * Open recording folder
 */
function openRecordingFolder(recording) {
    require('electron').shell.openPath(recording.folder);
}

/**
 * Save file to default folder
 */
async function saveFileToDefaultFolder(win, data) {
    const DEFAULT_FOLDER = store.get('settings.folder');
    const fileFolder = data.folder
        ? path.join(DEFAULT_FOLDER, data.folder)
        : DEFAULT_FOLDER;
    await fileManager.createDirIfNotExists(fileFolder);
    const filePath = path.join(fileFolder, data.name);

    outputFile(filePath, data.buffer, (err) => {
        if (err) {
            return { fileSaved: false };
        } else {
            return { fileSaved: true };
        }
    });
}

/**
 * Get workspace size
 */
async function getWorkspaceSize() {
    const DEFAULT_FOLDER = store.get('settings.folder');
    return await fileManager.getFolderSize(DEFAULT_FOLDER);
}

/* -------------------------------------------------------------------------- */
/*                                  DOWNLOAD                                  */
/* -------------------------------------------------------------------------- */

async function downloadFiles({ files, folder }) {
    return await new Promise(async (resolve) => {
        let downloads = [];
        let fileHandles = {};

        const DEFAULT_FOLDER = folder
            ? path.join(store.get('settings.folder'), folder)
            : store.get('settings.folder');

        for (let index = 0; index < files.length; index++) {
            const { url, folder, name, key } = files[index];
            const folderPath = folder
                ? path.join(DEFAULT_FOLDER, folder)
                : DEFAULT_FOLDER;
            await fileManager.createDirIfNotExists(folderPath);
            const filePath = path.join(folderPath, name);

            downloads.push(videoEditor.convertPlaylistToMp4(url, filePath));
            fileHandles[key] = {
                path: filePath,
                name: name,
                url: `local://${filePath}`,
            };
        }

        Promise.all(downloads).then(async () => {
            // Get filesizes
            for (const key in fileHandles) {
                fileHandles[key].size = await fileManager.getFileSize(
                    fileHandles[key].path
                );
            }
            resolve(fileHandles);
        });
    });
}

/* -------------------------------------------------------------------------- */
/*                                   EXPORT                                   */
/* -------------------------------------------------------------------------- */

/**
 * Export single
 */
async function exportSingle(win, { fileHandle, title }) {
    const result = await dialog.showOpenDialog(win, {
        title: 'Select directory to export to',
        buttonLabel: 'Select',
        properties: ['openDirectory'],
    });

    if (!result.canceled) {
        const fileType = getFileType(fileHandle.name);
        const outputFolder = result.filePaths[0];
        const outputPath = path.join(outputFolder, `${title}.${fileType}`);

        await videoEditor.clip(fileHandle.path, outputPath);
    }

    return result;
}

/**
 * Export multiple
 */
async function exportMultiple(win, { folder, files }) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });

    if (!result.canceled) {
        let outputFolder = result.filePaths[0];
        if (folder) {
            outputFolder = path.join(outputFolder, folder);
            fileManager.createDirIfNotExists(outputFolder);
        }

        for (let index = 0; index < files.length; index++) {
            const { fileHandle, title } = files[index];
            const fileType = getFileType(fileHandle.name);
            const outputPath = path.join(outputFolder, `${title}.${fileType}`);

            await videoEditor.clip(fileHandle.path, outputPath);
        }
    }

    return result;
}

/**
 * Export multiple clips
 */
async function exportMultipleClips(win, { clips, folder }) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });

    if (!result.canceled) {
        let outputFolder = result.filePaths[0];
        if (folder) {
            outputFolder = path.join(outputFolder, folder);
            fileManager.createDirIfNotExists(outputFolder);
        }

        for (let index = 0; index < clips.length; index++) {
            const clip = clips[index];

            await _exportClip({
                ...clip,
                outputFolder,
            });
        }
    }

    return result;
}

/**
 * Export clip
 */
async function exportClip(
    win,
    { fileHandle, title, startTime, endTime, folder }
) {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
    });

    if (!result.canceled) {
        let outputFolder = result.filePaths[0];

        await _exportClip({
            fileHandle,
            title,
            startTime,
            endTime,
            outputFolder,
            folder,
        });
    }

    return result;
}

async function _exportClip({
    fileHandle,
    title,
    startTime,
    endTime,
    outputFolder,
    folder,
}) {
    startTime = startTime / 1000;
    endTime = endTime / 1000;

    if (folder) {
        outputFolder = path.join(outputFolder, folder);
        fileManager.createDirIfNotExists(outputFolder);
    }

    const fileType = getFileType(fileHandle.name);
    const outputPath = path.join(outputFolder, `${title}.${fileType}`);

    await videoEditor.clip(fileHandle.path, outputPath, startTime, endTime);
}

/* -------------------------------------------------------------------------- */
/*                                    OTHER                                   */
/* -------------------------------------------------------------------------- */

/**
 * Toggle full screen
 */
function toggleFullScreen(win) {
    win.setFullScreen(!win.fullScreen);
    // win.setAlwaysOnTop(!win.fullScreen, 'screen-saver');
}

/**
 * Get get app version
 */
function getVersion() {
    return getAppVersion();
}

/**
 * Set env variables to storage
 */
function storeEnvVariables(variables) {
    store.set('env', variables);
}

/**
 * Open system player
 */
function openSystemPlayer(recording) {
    require('electron').shell.openExternal(recording.file);
}

/**
 * Show window
 */
async function showWindow(win) {
    if (win.isMinimized()) win.restore();

    win.setAlwaysOnTop(true);
    win.show();
    win.setAlwaysOnTop(false);
}

module.exports.clip = clip;
module.exports.clipMoments = clipMoments;
module.exports.copyFile = copyFile;
module.exports.deleteOldFiles = deleteOldFiles;
module.exports.deleteFolder = deleteFolder;
module.exports.deleteFile = deleteFile;
module.exports.deleteFileFromDefaultFolder = deleteFileFromDefaultFolder;
module.exports.downloadFiles = downloadFiles;
module.exports.exportClip = exportClip;
module.exports.exportMultipleClips = exportMultipleClips;
module.exports.exportMultiple = exportMultiple;
module.exports.exportSingle = exportSingle;
module.exports.getActiveProcesses = getActiveProcesses;
module.exports.getAvailableMicrophones = getAvailableMicrophones;
module.exports.getAvailableScreens = getAvailableScreens;
module.exports.getAvailableSpeakers = getAvailableSpeakers;
module.exports.getFileFromDefaultFolder = getFileFromDefaultFolder;
module.exports.getFileExists = getFileExists;
module.exports.getFileFromFolder = getFileFromFolder;
module.exports.getFileFromPicker = getFileFromPicker;
module.exports.getSetting = getSetting;
module.exports.getStoreValue = getStoreValue;
module.exports.getVersion = getVersion;
module.exports.getWorkspaceSize = getWorkspaceSize;
module.exports.hideCamera = hideCamera;
module.exports.initializeRecorder = initializeRecorder;
module.exports.openSystemPlayer = openSystemPlayer;
module.exports.openRecordingFolder = openRecordingFolder;
module.exports.saveFileToDefaultFolder = saveFileToDefaultFolder;
module.exports.saveRecording = saveRecording;
module.exports.selectFolder = selectFolder;
module.exports.setDefaultFolder = setDefaultFolder;
module.exports.setSetting = setSetting;
module.exports.setStoreValue = setStoreValue;
module.exports.showCamera = showCamera;
module.exports.showWindow = showWindow;
module.exports.startProcessMonitor = startProcessMonitor;
module.exports.startRecorder = startRecorder;
module.exports.stopProcessMonitor = stopProcessMonitor;
module.exports.stopRecorder = stopRecorder;
module.exports.storeEnvVariables = storeEnvVariables;
module.exports.toggleFullScreen = toggleFullScreen;
