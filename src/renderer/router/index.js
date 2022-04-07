import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import General from '../views/General.vue';
import AutoRecording from '../views/AutoRecording.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home,
    },
    {
        path: '/general',
        name: 'General',
        component: General,
    },
    {
        path: '/auto-recording',
        name: 'Auto recording',
        component: AutoRecording,
    },
];

const router = new VueRouter({
    routes,
});

export default router;
