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
    response: [
        'start-recorder-request',
        'stop-recorder-request',
        'ping',
        'go-to-videos',
        'go-to-settings',
        'go-to-sharing-room',
        'go-to-latest-video',
    ],
    invoke: [
        'clip-moment',
        'clip-moments',
        'delete-file',
        'delete-file-from-default-folder',
        'get-active-processes',
        'get-available-microphones',
        'get-available-screens',
        'get-available-speakers',
        'get-app-version',
        'get-file-exists',
        'get-file-from-default-folder',
        'get-file-from-folder',
        'get-file-from-picker',
        'get-has-installed-library-app',
        'get-setting',
        'get-store-value',
        'initialize-recorder',
        'open-system-player',
        'save-file-to-default-folder',
        'set-setting',
        'select-folder',
        'set-default-folder',
        'show-window',
        'start-recorder',
        'stop-recorder',
        'store-env-variables',
        'test-ipc-connection',
        'toggle-full-screen',
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

contextBridge.exposeInMainWorld('isNative', true);

/* -------------------------------------------------------------------------- */
/*                                  TITLEBAR                                  */
/* -------------------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
    // Title bar implemenation
    new Titlebar({
        backgroundColor: Color.fromHex('#202225'),
        itemBackgroundColor: Color.fromHex('#121212'),
        maximizable: false,
        svgColor: Color.WHITE,
        menu: null, // = do not automatically use Menu.applicationMenu
    });
});
