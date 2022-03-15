<template>
    <div class="app-header">
        <div class="left">
            <router-link :to="'/'">
                <EnlyoIcon />
            </router-link>
        </div>
        <div class="center">
            <h1 v-if="title" class="title" v-text="title" />
            <slot name="center" />
        </div>
        <div v-if="$slots.right || hasSettings" class="right">
            <template v-if="$slots.right">
                <slot name="right" />
            </template>
            <template v-if="hasSettings">
                <router-link :to="'/settings'">
                    <SettingsCircleIcon />
                </router-link>
            </template>
        </div>
    </div>
</template>

<script>
import EnlyoIcon from '@/components/icons/EnlyoIcon.vue';
import SettingsCircleIcon from '@/components/icons/SettingsCircleIcon.vue';

export default {
    name: 'AppHeader',

    components: {
        EnlyoIcon,
        SettingsCircleIcon,
    },

    props: {
        title: {
            type: String,
            default: '',
        },
        hasSettings: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style lang="scss" scoped>
.app-header {
    -webkit-app-region: drag;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80px;
    background-color: $background-dark-5;
    border-bottom: 1px solid $line-grey;

    .left {
        padding-left: 1.5rem;
        align-items: center;
        justify-content: flex-start;
    }

    .center {
        flex: 1;
    }

    .right {
        align-items: center;
        justify-content: flex-end;
        padding-right: 1.5rem;
    }

    .title {
        color: $white;
        font-size: 20px;
        margin-left: 1rem;
    }
}
</style>
