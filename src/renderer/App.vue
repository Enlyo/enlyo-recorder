<template>
    <div id="app">
        <AppLayout :class="{ 'is-recording': isRecording }">
            <AppNavigation v-if="!isRecording" />

            <AppContent v-if="!isRecording">
                <router-view />
            </AppContent>

            <AppFooter>
                <RecordingPane @setIsRecording="isRecording = $event" />
            </AppFooter>
        </AppLayout>
    </div>
</template>

<script>
import AppNavigation from '@/components/layout/AppNavigation.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import AppContent from '@/components/layout/AppContent.vue';
import RecordingPane from '@/components/RecordingPane.vue';

export default {
    components: {
        AppNavigation,
        AppFooter,
        AppLayout,
        AppContent,
        RecordingPane,
    },

    data() {
        return {
            isRecording: false,
        };
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
