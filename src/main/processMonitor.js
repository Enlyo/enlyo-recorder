const path = require('path');
const { windowManager } = require('node-window-manager');
const { store } = require('./store');
const { getUniqueListBy } = require('./helpers');

/**
 * Process monitor
 */
const processMonitor = {
    handleProcessStarted: null,
    handleProcessEnded: null,
    intervalTime: 100,
    autoRecordProcesses: null,
    processExists: false,
    processId: null,

    /**
     * Start interval
     */
    startInterval(handleProcessStarted, handleProcessEnded) {
        this.handleProcessStarted = handleProcessStarted;
        this.handleProcessEnded = handleProcessEnded;

        this.interval = setInterval(
            this.monitorProcess.bind(this),
            this.intervalTime
        );
    },

    /**
     * Stop process monitor interval
     */
    stopProcessMonitorInterval() {
        this.handleProcessStarted = null;
        this.handleProcessEnded = null;

        clearInterval(this.interval);
    },

    /**
     * Monitor process
     */
    monitorProcess() {
        const previousProcessExists = this.processExists;

        const { processExists, processId } = this.getProcessExists({
            processId: this.processId,
        });
        this.processExists = processExists;
        this.processId = processId;

        if (!previousProcessExists && this.processExists) {
            this.handleProcessStarted();
        }

        if (previousProcessExists && !this.processExists) {
            this.handleProcessEnded();
        }
    },

    /**
     * Get active processes
     */
    getActiveProcesses() {
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

    /**
     * Get process exists
     */
    getProcessExists({ processId }) {
        // Get process by ID is a quicker method that only looks
        // for a specific, already-opened process
        if (processId) {
            return this._getProcessExistsById(processId);
        }
        return this._getProcessExists();
    },

    _getProcessExistsById(id) {
        try {
            process.kill(id, 0);
            return { processExists: true, processId: id };
        } catch (e) {
            return { processExists: false, processId: null };
        }
    },

    _getProcessExists() {
        windowManager.requestAccessibility();

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
};

module.exports.processMonitor = processMonitor;
