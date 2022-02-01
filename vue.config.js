module.exports = {
    pages: {
        index: {
            entry: "src/renderer/main.js",
        },
    },
    css: {
        loaderOptions: {
            sass: {
                additionalData: `
                    @import "@/renderer/assets/scss/app.scss";
                `,
            },
        },
    },
    pluginOptions: {
        electronBuilder: {
            mainProcessFile: "src/main/main.js",
            // This segment is required in order to load the
            // ".node" files that are included in obs-studio-node
            chainWebpackMainProcess: (config) => {
                config.module
                    .rule("node")
                    .test(/\.node$/)
                    .use("node-loader")
                    .loader("node-loader")
                    .end();
            },
            preload: {
                preload: "src/main/preload.js",
            },
        },
    },
};
