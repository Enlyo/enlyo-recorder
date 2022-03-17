import Vue from 'vue';
import App from './App.vue';
import Buefy from 'buefy';
import router from './router';

Vue.config.productionTip = false;

Vue.use(Buefy);

new Vue({
    data() {
        return {
            appVersion: '',
        };
    },
    created() {
        this.getAppVersion();
    },
    methods: {
        async getAppVersion() {
            this.appVersion = await window.ipc.invoke('get-app-version');
        },
    },
    router,
    render: (h) => h(App),
}).$mount('#app');
