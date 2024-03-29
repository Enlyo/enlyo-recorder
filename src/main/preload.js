const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, Color } = require('custom-electron-titlebar');
const { getLocalIp } = require('./streamingServer');

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
        'system-resumed',
        'system-suspended',
        'ping',
        'go-to-videos',
        'go-to-settings',
        'go-to-sharing-room',
        'go-to-latest-video',
        'go-to-page',
    ],
    invoke: [
        'clip',
        'clip-moments',
        'clip-moments',
        'copy-file',
        'delete-file',
        'delete-file-from-default-folder',
        'delete-folder',
        'delete-old-files',
        'download-files',
        'export-clip',
        'export-multiple-clips',
        'export-multiple',
        'export-single',
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
        'get-workspace-size',
        'hide-camera',
        'initialize-recorder',
        'open-system-player',
        'save-file-to-default-folder',
        'save-recording',
        'set-setting',
        'select-folder',
        'set-default-folder',
        'show-camera',
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

contextBridge.exposeInMainWorld('localIp', getLocalIp());

/* -------------------------------------------------------------------------- */
/*                                  TITLEBAR                                  */
/* -------------------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
    // Title bar implemenation
    new Titlebar({
        backgroundColor: Color.fromHex('#0C0C0C'),
        itemBackgroundColor: Color.fromHex('#0C0C0C'),
        maximizable: true,
        svgColor: Color.WHITE,
        menu: null, // = do not automatically use Menu.applicationMenu
    });
});
