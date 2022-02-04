const { contextBridge, ipcRenderer } = require('electron');

/**
 * Valid request channels
 */
const VALID_CHANNELS = {
    request: [
        'initialize-recorder',
        'start-recorder-preview',
        'resize-recorder-preview',
        'stop-recorder-preview',
        'start-recorder',
        'stop-recorder',
    ],
    response: [
        'resized-recorder-preview',
        'started-recorder-preview',
        'stopped-recorder-preview',
        'started-recorder',
        'stopped-recorder',
    ],
};

contextBridge.exposeInMainWorld('ipc', {
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
