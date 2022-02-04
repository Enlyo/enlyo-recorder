const path = require('path');
const { v4: uuid } = require('uuid');

const osn = require('obs-studio-node');
const { Subject } = require('rxjs');
const { first } = require('rxjs/operators');

const { byOS, OS, getOS } = require('../../operating-systems');

// NWR is used to handle display rendering via IOSurface on mac
let nwr;
if (getOS() === OS.Mac) {
    nwr = require('node-window-rendering');
}

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
                bitRate: 10000,
                fps: 60,
                displayId: 'display1',
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

    /**
     * Start
     */
    async start() {
        if (!this.isInitialized) this.initialize();

        console.debug('STARTING RECORDING');

        osn.NodeObs.OBS_service_startRecording();

        let signalInfo = await this.getNextSignalInfo();
        if (signalInfo.signal === 'Stop') {
            throw Error('Recording exception: ' + signalInfo.error);
        }

        console.debug(
            'Started signalInfo.type:',
            signalInfo.type,
            '(expected: "recording")'
        );
        console.debug(
            'Started signalInfo.signal:',
            signalInfo.signal,
            '(expected: "start")'
        );
        console.debug('STARTED RECORDING!');

        this.isRecording = true;
    },

    /**
     * Stop
     */
    async stop() {
        if (!this.isInitialized) return;

        console.debug('STOPPING RECORDING');

        osn.NodeObs.OBS_service_stopRecording();

        // Wait for the second signal (first signal should be recording)
        let signalInfo = await this.getNextSignalInfo();

        console.debug(
            'On stop signalInfo.type:',
            signalInfo.type,
            '(expected: "recording")'
        );
        console.debug(
            'On stop signalInfo.signal:',
            signalInfo.signal,
            '(expected: "stopping")'
        );

        signalInfo = await this.getNextSignalInfo();

        console.debug(
            'After stop signalInfo.type:',
            signalInfo.type,
            '(expected: "recording")'
        );
        console.debug(
            'After stop signalInfo.signal:',
            signalInfo.signal,
            '(expected: "stop")'
        );

        console.debug('STOPPPED RECORDING');

        this.isRecording = false;
    },

    /**
     * Set up preview
     */
    setupPreview(window, bounds) {
        console.debug('STARTING PREVIEW');

        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
            window.getNativeWindowHandle(),
            this._scene.name, // or use camera source Id here
            this.settings.displayId
        );
        osn.NodeObs.OBS_content_setShouldDrawUI(this.settings.displayId, false);
        osn.NodeObs.OBS_content_setPaddingSize(this.settings.displayId, 0);
        // Match padding color with main window background color
        osn.NodeObs.OBS_content_setPaddingColor(
            this.settings.displayId,
            255,
            255,
            255
        );

        return this.resizePreview(window, bounds);
    },

    hasExistingWindow: false,
    initY: 0,

    /**
     * Resize preview
     */
    resizePreview(window, bounds) {
        const scaleFactor = getOS() === OS.Mac ? 1 : this.display.scaleFactor;

        const displayWidth = Math.floor(bounds.width);
        const displayHeight = Math.round(
            displayWidth / this.display.aspectRatio
        );
        const displayX = Math.floor(bounds.x);
        const displayY = Math.floor(bounds.y);
        if (this.initY === 0) {
            this.initY = displayY;
        }
        osn.NodeObs.OBS_content_resizeDisplay(
            this.settings.displayId,
            displayWidth * scaleFactor,
            displayHeight * scaleFactor
        );

        if (getOS() === OS.Mac) {
            if (this.hasExistingWindow) {
                nwr.destroyWindow(this.settings.displayId);
                nwr.destroyIOSurface(this.settings.displayId);
            }
            const surface = osn.NodeObs.OBS_content_createIOSurface(
                this.settings.displayId
            );
            nwr.createWindow(
                this.settings.displayId,
                window.getNativeWindowHandle()
            );
            nwr.connectIOSurface(this.settings.displayId, surface);
            nwr.moveWindow(
                this.settings.displayId,
                displayX * scaleFactor,
                window.getContentSize()[1] - displayHeight - displayY
            );
            this.hasExistingWindow = true;
        } else {
            osn.NodeObs.OBS_content_moveDisplay(
                this.settings.displayId,
                displayX * scaleFactor,
                displayY * scaleFactor
            );
        }

        console.debug('STARTED PREVIEW');

        return { height: displayHeight };
    },

    /**
     * Destroy preview
     */
    destroyPreview() {
        console.debug('DESTROYING PREVIEW');

        osn.NodeObs.OBS_content_destroyDisplay(this.settings.displayId);

        if (getOS() === OS.Mac) {
            nwr.destroyWindow(this.settings.displayId);
            nwr.destroyIOSurface(this.settings.displayId);
            this.hasExistingWindow = false;
        }

        console.debug('PREVIEW DESTROYED');
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
            'desktop-video'
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
