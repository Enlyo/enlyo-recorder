import axios from 'axios';

import store from '@/store';
import { getSuccessMessage, getErrorMessage, ApiResponse } from './ApiResponse';

/**
 * Base api service
 *
 * Used to provide standard CRUD functions for a specific resource
 */
export default class BaseApiService {
    constructor(resource, name, ctx = {}) {
        this.resource = resource;
        this.name = name;
        this.ctx = ctx;

        this.setUpAxios();
    }

    /**
     * Set up axios
     */
    setUpAxios() {
        this.axios = axios.create({
            baseURL: process.env.API_BASE || 'http://127.0.0.1:8000/',
        });

        this.axios.interceptors.request.use((config) => {
            const tokens = store.getters['auth/tokens'];

            config.headers.Authorization = tokens.access
                ? `JWT ${tokens.access}`
                : '';
            return config;
        });

        this.axios.interceptors.response.use(
            (response) => {
                return response;
            },
            async function (error) {
                const originalRequest = error.config;

                if (error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const response = await store.dispatch('auth/refresh');

                    if (response.status) {
                        axios.defaults.headers.common['Authorization'] =
                            response.data.access
                                ? `JWT ${response.data.access}`
                                : '';
                        return this.axios(originalRequest);
                    }
                    return Promise.reject(error);
                }

                return Promise.reject(error);
            }
        );
    }

    /**
     * Handle the api response
     *
     * @param response
     * @returns {ApiResponse}
     */
    handleResponse(response, type = null) {
        if (
            response.status === 200 ||
            response.status === 201 ||
            response.status === 204
        ) {
            return new ApiResponse(
                true,
                getSuccessMessage(type, this.name),
                response.data
            );
        }

        return new ApiResponse(
            false,
            getErrorMessage(type, this.name, response.message),
            response.data
        );
    }

    /**
     * Handle an error in the api response
     * @param error
     * @returns {ApiResponse}
     */
    handleError(error, type) {
        // TODO: Bring this back
        // this.sentry.captureException(error);
        return new ApiResponse(
            false,
            getErrorMessage(type, this.name, error.message),
            error
        );
    }
}
