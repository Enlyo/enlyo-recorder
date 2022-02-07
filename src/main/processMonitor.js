// const exec = require('child_process').exec;
const psList = import('ps-list');
const { windowManager } = require('node-window-manager');
const { authenticate, LeagueClient, connect } = require('league-connect');

const PHASE_WEBHOOK = '/lol-gameflow/v1/gameflow-phase';
const SESSION_WEBHOOK = '/lol-gameflow/v1/session';
const PATCHER_WEBHOOK = '/data-store/v1/install-settings/gameflow-patcher-lock';

const GAME_START_EVENT = 'GameStart';
const GAME_END_EVENT = 'WaitingForStats';

/**
 * Process monitor
 */
const processMonitor = {
    handleProcessStarted: null,
    handleProcessEnded: null,
    ws: null,
    gameStarted: false,
    clientVisible: false,
    isRecording: false,

    /**
     * Start interval
     */
    async startInterval(handleProcessStarted, handleProcessEnded) {
        const credentials = await authenticate({
            awaitConnection: true,
            pollInterval: 5000,
        });

        this.handleProcessStarted = handleProcessStarted;
        this.handleProcessEnded = handleProcessEnded;

        this.setClientListeners(credentials);
        this.subcribeToWebHook(credentials);
    },

    setClientListeners(credentials) {
        const client = new LeagueClient(credentials);

        client.on('connect', (newCredentials) => {
            this.subcribeToWebHook(newCredentials);
        });

        client.on('disconnect', () => {
            this.ws.unsubscribe(PHASE_WEBHOOK);
            this.ws.unsubscribe(SESSION_WEBHOOK);
            this.ws.unsubscribe(PATCHER_WEBHOOK);
        });

        client.start(); // Start listening for process updates
    },

    /**
     * Subscribe to webhook
     */
    subcribeToWebHook(credentials) {
        setTimeout(() => this._subcribeToWebHook(credentials), 5000); // Required because webhook is not immediately ready
    },

    async _subcribeToWebHook(credentials) {
        this.ws = await connect(credentials);

        this.ws.subscribe(PHASE_WEBHOOK, (data, event) => {
            if (data === GAME_START_EVENT) {
                this.handleProcessEnded();

                this.gameStarted = true;
            }

            if (data === GAME_END_EVENT) {
                this.handleProcessEnded();

                this.gameStarted = false;
                this.clientVisible = false;
                this.isRecording = false;
            }
        });

        this.ws.subscribe(SESSION_WEBHOOK, (data, event) => {
            if (this.gameStarted && data.gameClient.visible) {
                this.clientVisible = true;
            }
        });

        this.ws.subscribe(PATCHER_WEBHOOK, (data, event) => {
            if (this.gameStarted && this.clientVisible && !this.isRecording) {
                this.handleProcessStarted();

                this.isRecording = true;
            }
        });
    },
};

module.exports.processMonitor = processMonitor;
