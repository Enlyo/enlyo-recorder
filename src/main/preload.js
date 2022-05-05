const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, Color } = require('custom-electron-titlebar');

/* -------------------------------------------------------------------------- */
/*                               CONTEXT BRIDGE                               */
/* -------------------------------------------------------------------------- */

/**
 * Valid channels
 */
const VALID_CHANNELS = {
    request: ['start-process-monitor', 'stop-process-monitor'],
    response: ['start-recorder-request', 'stop-recorder-request'],
    invoke: [
        'get-active-processes',
        'get-available-microphones',
        'get-available-screens',
        'get-available-speakers',
        'get-app-version',
        'get-credentials',
        'get-has-installed-library-app',
        'get-setting',
        'get-store-value',
        'initialize-recorder',
        'open-library-video',
        'open-recording-folder',
        'open-sharing-room',
        'open-system-player',
        'set-setting',
        'select-folder',
        'set-default-folder',
        'set-credentials',
        'start-recorder',
        'stop-recorder',
        'store-env-variables',
        'test-library-app-connection',
        'test-ipc-connection',
    ],
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

/* -------------------------------------------------------------------------- */
/*                                  TITLEBAR                                  */
/* -------------------------------------------------------------------------- */

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
