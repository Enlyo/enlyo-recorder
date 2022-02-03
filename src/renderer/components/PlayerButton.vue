<template>
    <button
        class="player-button"
        :class="{
            'is-recording': isRecording,
        }"
        v-bind="$attrs"
    >
        <RecordIcon v-if="type === 'record'" :is-recording="isRecording" />
    </button>
</template>

<script>
import RecordIcon from './RecordIcon';

export default {
    name: 'PlayerButton',

    components: {
        RecordIcon,
    },

    props: {
        type: {
            type: String,
            required: true,
        },
        isRecording: {
            type: Boolean,
            required: false,
        },
    },
};
</script>

<style lang="scss" scoped>
.player-button {
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    background-color: $background-dark-2;
    color: $text-white;
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: none;
    outline: inherit;
    padding: 0;
    &.is-recording {
        background-color: $record-red;
        box-shadow: #fff 0px 0px 0px 0px, rgba($record-red, 0.2) 0px 0px 0px 4px,
            #000 0px 0px 0px 0px;
        &:hover {
            background-color: $record-red;
            box-shadow: #fff 0px 0px 0px 0px,
                rgba($record-red, 0.2) 0px 0px 0px 6px, #000 0px 0px 0px 0px;
            ::v-deep .record-button {
                background-color: $white;
            }
        }
    }
    &:hover {
        background-color: $background-dark-1;
        ::v-deep .record-button {
            background-color: rgba($record-red, 1);
        }
    }
    &:active {
        border: none;
        outline: none;
    }
}
</style>
