<template>
    <div class="library">
        <!-- AUTO ADD -->
        <div class="auto-add">
            <SectionHead title="Auto add" class="pt-0" />

            <SectionCard>
                <label class="label is-medium mb-2"> Add recordings </label>
                <b-field
                    message="Do you want to automatically add new recordings to your Enlyo Library?"
                >
                    <b-radio
                        v-model="tmpSettings.autoAddToLibrary"
                        :native-value="true"
                        @input="setSetting('autoAddToLibrary', $event)"
                    >
                        Yes
                    </b-radio>
                    <b-radio
                        v-model="tmpSettings.autoAddToLibrary"
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
                        v-model="tmpSettings.openLibraryIn"
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
                        v-model="tmpSettings.openLibraryIn"
                        native-value="browser"
                        @input="setSetting('openLibraryIn', $event)"
                    >
                        No, open in browser
                    </b-radio>
                </b-field>

                <transition name="fade">
                    <b-button
                        v-if="tmpSettings.openLibraryIn === 'app'"
                        type="is-primary"
                        size="is-small"
                        @click="testLibraryAppConnection"
                    >
                        Test connection
                    </b-button>
                </transition>

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
                        <b-field label="Join room">
                            <div class="join-room">
                                <b-input
                                    v-model="tmpSettings.roomToken"
                                    class="joined-room"
                                    expanded
                                    :disabled="tmpSettings.hasJoinedRoom"
                                />
                                <b-button
                                    :type="
                                        tmpSettings.hasJoinedRoom
                                            ? 'is-danger'
                                            : 'is-primary'
                                    "
                                    :disabled="!canToggleRoom"
                                    @click="
                                        tmpSettings.hasJoinedRoom
                                            ? leaveRoom()
                                            : joinRoom()
                                    "
                                >
                                    {{
                                        tmpSettings.hasJoinedRoom
                                            ? 'Leave'
                                            : 'Join'
                                    }}
                                </b-button>
                            </div>
                        </b-field>
                        <transition name="fade">
                            <b-button
                                v-if="tmpSettings.hasJoinedRoom"
                                type="is-primary"
                                size="is-small"
                                @click="openSharingRoom"
                            >
                                Open sharing room
                            </b-button>
                        </transition>

                        <p
                            v-if="!tmpSettings.hasJoinedRoom"
                            class="has-text-grey is-14px"
                        >
                            Join a room to automatically share all your new
                            recordings
                        </p>
                    </SectionCard>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import room from '../room';

import SectionHead from '@/components/SectionHead.vue';
import SectionCard from '@/components/SectionCard.vue';

import { mapGetters } from 'vuex';

export default {
    name: 'Library',

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
        canToggleRoom() {
            if (this.tmpSettings.hasJoinedRoom) return true;

            return (
                this.tmpSettings.roomToken &&
                this.tmpSettings.roomToken.length > 0
            );
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

                const actionAfterRecording =
                    newValue.actionAfterRecording === 'open_library'
                        ? 'none'
                        : newValue.actionAfterRecording;
                this.setSetting('actionAfterRecording', actionAfterRecording);
            },
            deep: true,
            immediate: true,
        },
    },

    async mounted() {
        this.tmpSettings = JSON.parse(JSON.stringify(this.settings));

        await this.getHasInstalledLibraryApp();
        if (!this.hasInstalledLibraryApp) {
            this.setSetting('openLibraryIn', 'browser');
        }
    },

    methods: {
        /**
         * Set setting
         */
        async setSetting(key, value) {
            await this.$store.dispatch('settings/setSetting', { key, value });
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
         * Open sharing room
         */
        async openSharingRoom() {
            await window.ipc.invoke('open-sharing-room');
        },

        /**
         * Join room
         */
        async joinRoom() {
            const { status } = await room.join(this.tmpSettings.roomToken);

            if (status) {
                this.setSetting('roomToken', this.tmpSettings.roomToken);
                this.setSetting('hasJoinedRoom', true);
                this.setSetting('autoShareWithRoom', true);

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
            this.setSetting('autoShareWithRoom', false);
        },

        /**
         * Leave room
         */
        leaveRoom() {
            room.leave();

            this.setSetting('hasJoinedRoom', false);
            this.setSetting('autoShareWithRoom', false);

            this.$buefy.toast.open({
                message: 'Successfully left the room',
                type: 'is-success',
                duration: 3000,
                position: 'is-bottom',
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
