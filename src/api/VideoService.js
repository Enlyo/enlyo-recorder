import compose from 'lodash/fp/compose';

import BaseApiService from '@/api/helpers/BaseApiService';
import ChannelCrudMixin from '@/api/helpers/ChannelCrudMixin';
import CopyMixin from '@/api/helpers/CopyMixin';
import GetTaxonomyMixin from './helpers/GetTaxonomyMixin';
import ShareableLinkMixin from '@/api/helpers/ShareableLinkMixin';
import ShareWithUsersMixin from '@/api/helpers/ShareWithUsersMixin';

export default class VideoService extends compose(
    ChannelCrudMixin,
    CopyMixin,
    GetTaxonomyMixin,
    ShareableLinkMixin,
    ShareWithUsersMixin
)(BaseApiService) {
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
