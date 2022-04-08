import { getSuccessMessage, getErrorMessage, ApiResponse } from './ApiResponse';

/**
 * Base api service
 *
 * Used to provide standard CRUD functions for a specific resource
 */
export default class BaseApiService {
    constructor(resource, name, ctx) {
        this.resource = resource;
        this.name = name;
        this.axios = ctx.$axios;
        this.sentry = ctx.$sentry;
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
        this.sentry.captureException(error);
        return new ApiResponse(
            false,
            getErrorMessage(type, this.name, error.message),
            error.response.data
        );
    }
}
