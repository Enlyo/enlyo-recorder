<template>
    <div class="general">
        <!-- CAPTURE SETTINGS -->
        <div class="capture-settings pt-0">
            <SectionHead title="Capture mode" />
            <SectionCard>
                <b-field label="Capture mode" :message="captureModeMessage">
                    <div class="">
                        <b-radio
                            v-model="tmpSettings.captureMode"
                            @input="setSetting('captureMode', 'screen')"
                            name="name"
                            native-value="screen"
                        >
                            Screen
                        </b-radio>
                        <b-radio
                            v-model="tmpSettings.captureMode"
                            @input="setSetting('captureMode', 'game')"
                            name="name"
                            native-value="game"
                        >
                            Game
                        </b-radio>
                    </div>
                </b-field>
            </SectionCard>
        </div>

        <!-- GENERAL SETTINGS -->
        <div class="general-settings mt-4 pt-0">
            <SectionHead title="Save" />

            <div class="columns is-mobile">
                <div class="column">
                    <SectionCard>
                        <b-field
                            label="Folder"
                            message="Where do you want to save your videos?"
                        >
                            <div class="select-folder">
                                <b-input
                                    v-model="tmpSettings.folder"
                                    class="selected-folder"
                                    expanded
                                    disabled
                                />
                                <b-button
                                    type="is-primary"
                                    @click="selectFolder"
                                >
                                    Select
                                </b-button>
                            </div>
                        </b-field>
                    </SectionCard>
                </div>
                <div class="column">
                    <SectionCard>
                        <b-field
                            label="Name"
                            message="How do you want to name your videos?"
                        >
                            <div class="select-name">
                                <b-input
                                    v-model="tmpSettings.name"
                                    class="selected-name"
                                    expanded
                                />
                                <b-button
                                    type="is-primary"
                                    :disabled="!validName"
                                    @click="setName"
                                >
                                    Set
                                </b-button>
                            </div>
                        </b-field>
                    </SectionCard>
                </div>
            </div>
        </div>

        <!-- POST RECORDING SETTINGS -->
        <div class="post-recording-settings mt-4">
            <SectionHead title="Post recording" />

            <SectionCard>
                <label class="label is-medium mb-2"> Action </label>
                <b-field
                    message="What do you want to do after the recording has finished?"
                >
                    <b-select
                        v-model="settings.actionAfterRecording"
                        expanded
                        @input="setSetting('actionAfterRecording', $event)"
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

import { mapGetters } from 'vuex';

export default {
    name: 'General',

    components: {
        SectionHead,
        SectionCard,
    },

    data() {
        return {
            tmpSettings: {},

            hasInstalledLibraryApp: false,
        };
    },

    computed: {
        validName() {
            return this.tmpSettings.name && this.tmpSettings.name.length > 0;
        },

        captureModeMessage() {
            if (this.tmpSettings.captureMode === 'screen') {
                return 'Record your whole screen (not only your game)';
            }
            return 'Record only the game window (might not work for some games)';
        },

        ...mapGetters({
            settings: 'settings/settings',
        }),
    },

    watch: {
        settings: {
            handler(newValue) {
                this.tmpSettings = JSON.parse(JSON.stringify(this.settings));

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

    mounted() {
        this.tmpSettings = JSON.parse(JSON.stringify(this.settings));
    },

    methods: {
        /**
         * Set setting
         */
        async setSetting(key, value) {
            await this.$store.dispatch('settings/setSetting', { key, value });
        },

        /**
         * Select folder
         */
        async selectFolder() {
            const { canceled, filePaths } = await window.ipc.invoke(
                'select-folder'
            );

            if (!canceled) {
                const folder = filePaths[0];
                await this.setSetting('folder', folder);
            }
        },

        /**
         * Set name
         */
        async setName() {
            await this.setSetting('name', this.tmpSettings.name);

            this.$buefy.toast.open({
                message: `Default name changed to ${this.tmpSettings.name}`,
                type: 'is-success',
                duration: 3000,
                position: 'is-bottom',
            });
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

.select-folder,
.select-name {
    width: 100%;
    display: flex;
    flex-direction: row;

    .selected-folder,
    .selected-name {
        flex-grow: 1;
        margin-right: 0.5rem;
    }
}
</style>
