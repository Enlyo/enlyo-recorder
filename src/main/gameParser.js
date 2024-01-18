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
            console.debug('Check game started');
            try {
                console.debug('try');
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
                console.debug('Game started?');
                console.debug(
                    data['events'] && data['events']['Events'].length > 0
                );
                return data['events'] && data['events']['Events'].length > 0;
            } catch (error) {
                console.debug(error);
                return false;
            }
        },

        /**
         * Get game data
         */
        async getGameData() {
            console.debug('Get game data');
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
                console.debug(this.data);
            } catch (error) {
                console.warn(error);
            }
        },

        /**
         * Parse summoner name
         */
        parseSummonerName(summonerName) {
            // Use a regular expression to match the part before the '#' character
            const match = summonerName.match(/^(.*?)(?:#.*)?$/);

            // Check if there's a match and return the captured group (the part before '#')
            if (match) {
                return match[1];
            }

            // Return the original input if no match is found
            return summonerName;
        },

        /**
         * Parse game data
         */
        parseGameData() {
            console.debug('Get game data');
            let events = null;
            let metaData = null;

            if (this.data) {
                events = this.data['events']['Events'];
                console.debug('EVENTS:');
                console.debug(events);

                let summonerName = this.data['activePlayer']['summonerName'];
                console.debug('SUMMONER NAME:');
                console.debug(summonerName);
                summonerName = this.parseSummonerName(summonerName);
                console.debug('SUMMONER NAME:');
                console.debug(summonerName);
                let allPlayers = this.data['allPlayers'];
                console.debug('ALL PLAYERS');
                console.debug(allPlayers);

                const playerData = allPlayers.find(
                    (player) => player.summonerName === summonerName
                );
                console.debug('PLAYER DATA');
                console.debug(playerData);

                const myTeamName = playerData?.team;
                console.debug('MY TEAM NAME');
                console.debug(myTeamName);
                const myTeam = allPlayers
                    .filter((player) => player.team === myTeamName)
                    .map((obj) => obj.summonerName);
                const otherTeam = allPlayers
                    .filter((player) => player.team != myTeamName)
                    .map((obj) => obj.summonerName);
                console.debug('MY TEAM');
                console.debug(myTeam);

                let matchupData = null;
                const position = playerData['position'];
                console.debug('POSITION');
                console.debug(position);
                if (position) {
                    matchupData = allPlayers.find(
                        (player) =>
                            player.summonerName != summonerName &&
                            player.position === position
                    );
                    console.debug('MATCHUP DATA');
                    console.debug(matchupData);
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
                console.debug('META DATA');
                console.debug(metaData);
            }

            return { events, metaData };
        },
    };

    return gameParser;
}

module.exports.createGameParser = createGameParser;
