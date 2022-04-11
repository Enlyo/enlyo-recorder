<template>
    <div class="avatar" :class="size">
        <div v-if="avatar" class="custom-avatar">
            <b-image :src="avatar" :rounded="true"></b-image>
        </div>
        <div v-else-if="name" class="default-avatar" :class="color">
            {{ name[0].toUpperCase() }}
        </div>
    </div>
</template>

<script>
export default {
    name: 'EnAvatar',

    props: {
        avatar: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: 'purple',
        },
        size: {
            type: String,
            default: 'is-normal',
        },
    },
};
</script>

<style lang="scss" scoped>
.avatar {
    height: 48px;
    width: 48px;
    line-height: 48px;
    color: white;
    text-align: center;
    font-size: 1.5em;
    user-select: none;

    &.is-small {
        height: 38px;
        width: 38px;
        line-height: 38px;
        font-size: 1.125em;
    }

    .custom-avatar {
        border-radius: 50%;
        background-color: transparent;
    }

    .default-avatar {
        border-radius: 50%;

        &.purple {
            background-color: $highlight-purple;
        }

        &.green {
            background-color: $highlight-green;
        }

        &.orange {
            background-color: $highlight-orange;
        }

        &.red {
            background-color: $highlight-red;
        }

        &.yellow {
            background-color: $highlight-yellow;
        }

        &.white {
            background-color: $text-white;
            color: $background-dark-2;
        }
    }

    &.is-smallest {
        height: 30px;
        width: 30px;
        line-height: 30px;
        font-size: 1.125em;
    }
}
</style>
