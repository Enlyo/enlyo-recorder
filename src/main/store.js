const Store = require('electron-store');

const schema = {
    settings: {
        type: 'object',
        properties: {
            autoRecordProcesses: {
                type: 'array',
            },
            captureMode: {
                type: 'string',
            },
            customRecordProcesses: {
                type: 'array',
            },
            folder: {
                type: 'string',
            },
            fps: {
                enum: [30, 60],
            },
            hasAskedForMediaAccess: {
                type: 'boolean',
            },
            launchAtStartup: {
                type: 'string',
            },
            microphone: {
                type: 'object',
            },
            microphoneVolume: {
                type: 'number',
            },
            name: {
                type: 'string',
            },
            recordInMkv: {
                type: 'string',
            },
            resolution: {
                enum: [480, 720, 1080],
            },
            screen: {
                type: 'object',
            },
            speaker: {
                type: 'object',
            },
            speakerVolume: {
                type: 'number',
            },
            storageLimit: {
                type: 'number',
            },
        },
        default: {
            autoRecordProcesses: [],
            customRecordProcesses: [],
            folder: '',
            fps: 30,
            hasAskedForMediaAccess: false,
            launchAtStartup: 'no',
            microphone: {},
            microphoneVolume: 1,
            name: 'enlyo-recording',
            recordInMkv: 'no',
            resolution: 720,
            screen: {},
            speaker: {},
            speakerVolume: 1,
            storageLimit: 107374182400,
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
    '0.9.21': (store) => {
        store.set('settings.storageLimit', 107374182400);
    },
    '1.0.8': (store) => {
        store.set('settings.recordInMkv', 'no');
        store.set('settings.launchAtStartup', 'no');
    },
};

const store = new Store({
    schema,
    migrations,
    encryptionKey: 'this_only_obfuscates',
});

module.exports.store = store;
