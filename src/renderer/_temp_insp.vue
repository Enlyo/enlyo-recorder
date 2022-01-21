<template>
    <div>
        <h1>Hello from OBS Studio Node!</h1>

        <div class="d-block border">
            <b>Recording:</b><br />
            <button id="rec-button" onclick="switchRecording()">
                ⏳ Initializing, please wait...
            </button>

            <span id="rec-timer">0:00:00.0</span>

            <button title="Open folder with videos" onclick="openFolder()">
                📂
            </button>
        </div>

        <div class="d-block border">
            <b>Virtual Camera:</b><br />
            <button
                id="install-virtual-cam-plugin-button"
                onclick="installVirtualCamPlugin()"
            >
                Install Plugin
            </button>
            <button
                id="uninstall-virtual-cam-plugin-button"
                onclick="uninstallVirtualCamPlugin()"
            >
                Uninstall Plugin
            </button>
            <button id="start-virtual-cam-button" onclick="startVirtualCam()">
                Start Virtual Camera
            </button>
            <button id="stop-virtual-cam-button" onclick="stopVirtualCam()">
                Stop Virtual Camera
            </button>
            <span id="virtual-cam-plugin-status">...</span>
        </div>

        <div id="preview">
            Initializing...
        </div>

        <table class="performanceStatistics">
            <tr>
                <td>CPU</td>
                <td>
                    <meter
                        id="cpuMeter"
                        value="0"
                        min="0"
                        optimum="50"
                        low="65"
                        high="80"
                        max="100"
                    ></meter>
                    <span id="cpu">Loading...</span>
                </td>
            </tr>
            <tr>
                <td>Dropped frames</td>
                <td id="numberDroppedFrames">
                    Loading...
                </td>
            </tr>
            <tr>
                <td>Dropped frames</td>
                <td id="percentageDroppedFrames">
                    Loading...
                </td>
            </tr>
            <tr>
                <td>Bandwidth</td>
                <td id="bandwidth">
                    Loading...
                </td>
            </tr>
            <tr>
                <td>Framerate</td>
                <td id="frameRate">
                    Loading...
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
// const { ipcRenderer } = require("electron");

export default {
    name: "IndexPage",

    data() {
        return {
            // Recorder
            recording: false,

            // Timer
            recordingStartedAt: null,
            timer: null,

            // Virtual cam
            virtualCamRunning: false,
        };
    },

    mounted() {
        // TODO: find out how to add event listener to current window
        // const currentWindow = remote.getCurrentWindow();
        // currentWindow.on("resize", this.resizePreview);

        document.addEventListener("scroll", this.resizePreview);

        // TODO: Find out how to set resive observer
        // var ro = new ResizeObserver(this.resizePreview);
        // ro.observe(document.querySelector("#preview"));

        try {
            this.initOBS();
            this.setupPreview();
            this.updateRecordingUI();
            this.updateVirtualCamUI();
        } catch (err) {
            console.log(err);
        }
    },

    methods: {
        /* -------------------------------------------------------------------------- */
        /*                             SET UP AND DESTROY                             */
        /* -------------------------------------------------------------------------- */

        /**
         * Init OBS
         */
        async initOBS() {
            // const result = await ipcRenderer.invoke("recording-init");
            // console.debug("initOBS result:", result);
            // if (result) {
            //     ipcRenderer.on("performanceStatistics", (_event, data) =>
            //         this.onPerformanceStatistics(data)
            //     );
            // }
        },

        /**
         * Set up preview
         */
        async setupPreview() {
            // const previewContainer = document.getElementById("preview");
            // const { width, height, x, y } =
            //     previewContainer.getBoundingClientRect();
            // const result = await ipcRenderer.invoke("preview-init", {
            //     width,
            //     height,
            //     x,
            //     y,
            // });
            // previewContainer.style = `height: ${result.height}px`;
        },

        /* -------------------------------------------------------------------------- */
        /*                                  RECORDING                                 */
        /* -------------------------------------------------------------------------- */

        /**
         * Start recording
         */
        async startRecording() {
            // const result = await ipcRenderer.invoke("recording-start");
            // console.debug("startRecording result:", result);
            // return result;
        },

        /**
         * Stop recording
         */
        async stopRecording() {
            // const result = await ipcRenderer.invoke("recording-stop");
            // console.debug("stopRecording result:", result);
            // return result;
        },

        /**
         * Switch recording
         */
        async switchRecording() {
            if (this.recording) {
                const result = await this.stopRecording();
                this.recording = result.recording;
            } else {
                const result = await this.startRecording();
                this.recording = result.recording;
            }
            this.updateRecordingUI();
        },

        /* -------------------------------------------------------------------------- */
        /*                                     UI                                     */
        /* -------------------------------------------------------------------------- */

        /**
         * Update recording UI
         */
        updateRecordingUI() {
            const button = document.getElementById("rec-button");
            button.disabled = false;

            if (this.recording) {
                button.innerText = "⏹️ Stop recording";
                this.startTimer();
            } else {
                button.innerText = "⏺️ Start recording";
                this.stopTimer();
            }
        },

        /**
         * Update virtual cam UI
         */
        async updateVirtualCamUI() {
            // if (await ipcRenderer.invoke("isVirtualCamPluginInstalled")) {
            //     document.querySelector(
            //         "#install-virtual-cam-plugin-button"
            //     ).style.display = "none";
            //     if (this.virtualCamRunning) {
            //         document.querySelector(
            //             "#virtual-cam-plugin-status"
            //         ).innerText = "Running";
            //         document.querySelector(
            //             "#stop-virtual-cam-button"
            //         ).style.display = "";
            //         document.querySelector(
            //             "#start-virtual-cam-button"
            //         ).style.display = "none";
            //         document.querySelector(
            //             "#uninstall-virtual-cam-plugin-button"
            //         ).style.display = "none";
            //     } else {
            //         document.querySelector(
            //             "#virtual-cam-plugin-status"
            //         ).innerText = "Plugin installed";
            //         document.querySelector(
            //             "#stop-virtual-cam-button"
            //         ).style.display = "none";
            //         document.querySelector(
            //             "#start-virtual-cam-button"
            //         ).style.display = "";
            //         document.querySelector(
            //             "#uninstall-virtual-cam-plugin-button"
            //         ).style.display = "";
            //     }
            // } else {
            //     document.querySelector("#virtual-cam-plugin-status").innerText =
            //         "Plugin not installed";
            //     document.querySelector(
            //         "#install-virtual-cam-plugin-button"
            //     ).style.display = "";
            //     document.querySelector(
            //         "#uninstall-virtual-cam-plugin-button"
            //     ).style.display = "none";
            //     document.querySelector(
            //         "#start-virtual-cam-button"
            //     ).style.display = "none";
            //     document.querySelector(
            //         "#stop-virtual-cam-button"
            //     ).style.display = "none";
            // }
        },

        /**
         * Resize preview
         */
        async resizePreview() {
            // const previewContainer = document.getElementById("preview");
            // const { width, height, x, y } =
            //     previewContainer.getBoundingClientRect();
            // const result = await ipcRenderer.invoke("preview-bounds", {
            //     width,
            //     height,
            //     x,
            //     y,
            // });
            // previewContainer.style = `height: ${result.height}px`;
        },

        /**
         * On performance statistics
         */
        onPerformanceStatistics(data) {
            document.querySelector(
                ".performanceStatistics #cpu"
            ).innerText = `${data.CPU} %`;
            document.querySelector(".performanceStatistics #cpuMeter").value =
                data.CPU;
            document.querySelector(
                ".performanceStatistics #numberDroppedFrames"
            ).innerText = data.numberDroppedFrames;
            document.querySelector(
                ".performanceStatistics #percentageDroppedFrames"
            ).innerText = `${data.percentageDroppedFrames} %`;
            document.querySelector(
                ".performanceStatistics #bandwidth"
            ).innerText = data.bandwidth;
            document.querySelector(
                ".performanceStatistics #frameRate"
            ).innerText = `${Math.round(data.frameRate)} fps`;
        },

        /* -------------------------------------------------------------------------- */
        /*                                 VIRTUAL CAM                                */
        /* -------------------------------------------------------------------------- */

        /**
         * Uninstal virtual cam plugin
         */
        async uninstallVirtualCamPlugin() {
            // await ipcRenderer.invoke("uninstallVirtualCamPlugin");
            // this.updateVirtualCamUI();
        },

        /**
         * Install virtual cam plugin
         */
        async installVirtualCamPlugin() {
            // await ipcRenderer.invoke("installVirtualCamPlugin");
            // this.updateVirtualCamUI();
        },

        /**
         * Start virtual cam
         */
        async startVirtualCam() {
            // await ipcRenderer.invoke("startVirtualCam");
            // this.virtualCamRunning = true;
            // this.updateVirtualCamUI();
        },

        /**
         * Stop virtual cam
         */
        async stopVirtualCam() {
            // await ipcRenderer.invoke("stopVirtualCam");
            // this.virtualCamRunning = false;
            // this.updateVirtualCamUI();
        },

        /* -------------------------------------------------------------------------- */
        /*                                    TIMER                                   */
        /* -------------------------------------------------------------------------- */

        /**
         * Start timer
         */
        startTimer() {
            this.recordingStartedAt = Date.now();
            this.timer = setInterval(this.updateTimer, 100);
        },

        /**
         * Stop timer
         */
        stopTimer() {
            clearInterval(this.timer);
            this.timer = null;
        },

        /**
         * Update timer
         */
        updateTimer() {
            const diff = Date.now() - this.recordingStartedAt;
            const timerElem = document.getElementById("rec-timer");
            const decimals = `${Math.floor((diff % 1000) / 100)}`;
            const seconds = `${Math.floor((diff % 60000) / 1000)}`.padStart(
                2,
                "0"
            );
            const minutes = `${Math.floor((diff % 3600000) / 60000)}`.padStart(
                2,
                "0"
            );
            const hours = `${Math.floor(diff / 3600000)}`.padStart(2, "0");
            timerElem.innerText = `${hours}:${minutes}:${seconds}.${decimals}`;
        },
    },
};
</script>

<style scoped>
#preview {
    margin-top: 2rem;
}

.performanceStatistics {
    margin-top: 2rem;
    margin-bottom: 3rem;
    border-collapse: collapse;
}

.performanceStatistics tr,
td {
    border-bottom: 1px solid rgb(165, 165, 165);
    border-top: 1px solid rgb(165, 165, 165);
    padding: 0.5rem;
}

.d-block {
    display: block;
}

.border {
    border: 1px solid grey;
    border-radius: 1rem;
    padding: 0.5rem;
    margin-bottom: 1rem;
}
</style>
