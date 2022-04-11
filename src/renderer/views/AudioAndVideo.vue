<template>
    <div class="home">
        <!-- SCREEN SETTINGS -->
        <div class="screen-settings">
            <SectionHead title="Screen" class="pt-0" />

            <SectionCard>
                <b-field label="Screen">
                    <b-select
                        v-model="settings.screen"
                        expanded
                        @input="setSetting('screen', $event)"
                        @focus="getAvailableScreens"
                    >
                        <option
                            v-for="screen in availableScreens"
                            :key="screen.name"
                            :value="screen"
                        >
                            {{ screen.name }}
                        </option>
                    </b-select>
                </b-field>
            </SectionCard>
        </div>

        <!-- VIDEO QUALITY SETTINGS -->
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
                                <option :value="480">480</option>
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

        <!-- AUDIO INPUT SETTINGS -->
        <div class="audio-input-settings mt-4">
            <SectionHead title="Audio devices" />

            <div class="columns is-mobile">
                <div class="column">
                    <SectionCard>
                        <b-field label="Input device">
                            <b-select
                                v-model="settings.microphone"
                                expanded
                                @input="setSetting('microphone', $event)"
                                @focus="getAvailableMicrophones"
                            >
                                <option
                                    v-for="microphone in availableMicrophones"
                                    :key="microphone.name"
                                    :value="microphone"
                                >
                                    {{ microphone.name }}
                                </option>
                            </b-select>
                        </b-field>

                        <b-field>
                            <b-slider
                                v-model="settings.microphoneVolume"
                                size="is-small"
                                :min="0"
                                :max="1"
                                :step="0.01"
                                @input="setSetting('microphoneVolume', $event)"
                            >
                            </b-slider>
                        </b-field>
                    </SectionCard>
                </div>
                <div class="column">
                    <SectionCard>
                        <b-field label="Output device">
                            <b-select
                                v-model="settings.speaker"
                                expanded
                                @input="setSetting('speaker', $event)"
                                @focus="getAvailableSpeakers"
                            >
                                <option
                                    v-for="speaker in availableSpeakers"
                                    :key="speaker.name"
                                    :value="speaker"
                                >
                                    {{ speaker.name }}
                                </option>
                            </b-select>
                        </b-field>

                        <b-field>
                            <b-slider
                                v-model="settings.speakerVolume"
                                size="is-small"
                                :min="0"
                                :max="1"
                                :step="0.01"
                                @input="setSetting('speakerVolume', $event)"
                            >
                            </b-slider>
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
    name: 'AudioAndVideo',

    components: {
        SectionHead,
        SectionCard,
    },

    data() {
        return {
            settings: {},

            availableScreens: [],
            availableSpeakers: [],
            availableMicrophones: [],
        };
    },

    async mounted() {
        await this.getSettings();
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

            await this.getAvailableScreens();
            await this.getAvailableSpeakers();
            await this.getAvailableMicrophones();
        },

        /**
         * Set default screen
         */
        async setDefaultScreen() {
            const defaultScreen = this.availableScreens[0];
            this.settings.screen = defaultScreen;
            this.setSetting('screen', defaultScreen);

            return;
        },

        /**
         * Set default speaker
         */
        async setDefaultSpeaker() {
            const defaultSpeaker = this.availableSpeakers[0];
            this.settings.speaker = defaultSpeaker;
            this.setSetting('speaker', defaultSpeaker);

            return;
        },

        /**
         * Set default microphone
         */
        async setDefaultMicrophone() {
            const defaultMicrophone = this.availableMicrophones[0];
            this.settings.microphone = defaultMicrophone;
            this.setSetting('microphone', defaultMicrophone);

            return;
        },

        /**
         * Get available screens
         */
        async getAvailableScreens() {
            this.availableScreens = await window.ipc.invoke(
                'get-available-screens'
            );
        },

        /**
         * Get available speakers
         */
        async getAvailableSpeakers() {
            this.availableSpeakers = await window.ipc.invoke(
                'get-available-speakers'
            );
        },

        /**
         * Get available microphones
         */
        async getAvailableMicrophones() {
            this.availableMicrophones = await window.ipc.invoke(
                'get-available-microphones'
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
    },
};
</script>

<style lang="scss" scoped></style>
