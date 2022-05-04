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
import AppContent from '@/components/layout/AppContent.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import AppNavigation from '@/components/layout/AppNavigation.vue';
import RecordingPane from '@/components/RecordingPane.vue';
import room from './room';

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
            settings: {},
        };
    },

    async mounted() {
        await this.getSettings();

        if (this.settings.hasJoinedRoom && this.settings.roomToken) {
            await this.joinRoom();
        }
    },

    methods: {
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
            await window.ipc.invoke('set-setting', {
                key,
                value,
            });
        },

        /**
         * Join room
         */
        async joinRoom() {
            const { status } = await room.join(this.settings.roomToken);

            if (status) {
                this.setSetting('roomToken', this.settings.roomToken);

                this.setSetting('hasJoinedRoom', true);
                this.$set(this.settings, 'hasJoinedRoom', true);

                this.setSetting('autoShareWithRoom', true);
                this.$set(this.settings, 'autoShareWithRoom', true);

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

            this.setSetting('hasJoinedRoom', false);
            this.$set(this.settings, 'hasJoinedRoom', false);

            this.setSetting('autoShareWithRoom', false);
            this.$set(this.settings, 'autoShareWithRoom', false);

            this.setSetting('roomToken', '');
            this.$set(this.settings, 'roomToken', '');
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
