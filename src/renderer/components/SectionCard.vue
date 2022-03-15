<template>
    <div class="section-card" :class="{ 'is-paddingless': isPaddingless }">
        <slot name="default" />
    </div>
</template>

<script>
export default {
    name: 'SectionCard',

    props: {
        isPaddingless: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<style lang="scss" scoped>
.section-card {
    padding: 1rem;
    border-radius: 8px;
    background-color: $background-dark-4;
    box-shadow: $card-box-shadow;
}
</style>
