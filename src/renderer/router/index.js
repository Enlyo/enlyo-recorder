import Vue from 'vue';
import VueRouter from 'vue-router';
import AutoRecording from '../views/AutoRecording.vue';
import General from '../views/General.vue';
import AudioAndVideo from '../views/AudioAndVideo.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'General',
        component: General,
    },
    {
        path: '/audio-and-video',
        name: 'AudioAndVideo',
        component: AudioAndVideo,
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
