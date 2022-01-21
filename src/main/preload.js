const { contextBridge, ipcRenderer } = require("electron");

/**
 * Valid channels
 */
const VALID_CHANNELS = [
    "initialize-obs",
    "initialize-obs-preview",
    "resize-obs-preview",
    "resize-preview",
];

contextBridge.exposeInMainWorld("ipc", {
    send: (channel, data) => {
        if (VALID_CHANNELS.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },

    on: (channel, func) => {
        if (VALID_CHANNELS.includes(channel)) {
            // Strip event as it includes `sender` and is a security risk
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
});
