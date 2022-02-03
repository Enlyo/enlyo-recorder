<template>
    <button
        class="record-button"
        :class="{
            'is-recording': isRecording,
            'is-large': size === 'is-large',
        }"
        @click="handleClick"
    >
        <span class="record-icon" />
    </button>
</template>

<script>
export default {
    name: 'RecordButton',

    props: {
        isRecording: {
            type: Boolean,
            required: true,
        },
        size: {
            type: String,
            default: 'is-small',
        },
    },

    methods: {
        handleClick() {
            this.$emit('click');

            if (this.isRecording) {
                this.$emit('stop');
                return;
            }
            this.$emit('start');
        },
    },
};
</script>

<style lang="scss" scoped>
.record-button {
    // Button
    --rec-btn-width: 3rem;
    --rec-btn-height: 3rem;
    --rec-btn-background-color: #{$background-dark-2};
    --rec-btn-box-shadow: unset;

    // Icon
    --rec-icon-width: 18px;
    --rec-icon-height: 18px;
    --rec-icon-border-radius: 50%;
    --rec-icon-background-color: rgba(var(--record-red), 0.8);

    // Hover
    &:hover {
        --rec-btn-background-color: #{$background-dark-1};
        --rec-icon-background-color: rgba(var(--record-red), 1);
    }

    // Large state
    &.is-large {
        --rec-btn-width: 7rem;
        --rec-btn-height: 7rem;
        --rec-icon-width: 36px;
        --rec-icon-height: 36px;

        // Recording state for large button
        &.is-recording {
            // Button
            --rec-btn-box-shadow: unset;
            animation: pulse 1.5s linear infinite;

            // Icon
            --rec-icon-width: 34px;
            --rec-icon-height: 34px;
            --rec-icon-border-radius: 6px;

            &:hover {
                --rec-btn-box-shadow: #fff 0px 0px 0px 0px,
                    rgba(var(--record-red), 0.2) 0px 0px 0px 10px,
                    #000 0px 0px 0px 0px;
            }
        }
    }

    // Recording state
    &.is-recording {
        // Button
        --rec-btn-background-color: rgba(var(--record-red), 1);
        --rec-btn-box-shadow: #fff 0px 0px 0px 0px,
            rgba(var(--record-red), 0.2) 0px 0px 0px 4px, #000 0px 0px 0px 0px;

        &:hover {
            --rec-btn-box-shadow: #fff 0px 0px 0px 0px,
                rgba(var(--record-red), 0.2) 0px 0px 0px 6px,
                #000 0px 0px 0px 0px;

            --rec-icon-background-color: rgba(var(--white), 1);
        }

        // Icon
        --rec-icon-border-radius: 3px;
        --rec-icon-background-color: rgba(var(--white), 1);
    }

    // Button
    border-radius: 50%;
    width: var(--rec-btn-width);
    height: var(--rec-btn-height);
    background-color: var(--rec-btn-background-color);
    box-shadow: var(--rec-btn-box-shadow);
    transition: all 0.2s;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: none;
    outline: inherit;
    padding: 0;

    // Icon
    .record-icon {
        width: var(--rec-icon-width);
        height: var(--rec-icon-height);
        border-radius: var(--rec-icon-border-radius);
        background-color: var(--rec-icon-background-color);
        transition: all 0.2s;
    }

    &:active {
        border: none;
        outline: none;
    }
}

// Animation
@keyframes pulse {
    0% {
        box-shadow: 0 4px 10px rgba(var(--record-red), 0.1),
            0 0 0 0 rgba(var(--record-red), 0.1),
            0 0 0 5px rgba(var(--record-red), 0.1),
            0 0 0 10px rgba(var(--record-red), 0.1);
    }
    100% {
        box-shadow: 0 4px 10px rgba(var(--record-red), 0.1),
            0 0 0 5px rgba(var(--record-red), 0.1),
            0 0 0 10px rgba(var(--record-red), 0.1),
            0 0 0 30px rgba(var(--record-red), 0);
    }
}
</style>
