const { resolve } = require('path');
const { readdir } = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const { store } = require('./store');

const libraryInterface = {
    /**
     * Is library app installed
     */
    async isLibraryAppInstalled() {
        return (
            (await this.isLibraryAppInstalledEdge()) ||
            (await this.isLibraryAppInstalledChrome())
        );
    },

    /**
     * Is library app installed chrome
     */
    async isLibraryAppInstalledChrome() {
        const appPath = path.join(
            app.getPath('userData'),
            '../../Roaming/Microsoft/Windows/Start Menu/Programs'
        );

        try {
            const files = await this.getFiles(appPath);

            const isInstalled = Boolean(
                files.find(
                    (file) =>
                        file.includes('Enlyo') &&
                        !file.includes('Enlyo Recorder')
                )
            );

            return isInstalled;
        } catch {
            return false;
        }
    },

    /**
     * Is library app installed edge
     */
    async isLibraryAppInstalledEdge() {
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
    openRecording({ id }) {
        const openLibraryIn = store.get('settings.openLibraryIn');

        if (openLibraryIn === 'app') {
            require('electron').shell.openExternal(
                `web+enlyo://?action=open_video&id=${id}`
            );
        } else {
            const APP_BASE =
                store.get('env.appBase') || 'https://app.enlyo.com';
            require('electron').shell.openExternal(`${APP_BASE}/videos/${id}`);
        }
    },

    /**
     * Test connection
     */
    testConnection() {
        require('electron').shell.openExternal(`web+enlyo://?action=test`);
    },
};

module.exports.libraryInterface = libraryInterface;
