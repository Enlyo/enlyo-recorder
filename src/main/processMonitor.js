// const exec = require('child_process').exec;
const exec = require('child_process').exec;

const PROCESS = 'League of Legends.exe';

/**
 * Process monitor
 */
const processMonitor = {
    handleProcessStarted: null,
    handleProcessEnded: null,
    intervalTime: 1000,
    process: PROCESS,
    processMonitor: null,
    processExists: false,

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
        let previousProcessExists = this.processExists;
        this.processExists = this.getProcessExists(this.process);

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
    getProcessExists(process) {
        exec('tasklist', function (error, stdout) {
            return stdout.includes(process);
        });
    },
};

module.exports.processMonitor = processMonitor;
