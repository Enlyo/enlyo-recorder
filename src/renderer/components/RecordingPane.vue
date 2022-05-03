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
import { mapGetters } from 'vuex';

import api from '@/api';

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
            isLoading: false,
            isRecording: false,
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

        ...mapGetters({
            user: 'auth/user',
        }),
    },

    async mounted() {
        this.initializeRecorder();
        this.startProcessMonitor();
        this.setIpcListeners();
    },

    beforeDestroy() {
        this.stopProcessMonitor();
        this.stopRecordTimer();
    },

    methods: {
        /* -------------------------------------------------------------------------- */
        /*                              SETUP AND DESTROY                             */
        /* -------------------------------------------------------------------------- */

        /**
         * Set ipc listeners
         */
        setIpcListeners() {
            window.ipc.on('start-recorder-request', this.startRecorder);
            window.ipc.on('stop-recorder-request', this.stopRecorder);
        },

        /* -------------------------------------------------------------------------- */
        /*                                  RECORDING                                 */
        /* -------------------------------------------------------------------------- */

        /**
         * Initialize recorder
         */
        initializeRecorder() {
            window.ipc.invoke('initialize-recorder');
        },

        /**
         * Toggle recorder
         */
        toggleRecorder() {
            this.isRecording ? this.stopRecorder() : this.startRecorder();
        },

        /**
         * Start recorder
         */
        async startRecorder() {
            if (this.isRecording) return;

            await window.ipc.invoke('start-recorder');

            this.setIsRecording(true);
            this.startRecordTimer();
        },

        /**
         * Set is recording
         */
        setIsRecording(bool) {
            this.isRecording = bool;
            this.$emit('setIsRecording', bool);
        },

        /**
         * Start record time
         */
        startRecordTimer() {
            this.timer = setInterval(() => this.recordTime++, 1000);
        },

        /**
         * Stop recorder
         */
        async stopRecorder() {
            if (!this.isRecording) return;

            this.setIsLoading(true);
            let recording = await window.ipc.invoke('stop-recorder');

            const autoAddToLibrary = await this.getSetting('autoAddToLibrary');
            if (autoAddToLibrary) {
                recording = await this.addToLibrary(recording);
            }

            const actionAfterRecording = await this.getSetting(
                'actionAfterRecording'
            );
            if (actionAfterRecording === 'open_folder') {
                await this.openRecordingFolder(recording);
            }
            if (actionAfterRecording === 'open_system_player') {
                await this.openSystemPlayer(recording);
            }
            if (actionAfterRecording === 'open_library') {
                await this.openLibraryVideo(recording);
            }

            this.setIsRecording(false);
            this.setIsLoading(false);
            this.stopRecordTimer();
        },

        /**
         * Set is loading
         */
        setIsLoading(bool) {
            this.isLoading = bool;
        },

        /**
         * Reset record time
         */
        stopRecordTimer() {
            clearInterval(this.timer);
            this.recordTime = 0;
            this.timer = null;
        },

        /* -------------------------------------------------------------------------- */
        /*                               PROCESS MONITOR                              */
        /* -------------------------------------------------------------------------- */

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

        /* -------------------------------------------------------------------------- */
        /*                                   LIBRARY                                  */
        /* -------------------------------------------------------------------------- */

        /**
         * Add to library
         */
        async addToLibrary(recording) {
            const personalChannel = this.user.channels.find(
                (channel) => channel.type === 'personal'
            );

            // TODO: required because expired token gives a 503 error
            // when a thumbnail is sent
            let refreshResponse = await this.$store.dispatch('auth/refresh');
            if (!refreshResponse.status) {
                this.$buefy.toast.open({
                    duration: 3000,
                    message: `Something went wrong while adding the recording to the library... Don't worry, it is still saved locally`,
                    type: 'is-danger',
                });

                this.setIsRecording(false);
                this.setIsLoading(false);
                this.stopRecordTimer();

                this.$router.push('/login');
                return;
            }

            const response = await api.video.create(personalChannel.slug, {
                duration: recording.duration,
                end_time: recording.duration,
                source: 'local',
                start_time: 0,
                title: this.removeExtension(recording.name),
                tag_strings: [],
                custom_thumbnail: recording.thumbnail,
                filename: recording.name,
                filesize: recording.size,
            });

            if (response.status) {
                recording.id = response.data.id;
                return recording;
            }

            this.$buefy.toast.open({
                duration: 3000,
                message: `Something went wrong while adding the recording to the library... Don't worry, it is still saved locally`,
                type: 'is-danger',
            });
            return recording;
        },

        /**
         * Open library video
         */
        async openLibraryVideo(recording) {
            if (!recording.id) return;

            return await window.ipc.invoke('open-library-video', recording);
        },

        /* -------------------------------------------------------------------------- */
        /*                                    OTHER                                   */
        /* -------------------------------------------------------------------------- */

        /**
         * Get setting
         */
        async getSetting(key) {
            return await window.ipc.invoke('get-setting', key);
        },

        /**
         * Open recording folder
         */
        async openRecordingFolder(recording) {
            return await window.ipc.invoke('open-recording-folder', recording);
        },

        /**
         * Open system player
         */
        async openSystemPlayer(recording) {
            return await window.ipc.invoke('open-system-player', recording);
        },

        /**
         * Remove extension from filename
         */
        removeExtension(file) {
            return file.substr(0, file.lastIndexOf('.')) || file;
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
