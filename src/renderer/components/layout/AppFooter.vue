<template>
    <footer class="app-footer">
        <slot />

        <span v-if="appVersion" class="app-version" v-text="`v${appVersion}`" />
    </footer>
</template>

<script>
export default {
    name: 'AppFooter',
    computed: {
        appVersion() {
            return this.$root.appVersion;
        },
    },
};
</script>

<style lang="scss" scoped>
.app-footer {
    display: flex;
    align-items: center;
    height: 80px;
    background-color: $background-dark-5;
    border-top: 1px solid $line-grey;
    padding: 0 1.5rem;
    position: relative;

    .app-version {
        position: absolute;
        bottom: 5px;
        right: 10px;
        font-size: $s-10px;
        color: $text-grey;
    }
}
</style>
