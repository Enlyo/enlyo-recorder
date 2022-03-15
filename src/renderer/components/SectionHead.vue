<template>
    <div class="section-head level is-mobile">
        <div class="level-left">
            <template v-if="$slots.left">
                <slot name="left" />
            </template>
            <h2 v-else class="section-title">
                {{ title }}
            </h2>
        </div>

        <div class="level-right">
            <slot name="right" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'SectionHead',

    props: {
        title: {
            type: String,
            default: '',
        },
    },
};
</script>

<style lang="scss" scoped>
.section-head {
    padding: 1rem 0;
    border-bottom: 1px solid $line-grey;
    margin-bottom: 1rem;

    .section-title {
        text-transform: uppercase;
        font-weight: 700;
        line-height: 1;
    }
}
</style>
