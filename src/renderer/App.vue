<template>
    <div id="app">
        <AppLayout :class="{ 'is-recording': isRecording }">
            <AppNavigation v-if="$route.path != '/login' && !isRecording" />

            <AppContent v-if="!isRecording">
                <router-view />
            </AppContent>

            <AppFooter v-if="$route.path != '/login'">
                <RecordingPane @setIsRecording="isRecording = $event" />
            </AppFooter>
        </AppLayout>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

import room from './room';

import AppContent from '@/components/layout/AppContent.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import RecordingPane from '@/components/RecordingPane.vue';

export default {
    components: {
        AppContent,
        AppFooter,
        AppLayout,
        AppNavigation,
        RecordingPane,
    },

    data() {
        return {
            isRecording: false,
        };
    },

    computed: {
        ...mapGetters({
            settings: 'settings/settings',
            isAuthenticated: 'auth/isAuthenticated',
        }),
    },

    async mounted() {
        await this.getSettings();

        this.initializeRecorder();

        // First time only, set a default folder
        if (!this.settings.folder) {
            this.setDefaultFolder();
        }
        // First time only, set a default name
        if (!this.settings.name) {
            this.setDefaultName();
        }
        // First time only, set a default screen
        if (!this.settings.screen || !this.settings.screen.name) {
            this.setDefaultScreen();
        }
        // First time only, set a default speaker
        if (!this.settings.speaker || !this.settings.speaker.name) {
            this.setDefaultSpeaker();
        }
        // First time only, set a default microphone
        if (!this.settings.microphone || !this.settings.microphone.name) {
            this.setDefaultMicrophone();
        }

        if (!this.isAuthenticated) {
            return;
        }
        await this.refreshCredentials();

        this.initializePusher();
        if (this.settings.hasJoinedRoom && this.settings.roomToken) {
            await this.joinRoom();
        }
    },

    methods: {
        /**
         * Refresh credentials
         */
        async refreshCredentials() {
            await this.$store.dispatch('auth/refresh');
            await this.$store.dispatch('auth/me');
        },

        /**
         * Initialize pusher
         */
        initializePusher() {
            let token = this.$store.getters['auth/tokens'].access;
            window.ipc.invoke('initialize-pusher', token);
        },

        /**
         * Join room
         */
        async joinRoom() {
            const { status } = await room.join(this.settings.roomToken);

            if (status) {
                await this.setSetting('roomToken', this.settings.roomToken);
                await this.setSetting('hasJoinedRoom', true);
                await this.setSetting('autoShareWithRoom', true);

                this.$buefy.toast.open({
                    message: 'Successfully joined the room',
                    type: 'is-success',
                    duration: 3000,
                    position: 'is-bottom',
                });

                return;
            }

            this.$buefy.toast.open({
                message:
                    'The room that you are trying to join does not exist (anymore)',
                type: 'is-danger',
                duration: 3000,
                position: 'is-bottom',
            });

            await this.setSetting('hasJoinedRoom', false);
            await this.setSetting('autoShareWithRoom', false);
            await this.setSetting('roomToken', '');
        },

        /**
         * Initialize recorder
         */
        initializeRecorder() {
            window.ipc.invoke('initialize-recorder');
        },

        /**
         * Get settings
         */
        async getSettings() {
            await this.$store.dispatch('settings/getSettings');
        },

        /**
         * Set setting
         */
        async setSetting(key, value) {
            await this.$store.dispatch('settings/setSetting', { key, value });
        },

        /**
         * Set default folder
         */
        async setDefaultFolder() {
            await this.$store.dispatch('settings/setDefaultFolder');
        },

        /**
         * Set default name
         */
        async setDefaultName() {
            await this.$store.dispatch('settings/setDefaultName');
        },

        /**
         * Set default screen
         */
        async setDefaultScreen() {
            await this.$store.dispatch('settings/setDefaultScreen');
        },

        /**
         * Set default speaker
         */
        async setDefaultSpeaker() {
            await this.$store.dispatch('settings/setDefaultSpeaker');
        },

        /**
         * Set default microphone
         */
        async setDefaultMicrophone() {
            await this.$store.dispatch('settings/setDefaultMicrophone');
        },
    },
};
</script>

<style lang="scss">
@import '@/assets/scss/app.scss';

.is-recording {
    .app-footer {
        height: 100%;
        justify-content: center;
    }
}
</style>
