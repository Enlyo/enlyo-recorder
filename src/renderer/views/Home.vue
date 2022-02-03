<template>
    <div class="container">
        <div id="preview" />
        <RecordButton
            class="mt-5"
            :is-recording="isRecording"
            @click="toggleRecorder"
        />
    </div>
</template>

<script>
import RecordButton from "../components/RecordButton.vue";

export default {
    name: "Home",

    components: {
        RecordButton,
    },

    data() {
        return {
            isRecording: false,
        };
    },

    mounted() {
        this.initializeRecorder();
        this.initializeRecorderPreview();

        this.setIpcListeners();
        this.setResizeObserver();
    },

    methods: {
        /* -------------------------------------------------------------------------- */
        /*                              SETUP AND DESTROY                             */
        /* -------------------------------------------------------------------------- */

        /**
         * Initialize recorder
         */
        initializeRecorder() {
            window.ipc.send("initialize-recorder");
        },

        /**
         * Initialize recorder preview
         */
        initializeRecorderPreview() {
            const previewContainer = document.getElementById("preview");
            const { width, height, x, y } =
                previewContainer.getBoundingClientRect();

            window.ipc.send("start-recorder-preview", {
                width,
                height,
                x,
                y,
            });
        },

        /**
         * Set ipc listeners
         */
        setIpcListeners() {
            window.ipc.on(
                "resized-recorder-preview",
                this.handleResizedRecorderPreview
            );
        },

        /**
         * Set resize observer
         */
        setResizeObserver() {
            var ro = new ResizeObserver(this.resizeRecorderPreview);
            ro.observe(document.querySelector("body"));
        },

        // TODO: Add on destroy logic

        /* -------------------------------------------------------------------------- */
        /*                               EVENT HANDLERS                               */
        /* -------------------------------------------------------------------------- */

        /**
         * Handle resized recorder preview
         */
        handleResizedRecorderPreview(payload) {
            const previewContainer = document.getElementById("preview");
            previewContainer.style = `height: ${payload.height}px`;
        },

        /**
         * Resize recorder preview
         */
        // TODO: Waarschijnlijk niet nodig als we scherm niet resizable maken
        async resizeRecorderPreview() {
            const previewContainer = document.getElementById("preview");
            const { width, height, x, y } =
                previewContainer.getBoundingClientRect();

            window.ipc.send("resize-recorder-preview", {
                width,
                height,
                x,
                y,
            });
        },

        /* -------------------------------------------------------------------------- */
        /*                                  RECORDING                                 */
        /* -------------------------------------------------------------------------- */

        /**
         * Toggle recorder
         */
        toggleRecorder() {
            this.isRecording ? this.stopRecorder() : this.startRecorder();
        },

        /**
         * Start recorder
         */
        startRecorder() {
            this.isRecording = true;

            window.ipc.send("start-recorder", {});
        },

        /**
         * Stop recorder
         */
        stopRecorder() {
            this.isRecording = false;

            window.ipc.send("stop-recorder", {});
        },
    },
};
</script>

<style lang="scss" scoped>
.container {
    padding: 2rem;

    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;

    #preview {
        width: 400px;
        height: 225px;
        background-color: $background-dark-5;
    }
}
</style>
