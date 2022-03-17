<template>
    <div class="app-navigation">
        <NavBar :items="navItems" />
    </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue';

export default {
    name: 'AppNavigation',

    components: {
        NavBar,
    },

    data() {
        return {
            navItems: [
                {
                    label: 'Video',
                    to: `/`,
                },
            ],
        };
    },
};
</script>

<style lang="scss" scoped>
.app-navigation {
    background-color: $background-dark-2;
    height: 50px;
}
</style>
