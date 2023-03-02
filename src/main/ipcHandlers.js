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

const {
    authenticate,
    createHttp1Request,
    createWebSocketConnection,
} = require('league-connect');

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
    const OUTPUT_NAME = store.get('settings.name');
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
    const name = OUTPUT_NAME + ' ' + rawRecordingName.replace('.mkv', '');

    // Show notification
    new Notification({
        title: 'Stopped recording',
    }).show();

    // Stop recorder
    await screenRecorder.stop();

    return {
        name,
    };
}

/**
 * Save recording
 */
async function saveRecording(value) {
    const OUTPUT_PATH = store.get('settings.folder');

    // Get tmp file
    const RAW_RECORDING_PATH = path.join(OUTPUT_PATH, 'tmp');
    const rawRecordingName = getMostRecentFile(RAW_RECORDING_PATH).file;
    const inputFile = `${RAW_RECORDING_PATH}/${rawRecordingName}`;

    const name = value.name;
    const folder = value.folder;

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
async function showCamera(cam) {
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

    cameraWin.on('close', function () {
        cameraWin = null;
    });
    cameraWin.webContents.on('did-finish-load', () => {
        cameraWin.show();
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
function startProcessMonitor(event) {
    processMonitor.startInterval(
        async () => await _handleProcessStarted(event),
        async () => await _handleProcessEnded(event)
    );
}

let interval = null;

async function _handleProcessStarted(event) {
    if (!screenRecorder.isRecording) {
        let startInterval = setInterval(async () => {
            const gameStarted = await checkGameStarted();

            if (gameStarted) {
                clearInterval(startInterval);
                startInterval = null;
                event.reply('start-recorder-request');

                interval = setInterval(async () => {
                    await getGameData();
                    console.debug(events);
                }, 15000);
            }
        }, 1000);
    }
}

async function checkGameStarted() {
    try {
        const credentials = await authenticate();
        credentials.port = 2999;

        const response = await createHttp1Request(
            {
                method: 'GET',
                url: 'liveclientdata/allgamedata',
            },
            credentials
        );
        const data = response.json();
        return !data.errorCode;
    } catch (error) {
        return false;
    }
}

async function _handleProcessEnded(event) {
    if (screenRecorder.isRecording) {
        clearInterval(interval);
        interval = null;

        console.debug(events);
        const parsedEvents = parseEvents(events, summonerName);

        event.reply('stop-recorder-request', { events: parsedEvents });
    }
}

let summonerName = '';
let events = [];
async function getGameData() {
    try {
        const credentials = await authenticate();
        credentials.port = 2999;

        const response = await createHttp1Request(
            {
                method: 'GET',
                url: 'liveclientdata/allgamedata',
            },
            credentials
        );

        const data = response.json();
        summonerName = data['activePlayer']['summonerName'];
        events = data['events']['Events'];
    } catch (error) {
        console.debug(error);
    }
}

function parseEvents(events, summonerName) {
    let parsedEvents = [];

    events.forEach((event) => {
        if (event.EventName === 'ChampionKill') {
            if (event.KillerName === summonerName) {
                parsedEvents.push({
                    type: 'kill',
                    icon: 'swords',
                    time: event.EventTime * 1000,
                });
            } else if (event.VictimName === summonerName) {
                parsedEvents.push({
                    type: 'death',
                    icon: 'tombstone',
                    time: event.EventTime * 1000,
                });
            } else if (event.Assisters.includes(summonerName)) {
                parsedEvents.push({
                    type: 'assist',
                    icon: 'handshake',
                    time: event.EventTime * 1000,
                });
            }
        }
    });

    return parsedEvents;
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

            downloads.push(fileManager.downloadFile(url, filePath));
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

        await fileManager.copyFile(fileHandle.path, outputPath);
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
            await fileManager.copyFile(fileHandle.path, outputPath);
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
    win.show();
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
