<template>
    <div class="record-control-button" :class="{ recording: isRecording }">
        <div class="record-button" />
    </div>
</template>

<script>
export default {
    name: 'RecordIcon',
    props: {
        isRecording: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style lang="scss" scoped>
.record-control-button {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s;
    .record-button {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: rgba($record-red, 0.8);
        transition: all 0.2s;
    }
    &.recording {
        .record-button {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            background-color: rgba($white, 1);
        }
        &:hover {
            .record-button {
                background-color: $white;
            }
        }
    }
    &:hover {
        border-color: rgba($white, 1);
        .record-button {
            background-color: rgba($record-red, 1);
        }
    }
}
</style>
