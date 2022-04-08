import api from '../../../api/index';

const state = {
    user: null,
};

const getters = {
    isAuthenticated: (state) => !!state.user,
};

const actions = {
    /**
     * Login
     */
    async login({ commit }, { username, password }) {
        const response = api.auth.login({ username, password });

        if (response.status) {
            console.log(response);
            await commit('SET_USER', response.data);
        }

        return response;
    },

    /**
     * Logout
     */
    async logout({ commit }) {
        let user = null;
        commit('LOGOUT', user);
    },
};

const mutations = {
    /**
     * Login
     */
    LOGIN(state, user) {
        state.user = user;
    },

    /**
     * Logout
     */
    LOGOUT(state, user) {
        state.user = null;
    },
};

export default {
    state,
    getters,
    actions,
    mutations,
};
