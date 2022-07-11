const path = require('path');
const vueSrc = './src/renderer';

module.exports = {
    pages: {
        index: {
            entry: 'src/renderer/main.js',
        },
    },
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    configureWebpack: {
        resolve: {
            alias: {
                '~': path.resolve(__dirname, vueSrc),
                '@': path.resolve(__dirname, vueSrc),
                '~~': path.resolve(__dirname, vueSrc),
                '@@': path.resolve(__dirname, vueSrc),
            },
            extensions: ['.js', '.vue', '.json'],
        },
    },
};
