<template>
    <AppLayout :class="{ 'is-recording': isRecording }">
        <AppHeader v-if="!isRecording" title="Enlyo" />

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

            <div class="screen-settings">
                <SectionHead title="Screen" />

                <SectionCard>
                    <b-field label="Screen">
                        <b-select
                            v-model="settings.defaultScreen"
                            expanded
                            @input="setSetting('defaultScreen', $event)"
                        >
                            <option
                                v-for="screen in availableScreens"
                                :key="screen.name"
                                :value="screen.name"
                            >
                                {{ screen.name }}
                            </option>
                        </b-select>
                    </b-field>
                </SectionCard>
            </div>

            <div class="video-quality-settings mt-4">
                <SectionHead title="Video quality" />

                <div class="columns is-mobile">
                    <div class="column">
                        <SectionCard>
                            <b-field label="Resolution">
                                <b-select
                                    v-model="settings.resolution"
                                    expanded
                                    @input="setSetting('resolution', $event)"
                                >
                                    <option :value="720">720</option>
                                    <option :value="1080">1080</option>
                                </b-select>
                            </b-field>
                        </SectionCard>
                    </div>
                    <div class="column">
                        <SectionCard>
                            <b-field label="Frame rate">
                                <b-select
                                    v-model="settings.fps"
                                    expanded
                                    @input="setSetting('fps', $event)"
                                >
                                    <option :value="30">30 fps</option>
                                    <option :value="60">60 fps</option>
                                </b-select>
                            </b-field>
                        </SectionCard>
                    </div>
                </div>
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
import SectionHead from '@/components/SectionHead.vue';
import SectionCard from '@/components/SectionCard.vue';

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
        SectionHead,
        SectionCard,
    },

    data() {
        return {
            isRecording: false,
            isLoading: false,
            recordTime: 0,
            timer: null,

            showSuccessMessage: false,

            settings: {
                defaultScreen: '',
                resolution: 1080,
                fps: 60,
            },
            availableScreens: [],
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

    created() {
        this.getSettings();
        this.getAvailableScreens();
    },

    mounted() {
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

        /**
         * Get available screens
         */
        async getAvailableScreens() {
            this.availableScreens = await window.ipc.invoke(
                'get-available-screens'
            );
        },

        /* -------------------------------------------------------------------------- */
        /*                              Settings                                      */
        /* -------------------------------------------------------------------------- */

        /**
         * Get settings
         */
        async getSettings() {
            this.settings = await window.ipc.invoke(
                'get-store-value',
                'settings'
            );
        },

        /**
         * Set setting
         */
        async setSetting(key, value) {
            await window.ipc.invoke('set-store-value', {
                key: `settings.${key}`,
                value,
            });
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
