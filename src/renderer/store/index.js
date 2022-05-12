import Vuex from 'vuex';
import Vue from 'vue';

import createPersistedState from 'vuex-persistedstate';

import auth from './modules/auth';
import room from './modules/room';
import settings from './modules/settings';

// Load Vuex
Vue.use(Vuex);
// Create store
export default new Vuex.Store({
    modules: {
        auth,
        room,
        settings,
    },
    plugins: [createPersistedState()],
});
