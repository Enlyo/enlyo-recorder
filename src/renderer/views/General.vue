<template>
    <div class="general">
        <div>
            <SectionHead title="After recording" class="pt-0" />

            <SectionCard>
                <b-field label="Action after finished recording">
                    <b-select v-model="settings.actionAfterRecording" expanded>
                        <option value="none">None</option>
                        <option value="open_folder">
                            Open recordings folder
                        </option>
                        <option value="open_system_player">
                            Open system player
                        </option>
                        <option value="open_enlyo">Open Enlyo player</option>
                    </b-select>
                </b-field>
            </SectionCard>
        </div>

        <div class="mt-4">
            <SectionHead title="Enlyo Library" />

            <SectionCard>
                <label class="label is-medium mb-2">
                    Open Enlyo Library in desktop app
                </label>
                <b-field>
                    <b-radio
                        v-model="settings.openEnlyoIn"
                        :disabled="!hasEnlyoAppInstalled"
                        native-value="app"
                    >
                        Yes
                        <span v-if="!hasEnlyoAppInstalled">
                            (not installed)
                        </span>
                    </b-radio>
                </b-field>
                <b-field>
                    <b-radio
                        v-model="settings.openEnlyoIn"
                        native-value="browser"
                    >
                        No, open in browser
                    </b-radio>
                </b-field>

                <p class="has-text-grey is-14px">
                    <a
                        href="https://enlyo.helpscoutdocs.com"
                        class="link"
                        target="_blank"
                    >
                        Click here
                    </a>
                    to test if opening works correctly
                </p>

                <hr class="my-3" />

                <p class="has-text-grey is-14px">
                    Problems opening Enlyo?
                    <a
                        href="https://enlyo.helpscoutdocs.com"
                        class="link"
                        target="_blank"
                    >
                        Contact us</a
                    >
                    or check our
                    <a
                        href="https://enlyo.helpscoutdocs.com"
                        class="link"
                        target="_blank"
                    >
                        Helpcenter</a
                    >.
                </p>
            </SectionCard>

            <SectionCard class="mt-4">
                <label class="label is-medium mb-2">
                    Auto save to Enlyo Library
                </label>
                <b-field
                    message="Automatically save recordings to your Enlyo library"
                >
                    <b-radio
                        v-model="settings.saveToEnlyo"
                        :native-value="true"
                    >
                        Auto save on
                    </b-radio>
                    <b-radio
                        v-model="settings.saveToEnlyo"
                        class="ml-2"
                        :native-value="false"
                    >
                        Auto save off
                    </b-radio>
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
            settings: {
                actionAfterRecording: 'none',
                openEnlyoIn: 'browser',
                saveToEnlyo: false,
            },

            hasEnlyoAppInstalled: true,
        };
    },
};
</script>

<style lang="scss" scoped></style>
