import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '../store';

import AudioAndVideo from '../views/AudioAndVideo.vue';
import AutoRecording from '../views/AutoRecording.vue';
import General from '../views/General.vue';
import Library from '../views/Library.vue';
import Login from '../views/Login.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'General',
        component: General,
    },

    {
        path: '/audio-and-video',
        name: 'AudiAndVideo',
        component: AudioAndVideo,
    },

    {
        path: '/library',
        name: 'Library',
        component: Library,
    },

    {
        path: '/auto-recording',
        name: 'Auto recording',
        component: AutoRecording,
    },

    {
        path: '/login',
        name: 'Login',
        component: Login,
    },
];

const publicRoutes = ['/login'];

const router = new VueRouter({
    routes,
});

router.beforeEach((to, from, next) => {
    const authRequired = !publicRoutes.includes(to.path);
    const loggedIn = store.getters['auth/isAuthenticated'];

    if (authRequired && !loggedIn) {
        return next('/login');
    }

    next();
});

export default router;
