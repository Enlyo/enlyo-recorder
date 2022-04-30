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
            autoAddToLibrary: {
                type: 'boolean',
            },
            openLibraryIn: {
                type: 'string',
            },
            actionAfterRecording: {
                enum: [
                    'none',
                    'open_folder',
                    'open_system_player',
                    'open_library',
                ],
            },
            credentials: {
                type: 'object',
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
            autoAddToLibrary: true,
            openLibraryIn: 'app',
            actionAfterRecording: 'open_library',
            credentials: {},
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
};

const store = new Store({
    schema,
    migrations,
    encryptionKey: 'this_only_obfuscates',
});

module.exports.store = store;
