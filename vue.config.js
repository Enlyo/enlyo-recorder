const path = require('path');
const vueSrc = './src/renderer';

module.exports = {
    pages: {
        index: {
            entry: 'src/renderer/main.js',
        },
    },
    css: {
        loaderOptions: {
            sass: {
                additionalData: `
                    @import "@/assets/scss/_theme.scss";
                    @import "@/assets/scss/_variables.scss";
                    @import "@/assets/scss/_mixins.scss";
                `,
            },
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
