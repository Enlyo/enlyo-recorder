import { contextBridge, ipcRenderer } from "electron";

/**
 * Valid request channels
 */
const VALID_CHANNELS = {
    request: [
        "initialize-recorder",
        "initialize-recorder-preview",
        "resize-recorder-preview",
        "start-recorder",
        "stop-recorder",
    ],
    response: [
        "resized-recorder-preview",
        "started-recorder",
        "stopped-recorder",
    ],
};

contextBridge.exposeInMainWorld("ipc", {
    send: (channel, data) => {
        if (VALID_CHANNELS.request.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    on: (channel, func) => {
        if (VALID_CHANNELS.response.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
});
