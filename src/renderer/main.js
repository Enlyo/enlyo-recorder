import Vue from 'vue';
import App from './App.vue';
import Buefy from 'buefy';
import router from './router';
import store from './store';

Vue.config.productionTip = false;

Vue.use(Buefy);

new Vue({
    data() {
        return {
            appVersion: '',
        };
    },
    created() {
        this.storeEnvVariables();
        this.getAppVersion();
    },
    methods: {
        async getAppVersion() {
            this.appVersion = await window.ipc.invoke('get-app-version');
        },
        async storeEnvVariables() {
            await window.ipc.invoke('store-env-variables', {
                appBase: process.env.VUE_APP_BASE,
                apiBase: process.env.VUE_APP_API_BASE,
            });
        },
    },
    store,
    router,
    render: (h) => h(App),
}).$mount('#app');
