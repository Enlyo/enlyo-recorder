import BaseApiService from './helpers/BaseApiService';

export default class AuthService extends BaseApiService {
    constructor(resource, name, ctx) {
        super(resource, name, ctx);
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
