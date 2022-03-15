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
        },
        default: {
            screen: {},
            resolution: 720,
            fps: 30,
        },
    },
};

const store = new Store({ schema });

module.exports.store = store;
