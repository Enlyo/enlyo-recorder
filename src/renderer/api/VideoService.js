import compose from 'lodash/fp/compose';

import BaseApiService from './helpers/BaseApiService';
import ChannelCrudMixin from './helpers/ChannelCrudMixin';

export default class VideoService extends compose(ChannelCrudMixin)(
    BaseApiService
) {
    constructor(resource, name, ctx) {
        super(resource, name, ctx);
    }

    /**
     * Show api call
     *
     * @param id
     * @param group
     * @returns {ApiResponse}
     */
    async show(channelSlug, id, group) {
        try {
            const params = group ? { group } : {};

            const res = await this.axios.get(
                `/channels/${channelSlug}/${this.resource}${id}/`,
                {
                    params,
                }
            );

            return this.handleResponse(res, 'show');
        } catch (error) {
            return this.handleError(error, 'show');
        }
    }

    async getCategories(id, group) {
        try {
            const params = group ? { group } : {};

            const res = await this.axios.get(
                `/${this.resource}${id}/categories/`,
                { params }
            );

            return this.handleResponse(res);
        } catch (error) {
            return this.handleError(error);
        }
    }

    async getTags(id, group) {
        try {
            const params = group ? { group } : {};
            const res = await this.axios.get(`/${this.resource}${id}/tags/`, {
                params,
            });

            return this.handleResponse(res);
        } catch (error) {
            return this.handleError(error);
        }
    }
}
