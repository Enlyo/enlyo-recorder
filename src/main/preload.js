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
        'start-process-monitor',
        'stop-process-monitor',
    ],
    response: [
        'resized-recorder-preview',
        'started-recorder-preview',
        'stopped-recorder-preview',
        'started-recorder',
        'stopped-recorder',
        'stop-recorder-request',
        'start-recorder-request',
    ],
    invoke: [
        'get-available-screens',
        'get-store-value',
        'set-setting',
        'get-app-version',
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

    invoke: async (channel, data) => {
        if (VALID_CHANNELS.invoke.includes(channel)) {
            return await ipcRenderer.invoke(channel, data);
        }
    },
});
