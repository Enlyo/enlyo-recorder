const path = require('path');
const { v4: uuid } = require('uuid');

const osn = require('obs-studio-node');
const { Subject } = require('rxjs');
const { first } = require('rxjs/operators');

const { byOS, OS, getOS } = require('../../operating-systems');

/**
 * Screen recorder
 */
const screenRecorder = {
    isInitialized: false,
    isRecording: false,
    settings: {},

    /* -------------------------------------------------------------------------- */
    /*                                   PUBLIC                                   */
    /* -------------------------------------------------------------------------- */

    /**
     * Initialize
     *
     * Init the library, launch OBS Studio instance, configure it, set up sources and scene
     *
     * @param {Object} settings - record settings
     */
    initialize(settings) {
        if (this.isInitialized) return;

        this.settings = Object.assign(
            {
                outputPath: '/',
                format: 'mkv',
                bitRate: 12000,
                fps: 60,
                screen: 0,
            },
            settings
        );

        this.display = this._getDisplayInfo();

        this._initOBS();
        this._configureOBS(this.settings);
        this._scene = this._setupScene();
        this._setupSources();
        this.isInitialized = true;
    },

    getAvailableScreens() {
        const videoSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'monitor_capture',
                [OS.Mac]: 'display_capture',
            }),
            'desktop-video'
        );

        const windows =
            getOS() === OS.Mac
                ? videoSource.properties.get('display').details
                : videoSource.properties.get('monitor').details;

        return windows.items;
    },

    /**
     * Start
     */
    async start() {
        if (!this.isInitialized) this.initialize();

        osn.NodeObs.OBS_service_startRecording();

        let signalInfo = await this.getNextSignalInfo();
        if (signalInfo.signal === 'Stop') {
            throw Error('Recording exception: ' + signalInfo.error);
        }

        this.isRecording = true;
    },

    /**
     * Stop
     */
    async stop() {
        if (!this.isInitialized) return;

        osn.NodeObs.OBS_service_stopRecording();

        // Wait for the second signal (first signal should be recording)
        await this.getNextSignalInfo();
        await this.getNextSignalInfo();

        this.isRecording = false;
    },

    /**
     * Shutdown
     *
     * @returns Boolean
     */
    async shutdown() {
        if (!this.isInitialized) return;

        try {
            osn.NodeObs.OBS_service_removeCallback();
            osn.NodeObs.IPC.disconnect();
            this.isInitialized = false;
        } catch (e) {
            throw Error('Shut down exception: ' + e);
        }
    },

    /* -------------------------------------------------------------------------- */
    /*                        PRIVATE - SET UP AND DESTROY                        */
    /* -------------------------------------------------------------------------- */

    /**
     * Init OBS
     *
     * @private
     */
    _initOBS() {
        const hostName = `obs-studio-node-${uuid()}`;
        const workingDirectory = this.fixPathWhenPackaged(
            path.join(__dirname, '../../node_modules', 'obs-studio-node')
        );
        const obsDataPath = this.fixPathWhenPackaged(
            path.join(__dirname, '../../osn-data')
        ); // OBS Studio configs and logs

        osn.NodeObs.IPC.host(hostName);
        osn.NodeObs.SetWorkingDirectory(workingDirectory);

        // TODO: make application version dynamic
        const initResult = osn.NodeObs.OBS_API_initAPI(
            'en-US',
            obsDataPath,
            '1.0.0'
        );
        if (initResult !== 0) {
            this.shutdown();
            throw Error(this._generateErrorMessage(initResult));
        }

        osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
            this.signals.next(signalInfo);
        });
    },

    /**
     * Generate error message
     * @param {*} result
     * @private
     */
    _generateErrorMessage(result) {
        const errorReasons = {
            '-2': 'DirectX could not be found on your system. Please install the latest version of DirectX for your machine here <https://www.microsoft.com/en-us/download/details.aspx?id=35?> and try again.',
            '-5': 'Failed to initialize OBS. Your video drivers may be out of date, or OBS-studio-node may not be supported on your system.',
        };

        return (
            errorReasons[result.toString()] ||
            `An unknown error #${result} was encountered while initializing OBS.`
        );
    },

    /**
     * Configure OBS
     *
     * @private
     */
    _configureOBS(settings) {
        this.setSetting('Output', 'Mode', 'Advanced');
        this.setSetting('Output', 'Track1Name', 'Mixed: all sources');

        // TODO: learn more about available encoders
        // potential additional setting to include
        const availableEncoders = this.getAvailableValues(
            'Output',
            'Recording',
            'RecEncoder'
        );
        this.setSetting(
            'Output',
            'RecEncoder',
            availableEncoders.slice(-1)[0] || 'x264'
        );

        this.setSetting('Output', 'RecFilePath', settings.outputPath);
        this.setSetting('Output', 'RecFormat', settings.format);
        this.setSetting('Output', 'VBitrate', settings.bitRate);
        this.setSetting('Video', 'FPSCommon', settings.fps);
    },

    _scene: null,

    /**
     * Set up scene
     *
     * @private
     * @returns Scene
     */
    _setupScene() {
        const videoSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'monitor_capture',
                [OS.Mac]: 'display_capture',
            }),
            'desktop-video',
            { monitor: this.settings.screen }
        );

        // Update source settings:
        let settings = videoSource.settings;
        settings['width'] = this.display.physicalWidth;
        settings['height'] = this.display.physicalHeight;
        videoSource.update(settings);
        videoSource.save();

        // Set output video size to 1920x1080
        const outputWidth = 1920;
        const outputHeight = Math.round(outputWidth / this.display.aspectRatio);
        this.setSetting('Video', 'Base', `${outputWidth}x${outputHeight}`);
        this.setSetting('Video', 'Output', `${outputWidth}x${outputHeight}`);
        const videoScaleFactor = this.display.physicalWidth / outputWidth;

        // A scene is necessary here to properly scale captured screen size to output video size
        const scene = osn.SceneFactory.create('test-scene');
        const sceneItem = scene.add(videoSource);
        sceneItem.scale = {
            x: 1.0 / videoScaleFactor,
            y: 1.0 / videoScaleFactor,
        };

        return scene;
    },

    // _setupScene() {
    //     const videoSource = osn.InputFactory.create(
    //         byOS({
    //             [OS.Windows]: 'monitor_capture',
    //             [OS.Mac]: 'display_capture',
    //         }),
    //         'desktop-video'
    //     );

    //     // Update source settings:
    //     let settings = videoSource.settings;
    //     settings['width'] = this.display.physicalHeight;
    //     settings['height'] = this.display.physicalHeight;
    //     videoSource.update(settings);
    //     videoSource.save();

    //     // Set output video size to 1920x1080
    //     const outputWidth = 1920;
    //     const outputHeight = 1080;
    //     this.setSetting('Video', 'Base', `${outputWidth}x${outputHeight}`);
    //     this.setSetting('Video', 'Output', `${outputWidth}x${outputHeight}`);

    //     // A scene is necessary here to properly scale captured screen size to output video size
    //     const scene = osn.SceneFactory.create('test-scene');

    //     // BACKGROUND
    //     const bgSource = osn.InputFactory.create('image_source', 'logo', {
    //         file: path.join(__dirname, './bg.jpg'),
    //     });
    //     const background = scene.add(bgSource);

    //     // MAP
    //     const mapItem = scene.add(videoSource);
    //     mapItem.crop = {
    //         left: 1655,
    //         top: 813,
    //         right: 12,
    //         bottom: 14,
    //     };
    //     mapItem.position = {
    //         x: 840,
    //         y: 0,
    //     };
    //     mapItem.scale = {
    //         x: 4.27,
    //         y: 4.27,
    //     };

    //     // BLUE GOLD
    //     const blueGold = scene.add(videoSource);
    //     blueGold.crop = {
    //         left: 793,
    //         top: 16,
    //         right: 1070,
    //         bottom: 1033,
    //     };
    //     blueGold.position = {
    //         x: 10,
    //         y: 50,
    //     };
    //     blueGold.scale = {
    //         x: 3.86,
    //         y: 3.86,
    //     };

    //     // SCORE
    //     const score = scene.add(videoSource);
    //     score.crop = {
    //         left: 904,
    //         top: 18,
    //         right: 889,
    //         bottom: 1022,
    //     };
    //     score.position = {
    //         x: 230,
    //         y: 50,
    //     };
    //     score.scale = {
    //         x: 2.99,
    //         y: 2.99,
    //     };

    //     // RED GOLD
    //     const redGold = scene.add(videoSource);
    //     redGold.crop = {
    //         left: 1112,
    //         top: 16,
    //         right: 751,
    //         bottom: 1033,
    //     };
    //     redGold.position = {
    //         x: 609,
    //         y: 50,
    //     };
    //     redGold.scale = {
    //         x: 3.86,
    //         y: 3.86,
    //     };

    //     // TIME
    //     const time = scene.add(videoSource);
    //     time.crop = {
    //         left: 938,
    //         top: 74,
    //         right: 920,
    //         bottom: 982,
    //     };
    //     time.position = {
    //         x: 304,
    //         y: 170,
    //     };
    //     time.scale = {
    //         x: 3.73,
    //         y: 3.73,
    //     };

    //     // OBJECTIVE TIMER 1
    //     const objTimer1 = scene.add(videoSource);
    //     objTimer1.crop = {
    //         left: 1740,
    //         top: 720,
    //         right: 90,
    //         bottom: 334,
    //     };
    //     objTimer1.position = {
    //         x: 10,
    //         y: 279,
    //     };
    //     objTimer1.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 2
    //     const objTimer2 = scene.add(videoSource);
    //     objTimer2.crop = {
    //         left: 1740,
    //         top: 746,
    //         right: 90,
    //         bottom: 308,
    //     };
    //     objTimer2.position = {
    //         x: 215,
    //         y: 279,
    //     };
    //     objTimer2.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 3
    //     const objTimer3 = scene.add(videoSource);
    //     objTimer3.crop = {
    //         left: 1740,
    //         top: 772,
    //         right: 90,
    //         bottom: 282,
    //     };
    //     objTimer3.position = {
    //         x: 420,
    //         y: 279,
    //     };
    //     objTimer3.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 4
    //     const objTimer4 = scene.add(videoSource);
    //     objTimer4.crop = {
    //         left: 1830,
    //         top: 694,
    //         right: 0,
    //         bottom: 360,
    //     };
    //     objTimer4.position = {
    //         x: 625,
    //         y: 279,
    //     };
    //     objTimer4.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 5
    //     const objTimer5 = scene.add(videoSource);
    //     objTimer5.crop = {
    //         left: 1830,
    //         top: 720,
    //         right: 0,
    //         bottom: 334,
    //     };
    //     objTimer5.position = {
    //         x: 10,
    //         y: 338,
    //     };
    //     objTimer5.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 6
    //     const objTimer6 = scene.add(videoSource);
    //     objTimer6.crop = {
    //         left: 1830,
    //         top: 746,
    //         right: 0,
    //         bottom: 308,
    //     };
    //     objTimer6.position = {
    //         x: 215,
    //         y: 338,
    //     };
    //     objTimer6.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // OBJECTIVE TIMER 7
    //     const objTimer7 = scene.add(videoSource);
    //     objTimer7.crop = {
    //         left: 1830,
    //         top: 772,
    //         right: 0,
    //         bottom: 282,
    //     };
    //     objTimer7.position = {
    //         x: 420,
    //         y: 338,
    //     };
    //     objTimer7.scale = {
    //         x: 2.28,
    //         y: 2.28,
    //     };

    //     // TABLE
    //     const table = scene.add(videoSource);
    //     table.crop = {
    //         left: 796,
    //         top: 855,
    //         right: 781,
    //         bottom: 7,
    //     };
    //     table.position = {
    //         x: 10,
    //         y: 417,
    //     };
    //     table.scale = {
    //         x: 2.39,
    //         y: 2.39,
    //     };

    //     return scene;
    // },

    /**
     * Set up sources
     *
     * @private
     */
    _setupSources() {
        osn.Global.setOutputSource(1, this._scene);

        // TODO refactor this
        let currentTrack = 2;
        this.getAudioDevices(
            byOS({
                [OS.Windows]: 'wasapi_output_capture',
                [OS.Mac]: 'coreaudio_output_capture',
            }),
            'desktop-audio'
        ).forEach((metadata) => {
            if (metadata.device_id === 'default') return;
            const source = osn.InputFactory.create(
                byOS({
                    [OS.Windows]: 'wasapi_output_capture',
                    [OS.Mac]: 'coreaudio_output_capture',
                }),
                'desktop-audio',
                { device_id: metadata.device_id }
            );
            this.setSetting(
                'Output',
                `Track${currentTrack}Name`,
                metadata.name
            );
            source.audioMixers = 1 | (1 << (currentTrack - 1)); // Bit mask to output to only tracks 1 and current track
            osn.Global.setOutputSource(currentTrack, source);
            currentTrack++;
        });

        this.getAudioDevices(
            byOS({
                [OS.Windows]: 'wasapi_input_capture',
                [OS.Mac]: 'coreaudio_input_capture',
            }),
            'mic-audio'
        ).forEach((metadata) => {
            if (metadata.device_id === 'default') return;
            const source = osn.InputFactory.create(
                byOS({
                    [OS.Windows]: 'wasapi_input_capture',
                    [OS.Mac]: 'coreaudio_input_capture',
                }),
                'mic-audio',
                { device_id: metadata.device_id }
            );
            this.setSetting(
                'Output',
                `Track${currentTrack}Name`,
                metadata.name
            );
            source.audioMixers = 1 | (1 << (currentTrack - 1)); // Bit mask to output to only tracks 1 and current track
            osn.Global.setOutputSource(currentTrack, source);
            currentTrack++;
        });

        this.setSetting(
            'Output',
            'RecTracks',
            parseInt('1'.repeat(currentTrack - 1), 2)
        ); // Bit mask of used tracks: 1111 to use first four (from available six)
    },

    /* -------------------------------------------------------------------------- */
    /*                              HELPERS - GENERAL                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Fix path when packaged
     *
     * When packaged, we need to fix some paths
     *
     * @param {String} p
     *
     * @returns {String}
     */
    fixPathWhenPackaged(p) {
        return p.replace('app.asar', 'app.asar.unpacked');
    },

    /**
     * Busy sleep
     *
     * @param {Number} sleepDuration
     */
    busySleep(sleepDuration) {
        var now = new Date().getTime();
        while (new Date().getTime() < now + sleepDuration) {
            /* do nothing */
        }
    },

    // Get information about primary display
    _getDisplayInfo() {
        // TODO: Refactor based on name
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.size;
        const { scaleFactor } = primaryDisplay;
        return {
            width,
            height,
            scaleFactor: scaleFactor,
            aspectRatio: width / height,
            physicalWidth: width * scaleFactor,
            physicalHeight: height * scaleFactor,
        };
    },

    /* -------------------------------------------------------------------------- */
    /*                                HELPERS - OBS                               */
    /* -------------------------------------------------------------------------- */

    /**
     * Get Audio Devices
     *
     * @param {String} type
     * @param {String} subtype
     * @returns {Array}
     */
    getAudioDevices(type, subtype) {
        const dummyDevice = osn.InputFactory.create(type, subtype, {
            device_id: 'does_not_exist',
        });
        const devices = dummyDevice.properties
            .get('device_id')
            .details.items.map(({ name, value }) => {
                return { device_id: value, name };
            });
        dummyDevice.release();
        return devices;
    },

    signals: new Subject(),

    /**
     * Get next signal info
     * @returns Promise
     */
    getNextSignalInfo() {
        return new Promise((resolve, reject) => {
            this.signals
                .pipe(first())
                .subscribe((signalInfo) => resolve(signalInfo));
            setTimeout(() => reject('Output signal timeout'), 30000);
        });
    },

    /**
     * Set setting
     *
     * @param {String} category
     * @param {String} parameter
     * @param {String} value
     */
    setSetting(category, parameter, value) {
        let oldValue;

        // Getting settings container
        const settings = osn.NodeObs.OBS_settings_getSettings(category).data;

        settings.forEach((subCategory) => {
            subCategory.parameters.forEach((param) => {
                if (param.name === parameter) {
                    oldValue = param.currentValue;
                    param.currentValue = value;
                }
            });
        });

        // Saving updated settings container
        if (value != oldValue) {
            osn.NodeObs.OBS_settings_saveSettings(category, settings);
        }
    },

    /**
     * Get available values
     *
     * @param {String} category
     * @param {String} subcategory
     * @param {String} parameter
     * @returns
     */
    getAvailableValues(category, subcategory, parameter) {
        const categorySettings =
            osn.NodeObs.OBS_settings_getSettings(category).data;
        if (!categorySettings) {
            return [];
        }

        const subcategorySettings = categorySettings.find(
            (sub) => sub.nameSubCategory === subcategory
        );
        if (!subcategorySettings) {
            return [];
        }

        const parameterSettings = subcategorySettings.parameters.find(
            (param) => param.name === parameter
        );
        if (!parameterSettings) {
            return [];
        }

        return parameterSettings.values.map((value) => Object.values(value)[0]);
    },
};

module.exports.screenRecorder = screenRecorder;
