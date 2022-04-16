<template>
    <div class="library">
        <!-- AUTO ADD -->
        <div class="auto-add">
            <SectionHead title="Auto add" class="pt-0" />

            <SectionCard>
                <label class="label is-medium mb-2"> Add recordings </label>
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
        </div>

        <!-- OPEN BEHAVIOR -->
        <div class="open-behavior">
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

        <!-- SHARING ROOM -->
        <div class="sharing-room mt-5">
            <SectionHead title="Sharing room" />

            <div class="columns is-mobile">
                <div class="column">
                    <SectionCard>
                        <b-field
                            label="Join room"
                            :message="
                                settings.hasJoinedRoom
                                    ? 'Want to leave the room? Simply press leave'
                                    : 'Want to join a room? Enter the room token and press join'
                            "
                        >
                            <div class="join-room">
                                <b-input
                                    v-model="settings.roomToken"
                                    class="joined-room"
                                    expanded
                                    :disabled="settings.hasJoinedRoom"
                                />
                                <b-button
                                    :type="
                                        settings.hasJoinedRoom
                                            ? 'is-danger'
                                            : 'is-primary'
                                    "
                                    :disabled="!canToggleRoom"
                                    @click="
                                        settings.hasJoinedRoom
                                            ? leaveRoom()
                                            : joinRoom()
                                    "
                                >
                                    {{
                                        settings.hasJoinedRoom
                                            ? 'Leave'
                                            : 'Join'
                                    }}
                                </b-button>
                            </div>
                        </b-field>
                    </SectionCard>
                </div>
                <div class="column">
                    <SectionCard>
                        <b-field
                            label="Share recordings"
                            :message="
                                settings.hasJoinedRoom
                                    ? 'Do you want to automatically share recordings with the room?'
                                    : 'You first need to join a room before you are able to share recordings'
                            "
                        >
                            <div class="radio-wrapper">
                                <b-radio
                                    v-model="settings.autoShareWithRoom"
                                    name="autoshare"
                                    :native-value="true"
                                    :disabled="!settings.hasJoinedRoom"
                                >
                                    Yes
                                </b-radio>
                                <b-radio
                                    v-model="settings.autoShareWithRoom"
                                    class="ml-4"
                                    name="autoshare"
                                    :native-value="false"
                                    :disabled="!settings.hasJoinedRoom"
                                >
                                    No
                                </b-radio>
                            </div>
                        </b-field>
                    </SectionCard>
                </div>
            </div>
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

    computed: {
        canToggleRoom() {
            if (this.settings.hasJoinedRoom) return true;

            return (
                this.settings.roomToken && this.settings.roomToken.length > 0
            );
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

        /**
         * Join room
         */
        joinRoom() {
            this.setSetting('roomToken', this.settings.roomToken);

            this.setSetting('hasJoinedRoom', true);
            this.$set(this.settings, 'hasJoinedRoom', true);

            this.setSetting('autoShareWithRoom', true);
            this.$set(this.settings, 'autoShareWithRoom', true);

            this.$buefy.toast.open({
                message: 'Successfully joined the room',
                type: 'is-primary',
                duration: 1000,
            });
        },

        /**
         * Leave room
         */
        leaveRoom() {
            this.setSetting('hasJoinedRoom', false);
            this.$set(this.settings, 'hasJoinedRoom', false);

            this.setSetting('autoShareWithRoom', false);
            this.$set(this.settings, 'autoShareWithRoom', false);

            this.$buefy.toast.open({
                message: 'Left the room',
                type: 'is-primary',
                duration: 1000,
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.join-room {
    width: 100%;
    display: flex;
    flex-direction: row;

    .joined-room {
        flex-grow: 1;
        margin-right: 0.5rem;
    }
}

.radio-wrapper {
    height: 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>
