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
            console.log(response.data);
        }

        return response;
    },

    /**
     * Logout
     */
    async logout({ commit }) {
        commit('LOGOUT');
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