import compose from 'lodash/fp/compose';

import BaseApiService from './helpers/BaseApiService';
import CrudMixin from './helpers/CrudMixin';

export default class RoomService extends compose(CrudMixin)(BaseApiService) {
    constructor(resource, name, ctx) {
        super(resource, name, ctx);
    }
}
