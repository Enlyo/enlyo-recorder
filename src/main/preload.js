const { contextBridge, ipcRenderer } = require('electron');

/**
 * Valid request channels
 */
const VALID_CHANNELS = {
    request: [
        'initialize-recorder',
        'start-recorder',
        'stop-recorder',
        'start-process-monitor',
        'stop-process-monitor',
    ],
    response: [
        'started-recorder',
        'stopped-recorder',
        'stop-recorder-request',
        'start-recorder-request',
    ],
    invoke: [
        'get-available-screens',
        'set-setting',
        'get-store-value',
        'get-app-version',
        'get-active-processes',
        'store-env-variables',
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
