<template>
    <div class="app-layout">
        <slot />
    </div>
</template>

<script>
export default {
    name: 'AppLayout',
};
</script>

<style lang="scss" scoped>
.app-layout {
    height: 100%;
    background-color: $background-dark-3;
    display: flex;
    flex-direction: column;
}
</style>
