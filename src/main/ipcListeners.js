const { ipcMain } = require("electron");
const obsRecorder = require("../../obsRecorder_orig");

/**
 * Set ipc listeners
 */
function setIpcListeners(win) {
    ipcMain.on("initialize-obs", () => {
        obsRecorder.initialize(win);
        return true;
    });

    ipcMain.on("initialize-obs-preview", (event, payload) => {
        const result = obsRecorder.setupPreview(win, payload);
        event.reply("resize-preview", result);
    });

    ipcMain.on("resize-obs-preview", (event, payload) => {
        const result = obsRecorder.resizePreview(win, payload);
        event.reply("resize-preview", result);
    });
}

module.exports.setIpcListeners = setIpcListeners;
