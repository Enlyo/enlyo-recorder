const { BrowserWindow } = require('electron');
const { Notification, dialog } = require('electron');
const fileManager = require('./fileManager');
const { processMonitor } = require('./processMonitor');
const { screenRecorder } = require('./screenRecorder');
const videoEditor = require('./videoEditor');
const { getMostRecentFile } = require('./fileManager');
const { generateOutputName, getAppVersion, getFileType } = require('./helpers');
const { store } = require('./store');
const path = require('path');
const { outputFile } = require('fs-extra');

let cameraWin;

/* -------------------------------------------------------------------------- */
/*                               SCREEN RECORDER                              */
/* -------------------------------------------------------------------------- */

/**
 * Initialize recorder
 */
async function initializeRecorder() {
    const OUTPUT_PATH = store.get('settings.folder');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    const settings = store.get('settings');
    screenRecorder.setSettings({ outputPath: RAW_RECORDING_PATH, ...settings });

    screenRecorder.initialize();
}

/**
 * Start recorder
 */
async function startRecorder() {
    new Notification({
        title: 'Started recording',
    }).show();

    const OUTPUT_PATH = store.get('settings.folder');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    await fileManager.createDirIfNotExists(OUTPUT_PATH);
    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);

    return await screenRecorder.start();
}

/**
 * Stop recorder
 */
async function stopRecorder() {
    const OUTPUT_PATH = store.get('settings.folder');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;

    // Show notification
    new Notification({
        title: 'Stopped recording',
    }).show();

    // Stop recorder
    await screenRecorder.stop();

    return {
        name: rawRecordingName,
    };
}

/**
 * Save recording
 */
async function saveRecording(value) {
    console.debug(value);
    const OUTPUT_PATH = store.get('settings.folder');

    // Get tmp file
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
    const inputFile = `${RAW_RECORDING_PATH}/${rawRecordingName}`;

    const name = value.name;
    const folder = value.folder;
    console.debug(folder);
    console.debug(name);

    // Save recording
    const OUTPUT_FORMAT = 'mp4';
    const outputPath = path.join(OUTPUT_PATH, folder);
    fileManager.createDirIfNotExists(outputPath);
    const outputName = `${name}.${OUTPUT_FORMAT}`;
    const outputFile = path.join(outputPath, outputName);
    const data = await videoEditor.remux(inputFile, outputFile);
    data.size = await fileManager.getFileSize(outputFile);
    data.file = outputFile;

    // Create file handle
    const fileHandle = {
        path: outputFile,
        name: outputName,
        size: data.size,
        url: `local://${outputFile}`,
    };

    // Enrich data
    data.folder = OUTPUT_PATH;
    data.name = outputName;
    data.thumbnail = await _generateThumbnail(
        outputFile,
        RAW_RECORDING_PATH,
        data.duration
    );
    data.fileHandle = fileHandle;

    // Remove temp video
    await fileManager.deleteFile(inputFile);

    return data;
}

/**
 * Generate thumbnail
 */
async function _generateThumbnail(video, path) {
    // Generate thumbnail
    await videoEditor.generateThumbnail(video, path);
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
async function showCamera() {
    const { screen } = require('electron');
    let display = screen.getPrimaryDisplay();
    const { height } = display.workAreaSize;

    cameraWin = new BrowserWindow({
        alwaysOnTop: true,
        frame: false,
        height: 174,
        resizable: false,
        skipTaskbar: true,
        show: false,
        transparent: true,
        width: 174,
        x: 10,
        y: height - 10 - 174,
    });

    cameraWin.on('close', function () {
        cameraWin = null;
    });
    cameraWin.webContents.on('did-finish-load', () => {
        cameraWin.show();
    });

    if (process.env.NODE_ENV === 'DEV') {
        // Load the url of the dev server if in development mode
        await cameraWin.loadURL('http://localhost:3000/screen-recorder-active');
    } else {
        // await win.loadURL('http://dev.app.enlyo.com');
        await cameraWin.loadURL('http://app.enlyo.com/screen-recorder-active');
    }
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
function startProcessMonitor(event) {
    processMonitor.startInterval(
        () => _handleProcessStarted(event),
        () => _handleProcessEnded(event)
    );
}

function _handleProcessStarted(event) {
    if (!screenRecorder.isRecording) {
        event.reply('start-recorder-request');
    }
}

function _handleProcessEnded(event) {
    if (screenRecorder.isRecording) {
        event.reply('stop-recorder-request');
    }
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
            const RAW_RECORDING_PATH = path.join(value, 'tmp');
            await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);
            return screenRecorder.setFolder(RAW_RECORDING_PATH);
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
    } catch {
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
    console.debug(outputFilename);
    const outputFile = path.join(outputFolder, outputFilename);
    console.debug(outputFile);
    console.debug(inputFile);
    console.debug(startTime);
    console.debug(endTime);

    await videoEditor.clip(inputFile, outputFile, startTime, endTime);

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
        defaultPath: store.get('settings.folder'),
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
        defaultPath: store.get('settings.folder'),
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
async function getFileFromDefaultFolder(filename) {
    try {
        return await _getFileFromDefaultFolder(filename);
    } catch (error) {
        return { fileFound: false, reason: error };
    }
}

async function _getFileFromDefaultFolder(filename) {
    const folderPath = store.get('settings.folder');
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
 * Delete file
 */
async function deleteFile({ filePath, deleteFolder }) {
    const fileExists = await fileManager.getFileExists(filePath);
    if (!fileExists) {
        return { fileDeleted: false };
    }

    console.debug(filePath);
    console.debug(deleteFolder);
    console.debug(path.dirname(filePath));

    deleteFolder
        ? await fileManager.deleteFolder(path.dirname(filePath))
        : await fileManager.deleteFile(filePath);

    return { fileDeleted: true };
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
        const OUTPUT_PATH = result.filePaths[0];
        const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

        setStoreValue('settings.folder', OUTPUT_PATH);
        screenRecorder.setFolder(RAW_RECORDING_PATH);
    }

    return result;
}

/**
 * Set default folder
 */
async function setDefaultFolder() {
    const VIDEO_PATH = require('electron').app.getPath('videos');
    const RECORDING_FOLDER = 'enlyo';
    const OUTPUT_PATH = path.join(VIDEO_PATH, RECORDING_FOLDER);
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');

    await fileManager.createDirIfNotExists(OUTPUT_PATH);
    await fileManager.createDirIfNotExists(RAW_RECORDING_PATH);

    setStoreValue('settings.folder', OUTPUT_PATH);

    screenRecorder.setFolder(RAW_RECORDING_PATH);

    return OUTPUT_PATH;
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
function saveFileToDefaultFolder(win, data) {
    const DEFAULT_FOLDER = store.get('settings.folder');
    const filePath = path.join(DEFAULT_FOLDER, data.name);

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
/*                                    OTHER                                   */
/* -------------------------------------------------------------------------- */

/**
 * Toggle full screen
 */
function toggleFullScreen(win) {
    win.setFullScreen(!win.fullScreen);
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
    win.show();
}

module.exports.clip = clip;
module.exports.clipMoments = clipMoments;
module.exports.copyFile = copyFile;
module.exports.deleteFolder = deleteFolder;
module.exports.deleteFile = deleteFile;
module.exports.deleteFileFromDefaultFolder = deleteFileFromDefaultFolder;
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
