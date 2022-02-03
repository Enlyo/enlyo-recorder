<template>
    <footer class="app-footer">
        <slot />
    </footer>
</template>

<script>
export default {
    name: 'AppFooter',
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
}
</style>
