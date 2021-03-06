const Store = require('electron-store');

const schema = {
    settings: {
        type: 'object',
        properties: {
            screen: {
                type: 'object',
            },
            resolution: {
                enum: [480, 720, 1080],
            },
            fps: {
                enum: [30, 60],
            },
            speaker: {
                type: 'object',
            },
            microphone: {
                type: 'object',
            },
            autoRecordProcesses: {
                type: 'array',
            },
            customRecordProcesses: {
                type: 'array',
            },
            speakerVolume: {
                type: 'number',
            },
            microphoneVolume: {
                type: 'number',
            },
            folder: {
                type: 'string',
            },
            name: {
                type: 'string',
            },
            captureMode: {
                type: 'string',
            },
        },
        default: {
            screen: {},
            resolution: 720,
            fps: 30,
            speaker: {},
            microphone: {},
            autoRecordProcesses: [],
            customRecordProcesses: [],
            speakerVolume: 1,
            microphoneVolume: 1,
            folder: '',
            name: 'enlyo-recording',
        },
    },
    env: {
        type: 'object',
    },
};

const migrations = {
    '0.9.3': (store) => {
        store.set('settings.speaker', {});
        store.set('settings.microphone', {});
    },
    '0.9.4': (store) => {
        store.set('settings.speakerVolume', 1);
        store.set('settings.microphoneVolume', 1);
    },
    '0.9.8': (store) => {
        store.set('settings.autoAddToLibrary', true);
        store.set('settings.openLibraryIn', 'app');
        store.set('settings.actionAfterRecording', 'open_library');
    },
    '0.9.13': (store) => {
        store.set('settings.folder', '');
        store.set('settings.name', 'enlyo-recording');
        store.set('settings.roomToken', '');
        store.set('settings.hasJoinedRoom', false);
        store.set('settings.autoAddToRoom', false);
    },
    '0.9.14': (store) => {
        store.set('settings.captureMode', 'screen');
    },
};

const store = new Store({
    schema,
    migrations,
    encryptionKey: 'this_only_obfuscates',
});

module.exports.store = store;
