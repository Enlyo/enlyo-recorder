import axios from 'axios';
import AuthService from './AuthService';
import VideoService from './VideoService';

import store from '../store';

axios.defaults.baseURL = process.env.API_BASE;
const $axios = axios.create({
    baseURL: process.env.API_BASE || 'http://127.0.0.1:8000/',
});
$axios.interceptors.request.use((config) => {
    const tokens = store.getters['auth/tokens'];

    config.headers.Authorization = tokens.access ? `JWT ${tokens.access}` : '';
    return config;
});

const ctx = { $axios };

const auth = new AuthService('auth/', 'User', ctx);
const video = new VideoService('videos/', 'Video', ctx);

export default {
    auth,
    video,
};
