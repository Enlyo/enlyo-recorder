<template>
    <div class="general">
        <div class="">
            <SectionHead title="Enlyo Library" class="pt-0" />

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

            <SectionCard class="mt-4">
                <label class="label is-medium mb-2">
                    Open library in app
                </label>
                <b-field>
                    <b-radio
                        v-model="settings.openLibraryIn"
                        @input="setSetting('openLibraryIn', $event)"
                        :disabled="!hasInstalledLibraryApp"
                        native-value="app"
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
                        @input="setSetting('openLibraryIn', $event)"
                        native-value="browser"
                    >
                        No, open in browser
                    </b-radio>
                </b-field>

                <transition name="fade">
                    <b-button
                        type="is-primary"
                        size="is-small"
                        v-if="settings.openLibraryIn === 'app'"
                        @click="testLibraryAppConnection"
                    >
                        Test connection
                    </b-button>
                </transition>

                <hr class="my-3" />

                <p v-if="hasInstalledLibraryApp" class="has-text-grey is-14px">
                    Problems opening the app?
                    <a
                        href="https://enlyo.helpscoutdocs.com"
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
                        href="https://enlyo.helpscoutdocs.com"
                        class="link"
                        target="_blank"
                    >
                        here
                    </a>
                    to get it
                </p>
            </SectionCard>
        </div>

        <div>
            <SectionHead title="Post recording" class="mt-4" />

            <SectionCard>
                <label class="label is-medium mb-2"> Action </label>
                <b-field
                    message="What do you want to do after the recording has finished?"
                >
                    <b-select
                        v-model="settings.actionAfterRecording"
                        @input="setSetting('actionAfterRecording', $event)"
                        expanded
                    >
                        <option value="none">No action</option>
                        <option value="open_folder">
                            Open recording folder
                        </option>
                        <option value="open_system_player">
                            Open recording in system player
                        </option>
                        <option
                            v-if="settings.autoAddToLibrary"
                            value="open_library"
                        >
                            Open recording in Enlyo library
                        </option>
                    </b-select>
                </b-field>
            </SectionCard>
        </div>
    </div>
</template>

<script>
import SectionHead from '@/components/SectionHead.vue';
import SectionCard from '@/components/SectionCard.vue';

export default {
    name: 'General',

    components: {
        SectionHead,
        SectionCard,
    },

    async mounted() {
        await this.getSettings();

        await this.getHasInstalledLibraryApp();

        if (!this.hasInstalledLibraryApp) {
            this.setSetting('openLibraryIn', 'browser');
        }
    },

    watch: {
        settings: {
            handler(newValue) {
                if (newValue.saveToEnlyo) {
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

    data() {
        return {
            settings: {
                actionAfterRecording: 'open_library',
                openLibraryIn: 'browser',
                autoAddToLibrary: false,
            },

            hasInstalledLibraryApp: true,
        };
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
