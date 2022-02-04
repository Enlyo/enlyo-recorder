const exec = require('child_process').exec;

const PROCESS = 'League of Legends.exe';

/**
 * Process monitor
 */
const processMonitor = {
    handleExists: null,
    handleDoesNotExist: null,
    intervalTime: 10000,
    isRecording: false,
    process: PROCESS,
    processMonitor: null,

    /**
     * Start interval
     */
    startInterval(handleExists, handleDoesNotExist) {
        this.handleExists = handleExists;
        this.handleDoesNotExist = handleDoesNotExist;

        this.interval = setInterval(
            this.monitorProcess.bind(this),
            this.intervalTime
        );
    },

    /**
     * Stop process monitor interval
     */
    stopProcessMonitorInterval() {
        this.handleExists = null;
        this.handleDoesNotExist = null;

        clearInterval(this.interval);
    },

    /**
     * Monitor process
     * @param {Function} handleExists
     * @param {Function} handleDoesNotExist
     */
    monitorProcess() {
        this.getProcessExists(this.process)
            ? this.handleExists()
            : this.handleDoesNotExist();
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
