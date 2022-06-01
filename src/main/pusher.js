const Pusher = require('pusher-js');
const { store } = require('./store');
const path = require('path');
const { clip } = require('./videoEditor');
const { generateOutputName, getFileType } = require('./helpers');

const PUSHER_SECRET = store.get('env.pusherSecret');
const PUSHER_AUTH_ENDPOINT = store.get('env.pusherAuthEndpoint');
const authTokens = store.get('authTokens');
const user = store.get('user');

const pusher = {
    _pusher: null,
    _channel: null,

    /* -------------------------------------------------------------------------- */
    /*                              SETUP AND DESTROY                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Start
     */
    start() {
        this._pusher = new Pusher(PUSHER_SECRET, {
            cluster: 'eu',
            authEndpoint: PUSHER_AUTH_ENDPOINT,
            auth: {
                headers: {
                    Authorization: `JWT ${authTokens.access}`,
                },
                params: {
                    app_type: 'recorder',
                },
            },
        });

        this.subscribe(user.handle.replace('#', ''));
    },

    /**
     * Subscribe
     */
    subscribe(id) {
        if (!this._pusher) {
            return;
        }
        this._channel = this._pusher.subscribe(`presence-${id}`);

        this._channel.bind('pusher:subscription_succeeded', () => {
            this.setUpListeners();
        });
    },

    /**
     * Set up listeners
     */
    setUpListeners() {
        this._channel.bind('client-clip_moment_request', async (data) => {
            await this.clipMoment(data);
        });

        this._channel.bind('client-clip_moments_request', async (data) => {
            await this.clipMoments(data);
        });
    },

    /**
     * Trigger
     */
    trigger(event, data = {}) {
        if (!this._channel) {
            return;
        }
        this._channel.trigger(`client-${event}`, data);
    },

    /* -------------------------------------------------------------------------- */
    /*                                  HANDLERS                                  */
    /* -------------------------------------------------------------------------- */

    /**
     * Clip moment
     */
    async clipMoment({ fileName, startTime, endTime }) {
        try {
            const outputFilename = await this._clipMoment({
                fileName,
                startTime,
                endTime,
            });

            this.trigger('clipped_moment', {
                success: true,
                name: outputFilename,
            });
        } catch {
            this.trigger('clipped_moment', {
                success: false,
            });
        }
    },

    async _clipMoment({ fileName, startTime, endTime }) {
        const WORKSPACE_PATH = store.get('settings.folder');

        const fileType = getFileType(fileName);
        const inputFile = path.join(WORKSPACE_PATH, fileName);

        const outputFilename = generateOutputName(
            fileName,
            `${startTime}-${endTime}`,
            'back',
            fileType,
            fileType
        );
        const outputFile = path.join(WORKSPACE_PATH, outputFilename);

        await clip(inputFile, outputFile, startTime, endTime);

        return outputFilename;
    },

    /**
     * Clip moments
     */
    async clipMoments({ moments }) {
        try {
            const clippedMoments = await this._clipMoments({ moments });
            this.trigger('clipped_moments', {
                success: true,
                clips: clippedMoments,
            });
        } catch {
            this.trigger('clipped_moments', {
                success: false,
            });
        }
    },

    async _clipMoments({ moments }) {
        let clippedMoments = [];

        for (let index = 0; index < moments.length; index++) {
            const moment = moments[index];
            const name = await this._clipMoment(moment);
            clippedMoments.push({ name });
        }

        return clippedMoments;
    },
};

module.exports.pusher = pusher;
