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
                    label: 'General',
                    to: `/`,
                },
                {
                    label: 'Audio & Video',
                    to: `/audio-and-video`,
                },
                {
                    label: 'Library',
                    to: `/library`,
                },
                {
                    label: 'Auto recording',
                    to: `/auto-recording`,
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
