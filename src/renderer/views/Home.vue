<template>
    <AppLayout>
        <AppHeader title="Enlyo" has-settings />

        <AppContent>
            <div class="preview-box">
                <p class="box-label">Preview</p>
                <div id="preview" class="mt-3" />
            </div>
        </AppContent>
        <AppFooter>
            <div class="record-button-box" @click="toggleRecorder">
                <RecordButton :is-recording="isRecording" />
                <p class="record-button-label">Start recording</p>
            </div>
        </AppFooter>
    </AppLayout>
</template>

<script>
import AppLayout from '@/components/layout/AppLayout.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import AppContent from '@/components/layout/AppContent.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import RecordButton from '@/components/RecordButton.vue';

export default {
    name: 'Home',

    components: {
        AppLayout,
        AppHeader,
        AppContent,
        AppFooter,
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
            window.ipc.send('initialize-recorder');
        },

        /**
         * Initialize recorder preview
         */
        initializeRecorderPreview() {
            const previewContainer = document.getElementById('preview');
            const { width, height, x, y } =
                previewContainer.getBoundingClientRect();

            window.ipc.send('start-recorder-preview', {
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
                'resized-recorder-preview',
                this.handleResizedRecorderPreview
            );
        },

        /**
         * Set resize observer
         */
        setResizeObserver() {
            var ro = new ResizeObserver(this.resizeRecorderPreview);
            ro.observe(document.querySelector('body'));
        },

        // TODO: Add on destroy logic

        /* -------------------------------------------------------------------------- */
        /*                               EVENT HANDLERS                               */
        /* -------------------------------------------------------------------------- */

        /**
         * Handle resized recorder preview
         */
        handleResizedRecorderPreview(payload) {
            const previewContainer = document.getElementById('preview');
            previewContainer.style = `height: ${payload.height}px`;
        },

        /**
         * Resize recorder preview
         */
        // TODO: Waarschijnlijk niet nodig als we scherm niet resizable maken
        async resizeRecorderPreview() {
            const previewContainer = document.getElementById('preview');
            const { width, height, x, y } =
                previewContainer.getBoundingClientRect();

            window.ipc.send('resize-recorder-preview', {
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

            window.ipc.send('start-recorder', {});
        },

        /**
         * Stop recorder
         */
        stopRecorder() {
            this.isRecording = false;

            window.ipc.send('stop-recorder', {});
        },
    },
};
</script>

<style lang="scss" scoped>
.preview-box {
    padding: 1rem;
    background-color: $background-dark-4;
    border-radius: 8px;
    box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.18),
        0px 0px 0px 1px rgba(0, 0, 0, 0.13);

    .box-label {
        text-transform: uppercase;
        font-weight: bold;
        font-size: $s-14px;
        color: $text-soft-white;
    }
}

#preview {
    width: 504px;
    height: 283px;
    aspect-ratio: 16/9;
    background-color: $background-dark-5;
    border-radius: 8px;
    overflow: hidden;
}

.record-button-box {
    display: flex;
    align-items: center;
    cursor: pointer;

    .record-button-label {
        margin-left: 0.75rem;
        text-transform: uppercase;
        color: $text-soft-white;
        transition: all 0.2s;
        font-weight: 500;

        &:hover {
            color: $white;
        }
    }
}
</style>
