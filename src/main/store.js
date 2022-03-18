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
            autoRecordProcesses: {
                type: 'array',
            },
            customRecordProcesses: {
                type: 'array',
            },
        },
        default: {
            screen: {},
            resolution: 480,
            fps: 30,
            autoRecordProcesses: [],
            customRecordProcesses: [],
        },
    },
};

const store = new Store({ schema });

module.exports.store = store;
