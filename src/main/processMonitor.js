const { listOpenWindows } = require('@josephuspaye/list-open-windows');
const { store } = require('./store');

/**
 * Process monitor
 */
const processMonitor = {
    handleProcessStarted: null,
    handleProcessEnded: null,
    intervalTime: 100,
    autoRecordProcesses: store.get('settings.autoRecordProcesses'),
    processMonitor: null,
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
     * @param {Function} handleExists
     * @param {Function} handleDoesNotExist
     */
    monitorProcess() {
        const previousProcessExists = this.processExists;

        const { processExists, processId } = this.getProcessExists({
            processId: this.processId,
            autoRecordProcesses: this.autoRecordProcesses,
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
     * Get process exists
     * @param {String} process
     */
    getProcessExists({ autoRecordProcesses, processId }) {
        // Get procees by ID is a quicker method that only looks
        // for a specific, already-opened process
        if (processId) {
            return this._getProcessExistsById(processId);
        }
        return this._getProcessExists(autoRecordProcesses);
    },

    _getProcessExistsById(id) {
        try {
            process.kill(id, 0);
            return { processExists: true, processId: id };
        } catch (e) {
            return { processExists: false, processId: null };
        }
    },

    _getProcessExists(autoRecordProcesses) {
        const process = listOpenWindows().find((window) => {
            return autoRecordProcesses.find((process) => {
                return window.processPath.includes(process.name);
            });
        });

        const processExists = Boolean(process);
        const processId = processExists ? process.processId : null;

        return { processExists, processId };
    },
};

module.exports.processMonitor = processMonitor;
