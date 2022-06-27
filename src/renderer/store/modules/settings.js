import Vue from 'vue';

const state = {
    settings: {},
};

const getters = {
    settings: (state) => state.settings,
};

const actions = {
    /**
     * Get settings
     */
    async getSettings({ commit }) {
        const settings = await window.ipc.invoke('get-store-value', 'settings');
        console.log(settings);
        commit('SET_SETTINGS', settings);
    },

    /**
     * Set setting
     */
    async setSetting({ commit }, { key, value }) {
        await window.ipc.invoke('set-setting', {
            key,
            value,
        });
        commit('SET_SETTING', { key, value });
    },

    /**
     * Set default folder
     */
    async setDefaultFolder({ commit }) {
        const folder = await window.ipc.invoke('set-default-folder');
        commit('SET_SETTING', { key: 'folder', value: folder });
    },

    /**
     * Set default name
     */
    async setDefaultName({ commit }) {
        const DEFAULT_NAME = 'enlyo-recording';
        await window.ipc.invoke('set-setting', {
            key: 'name',
            value: DEFAULT_NAME,
        });
        commit('SET_SETTING', { key: 'name', value: DEFAULT_NAME });
    },

    /**
     * Set default screen
     */
    async setDefaultScreen({ commit }) {
        const availableScreens = await window.ipc.invoke(
            'get-available-screens'
        );
        const defaultScreen = availableScreens[0];

        await window.ipc.invoke('set-setting', {
            key: 'screen',
            value: defaultScreen,
        });
        commit('SET_SETTING', { key: 'screen', value: defaultScreen });

        return;
    },

    /**
     * Set default speaker
     */
    async setDefaultSpeaker({ commit }) {
        const availableSpeakers = await window.ipc.invoke(
            'get-available-speakers'
        );
        const defaultSpeaker = availableSpeakers[0];

        await window.ipc.invoke('set-setting', {
            key: 'speaker',
            value: defaultSpeaker,
        });
        commit('SET_SETTING', { key: 'speaker', value: defaultSpeaker });

        return;
    },

    /**
     * Set default microphone
     */
    async setDefaultMicrophone({ commit }) {
        const availableMicrophones = await window.ipc.invoke(
            'get-available-microphones'
        );
        const defaultMicrophone = availableMicrophones[0];

        await window.ipc.invoke('set-setting', {
            key: 'microphone',
            value: defaultMicrophone,
        });
        commit('SET_SETTING', { key: 'microphone', value: defaultMicrophone });

        return;
    },
};

const mutations = {
    /**
     * Set settings
     */
    SET_SETTINGS(state, settings) {
        state.settings = settings;
    },

    /**
     * Set setting
     */
    SET_SETTING(state, { key, value }) {
        Vue.set(state.settings, key, value);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
