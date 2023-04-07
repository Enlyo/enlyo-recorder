const { authenticate, createHttp1Request } = require('league-connect');

/**
 * Create game parser
 */
function createGameParser() {
    const gameParser = {
        credentials: null,
        data: null,

        /**
         * Check game started
         */
        async checkGameStarted() {
            try {
                this.credentials = this.credentials
                    ? this.credentials
                    : await authenticate();
                this.credentials.port = 2999;

                const response = await createHttp1Request(
                    {
                        method: 'GET',
                        url: 'liveclientdata/allgamedata',
                    },
                    this.credentials
                );
                const data = response.json();
                if (data.errorCode) {
                    return false;
                }
                return data['events'] && data['events']['Events'].length > 0;
            } catch (error) {
                return false;
            }
        },

        /**
         * Get game data
         */
        async getGameData() {
            try {
                this.credentials = this.credentials
                    ? this.credentials
                    : await authenticate();
                this.credentials.port = 2999;

                const response = await createHttp1Request(
                    {
                        method: 'GET',
                        url: 'liveclientdata/allgamedata',
                    },
                    this.credentials
                );

                this.data = response.json();

                console.debug(this.data['activePlayer']);
            } catch (error) {
                console.warn(error);
            }
        },

        /**
         * Parse game data
         */
        parseGameData() {
            let events = null;
            let metaData = null;

            if (this.data) {
                events = this.data['events']['Events'];

                let summonerName = this.data['activePlayer']['summonerName'];
                let allPlayers = this.data['allPlayers'];

                const playerData = allPlayers.find(
                    (player) => player.summonerName === summonerName
                );

                const myTeamName = playerData.team;
                const myTeam = allPlayers
                    .filter((player) => player.team === myTeamName)
                    .map((obj) => obj.summonerName);
                const otherTeam = allPlayers
                    .filter((player) => player.team != myTeamName)
                    .map((obj) => obj.summonerName);

                let matchupData = null;
                const position = playerData['position'];
                if (position) {
                    matchupData = allPlayers.find(
                        (player) =>
                            player.summonerName != summonerName &&
                            player.position === position
                    );
                }

                metaData = {
                    summonerName: summonerName,
                    champion: playerData['championName'],
                    position: playerData['position'],
                    score: playerData['scores'],
                    matchup: matchupData ? matchupData['championName'] : null,
                    myTeam: myTeam,
                    otherTeam: otherTeam,
                    gameType:
                        playerData['gameData'] &&
                        playerData['gameData']['gameMode'],
                };
            }

            console.debug(events);
            console.debug(metaData);

            return { events, metaData };
        },
    };

    return gameParser;
}

module.exports.createGameParser = createGameParser;
