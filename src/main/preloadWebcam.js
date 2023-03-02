const { contextBridge, ipcRenderer } = require('electron');

/**
 * Valid channels
 */
const VALID_CHANNELS = {
    request: [],
    response: ['set-cam'],
    invoke: [],
};

contextBridge.exposeInMainWorld('ipc', {
    send: (channel, data) => {
        if (VALID_CHANNELS.request.includes(channel)) {
            ipcRenderer.send(channel, data);
            return;
        }
        console.warn(`${channel} is not valid`);
    },

    on: (channel, func) => {
        if (VALID_CHANNELS.response.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
            return;
        }
        console.warn(`${channel} is not valid`);
    },

    invoke: async (channel, data) => {
        if (VALID_CHANNELS.invoke.includes(channel)) {
            return await ipcRenderer.invoke(channel, data);
        }
        console.warn(`${channel} is not valid`);
    },
});

contextBridge.exposeInMainWorld('isNative', true);
