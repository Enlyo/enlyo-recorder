const Store = require('electron-store');

const schema = {
    settings: {
        type: 'object',
        properties: {
            defaultScreen: {
                type: 'string',
            },
            resolution: {
                enum: [720, 1080],
            },
            fps: {
                enum: [30, 60],
            },
        },
        default: {
            defaultScreen: '',
            resolution: 1080,
            fps: 30,
        },
    },
};

const store = new Store({ schema });

module.exports.store = store;
