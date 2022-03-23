<template>
    <div class="home">
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
    </div>
</template>

<script>
import SectionHead from '@/components/SectionHead.vue';
import SectionCard from '@/components/SectionCard.vue';

export default {
    name: 'Home',

    components: {
        SectionHead,
        SectionCard,
    },

    data() {
        return {
            settings: {
                screen: null,
                resolution: 1080,
                fps: 60,
            },

            availableScreens: [],
        };
    },

    async mounted() {
        await this.getSettings();
    },

    methods: {
        /* -------------------------------------------------------------------------- */
        /*                              SETUP AND DESTROY                             */
        /* -------------------------------------------------------------------------- */

        /**
         * Get available screens
         */
        async getAvailableScreens() {
            this.availableScreens = await window.ipc.invoke(
                'get-available-screens'
            );
        },

        /* -------------------------------------------------------------------------- */
        /*                              Settings                                      */
        /* -------------------------------------------------------------------------- */

        /**
         * Get settings
         */
        async getSettings() {
            this.settings = await window.ipc.invoke(
                'get-store-value',
                'settings'
            );

            // First time only, set a default screen
            if (!this.settings.screen.name) {
                await this.getAvailableScreens();

                const defaultScreen = this.availableScreens[0];
                this.settings.screen = defaultScreen;
                this.setSetting('screen', defaultScreen);

                return;
            }

            this.availableScreens = [this.settings.screen];
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

<style lang="scss" scoped>
.app-content {
    display: flex;
    flex-direction: column;
}
</style>
