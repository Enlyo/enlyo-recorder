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
    publicPath: process.env.NODE_ENV === "production" ? "./" : "/",
};
