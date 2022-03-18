<template>
    <router-link class="nav-item" :to="to">
        {{ label }}
    </router-link>
</template>

<script>
export default {
    name: 'NavItem',

    props: {
        label: {
            type: String,
            default: '',
        },
        to: {
            type: String,
            default: '/',
        },
    },
};
</script>

<style lang="scss" scoped>
.nav-item {
    padding: 7px 15px;
    margin: 0 0.25rem;
    border-radius: 7px;
    transition: all 0.3s;
    font-size: $s-14px;
    color: #fff;
    transition: all 0.2s;

    &.router-link-exact-active {
        font-weight: 500;
        background-color: $highlight-purple;
    }

    &:hover {
        background-color: $highlight-purple;
    }

    &:first-of-type {
        margin-left: 0;
    }

    &:last-of-type {
        margin-right: 0;
    }
}
</style>
