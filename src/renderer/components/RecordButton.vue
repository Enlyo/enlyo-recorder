<template>
    <div>
        <b-tooltip :label="recordLabel" position="is-bottom" type="is-dark">
            <PlayerButton
                :is-recording="isRecording"
                type="record"
                @click.native="handleRecordButtonClick"
            />
        </b-tooltip>
    </div>
</template>

<script>
import PlayerButton from "./PlayerButton";

export default {
    name: "RecordMomentButton",

    components: {
        PlayerButton,
    },

    props: {
        isRecording: {
            type: Boolean,
            required: true,
        },
    },

    computed: {
        recordLabel() {
            if (this.isRecording) {
                return "Stop recording";
            }
            return "Start recording";
        },
    },

    methods: {
        handleRecordButtonClick() {
            this.$emit("click");

            if (this.isRecording) {
                this.$emit("stop");
                return;
            }
            this.$emit("start");
        },
    },
};
</script>

<style lang="scss" scoped></style>
