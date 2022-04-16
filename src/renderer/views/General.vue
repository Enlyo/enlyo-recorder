<template>
    <div class="general">
        <!-- GENERAL SETTINGS -->
        <div class="general-settings pt-0">
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
                                    v-model="settings.folder"
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
                            message="How do you want to name your videos (we will add a date stamp)?"
                        >
                            <div class="select-name">
                                <b-input
                                    v-model="settings.name"
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

export default {
    name: 'General',

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

    computed: {
        validName() {
            return this.settings.name && this.settings.name.length > 0;
        },
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

        if (!this.settings.folder) {
            this.setDefaultFolder();
        }

        if (!this.settings.name) {
            this.setDefaultName();
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
         * Select folder
         */
        async selectFolder() {
            const { canceled, filePaths } = await window.ipc.invoke(
                'select-folder'
            );
            if (!canceled) {
                this.$set(this.settings, 'folder', filePaths[0]);

                this.setSetting('folder', this.settings.folder);
            }
        },

        /**
         * Set default folder
         */
        async setDefaultFolder() {
            const folder = await window.ipc.invoke('set-default-folder');
            this.$set(this.settings, 'folder', folder);
        },

        /**
         * Set name
         */
        setName() {
            this.setSetting('name', this.settings.name);
        },

        /**
         * Set default name
         */
        setDefaultName() {
            const DEFAULT_NAME = 'enlyo-recording';
            this.setSetting('name', DEFAULT_NAME);
            this.$set(this.settings, 'name', DEFAULT_NAME);
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
