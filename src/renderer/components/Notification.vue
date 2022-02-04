<template>
    <div class="notification" :class="type">
        <CheckCircleIcon v-if="type === 'is-success'" />
        <span v-if="label" class="notification-label" v-text="label" />

        <div class="close-button" @click="$emit('close')">
            <CloseIcon />
        </div>
    </div>
</template>

<script>
import CheckCircleIcon from '@/components/icons/CheckCircleIcon.vue';
import CloseIcon from '@/components/icons/CloseIcon.vue';

export default {
    name: 'Notification',

    components: {
        CheckCircleIcon,
        CloseIcon,
    },

    props: {
        type: {
            type: String,
            default: 'is-success',
        },
        label: {
            type: String,
            default: '',
        },
        isCloseable: {
            type: Boolean,
            default: true,
        },
    },
};
</script>

<style lang="scss" scoped>
.notification {
    --icon-color: #fff;

    padding: 0.75rem;
    display: flex;
    align-items: center;
    position: relative;

    border-radius: 8px;
    background-color: $background-dark-4;
    box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.18),
        0px 0px 0px 1px rgba(0, 0, 0, 0.13);

    &.is-success {
        --icon-color: #{$highlight-green};
    }

    svg {
        color: var(--icon-color);
    }

    .notification-label {
        font-weight: 500;
        color: $text-white;
        font-size: $s-14px;
        margin-left: 1rem;
        flex: 1;
    }

    .close-button {
        position: absolute;
        right: 0.75rem;
        cursor: pointer;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        .close {
            width: 10px;
            height: 10px;
            color: $text-grey;
        }
    }
}
</style>
