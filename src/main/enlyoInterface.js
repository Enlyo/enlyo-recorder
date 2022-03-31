const { resolve } = require('path');
const { readdir } = require('fs').promises;
const path = require('path');
const { app } = require('electron');

const enlyoInterface = {
    /**
     * Is enlyo installed
     */
    async isEnlyoInstalled() {
        return (
            (await this.isEnlyoInstalledEdge()) ||
            (await this.isEnlyoInstalledChrome())
        );
    },

    /**
     * Is enlyo installed chrome
     */
    async isEnlyoInstalledChrome() {
        const appPath = path.join(
            app.getPath('userData'),
            '../../Roaming/Microsoft/Windows/Start Menu/Programs/Chrome-apps'
        );

        try {
            const files = await this.getFiles(appPath);

            const isInstalled = Boolean(
                files.find((file) => file.includes('Enlyo'))
            );

            return isInstalled;
        } catch {
            return false;
        }
    },

    /**
     * Is enlyo installed edge
     */
    async isEnlyoInstalledEdge() {
        const appPath = path.join(
            app.getPath('userData'),
            '../../Local/Microsoft/Edge/User Data/Default/Web Applications'
        );

        try {
            const files = await this.getFiles(appPath);

            const isInstalled = Boolean(
                files.find((file) => file.includes('Enlyo'))
            );

            return isInstalled;
        } catch {
            return false;
        }
    },

    /**
     * Get files
     */
    async getFiles(dir) {
        const dirents = await readdir(dir, { withFileTypes: true });
        const files = await Promise.all(
            dirents.map((dirent) => {
                const res = resolve(dir, dirent.name);
                return dirent.isDirectory() ? this.getFiles(res) : res;
            })
        );
        return Array.prototype.concat(...files);
    },

    /**
     * Open recording
     */
    openRecording({ fileName, duration }) {
        require('electron').shell.openExternal(
            `web+enlyo://${fileName}@dur${duration}`
        );
    },
};

module.exports.enlyoInterface = enlyoInterface;
