<template>
    <div v-if="!isRecording" class="record-button-box" @click="toggleRecorder">
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
</template>

<script>
import Loader from '@/components/Loader.vue';
import RecordButton from '@/components/RecordButton.vue';

export default {
    name: 'RecordingPane',

    components: {
        Loader,
        RecordButton,
    },

    data() {
        return {
            isRecording: false,
            isLoading: false,
            recordTime: 0,
            timer: null,
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

    async mounted() {
        this.initializeRecorder();
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
         * Start process monitor
         */
        startProcessMonitor() {
            window.ipc.send('start-process-monitor');
        },

        /**
         * Stop process monitor
         */
        stopProcessMonitor() {
            window.ipc.send('stop-process-monitor');
        },

        /**
         * Set ipc listeners
         */
        setIpcListeners() {
            window.ipc.on('started-recorder', this.handleRecorderStarted);
            window.ipc.on('stopped-recorder', this.handleRecorderStopped);
            window.ipc.on('start-recorder-request', this.startRecorder);
            window.ipc.on('stop-recorder-request', this.stopRecorder);
        },

        /* -------------------------------------------------------------------------- */
        /*                                  RECORDING                                 */
        /* -------------------------------------------------------------------------- */

        /**
         * Set is recording
         */
        setIsRecording(bool) {
            this.isRecording = bool;
            this.$emit('setIsRecording', bool);
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
