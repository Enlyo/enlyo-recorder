<template>
    <div class="library">
        <div class="">
            <SectionHead title="Auto add" class="pt-0" />

            <SectionCard>
                <label class="label is-medium mb-2">
                    Add recording to library
                </label>
                <b-field
                    message="Do you want to automatically add new recordings to the Enlyo library?"
                >
                    <b-radio
                        v-model="settings.autoAddToLibrary"
                        :native-value="true"
                        @input="setSetting('autoAddToLibrary', $event)"
                    >
                        Yes
                    </b-radio>
                    <b-radio
                        v-model="settings.autoAddToLibrary"
                        class="ml-2"
                        :native-value="false"
                        @input="setSetting('autoAddToLibrary', $event)"
                    >
                        No
                    </b-radio>
                </b-field>
            </SectionCard>

            <SectionHead title="Open behavior" class="mt-4" />

            <SectionCard class="mt-4">
                <label class="label is-medium mb-2">
                    Open library in app
                </label>
                <b-field>
                    <b-radio
                        v-model="settings.openLibraryIn"
                        :disabled="!hasInstalledLibraryApp"
                        native-value="app"
                        @input="setSetting('openLibraryIn', $event)"
                    >
                        Yes
                        <span v-if="!hasInstalledLibraryApp">
                            (not installed)
                        </span>
                    </b-radio>
                </b-field>
                <b-field>
                    <b-radio
                        v-model="settings.openLibraryIn"
                        native-value="browser"
                        @input="setSetting('openLibraryIn', $event)"
                    >
                        No, open in browser
                    </b-radio>
                </b-field>

                <transition name="fade">
                    <b-button
                        v-if="settings.openLibraryIn === 'app'"
                        type="is-primary"
                        size="is-small"
                        @click="testLibraryAppConnection"
                    >
                        Test connection
                    </b-button>
                </transition>

                <hr class="my-3" />

                <p v-if="hasInstalledLibraryApp" class="has-text-grey is-14px">
                    Problems opening the app?
                    <a
                        href="https://discord.gg/C95AyZz9yu"
                        class="link"
                        target="_blank"
                    >
                        Contact us</a
                    >
                    or check out our
                    <a
                        href="https://enlyo.helpscoutdocs.com"
                        class="link"
                        target="_blank"
                    >
                        Helpcenter</a
                    >
                </p>

                <p v-else class="has-text-grey is-14px">
                    Life is better with the Enlyo Library app! Click
                    <a
                        href="https://app.enlyo.com/install"
                        class="link"
                        target="_blank"
                    >
                        here
                    </a>
                    to get it
                </p>
            </SectionCard>
        </div>
    </div>
</template>

<script>
import SectionHead from '@/components/SectionHead.vue';
import SectionCard from '@/components/SectionCard.vue';

export default {
    name: 'Library',

    components: {
        SectionHead,
        SectionCard,
    },

    data() {
        return {
            settings: {},

            hasInstalledLibraryApp: false,
        };
    },

    watch: {
        settings: {
            handler(newValue) {
                if (newValue.autoAddToLibrary) {
                    return;
                }

                this.settings.actionAfterRecording =
                    newValue.actionAfterRecording === 'open_library'
                        ? 'none'
                        : newValue.actionAfterRecording;
            },
            deep: true,
            immediate: true,
        },
    },

    async mounted() {
        await this.getSettings();

        await this.getHasInstalledLibraryApp();

        if (!this.hasInstalledLibraryApp) {
            this.setSetting('openLibraryIn', 'browser');
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
         * Get has installed library app
         */
        async getHasInstalledLibraryApp() {
            this.hasInstalledLibraryApp = await window.ipc.invoke(
                'get-has-installed-library-app'
            );
        },

        /**
         * Test library app connection
         */
        async testLibraryAppConnection() {
            await window.ipc.invoke('test-library-app-connection');
        },
    },
};
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>
