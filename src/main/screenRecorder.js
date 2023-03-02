const path = require('path');
const { v4: uuid } = require('uuid');
const osn = require('obs-studio-node');
const { Subject } = require('rxjs');
const { first } = require('rxjs/operators');
const { byOS, OS, getOS } = require('../../operating-systems');
const { getAppVersion } = require('./helpers');

/**
 * Screen recorder
 */
const screenRecorder = {
    isInitialized: false,
    isRecording: false,
    settings: {
        bitRate: 12000,
        captureMode: 'screen',
        format: 'mkv',
        fps: 60,
        microphone: null,
        microphoneVolume: 1,
        outputPath: '/',
        resolution: 1080,
        screen: null,
        speaker: null,
        speakerVolume: 1,
    },
    _scene: null,
    _signals: new Subject(),

    /* -------------------------------------------------------------------------- */
    /*                                   PUBLIC                                   */
    /* -------------------------------------------------------------------------- */

    /**
     * Set settings
     */
    setSettings(settings) {
        this.settings = Object.assign(this.settings, settings);
    },

    /**
     * Initialize
     *
     * Init the library, launch OBS Studio instance, configure it, set up sources and scene
     *
     */
    initialize() {
        if (this.isInitialized) return;

        this._initOBS();
        this._configureOBS(this.settings);
        this._scene = this._setupScene();
        this._setupSources();
        this.isInitialized = true;
    },

    /**
     * Set fps
     */
    setFps(fps) {
        if (!this.isInitialized) this.initialize();

        this.settings.fps = fps;

        this.setSetting('Video', 'FPSCommon', fps);
    },

    /**
     * Set capture mode
     */
    setCaptureMode(captureMode) {
        if (!this.isInitialized) this.initialize();

        this.settings.captureMode = captureMode;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set screen
     */
    setScreen(screen) {
        this.settings.screen = screen;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set resolution
     */
    setResolution(resolution) {
        if (!this.isInitialized) this.initialize();

        this.settings.resolution = resolution;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set speaker
     */
    setSpeaker(speaker) {
        if (!this.isInitialized) this.initialize();

        this.settings.speaker = speaker;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set microphone
     */
    setMicrophone(microphone) {
        if (!this.isInitialized) this.initialize();

        this.settings.microphone = microphone;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set speaker volume
     */
    setSpeakerVolume(volume) {
        if (!this.isInitialized) this.initialize();

        this.settings.speakerVolume = volume;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set microphone volume
     */
    setMicrophoneVolume(volume) {
        if (!this.isInitialized) this.initialize();

        this.settings.microphoneVolume = volume;

        this._scene = this._setupScene();
        this._setupSources();
    },

    /**
     * Set folder
     */
    setFolder(outputPath) {
        this.setSetting('Output', 'RecFilePath', outputPath);
    },

    /**
     * Get available screens
     */
    getAvailableScreens() {
        const videoSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'monitor_capture',
                [OS.Mac]: 'display_capture',
            }),
            'desktop-video'
        );

        if (!videoSource.properties) {
            return [];
        }

        const windows =
            getOS() === OS.Mac
                ? videoSource.properties.get('display').details
                : videoSource.properties.get('monitor').details;

        return windows.items;
    },

    /**
     * Get default screen
     */
    getDefaultScreen() {
        const videoSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'monitor_capture',
                [OS.Mac]: 'display_capture',
            }),
            'desktop-video'
        );

        if (!videoSource.properties) {
            return [];
        }

        const windows =
            getOS() === OS.Mac
                ? videoSource.properties.get('display').details
                : videoSource.properties.get('monitor').details;

        return windows.items[0];
    },

    /**
     * Verify screen
     */
    verifyScreen() {
        if (!this.settings.screen) {
            this.settings.screen = this.getDefaultScreen();
        }
        const screenConnected = !!this.getAvailableScreens().find(
            (screen) => screen.name === this.settings.screen.name
        );
        if (!screenConnected) {
            this.settings.screen = this.getDefaultScreen();
        }
    },

    /**
     * Get available speakers
     */
    getAvailableSpeakers() {
        const speakers = this.getAudioDevices(
            byOS({
                [OS.Windows]: 'wasapi_output_capture',
                [OS.Mac]: 'coreaudio_output_capture',
            }),
            'desktop-audio'
        );

        return speakers;
    },

    /**
     * Get default speaker
     */
    getDefaultSpeaker() {
        return this.getAvailableSpeakers[0];
    },

    /**
     * Get available microphones
     */
    getAvailableMicrophones() {
        const microphones = this.getAudioDevices(
            byOS({
                [OS.Windows]: 'wasapi_input_capture',
                [OS.Mac]: 'coreaudio_input_capture',
            }),
            'mic-audio'
        );

        return microphones;
    },

    /**
     * Get default microphone
     */
    getDefaultMicrophone() {
        return this.getAvailableMicrophones[0];
    },

    /**
     * Start
     */
    async start() {
        if (!this.isInitialized) this.initialize();

        this.verifyScreen();

        osn.NodeObs.OBS_service_startRecording();

        const signalInfo = await this.getNextSignalInfo();
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

        const initResult = osn.NodeObs.OBS_API_initAPI(
            'en-US',
            obsDataPath,
            getAppVersion()
        );
        if (initResult !== 0) {
            this.shutdown();
            throw Error(this._generateErrorMessage(initResult));
        }

        osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
            this._signals.next(signalInfo);
        });
    },

    /**
     * Generate error message
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
     */
    _configureOBS(settings) {
        this.setSetting('Output', 'Mode', 'Advanced');
        this.setSetting('Output', 'Track1Name', 'Mixed: all sources');

        // Potential additional setting to include
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

    /**
     * Set up scene
     */
    _setupScene() {
        // if (this.settings.captureMode === 'screen') {
        //     return this._setupSceneScreenCapture();
        // }
        // if (this.settings.captureMode === 'game') {
        //     return this._setupSceneGameCapture();
        // }
        return this._setupSceneScreenCapture();
    },

    _setupSceneScreenCapture() {
        this.verifyScreen();

        const { width, height, aspectRatio } = this.parseResolution(
            this.settings.screen.name
        );

        const videoSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'monitor_capture',
                [OS.Mac]: 'display_capture',
            }),
            'desktop-video',
            { monitor: this.settings.screen.value }
        );

        let { screen } = require('electron');
        // Update source settings:
        const settings = videoSource.settings;
        console.debug(settings);
        settings['width'] = width;
        settings['height'] = height;
        videoSource.update(settings);
        videoSource.save();

        const outputWidth = Math.round(this.settings.resolution / 0.5625); // 16:9 ratio
        const outputHeight = Math.round(outputWidth / aspectRatio);
        this.setSetting('Video', 'Base', `${outputWidth}x${outputHeight}`);
        this.setSetting('Video', 'Output', `${outputWidth}x${outputHeight}`);

        const videoScaleFactor = width / outputWidth;

        // A scene is necessary here to properly scale captured screen size to output video size
        const scene = osn.SceneFactory.create('default-scene');
        const sceneItem = scene.add(videoSource);
        sceneItem.scale = {
            x: 1.0 / videoScaleFactor,
            y: 1.0 / videoScaleFactor,
        };

        return scene;
    },

    _setupSceneGameCapture() {
        if (!this.settings.screen) {
            this.settings.screen = this.getDefaultScreen();
        }

        const { width, height, aspectRatio } = this.parseResolution(
            this.settings.screen.name
        );

        const gameSource = osn.InputFactory.create(
            'game_capture',
            'game-video'
        );

        gameSource.update({
            auto_capture_rules_path: path.join(
                __dirname,
                '../../public/game_capture_list.json'
            ),
            width: width,
            height: height,
        });
        gameSource.save();

        const outputWidth = Math.round(this.settings.resolution / 0.5625); // 16:9 ratio
        const outputHeight = Math.round(outputWidth / aspectRatio);
        this.setSetting('Video', 'Base', `${outputWidth}x${outputHeight}`);
        this.setSetting('Video', 'Output', `${outputWidth}x${outputHeight}`);

        // A scene is necessary here to properly scale captured screen size to output video size
        const scene = osn.SceneFactory.create('default-scene');
        scene.add(gameSource);

        return scene;
    },

    /**
     * Set up sources
     */
    _setupSources() {
        // Set up video source
        const VIDEO_TRACK = 1;
        osn.Global.setOutputSource(VIDEO_TRACK, this._scene);

        // Set up speaker source
        const SPEAKER_TRACK = 2;

        if (!this.settings.speaker) {
            this.settings.speaker = this.getDefaultSpeaker();
        }

        const speakerSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'wasapi_output_capture',
                [OS.Mac]: 'coreaudio_output_capture',
            }),
            'desktop-audio',
            { device_id: this.settings.speaker.device_id }
        );

        speakerSource.audioMixers = 1 | (1 << (SPEAKER_TRACK - 1)); // Bit mask to output to only tracks 1 and current track

        const speakerFader = osn.FaderFactory.create();
        speakerFader.attach(speakerSource);
        speakerFader.deflection = this.settings.speakerVolume;

        this.setSetting(
            'Output',
            `Track${SPEAKER_TRACK}Name`,
            this.settings.speaker.name
        );
        osn.Global.setOutputSource(SPEAKER_TRACK, speakerSource);

        // Set up microphone source
        const MICROPHONE_TRACK = 3;

        if (!this.settings.microphone) {
            this.settings.microphone = this.getDefaultMicrophone();
        }

        const microphoneSource = osn.InputFactory.create(
            byOS({
                [OS.Windows]: 'wasapi_input_capture',
                [OS.Mac]: 'coreaudio_input_capture',
            }),
            'mic-audio',
            { device_id: this.settings.microphone.device_id }
        );

        microphoneSource.audioMixers = 1 | (1 << (MICROPHONE_TRACK - 1)); // Bit mask to output to only tracks 1 and current track

        const microphoneFader = osn.FaderFactory.create();
        microphoneFader.attach(microphoneSource);
        microphoneFader.deflection = this.settings.microphoneVolume;

        this.setSetting(
            'Output',
            `Track${MICROPHONE_TRACK}Name`,
            this.settings.microphone.name
        );
        osn.Global.setOutputSource(MICROPHONE_TRACK, microphoneSource);

        // Set rec tracks
        this.setSetting('Output', 'RecTracks', 3);
    },

    /* -------------------------------------------------------------------------- */
    /*                              HELPERS - GENERAL                             */
    /* -------------------------------------------------------------------------- */

    /**
     * Fix path when packaged
     *
     * When packaged, we need to fix some paths
     */
    fixPathWhenPackaged(p) {
        return p.replace('app.asar', 'app.asar.unpacked');
    },

    /* -------------------------------------------------------------------------- */
    /*                                HELPERS - OBS                               */
    /* -------------------------------------------------------------------------- */

    /**
     * Get Audio Devices
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

    /**
     * Get next signal info
     */
    getNextSignalInfo() {
        return new Promise((resolve, reject) => {
            this._signals
                .pipe(first())
                .subscribe((signalInfo) => resolve(signalInfo));
            setTimeout(() => reject('Output signal timeout'), 30000);
        });
    },

    /**
     * Set setting
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

    /**
     * Parse resolution
     */
    parseResolution(value) {
        if (!value) {
            return { width: 1920, height: 1080, aspectRatio: 0 };
        }

        const isRetina = value.toLowerCase().includes('retina');
        console.debug(isRetina);

        const scale = isRetina ? 2 : 1;

        let resolution = value.split(': ')[1];
        resolution = resolution.split(' ')[0];
        const width = Number(resolution.split('x')[0]) * scale;
        const height = Number(resolution.split('x')[1]) * scale;
        const aspectRatio = width / height;

        return { width, height, aspectRatio };
    },
};

module.exports.screenRecorder = screenRecorder;
