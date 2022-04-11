export default (superclass) =>
    class extends superclass {
        /**
         * Index api call
         *
         * @returns {ApiResponse}
         */
        async index(channelSlug) {
            try {
                const res = await this.axios.get(
                    `/channels/${channelSlug}/${this.resource}`
                );

                return this.handleResponse(res, 'index');
            } catch (error) {
                return this.handleError(error, 'index');
            }
        }

        /**
         * Show api call
         *
         * @param id
         * @returns {ApiResponse}
         */
        async show(channelSlug, id) {
            try {
                const res = await this.axios.get(
                    `/channels/${channelSlug}/${this.resource}${id}/`
                );

                return this.handleResponse(res, 'show');
            } catch (error) {
                return this.handleError(error, 'show');
            }
        }

        /**
         * Create api call
         *
         * @param payload
         * @returns {ApiResponse}
         */
        async create(channelSlug, payload) {
            try {
                const res = await this.axios.post(
                    `/channels/${channelSlug}/${this.resource}`,
                    payload
                );

                return this.handleResponse(res, 'create');
            } catch (error) {
                return this.handleError(error, 'create');
            }
        }

        /**
         * Update api call
         *
         * @param id
         * @param payload
         * @returns {ApiResponse}
         */
        async update(channelSlug, id, payload) {
            try {
                const res = await this.axios.patch(
                    `/channels/${channelSlug}/${this.resource}${id}/`,
                    payload
                );

                return this.handleResponse(res, 'update');
            } catch (error) {
                return this.handleError(error, 'update');
            }
        }

        /**
         * Delete api call
         *
         * @param id
         * @returns {ApiResponse}
         */
        async delete(channelSlug, id) {
            try {
                const res = await this.axios.delete(
                    `/channels/${channelSlug}/${this.resource}${id}/`
                );

                return this.handleResponse(res, 'delete');
            } catch (error) {
                return this.handleError(error, 'delete');
            }
        }
    };
