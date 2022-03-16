import Vue from 'vue';
import App from './App.vue';
import Buefy from 'buefy';
import router from './router';

Vue.config.productionTip = false;

Vue.use(Buefy);

new Vue({
    // TODO: WIP
    data() {
        return {
            appState: 'loading',
        };
    },
    mounted() {
        this.setStateListener();
    },
    methods: {
        setStateListener() {
            console.log('set state listener');
            window.ipc.on('state-updated', this.handleStateUpdated);
        },
        handleStateUpdated(state) {
            console.log(state);
            this.appState = state;
        },
    },
    router,
    render: (h) => h(App),
}).$mount('#app');
