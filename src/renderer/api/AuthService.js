import BaseApiService from './helpers/BaseApiService';

import axios from 'axios';
import store from '@/store';

export default class AuthService extends BaseApiService {
    constructor(resource, name, ctx) {
        super(resource, name, ctx);

        // Override to not use baseapiservice axios interceptors
        this.axios = axios.create({
            baseURL: process.env.VUE_APP_API_BASE || 'http://127.0.0.1:8000/',
        });

        this.axios.interceptors.request.use((config) => {
            const tokens = store.getters['auth/tokens'];

            config.headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
            };

            if (tokens.access) {
                config.headers['Authorization'] = `JWT ${tokens.access}`;
            }
            return config;
        });
    }

    /**
     * Login
     */
    async login({ email, password }) {
        try {
            const res = await this.axios.post(`/${this.resource}jwt/create/`, {
                email,
                password,
            });

            return this.handleResponse(res);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Get logged in user
     */
    async me() {
        try {
            const res = await this.axios.get(`/${this.resource}users/me/`);

            return this.handleResponse(res);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Refresh
     */
    async refresh({ refresh }) {
        try {
            const res = await this.axios.post(`/${this.resource}jwt/refresh/`, {
                refresh,
            });

            return this.handleResponse(res);
        } catch (error) {
            return this.handleError(error);
        }
    }
}
