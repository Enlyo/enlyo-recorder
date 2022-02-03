<template>
    <div class="app-header">
        <div class="left">
            <EnlyoIcon />
        </div>
        <div class="center">
            <h1 v-if="title" class="title" v-text="title" />
            <slot name="center" />
        </div>
        <div v-if="$slots.right" class="right">
            <slot name="right" />
        </div>
    </div>
</template>

<script>
import EnlyoIcon from '@/components/EnlyoIcon.vue';

export default {
    name: 'AppHeader',

    components: {
        EnlyoIcon,
    },

    props: {
        title: {
            type: String,
            default: '',
        },
    },
};
</script>

<style lang="scss" scoped>
.app-header {
    display: flex;
    align-items: center;
    height: 80px;
    background-color: $background-dark-5;
    border-bottom: 1px solid $line-grey;

    .left {
        padding-left: 1.5rem;
    }
    .center {
        // padding: 1.5rem 0;
    }
    .right {
        // padding: 1.5rem;
    }

    .title {
        color: $white;
        font-size: 20px;
        margin-left: 1rem;
    }
}
</style>
