/**
 * Create process handler
 */
function createProcessHandler(gameParser = null) {
    const processHandler = {
        gameParser: gameParser,
        gameStarted: false,

        checkGameDataInterval: null,
        checkGameStartedInterval: null,

        processStarted: false,

        /**
         * Handle process started
         */
        async handleProcessStarted(event, win) {
            if (this.processStarted) return;

            this.processStarted = true;

            if (this.checkGameStartedInterval) {
                this.clearCheckGameStartedInterval();
            }
            this.checkGameStartedInterval = setInterval(async () => {
                const gameStarted = await this.gameParser.checkGameStarted();

                if (gameStarted && !this.gameStarted) {
                    this.clearCheckGameStartedInterval();
                    this.handleGameStarted(event);
                }
            }, 1000);
        },

        /**
         * Handle game started
         */
        handleGameStarted(event) {
            this.gameStarted = true;
            event.reply('start-recorder-request');

            if (this.checkGameDataInterval) {
                this.clearCheckGameDataInterval();
            }
            this.checkGameDataInterval = setInterval(async () => {
                await this.gameParser.getGameData();
            }, 15000);
        },

        /**
         * Handle process ended
         */
        async handleProcessEnded(event) {
            this.processStarted = false;

            this.clearCheckGameDataInterval();
            this.gameStarted = false;

            const { events, metaData } = this.gameParser.parseGameData();
            event.reply('stop-recorder-request', {
                events: events,
                gameData: metaData,
            });
        },

        /**
         * Clear checkGameDataInterval
         */
        clearCheckGameDataInterval() {
            clearInterval(this.checkGameDataInterval);
            this.checkGameDataInterval = null;
        },

        /**
         * Clear checkGameStartedInterval
         */
        clearCheckGameStartedInterval() {
            clearInterval(this.checkGameStartedInterval);
            this.checkGameStartedInterval = null;
        },
    };

    return processHandler;
}

module.exports.createProcessHandler = createProcessHandler;
