<template>
    <AppLayout :class="{ 'is-recording': isRecording }">
        <AppHeader v-if="!isRecording" title="Enlyo" has-settings />

        <AppContent v-if="!isRecording">
            <div class="preview-box">
                <p class="box-label">Preview</p>
                <!-- <div id="preview" class="mt-3" /> -->

                <video
                    v-if="showPreview"
                    ref="streamPreview"
                    :src="streamPreview"
                ></video>
            </div>
        </AppContent>
        <AppFooter>
            <div
                v-if="!isRecording"
                class="record-button-box"
                @click="toggleRecorder"
            >
                <RecordButton :is-recording="isRecording" />
                <p class="record-button-label">Start recording</p>
            </div>

            <div v-else>
                <div
                    v-if="!isLoading"
                    class="active-recording-box"
                    @click="toggleRecorder"
                >
                    <RecordButton :is-recording="isRecording" size="is-large" />
                    <div class="record-time-label mt-6">
                        {{ recordTimeFormatted }}
                    </div>
                    <div class="recording-label">Recording</div>
                </div>
                <div v-else>
                    <Loader />
                </div>
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
import Loader from '@/components/Loader.vue';

export default {
    name: 'Home',

    components: {
        AppLayout,
        AppHeader,
        AppContent,
        AppFooter,
        RecordButton,
        Loader,
    },

    data() {
        return {
            isRecording: false,
            isLoading: false,
            recordTime: 0,
            timer: null,

            showPreview: false,
            streamPreview: null,
        };
    },

    computed: {
        recordTimeFormatted() {
            const date = new Date(this.recordTime * 1000).toISOString();

            return this.recordTime >= 3600
                ? date.substr(11, 8)
                : date.substr(14, 5);
        },
    },

    mounted() {
        this.initializeRecorder();
        this.initializeRecorderPreview();

        this.setIpcListeners();
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
            // const previewContainer = document.getElementById('preview');
            // const { width, height, x, y } =
            //     previewContainer.getBoundingClientRect();

            // window.ipc.send('start-recorder-preview', {
            //     width,
            //     height,
            //     x,
            //     y,
            // });

            console.log(navigator);

            window.ipc.send('start-recorder-preview', {});
        },

        /**
         * Stop recorder preview
         */
        stopRecorderPreview() {
            window.ipc.send('stop-recorder-preview', {});
        },

        /**
         * Set ipc listeners
         */
        setIpcListeners() {
            window.ipc.on('started-recorder', this.handleRecorderStarted);
            window.ipc.on('stopped-recorder', this.handleRecorderStopped);
            window.ipc.on(
                'started-recording-preview',
                this.handlePreviewStream
            );
        },

        // TODO: Add on destroy logic -> (also record timer ect)

        /* -------------------------------------------------------------------------- */
        /*                                  PREVIEW                                 */
        /* -------------------------------------------------------------------------- */

        handlePreviewStream(stream) {
            console.log('test');
            console.log(stream);
            console.log(this.$refs.streamPreview);

            const streamPreview = this.$refs.streamPreview;

            streamPreview.srcObject = stream;
        },

        /* -------------------------------------------------------------------------- */
        /*                                  RECORDING                                 */
        /* -------------------------------------------------------------------------- */

        /**
         * Set is recording
         */
        setIsRecording(bool) {
            this.isRecording = bool;
        },

        setIsLoading(bool) {
            this.isLoading = bool;
        },

        /**
         * Toggle recorder
         */
        toggleRecorder() {
            this.isRecording ? this.stopRecorder() : this.handleStartRecorder();
        },

        /**
         * Start recorder
         */
        handleStartRecorder() {
            this.stopRecorderPreview();
            this.setIsLoading(true);
            this.setIsRecording(true);

            setTimeout(() => this.startRecorder(), 1000);
        },

        /**
         * Dispatch start recorder ipc
         */
        startRecorder() {
            window.ipc.send('start-recorder', {});
        },

        /**
         * Handle recorder started
         */
        handleRecorderStarted() {
            this.setIsLoading(false);
            this.startRecordTime();
        },

        /**
         * Dispatch stop recorder ipc
         */
        stopRecorder() {
            this.setIsLoading(true);
            window.ipc.send('stop-recorder', {});
        },

        /**
         * Handle recorder stopped
         */
        handleRecorderStopped() {
            this.setIsRecording(false);
            this.setIsLoading(false);
            this.resetRecordTime();
            this.$nextTick(() => this.initializeRecorderPreview());
        },

        /**
         * Start record time
         */
        startRecordTime() {
            this.timer = setInterval(() => this.recordTime++, 1000);
        },

        /**
         * Stop record time
         */
        stopRecordTime() {
            clearInterval(this.timer);
        },

        /**
         * Reset record time
         */
        resetRecordTime() {
            this.stopRecordTime();
            this.recordTime = 0;
            this.timer = null;
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

.is-recording {
    .app-footer {
        height: 100%;
        justify-content: center;
    }
}

.active-recording-box {
    display: flex;
    flex-direction: column;
    align-items: center;

    .record-time-label {
        font-size: $s-36px;
        font-weight: 500;
    }

    .recording-label {
        font-size: $s-16px;
        font-weight: 400;
        text-transform: uppercase;
    }
}
</style>
