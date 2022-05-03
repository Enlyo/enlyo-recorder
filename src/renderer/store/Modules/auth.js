import Vue from 'vue';

import api from '../../api/index';

const state = {
    tokens: {},
    user: {},
};

const getters = {
    isAuthenticated: (state) => Boolean(state.tokens.access),
    tokens: (state) => state.tokens,
    user: (state) => state.user,
};

const actions = {
    /**
     * Login
     */
    async login({ commit, dispatch }, { email, password }) {
        const response = await api.auth.login({ email, password });

        if (response.status) {
            window.ipc.invoke('set-credentials', { email, password });
            await commit('SET_TOKENS', response.data);

            dispatch('me');
        }

        return response;
    },

    /**
     * Me
     */
    async me({ commit }) {
        const response = await api.auth.me();

        if (response.status) {
            await commit('SET_USER', response.data);
        }

        return response;
    },

    /**
     * Logout
     */
    async logout({ commit }) {
        window.ipc.invoke('set-credentails', { email: '', password: '' });
        commit('LOGOUT');
    },

    /**
     * Refresh
     */
    async refresh({ commit, dispatch, getters }) {
        const refresh = getters.tokens.refresh;
        let response = await api.auth.refresh({ refresh });

        if (response.status) {
            await commit('SET_ACCESS_TOKEN', response.data.access);
            return response;
        }

        await commit('SET_USER', {});
        await commit('SET_ACCESS_TOKENS', {});

        // Log in again based on saved credentials
        const { email, password } = window.ipc.invoke('get-credentials');
        response = await api.auth.login({ email, password });

        if (response.status) {
            await commit('SET_TOKENS', response.data);

            dispatch('me');
        }

        return response;
    },
};

const mutations = {
    /**
     * Set tokens
     */
    SET_TOKENS(state, tokens) {
        state.tokens = tokens;
    },

    /**
     * Set access token
     */
    SET_ACCESS_TOKEN(state, accessToken) {
        Vue.set(state.tokens, 'access', accessToken);
    },

    /**
     * Set user
     */
    SET_USER(state, user) {
        state.user = user;
    },

    /**
     * Logout
     */
    LOGOUT(state) {
        state.user = {};
        state.tokens = {};
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
