<template>
    <div class="nav-bar">
        <div class="level is-mobile mb-0">
            <div class="level-left">
                <div v-if="$slots.start" class="level-item">
                    <slot name="start" />
                </div>
                <div
                    v-if="items.length && !$slots.items"
                    class="level-item nav-items"
                >
                    <NavItem
                        v-for="item in items"
                        :key="item.label"
                        :label="item.label"
                        :to="item.to"
                    />
                </div>
            </div>
            <div class="level-right">
                <div v-if="$slots.right" class="level-item">
                    <slot name="end" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import NavItem from '@/components/NavItem';

export default {
    name: 'NavBar',

    components: {
        NavItem,
    },

    props: {
        items: {
            type: Array,
            default: () => [],
        },
    },
};
</script>

<style lang="scss" scoped>
.nav-bar {
    background-color: $background-dark-2;
    display: flex;
    padding: 0.5rem 1.5rem;

    .nav-items {
        display: flex;
    }
}
</style>
