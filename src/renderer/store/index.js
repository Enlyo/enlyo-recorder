import Vuex from 'vuex';
import Vue from 'vue';
import auth from './modules/auth';
import room from './modules/room';
import createPersistedState from 'vuex-persistedstate';

// Load Vuex
Vue.use(Vuex);
// Create store
export default new Vuex.Store({
    modules: {
        auth,
        room,
    },
    plugins: [createPersistedState()],
});
