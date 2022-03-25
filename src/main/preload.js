const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, Color } = require('custom-electron-titlebar');
const path = require('path');

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
        'get-available-speakers',
        'get-available-microphones',
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

window.addEventListener('DOMContentLoaded', () => {
    // Title bar implemenation
    new Titlebar({
        backgroundColor: Color.fromHex('#202225'),
        itemBackgroundColor: Color.fromHex('#121212'),
        svgColor: Color.WHITE,
        icon: './logo.svg',
        menu: null, // = do not automatically use Menu.applicationMenu
    });
});
