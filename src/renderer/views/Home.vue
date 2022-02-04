<template>
    <AppLayout :class="{ 'is-recording': isRecording }">
        <AppHeader v-if="!isRecording" title="Enlyo" has-settings />

        <AppContent v-if="!isRecording">
            <transition name="bounce-in">
                <Notification
                    v-if="showSuccessMessage"
                    label="Recording saved"
                    type="is-success"
                    class="mb-4"
                    @close="setShowSuccessMessage(false)"
                />
            </transition>

            <div class="preview-box">
                <p class="box-label mb-3">Preview</p>
                <transition name="fade">
                    <video
                        v-show="showPreview"
                        ref="streamPreview"
                        class="stream-preview"
                    />
                </transition>
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
import Notification from '@/components/Notification.vue';

export default {
    name: 'Home',

    components: {
        AppLayout,
        AppHeader,
        AppContent,
        AppFooter,
        RecordButton,
        Loader,
        Notification,
    },

    data() {
        return {
            isRecording: false,
            isLoading: false,
            recordTime: 0,
            timer: null,

            showPreview: false,
            showSuccessMessage: false,
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

        this.startProcessMonitor();

        this.setIpcListeners();
    },

    beforeDestroy() {
        this.stopProcessMonitor();
        this.resetRecordTime();
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
            window.ipc.send('start-recorder-preview', {});
        },

        /**
         * Stop recorder preview
         */
        stopRecorderPreview() {
            window.ipc.send('stop-recorder-preview', {});
        },

        /**
         * Start process monitor
         */
        startProcessMonitor() {
            console.debug('start process monitor');
            window.ipc.send('start-process-monitor');
        },

        /**
         * Stop process monitor
         */
        stopProcessMonitor() {
            console.debug('stop process monitor');
            window.ipc.send('stop-process-monitor');
        },

        /**
         * Set ipc listeners
         */
        setIpcListeners() {
            window.ipc.on('started-recorder', this.handleRecorderStarted);
            window.ipc.on('stopped-recorder', this.handleRecorderStopped);
            window.ipc.on('started-recorder-preview', this.handlePreviewStream);
            window.ipc.on('start-recorder-request', this.startRecorder);
            window.ipc.on('stop-recorder-request', this.stopRecorder);
        },

        // TODO: Add on destroy logic -> (also record timer ect)

        /* -------------------------------------------------------------------------- */
        /*                                  PREVIEW                                 */
        /* -------------------------------------------------------------------------- */

        async handlePreviewStream(sources) {
            const constraints = {
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[0].id,
                    },
                },
            };

            // Create a Stream
            const stream = await navigator.mediaDevices.getUserMedia(
                constraints
            );

            const streamPreview = this.$refs.streamPreview;

            if (!streamPreview || !stream) {
                return;
            }

            streamPreview.srcObject = stream;
            streamPreview.play();

            this.showPreview = true;
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
            this.isRecording ? this.stopRecorder() : this.startRecorder();
        },

        /**
         * Dispatch start recorder ipc
         */
        startRecorder() {
            if (this.isRecording) return;
            window.ipc.send('start-recorder');
        },

        /**
         * Handle recorder started
         */
        handleRecorderStarted() {
            this.setIsRecording(true);
            this.startRecordTime();
        },

        /**
         * Dispatch stop recorder ipc
         */
        stopRecorder() {
            if (!this.isRecording) return;
            this.setIsLoading(true);
            window.ipc.send('stop-recorder');
        },

        /**
         * Handle recorder stopped
         */
        handleRecorderStopped() {
            this.setIsRecording(false);
            this.setIsLoading(false);
            this.resetRecordTime();

            this.$nextTick(() => {
                this.initializeRecorderPreview();
                setTimeout(() => this.setShowSuccessMessage(true), 1000);
            });
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

        /**
         * Set show success message
         */
        setShowSuccessMessage(bool) {
            this.showSuccessMessage = bool;
        },
    },
};
</script>

<style lang="scss" scoped>
.app-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.preview-box {
    padding: 1rem;
    background-color: $background-dark-4;
    border-radius: 8px;
    aspect-ratio: 16/10;
    box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.18),
        0px 0px 0px 1px rgba(0, 0, 0, 0.13);

    .box-label {
        text-transform: uppercase;
        font-weight: bold;
        font-size: $s-14px;
        color: $text-soft-white;
    }

    .stream-preview {
        aspect-ratio: 16/9;
        border-radius: 8px;
        overflow: hidden;
    }
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

.bounce-in-enter-active {
    animation: bounce-in 0.4s;
}
.bounce-in-leave-active {
    animation: bounce-leave 0.4s ease;
}

@keyframes bounce-in {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}
@keyframes bounce-leave {
    0% {
        transform: translateX(0);
    }
    100% {
        opacity: 0;
        transform: translateX(60px);
    }
}
</style>
