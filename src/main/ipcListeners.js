import { ipcMain } from "electron";
import obsRecorder from "./obsRecorder_orig";

/**
 * Set ipc listeners
 */
export default function setIpcListeners(win) {
    ipcMain.on("initialize-recorder", () => {
        obsRecorder.initialize(win);
        return true;
    });

    ipcMain.on("initialize-recorder-preview", (event, payload) => {
        const result = obsRecorder.setupPreview(win, payload);
        event.reply("resized-recording-preview", result);
    });

    ipcMain.on("resize-recorder-preview", (event, payload) => {
        const result = obsRecorder.resizePreview(win, payload);
        event.reply("resized-recording-preview", result);
    });

    ipcMain.on("start-recorder", (event) => {
        console.debug("started recorder");
        obsRecorder.start();
        event.reply("started-recorder");
    });

    ipcMain.on("stop-recorder", (event) => {
        console.debug("stopped recorder");
        obsRecorder.stop();
        event.reply("stopped-recorder");
    });
}
