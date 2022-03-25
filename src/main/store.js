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
};

const store = new Store({ schema, migrations });

module.exports.store = store;
