import Vue from 'vue';

const state = {
    sharedFiles: {},
};

const getters = {
    sharedFiles: (state) => state.sharedFiles,
};

const actions = {
    /**
     * Add shared file
     */
    addSharedFile({ commit }, { id, data }) {
        commit('ADD_SHARED_FILE', { id, data });
    },

    /**
     * Remove shared file
     */
    removeSharedFile({ commit }, { id }) {
        commit('REMOVE_SHARED_FILE', { id });
    },

    /**
     * Remove shared files
     */
    removeSharedFiles({ commit }) {
        commit('REMOVE_SHARED_FILES');
    },
};

const mutations = {
    /**
     * Add shared file
     */
    ADD_SHARED_FILE(state, { id, data }) {
        Vue.set(state.sharedFiles, id, data);
    },

    /**
     * Remove shared file
     */
    REMOVE_SHARED_FILE(state, { id }) {
        Vue.delete(state.sharedFiles, id);
    },

    /**
     * Remove shared files
     */
    REMOVE_SHARED_FILES(state) {
        state.sharedFiles = {};
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
