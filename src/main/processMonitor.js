const path = require('path');
const { windowManager } = require('node-window-manager');
const { OS, getOS } = require('../../operating-systems');
const { store } = require('./store');
const { parseCaption, getUniqueListBy } = require('./helpers');

/**
 * Process monitor
 */
const processMonitor = {
    _handleProcessStarted: null,
    _handleProcessEnded: null,
    intervalTime: 2000,
    autoRecordProcesses: null,
    processExists: false,
    processId: null,

    /**
     * Start interval
     */
    startInterval(handleProcessStarted, handleProcessEnded) {
        if (this.interval) return;

        this._handleProcessStarted = handleProcessStarted;
        this._handleProcessEnded = handleProcessEnded;

        this.autoRecordProcesses = store.get('settings.autoRecordProcesses');

        this.interval = setInterval(
            this._monitorProcess.bind(this),
            this.intervalTime
        );
    },

    /**
     * Stop interval
     */
    stopInterval() {
        this._handleProcessStarted = null;
        this._handleProcessEnded = null;

        clearInterval(this.interval);
        this.interval = null;
        this.processExists = false;
    },

    /**
     * Monitor process
     */
    _monitorProcess() {
        const previousProcessExists = this.processExists;

        const { processExists, processId } = this._getProcessExists({
            processId: this.processId,
        });
        this.processExists = processExists;
        this.processId = processId;

        if (!previousProcessExists && this.processExists) {
            this._handleProcessStarted();
        }

        if (previousProcessExists && !this.processExists) {
            this._handleProcessEnded();
        }
    },

    /**
     * Get process exists
     */
    _getProcessExists({ processId }) {
        // Get process by ID is a quicker method that only looks
        // for a specific, already-opened process
        if (processId) {
            return this._getProcessExistsById(processId);
        }
        return this._getProcessExistsByList();
    },

    _getProcessExistsById(id) {
        try {
            process.kill(id, 0);
            return { processExists: true, processId: id };
        } catch (e) {
            return { processExists: false, processId: null };
        }
    },

    _getProcessExistsByList() {
        const windows = windowManager.getWindows();

        if (!this.autoRecordProcesses) {
            this.autoRecordProcesses = store.get(
                'settings.autoRecordProcesses'
            );
        }

        const process = windows.find((window) => {
            return this.autoRecordProcesses.find((process) => {
                return window.path.includes(process.name);
            });
        });

        const processExists = Boolean(process);
        const processId = processExists ? process.processId : null;

        return { processExists, processId };
    },

    /**
     * Get active processes
     */
    getActiveProcesses() {
        if (getOS() === OS.Mac) {
            return this._getActiveProcessesMacOs();
        }
        return this._getActiveProcessesWindows();
    },

    /**
     * Get active processes on Windows(OS)
     */
    _getActiveProcessesWindows() {
        const { listOpenWindows } = require('@josephuspaye/list-open-windows');

        const windows = listOpenWindows();

        return windows.map((window) => {
            const pathParse = path.parse(window.processPath);
            return {
                ...window,
                title: parseCaption(window.caption),
                name: pathParse.base,
            };
        });
    },

    /**
     * Get active processes on Mac OS
     */
    _getActiveProcessesMacOs() {
        const uniqueWindows = getUniqueListBy(
            windowManager.getWindows(),
            'processId'
        );
        return uniqueWindows.map((window) => {
            const pathParse = path.parse(window.path);
            return {
                ...window,
                title: pathParse.name,
                name: pathParse.base,
            };
        });
    },
};

module.exports.processMonitor = processMonitor;
