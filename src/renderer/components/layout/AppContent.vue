<template>
    <div class="app-content">
        <slot />
    </div>
</template>

<script>
export default {
    name: 'AppContent',
};
</script>

<style lang="scss" scoped>
.app-content {
    padding: 2rem;
    flex: 1;
}
</style>
